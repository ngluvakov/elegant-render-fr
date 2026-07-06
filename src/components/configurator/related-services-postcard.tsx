/**
 * RelatedServicesPostcard — Sage-tinted inline postcard that surfaces
 * contextually related products after a primary item is added to the cart.
 *
 * Sits directly below QuoteItemCard in the quote list. Returns null when
 * all related products are already in the cart (no ghost box — per Beaumont).
 *
 * Used on: PricingConfigurator (via quote-item.tsx).
 */
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getRelatedProductIds,
  filterUnaddedRelated,
} from "@/lib/catalog/product-relations";
import { getConfiguratorProduct } from "@/lib/catalog/configurator";
import { formatPublicPrice } from "@/lib/catalog/display-currency";
import { resolveDiscount } from "@/lib/catalog/calculate";
import { makeUpsellTargetItem } from "@/lib/catalog/upsell-helpers";
import { useQuote } from "./quote-context";

type Props = {
  productId: string;
};

export function RelatedServicesPostcard({ productId }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const {
    items,
    pricingCatalog,
    displayCurrency,
    pricingSettings,
    addProduct,
  } = useQuote();

  if (dismissed) return null;

  const cartProductIds = items.map((i) => i.productId);
  const relatedIds = getRelatedProductIds(productId);
  const unaddedIds = filterUnaddedRelated(relatedIds, cartProductIds);

  if (unaddedIds.length === 0) return null;

  const relatedProducts = unaddedIds
    .map((id) => {
      const result = getConfiguratorProduct(id, pricingCatalog?.categories);
      if (!result || result.product.inquiryOnly) return null;
      const targetItem = makeUpsellTargetItem(id);
      const discount = resolveDiscount(targetItem, items, pricingCatalog);
      return {
        id,
        product: result.product,
        categoryId: result.category.id,
        discount,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (relatedProducts.length === 0) return null;

  const hasAnyDiscount = relatedProducts.some((r) => r.discount !== null);

  return (
    <div
      className={cn(
        "relative mt-3 rounded-xl border p-4 transition-colors",
        hasAnyDiscount
          ? "border-[color:var(--color-sage)]/45 bg-[color:var(--color-sage)]/15"
          : "border-[color:var(--color-sage)]/25 bg-[color:var(--color-sage)]/8",
      )}
    >
      {/* Dismiss */}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Close"
        className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Header — SectionKicker-style + optional discount pill */}
      <div className="mb-3 flex items-center gap-2 pr-6">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-sage-deep)]">
          With this package
        </p>
        {hasAnyDiscount && (
          <span className="inline-flex items-center rounded bg-[color:var(--color-sage-deep)]/15 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-[color:var(--color-sage-deep)]">
            Discounted
          </span>
        )}
      </div>

      {/* Related rows */}
      <div className="space-y-2.5">
        {relatedProducts.map(({ id, product, categoryId, discount }) => {
          const original =
            product.displayPerUnitEur ?? product.basePriceEur;
          const discounted = discount
            ? Math.round(original * (1 - discount.pct / 100))
            : null;
          const unitSuffix = product.displayUnitLabel
            ? ` / ${product.displayUnitLabel}`
            : "";

          return (
            <div
              key={id}
              className="flex flex-wrap items-center gap-x-2 gap-y-1"
            >
              <span className="text-sm font-medium text-foreground">
                {product.label}
              </span>

              {discount && discounted !== null ? (
                <>
                  <span className="inline-flex items-center rounded border border-[color:var(--color-sage)]/30 bg-[color:var(--color-sage)]/20 px-1.5 py-0.5 text-[0.65rem] font-bold tracking-wide text-[color:var(--color-sage-deep)]">
                    &minus;{discount.pct}%
                  </span>
                  <span className="text-xs text-muted-foreground/60 line-through">
                    {formatPublicPrice(
                      original,
                      displayCurrency,
                      pricingSettings,
                    )}
                    {unitSuffix}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatPublicPrice(
                      discounted,
                      displayCurrency,
                      pricingSettings,
                    )}
                    {unitSuffix}
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {formatPublicPrice(
                    original,
                    displayCurrency,
                    pricingSettings,
                  )}
                  {unitSuffix}
                </span>
              )}

              <button
                type="button"
                onClick={() => addProduct(id, categoryId)}
                className="ml-auto flex h-7 items-center rounded-md border border-foreground/20 bg-transparent px-2.5 text-xs font-medium text-foreground transition-colors hover:border-foreground/30 hover:bg-foreground/5"
              >
                + Add
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
