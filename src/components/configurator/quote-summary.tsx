/**
 * QuoteSummary — Sticky dark sidebar showing line items, estimated total,
 * and the order CTA that saves the quote to sessionStorage.
 *
 * Used on: PricingConfigurator (sidebar column, /tarifs page).
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
      total_eur: calculation.total,
    });
    router.push("/commande");
  };

  const handleInquiryFromQuote = () => {
    openInquiry({
      source: "quote-summary",
      sourceLabel: "Préparer mon devis",
      serviceType: "Articles déjà sélectionnés dans le configurateur",
      quoteSnapshot: {
        totalEur: calculation.total,
        originalTotalEur: calculation.originalTotal,
        items: calculation.items.map((item) => ({
          productId: item.productId,
          productLabel: item.productLabel,
          categoryLabel: item.categoryLabel,
          totalEur: item.totalEur,
          addOns: item.addOns
            .filter((addOn) => addOn.billableQty > 0)
            .map((addOn) => ({
              label: addOn.label,
              qty: addOn.billableQty,
              totalEur: addOn.totalEur,
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
    const url = `${window.location.origin}/tarifs?q=${result.token}`;
    setShareState({ kind: "saved", url, copied: false });
    track("quote_saved", {
      cart_size: calculation.items.length,
      total_eur: calculation.total,
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
    <div className="overflow-hidden rounded-lg border border-foreground/10 bg-foreground text-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-background/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-background/60" />
          <h3 className="text-sm font-semibold text-background">
            Votre devis
          </h3>
          {hasItems && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[0.72rem] font-bold text-accent-foreground">
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
            Vider
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
              Aucun service dans le devis pour l’instant
            </p>
            <p className="mt-1 text-xs text-background/30">
              Choisissez un service dans la liste ci-dessus
            </p>
          </div>
        )}

        {calculation.items.map((item) => {
          const billableAddOns = item.addOns.filter(
            (a) => a.billableQty > 0,
          ).length;
          const { primary, struck } = formatPublicDiscountedPrice(
            item.totalEur,
            item.originalTotalEur,
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
                      + {billableAddOns} {billableAddOns === 1 ? "option" : "options"}
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
                aria-label="Retirer l’article"
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
                  Économies
                  <Info
                    className={cn(
                      "h-3 w-3 transition-colors",
                      explainerOpen && "text-accent",
                    )}
                  />
                </button>
                <p className="font-semibold text-accent">
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
                    Lorsque vous commandez plusieurs services ensemble, le
                    modèle 3D créé pour l’un peut être réutilisé pour les
                    autres ; ces services supplémentaires bénéficient donc
                    d’une remise automatique.
                  </p>
                  <ul className="mt-2 space-y-1">
                    <li>
                      • Extérieur + extérieur 360° → le 360° est à{" "}
                      <strong className="text-accent">
                        −40 %
                      </strong>{" "}
                      (l’extérieur est déjà modélisé)
                    </li>
                    <li>
                      • Intérieur + plan 3D → le plan est à{" "}
                      <strong className="text-accent">
                        −70 %
                      </strong>{" "}
                      (l’espace est déjà modélisé)
                    </li>
                    <li>
                      • Animation + extérieur → les deux bénéficient d’une
                      remise, car ils partagent le même modèle
                    </li>
                  </ul>
                  <p className="mt-2 text-background/40">
                    Les remises ne se cumulent pas — la meilleure s’applique toujours.
                  </p>
                </div>
              </Collapsible>
            </div>
          )}
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-background/60">Prix estimé</p>
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
            Commander
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleInquiryFromQuote}
            className="mt-2 w-full rounded-xl border border-background/15 px-4 py-3 text-sm font-medium text-background/80 transition-colors hover:bg-background/10 hover:text-background"
          >
            Demander un devis à l’équipe
          </button>
          <p className="mt-3 text-center text-[0.7rem] text-background/40">
            Sans inscription — commandez en quelques étapes.
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
                Enregistrer et partager le devis
              </button>
            )}
            {shareState.kind === "saving" && (
              <p className="text-center text-[0.72rem] text-background/40">
                Enregistrement…
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
                  Le lien est valable 30 jours. L’ouvrir recharge les mêmes articles.
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
                        Copié
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copier
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="mt-3 text-center text-[0.68rem] text-background/30">
            Les prix sont indicatifs. Le devis final peut varier selon les
            spécificités du projet. {pricingTerms.shortNote}
          </p>
        </div>
      )}
    </div>
  );
}
