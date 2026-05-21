"use client";

import { useMemo } from "react";
import { ServiceMatrixRow } from "./service-matrix-row";
import {
  resolveDiscount,
  type QuoteItem,
} from "@/lib/catalog/calculate";
import { makePrimaryItem } from "@/lib/catalog/upsell-helpers";
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
      <div className="flex flex-col gap-5">
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
            <ul className="flex flex-col gap-1.5">
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

  // Cheaper-with: products from other categories that would receive a
  // discount via resolveDiscount when any product in the active category is
  // a sibling (or any cart item is). Sorted by discount % descending so the
  // strongest savings sit closest to the active group.
  const siblingsForCheaper: QuoteItem[] = [
    ...activeCategory.products.map((p) => makePrimaryItem(p.id)),
    ...cartItems,
  ];

  type Cheaper = ProductWithCategory & { discountPct: number };
  const cheaper: Cheaper[] = [];
  for (const pc of allFlat) {
    if (pc.category.id === activeCat) continue;
    if (cartProductIds.has(pc.product.id)) continue;
    if (pc.product.inquiryOnly) continue;
    const target = makePrimaryItem(pc.product.id);
    const d = resolveDiscount(target, siblingsForCheaper, pricingCatalog);
    if (d) cheaper.push({ ...pc, discountPct: d.pct });
  }
  cheaper.sort((a, b) => b.discountPct - a.discountPct);

  const cheaperIds = new Set(cheaper.map((c) => c.product.id));
  const otherProducts = allFlat.filter(
    (pc) =>
      pc.category.id !== activeCat &&
      !cheaperIds.has(pc.product.id),
  );

  return (
    <div className="flex flex-col gap-5">
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

      {cheaper.length > 0 && (
        <section
          key={`cheaper-${activeCat}-${cartItems.length}`}
          className="animate-in fade-in slide-in-from-top-1 duration-300 ease-out"
        >
          <header className="mb-2 flex items-baseline justify-between px-1">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--color-sage-deep)]">
              Postaje povoljnije uz {activeCategory.label.toLowerCase()}
            </h3>
            <span className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
              Hover &rarr; preview popusta
            </span>
          </header>
          <ul className="flex flex-col gap-1.5">
            {cheaper.map(({ product, category }) => (
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
          <ul className="flex flex-col gap-1.5">
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
