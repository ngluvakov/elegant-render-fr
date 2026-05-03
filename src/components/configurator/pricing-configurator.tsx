/**
 * PricingConfigurator — Root shell for the interactive pricing configurator.
 * Wraps QuoteProvider context and renders ServiceAdder, QuoteItemCards, and QuoteSummary.
 * Listens for chat proposals (er-chat-proposal event + sessionStorage) to auto-add products.
 *
 * Used on: /cene (pricing page).
 */
"use client";

import { Suspense, useEffect, useRef } from "react";
import { ChevronDown, Plus, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { QuoteProvider, useQuote } from "./quote-context";
import { ServiceAdder } from "./service-adder";
import { AiCreditAdder } from "./ai-credit-adder";
import { QuoteItemCard } from "./quote-item";
import { QuoteSummary } from "./quote-summary";
import { MobileQuoteBar } from "./mobile-quote-bar";
import { getConfiguratorProduct } from "@/lib/catalog/configurator";
import type { DisplayCurrency } from "@/lib/catalog/display-currency";
import { loadQuote } from "@/server/actions/quote";
import { track } from "@/lib/posthog-events";

function ConfiguratorInner() {
  const { calculation, addProduct, loadItems } = useQuote();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sharedToken = searchParams.get("q");
  const hydratedRef = useRef(false);

  // Hydrate from a shared quote URL (?q=<token>) on first mount only.
  useEffect(() => {
    if (!sharedToken || hydratedRef.current) return;
    hydratedRef.current = true;
    let cancelled = false;
    (async () => {
      const result = await loadQuote(sharedToken);
      if (cancelled) return;
      if ("items" in result && result.items.length > 0) {
        loadItems(result.items);
        track("quote_loaded_from_share", {
          cart_size: result.items.length,
        });
      }
      // Strip the ?q= from the URL so a refresh doesn't re-hydrate
      // (and a copy-paste doesn't expose the token in the address bar).
      router.replace("/cene", { scroll: false });
    })();
    return () => {
      cancelled = true;
    };
  }, [sharedToken, loadItems, router]);

  // Listen for chat proposal events (when user is already on /cene)
  // and check sessionStorage on mount (when navigated from another page)
  useEffect(() => {
    const applyProposal = () => {
      const raw = sessionStorage.getItem("er-chat-proposal");
      if (!raw) return;

      try {
        const entries: Array<
          { id: string; qty: number; sourceMode?: string } | string
        > = JSON.parse(raw);
        for (const entry of entries) {
          const productId = typeof entry === "string" ? entry : entry.id;
          const qty = typeof entry === "string" ? 1 : (entry.qty || 1);
          const sourceMode =
            typeof entry === "string" ? undefined : entry.sourceMode;
          const result = getConfiguratorProduct(productId);
          if (result) {
            for (let i = 0; i < qty; i++) {
              addProduct(productId, result.category.id, sourceMode);
            }
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

  // Auto-scroll to the newly-added card when a single item is appended.
  // Bulk loads (share-token hydration, multi-item chat proposal) change the
  // count by N>1 — the delta filter skips them so the cursor doesn't strobe.
  const prevItemCountRef = useRef(0);
  useEffect(() => {
    const curr = calculation.items.length;
    const prev = prevItemCountRef.current;
    prevItemCountRef.current = curr;
    if (curr === prev + 1 && curr > 0) {
      requestAnimationFrame(() => {
        const els = document.querySelectorAll<HTMLElement>("[data-quote-item]");
        const last = els[els.length - 1];
        if (!last) return;
        last.scrollIntoView({ behavior: "smooth", block: "center" });
        last.classList.add("flash-new");
        setTimeout(() => last.classList.remove("flash-new"), 800);
      });
    }
  }, [calculation.items.length]);

  return (
    <>
      <div className="grid items-start gap-8 pb-24 xl:grid-cols-[1fr_400px] xl:pb-0">
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
              <button
                type="button"
                onClick={() => {
                  document
                    .getElementById("configurator")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border/60 bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
              >
                <Plus className="h-4 w-4" />
                Dodaj još jednu uslugu
              </button>
            </section>
          )}

          {/* AI credits — secondary upsell, only after at least one service is added */}
          {calculation.items.length > 0 && (
            <section>
              <details className="group rounded-2xl border border-border/40 bg-card/60 p-5 open:bg-card/80 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Sparkles className="h-4 w-4 text-accent" />
                    Dodajte AI kredite uz porudžbinu
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-4">
                  <AiCreditAdder />
                </div>
              </details>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside
          id="quote-summary"
          className="xl:sticky xl:top-24 xl:self-start"
        >
          <QuoteSummary />
        </aside>
      </div>

      <MobileQuoteBar />
    </>
  );
}

export function PricingConfigurator({
  displayCurrency,
}: {
  displayCurrency: DisplayCurrency;
}) {
  return (
    <QuoteProvider displayCurrency={displayCurrency}>
      <Suspense fallback={null}>
        <ConfiguratorInner />
      </Suspense>
    </QuoteProvider>
  );
}
