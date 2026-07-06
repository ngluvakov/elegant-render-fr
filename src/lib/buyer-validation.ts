/**
 * buyer-validation.ts — Format-level checks for buyer identity fields
 * collected at checkout. Used both client-side (real-time UX) and
 * server-side (defense against tampered submissions).
 *
 * v1 is format-only:
 *   - VAT ID: optional; when it carries an EU (VIES) country prefix it
 *             must match the VIES format (2-letter prefix + 6-12
 *             alphanumeric). Live VIES verification happens separately
 *             and never blocks checkout.
 *   - Country: 2-letter ISO-3166-1 alpha-2
 *
 * Returning a single error string instead of a structured error map
 * keeps the UX simple — checkout shows one issue at a time and users
 * iterate.
 */

import { isViesCountry } from "@/lib/vies";

export type BuyerType = "individual" | "business";

export type BuyerInfoInput = {
  buyerType: BuyerType;
  buyerCountryCode?: string | null;
  companyName?: string | null;
  companyTaxId?: string | null;
  companyAddress?: string | null;
  companyCountryCode?: string | null;
};

const VAT_ID_RE = /^[A-Z]{2}[A-Z0-9]{6,12}$/;
const COUNTRY_RE = /^[A-Z]{2}$/;

export function isValidVatId(s: string): boolean {
  return VAT_ID_RE.test(s);
}

export function isValidCountryCode(s: string): boolean {
  return COUNTRY_RE.test(s);
}

/**
 * Returns null when the buyer block is acceptable, otherwise a single
 * error message ready to surface in the UI. Caller should still
 * trim/lowercase as needed before persisting.
 */
export function validateBuyerInfo(input: BuyerInfoInput): string | null {
  const buyerCountry =
    input.buyerCountryCode?.trim().toUpperCase() ||
    input.companyCountryCode?.trim().toUpperCase() ||
    "";

  if (!buyerCountry || !isValidCountryCode(buyerCountry)) {
    return "Please select a billing country.";
  }

  if (input.buyerType === "individual") return null;

  const name = input.companyName?.trim() ?? "";
  if (!name) return "Company name is required.";

  const address = input.companyAddress?.trim() ?? "";
  if (!address) return "Company address is required.";

  const taxId = input.companyTaxId?.trim().toUpperCase() ?? "";
  // VAT ID is optional — non-EU companies may not have one, and an
  // invoice without a VAT ID is still valid for them. EU-prefixed IDs
  // must match the VIES format so the later VIES verification can even
  // be attempted; non-EU tax IDs are stored as given.
  if (taxId) {
    const prefix = taxId.slice(0, 2);
    if (isViesCountry(prefix) && !isValidVatId(taxId)) {
      return "VAT ID must start with a two-letter country prefix followed by 6–12 characters (e.g. DE123456789).";
    }
  }

  return null;
}
