/**
 * fx-rates.ts — manual EUR→currency FX snapshot.
 *
 * Deliberately a constants file, not a live feed: marketable round-UP
 * pricing (see convert.ts) builds in a 3–8% buffer, so monthly manual
 * refreshes are safe and keep pricing deterministic (no surprise price
 * changes between page view and checkout).
 *
 * UPDATE RITUAL (owner, monthly — documented in docs/plan/00-master-plan.md):
 *   1. Take ECB reference rates (https://www.ecb.europa.eu/stats/eurofxref/).
 *   2. Replace the numbers below and bump FX_RATES_AS_OF.
 *   3. `npm test` (convert.test.ts sanity-checks the table) and ship.
 *
 * A stale rate only ever costs margin when the buyer's currency
 * strengthens vs EUR beyond the round-up buffer; the charged FX rate
 * and as-of date are snapshotted on every order for the audit trail.
 */

import type { ChargeCurrency } from "./config";

/** How many units of the currency one EUR buys.
 * Source: ECB euro reference rates, fixing of FX_RATES_AS_OF.
 * TWD is not an ECB reference currency — kept as a conservative manual
 * estimate (higher rate → higher local price → safe for us). */
export const FX_RATES_EUR: Record<ChargeCurrency, number> = {
  EUR: 1,
  USD: 1.1415,
  GBP: 0.8554,
  CHF: 0.9201,
  SEK: 11.015,
  NOK: 11.234,
  DKK: 7.4748,
  PLN: 4.2883,
  CZK: 24.157,
  HUF: 353.5,
  CAD: 1.6236,
  AUD: 1.6462,
  NZD: 2.0079,
  JPY: 185.31,
  SGD: 1.4765,
  HKD: 8.9528,
  TWD: 34.5,
  THB: 38.04,
  PHP: 70.227,
  ILS: 3.4414,
  MXN: 19.9586,
};

/** Bump on every manual refresh; snapshotted onto orders as chargedFxAsOf. */
export const FX_RATES_AS_OF = "2026-07-06";
