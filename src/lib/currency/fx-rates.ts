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

/** How many units of the currency one EUR buys. */
export const FX_RATES_EUR: Record<ChargeCurrency, number> = {
  EUR: 1,
  USD: 1.17,
  GBP: 0.86,
  CHF: 0.94,
  SEK: 11.1,
  NOK: 11.8,
  DKK: 7.46,
  PLN: 4.27,
  CZK: 24.8,
  HUF: 400,
  CAD: 1.6,
  AUD: 1.78,
  NZD: 1.94,
  JPY: 172,
  SGD: 1.5,
  HKD: 9.15,
  TWD: 34.5,
  THB: 38.5,
  PHP: 66,
  ILS: 3.95,
  MXN: 21.8,
};

/** Bump on every manual refresh; snapshotted onto orders as chargedFxAsOf. */
export const FX_RATES_AS_OF = "2026-07-06";
