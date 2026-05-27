import {
  getDisplayCurrencyForCountry,
  type DisplayCurrency,
  type PublicPricingFormatSettings,
} from "@/lib/catalog/display-currency";
import type { BuyerType } from "@/lib/buyer-validation";

export type BillingCurrency = "RSD" | "EUR";

export type BillingSnapshotInput = {
  buyerType: BuyerType;
  buyerCountryCode?: string | null;
  companyName?: string | null;
  companyTaxId?: string | null;
  companyMb?: string | null;
  companyAddress?: string | null;
  companyCountryCode?: string | null;
};

export type BillingSnapshot = {
  buyerType: BuyerType;
  buyerCountryCode: string;
  companyName: string | null;
  companyTaxId: string | null;
  companyMb: string | null;
  companyAddress: string | null;
  companyCountryCode: string | null;
  billingCurrency: BillingCurrency;
  billingVatRate: number;
  billingEurToRsdRate: number;
};

export const SERBIA_COUNTRY_CODE = "RS";

export function normalizeCountryCode(
  value: string | null | undefined,
  fallback?: string,
): string {
  const normalized = value?.trim().toUpperCase();
  if (normalized && /^[A-Z]{2}$/.test(normalized)) return normalized;
  return fallback?.trim().toUpperCase() || SERBIA_COUNTRY_CODE;
}

export function billingCountryForBuyer(
  input: BillingSnapshotInput,
  fallbackCountryCode?: string | null,
): string {
  if (input.buyerType === "company_rs") return SERBIA_COUNTRY_CODE;
  if (input.buyerType === "company_foreign") {
    return normalizeCountryCode(
      input.buyerCountryCode ?? input.companyCountryCode,
      fallbackCountryCode ?? undefined,
    );
  }
  return normalizeCountryCode(input.buyerCountryCode, fallbackCountryCode ?? undefined);
}

export function buyerTypeForBilling(
  kind: "individual" | "company",
  countryCode: string | null | undefined,
): BuyerType {
  if (kind === "individual") return "individual";
  return normalizeCountryCode(countryCode) === SERBIA_COUNTRY_CODE
    ? "company_rs"
    : "company_foreign";
}

export function billingCurrencyForCountry(
  countryCode: string | null | undefined,
): BillingCurrency {
  return countryCode?.trim().toUpperCase() === SERBIA_COUNTRY_CODE
    ? "RSD"
    : "EUR";
}

export function displayCurrencyForBillingCountry(
  countryCode: string | null | undefined,
): DisplayCurrency {
  return getDisplayCurrencyForCountry(countryCode);
}

export function displayCurrencyForBillingCurrency(
  currency: BillingCurrency | null | undefined,
): DisplayCurrency {
  return currency === "RSD" ? "rsd" : "eur";
}

export function isExportBillingCurrency(
  currency: BillingCurrency | null | undefined,
): boolean {
  return currency === "EUR";
}

export function buildBillingSnapshot(
  input: BillingSnapshotInput,
  settings: PublicPricingFormatSettings,
  fallbackCountryCode?: string | null,
): BillingSnapshot {
  const buyerCountryCode = billingCountryForBuyer(input, fallbackCountryCode);
  const billingCurrency = billingCurrencyForCountry(buyerCountryCode);
  const buyerType =
    input.buyerType === "individual"
      ? "individual"
      : buyerTypeForBilling("company", buyerCountryCode);

  const companyCountryCode =
    buyerType === "company_foreign" ? buyerCountryCode : null;
  const companyFields =
    buyerType === "individual"
      ? {
          companyName: null,
          companyTaxId: null,
          companyMb: null,
          companyAddress: null,
        }
      : {
          companyName: input.companyName?.trim() || null,
          companyTaxId: input.companyTaxId?.trim().toUpperCase() || null,
          companyMb: input.companyMb?.trim() || null,
          companyAddress: input.companyAddress?.trim() || null,
        };

  return {
    buyerType,
    buyerCountryCode,
    ...companyFields,
    companyCountryCode,
    billingCurrency,
    billingVatRate: billingCurrency === "RSD" ? settings.serbiaVatRate : 0,
    billingEurToRsdRate: settings.eurToRsdRate,
  };
}

export function billingCentsFromEurCents(
  eurCents: number,
  snapshot: Pick<
    BillingSnapshot,
    "billingCurrency" | "billingEurToRsdRate" | "billingVatRate"
  >,
): number {
  if (snapshot.billingCurrency === "EUR") return Math.round(eurCents);
  const eur = eurCents / 100;
  const grossRsd = Math.round(eur * snapshot.billingEurToRsdRate);
  return grossRsd * 100;
}

export function formatBillingMoney(
  cents: number,
  currency: BillingCurrency,
): string {
  const value = cents / 100;
  if (currency === "RSD") {
    return `${value.toLocaleString("sr-Latn-RS", { maximumFractionDigits: 0 })} RSD`;
  }
  return `€${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
