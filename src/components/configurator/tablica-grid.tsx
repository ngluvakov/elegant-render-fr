/**
 * TablicaGrid — Filtered, sorted grid of ServiceTablica cards.
 *
 * Single useQuote() subscription here; cartItems + pricingCatalog
 * are prop-drilled to all ServiceTablica children (Carrington §8).
 *
 * Filter driven by ?filter URL param (from ServiceChooserChips).
 * Default = "exterior" (Ashford's default).
 *
 * Sort order per Ashford (decision.md §7) — hardcoded const.
 */
"use client";

import { useSearchParams } from "next/navigation";
import { useQuote } from "./quote-context";
import { ServiceTablica } from "./service-tablica";
import { CHIP_DEFS, DEFAULT_FILTER } from "./service-chooser-chips";
import { CONFIGURATOR_CATEGORIES } from "@/lib/catalog/configurator";
import type { ConfiguratorProduct, ConfiguratorCategory } from "@/lib/catalog/configurator";

// Ashford-locked product order (decision.md §7)
const PRODUCT_ORDER: string[] = [
  "ext-static",
  "int-static",
  "ext-aerial",
  "fp3d-single",
  "anim",
  "ext-360",
  "int-360",
  "sp-first",
  "land-static",
  "vs-static",
  "vs-360",
  "reno-image",
  "dtd-image",
  "fp2d-single",
  "ir-simple",
  "ir-complex",
  "vr-existing",
  "vr-standalone",
];

type ProductWithCategory = {
  product: ConfiguratorProduct;
  category: ConfiguratorCategory;
};

function buildFilteredSortedProducts(
  catIds: string[],
  categories: typeof CONFIGURATOR_CATEGORIES,
): ProductWithCategory[] {
  // Flat-map all products from matching categories
  const matched: ProductWithCategory[] = [];
  for (const cat of categories) {
    if (!catIds.includes(cat.id)) continue;
    for (const product of cat.products) {
      matched.push({ product, category: cat });
    }
  }

  // Sort by Ashford order
  matched.sort((a, b) => {
    const ai = PRODUCT_ORDER.indexOf(a.product.id);
    const bi = PRODUCT_ORDER.indexOf(b.product.id);
    const aIdx = ai === -1 ? PRODUCT_ORDER.length : ai;
    const bIdx = bi === -1 ? PRODUCT_ORDER.length : bi;
    return aIdx - bIdx;
  });

  return matched;
}

export function TablicaGrid({ marketingMode = false }: { marketingMode?: boolean } = {}) {
  const { items: cartItems, pricingCatalog } = useQuote();
  const sp = useSearchParams();
  const activeFilter = sp.get("filter") ?? DEFAULT_FILTER;

  // Resolve catIds for this filter
  const chip = CHIP_DEFS.find((c) => c.filter === activeFilter) ?? CHIP_DEFS[1];
  const catIds = chip.catIds;

  const categories = pricingCatalog?.categories ?? CONFIGURATOR_CATEGORIES;
  const products = buildFilteredSortedProducts(catIds, categories);

  if (products.length === 0) {
    return (
      <div className="py-20 text-center text-muted-foreground text-sm">
        No services in the selected category.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 pb-16">
      {products.map(({ product, category }) => (
        <ServiceTablica
          key={product.id}
          product={product}
          category={category}
          cartItems={cartItems}
          pricingCatalog={pricingCatalog}
          marketingMode={marketingMode}
        />
      ))}
    </div>
  );
}
