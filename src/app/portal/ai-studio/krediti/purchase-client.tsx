"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiCreditAdder } from "@/components/configurator/ai-credit-adder";
import { QuoteProvider, useQuote } from "@/components/configurator/quote-context";
import { formatCents, formatCreditsFromUnits } from "@/lib/ai-studio/catalog";
import { stashCheckoutQuote } from "@/lib/checkout-session";
import type { ResolvedPricingCatalog } from "@/lib/pricing/catalog";

export function AiCreditPurchaseClient({
  pricingCatalog,
}: {
  pricingCatalog: ResolvedPricingCatalog;
}) {
  return (
    <QuoteProvider pricingCatalog={pricingCatalog}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/portal/ai-studio"
              className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Nazad na AI Studio
            </Link>
            <h1 className="mt-3 font-heading text-3xl text-foreground md:text-4xl">
              AI krediti
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Krediti se aktiviraju odmah nakon plaćanja i važe{" "}
              {pricingCatalog.settings.aiCreditExpiresAfterMonths} meseci.
              Svaka dopuna produžava rok važenja celog aktivnog balansa.
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
  const { items, calculation, clearAll } = useQuote();
  const router = useRouter();
  const [waiveWithdrawal, setWaiveWithdrawal] = useState(false);
  const creditItem = calculation.items.find((item) => item.kind === "ai_credits");
  const hasCredits = Boolean(creditItem);

  const handleOrder = () => {
    if (!hasCredits || !waiveWithdrawal) return;
    stashCheckoutQuote(items, { withdrawalWaivedAt: new Date() });
    router.push("/portal/nova-porudzbina");
  };

  return (
    <aside className="rounded-2xl border border-border/60 bg-card/80 p-5">
      <div className="flex items-center gap-2">
        <Coins className="h-4 w-4 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">Pregled kupovine</h2>
      </div>

      {creditItem ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-border/50 bg-background/50 p-4">
            <p className="text-sm font-semibold text-foreground">
              {formatCreditsFromUnits(creditItem.aiCreditUnits ?? 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {creditItem.aiCreditQuantity} kredita ·{" "}
              {formatCents(creditItem.totalCents)}
            </p>
          </div>
          <div className="flex items-center justify-between border-t border-border/50 pt-4">
            <span className="text-sm text-muted-foreground">Ukupno (bez PDV-a)</span>
            <span className="text-2xl font-bold text-foreground">
              {formatCents(calculation.totalCents)}
            </span>
          </div>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/50 bg-background/50 px-3 py-2.5">
            <input
              type="checkbox"
              checked={waiveWithdrawal}
              onChange={(event) => setWaiveWithdrawal(event.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 cursor-pointer accent-accent"
            />
            <span className="text-xs leading-relaxed text-muted-foreground">
              Pristajem da se AI krediti aktiviraju odmah posle plaćanja i da
              time odustajem od 14-dnevnog povlačenja.{" "}
              <Link
                href="/pravno/uslovi"
                target="_blank"
                className="text-foreground/80 underline-offset-4 hover:underline"
              >
                Detalji
              </Link>
            </span>
          </label>
          <Button
            type="button"
            variant="accent"
            size="xl"
            className="w-full"
            onClick={handleOrder}
            disabled={!waiveWithdrawal}
          >
            Nastavi na plaćanje
            <ArrowRight className="h-4 w-4" />
          </Button>
          <button
            type="button"
            onClick={clearAll}
            className="w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Obriši izbor
          </button>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-border/70 p-6 text-center">
          <p className="text-sm font-semibold text-foreground">
            Izaberite količinu kredita
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Posle klika na “Dodaj kredite”, porudžbina ide kroz isti payment flow.
          </p>
        </div>
      )}
    </aside>
  );
}
