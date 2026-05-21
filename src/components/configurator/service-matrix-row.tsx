"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Building2, Check, Info, Mail, Plus, Sliders } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveDiscount, type QuoteItem } from "@/lib/catalog/calculate";
import {
  makePrimaryItem,
  makeUpsellTargetItem,
} from "@/lib/catalog/upsell-helpers";
import { formatPublicPrice } from "@/lib/catalog/display-currency";
import { track } from "@/lib/posthog-events";
import { useQuote } from "./quote-context";
import type {
  ConfiguratorCategory,
  ConfiguratorProduct,
} from "@/lib/catalog/configurator";

type Props = {
  product: ConfiguratorProduct;
  category: ConfiguratorCategory;
  cartItems: QuoteItem[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onInfoClick: (productId: string) => void;
  dimmed?: boolean;
  recommended?: boolean;
};

export function ServiceMatrixRow({
  product,
  category,
  cartItems,
  hoveredId,
  onHover,
  onInfoClick,
  dimmed = false,
  recommended = false,
}: Props) {
  const { addProduct, displayCurrency, pricingSettings, pricingCatalog } =
    useQuote();
  const [imgFailed, setImgFailed] = useState(false);

  const isInCart = cartItems.some((i) => i.productId === product.id);
  const isHovered = hoveredId === product.id;

  // Build siblings list: cart items + hovered (if any, and not this row).
  // resolveDiscount(target, siblings) returns the best applicable discount
  // for *this* product given the current cart + simulated hover-primary.
  const discount = useMemo(() => {
    if (product.inquiryOnly) return null;
    if (isInCart) return null;
    if (isHovered) return null;
    const target = makeUpsellTargetItem(product.id);
    const siblings: QuoteItem[] =
      hoveredId && hoveredId !== product.id
        ? [makePrimaryItem(hoveredId), ...cartItems]
        : cartItems;
    return resolveDiscount(target, siblings, pricingCatalog);
  }, [product.id, product.inquiryOnly, hoveredId, isHovered, isInCart, cartItems, pricingCatalog]);

  const isPreviewDiscount = discount !== null && hoveredId !== null && hoveredId !== product.id;

  const displayUnitLabel = product.displayUnitLabel ?? product.unitLabel;
  const originalPerUnit = product.displayPerUnitEur ?? product.basePriceEur;
  const discountedPerUnit = discount
    ? Math.round(originalPerUnit * (1 - discount.pct / 100))
    : null;

  const handleAdd = () => {
    addProduct(product.id, category.id);
    track("service_matrix_add", {
      product_id: product.id,
      category_id: category.id,
      from: "row",
    });
  };

  const handleInfo = () => {
    onInfoClick(product.id);
    track("service_matrix_info_open", { product_id: product.id });
  };

  const isInquiry = product.inquiryOnly;
  const isInterior = product.id === "int-static" || product.id === "int-360";

  const PrimaryActionIcon = isInquiry ? Mail : isInterior ? Sliders : Plus;
  const primaryActionLabel = isInquiry
    ? "Pošalji upit"
    : isInterior
      ? "Konfiguriši"
      : "Dodaj u korpu";

  return (
    <li
      onMouseEnter={() => onHover(product.id)}
      onMouseLeave={() => onHover(null)}
      data-hovered={isHovered ? "" : undefined}
      data-in-cart={isInCart ? "" : undefined}
      data-dimmed={dimmed ? "" : undefined}
      className={cn(
        "group relative flex items-stretch gap-3 sm:gap-4 rounded-xl border border-border/50 bg-card px-3 py-3 sm:px-4 sm:py-3 transition-all duration-200",
        "hover:border-[color:var(--color-sage)]/50 hover:bg-secondary/30",
        dimmed && "opacity-55 hover:opacity-100",
        recommended &&
          "border-[color:var(--color-sage)]/45 bg-[color:var(--color-sage)]/8",
        isInCart && "border-[color:var(--color-sage-deep)]/45 bg-[color:var(--color-sage)]/10",
      )}
    >
      <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-[color:var(--color-sage)]/15 to-[color:var(--color-sage-deep)]/25">
        {!imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/artwork/tablica-${product.id}.webp`}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-foreground/30" strokeWidth={1.5} />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h4 className="text-sm sm:text-base font-medium leading-snug text-foreground">
            {product.label}
          </h4>
          {isInCart && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-sage-deep)]/15 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-[color:var(--color-sage-deep)]">
              <Check className="h-2.5 w-2.5" strokeWidth={3} /> U korpi
            </span>
          )}
          {recommended && !isInCart && (
            <span className="inline-flex items-center rounded-full bg-[color:var(--color-sage)]/20 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-[color:var(--color-sage-deep)]">
              Preporuka
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {category.label}
        </p>
      </div>

      <div className="hidden sm:flex flex-col items-end justify-center text-right min-w-[120px]">
        {discount ? (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs line-through text-muted-foreground/55">
                {formatPublicPrice(originalPerUnit, displayCurrency, pricingSettings)}
              </span>
              <span className="text-base font-semibold text-foreground">
                {formatPublicPrice(discountedPerUnit!, displayCurrency, pricingSettings)}
              </span>
            </div>
            <span
              className={cn(
                "mt-0.5 inline-flex items-center rounded px-1.5 py-0 text-[0.6rem] font-bold uppercase tracking-wide",
                isPreviewDiscount
                  ? "bg-[color:var(--color-sage)]/25 text-[color:var(--color-sage-deep)] ring-1 ring-dashed ring-[color:var(--color-sage-deep)]/40"
                  : "bg-[color:var(--color-sage-deep)] text-white",
              )}
              title={discount.reason}
            >
              &minus;{discount.pct}%{" "}
              {isPreviewDiscount && (
                <span className="ml-1 font-normal normal-case tracking-normal">preview</span>
              )}
            </span>
            <span className="text-[0.65rem] text-muted-foreground">
              / {displayUnitLabel}
            </span>
          </>
        ) : (
          <>
            <span className="text-base font-semibold text-foreground">
              od {formatPublicPrice(originalPerUnit, displayCurrency, pricingSettings)}
            </span>
            <span className="text-[0.65rem] text-muted-foreground">
              / {displayUnitLabel}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 self-center">
        <button
          type="button"
          onClick={handleInfo}
          aria-label={`Detalji o usluzi: ${product.label}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/50 bg-background text-muted-foreground transition-colors hover:border-[color:var(--color-sage-deep)]/40 hover:text-foreground"
        >
          <Info className="h-4 w-4" />
        </button>

        {isInquiry ? (
          <Link
            href={`/kontakt?service=${product.id}`}
            aria-label={primaryActionLabel}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-accent px-3 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
          >
            <PrimaryActionIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Upit</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            disabled={isInCart && !isInterior}
            aria-label={isInCart ? "Već u korpi" : primaryActionLabel}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors",
              isInCart
                ? "bg-[color:var(--color-sage-deep)]/15 text-[color:var(--color-sage-deep)] cursor-default"
                : "bg-accent text-accent-foreground hover:bg-accent/90",
            )}
          >
            <PrimaryActionIcon className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isInCart ? "U korpi" : isInterior ? "Konfiguriši" : "Dodaj"}
            </span>
          </button>
        )}
      </div>

      {/* Mobile price strip */}
      <div className="sm:hidden absolute inset-x-3 bottom-1 flex justify-end">
        {discount ? (
          <div className="flex items-baseline gap-1.5 text-xs">
            <span className="line-through text-muted-foreground/55">
              {formatPublicPrice(originalPerUnit, displayCurrency, pricingSettings)}
            </span>
            <span className="font-semibold text-foreground">
              {formatPublicPrice(discountedPerUnit!, displayCurrency, pricingSettings)}
            </span>
            <span className="rounded bg-[color:var(--color-sage-deep)] px-1 py-0 text-[0.55rem] font-bold uppercase text-white">
              &minus;{discount.pct}%
            </span>
          </div>
        ) : (
          <span className="text-xs font-semibold text-foreground">
            od {formatPublicPrice(originalPerUnit, displayCurrency, pricingSettings)}
          </span>
        )}
      </div>
    </li>
  );
}
