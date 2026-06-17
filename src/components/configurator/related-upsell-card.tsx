/**
 * RelatedUpsellCard — Mini card surfaced in the upsell hint grid of a ServiceTablica.
 *
 * Computes discount via resolveDiscount + upsell-helpers synthetic items.
 * Shows sage POPUST badge when a discount applies; strikethrough original + discounted price.
 * "+ Dodaj" ghost button adds to cart via useQuote().addProduct.
 */
"use client";

import { cn } from "@/lib/utils";
import { resolveDiscount } from "@/lib/catalog/calculate";
import { makePrimaryItem, makeUpsellTargetItem } from "@/lib/catalog/upsell-helpers";
import { useQuote } from "./quote-context";
import { formatPublicPrice } from "@/lib/catalog/display-currency";
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
  const { addProduct, displayCurrency, pricingSettings } = useQuote();

  const targetItem = makeUpsellTargetItem(relatedProduct.id);
  const primaryItem = makePrimaryItem(primaryProductId);
  const siblings: QuoteItem[] = [primaryItem, ...cartItems];
  const discount = resolveDiscount(targetItem, siblings, pricingCatalog);

  const originalPrice = relatedProduct.displayPerUnitRsd ?? relatedProduct.basePriceRsd;
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
    <div className="flex flex-col rounded-xl border border-border/50 bg-card p-3 gap-1.5">
      {/* Header row: name + POPUST badge */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
          {relatedProduct.label}
        </p>
        {discount && (
          <span
            className={cn(
              "shrink-0 rounded px-1.5 py-0.5 text-[0.65rem] font-semibold tracking-wide border",
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

      {/* Price line */}
      <div>
        {discount && discountedPrice !== null ? (
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-muted-foreground line-through">
              {formatPublicPrice(originalPrice, displayCurrency, pricingSettings)}
            </span>
            <span className="text-base font-semibold text-foreground">
              {formatPublicPrice(discountedPrice, displayCurrency, pricingSettings)}
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">
            od {formatPublicPrice(originalPrice, displayCurrency, pricingSettings)}
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
  );
}
