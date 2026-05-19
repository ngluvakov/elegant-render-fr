/**
 * RelatedUpsellCard — Mini card surfaced in the upsell hint grid of a ServiceTablica.
 *
 * Computes discount via resolveDiscount + upsell-helpers synthetic items.
 * Shows sage POPUST badge when a discount applies; strikethrough original + discounted price.
 * "+ Dodaj" ghost button adds to cart via useQuote().addProduct.
 */
"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveDiscount } from "@/lib/catalog/calculate";
import { makePrimaryItem, makeUpsellTargetItem } from "@/lib/catalog/upsell-helpers";
import { useQuote } from "./quote-context";
import { track } from "@/lib/posthog-events";
import type { ConfiguratorProduct } from "@/lib/catalog/configurator";
import type { QuoteItem } from "@/lib/catalog/calculate";
import type { ResolvedPricingCatalog } from "@/lib/pricing/catalog";

type Props = {
  primaryProductId: string;
  relatedProduct: ConfiguratorProduct;
  cartItems: QuoteItem[];
  categoryId: string;
  pricingCatalog?: ResolvedPricingCatalog;
};

export function RelatedUpsellCard({
  primaryProductId,
  relatedProduct,
  cartItems,
  categoryId,
  pricingCatalog,
}: Props) {
  const { addProduct } = useQuote();
  const [imgFailed, setImgFailed] = useState(false);

  const targetItem = makeUpsellTargetItem(relatedProduct.id);
  const primaryItem = makePrimaryItem(primaryProductId);
  const siblings: QuoteItem[] = [primaryItem, ...cartItems];
  const discount = resolveDiscount(targetItem, siblings, pricingCatalog);

  const originalPrice = relatedProduct.displayPerUnitEur ?? relatedProduct.basePriceEur;
  const discountedPrice = discount
    ? Math.round(originalPrice * (1 - discount.pct / 100))
    : null;
  const pct = discount?.pct ?? 0;

  const handleAdd = () => {
    addProduct(relatedProduct.id, categoryId);
    track("service_tablica_click_upsell", {
      primary_product_id: primaryProductId,
      related_product_id: relatedProduct.id,
      discount_pct: pct,
    });
  };

  return (
    <div className="flex flex-col rounded-xl border border-border/50 bg-card overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[color:var(--color-sage)]/10 to-[color:var(--color-sage-deep)]/20">
        {!imgFailed ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`/artwork/tablica-${relatedProduct.id}.webp`}
            alt={relatedProduct.label}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-center"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-foreground/25" strokeWidth={1.5} />
          </div>
        )}

        {/* POPUST badge */}
        {discount && (
          <span
            className={cn(
              "absolute top-2 left-2 rounded px-1.5 py-0.5 text-[0.65rem] font-semibold tracking-wide border",
              "text-[color:var(--color-sage-deep)] border-[color:var(--color-sage)]/30",
              pct >= 40
                ? "bg-[color:var(--color-sage)]/25"
                : "bg-[color:var(--color-sage)]/15",
            )}
          >
            &minus;{pct}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
          {relatedProduct.label}
        </p>

        {/* Price line */}
        <div className="mt-auto">
          {discount && discountedPrice !== null ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs text-muted-foreground line-through">
                €{originalPrice}
              </span>
              <span className="text-base font-semibold text-foreground">
                €{discountedPrice}
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              od €{originalPrice}
            </span>
          )}
        </div>

        {/* Ghost add button */}
        <button
          type="button"
          onClick={handleAdd}
          className="mt-1 w-full rounded-md border border-foreground/20 bg-transparent px-2 py-1 text-xs font-medium text-foreground hover:bg-foreground/5 transition-colors"
        >
          + Dodaj
        </button>
      </div>
    </div>
  );
}
