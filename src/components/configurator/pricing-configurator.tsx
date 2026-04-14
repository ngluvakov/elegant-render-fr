/**
 * PricingConfigurator — Root shell for the interactive pricing configurator.
 * Wraps QuoteProvider context and renders ServiceAdder, QuoteItemCards, and QuoteSummary.
 *
 * Used on: /cene (pricing page).
 */
"use client";

import { QuoteProvider, useQuote } from "./quote-context";
import { ServiceAdder } from "./service-adder";
import { QuoteItemCard } from "./quote-item";
import { QuoteSummary } from "./quote-summary";

function ConfiguratorInner() {
  const { calculation } = useQuote();

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[1fr_400px]">
      {/* Main column */}
      <div className="space-y-8">
        {/* Service browser */}
        <section>
          <h2 className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.28em] text-muted-foreground">
            Izaberite uslugu
          </h2>
          <ServiceAdder />
        </section>

        {/* Added items */}
        {calculation.items.length > 0 && (
          <section>
            <h2 className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.28em] text-muted-foreground">
              Vaše stavke ({calculation.items.length})
            </h2>
            <div className="space-y-4">
              {calculation.items.map((breakdown) => (
                <QuoteItemCard
                  key={breakdown.instanceId}
                  breakdown={breakdown}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sidebar */}
      <aside className="xl:sticky xl:top-24 xl:self-start">
        <QuoteSummary />
      </aside>
    </div>
  );
}

export function PricingConfigurator() {
  return (
    <QuoteProvider>
      <ConfiguratorInner />
    </QuoteProvider>
  );
}
