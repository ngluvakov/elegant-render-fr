/**
 * calculate.ts — Pure price calculation engine for the configurator.
 *
 * Exports calculateQuote() which resolves QuoteItem[] into line-item
 * breakdowns with volume rules, percent surcharges, duration discounts,
 * and cross-service "model-first" discounts (a second pass that applies
 * the best consumes-rule on each item based on sibling items' creates).
 *
 * Used by: server/actions/order (server-side verification), quote-summary,
 *          quote-item, quote-context, checkout-wizard, portal pages
 */

import {
  type ConfiguratorAddOn,
  type ConfiguratorProduct,
  type ConsumeRule,
  type DurationConfig,
  type ModelAsset,
  getConfiguratorProduct,
} from "./configurator";

// ─── Types ───────────────────────────────────────────────

export type QuoteItem = {
  instanceId: string;
  productId: string;
  categoryId: string;
  addOnQuantities: Record<string, number>;
  durationSeconds?: number;
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
  basePriceEur: number;
  durationSeconds?: number;
  durationDiscount?: number;
  addOns: AddOnBreakdown[];
  totalEur: number;
  originalBasePriceEur: number;
  originalTotalEur: number;
  discountPct: number;
  discountReason: string | null;
};

export type QuoteCalculation = {
  items: LineItemBreakdown[];
  total: number;
  originalTotal: number;
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
    basePriceEur: basePriceRounded,
    durationSeconds: product.durationConfig ? seconds : undefined,
    durationDiscount,
    addOns: addOnBreakdowns,
    totalEur,
    originalBasePriceEur: basePriceRounded,
    originalTotalEur: totalEur,
    discountPct: 0,
    discountReason: null,
  };
}

// ─── Cross-service discount resolver ─────────────────────

type AssetSource = { instanceId: string; productId: string; basePrice: number };

// Builds asset → sorted list of creator items (ascending basePrice, then
// insertion order). Cheapest creator is the canonical source of that asset.
function buildAssetInventory(
  items: QuoteItem[],
): Map<ModelAsset, AssetSource[]> {
  const inv = new Map<ModelAsset, AssetSource[]>();
  items.forEach((item, idx) => {
    const result = getConfiguratorProduct(item.productId);
    if (!result?.product.creates) return;
    for (const asset of result.product.creates) {
      const list = inv.get(asset) ?? [];
      list.push({
        instanceId: item.instanceId,
        productId: item.productId,
        basePrice: result.product.basePriceEur,
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
): { pct: number; reason: string } | null {
  const product = getConfiguratorProduct(target.productId)?.product;
  if (!product?.consumes || product.consumes.length === 0) return null;

  const inventory = buildAssetInventory(siblings);

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
    if (!best || rule.discountPct > best.pct) {
      best = { pct: rule.discountPct, reason: rule.reason };
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
): QuoteCalculation {
  const breakdowns: LineItemBreakdown[] = [];

  // Pass 1: per-item breakdown with no cross-service awareness
  for (const item of items) {
    const result = getConfiguratorProduct(item.productId);
    if (!result) continue;
    breakdowns.push(
      calculateItem(item, result.product, result.category.label),
    );
  }

  // Pass 2: apply cross-service "model-first" discounts. Asset inventory
  // includes both the current items and any external references.
  const siblings = [...items, ...externalSources];
  for (const breakdown of breakdowns) {
    const target = items.find((i) => i.instanceId === breakdown.instanceId);
    if (!target) continue;
    const discount = resolveDiscount(target, siblings);
    if (!discount) continue;
    const product = getConfiguratorProduct(breakdown.productId)?.product;
    if (!product) continue;
    applyDiscount(breakdown, product, discount.pct, discount.reason);
  }

  return {
    items: breakdowns,
    total: breakdowns.reduce((sum, b) => sum + b.totalEur, 0),
    originalTotal: breakdowns.reduce((sum, b) => sum + b.originalTotalEur, 0),
  };
}

// ─── Format helpers ──────────────────────────────────────

export function formatEur(amount: number): string {
  return `€${amount}`;
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
