/**
 * inquiry-snapshot-items.ts — Best-effort parser that turns the
 * `quoteSnapshotJson` from a configurator-driven ProjectInquiry into
 * a list of seed `OrderItem` rows.
 *
 * The snapshot is a frozen view of what the customer saw on the
 * "Preuzmite moju ponudu" surface (configurator → quote-summary). It
 * carries productId + productLabel + totalEur per line — enough for
 * us to recreate the cart shape on the order side. Addon details
 * (categoryLabel-level extras, durationDiscount, configJson) are
 * dropped — admin can re-add via the configurator if needed.
 *
 * Pricing strategy: we keep the snapshot's `totalEur` so what the
 * customer saw == what lands on the draft. basePriceEur comes from
 * today's catalog (the snapshot doesn't carry it). If catalog
 * prices have moved, totalEur and basePriceEur can disagree —
 * that's intentional, admin can re-price by re-adding via the
 * configurator before issuing the predračun.
 */
import type { ResolvedPricingCatalog } from "@/lib/pricing/catalog";

export type InquiryItemSeed = {
  productId: string;
  productLabel: string;
  categoryId: string;
  categoryLabel: string;
  basePriceEur: number;
  totalEur: number;
};

type SnapshotItem = {
  productId?: unknown;
  productLabel?: unknown;
  categoryLabel?: unknown;
  totalEur?: unknown;
};

export function parseInquirySnapshotItems(
  snapshot: unknown,
  catalog: ResolvedPricingCatalog,
): InquiryItemSeed[] {
  if (!snapshot || typeof snapshot !== "object") return [];
  const obj = snapshot as { items?: unknown };
  const rawItems = Array.isArray(obj.items) ? obj.items : null;
  if (!rawItems) return [];

  // Build a fast productId → (categoryId, label, basePrice) lookup
  // from the published catalog so we don't N×M scan per item.
  const productIndex = new Map<
    string,
    {
      productLabel: string;
      categoryId: string;
      categoryLabel: string;
      basePriceEur: number;
    }
  >();
  for (const category of catalog.categories) {
    for (const product of category.products) {
      productIndex.set(product.id, {
        productLabel: product.label,
        categoryId: category.id,
        categoryLabel: category.label,
        basePriceEur: product.basePriceEur,
      });
    }
  }

  const seeds: InquiryItemSeed[] = [];
  const seenProductIds = new Set<string>();

  for (const raw of rawItems) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as SnapshotItem;
    const productId = typeof item.productId === "string" ? item.productId : null;
    if (!productId) continue;
    // Deduplicate within a single conversion. Two snapshot lines with
    // the same productId would otherwise create two OrderItem rows
    // with the same product (configurator already coalesces, but
    // stay defensive against malformed inputs).
    if (seenProductIds.has(productId)) continue;
    seenProductIds.add(productId);

    const lookup = productIndex.get(productId);
    if (!lookup) continue; // catalog drift — product removed/renamed

    const totalRaw = typeof item.totalEur === "number" ? item.totalEur : NaN;
    if (!Number.isFinite(totalRaw) || totalRaw <= 0) continue;

    seeds.push({
      productId,
      productLabel:
        typeof item.productLabel === "string" && item.productLabel
          ? item.productLabel
          : lookup.productLabel,
      categoryId: lookup.categoryId,
      categoryLabel: lookup.categoryLabel,
      basePriceEur: lookup.basePriceEur,
      totalEur: Math.round(totalRaw),
    });
  }

  return seeds;
}
