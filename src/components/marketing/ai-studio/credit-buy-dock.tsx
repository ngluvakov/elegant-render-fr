"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Coins, Minus, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AI_CREDIT_CATEGORY_ID,
  AI_CREDIT_PRODUCT_ID,
  calculateAiCreditPurchase,
  type AiCreditTier,
} from "@/lib/ai-studio/catalog";
import type { QuoteItem } from "@/lib/catalog/calculate";
import {
  formatPublicPriceFromCents,
  type DisplayCurrency,
} from "@/lib/catalog/display-currency";
import { stashCheckoutQuote } from "@/lib/checkout-session";
import type { PricingSettings } from "@/lib/pricing/catalog";
import { cn } from "@/lib/utils";

const MIN_CREDITS = 1;
const INPUT_MAX = 9999;
// Slider headroom past the top tier so the thumb can still travel
// (100+) without overflowing the visual track. The number input is
// allowed to go higher (INPUT_MAX) — the slider just clamps visually.
const SLIDER_MAX = 200;

type CreditBuyDockProps = {
  pricingSettings: PricingSettings;
  displayCurrency: DisplayCurrency;
};

/**
 * Sticky right-rail credit picker rendered next to Hero + ToolPicker.
 * Lets the customer type a precise credit count or use a slider to
 * discover the next discount tier, then jumps straight into `/poruci`
 * with the quote pre-loaded into sessionStorage. The wizard accepts
 * guests (creates a passwordless user from email at step 0) and
 * auto-skips the file-upload step for non-service items.
 */
export function CreditBuyDockDesktop({
  pricingSettings,
  displayCurrency,
}: CreditBuyDockProps) {
  return (
    <aside className="sticky top-24 hidden self-start lg:block">
      <CreditPickerCard
        pricingSettings={pricingSettings}
        displayCurrency={displayCurrency}
      />
    </aside>
  );
}

/**
 * Mobile companion: a fixed bottom bar showing the running total and a
 * CTA that opens a bottom sheet with the full picker (slider + input).
 * Hidden on lg+ where the desktop sticky aside takes over.
 */
export function CreditBuyDockMobile({
  pricingSettings,
  displayCurrency,
}: CreditBuyDockProps) {
  const tiers = pricingSettings.aiCreditTiers;
  const [credits, setCredits] = useState(10);
  const [open, setOpen] = useState(false);
  const purchase = useMemo(
    () => calculateAiCreditPurchase(credits, tiers),
    [credits, tiers],
  );
  const router = useRouter();

  const handleBuy = () => {
    stashCreditQuote(credits);
    setOpen(false);
    router.push("/poruci");
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 px-4 py-3 shadow-[0_-12px_40px_rgba(28,26,25,0.08)] backdrop-blur lg:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {credits} {credits === 1 ? "kredit" : "kredita"}
          </p>
          <p className="truncate text-lg font-semibold text-foreground">
            {formatPublicPriceFromCents(
              purchase.totalCents,
              displayCurrency,
              pricingSettings,
            )}
          </p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button variant="accent" size="lg">
                <Coins className="h-4 w-4" />
                Izaberi
              </Button>
            }
          />
          <SheetContent
            side="bottom"
            className="max-h-[90dvh] overflow-y-auto rounded-t-2xl"
          >
            <SheetHeader>
              <SheetTitle>Kupi AI kredite</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-6">
              <CreditPickerBody
                credits={credits}
                onCreditsChange={setCredits}
                pricingSettings={pricingSettings}
                displayCurrency={displayCurrency}
                onConfirm={handleBuy}
                ctaLabel="Idi na plaćanje"
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

function CreditPickerCard({
  pricingSettings,
  displayCurrency,
}: CreditBuyDockProps) {
  const [credits, setCredits] = useState(10);
  const router = useRouter();

  const handleBuy = () => {
    stashCreditQuote(credits);
    router.push("/poruci");
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/85 p-5 shadow-[0_24px_60px_-30px_rgba(28,26,25,0.25)]">
      <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent">
        <Sparkles className="h-3.5 w-3.5" />
        Kupi kredite
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Veći paket — niža cena po kreditu. Klizač pokazuje u kom popustu se
        nalazi vaša porudžbina.
      </p>
      <div className="mt-5">
        <CreditPickerBody
          credits={credits}
          onCreditsChange={setCredits}
          pricingSettings={pricingSettings}
          displayCurrency={displayCurrency}
          onConfirm={handleBuy}
          ctaLabel="Kupi kredite"
        />
      </div>
    </div>
  );
}

type PickerBodyProps = {
  credits: number;
  onCreditsChange: (next: number) => void;
  pricingSettings: PricingSettings;
  displayCurrency: DisplayCurrency;
  onConfirm: () => void;
  ctaLabel: string;
};

function CreditPickerBody({
  credits,
  onCreditsChange,
  pricingSettings,
  displayCurrency,
  onConfirm,
  ctaLabel,
}: PickerBodyProps) {
  const tiers = pricingSettings.aiCreditTiers;
  const sliderId = useId();
  const inputId = useId();

  const purchase = useMemo(
    () => calculateAiCreditPurchase(credits, tiers),
    [credits, tiers],
  );
  const tierMeta = useMemo(() => buildTierMeta(tiers), [tiers]);
  const currentTierIndex = useMemo(
    () => findActiveTierIndex(credits, tierMeta),
    [credits, tierMeta],
  );
  const nextTier = tierMeta[currentTierIndex + 1];
  const nextHint = nextTier
    ? {
        creditsAway: nextTier.minCredits - credits,
        pricePerCredit: nextTier.centsPerCredit,
      }
    : null;

  const clamp = (next: number) =>
    Math.min(INPUT_MAX, Math.max(MIN_CREDITS, Math.floor(next) || MIN_CREDITS));

  const handleInput = (raw: string) => {
    if (raw === "") {
      onCreditsChange(MIN_CREDITS);
      return;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    onCreditsChange(clamp(parsed));
  };

  const sliderValue = Math.min(SLIDER_MAX, credits);

  return (
    <>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Količina
        </p>
        <p className="text-[0.7rem] text-muted-foreground">
          {formatPublicPriceFromCents(
            purchase.centsPerCredit,
            displayCurrency,
            pricingSettings,
          )}{" "}
          / kredit
        </p>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Smanji"
          onClick={() => onCreditsChange(clamp(credits - 1))}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <Input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={MIN_CREDITS}
          max={INPUT_MAX}
          value={credits}
          onChange={(event) => handleInput(event.target.value)}
          className="h-10 text-center text-lg font-semibold tabular-nums"
        />
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Povećaj"
          onClick={() => onCreditsChange(clamp(credits + 1))}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="mt-4">
        <input
          id={sliderId}
          type="range"
          min={MIN_CREDITS}
          max={SLIDER_MAX}
          step={1}
          value={sliderValue}
          onChange={(event) => onCreditsChange(clamp(Number(event.target.value)))}
          aria-label="Broj kredita"
          className={cn(
            "h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary/80 outline-none",
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition",
            "[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:shadow-md",
            "focus-visible:ring-3 focus-visible:ring-ring/50",
          )}
        />
        <div className="mt-2 flex justify-between text-[0.65rem] text-muted-foreground tabular-nums">
          {tierMeta.map((tier) => (
            <span key={tier.minCredits}>{tier.minCredits}</span>
          ))}
          <span>{SLIDER_MAX}+</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-1.5">
        {tierMeta.map((tier, index) => {
          const active = index === currentTierIndex;
          return (
            <button
              key={tier.minCredits}
              type="button"
              onClick={() => onCreditsChange(clamp(tier.minCredits))}
              className={cn(
                "flex flex-col items-start rounded-lg border px-2.5 py-1.5 text-left transition",
                active
                  ? "border-accent bg-accent/10"
                  : "border-border/60 bg-background/40 hover:border-accent/40",
              )}
            >
              <span
                className={cn(
                  "text-[0.65rem] font-bold uppercase tracking-[0.16em]",
                  active ? "text-accent" : "text-muted-foreground",
                )}
              >
                {tier.label}
              </span>
              <span className="text-[0.78rem] font-semibold text-foreground">
                {formatPublicPriceFromCents(
                  tier.centsPerCredit,
                  displayCurrency,
                  pricingSettings,
                )}
                <span className="font-normal text-muted-foreground">
                  {" "}
                  / kredit
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {nextHint && nextHint.creditsAway > 0 && (
        <p className="mt-3 rounded-lg bg-secondary/60 px-3 py-2 text-[0.72rem] leading-relaxed text-foreground/82">
          Dodajte još <strong>{nextHint.creditsAway}</strong>{" "}
          {nextHint.creditsAway === 1 ? "kredit" : "kredita"} i cena pada na{" "}
          <strong>
            {formatPublicPriceFromCents(
              nextHint.pricePerCredit,
              displayCurrency,
              pricingSettings,
            )}
          </strong>{" "}
          po kreditu.
        </p>
      )}

      <div className="mt-4 flex items-baseline justify-between border-t border-border/50 pt-4">
        <span className="text-sm text-muted-foreground">Ukupno (bez PDV)</span>
        <span className="text-2xl font-bold text-foreground tabular-nums">
          {formatPublicPriceFromCents(
            purchase.totalCents,
            displayCurrency,
            pricingSettings,
          )}
        </span>
      </div>

      <Button
        type="button"
        variant="accent"
        size="lg"
        className="mt-4 w-full"
        onClick={onConfirm}
      >
        <Coins className="h-4 w-4" />
        {ctaLabel}
        <ArrowRight className="h-4 w-4" />
      </Button>
      <p className="mt-2 text-center text-[0.7rem] text-muted-foreground">
        Krediti važe {pricingSettings.aiCreditExpiresAfterMonths} meseci. Plaćanje
        kreirate u sledećem koraku.
      </p>
    </>
  );
}

type TierMetaEntry = {
  minCredits: number;
  centsPerCredit: number;
  label: string;
};

function buildTierMeta(tiers: AiCreditTier[]): TierMetaEntry[] {
  const sorted = [...tiers].sort((a, b) => a.minCredits - b.minCredits);
  return sorted.map((tier, index) => {
    const next = sorted[index + 1];
    const label = next
      ? `${tier.minCredits}–${next.minCredits - 1}`
      : `${tier.minCredits}+`;
    return {
      minCredits: tier.minCredits,
      centsPerCredit: tier.centsPerCredit,
      label,
    };
  });
}

function findActiveTierIndex(credits: number, tiers: TierMetaEntry[]): number {
  let active = 0;
  for (let i = 0; i < tiers.length; i += 1) {
    if (credits >= tiers[i].minCredits) active = i;
  }
  return active;
}

function stashCreditQuote(credits: number) {
  const quantity = Math.max(MIN_CREDITS, Math.floor(credits));
  const item: QuoteItem = {
    instanceId: crypto.randomUUID(),
    productId: AI_CREDIT_PRODUCT_ID,
    categoryId: AI_CREDIT_CATEGORY_ID,
    addOnQuantities: {},
    aiCreditQuantity: quantity,
  };
  stashCheckoutQuote([item]);
}
