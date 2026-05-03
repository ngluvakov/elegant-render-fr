"use client";

import { useMemo, useState } from "react";
import { Coins, Minus, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AI_CREDIT_PRODUCT_ID,
  AI_CREDIT_TIERS,
  calculateAiCreditPurchase,
} from "@/lib/ai-studio/catalog";
import { formatPublicPriceFromCents } from "@/lib/catalog/display-currency";
import { useQuote } from "./quote-context";

const PRESETS = [10, 25, 50, 100];

export function AiCreditAdder() {
  const { setAiCredits, items, displayCurrency } = useQuote();
  const existingCredits =
    items.find((item) => item.productId === AI_CREDIT_PRODUCT_ID)
      ?.aiCreditQuantity ?? 0;
  const [credits, setCredits] = useState(existingCredits || 10);
  const purchase = useMemo(() => calculateAiCreditPurchase(credits), [credits]);

  const updateCredits = (next: number) => {
    setCredits(Math.max(1, Math.floor(next) || 1));
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-[0_14px_40px_rgba(28,26,25,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            AI Studio
          </div>
          <h3 className="mt-3 text-lg font-semibold text-foreground">
            Dodajte AI kredite u istu porudžbinu
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Krediti se aktiviraju odmah nakon plaćanja. Jedan kredit pokriva
            jednu kompleksnu ili dve jednostavne AI obrade.
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">
            {formatPublicPriceFromCents(
              purchase.totalCents,
              displayCurrency,
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatPublicPriceFromCents(
              purchase.centsPerCredit,
              displayCurrency,
            )}{" "}
            po kreditu
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px]">
        <div className="grid gap-2 sm:grid-cols-4">
          {PRESETS.map((preset) => {
            const meta = calculateAiCreditPurchase(preset);
            const active = credits === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => updateCredits(preset)}
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  active
                    ? "border-accent bg-accent/10"
                    : "border-border/60 bg-background/50 hover:border-accent/40"
                }`}
              >
                <span className="block text-sm font-semibold text-foreground">
                  {preset} kredita
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {formatPublicPriceFromCents(
                    meta.totalCents,
                    displayCurrency,
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-border/50 bg-background/50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Slobodan unos
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => updateCredits(credits - 1)}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <Input
              type="number"
              min={1}
              value={credits}
              onChange={(event) => updateCredits(Number(event.target.value))}
              className="h-9 text-center"
            />
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => updateCredits(credits + 1)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
        <div className="flex flex-wrap gap-2 text-[0.72rem] text-muted-foreground">
          {AI_CREDIT_TIERS.slice().reverse().map((tier, index) => {
            const next = AI_CREDIT_TIERS.slice().reverse()[index + 1];
            const label = next
              ? `${tier.minCredits}-${next.minCredits - 1}`
              : `${tier.minCredits}+`;
            return (
              <span key={tier.minCredits} className="rounded-full bg-secondary/60 px-2.5 py-1">
                {label}:{" "}
                {formatPublicPriceFromCents(
                  tier.centsPerCredit,
                  displayCurrency,
                )}
                /kredit
              </span>
            );
          })}
        </div>
        <Button
          type="button"
          variant="accent"
          onClick={() => setAiCredits(credits)}
        >
          <Coins className="h-4 w-4" />
          {existingCredits > 0 ? "Ažuriraj kredite" : "Dodaj kredite"}
        </Button>
      </div>
    </div>
  );
}
