"use client";

import Link from "next/link";
import { Check, Info, ArrowDownToLine } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { resolveDiscount } from "@/lib/catalog/calculate";
import { makeUpsellTargetItem } from "@/lib/catalog/upsell-helpers";
import {
  formatPublicPrice,
  formatPublicPriceText,
} from "@/lib/catalog/display-currency";
import { useQuote } from "./quote-context";
import { track } from "@/lib/posthog-events";
import type {
  ConfiguratorCategory,
  ConfiguratorProduct,
} from "@/lib/catalog/configurator";

type Props = {
  product: ConfiguratorProduct | null;
  category: ConfiguratorCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ServiceDetailDrawer({
  product,
  category,
  open,
  onOpenChange,
}: Props) {
  const {
    items: cartItems,
    pricingCatalog,
    displayCurrency,
    pricingSettings,
    addProduct,
  } = useQuote();

  if (!product || !category) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[min(480px,90vw)]"
        />
      </Sheet>
    );
  }

  const isInCart = cartItems.some((i) => i.productId === product.id);
  const target = makeUpsellTargetItem(product.id);
  const discount =
    !isInCart && !product.inquiryOnly
      ? resolveDiscount(target, cartItems, pricingCatalog)
      : null;

  const displayUnitLabel = product.displayUnitLabel ?? product.unitLabel;
  const formattedDisplayUnitLabel = formatPublicPriceText(
    displayUnitLabel,
    displayCurrency,
    pricingSettings,
  );
  const originalPerUnit = product.displayPerUnitEur ?? product.basePriceEur;
  const originalPackage = product.basePriceEur;
  const discountedPerUnit = discount
    ? Math.round(originalPerUnit * (1 - discount.pct / 100))
    : null;
  const discountedPackage = discount
    ? Math.round(originalPackage * (1 - discount.pct / 100))
    : null;

  const handleAdd = () => {
    addProduct(product.id, category.id);
    track("service_matrix_add", {
      product_id: product.id,
      category_id: category.id,
      from: "detail_drawer",
    });
    onOpenChange(false);
  };

  const handleScrollToCart = () => {
    onOpenChange(false);
    queueMicrotask(() => {
      const target = document.getElementById("korpa");
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[min(480px,90vw)] overflow-y-auto p-0"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{product.label}</SheetTitle>
          <SheetDescription>{category.description}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 p-6">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {category.label}
            </p>
            <h2 className="mt-1 text-2xl font-semibold leading-snug text-foreground">
              {product.label}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {category.description}
            </p>
          </div>

          <div
            className={cn(
              "rounded-xl border px-4 py-4",
              discount
                ? "border-[color:var(--color-sage)]/40 bg-[color:var(--color-sage)]/10"
                : "border-border/60 bg-secondary/40",
            )}
          >
            {discount && (
              <div className="mb-2 inline-flex items-center gap-1.5 rounded bg-[color:var(--color-sage-deep)] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-white">
                Discount &minus;{discount.pct}%
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              {discount ? (
                <>
                  <span className="mr-2 line-through text-muted-foreground/60">
                    {formatPublicPrice(originalPackage, displayCurrency, pricingSettings)}
                  </span>
                  <span className="font-medium text-foreground">
                    {formatPublicPrice(discountedPackage!, displayCurrency, pricingSettings)}
                  </span>
                  {" / package"}
                </>
              ) : (
                <>
                  {formatPublicPrice(originalPackage, displayCurrency, pricingSettings)}
                  {" / package"}
                </>
              )}
            </p>

            {product.displayPerUnitEur !== undefined ? (
              <p className="mt-1 text-3xl font-bold leading-none text-foreground">
                {discount ? (
                  <>
                    <span className="mr-2 text-lg font-medium text-muted-foreground/50 line-through">
                      {formatPublicPrice(originalPerUnit, displayCurrency, pricingSettings)}
                    </span>
                    {formatPublicPrice(discountedPerUnit!, displayCurrency, pricingSettings)}
                  </>
                ) : (
                  <>from {formatPublicPrice(originalPerUnit, displayCurrency, pricingSettings)}</>
                )}
                <span className="ml-1 text-base font-medium text-muted-foreground">
                  / {formattedDisplayUnitLabel}
                </span>
              </p>
            ) : (
              <p className="mt-1 text-3xl font-bold leading-none text-foreground">
                {discount ? (
                  <>
                    <span className="mr-2 text-lg font-medium text-muted-foreground/50 line-through">
                      {formatPublicPrice(originalPackage, displayCurrency, pricingSettings)}
                    </span>
                    {formatPublicPrice(discountedPackage!, displayCurrency, pricingSettings)}
                  </>
                ) : (
                  <>from {formatPublicPrice(originalPackage, displayCurrency, pricingSettings)}</>
                )}
              </p>
            )}

            {discount && (
              <p className="mt-2 text-xs italic text-[color:var(--color-sage-deep)]">
                {discount.reason}
              </p>
            )}

            {product.displayPackageNote && (
              <p className="mt-3 text-xs italic text-muted-foreground">
                {formatPublicPriceText(
                  product.displayPackageNote,
                  displayCurrency,
                  pricingSettings,
                )}
              </p>
            )}
          </div>

          {product.includes.length > 0 && (
            <div>
              <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                What is included
              </p>
              <ul className="flex flex-col gap-1.5">
                {product.includes.map((line) => (
                  <li key={line} className="flex items-start gap-2 text-sm text-foreground">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-sage-deep)]"
                      strokeWidth={2.5}
                    />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {product.addOns.length > 0 && (
            <div>
              <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Add-ons
              </p>
              <ul className="flex flex-col gap-2">
                {product.addOns.map((ao) => (
                  <li
                    key={ao.id}
                    className="rounded-lg border border-border/40 bg-secondary/30 px-3 py-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-foreground">{ao.label}</span>
                      <span className="shrink-0 text-foreground">
                        {ao.priceType === "percent"
                          ? `+${ao.priceEur}%`
                          : `+${formatPublicPrice(ao.priceEur, displayCurrency, pricingSettings)}`}
                      </span>
                    </div>
                    {ao.description && (
                      <p className="mt-1 leading-relaxed text-muted-foreground">
                        {ao.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {product.disclaimers && product.disclaimers.length > 0 && (
            <div className="flex gap-2 rounded-lg border border-border/40 bg-secondary/20 p-3 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <ul className="flex flex-col gap-1">
                {product.disclaimers.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-border/40 pt-5">
            {product.inquiryOnly ? (
              <Link
                href={`/contact?service=${product.id}`}
                className="inline-flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
              >
                Send inquiry
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                className="inline-flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
              >
                {product.id === "int-static" || product.id === "int-360"
                  ? "Configure in cart"
                  : "Add to cart"}
              </button>
            )}
            {isInCart && (
              <button
                type="button"
                onClick={handleScrollToCart}
                className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Open in cart <ArrowDownToLine className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
