/**
 * config.ts — per-currency rules for buyer-facing pricing.
 *
 * EUR is the canonical price currency (integer major units in the
 * catalog; EUR cents in billing). Visitors see AND are charged in a
 * PayPal-supported presentment currency chosen from their geo country
 * (x-vercel-ip-country), converted via the manual FX snapshot in
 * fx-rates.ts and rounded to marketable price points per the rules
 * below ("round UP to the increment, then −1 for x9 endings").
 *
 * Owner-tunable: this file is the single place the currency lineup,
 * rounding style and country mapping live.
 *
 * Used by: src/lib/currency/convert.ts, src/lib/catalog/display-currency.ts,
 * src/lib/payment/paypal.ts, src/lib/billing.ts.
 */

/** PayPal-supported presentment currencies we sell in.
 * Excluded on purpose: BRL/MYR/CNY (in-country merchants only), RUB
 * (unavailable). Buyers from unmapped countries fall back per region. */
export type ChargeCurrency =
  | "EUR"
  | "USD"
  | "GBP"
  | "CHF"
  | "SEK"
  | "NOK"
  | "DKK"
  | "PLN"
  | "CZK"
  | "HUF"
  | "CAD"
  | "AUD"
  | "NZD"
  | "JPY"
  | "SGD"
  | "HKD"
  | "TWD"
  | "THB"
  | "PHP"
  | "ILS"
  | "MXN";

export type CurrencyRule = {
  code: ChargeCurrency;
  /** PayPal rejects decimals for zero-decimal currencies (JPY, HUF, TWD). */
  minorUnits: 0 | 2;
  /** Marketable rounding increment in MAJOR units. */
  roundUpIncrement: number;
  /**
   * "nine"      → round UP to the increment, then subtract 1 (€169-style)
   * "increment" → round UP to the increment (clean 10/100/1000 endings)
   */
  ending: "nine" | "increment";
  /** Intl.NumberFormat locale used to render this currency. */
  locale: string;
};

export const CURRENCY_RULES: Record<ChargeCurrency, CurrencyRule> = {
  EUR: { code: "EUR", minorUnits: 2, roundUpIncrement: 1, ending: "increment", locale: "en-IE" },
  USD: { code: "USD", minorUnits: 2, roundUpIncrement: 10, ending: "nine", locale: "en-US" },
  GBP: { code: "GBP", minorUnits: 2, roundUpIncrement: 10, ending: "nine", locale: "en-GB" },
  CHF: { code: "CHF", minorUnits: 2, roundUpIncrement: 10, ending: "nine", locale: "de-CH" },
  CAD: { code: "CAD", minorUnits: 2, roundUpIncrement: 10, ending: "nine", locale: "en-CA" },
  AUD: { code: "AUD", minorUnits: 2, roundUpIncrement: 10, ending: "nine", locale: "en-AU" },
  NZD: { code: "NZD", minorUnits: 2, roundUpIncrement: 10, ending: "nine", locale: "en-NZ" },
  SGD: { code: "SGD", minorUnits: 2, roundUpIncrement: 10, ending: "nine", locale: "en-SG" },
  PLN: { code: "PLN", minorUnits: 2, roundUpIncrement: 10, ending: "nine", locale: "pl-PL" },
  ILS: { code: "ILS", minorUnits: 2, roundUpIncrement: 10, ending: "nine", locale: "he-IL" },
  SEK: { code: "SEK", minorUnits: 2, roundUpIncrement: 10, ending: "increment", locale: "sv-SE" },
  NOK: { code: "NOK", minorUnits: 2, roundUpIncrement: 10, ending: "increment", locale: "nb-NO" },
  DKK: { code: "DKK", minorUnits: 2, roundUpIncrement: 10, ending: "increment", locale: "da-DK" },
  HKD: { code: "HKD", minorUnits: 2, roundUpIncrement: 10, ending: "increment", locale: "zh-HK" },
  CZK: { code: "CZK", minorUnits: 2, roundUpIncrement: 100, ending: "nine", locale: "cs-CZ" },
  MXN: { code: "MXN", minorUnits: 2, roundUpIncrement: 100, ending: "nine", locale: "es-MX" },
  THB: { code: "THB", minorUnits: 2, roundUpIncrement: 100, ending: "nine", locale: "th-TH" },
  PHP: { code: "PHP", minorUnits: 2, roundUpIncrement: 100, ending: "increment", locale: "en-PH" },
  TWD: { code: "TWD", minorUnits: 0, roundUpIncrement: 100, ending: "increment", locale: "zh-TW" },
  HUF: { code: "HUF", minorUnits: 0, roundUpIncrement: 1000, ending: "increment", locale: "hu-HU" },
  JPY: { code: "JPY", minorUnits: 0, roundUpIncrement: 1000, ending: "increment", locale: "ja-JP" },
};

export const CHARGE_CURRENCIES = Object.keys(CURRENCY_RULES) as ChargeCurrency[];

export function isChargeCurrency(value: string | null | undefined): value is ChargeCurrency {
  return !!value && value in CURRENCY_RULES;
}

/** Countries with a dedicated presentment currency. Everything in the
 * eurozone + Western Balkans + EU candidates prices naturally in EUR
 * and is intentionally absent (EUR is the default fallback for Europe). */
const COUNTRY_TO_CURRENCY: Record<string, ChargeCurrency> = {
  US: "USD",
  GB: "GBP",
  CH: "CHF",
  LI: "CHF",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  PL: "PLN",
  CZ: "CZK",
  HU: "HUF",
  CA: "CAD",
  AU: "AUD",
  NZ: "NZD",
  JP: "JPY",
  SG: "SGD",
  HK: "HKD",
  TW: "TWD",
  TH: "THB",
  PH: "PHP",
  IL: "ILS",
  MX: "MXN",
};

/** Region fallbacks for countries without a supported local currency:
 * the "foreign currency people actually think in" per the owner's spec
 * (e.g. USD in Latin America and most of Asia-Pacific, EUR across
 * Europe/Africa/Middle East). */
const AMERICAS = new Set([
  "AR", "BO", "BR", "BZ", "CL", "CO", "CR", "CU", "DO", "EC", "GT", "GY",
  "HN", "HT", "JM", "NI", "PA", "PE", "PR", "PY", "SR", "SV", "TT", "UY", "VE",
]);
const ASIA_PACIFIC_USD = new Set([
  "BD", "BN", "CN", "FJ", "ID", "IN", "KH", "KR", "LA", "LK", "MM", "MN",
  "MY", "NP", "PG", "PK", "VN", "RU", "KZ", "UZ", "GE", "AM", "AZ",
]);

export function chargeCurrencyForCountry(countryCode: string | null | undefined): ChargeCurrency {
  if (!countryCode) return "EUR";
  const code = countryCode.toUpperCase();
  const direct = COUNTRY_TO_CURRENCY[code];
  if (direct) return direct;
  if (AMERICAS.has(code)) return "USD";
  if (ASIA_PACIFIC_USD.has(code)) return "USD";
  // Europe (incl. RS/BA/ME/MK/AL/TR), Africa, Middle East, everything else.
  return "EUR";
}
