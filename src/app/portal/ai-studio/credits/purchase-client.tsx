"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiCreditAdder } from "@/components/configurator/ai-credit-adder";
import { QuoteProvider, useQuote } from "@/components/configurator/quote-context";
import { formatCreditsFromUnits } from "@/lib/ai-studio/catalog";
import {
  formatPublicPriceFromCents,
  type DisplayCurrency,
} from "@/lib/catalog/display-currency";
import { stashCheckoutQuote } from "@/lib/checkout-session";
import type { ResolvedPricingCatalog } from "@/lib/pricing/catalog";

export function AiCreditPurchaseClient({
  pricingCatalog,
  displayCurrency,
}: {
  pricingCatalog: ResolvedPricingCatalog;
  displayCurrency: DisplayCurrency;
}) {
  return (
    <QuoteProvider
      pricingCatalog={pricingCatalog}
      displayCurrency={displayCurrency}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/portal/ai-studio"
              className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à l’AI Studio
            </Link>
            <h1 className="mt-3 font-heading text-3xl text-foreground md:text-4xl">
              Crédits IA
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Les crédits sont activés immédiatement après le paiement et
              restent valables{" "}
              {pricingCatalog.settings.aiCreditExpiresAfterMonths} mois.
              Chaque recharge prolonge la date d’expiration de l’ensemble du
              solde actif.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <AiCreditAdder />
          <PortalCreditSummary />
        </div>
      </div>
    </QuoteProvider>
  );
}

function PortalCreditSummary() {
  const { items, calculation, clearAll, displayCurrency, pricingSettings } =
    useQuote();
  const router = useRouter();
  const creditItem = calculation.items.find((item) => item.kind === "ai_credits");
  const hasCredits = Boolean(creditItem);

  const handleOrder = () => {
    if (!hasCredits) return;
    // Don't pre-stash the withdrawal waiver here — /commande step-details
    // is the canonical place that surfaces it alongside the final total
    // in the buyer's currency. Pre-stashing would auto-submit and skip
    // that review.
    stashCheckoutQuote(items);
    router.push("/commande");
  };

  return (
    <aside className="rounded-lg border border-border/60 bg-card/80 p-5">
      <div className="flex items-center gap-2">
        <Coins className="h-4 w-4 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">Récapitulatif d’achat</h2>
      </div>

      {creditItem ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-border/50 bg-background/50 p-4">
            <p className="text-sm font-semibold text-foreground">
              {formatCreditsFromUnits(creditItem.aiCreditUnits ?? 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {creditItem.aiCreditQuantity} crédits ·{" "}
              {formatPublicPriceFromCents(
                creditItem.totalCents,
                displayCurrency,
                pricingSettings,
              )}
            </p>
          </div>
          <div className="flex items-center justify-between border-t border-border/50 pt-4">
            <span className="text-sm text-muted-foreground">
              Total (TVA incluse)
            </span>
            <span className="text-2xl font-bold text-foreground">
              {formatPublicPriceFromCents(
                calculation.totalCents,
                displayCurrency,
                pricingSettings,
              )}
            </span>
          </div>
          <Button
            type="button"
            variant="accent"
            size="xl"
            className="w-full"
            onClick={handleOrder}
          >
            Continuer vers le paiement
            <ArrowRight className="h-4 w-4" />
          </Button>
          <button
            type="button"
            onClick={clearAll}
            className="w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Effacer la sélection
          </button>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-border/70 p-6 text-center">
          <p className="text-sm font-semibold text-foreground">
            Choisissez la quantité de crédits
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Après avoir cliqué sur « Ajouter des crédits », la commande suit
            le même parcours de paiement.
          </p>
        </div>
      )}
    </aside>
  );
}
