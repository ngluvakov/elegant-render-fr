"use client";

import { useMemo } from "react";
import { ServiceMatrixRow } from "./service-matrix-row";
import { getRelatedProductIds } from "@/lib/catalog/product-relations";
import { CONFIGURATOR_CATEGORIES } from "@/lib/catalog/configurator";
import { useQuote } from "./quote-context";
import { ALL_FILTER } from "./service-matrix-shared";
import type {
  ConfiguratorCategory,
  ConfiguratorProduct,
} from "@/lib/catalog/configurator";

type Props = {
  activeCat: string;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onInfoClick: (productId: string) => void;
};

type ProductWithCategory = {
  product: ConfiguratorProduct;
  category: ConfiguratorCategory;
};

function flattenAll(
  categories: typeof CONFIGURATOR_CATEGORIES,
): ProductWithCategory[] {
  const flat: ProductWithCategory[] = [];
  for (const cat of categories) {
    for (const product of cat.products) {
      flat.push({ product, category: cat });
    }
  }
  return flat;
}

export function ServiceMatrixTable({
  activeCat,
  hoveredId,
  onHover,
  onInfoClick,
}: Props) {
  const { items: cartItems, pricingCatalog } = useQuote();
  const categories = pricingCatalog?.categories ?? CONFIGURATOR_CATEGORIES;

  const allFlat = useMemo(() => flattenAll(categories), [categories]);

  // ── "Sve usluge" mode: group by category, no recommended split ──
  if (activeCat === ALL_FILTER) {
    return (
      <div className="flex flex-col gap-6">
        {categories.map((cat) => (
          <section key={cat.id}>
            <header className="mb-2 flex items-baseline justify-between px-1">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground">
                {cat.label}
              </h3>
              <span className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                {cat.sectionLabel}
              </span>
            </header>
            <ul className="flex flex-col gap-2">
              {cat.products.map((product) => (
                <ServiceMatrixRow
                  key={product.id}
                  product={product}
                  category={cat}
                  cartItems={cartItems}
                  hoveredId={hoveredId}
                  onHover={onHover}
                  onInfoClick={onInfoClick}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  // ── Specific category mode: active / recommended / other ──
  const activeCategory = categories.find((c) => c.id === activeCat);
  if (!activeCategory) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Kategorija nije pronađena.
      </div>
    );
  }

  const cartProductIds = new Set(cartItems.map((i) => i.productId));
  const activeProductIds = new Set(activeCategory.products.map((p) => p.id));

  // Recommended: union of related products from each cart item, minus what's
  // already in the cart and minus products in the active category (avoid dupes).
  const recommendedIds = new Set<string>();
  if (cartItems.length > 0) {
    for (const item of cartItems) {
      for (const relId of getRelatedProductIds(item.productId)) {
        if (cartProductIds.has(relId)) continue;
        if (activeProductIds.has(relId)) continue;
        recommendedIds.add(relId);
      }
    }
  }

  const recommended = allFlat.filter((pc) => recommendedIds.has(pc.product.id));
  const otherProducts = allFlat.filter(
    (pc) =>
      pc.category.id !== activeCat &&
      !recommendedIds.has(pc.product.id),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Active category — animated slide-in-from-top whenever activeCat changes */}
      <section
        key={`active-${activeCat}`}
        className="animate-in fade-in slide-in-from-top-2 duration-300 ease-out"
      >
        <header className="mb-2 flex items-baseline justify-between px-1">
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground">
            {activeCategory.label}
          </h3>
          <span className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
            {activeCategory.sectionLabel}
          </span>
        </header>
        <ul className="flex flex-col gap-2">
          {activeCategory.products.map((product) => (
            <ServiceMatrixRow
              key={product.id}
              product={product}
              category={activeCategory}
              cartItems={cartItems}
              hoveredId={hoveredId}
              onHover={onHover}
              onInfoClick={onInfoClick}
            />
          ))}
        </ul>
      </section>

      {recommended.length > 0 && (
        <section
          key={`recommended-${activeCat}-${cartItems.length}`}
          className="animate-in fade-in slide-in-from-top-1 duration-300 ease-out"
        >
          <header className="mb-2 flex items-baseline justify-between px-1">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--color-sage-deep)]">
              Preporučeno uz izabrano
            </h3>
            <span className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
              Sa popustom za već naručeno
            </span>
          </header>
          <ul className="flex flex-col gap-2">
            {recommended.map(({ product, category }) => (
              <ServiceMatrixRow
                key={product.id}
                product={product}
                category={category}
                cartItems={cartItems}
                hoveredId={hoveredId}
                onHover={onHover}
                onInfoClick={onInfoClick}
                recommended
              />
            ))}
          </ul>
        </section>
      )}

      {otherProducts.length > 0 && (
        <section>
          <header className="mb-2 flex items-baseline justify-between px-1">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Ostale usluge
            </h3>
            <span className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground/70">
              Iz drugih kategorija
            </span>
          </header>
          <ul className="flex flex-col gap-2">
            {otherProducts.map(({ product, category }) => (
              <ServiceMatrixRow
                key={product.id}
                product={product}
                category={category}
                cartItems={cartItems}
                hoveredId={hoveredId}
                onHover={onHover}
                onInfoClick={onInfoClick}
                dimmed
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
