/**
 * QuoteSummary — Sticky dark sidebar showing line items, estimated total,
 * and the "Naruci" (order) CTA that saves the quote to sessionStorage.
 *
 * Used on: PricingConfigurator (sidebar column, /cene page).
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Copy,
  Info,
  Share2,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Collapsible } from "@/components/ui/collapsible";
import { useQuickInquiry } from "@/components/inquiry/quick-inquiry-provider";
import {
  formatPublicDiscountedPrice,
  formatPublicPrice,
  getPublicPricingTerms,
} from "@/lib/catalog/display-currency";
import { saveQuote } from "@/server/actions/quote";
import { track } from "@/lib/posthog-events";
import { stashCheckoutQuote } from "@/lib/checkout-session";
import { buildBeginCheckoutDataLayerEvent } from "@/lib/analytics/google-data-layer";
import { pushGoogleDataLayerEvent } from "@/lib/analytics/google-data-layer-client";
import { useQuote } from "./quote-context";

export function QuoteSummary() {
  const {
    items,
    calculation,
    clearAll,
    removeProduct,
    displayCurrency,
    pricingSettings,
  } = useQuote();
  const [explainerOpen, setExplainerOpen] = useState(false);
  const [shareState, setShareState] = useState<
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "saved"; url: string; copied: boolean }
    | { kind: "error"; message: string }
  >({ kind: "idle" });
  const hasItems = calculation.items.length > 0;
  const pricingTerms = getPublicPricingTerms(displayCurrency);
  const router = useRouter();
  const { openInquiry } = useQuickInquiry();

  const handleOrder = () => {
    stashCheckoutQuote(items);
    const beginCheckoutEvent = buildBeginCheckoutDataLayerEvent({
      calculation,
      displayCurrency,
      pricingSettings,
      sourcePath: window.location.pathname,
      conversionSource: "quote_summary",
    });
    pushGoogleDataLayerEvent(beginCheckoutEvent);
    track("checkout_started", {
      cart_size: calculation.items.length,
      total_rsd: calculation.total,
    });
    router.push("/poruci");
  };

  const handleInquiryFromQuote = () => {
    openInquiry({
      source: "quote-summary",
      sourceLabel: "Preuzmite moju ponudu",
      serviceType: "Već izabrane stavke iz konfiguratora",
      quoteSnapshot: {
        totalRsd: calculation.total,
        originalTotalRsd: calculation.originalTotal,
        items: calculation.items.map((item) => ({
          productId: item.productId,
          productLabel: item.productLabel,
          categoryLabel: item.categoryLabel,
          totalRsd: item.totalRsd,
          addOns: item.addOns
            .filter((addOn) => addOn.billableQty > 0)
            .map((addOn) => ({
              label: addOn.label,
              qty: addOn.billableQty,
              totalRsd: addOn.totalRsd,
            })),
        })),
      },
    });
  };

  // Empty cart should drop any stale share UI — that link snapshot is no
  // longer relevant once the customer cleared everything.
  useEffect(() => {
    if (!hasItems && shareState.kind !== "idle") {
      queueMicrotask(() => setShareState({ kind: "idle" }));
    }
  }, [hasItems, shareState.kind]);

  const handleShare = async () => {
    setShareState({ kind: "saving" });
    const result = await saveQuote(items);
    if ("error" in result) {
      setShareState({ kind: "error", message: result.error });
      return;
    }
    const url = `${window.location.origin}/cene?q=${result.token}`;
    setShareState({ kind: "saved", url, copied: false });
    track("quote_saved", {
      cart_size: calculation.items.length,
      total_rsd: calculation.total,
    });
  };

  const handleCopy = async () => {
    if (shareState.kind !== "saved") return;
    try {
      await navigator.clipboard.writeText(shareState.url);
      setShareState({ ...shareState, copied: true });
      setTimeout(() => {
        setShareState((cur) =>
          cur.kind === "saved" ? { ...cur, copied: false } : cur,
        );
      }, 2000);
    } catch {
      // Clipboard API blocked — leave URL visible for manual copy
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-foreground/10 bg-foreground text-background shadow-[0_30px_80px_rgba(28,26,25,0.22)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-background/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-background/60" />
          <h3 className="text-sm font-semibold text-background">
            Vaša ponuda
          </h3>
          {hasItems && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[0.72rem] font-bold text-white">
              {calculation.items.length}
            </span>
          )}
        </div>
        {hasItems && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-background/50 transition-colors hover:text-background/80"
          >
            <Trash2 className="h-3 w-3" />
            Obriši
          </button>
        )}
      </div>

      {/* Line items */}
      <div className="px-5 py-4">
        {!hasItems && (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-background/10">
              <ShoppingCart className="h-5 w-5 text-background/30" />
            </div>
            <p className="text-sm text-background/50">
              Još nema usluga u ponudi
            </p>
            <p className="mt-1 text-xs text-background/30">
              Izaberite uslugu iz liste iznad
            </p>
          </div>
        )}

        {calculation.items.map((item) => {
          const billableAddOns = item.addOns.filter(
            (a) => a.billableQty > 0,
          ).length;
          const { primary, struck } = formatPublicDiscountedPrice(
            item.totalRsd,
            item.originalTotalRsd,
            item.discountPct,
            displayCurrency,
            pricingSettings,
          );
          return (
            <div
              key={item.instanceId}
              className="flex items-center justify-between border-b border-background/5 py-2.5 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-background/85">
                  {item.productLabel}
                </p>
                <p className="text-xs text-background/45">
                  {item.categoryLabel}
                  {billableAddOns > 0 && (
                    <span className="text-accent">
                      {" "}
                      + {billableAddOns} {billableAddOns === 1 ? "dodatak" : "dodatnih opcija"}
                    </span>
                  )}
                </p>
              </div>
              <p className="ml-3 flex-shrink-0 text-right text-sm font-semibold text-background">
                {struck && (
                  <span className="mr-1.5 text-xs font-normal text-background/35 line-through">
                    {struck}
                  </span>
                )}
                {primary}
              </p>
              <button
                type="button"
                onClick={() => removeProduct(item.instanceId)}
                aria-label="Ukloni stavku"
                className="ml-2 flex-shrink-0 rounded p-0.5 text-background/30 transition-colors hover:text-background/70"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Total + CTA */}
      {hasItems && (
        <div className="border-t border-background/10 bg-background/5 px-5 py-4">
          {calculation.originalTotal > calculation.total && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setExplainerOpen((v) => !v)}
                  className="inline-flex items-center gap-1 text-background/50 transition-colors hover:text-background/80"
                  aria-expanded={explainerOpen}
                >
                  Ušteda
                  <Info
                    className={cn(
                      "h-3 w-3 transition-colors",
                      explainerOpen && "text-[color:var(--color-sage)]",
                    )}
                  />
                </button>
                <p className="font-semibold text-[color:var(--color-sage)]">
                  -
                  {formatPublicPrice(
                    calculation.originalTotal - calculation.total,
                    displayCurrency,
                    pricingSettings,
                  )}
                </p>
              </div>
              <Collapsible open={explainerOpen}>
                <div className="mt-2 rounded-lg bg-background/5 p-3 text-[0.72rem] leading-relaxed text-background/60">
                  <p>
                    Kada naručite više usluga zajedno, 3D model koji se
                    pravi za jednu uslugu se može ponovo iskoristiti za
                    druge — pa te dodatne usluge dobijaju automatski
                    popust.
                  </p>
                  <ul className="mt-2 space-y-1">
                    <li>
                      • Eksterijer + 360° eksterijer → 360° je{" "}
                      <strong className="text-[color:var(--color-sage)]">
                        −40%
                      </strong>{" "}
                      (eksterijer je već izgrađen u modelu)
                    </li>
                    <li>
                      • Enterijer + 3D osnova sprata → osnova je{" "}
                      <strong className="text-[color:var(--color-sage)]">
                        −70%
                      </strong>{" "}
                      (prostor je već modelovan)
                    </li>
                    <li>
                      • Animacija + eksterijer → oba dobijaju popust jer
                      svaki deli model sa drugim
                    </li>
                  </ul>
                  <p className="mt-2 text-background/40">
                    Popusti se ne slažu — uvek važi najpovoljniji.
                  </p>
                </div>
              </Collapsible>
            </div>
          )}
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-background/60">Procenjena cena</p>
            <div className="flex flex-col items-end">
              {calculation.originalTotal > calculation.total && (
                <p className="text-sm font-normal text-background/40 line-through tabular-nums">
                  {formatPublicPrice(
                    calculation.originalTotal,
                  displayCurrency,
                  pricingSettings,
                )}
                </p>
              )}
              <p className="text-2xl font-bold text-background tabular-nums">
                {formatPublicPrice(
                  calculation.total,
                  displayCurrency,
                  pricingSettings,
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOrder}
            className={cn(
              buttonVariants({ variant: "accent", size: "xl" }),
              "w-full justify-center rounded-xl",
            )}
          >
            Naruči
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleInquiryFromQuote}
            className="mt-2 w-full rounded-xl border border-background/15 px-4 py-3 text-sm font-medium text-background/80 transition-colors hover:bg-background/10 hover:text-background"
          >
            Neka tim pošalje predlog
          </button>
          <p className="mt-3 text-center text-[0.7rem] text-background/40">
            Bez registracije — naručite u par koraka.
          </p>

          {/* Share quote — saves to DB and returns a tokenized link.
              Lets the customer come back later or send it to a colleague. */}
          <div className="mt-3 border-t border-background/10 pt-3">
            {shareState.kind === "idle" && (
              <button
                type="button"
                onClick={handleShare}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[0.72rem] font-medium text-background/55 transition-colors hover:bg-background/5 hover:text-background/85"
              >
                <Share2 className="h-3 w-3" />
                Sačuvaj i podeli ponudu
              </button>
            )}
            {shareState.kind === "saving" && (
              <p className="text-center text-[0.72rem] text-background/40">
                Čuvanje…
              </p>
            )}
            {shareState.kind === "error" && (
              <p className="text-center text-[0.72rem] text-destructive">
                {shareState.message}
              </p>
            )}
            {shareState.kind === "saved" && (
              <div className="space-y-2">
                <p className="text-[0.7rem] text-background/55">
                  Link važi 30 dana. Otvaranjem se učitavaju iste stavke.
                </p>
                <div className="flex items-center gap-1.5 rounded-lg bg-background/10 p-1.5">
                  <input
                    readOnly
                    value={shareState.url}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 truncate bg-transparent px-2 py-1 text-[0.7rem] text-background/85 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex flex-shrink-0 items-center gap-1 rounded-md bg-background/10 px-2 py-1 text-[0.7rem] font-semibold text-background/85 transition-colors hover:bg-background/20"
                  >
                    {shareState.copied ? (
                      <>
                        <Check className="h-3 w-3" />
                        Kopirano
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Kopiraj
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="mt-3 text-center text-[0.68rem] text-background/30">
            Cene su procene. Konačna ponuda može varirati u zavisnosti od
            specifičnosti projekta. {pricingTerms.shortNote}
          </p>
        </div>
      )}
    </div>
  );
}
