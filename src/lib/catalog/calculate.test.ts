/**
 * Pricing invariants across the whole catalog. Exact business values
 * (discounts per rules 1-4, EUR bases) are covered by scripts/verify-pricing.ts;
 * these tests guard the structural properties that checkout and
 * repriceOrder rely on: integer prices, cent consistency, discount bounds.
 */
import { describe, expect, it } from "vitest";
import { calculateQuote, priceItems, type QuoteItem } from "@/lib/catalog/calculate";
import { CONFIGURATOR_CATEGORIES } from "@/lib/catalog/configurator";

function singleItem(productId: string, categoryId: string): QuoteItem {
  return {
    instanceId: `t-${productId}`,
    productId,
    categoryId,
    addOnQuantities: {},
  };
}

const ALL_PRODUCTS = CONFIGURATOR_CATEGORIES.flatMap((cat) =>
  cat.products
    .filter((p) => !p.inquiryOnly)
    .map((p) => ({ categoryId: cat.id, productId: p.id })),
);

describe("calculateQuote — invariants across the whole catalog", () => {
  it("catalog is not empty", () => {
    expect(ALL_PRODUCTS.length).toBeGreaterThan(0);
  });

  for (const { categoryId, productId } of ALL_PRODUCTS) {
    it(`${productId}: a single item yields a valid breakdown`, () => {
      const calc = calculateQuote([singleItem(productId, categoryId)]);
      expect(calc.items).toHaveLength(1);
      const item = calc.items[0];

      // EUR major-unit prices are integers (platform rule).
      expect(Number.isInteger(item.totalEur)).toBe(true);
      expect(Number.isInteger(item.totalCents)).toBe(true);
      expect(item.totalEur).toBeGreaterThanOrEqual(0);

      // Cents and major units must not diverge by more than rounding.
      expect(Math.abs(item.totalCents / 100 - item.totalEur)).toBeLessThan(1);

      // Discount in [0, 100] and original ≥ final price.
      expect(item.discountPct).toBeGreaterThanOrEqual(0);
      expect(item.discountPct).toBeLessThanOrEqual(100);
      expect(item.originalTotalEur).toBeGreaterThanOrEqual(item.totalEur);
    });
  }

  it("total = sum of items (EUR and cents)", () => {
    const items = ALL_PRODUCTS.slice(0, 4).map(({ productId, categoryId }, i) => ({
      ...singleItem(productId, categoryId),
      instanceId: `multi-${i}`,
    }));
    const calc = calculateQuote(items);
    const sumEur = calc.items.reduce((s, i) => s + i.totalEur, 0);
    const sumCents = calc.items.reduce((s, i) => s + i.totalCents, 0);
    expect(calc.total).toBe(sumEur);
    expect(calc.totalCents).toBe(sumCents);
  });

  it("priceItems agrees with calculateQuote for standard items", () => {
    const items = ALL_PRODUCTS.slice(0, 3).map(({ productId, categoryId }, i) => ({
      ...singleItem(productId, categoryId),
      instanceId: `pi-${i}`,
    }));
    const viaEngine = calculateQuote(items);
    const viaOrchestrator = priceItems(items, []);
    expect(viaOrchestrator.total).toBe(viaEngine.total);
    expect(viaOrchestrator.totalCents).toBe(viaEngine.totalCents);
  });

  it("cross-service discounts can only lower the total price", () => {
    // All items together — the most aggressive cross-service scenario the
    // configurator can produce. The discounted total must not exceed the
    // sum of individual prices, and the discount stays in [0, 100].
    const items = ALL_PRODUCTS.map(({ productId, categoryId }, i) => ({
      ...singleItem(productId, categoryId),
      instanceId: `cap-${i}`,
    }));
    const combined = calculateQuote(items);
    const sumIndividual = ALL_PRODUCTS.reduce(
      (sum, { productId, categoryId }) =>
        sum + calculateQuote([singleItem(productId, categoryId)]).total,
      0,
    );
    expect(combined.total).toBeLessThanOrEqual(sumIndividual);
    for (const item of combined.items) {
      expect(item.discountPct).toBeGreaterThanOrEqual(0);
      expect(item.discountPct).toBeLessThanOrEqual(100);
    }
  });
});
