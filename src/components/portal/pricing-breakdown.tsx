/**
 * PricingBreakdown — Reusable "Sastav cene" panel that lists the base
 * price plus each billable add-on with its line total. Surfaces the
 * pricing inputs the customer has accumulated so they can see exactly
 * where the total comes from before they pay.
 *
 * Used inside the Advanced collapsible of the heavyweight configurators
 * (landscape, siteplan, …). Pass an `extras` prop for line items the
 * catalog calculator doesn't know about (e.g. tour-assembly fees).
 */
"use client";

import type { LineItemBreakdown } from "@/lib/catalog/calculate";
import { formatEur } from "@/lib/catalog/calculate";

type Extra = { label: string; eur: number };

type Props = {
  breakdown: LineItemBreakdown;
  extras?: Extra[];
  baseLabel?: string;
};

export function PricingBreakdown({
  breakdown,
  extras = [],
  baseLabel = "Bazna cena",
}: Props) {
  const billableAddOns = breakdown.addOns.filter((a) => a.totalEur > 0);
  const extrasTotal = extras.reduce((s, e) => s + e.eur, 0);
  const total = breakdown.totalEur + extrasTotal;

  return (
    <div className="space-y-2 rounded-md border border-border/30 bg-card/60 p-3">
      <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
        Sastav cene
      </p>
      <div className="space-y-1 text-[0.78rem]">
        <Row label={baseLabel} value={breakdown.basePriceEur} />
        {billableAddOns.map((a) => (
          <Row
            key={a.addOnId}
            label={
              a.billableQty > 1 ? `${a.label} × ${a.billableQty}` : a.label
            }
            value={a.totalEur}
            sub={a.isVolumeRate ? `volumen €${a.unitPriceEur}/kom` : undefined}
          />
        ))}
        {extras.map((e, i) => (
          <Row key={`x-${i}`} label={e.label} value={e.eur} />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border/30 pt-1.5 text-foreground">
        <span className="text-sm font-medium">Ukupno</span>
        <span className="text-base font-bold tabular-nums">
          {formatEur(total)}
        </span>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <div className="min-w-0 truncate text-foreground">
        <span>{label}</span>
        {sub && (
          <span className="ml-1 text-[0.7rem] text-muted-foreground">
            {sub}
          </span>
        )}
      </div>
      <span className="flex-shrink-0 tabular-nums text-foreground">
        €{value}
      </span>
    </div>
  );
}
