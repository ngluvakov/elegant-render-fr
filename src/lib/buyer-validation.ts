/**
 * buyer-validation.ts — Format-level checks for buyer identity fields
 * collected at checkout. Used both client-side (real-time UX) and
 * server-side (defense against tampered submissions).
 *
 * v1 is format-only:
 *   - PIB:    9 digits (mod-11 checksum is a follow-up)
 *   - MB:     8 digits
 *   - VAT ID: 2-letter prefix + 6-12 alphanumeric (VIES verification
 *             at https://ec.europa.eu/taxation_customs/vies/ is a
 *             follow-up; we don't block on it for v1)
 *   - Country: 2-letter ISO-3166-1 alpha-2
 *
 * Returning a single Serbian error string instead of a structured
 * error map keeps the UX simple — checkout shows one issue at a time
 * and users iterate.
 */

export type BuyerType = "individual" | "company_rs" | "company_foreign";

export type BuyerInfoInput = {
  buyerType: BuyerType;
  companyName?: string | null;
  companyTaxId?: string | null;
  companyMb?: string | null;
  companyAddress?: string | null;
  companyCountryCode?: string | null;
};

const PIB_RE = /^\d{9}$/;
const MB_RE = /^\d{8}$/;
const VAT_ID_RE = /^[A-Z]{2}[A-Z0-9]{6,12}$/;
const COUNTRY_RE = /^[A-Z]{2}$/;

export function isValidPib(s: string): boolean {
  return PIB_RE.test(s);
}

export function isValidMb(s: string): boolean {
  return MB_RE.test(s);
}

export function isValidVatId(s: string): boolean {
  return VAT_ID_RE.test(s);
}

export function isValidCountryCode(s: string): boolean {
  return COUNTRY_RE.test(s);
}

/**
 * Returns null when the buyer block is acceptable, otherwise a single
 * Serbian error message ready to surface in the UI. Caller should
 * still trim/lowercase as needed before persisting.
 */
export function validateBuyerInfo(input: BuyerInfoInput): string | null {
  if (input.buyerType === "individual") return null;

  const name = input.companyName?.trim() ?? "";
  if (!name) return "Naziv firme je obavezan.";

  const address = input.companyAddress?.trim() ?? "";
  if (!address) return "Adresa firme je obavezna.";

  if (input.buyerType === "company_rs") {
    const pib = input.companyTaxId?.trim() ?? "";
    if (!pib || !isValidPib(pib)) {
      return "PIB mora imati tačno 9 cifara.";
    }
    const mb = input.companyMb?.trim() ?? "";
    if (mb && !isValidMb(mb)) {
      return "Matični broj mora imati tačno 8 cifara.";
    }
    return null;
  }

  if (input.buyerType === "company_foreign") {
    const country = input.companyCountryCode?.trim().toUpperCase() ?? "";
    if (!country || !isValidCountryCode(country)) {
      return "Kod države mora biti dva velika slova (npr. DE, FR, IT).";
    }
    const taxId = input.companyTaxId?.trim().toUpperCase() ?? "";
    // VAT ID is optional — non-EU foreign companies may not have one,
    // and an invoice without VAT ID is still valid for them. But if
    // provided, it should look like a VAT ID.
    if (taxId && !isValidVatId(taxId)) {
      return "VAT ID mora počinjati sa dva velika slova i imati 6-12 karaktera (npr. DE123456789).";
    }
    return null;
  }

  return null;
}
