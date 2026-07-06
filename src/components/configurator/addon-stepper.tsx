/**
 * AddOnStepper — Reusable +/- quantity control for product add-ons.
 * Shows included vs. extra quantities, volume pricing, and per-unit cost.
 *
 * Used on: QuoteItemCard (within PricingConfigurator, /pricing page).
 */
"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatPublicPrice,
  formatPublicPriceText,
  type DisplayCurrency,
  type PublicPricingFormatSettings,
} from "@/lib/catalog/display-currency";

type VolumeRule = { afterQty: number; priceEur: number };

type AddOnStepperProps = {
  label: string;
  description: string;
  quantity: number;
  includedQty: number;
  maxQty: number;
  priceEur: number;
  basePriceEur: number;
  priceType: "fixed" | "percent";
  isVolumeRate: boolean;
  volumeRules: VolumeRule[];
  displayCurrency: DisplayCurrency;
  pricingSettings?: PublicPricingFormatSettings;
  onChange: (qty: number) => void;
};

export function AddOnStepper({
  label,
  description,
  quantity,
  includedQty,
  maxQty,
  priceEur,
  basePriceEur,
  priceType,
  isVolumeRate,
  volumeRules,
  displayCurrency,
  pricingSettings,
  onChange,
}: AddOnStepperProps) {
  const billableQty = Math.max(0, quantity - includedQty);
  const isWithinIncluded = includedQty > 0 && quantity <= includedQty;
  const atMax = maxQty !== Infinity && quantity >= maxQty;
  const atMin = quantity <= 0;

  // Pre-threshold hint: only surface upcoming DECREASE tiers (real bulk discounts).
  // Increases are not advertised proactively; only real bulk discounts are.
  const upcomingDiscount = !isVolumeRate
    ? volumeRules
        .filter((r) => r.priceEur < basePriceEur && quantity <= r.afterQty)
        .sort((a, b) => a.afterQty - b.afterQty)[0]
    : undefined;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors",
        billableQty > 0 ? "bg-accent/5" : "bg-transparent",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {isWithinIncluded && quantity > 0 && (
            <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[0.72rem] font-semibold uppercase tracking-wider text-foreground">
              Included
            </span>
          )}
          {billableQty > 0 && (
            <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[0.72rem] font-semibold text-foreground">
              +{billableQty} extra
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatPublicPriceText(description, displayCurrency, pricingSettings)}
        </p>
        {isVolumeRate && billableQty > 0 && (
          <p className="mt-0.5 text-[0.68rem] font-medium text-muted-foreground">
            Volume price:{" "}
            {formatPublicPrice(priceEur, displayCurrency, pricingSettings)} per
            item
          </p>
        )}
        {upcomingDiscount && (
          <p className="mt-0.5 text-[0.68rem] font-medium text-muted-foreground">
            From {upcomingDiscount.afterQty + 1} onward:{" "}
            {formatPublicPrice(
              upcomingDiscount.priceEur,
              displayCurrency,
              pricingSettings,
            )} per
            item
            <span className="ml-1 text-muted-foreground">
              (-
              {formatPublicPrice(
                basePriceEur - upcomingDiscount.priceEur,
                displayCurrency,
                pricingSettings,
              )}
              )
            </span>
          </p>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <span className="w-24 text-right text-xs font-medium text-muted-foreground">
          {priceType === "percent"
            ? `+${priceEur}%`
            : formatPublicPrice(priceEur, displayCurrency, pricingSettings)}
        </span>
        <div className="flex items-center rounded-lg bg-secondary/70">
          <button
            type="button"
            onClick={() => onChange(quantity - 1)}
            disabled={atMin}
            aria-label={`Decrease ${label}`}
            className="flex h-8 w-8 items-center justify-center rounded-l-lg transition-colors hover:bg-muted disabled:opacity-30"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-8 text-center text-sm font-semibold text-foreground">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => onChange(quantity + 1)}
            disabled={atMax}
            aria-label={`Increase ${label}`}
            className="flex h-8 w-8 items-center justify-center rounded-r-lg transition-colors hover:bg-muted disabled:opacity-30"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
