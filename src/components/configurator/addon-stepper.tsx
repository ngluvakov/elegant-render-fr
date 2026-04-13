"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type AddOnStepperProps = {
  label: string;
  description: string;
  quantity: number;
  includedQty: number;
  maxQty: number;
  priceEur: number;
  priceType: "fixed" | "percent";
  isVolumeRate: boolean;
  onChange: (qty: number) => void;
};

export function AddOnStepper({
  label,
  description,
  quantity,
  includedQty,
  maxQty,
  priceEur,
  priceType,
  isVolumeRate,
  onChange,
}: AddOnStepperProps) {
  const billableQty = Math.max(0, quantity - includedQty);
  const isWithinIncluded = includedQty > 0 && quantity <= includedQty;
  const atMax = maxQty !== Infinity && quantity >= maxQty;
  const atMin = quantity <= 0;

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
            <span className="rounded bg-[color:var(--color-sage)]/15 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-[color:var(--color-sage-deep)]">
              Uključeno
            </span>
          )}
          {billableQty > 0 && (
            <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[0.6rem] font-semibold text-accent">
              +{billableQty} extra
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        {isVolumeRate && billableQty > 0 && (
          <p className="mt-0.5 text-[0.68rem] font-medium text-[color:var(--color-sage-deep)]">
            Volumen cena: €{priceEur} po komadu
          </p>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <span className="w-14 text-right text-xs font-medium text-muted-foreground">
          {priceType === "percent" ? `+${priceEur}%` : `€${priceEur}`}
        </span>
        <div className="flex items-center rounded-lg bg-secondary/70">
          <button
            type="button"
            onClick={() => onChange(quantity - 1)}
            disabled={atMin}
            aria-label={`Smanji ${label}`}
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
            aria-label={`Povećaj ${label}`}
            className="flex h-8 w-8 items-center justify-center rounded-r-lg transition-colors hover:bg-muted disabled:opacity-30"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
