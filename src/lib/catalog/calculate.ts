/**
 * calculate.ts — Pure price calculation engine for the configurator.
 *
 * Exports calculateQuote() which resolves QuoteItem[] into line-item
 * breakdowns with volume rules, percent surcharges, duration discounts,
 * and cross-service "model-first" discounts (a second pass that applies
 * the best consumes-rule on each item based on sibling items' creates).
 *
 * priceItems() is the higher-level orchestrator that handles int-static
 * and int-360 (configured per-floor) by routing them around the addon
 * model and through calcInteriorTotal / calcTour360Total. It is the
 * single source of truth shared by /pricing's QuoteContext and the server's
 * repriceOrder.
 *
 * Used by: server/actions/order (server-side verification), quote-summary,
 *          quote-item, quote-context, checkout-wizard, portal pages
 */

import {
  type ConfiguratorAddOn,
  type ConfiguratorCategory,
  type ConfiguratorProduct,
  type ConsumeRule,
  type DurationConfig,
  type ModelAsset,
  getConfiguratorProduct,
  getEffectiveProduct,
} from "./configurator";
import {
  calcInteriorTotal,
  type InteriorFloor,
} from "./interior-config";
import {
  calcTour360Total,
  type Tour360Config,
} from "./tour360-config";
import {
  AI_CREDIT_PRODUCT_ID,
  calculateAiCreditPurchase,
  centsToEur,
  formatCents,
  isAiCreditProduct,
} from "@/lib/ai-studio/catalog";
import {
  getPricingSettings,
  type ResolvedPricingCatalog,
} from "@/lib/pricing/catalog";

// ─── Types ───────────────────────────────────────────────

export type QuoteItem = {
  instanceId: string;
  productId: string;
  categoryId: string;
  addOnQuantities: Record<string, number>;
  aiCreditQuantity?: number;
  durationSeconds?: number;
  // Source mode for products with sourceModeRules (currently only the
  // consolidated `anim` product). Resolved by getEffectiveProduct so
  // pricing / creates / consumes match the picked mode.
  sourceMode?: string;
  // Rule 4 (active project tier): items from a referenced order whose
  // status is still "in production" get a +5pp boost on the resolved
  // discount (capped at 55 %). Only set on externalSources items.
  fromActiveExternalOrder?: boolean;
  // Per-floor configuration for int-static. When set, priceItems routes
  // pricing through calcInteriorTotal instead of the catalog addon model
  // (rooms / cameras / floors thresholded jointly per floor — see
  // interior-config.ts). Mirrors the OrderItem.configJson.floors shape
  // so QuoteItem ↔ OrderItem mapping is near-identity.
  interiorConfig?: InteriorFloor[];
  // Per-floor configuration for int-360 (rooms with hotspots + static
  // cameras + tour-assembly toggles). Same role as interiorConfig but
  // for the 360-tour product, routed through calcTour360Total.
  tour360Config?: Tour360Config;
};

export type AddOnBreakdown = {
  addOnId: string;
  label: string;
  quantity: number;
  includedQty: number;
  billableQty: number;
  unitPriceEur: number;
  totalEur: number;
  isVolumeRate: boolean;
};

export type LineItemBreakdown = {
  instanceId: string;
  productId: string;
  productLabel: string;
  categoryLabel: string;
  kind: "service" | "ai_credits";
  basePriceEur: number;
  basePriceCents: number;
  durationSeconds?: number;
  durationDiscount?: number;
  addOns: AddOnBreakdown[];
  totalEur: number;
  totalCents: number;
  originalBasePriceEur: number;
  originalBasePriceCents: number;
  originalTotalEur: number;
  originalTotalCents: number;
  aiCreditQuantity?: number;
  aiCreditUnits?: number;
  discountPct: number;
  discountReason: string | null;
};

export type QuoteCalculation = {
  items: LineItemBreakdown[];
  total: number;
  totalCents: number;
  originalTotal: number;
  originalTotalCents: number;
};

// ─── Duration discount helper ────────────────────────────

function getDurationDiscount(
  config: DurationConfig,
  seconds: number,
): number {
  for (const tier of config.discountTiers) {
    if (seconds >= tier.minSec && seconds <= tier.maxSec) {
      return tier.discountPct / 100;
    }
  }
  return 0;
}

// ─── Add-on calculation ──────────────────────────────────

function calculateAddOn(
  def: ConfiguratorAddOn,
  quantity: number,
): AddOnBreakdown {
  const billableQty = Math.max(0, quantity - def.includedQty);

  if (billableQty === 0 || def.priceType === "percent") {
    // Percent add-ons are handled at the item level after base total
    return {
      addOnId: def.id,
      label: def.label,
      quantity,
      includedQty: def.includedQty,
      billableQty,
      unitPriceEur: def.priceEur,
      totalEur: 0,
      isVolumeRate: false,
    };
  }

  // Fixed add-ons with potential volume rules
  let totalEur = 0;
  let isVolumeRate = false;
  let effectiveUnitPrice = def.priceEur;

  if (def.volumeRules.length > 0) {
    // Calculate per-unit with volume tiers
    for (let q = 1; q <= billableQty; q++) {
      const totalQtyIncludingIncluded = def.includedQty + q;
      let unitPrice = def.priceEur;
      for (const rule of def.volumeRules) {
        if (totalQtyIncludingIncluded > rule.afterQty) {
          unitPrice = rule.priceEur;
          isVolumeRate = true;
        }
      }
      effectiveUnitPrice = unitPrice;
      totalEur += unitPrice;
    }
  } else {
    totalEur = def.priceEur * billableQty;
  }

  return {
    addOnId: def.id,
    label: def.label,
    quantity,
    includedQty: def.includedQty,
    billableQty,
    unitPriceEur: effectiveUnitPrice,
    totalEur: Math.round(totalEur),
    isVolumeRate,
  };
}

// ─── Percent add-on pass ─────────────────────────────────

// Applies percent add-ons on top of (baseTotal + fixedAddOnTotal). Mutates
// the matching entries in `addOnBreakdowns` and returns the sum of percent
// contributions. Used in both the initial calculation and after cross-service
// discount has reduced baseTotal, so percent-based surcharges scale correctly.
function applyPercentAddOns(
  addOnBreakdowns: AddOnBreakdown[],
  product: ConfiguratorProduct,
  baseTotal: number,
  fixedAddOnTotal: number,
): number {
  const subtotalBeforePercent = baseTotal + fixedAddOnTotal;
  let percentTotal = 0;

  for (const breakdown of addOnBreakdowns) {
    const def = product.addOns.find((ao) => ao.id === breakdown.addOnId);
    if (def?.priceType === "percent" && breakdown.billableQty > 0) {
      const pctAmount =
        subtotalBeforePercent * (def.priceEur / 100) * breakdown.billableQty;
      breakdown.totalEur = Math.round(pctAmount);
      percentTotal += breakdown.totalEur;
    }
  }

  return percentTotal;
}

// ─── Single item calculation ─────────────────────────────

function calculateItem(
  item: QuoteItem,
  product: ConfiguratorProduct,
  categoryLabel: string,
): LineItemBreakdown {
  const seconds = item.durationSeconds ?? 1;
  let baseTotal: number;
  let durationDiscount: number | undefined;

  // Base price — duration-based or fixed
  if (product.durationConfig) {
    const discount = getDurationDiscount(product.durationConfig, seconds);
    durationDiscount = discount;
    baseTotal = product.durationConfig.perSecondEur * seconds * (1 - discount);
  } else {
    baseTotal = product.basePriceEur;
  }

  // Calculate fixed add-ons
  const addOnBreakdowns: AddOnBreakdown[] = [];
  let fixedAddOnTotal = 0;

  for (const def of product.addOns) {
    const qty = item.addOnQuantities[def.id] ?? (def.includedQty > 0 ? def.includedQty : 0);
    const breakdown = calculateAddOn(def, qty);
    addOnBreakdowns.push(breakdown);
    if (def.priceType !== "percent") {
      fixedAddOnTotal += breakdown.totalEur;
    }
  }

  // Calculate percent add-ons (applied on baseTotal + fixedAddOnTotal)
  const percentTotal = applyPercentAddOns(
    addOnBreakdowns,
    product,
    baseTotal,
    fixedAddOnTotal,
  );

  const basePriceRounded = Math.round(baseTotal);
  const totalEur = Math.round(baseTotal + fixedAddOnTotal + percentTotal);

  return {
    instanceId: item.instanceId,
    productId: item.productId,
    productLabel: product.label,
    categoryLabel,
    kind: "service",
    basePriceEur: basePriceRounded,
    basePriceCents: basePriceRounded * 100,
    durationSeconds: product.durationConfig ? seconds : undefined,
    durationDiscount,
    addOns: addOnBreakdowns,
    totalEur,
    totalCents: totalEur * 100,
    originalBasePriceEur: basePriceRounded,
    originalBasePriceCents: basePriceRounded * 100,
    originalTotalEur: totalEur,
    originalTotalCents: totalEur * 100,
    discountPct: 0,
    discountReason: null,
  };
}

function calculateAiCreditItem(
  item: QuoteItem,
  pricingCatalog?: ResolvedPricingCatalog,
): LineItemBreakdown {
  const pricingSettings = getPricingSettings(pricingCatalog);
  const purchase = calculateAiCreditPurchase(
    item.aiCreditQuantity ?? 1,
    pricingSettings.aiCreditTiers,
    pricingSettings.aiCreditUnitsPerCredit,
  );
  const totalEur = centsToEur(purchase.totalCents);
  return {
    instanceId: item.instanceId,
    productId: AI_CREDIT_PRODUCT_ID,
    productLabel: "AI Studio krediti",
    categoryLabel: "AI Studio",
    kind: "ai_credits",
    basePriceEur: totalEur,
    basePriceCents: purchase.totalCents,
    addOns: [],
    totalEur,
    totalCents: purchase.totalCents,
    originalBasePriceEur: totalEur,
    originalBasePriceCents: purchase.totalCents,
    originalTotalEur: totalEur,
    originalTotalCents: purchase.totalCents,
    aiCreditQuantity: purchase.credits,
    aiCreditUnits: purchase.units,
    discountPct: 0,
    discountReason: null,
  };
}

// ─── Cross-service discount resolver ─────────────────────

type AssetSource = {
  instanceId: string;
  productId: string;
  basePrice: number;
  fromActive: boolean;
};

// Builds asset → sorted list of creator items (ascending basePrice, then
// insertion order). Cheapest creator is the canonical source of that asset.
// Uses the source-mode-resolved product so e.g. anim-existing (which
// reuses a model) doesn't show up as a creator of complete-model.
function buildAssetInventory(
  items: QuoteItem[],
  pricingCatalog?: ResolvedPricingCatalog,
): Map<ModelAsset, AssetSource[]> {
  const inv = new Map<ModelAsset, AssetSource[]>();
  items.forEach((item, idx) => {
    const result = getEffectiveProduct(
      item.productId,
      item.sourceMode,
      pricingCatalog?.categories,
    );
    if (!result?.product.creates) return;
    for (const asset of result.product.creates) {
      const list = inv.get(asset) ?? [];
      list.push({
        instanceId: item.instanceId,
        productId: item.productId,
        basePrice: result.product.basePriceEur,
        fromActive: item.fromActiveExternalOrder === true,
      });
      inv.set(asset, list);
    }
    // Preserve insertion order via the outer loop; sort is stable by basePrice
    // with stable-sort falling back to insertion order when prices tie.
    void idx;
  });
  for (const list of inv.values()) {
    list.sort((a, b) => a.basePrice - b.basePrice);
  }
  return inv;
}

function conditionSatisfied(rule: ConsumeRule, target: QuoteItem): boolean {
  if (!rule.condition) return true;
  if (rule.condition.type === "addOnAbsent") {
    const qty = target.addOnQuantities[rule.condition.addOnId] ?? 0;
    return qty === 0;
  }
  return true;
}

/**
 * Resolves the best cross-service discount for `target`, given all sibling
 * items in the same order (which may include `target` itself).
 *
 * Rules (from pricing spec):
 *  - A rule qualifies if some item OTHER than target creates the required
 *    asset. If target itself creates the asset, it still qualifies as long
 *    as target is NOT the canonical source (cheapest creator).
 *  - Among qualifying rules, the highest discountPct wins (discounts don't
 *    stack — Rule 5).
 *  - Returns null when no rule qualifies.
 */
export function resolveDiscount(
  target: QuoteItem,
  siblings: QuoteItem[],
  pricingCatalog?: ResolvedPricingCatalog,
): { pct: number; reason: string } | null {
  if (isAiCreditProduct(target.productId)) return null;
  const product = getEffectiveProduct(
    target.productId,
    target.sourceMode,
    pricingCatalog?.categories,
  )?.product;
  if (!product?.consumes || product.consumes.length === 0) return null;

  const inventory = buildAssetInventory(siblings, pricingCatalog);

  let best: { pct: number; reason: string } | null = null;
  for (const rule of product.consumes) {
    if (!conditionSatisfied(rule, target)) continue;
    const allSources = inventory.get(rule.requires);
    if (!allSources || allSources.length === 0) continue;
    // Apply sourceProducts whitelist (if set) so e.g. ext-static doesn't
    // match exterior-shell from another ext-static.
    const sources = rule.sourceProducts
      ? allSources.filter((s) => rule.sourceProducts!.includes(s.productId))
      : allSources;
    if (sources.length === 0) continue;
    const canonical = sources[0];
    // Target is canonical creator → no one else supplied the asset. Only
    // qualify if there's at least one other creator of the same asset.
    if (canonical.instanceId === target.instanceId && sources.length === 1) continue;
    // Rule 4: if any qualifying source is from an active external order,
    // bump the discount by +5pp (capped at 55 %, never lowered).
    const hasActive = sources.some((s) => s.fromActive);
    const pct = hasActive
      ? Math.max(rule.discountPct, Math.min(55, rule.discountPct + 5))
      : rule.discountPct;
    const reason = hasActive
      ? `${rule.reason} (aktivan projekat — dodatni popust)`
      : rule.reason;
    if (!best || pct > best.pct) {
      best = { pct, reason };
    }
  }
  return best;
}

// ─── Apply a discount to an existing breakdown ───────────

function applyDiscount(
  breakdown: LineItemBreakdown,
  product: ConfiguratorProduct,
  pct: number,
  reason: string,
): void {
  const discountedBase = Math.round(breakdown.originalBasePriceEur * (1 - pct / 100));
  const fixedAddOnTotal = breakdown.addOns
    .filter((ao) => {
      const def = product.addOns.find((a) => a.id === ao.addOnId);
      return def && def.priceType !== "percent";
    })
    .reduce((sum, ao) => sum + ao.totalEur, 0);
  const percentTotal = applyPercentAddOns(
    breakdown.addOns,
    product,
    discountedBase,
    fixedAddOnTotal,
  );
  breakdown.basePriceEur = discountedBase;
  breakdown.totalEur = Math.round(discountedBase + fixedAddOnTotal + percentTotal);
  breakdown.basePriceCents = breakdown.basePriceEur * 100;
  breakdown.totalCents = breakdown.totalEur * 100;
  breakdown.discountPct = pct;
  breakdown.discountReason = reason;
}

// ─── Full quote calculation ──────────────────────────────

/**
 * calculateQuote — main entry point.
 *
 * `items` are the line items of the quote/order being priced and DO appear
 * in the output breakdowns.
 *
 * `externalSources` are items from a referenced prior order whose model
 * assets should feed discount resolution. They contribute to the asset
 * inventory but do NOT appear in the breakdowns — their cost was already
 * billed elsewhere.
 */
export function calculateQuote(
  items: QuoteItem[],
  externalSources: QuoteItem[] = [],
  pricingCatalog?: ResolvedPricingCatalog,
): QuoteCalculation {
  const breakdowns: LineItemBreakdown[] = [];

  // Pass 1: per-item breakdown with no cross-service awareness
  for (const item of items) {
    if (isAiCreditProduct(item.productId)) {
      breakdowns.push(calculateAiCreditItem(item, pricingCatalog));
      continue;
    }
    const result = getEffectiveProduct(
      item.productId,
      item.sourceMode,
      pricingCatalog?.categories,
    );
    if (!result) continue;
    breakdowns.push(
      calculateItem(item, result.product, result.category.label),
    );
  }

  // Pass 2: apply cross-service "model-first" discounts. Asset inventory
  // includes both the current items and any external references.
  const siblings = [...items, ...externalSources];
  for (const breakdown of breakdowns) {
    if (breakdown.kind === "ai_credits") continue;
    const target = items.find((i) => i.instanceId === breakdown.instanceId);
    if (!target) continue;
    const discount = resolveDiscount(target, siblings, pricingCatalog);
    if (!discount) continue;
    const product = getEffectiveProduct(
      breakdown.productId,
      target.sourceMode,
      pricingCatalog?.categories,
    )?.product;
    if (!product) continue;
    applyDiscount(breakdown, product, discount.pct, discount.reason);
  }

  return {
    items: breakdowns,
    total: breakdowns.reduce((sum, b) => sum + b.totalEur, 0),
    totalCents: breakdowns.reduce((sum, b) => sum + b.totalCents, 0),
    originalTotal: breakdowns.reduce((sum, b) => sum + b.originalTotalEur, 0),
    originalTotalCents: breakdowns.reduce(
      (sum, b) => sum + b.originalTotalCents,
      0,
    ),
  };
}

// ─── Special-case per-item pricing (int-static, int-360) ─

export type SpecialItemPricing = {
  preDiscount: number;
  totalEur: number;
  discount: { pct: number; reason: string } | null;
};

/**
 * Pure pricing for an int-static item: derive cost from its per-floor
 * config via calcInteriorTotal, then apply cross-service discount on top.
 * Shared between /pricing's priceItems orchestrator and the server's
 * repriceOrder so both paths stay in lock-step.
 */
export function priceInteriorItem(
  floors: InteriorFloor[],
  target: QuoteItem,
  siblings: QuoteItem[],
  pricingCatalog?: ResolvedPricingCatalog,
): SpecialItemPricing {
  const preDiscount = calcInteriorTotal(
    floors,
    getPricingSettings(pricingCatalog).specialPricing.interior,
  ).totalEur;
  const discount = resolveDiscount(target, siblings, pricingCatalog);
  const totalEur = discount
    ? Math.round(preDiscount * (1 - discount.pct / 100))
    : preDiscount;
  return { preDiscount, totalEur, discount };
}

/**
 * Pure pricing for an int-360 item: derive cost from its per-floor +
 * tour-assembly config via calcTour360Total, then apply cross-service
 * discount on top.
 */
export function priceTour360Item(
  config: Tour360Config,
  target: QuoteItem,
  siblings: QuoteItem[],
  pricingCatalog?: ResolvedPricingCatalog,
): SpecialItemPricing {
  const preDiscount = calcTour360Total(
    config.floors,
    config.tourAssembly,
    getPricingSettings(pricingCatalog).specialPricing.tour360,
  ).totalEur;
  const discount = resolveDiscount(target, siblings, pricingCatalog);
  const totalEur = discount
    ? Math.round(preDiscount * (1 - discount.pct / 100))
    : preDiscount;
  return { preDiscount, totalEur, discount };
}

function buildSpecialBreakdown(
  item: QuoteItem,
  lookup: { product: ConfiguratorProduct; category: ConfiguratorCategory },
  pricing: SpecialItemPricing,
): LineItemBreakdown {
  const { preDiscount, totalEur, discount } = pricing;
  const discountedBase = discount
    ? Math.round(preDiscount * (1 - discount.pct / 100))
    : preDiscount;
  return {
    instanceId: item.instanceId,
    productId: item.productId,
    productLabel: lookup.product.label,
    categoryLabel: lookup.category.label,
    kind: "service",
    basePriceEur: discountedBase,
    basePriceCents: discountedBase * 100,
    // Special items express their breakdown via configJson, not catalog
    // add-ons — the editor (interior-quote-editor / portal config section)
    // owns the row-level breakdown UI directly.
    addOns: [],
    totalEur,
    totalCents: totalEur * 100,
    originalBasePriceEur: preDiscount,
    originalBasePriceCents: preDiscount * 100,
    originalTotalEur: preDiscount,
    originalTotalCents: preDiscount * 100,
    discountPct: discount?.pct ?? 0,
    discountReason: discount?.reason ?? null,
  };
}

function isConfiguredInterior(item: QuoteItem): boolean {
  return (
    item.productId === "int-static" &&
    Array.isArray(item.interiorConfig) &&
    item.interiorConfig.length > 0
  );
}

function isConfiguredTour360(item: QuoteItem): boolean {
  return (
    item.productId === "int-360" &&
    !!item.tour360Config &&
    Array.isArray(item.tour360Config.floors) &&
    item.tour360Config.floors.length > 0
  );
}

/**
 * priceItems — orchestrator that mirrors the server's repriceOrder split.
 * Standard products go through calculateQuote; int-static and int-360
 * items with per-floor config get priced via priceInteriorItem /
 * priceTour360Item. Specials still feed the discount asset inventory so
 * cross-service discounts on standard siblings see them.
 *
 * Use this as the single entry point on the client (QuoteContext) and
 * for any future server caller that needs total + breakdowns. Keeps
 * /pricing and the portal in lock-step.
 */
export function priceItems(
  items: QuoteItem[],
  externalSources: QuoteItem[] = [],
  pricingCatalog?: ResolvedPricingCatalog,
): QuoteCalculation {
  const interior = items.filter(isConfiguredInterior);
  const tour360 = items.filter(isConfiguredTour360);
  const specialIds = new Set(
    [...interior, ...tour360].map((i) => i.instanceId),
  );
  const standard = items.filter((i) => !specialIds.has(i.instanceId));

  // Standard pricing — specials are passed as externalSources so they
  // contribute to the discount-resolver's asset inventory but do NOT
  // appear in the standard breakdowns.
  const standardCalc = calculateQuote(
    standard,
    [...externalSources, ...interior, ...tour360],
    pricingCatalog,
  );
  const breakdownsById = new Map<string, LineItemBreakdown>(
    standardCalc.items.map((b) => [b.instanceId, b]),
  );

  const allSiblings = [...items, ...externalSources];

  for (const item of interior) {
    const lookup = getConfiguratorProduct(
      item.productId,
      pricingCatalog?.categories,
    );
    if (!lookup) continue;
    const pricing = priceInteriorItem(
      item.interiorConfig!,
      item,
      allSiblings,
      pricingCatalog,
    );
    breakdownsById.set(
      item.instanceId,
      buildSpecialBreakdown(item, lookup, pricing),
    );
  }

  for (const item of tour360) {
    const lookup = getConfiguratorProduct(
      item.productId,
      pricingCatalog?.categories,
    );
    if (!lookup) continue;
    const pricing = priceTour360Item(
      item.tour360Config!,
      item,
      allSiblings,
      pricingCatalog,
    );
    breakdownsById.set(
      item.instanceId,
      buildSpecialBreakdown(item, lookup, pricing),
    );
  }

  // Preserve the input order of `items` in the output breakdowns.
  const orderedBreakdowns = items
    .map((i) => breakdownsById.get(i.instanceId))
    .filter((b): b is LineItemBreakdown => !!b);

  return {
    items: orderedBreakdowns,
    total: orderedBreakdowns.reduce((s, b) => s + b.totalEur, 0),
    totalCents: orderedBreakdowns.reduce((s, b) => s + b.totalCents, 0),
    originalTotal: orderedBreakdowns.reduce(
      (s, b) => s + b.originalTotalEur,
      0,
    ),
    originalTotalCents: orderedBreakdowns.reduce(
      (s, b) => s + b.originalTotalCents,
      0,
    ),
  };
}

// ─── Format helpers ──────────────────────────────────────

export function formatEur(amount: number): string {
  return formatCents(Math.round(amount * 100));
}

export type DiscountedPriceParts = {
  primary: string;
  struck: string | null;
  badge: string | null;
};

export function formatDiscountedPrice(
  total: number,
  originalTotal: number,
  pct: number,
): DiscountedPriceParts {
  if (pct <= 0 || total >= originalTotal) {
    return { primary: formatEur(total), struck: null, badge: null };
  }
  return {
    primary: formatEur(total),
    struck: formatEur(originalTotal),
    badge: `−${pct}%`,
  };
}
