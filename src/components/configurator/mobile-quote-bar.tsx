/**
 * MobileQuoteBar — Fixed bottom bar visible only on screens narrower than xl.
 * On desktop the QuoteSummary sidebar is sticky and always visible; on mobile
 * users would otherwise have to scroll the full configurator to see the total,
 * so this bar shows live total + a jump-to-summary CTA.
 *
 * Used on: PricingConfigurator (mounted once, /pricing page).
 */
"use client";

import { ArrowDown } from "lucide-react";
import { formatPublicPrice } from "@/lib/catalog/display-currency";
import { useQuote } from "./quote-context";

export function MobileQuoteBar() {
  const { calculation, displayCurrency, pricingSettings } = useQuote();
  if (calculation.items.length === 0) return null;

  const hasDiscount = calculation.originalTotal > calculation.total;
  const savingsPct = hasDiscount
    ? Math.round(
        ((calculation.originalTotal - calculation.total) /
          calculation.originalTotal) *
          100,
      )
    : 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-foreground/10 bg-foreground text-background shadow-[0_-4px_20px_rgba(0,0,0,0.25)] xl:hidden">
      <div className="mx-auto flex w-full max-w-[min(96vw,1720px)] items-center justify-between gap-3 px-5 py-3">
        <div className="min-w-0 flex-1">
          <div className="text-[0.65rem] font-mono uppercase tracking-[0.08em] text-background/50">
            Estimated price · {calculation.items.length}{" "}
            {calculation.items.length === 1 ? "item" : "items"}
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-lg font-semibold text-background tabular-nums">
              {formatPublicPrice(
                calculation.total,
                displayCurrency,
                pricingSettings,
              )}
            </span>
            {hasDiscount && (
              <>
                <span className="text-xs font-normal text-background/40 line-through tabular-nums">
                  {formatPublicPrice(
                    calculation.originalTotal,
                    displayCurrency,
                    pricingSettings,
                  )}
                </span>
                <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[0.68rem] font-semibold text-accent">
                  −{savingsPct}%
                </span>
              </>
            )}
          </div>
        </div>
        <a
          href="#quote-summary"
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition-colors hover:bg-[var(--color-green-hover)]"
        >
          View estimate
          <ArrowDown className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
