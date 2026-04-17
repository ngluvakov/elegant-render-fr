/**
 * PricingConfigurator — Root shell for the interactive pricing configurator.
 * Wraps QuoteProvider context and renders ServiceAdder, QuoteItemCards, and QuoteSummary.
 * Listens for chat proposals (er-chat-proposal event + sessionStorage) to auto-add products.
 *
 * Used on: /cene (pricing page).
 */
"use client";

import { useEffect } from "react";
import { QuoteProvider, useQuote } from "./quote-context";
import { ServiceAdder } from "./service-adder";
import { QuoteItemCard } from "./quote-item";
import { QuoteSummary } from "./quote-summary";
import { getConfiguratorProduct } from "@/lib/catalog/configurator";

function ConfiguratorInner() {
  const { calculation, addProduct } = useQuote();

  // Listen for chat proposal events (when user is already on /cene)
  // and check sessionStorage on mount (when navigated from another page)
  useEffect(() => {
    const applyProposal = () => {
      const raw = sessionStorage.getItem("er-chat-proposal");
      if (!raw) return;

      try {
        const ids: string[] = JSON.parse(raw);
        for (const productId of ids) {
          const result = getConfiguratorProduct(productId);
          if (result) {
            addProduct(productId, result.category.id);
          }
        }
        sessionStorage.removeItem("er-chat-proposal");
      } catch {}
    };

    // Check on mount (navigated from another page with proposal)
    applyProposal();

    // Listen for live events (user clicks "Dodaj" while already on /cene)
    window.addEventListener("er-chat-proposal", applyProposal);
    return () => window.removeEventListener("er-chat-proposal", applyProposal);
  }, [addProduct]);

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
