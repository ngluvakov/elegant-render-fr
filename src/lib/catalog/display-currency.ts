/**
 * display-currency.ts — public price presentation seam.
 *
 * EUR is the canonical catalog currency (integer major units). Visitors
 * see prices in the presentment currency chosen from their geo country
 * (chargeCurrencyForCountry), converted via the manual FX snapshot and
 * marketable round-UP rules in src/lib/currency — and they are charged
 * in that same currency via PayPal (WYSIWYG: the checkout snapshot uses
 * the identical conversion). Invoices stay EUR.
 *
 * Used by: /pricing configurator, checkout, portal order views, chat
 * price post-processing, marketing price mentions.
 */

import {
  chargeCurrencyForCountry,
  isChargeCurrency,
  type ChargeCurrency,
} from "@/lib/currency/config";
import {
  convertEurCentsToMinor,
  formatChargeAmount,
} from "@/lib/currency/convert";

const FALLBACK_SERBIA_VAT_RATE = 0.2;

export type DisplayCurrency = ChargeCurrency;

/** Kept for call-site compatibility: pricing settings ride along to the
 * formatters, which no longer need them (FX lives in currency/fx-rates). */
export type PublicPricingFormatSettings = {
  serbiaVatRate: number;
};

function readPublicNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseFloat(raw.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const PUBLIC_SERBIA_VAT_RATE = readPublicNumber(
  "NEXT_PUBLIC_SERBIA_VAT_RATE",
  FALLBACK_SERBIA_VAT_RATE,
);

const eurFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function getDisplayCurrencyForCountry(
  countryCode: string | null | undefined,
): DisplayCurrency {
  return chargeCurrencyForCountry(countryCode);
}

export function isDisplayCurrency(
  value: string | null | undefined,
): value is DisplayCurrency {
  return isChargeCurrency(value);
}

/** Canonical EUR rendering (no conversion) — invoice/EUR-only surfaces. */
export function formatPublicEurAmount(amountEur: number): string {
  return eurFormatter.format(Math.round(amountEur));
}

/** Convert an EUR amount (major units) into the display currency using
 * the same marketable round-UP rules the charge snapshot uses. */
export function formatPublicPrice(
  amountEur: number,
  currency: DisplayCurrency = "EUR",
  _settings?: PublicPricingFormatSettings,
): string {
  void _settings;
  if (!Number.isFinite(amountEur)) return formatPublicEurAmount(0);
  if (amountEur < 0) {
    return `-${formatPublicPrice(-amountEur, currency)}`;
  }
  const { amountMinor } = convertEurCentsToMinor(
    Math.round(amountEur * 100),
    currency,
  );
  return formatChargeAmount(amountMinor, currency);
}

export function formatPublicPriceFromCents(
  cents: number,
  currency: DisplayCurrency = "EUR",
  settings?: PublicPricingFormatSettings,
): string {
  return formatPublicPrice(cents / 100, currency, settings);
}

export type PublicDiscountedPriceParts = {
  primary: string;
  struck: string | null;
  badge: string | null;
};

export type PublicPricingTerms = {
  title: string;
  badge: string;
  lead: string;
  bullets: string[];
  ctaLabel: string;
  shortNote: string;
};

export function formatPublicDiscountedPrice(
  totalEur: number,
  originalTotalEur: number,
  pct: number,
  currency: DisplayCurrency = "EUR",
  settings?: PublicPricingFormatSettings,
): PublicDiscountedPriceParts {
  if (pct <= 0 || totalEur >= originalTotalEur) {
    return {
      primary: formatPublicPrice(totalEur, currency, settings),
      struck: null,
      badge: null,
    };
  }
  return {
    primary: formatPublicPrice(totalEur, currency, settings),
    struck: formatPublicPrice(originalTotalEur, currency, settings),
    badge: `-${pct}%`,
  };
}

/** Rewrite €-amounts inside free text (chat answers, marketing copy)
 * into the display currency — "€169" → "$199", "€100–€200" → ranges. */
export function formatPublicPriceText(
  text: string,
  currency: DisplayCurrency = "EUR",
  settings?: PublicPricingFormatSettings,
): string {
  return text.replace(
    /€\s?(\d+(?:[.,]\d+)?)(?:\s?[–-]\s?(?:€)?\s?(\d+(?:[.,]\d+)?))?/g,
    (match, rawAmount: string, rawRangeEnd?: string) => {
      const amount = Number.parseFloat(rawAmount.replace(",", "."));
      if (!Number.isFinite(amount)) return match;
      const formattedStart = formatPublicPrice(amount, currency, settings);
      if (!rawRangeEnd) return formattedStart;
      const rangeEnd = Number.parseFloat(rawRangeEnd.replace(",", "."));
      if (!Number.isFinite(rangeEnd)) return formattedStart;
      return `${formattedStart}–${formatPublicPrice(rangeEnd, currency, settings)}`;
    },
  );
}

const sharedCommercialTerms = [
  "Every project includes three revision rounds at no extra charge.",
  "If a shot requires additional geometry that is not visible from the primary view, a one-off +25% modelling surcharge applies; after that, all shots are billed at the standard rate.",
  "Larger projects and residential complexes qualify for progressive discounts. Get in touch and we will prepare a tailored quote.",
];

export function getPublicPricingTerms(
  currency: DisplayCurrency = "EUR",
): PublicPricingTerms {
  if (currency === "EUR") {
    return {
      title: "Pricing notes",
      badge: "EUR",
      lead: "Prices are shown and charged in euros.",
      bullets: [
        "Prices are listed in EUR — you pay exactly the amount shown.",
        "The final quote and invoice use the same EUR amount.",
        "Your country is used for invoice details, not to change the price.",
        ...sharedCommercialTerms,
      ],
      ctaLabel: "Request a quote",
      shortNote: "All prices are in EUR.",
    };
  }

  return {
    title: "Pricing notes",
    badge: currency,
    lead: `Prices are shown in ${currency}, converted from our EUR price list.`,
    bullets: [
      `Prices are shown in ${currency}, converted from our EUR price list at a fixed rate.`,
      `You are charged in ${currency} — the amount shown is the amount you pay.`,
      "Your invoice is issued in EUR.",
      ...sharedCommercialTerms,
    ],
    ctaLabel: "Request a quote",
    shortNote: `Prices shown and charged in ${currency}; invoices are issued in EUR.`,
  };
}

export function publicPriceNote(currency: DisplayCurrency = "EUR"): string {
  return getPublicPricingTerms(currency).shortNote;
}
