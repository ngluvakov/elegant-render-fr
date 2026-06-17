import type {
  DisplayCurrency,
  PublicPricingFormatSettings,
} from "@/lib/catalog/display-currency";
import type { BuyerType } from "@/lib/buyer-validation";

export type BillingCurrency = "RSD";

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
  billingRsdRate: number;
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
  _countryCode: string | null | undefined,
): BillingCurrency {
  void _countryCode;
  return "RSD";
}

export function displayCurrencyForBillingCountry(
  _countryCode: string | null | undefined,
): DisplayCurrency {
  void _countryCode;
  return "rsd";
}

export function displayCurrencyForBillingCurrency(
  _currency: BillingCurrency | null | undefined,
): DisplayCurrency {
  void _currency;
  return "rsd";
}

export function isExportBillingCurrency(
  _currency: BillingCurrency | null | undefined,
): boolean {
  void _currency;
  return false;
}

export function buildBillingSnapshot(
  input: BillingSnapshotInput,
  settings: PublicPricingFormatSettings,
  fallbackCountryCode?: string | null,
): BillingSnapshot {
  const buyerCountryCode = billingCountryForBuyer(input, fallbackCountryCode);
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
    billingCurrency: "RSD",
    billingVatRate: settings.serbiaVatRate,
    billingRsdRate: 1,
  };
}

export function billingCentsFromRsdCents(
  rsdCents: number,
  _snapshot?: unknown,
): number {
  void _snapshot;
  return Math.round(rsdCents);
}

export function formatBillingMoney(
  cents: number,
  _currency: BillingCurrency | null | undefined = "RSD",
): string {
  void _currency;
  const value = cents / 100;
  return `${value.toLocaleString("sr-Latn-RS", { maximumFractionDigits: 0 })} RSD`;
}
