/**
 * PricingBreakdown — Reusable "Sastav cene" panel that lists the base
 * price plus each billable add-on with its line total. Surfaces the
 * pricing inputs the customer has accumulated so they can see exactly
 * where the total comes from before they pay.
 *
 * Two ways to feed it:
 *  - `breakdown` — pass a catalog `LineItemBreakdown` (landscape, siteplan)
 *  - `rows` + `total` — pass explicit rows for sections with a custom
 *    calc that doesn't fit `LineItemBreakdown` (interior, int-360 per-floor)
 *
 * Use `extras` for line items the catalog calculator doesn't model
 * (e.g. tour-assembly fees) — works with either feed.
 */
"use client";

import type { LineItemBreakdown } from "@/lib/catalog/calculate";
import { useOrderCurrency } from "@/components/portal/order-currency-context";

type Extra = { label: string; eur: number };
type ExplicitRow = { label: string; value: number; sub?: string };

type Props = {
  breakdown?: LineItemBreakdown;
  rows?: ExplicitRow[];
  total?: number;
  extras?: Extra[];
  baseLabel?: string;
  title?: string;
};

export function PricingBreakdown({
  breakdown,
  rows,
  total: totalOverride,
  extras = [],
  baseLabel = "Cena",
  title = "Sastav cene",
}: Props) {
  const { formatPrice } = useOrderCurrency();
  const extrasTotal = extras.reduce((s, e) => s + e.eur, 0);

  let lineRows: ExplicitRow[];
  let total: number;
  if (breakdown) {
    const billableAddOns = breakdown.addOns.filter((a) => a.totalEur > 0);
    lineRows = [
      { label: baseLabel, value: breakdown.basePriceEur },
      ...billableAddOns.map((a) => ({
        label: a.billableQty > 1 ? `${a.label} × ${a.billableQty}` : a.label,
        value: a.totalEur,
        sub: a.isVolumeRate
          ? `veća količina ${formatPrice(a.unitPriceEur)}/kom`
          : undefined,
      })),
    ];
    total = breakdown.totalEur + extrasTotal;
  } else if (rows && totalOverride !== undefined) {
    lineRows = rows;
    total = totalOverride + extrasTotal;
  } else {
    return null;
  }

  return (
    <div className="space-y-2 rounded-md border border-border/30 bg-card/60 p-3">
      <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="space-y-1 text-[0.78rem]">
        {lineRows.map((r, i) => (
          <Row key={`r-${i}`} label={r.label} value={r.value} sub={r.sub} />
        ))}
        {extras.map((e, i) => (
          <Row key={`x-${i}`} label={e.label} value={e.eur} />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border/30 pt-1.5 text-foreground">
        <span className="text-sm font-medium">Ukupno</span>
        <span className="text-base font-bold tabular-nums">
          {formatPrice(total)}
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
  const { formatPrice } = useOrderCurrency();
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
        {formatPrice(value)}
      </span>
    </div>
  );
}
