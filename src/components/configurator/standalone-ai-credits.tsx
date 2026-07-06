/**
 * StandaloneAiCredits — Compact AI-credits picker that lives near the top of
 * /pricing. Lets a customer who came only for AI photo edits add credits in one
 * click without first configuring an architectural service.
 *
 * Reads/writes the same QuoteContext as the configurator below, so the
 * QuoteSummary sidebar and the in-configurator <details> disclosure stay
 * in sync — no event plumbing or sessionStorage handoff needed.
 *
 * Mounted inside the same <QuoteProvider> as the configurator (see
 * src/app/(marketing)/pricing/page.tsx).
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
  const entryTier = tiers.reduce(
    (best: (typeof tiers)[number] | null, tier) =>
      !best || tier.minCredits < best.minCredits ? tier : best,
    null,
  );
  const simpleStartingCents = Math.round(
    (entryTier?.centsPerCredit ?? 50) /
      pricingSettings.aiCreditUnitsPerCredit,
  );
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
            <SectionKicker>AI Studio credits</SectionKicker>
            <h2 className="mt-3 text-3xl leading-tight text-foreground md:text-4xl">
              AI photo editing right away, without waiting for an estimate
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              For edits to existing photos, buy a credit package and start
              right away: item removal, day-to-dusk, sky replacement, wall
              colours, staging, and renovation. Simple edits start from{" "}
              {formatPublicPriceFromCents(
                simpleStartingCents,
                displayCurrency,
                pricingSettings,
              )};
              credits are valid for {pricingSettings.aiCreditExpiresAfterMonths} months
              from top-up.
            </p>
          </div>
          <a
            href="/ai-studio"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
          >
            <Sparkles className="h-3.5 w-3.5" />
            View AI tools
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
        <span className="text-sm text-muted-foreground">credits</span>
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
          / credit
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
            In estimate
          </>
        ) : (
          <>
            <Coins className="h-3 w-3" />
            Add credits
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
 * the cart commits only on Add/Update. The parent key remounts this
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
            Or enter an exact number of credits
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            The system automatically applies the best volume price.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-lg border border-border/60 bg-background/60">
            <button
              type="button"
              onClick={() => update(draft - 1)}
              disabled={draft <= 1}
              aria-label="Decrease credit count"
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
              aria-label="Credit count"
              className="h-9 w-16 border-x border-border/60 bg-transparent text-center text-sm font-semibold text-foreground tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => update(draft + 1)}
              disabled={draft >= MAX_CUSTOM_CREDITS}
              aria-label="Increase credit count"
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
              / credit
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
                In estimate
              </>
            ) : isCustomActive ? (
              <>
                <Coins className="h-3 w-3" />
                Update
              </>
            ) : (
              <>
                <Coins className="h-3 w-3" />
                Add credits
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
