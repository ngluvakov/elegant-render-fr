/**
 * StandaloneAiCredits — Compact AI-credits picker that lives on /cene
 * between the service preview cards and the configurator. Lets a customer
 * who came only for AI photo edits add credits in one click without first
 * configuring an architectural service.
 *
 * Reads/writes the same QuoteContext as the configurator below, so the
 * QuoteSummary sidebar and the in-configurator <details> disclosure stay
 * in sync — no event plumbing or sessionStorage handoff needed.
 *
 * Mounted inside the same <QuoteProvider> as the configurator (see
 * src/app/(marketing)/cene/page.tsx).
 */
"use client";

import { Check, Coins, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionKicker } from "@/components/brand/section-kicker";
import {
  AI_CREDIT_PRODUCT_ID,
  calculateAiCreditPurchase,
} from "@/lib/ai-studio/catalog";
import {
  formatPublicPriceFromCents,
  type DisplayCurrency,
} from "@/lib/catalog/display-currency";
import { useQuote } from "./quote-context";

const PACKAGES = [10, 25, 50, 100] as const;

export function StandaloneAiCredits() {
  const { items, setAiCredits, displayCurrency } = useQuote();
  const existingCredits =
    items.find((item) => item.productId === AI_CREDIT_PRODUCT_ID)
      ?.aiCreditQuantity ?? 0;

  return (
    <section className="pt-10 pb-2">
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <SectionKicker>AI Studio krediti</SectionKicker>
            <h2 className="mt-3 text-3xl leading-tight text-foreground md:text-4xl">
              Treba vam samo brza AI obrada?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Plaćate samo ono što obradite — od €1 po jednostavnoj obradi.
              Krediti ostaju aktivni 12 meseci od dopune.
            </p>
          </div>
          <a
            href="/ai-studio"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Pogledajte AI alate
          </a>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {PACKAGES.map((credits) => (
            <PackageCard
              key={credits}
              credits={credits}
              isActive={existingCredits === credits}
              displayCurrency={displayCurrency}
              onSelect={() => setAiCredits(credits)}
            />
          ))}
        </div>

        {existingCredits > 0 && !PACKAGES.includes(existingCredits as never) && (
          <p className="mt-3 text-xs text-muted-foreground">
            U vašoj porudžbini je prilagođeni iznos:{" "}
            <strong className="text-foreground">{existingCredits} kredita</strong>
            . Možete ga izmeniti u konfiguratoru ispod.
          </p>
        )}
      </div>
    </section>
  );
}

function PackageCard({
  credits,
  isActive,
  displayCurrency,
  onSelect,
}: {
  credits: number;
  isActive: boolean;
  displayCurrency: DisplayCurrency;
  onSelect: () => void;
}) {
  const purchase = calculateAiCreditPurchase(credits);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isActive}
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-card/80 p-5 text-left transition-all",
        "hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(28,26,25,0.08)]",
        isActive
          ? "border-accent bg-accent/5 shadow-[0_18px_44px_rgba(184,131,99,0.12)]"
          : "border-border/40 hover:border-accent/40",
      )}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-foreground tabular-nums">
          {credits}
        </span>
        <span className="text-sm text-muted-foreground">kredita</span>
      </div>
      <div className="mt-4">
        <div className="text-xl font-semibold text-foreground tabular-nums">
          {formatPublicPriceFromCents(purchase.totalCents, displayCurrency)}
        </div>
        <div className="text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
          {formatPublicPriceFromCents(purchase.centsPerCredit, displayCurrency)}{" "}
          / kredit
        </div>
      </div>
      <div
        className={cn(
          "mt-5 inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-[0.72rem] font-semibold transition-colors",
          isActive
            ? "bg-[color:var(--color-sage)]/15 text-[color:var(--color-sage-deep)]"
            : "bg-accent/12 text-accent group-hover:bg-accent group-hover:text-white",
        )}
      >
        {isActive ? (
          <>
            <Check className="h-3 w-3" />
            U ponudi
          </>
        ) : (
          <>
            <Coins className="h-3 w-3" />
            Dodaj kredite
          </>
        )}
      </div>
    </button>
  );
}
