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
import {
  getRelatedProductIds,
  filterUnaddedRelated,
} from "@/lib/catalog/product-relations";
import { getConfiguratorProduct } from "@/lib/catalog/configurator";
import {
  formatPublicPrice,
} from "@/lib/catalog/display-currency";
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
      return { id, product: result.product, categoryId: result.category.id };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (relatedProducts.length === 0) return null;

  return (
    <div className="relative mt-2 rounded-xl border border-[color:var(--color-sage)]/20 bg-[color:var(--color-sage)]/8 p-3">
      {/* Dismiss */}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Zatvori"
        className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Header */}
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        Uz ovaj paket:
      </p>

      {/* Related rows */}
      <div className="space-y-1.5">
        {relatedProducts.map(({ id, product, categoryId }) => (
          <div key={id} className="flex items-center gap-2">
            <span className="text-sm text-foreground">{product.label}</span>
            {product.displayPerUnitEur !== undefined ? (
              <span className="ml-1 text-xs text-muted-foreground">
                {formatPublicPrice(
                  product.displayPerUnitEur,
                  displayCurrency,
                  pricingSettings,
                )}
                {product.displayUnitLabel ? ` / ${product.displayUnitLabel}` : ""}
              </span>
            ) : (
              <span className="ml-1 text-xs text-muted-foreground">
                {formatPublicPrice(product.basePriceEur, displayCurrency, pricingSettings)}
              </span>
            )}
            <button
              type="button"
              onClick={() => addProduct(id, categoryId)}
              className="ml-auto flex h-7 items-center rounded-md border border-foreground/20 bg-transparent px-2 text-xs font-medium text-foreground transition-colors hover:border-foreground/30 hover:bg-foreground/5"
            >
              + Dodaj
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
