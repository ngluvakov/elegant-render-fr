/**
 * StandaloneAiCredits — Compact AI-credits picker that lives near the top of
 * /cene. Lets a customer who came only for AI photo edits add credits in one
 * click without first configuring an architectural service.
 *
 * Reads/writes the same QuoteContext as the configurator below, so the
 * QuoteSummary sidebar and the in-configurator <details> disclosure stay
 * in sync — no event plumbing or sessionStorage handoff needed.
 *
 * Mounted inside the same <QuoteProvider> as the configurator (see
 * src/app/(marketing)/cene/page.tsx).
 */
"use client";

import { useState } from "react";
import { Check, Coins, Minus, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionKicker } from "@/components/brand/section-kicker";
import {
  AI_CREDIT_PRODUCT_ID,
  calculateAiCreditPurchase,
} from "@/lib/ai-studio/catalog";
import {
  formatPublicPriceFromCents,
  type DisplayCurrency,
  type PublicPricingFormatSettings,
} from "@/lib/catalog/display-currency";
import { useQuote } from "./quote-context";

const PACKAGES = [10, 25, 50, 100] as const;
const MAX_CUSTOM_CREDITS = 999;
const DEFAULT_CUSTOM = 15;

export function StandaloneAiCredits() {
  const { items, setAiCredits, displayCurrency, pricingSettings } = useQuote();
  const tiers = pricingSettings.aiCreditTiers;
  const existingCredits =
    items.find((item) => item.productId === AI_CREDIT_PRODUCT_ID)
      ?.aiCreditQuantity ?? 0;
  const isCustomActive =
    existingCredits > 0 && !PACKAGES.includes(existingCredits as never);

  return (
    <section className="pt-10 pb-2">
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <SectionKicker>AI Studio krediti</SectionKicker>
            <h2 className="mt-3 text-3xl leading-tight text-foreground md:text-4xl">
              AI obrada fotografija odmah, bez čekanja ponude
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Za izmene na postojećim fotografijama kupite paket kredita i
              krenite odmah: uklanjanje elemenata, dan-u-noć, zamena neba, boja
              zidova, staging i renovacija. Jednostavne obrade kreću od{" "}
              {formatPublicPriceFromCents(100, displayCurrency, pricingSettings)};
              krediti važe {pricingSettings.aiCreditExpiresAfterMonths} meseci
              od dopune.
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
              pricingSettings={pricingSettings}
              tiers={tiers}
              onSelect={() => setAiCredits(credits)}
            />
          ))}
        </div>

        <CustomAmountRow
          key={isCustomActive ? `custom-${existingCredits}` : "custom-default"}
          existingCredits={existingCredits}
          isCustomActive={isCustomActive}
          displayCurrency={displayCurrency}
          pricingSettings={pricingSettings}
          tiers={tiers}
          onCommit={(credits) => setAiCredits(credits)}
        />
      </div>
    </section>
  );
}

function PackageCard({
  credits,
  isActive,
  displayCurrency,
  pricingSettings,
  tiers,
  onSelect,
}: {
  credits: number;
  isActive: boolean;
  displayCurrency: DisplayCurrency;
  pricingSettings?: PublicPricingFormatSettings;
  tiers: Parameters<typeof calculateAiCreditPurchase>[1];
  onSelect: () => void;
}) {
  const purchase = calculateAiCreditPurchase(credits, tiers);
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
          {formatPublicPriceFromCents(
            purchase.totalCents,
            displayCurrency,
            pricingSettings,
          )}
        </div>
        <div className="text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
          {formatPublicPriceFromCents(
            purchase.centsPerCredit,
            displayCurrency,
            pricingSettings,
          )}{" "}
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

/**
 * Free-form credit amount for customers who want a number that isn't one
 * of the preset packages. Mirrors the in-configurator AiCreditAdder's
 * stepper but as a single inline row to keep the standalone section
 * compact. Local state isolates the in-progress number from the cart;
 * the cart commits only on Dodaj/Ažuriraj. The parent key remounts this
 * row when an external custom credit amount changes.
 */
function CustomAmountRow({
  existingCredits,
  isCustomActive,
  displayCurrency,
  pricingSettings,
  tiers,
  onCommit,
}: {
  existingCredits: number;
  isCustomActive: boolean;
  displayCurrency: DisplayCurrency;
  pricingSettings?: PublicPricingFormatSettings;
  tiers: Parameters<typeof calculateAiCreditPurchase>[1];
  onCommit: (credits: number) => void;
}) {
  const [draft, setDraft] = useState<number>(
    isCustomActive ? existingCredits : DEFAULT_CUSTOM,
  );

  const clamp = (n: number) =>
    Math.max(1, Math.min(MAX_CUSTOM_CREDITS, Math.floor(n) || 1));
  const update = (next: number) => setDraft(clamp(next));

  const purchase = calculateAiCreditPurchase(draft, tiers);
  const isCommitted = isCustomActive && existingCredits === draft;

  return (
    <div className="mt-4 rounded-2xl border border-border/40 bg-card/60 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Ili unesite tačan broj kredita
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Sistem automatski primenjuje najbolju cenu po količini.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-lg border border-border/60 bg-background/60">
            <button
              type="button"
              onClick={() => update(draft - 1)}
              disabled={draft <= 1}
              aria-label="Smanji broj kredita"
              className="flex h-9 w-9 items-center justify-center rounded-l-lg transition-colors hover:bg-muted disabled:opacity-30"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <input
              type="number"
              min={1}
              max={MAX_CUSTOM_CREDITS}
              value={draft}
              onChange={(e) => update(Number(e.target.value))}
              aria-label="Broj kredita"
              className="h-9 w-16 border-x border-border/60 bg-transparent text-center text-sm font-semibold text-foreground tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => update(draft + 1)}
              disabled={draft >= MAX_CUSTOM_CREDITS}
              aria-label="Povećaj broj kredita"
              className="flex h-9 w-9 items-center justify-center rounded-r-lg transition-colors hover:bg-muted disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="text-right">
            <div className="text-base font-semibold text-foreground tabular-nums">
              {formatPublicPriceFromCents(
                purchase.totalCents,
                displayCurrency,
                pricingSettings,
              )}
            </div>
            <div className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
              {formatPublicPriceFromCents(
                purchase.centsPerCredit,
                displayCurrency,
                pricingSettings,
              )}{" "}
              / kredit
            </div>
          </div>

          <button
            type="button"
            onClick={() => onCommit(draft)}
            disabled={isCommitted}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors",
              isCommitted
                ? "bg-[color:var(--color-sage)]/15 text-[color:var(--color-sage-deep)]"
                : "bg-accent text-white hover:bg-accent/90",
            )}
          >
            {isCommitted ? (
              <>
                <Check className="h-3 w-3" />
                U ponudi
              </>
            ) : isCustomActive ? (
              <>
                <Coins className="h-3 w-3" />
                Ažuriraj
              </>
            ) : (
              <>
                <Coins className="h-3 w-3" />
                Dodaj kredite
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
