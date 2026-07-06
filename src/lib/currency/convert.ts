/**
 * convert.ts — pure EUR→presentment-currency conversion with marketable
 * rounding. No I/O, fully unit-tested (convert.test.ts).
 *
 * The pricing rule (owner-locked): convert at the FX snapshot, round UP
 * to the currency's marketable increment, then subtract 1 for
 * "x9-ending" currencies — never dropping below the raw conversion
 * (€169 → $197.70 → $199, not $189). EUR itself is canonical and
 * passes through untouched.
 */

import { CURRENCY_RULES, type ChargeCurrency } from "./config";
import { FX_RATES_AS_OF, FX_RATES_EUR } from "./fx-rates";

export type ConvertedAmount = {
  /** Minor units (zero-decimal currencies store whole units). */
  amountMinor: number;
  /** Whole major units — marketable amounts are integral by construction. */
  amountMajor: number;
  /** EUR→currency rate used, for the order's audit snapshot. */
  fxRate: number;
  fxAsOf: string;
};

/**
 * Round a raw major-unit amount UP to the currency's marketable price
 * point. Guarantee: result ≥ raw (we never round revenue down).
 */
export function roundUpMarketable(rawMajor: number, currency: ChargeCurrency): number {
  const rule = CURRENCY_RULES[currency];
  const inc = rule.roundUpIncrement;
  const ceiled = Math.ceil(rawMajor / inc - 1e-9) * inc;
  if (rule.ending === "nine") {
    const candidate = ceiled - 1;
    return candidate >= rawMajor ? candidate : ceiled + inc - 1;
  }
  return ceiled;
}

/** Convert an EUR-cents amount into the presentment currency. */
export function convertEurCentsToMinor(
  eurCents: number,
  currency: ChargeCurrency,
): ConvertedAmount {
  if (!Number.isInteger(eurCents) || eurCents < 0) {
    throw new Error(`Invalid EUR cents amount: ${eurCents}`);
  }
  const rule = CURRENCY_RULES[currency];
  const fxRate = FX_RATES_EUR[currency];

  if (currency === "EUR") {
    // Canonical currency: identity, no marketable re-rounding — the
    // catalog's EUR price points are already final.
    return {
      amountMinor: eurCents,
      amountMajor: eurCents / 100,
      fxRate: 1,
      fxAsOf: FX_RATES_AS_OF,
    };
  }

  const rawMajor = (eurCents / 100) * fxRate;
  const major = roundUpMarketable(rawMajor, currency);
  return {
    amountMinor: rule.minorUnits === 0 ? major : major * 100,
    amountMajor: major,
    fxRate,
    fxAsOf: FX_RATES_AS_OF,
  };
}

/** Render a minor-unit amount for UI (whole-number marketable prices
 * show no decimals; genuine fractional amounts keep two). */
export function formatChargeAmount(amountMinor: number, currency: ChargeCurrency): string {
  const rule = CURRENCY_RULES[currency];
  const major = rule.minorUnits === 0 ? amountMinor : amountMinor / 100;
  const isWhole = Number.isInteger(major);
  return new Intl.NumberFormat(rule.locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: isWhole ? 0 : 2,
  }).format(major);
}
