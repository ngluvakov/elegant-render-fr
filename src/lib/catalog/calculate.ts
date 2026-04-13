// Pure price calculation engine for the configurator
// Handles: threshold pricing, volume rules, percent surcharges, duration discounts

import {
  type ConfiguratorAddOn,
  type ConfiguratorProduct,
  type DurationConfig,
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
};

export type QuoteCalculation = {
  items: LineItemBreakdown[];
  total: number;
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
  const subtotalBeforePercent = baseTotal + fixedAddOnTotal;
  let percentTotal = 0;

  for (const breakdown of addOnBreakdowns) {
    const def = product.addOns.find((ao) => ao.id === breakdown.addOnId);
    if (def?.priceType === "percent" && breakdown.billableQty > 0) {
      const pctAmount = subtotalBeforePercent * (def.priceEur / 100) * breakdown.billableQty;
      breakdown.totalEur = Math.round(pctAmount);
      percentTotal += breakdown.totalEur;
    }
  }

  const totalEur = Math.round(baseTotal + fixedAddOnTotal + percentTotal);

  return {
    instanceId: item.instanceId,
    productId: item.productId,
    productLabel: product.label,
    categoryLabel,
    basePriceEur: Math.round(baseTotal),
    durationSeconds: product.durationConfig ? seconds : undefined,
    durationDiscount,
    addOns: addOnBreakdowns,
    totalEur,
  };
}

// ─── Full quote calculation ──────────────────────────────

export function calculateQuote(items: QuoteItem[]): QuoteCalculation {
  const breakdowns: LineItemBreakdown[] = [];

  for (const item of items) {
    const result = getConfiguratorProduct(item.productId);
    if (!result) continue;
    breakdowns.push(
      calculateItem(item, result.product, result.category.label),
    );
  }

  return {
    items: breakdowns,
    total: breakdowns.reduce((sum, b) => sum + b.totalEur, 0),
  };
}

// ─── Format helpers ──────────────────────────────────────

export function formatEur(amount: number): string {
  return `€${amount}`;
}
