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

const eurFormatter = new Intl.NumberFormat("fr-FR", {
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
  "Chaque projet comprend trois séries de révisions sans frais supplémentaires.",
  "Si une vue nécessite une géométrie supplémentaire non visible depuis la vue principale, un supplément de modélisation unique de +25 % s’applique ; ensuite, toutes les vues sont facturées au tarif standard.",
  "Les projets de grande envergure et les ensembles résidentiels bénéficient de remises progressives. Contactez-nous et nous préparerons un devis sur mesure.",
];

export function getPublicPricingTerms(
  currency: DisplayCurrency = "EUR",
): PublicPricingTerms {
  if (currency === "EUR") {
    return {
      title: "Notes tarifaires",
      badge: "EUR",
      lead: "Les prix sont affichés et facturés en euros.",
      bullets: [
        "Les prix sont indiqués en EUR — vous payez exactement le montant affiché.",
        "Le devis final et la facture reprennent le même montant en EUR.",
        "Votre pays sert aux informations de facturation, pas à modifier le prix.",
        ...sharedCommercialTerms,
      ],
      ctaLabel: "Demander un devis",
      shortNote: "Tous les prix sont en EUR.",
    };
  }

  return {
    title: "Notes tarifaires",
    badge: currency,
    lead: `Les prix sont affichés en ${currency}, convertis depuis notre grille tarifaire en EUR.`,
    bullets: [
      `Les prix sont affichés en ${currency}, convertis depuis notre grille tarifaire en EUR à taux fixe.`,
      `Le paiement s’effectue en ${currency} — le montant affiché est celui que vous payez.`,
      "Votre facture est émise en EUR.",
      ...sharedCommercialTerms,
    ],
    ctaLabel: "Demander un devis",
    shortNote: `Prix affichés et facturés en ${currency} ; les factures sont émises en EUR.`,
  };
}

export function publicPriceNote(currency: DisplayCurrency = "EUR"): string {
  return getPublicPricingTerms(currency).shortNote;
}
