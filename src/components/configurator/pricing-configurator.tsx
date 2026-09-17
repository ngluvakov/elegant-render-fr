/**
 * PricingConfigurator — Root shell for the interactive pricing configurator.
 * Wraps QuoteProvider context and renders ServiceAdder, QuoteItemCards, and QuoteSummary.
 * Listens for chat proposals (er-chat-proposal event + sessionStorage) to auto-add products.
 *
 * Two exports:
 *  - `ConfiguratorBody` — the inner UI without a provider; used when /tarifs
 *    needs to wrap several siblings (standalone AI credits section,
 *    configurator) in a single shared QuoteProvider so credits added in
 *    either place flow through the same cart.
 *  - `PricingConfigurator` — body + provider. Standalone usage; kept for
 *    callers that mount a self-contained configurator.
 *
 * Used on: /tarifs (pricing page).
 */
"use client";

import { Suspense, useEffect, useRef } from "react";
import { ArrowRight, ChevronDown, Plus, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { QuoteProvider, useQuote } from "./quote-context";
import { AiCreditAdder } from "./ai-credit-adder";
import { QuoteItemCard } from "./quote-item";
import { QuoteSummary } from "./quote-summary";
import { MobileQuoteBar } from "./mobile-quote-bar";
import { getConfiguratorProduct } from "@/lib/catalog/configurator";
import {
  formatPublicPrice,
  type DisplayCurrency,
} from "@/lib/catalog/display-currency";
import type { ResolvedPricingCatalog } from "@/lib/pricing/catalog";
import { loadQuote } from "@/server/actions/quote";
import { track } from "@/lib/posthog-events";
import { stashCheckoutQuote } from "@/lib/checkout-session";

export function ConfiguratorBody({
  hideQuoteSummary = false,
}: { hideQuoteSummary?: boolean } = {}) {
  const {
    items,
    calculation,
    addProduct,
    loadItems,
    pricingCatalog,
    displayCurrency,
    pricingSettings,
  } = useQuote();
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleOrder = () => {
    stashCheckoutQuote(items);
    track("checkout_started", {
      cart_size: calculation.items.length,
      total_eur: calculation.total,
    });
    router.push("/commande");
  };
  const sharedToken = searchParams.get("q");
  const prefillProductId = searchParams.get("add");
  const prefillSourceMode = searchParams.get("sourceMode") ?? undefined;
  const hydratedRef = useRef(false);
  const prefilledRef = useRef(false);

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
      router.replace("/tarifs", { scroll: false });
    })();
    return () => {
      cancelled = true;
    };
  }, [sharedToken, loadItems, router]);

  // Homepage and service-card CTAs can deep-link into /tarifs with a product
  // selected. Add it once, then clean the URL so refreshes do not duplicate it.
  useEffect(() => {
    if (!prefillProductId || prefilledRef.current) return;
    prefilledRef.current = true;
    const result = getConfiguratorProduct(
      prefillProductId,
      pricingCatalog?.categories,
    );
    if (result && !result.product.inquiryOnly) {
      addProduct(prefillProductId, result.category.id, prefillSourceMode);
      track("quote_prefilled_from_url", {
        product_id: prefillProductId,
        category_id: result.category.id,
        ...(prefillSourceMode ? { source_mode: prefillSourceMode } : {}),
      });
    }
    router.replace("/tarifs#configurator", { scroll: false });
  }, [
    prefillProductId,
    prefillSourceMode,
    addProduct,
    pricingCatalog,
    router,
  ]);

  // Listen for chat proposal events (when user is already on /tarifs)
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
          const result = getConfiguratorProduct(
            productId,
            pricingCatalog?.categories,
          );
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

    // Listen for live events (user clicks "Add" while already on /tarifs)
    window.addEventListener("er-chat-proposal", applyProposal);
    return () => window.removeEventListener("er-chat-proposal", applyProposal);
  }, [addProduct, pricingCatalog]);

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
      <div
        className={cn(
          "grid items-start gap-8 pb-24 xl:pb-0",
          hideQuoteSummary ? "xl:grid-cols-1" : "xl:grid-cols-[1fr_400px]",
        )}
      >
        {/* Main column */}
        <div className="space-y-8">
          {/* Added items */}
          {calculation.items.length > 0 && (
            <section>
              <h2 className="mb-4 text-[0.7rem] font-bold font-mono uppercase tracking-[0.08em] text-muted-foreground">
                Vos articles ({calculation.items.length})
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
                    .getElementById("usluge")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
              >
                <Plus className="h-4 w-4" />
                Ajouter un autre service
              </button>
              <div className="mt-6 border-t border-border/40 pt-5">
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-2xl font-bold text-foreground tabular-nums">
                    {formatPublicPrice(
                      calculation.total,
                      displayCurrency,
                      pricingSettings,
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleOrder}
                  className={cn(
                    buttonVariants({ variant: "accent", size: "xl" }),
                    "w-full justify-center rounded-xl",
                  )}
                >
                  Commander
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </button>
              </div>
            </section>
          )}

          {/* AI credits — secondary upsell, only after at least one service is added */}
          {calculation.items.length > 0 && (
            <section>
              <details className="group rounded-lg border border-border/40 bg-card/60 p-5 open:bg-card/80 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Sparkles className="h-4 w-4 text-accent" />
                    Ajouter des crédits IA à votre commande
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

        {/* Sidebar — hidden on /tarifs where QuoteSummary lives inside ServiceMatrix */}
        {!hideQuoteSummary && (
          <aside
            id="quote-summary"
            className="xl:sticky xl:top-24 xl:self-start"
          >
            <QuoteSummary />
          </aside>
        )}
      </div>

      <MobileQuoteBar />
    </>
  );
}

export function PricingConfigurator({
  displayCurrency,
  pricingCatalog,
}: {
  displayCurrency: DisplayCurrency;
  pricingCatalog?: ResolvedPricingCatalog;
}) {
  return (
    <QuoteProvider
      displayCurrency={displayCurrency}
      pricingCatalog={pricingCatalog}
    >
      <Suspense fallback={null}>
        <ConfiguratorBody />
      </Suspense>
    </QuoteProvider>
  );
}
