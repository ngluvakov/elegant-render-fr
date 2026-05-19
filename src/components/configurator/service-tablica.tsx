/**
 * ServiceTablica — Full-width product card for the /cene browse grid.
 *
 * 3-zone layout: hero image / content / price-strip band.
 * Mobile: collapsed by default behind "Detalji ›" toggle.
 * Desktop: always expanded.
 *
 * Branched CTA logic:
 *   - inquiryOnly → "Pošalji upit" link → /kontakt?service={id}
 *   - int-static | int-360 → "Konfiguriši sprat" → addProduct (opens InteriorQuoteEditor)
 *   - else → "Dodaj u korpu" → addProduct
 *
 * Upsell hint: collapsed by default, single-line with chevron.
 * Expands into a grid of RelatedUpsellCard components (max 3).
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Building2, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveDiscount } from "@/lib/catalog/calculate";
import { makePrimaryItem, makeUpsellTargetItem, getUpsellProducts } from "@/lib/catalog/upsell-helpers";
import { useQuote } from "./quote-context";
import { RelatedUpsellCard } from "./related-upsell-card";
import { track } from "@/lib/posthog-events";
import { getConfiguratorProduct } from "@/lib/catalog/configurator";
import type { ConfiguratorCategory, ConfiguratorProduct } from "@/lib/catalog/configurator";
import type { QuoteItem } from "@/lib/catalog/calculate";
import type { ResolvedPricingCatalog } from "@/lib/pricing/catalog";

type Props = {
  product: ConfiguratorProduct;
  category: ConfiguratorCategory;
  cartItems: QuoteItem[];
  pricingCatalog?: ResolvedPricingCatalog;
};

export function ServiceTablica({ product, category, cartItems, pricingCatalog }: Props) {
  const { addProduct } = useQuote();
  const [expanded, setExpanded] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  // Upsell products (filtered out-of-cart, non-inquiry)
  const upsellProducts = getUpsellProducts(product.id, cartItems).slice(0, 3);

  // Check if any upsell has a discount given this primary + current cart
  const primaryItem = makePrimaryItem(product.id);
  const siblings: QuoteItem[] = [primaryItem, ...cartItems];
  const upsellDiscounts = upsellProducts.map((up) => {
    const targetItem = makeUpsellTargetItem(up.id);
    return resolveDiscount(targetItem, siblings, pricingCatalog);
  });
  const hasAnyDiscount = upsellDiscounts.some((d) => d !== null);
  const hasUpsells = upsellProducts.length > 0;

  const handleAddToCart = () => {
    addProduct(product.id, category.id);
    track("service_tablica_click_dodaj", {
      product_id: product.id,
      category_id: category.id,
    });
  };

  // CTA resolution
  const isInquiry = product.inquiryOnly;
  const isInterior = product.id === "int-static" || product.id === "int-360";

  const primaryCta = isInquiry ? (
    <div>
      <Link
        href={`/kontakt?service=${product.id}`}
        className="inline-flex items-center justify-center w-full rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 px-4 py-2.5 text-sm font-semibold transition-colors"
      >
        Pošalji upit
      </Link>
      {/* Trust line — always visible for inquiry products */}
      <p className="mt-2 text-xs text-muted-foreground text-center">
        Odgovaramo u roku od jednog radnog dana.
      </p>
    </div>
  ) : (
    <button
      type="button"
      onClick={handleAddToCart}
      className="inline-flex items-center justify-center w-full rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 px-4 py-2.5 text-sm font-semibold transition-colors"
    >
      {isInterior ? "Konfiguriši sprat" : "Dodaj u korpu"}
    </button>
  );

  // Upsell hint copy
  const upsellNames = upsellProducts.map((up, i) => {
    const hasDiscount = upsellDiscounts[i] !== null;
    return hasDiscount ? `${up.label} (uz popust)` : up.label;
  });

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      {/* ZONE 1 — Hero image */}
      <div className="relative w-full aspect-video overflow-hidden bg-gradient-to-br from-[color:var(--color-sage)]/10 to-[color:var(--color-sage-deep)]/20">
        {!imgFailed ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`/artwork/tablica-${product.id}.webp`}
            alt={product.label}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-center"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Building2 className="h-14 w-14 text-foreground/20" strokeWidth={1} />
          </div>
        )}
      </div>

      {/* ZONE 2 — Content */}
      <div className="p-6 flex flex-col gap-3">
        {/* H3 — always visible */}
        <h3 className="text-2xl font-semibold text-foreground leading-snug">
          {product.label}
        </h3>

        {/* Collapsible content — hidden on mobile by default, always shown on md+ */}
        <div className={cn("contents", !expanded && "hidden md:contents")}>
          {/* Hook line */}
          <p className="text-sm text-muted-foreground">
            {category.description}
          </p>

          {/* Includes list */}
          {product.includes.length > 0 && (
            <ul className="flex flex-col gap-1.5 mt-1">
              {product.includes.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                  <Check
                    className="h-4 w-4 text-[color:var(--color-sage-deep)] shrink-0 mt-0.5"
                    strokeWidth={2.5}
                  />
                  {item}
                </li>
              ))}
            </ul>
          )}

          {/* Upsell hint — only when related products exist */}
          {hasUpsells && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setUpsellOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-1 text-sm transition-colors text-left w-full",
                  hasAnyDiscount
                    ? "text-foreground border-l-2 border-[color:var(--color-sage)]/40 pl-3"
                    : "text-muted-foreground",
                )}
              >
                <span className="flex-1">
                  Često ide zajedno:{" "}
                  {upsellNames.join(", ")}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform",
                    upsellOpen && "rotate-180",
                  )}
                />
              </button>

              {upsellOpen && (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {upsellProducts.map((up) => {
                    const upCategoryId =
                      getConfiguratorProduct(up.id, pricingCatalog?.categories)
                        ?.category.id ?? category.id;
                    return (
                      <RelatedUpsellCard
                        key={up.id}
                        primaryProductId={product.id}
                        relatedProduct={up}
                        cartItems={cartItems}
                        categoryId={upCategoryId}
                        pricingCatalog={pricingCatalog}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Konfiguriši / Detalji ghost link — for interior products only on desktop */}
          {!isInquiry && isInterior && (
            <p className="text-xs text-muted-foreground">
              Cena zavisi od broja spratova i prostorija — konfiguriši u korpi.
            </p>
          )}
        </div>

        {/* Mobile expand toggle */}
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>{expanded ? "Zatvori" : "Detalji"}</span>
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                expanded && "rotate-90",
              )}
            />
          </button>
        </div>
      </div>

      {/* ZONE 3 — Price strip */}
      <div className="bg-secondary/60 border-t border-border/40 py-5 px-6">
        {/* Package price (base) */}
        <p className="text-base text-muted-foreground">
          €{product.basePriceEur} / paket
        </p>

        {/* Hero per-unit cifra */}
        {product.displayPerUnitEur !== undefined ? (
          <>
            <p className="text-5xl font-bold text-foreground leading-none mt-1">
              od €{product.displayPerUnitEur}
            </p>
            <p className="text-lg text-muted-foreground mt-1">
              / {product.displayUnitLabel ?? product.unitLabel}
            </p>
          </>
        ) : (
          <p className="text-5xl font-bold text-foreground leading-none mt-1">
            od €{product.basePriceEur}
          </p>
        )}

        {/* Package note — ALWAYS visible (honesty anchor) */}
        {product.displayPackageNote && (
          <p className="text-xs text-muted-foreground italic mt-3">
            {product.displayPackageNote}
          </p>
        )}

        {/* CTA */}
        <div className="mt-4">
          {primaryCta}
        </div>
      </div>
    </div>
  );
}
