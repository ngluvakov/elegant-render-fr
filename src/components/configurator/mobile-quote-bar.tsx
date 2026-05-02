/**
 * MobileQuoteBar — Fixed bottom bar visible only on screens narrower than xl.
 * On desktop the QuoteSummary sidebar is sticky and always visible; on mobile
 * users would otherwise have to scroll the full configurator to see the total,
 * so this bar shows live total + a jump-to-summary CTA.
 *
 * Used on: PricingConfigurator (mounted once, /cene page).
 */
"use client";

import { ArrowDown } from "lucide-react";
import { formatEur } from "@/lib/catalog/calculate";
import { useQuote } from "./quote-context";

export function MobileQuoteBar() {
  const { calculation } = useQuote();
  if (calculation.items.length === 0) return null;

  const hasDiscount = calculation.originalTotal > calculation.total;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-foreground/10 bg-foreground text-background shadow-[0_-4px_20px_rgba(28,26,25,0.18)] xl:hidden">
      <div className="mx-auto flex w-full max-w-[min(96vw,1720px)] items-center justify-between gap-3 px-5 py-3">
        <div className="min-w-0 flex-1">
          <div className="text-[0.65rem] uppercase tracking-[0.18em] text-background/50">
            Procenjena cena · {calculation.items.length}{" "}
            {calculation.items.length === 1 ? "stavka" : "stavki"}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-background">
              {formatEur(calculation.total)}
            </span>
            {hasDiscount && (
              <span className="text-xs font-normal text-background/40 line-through">
                {formatEur(calculation.originalTotal)}
              </span>
            )}
          </div>
        </div>
        <a
          href="#quote-summary"
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent/90"
        >
          Pogledaj ponudu
          <ArrowDown className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
