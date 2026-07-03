/**
 * Invarijante cenovnika preko celog kataloga. Tačne poslovne vrednosti
 * (popusti po pravilima 1-4, EUR baze) pokriva scripts/verify-pricing.ts;
 * ovi testovi čuvaju strukturna svojstva na koja se oslanjaju checkout i
 * repriceOrder: celobrojne cene, konzistentnost centi, granice popusta.
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

describe("calculateQuote — invarijante preko celog kataloga", () => {
  it("katalog nije prazan", () => {
    expect(ALL_PRODUCTS.length).toBeGreaterThan(0);
  });

  for (const { categoryId, productId } of ALL_PRODUCTS) {
    it(`${productId}: pojedinačna stavka daje validan breakdown`, () => {
      const calc = calculateQuote([singleItem(productId, categoryId)]);
      expect(calc.items).toHaveLength(1);
      const item = calc.items[0];

      // RSD major-unit cene su celobrojne (pravilo platforme).
      expect(Number.isInteger(item.totalRsd)).toBe(true);
      expect(Number.isInteger(item.totalCents)).toBe(true);
      expect(item.totalRsd).toBeGreaterThanOrEqual(0);

      // Centi i major-unit ne smeju da se raziđu više od zaokruživanja.
      expect(Math.abs(item.totalCents / 100 - item.totalRsd)).toBeLessThan(1);

      // Popust u [0, 100] i original ≥ finalna cena.
      expect(item.discountPct).toBeGreaterThanOrEqual(0);
      expect(item.discountPct).toBeLessThanOrEqual(100);
      expect(item.originalTotalRsd).toBeGreaterThanOrEqual(item.totalRsd);
    });
  }

  it("ukupno = suma stavki (RSD i centi)", () => {
    const items = ALL_PRODUCTS.slice(0, 4).map(({ productId, categoryId }, i) => ({
      ...singleItem(productId, categoryId),
      instanceId: `multi-${i}`,
    }));
    const calc = calculateQuote(items);
    const sumRsd = calc.items.reduce((s, i) => s + i.totalRsd, 0);
    const sumCents = calc.items.reduce((s, i) => s + i.totalCents, 0);
    expect(calc.total).toBe(sumRsd);
    expect(calc.totalCents).toBe(sumCents);
  });

  it("priceItems se slaže sa calculateQuote za standardne stavke", () => {
    const items = ALL_PRODUCTS.slice(0, 3).map(({ productId, categoryId }, i) => ({
      ...singleItem(productId, categoryId),
      instanceId: `pi-${i}`,
    }));
    const viaEngine = calculateQuote(items);
    const viaOrchestrator = priceItems(items, []);
    expect(viaOrchestrator.total).toBe(viaEngine.total);
    expect(viaOrchestrator.totalCents).toBe(viaEngine.totalCents);
  });

  it("cross-service popusti mogu samo da snize ukupnu cenu", () => {
    // Sve stavke zajedno — najagresivniji cross-service scenario koji
    // konfigurator može da proizvede. Ukupno sa popustima ne sme preći
    // sumu pojedinačnih cena, a popust ostaje u [0, 100].
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
