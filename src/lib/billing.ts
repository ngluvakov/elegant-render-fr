import type {
  DisplayCurrency,
  PublicPricingFormatSettings,
} from "@/lib/catalog/display-currency";
import type { BuyerType } from "@/lib/buyer-validation";
import {
  chargeCurrencyForCountry,
  isChargeCurrency,
  type ChargeCurrency,
} from "@/lib/currency/config";
import { convertEurCentsToMinor } from "@/lib/currency/convert";

export type BillingCurrency = "EUR";

export type BillingSnapshotInput = {
  buyerType: BuyerType;
  buyerCountryCode?: string | null;
  companyName?: string | null;
  companyTaxId?: string | null;
  companyAddress?: string | null;
  companyCountryCode?: string | null;
};

export type BillingSnapshot = {
  buyerType: BuyerType;
  buyerCountryCode: string;
  companyName: string | null;
  companyTaxId: string | null;
  companyAddress: string | null;
  companyCountryCode: string | null;
  billingCurrency: BillingCurrency;
  billingVatRate: number;
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
  if (input.buyerType === "business") {
    return normalizeCountryCode(
      input.buyerCountryCode ?? input.companyCountryCode,
      fallbackCountryCode ?? undefined,
    );
  }
  return normalizeCountryCode(input.buyerCountryCode, fallbackCountryCode ?? undefined);
}

export function buyerTypeForBilling(
  kind: "individual" | "company",
  _countryCode: string | null | undefined,
): BuyerType {
  void _countryCode;
  return kind === "individual" ? "individual" : "business";
}

export function billingCurrencyForCountry(
  _countryCode: string | null | undefined,
): BillingCurrency {
  void _countryCode;
  return "EUR";
}

export function displayCurrencyForBillingCountry(
  countryCode: string | null | undefined,
): DisplayCurrency {
  return chargeCurrencyForCountry(countryCode);
}

/** Invoices are always issued in EUR; when only the billing currency is
 * known (no charge snapshot), EUR is the honest display currency. */
export function displayCurrencyForBillingCurrency(
  _currency: BillingCurrency | null | undefined,
): DisplayCurrency {
  void _currency;
  return "EUR";
}

/** The order's charged-currency snapshot when present, else the geo /
 * billing-country fallback. Portal order pages use this so a paid order
 * always displays in the currency the buyer was actually charged. */
export function displayCurrencyForOrderSnapshot(
  chargedCurrency: string | null | undefined,
  fallbackCountryCode?: string | null,
): DisplayCurrency {
  if (isChargeCurrency(chargedCurrency)) return chargedCurrency;
  return chargeCurrencyForCountry(fallbackCountryCode);
}

export function isExportBillingCurrency(
  _currency: BillingCurrency | null | undefined,
): boolean {
  void _currency;
  return true;
}

export function buildBillingSnapshot(
  input: BillingSnapshotInput,
  _settings: PublicPricingFormatSettings,
  fallbackCountryCode?: string | null,
): BillingSnapshot {
  void _settings;
  const buyerCountryCode = billingCountryForBuyer(input, fallbackCountryCode);
  const buyerType = input.buyerType === "individual" ? "individual" : "business";

  const companyCountryCode = buyerType === "business" ? buyerCountryCode : null;
  const companyFields =
    buyerType === "individual"
      ? {
          companyName: null,
          companyTaxId: null,
          companyAddress: null,
        }
      : {
          companyName: input.companyName?.trim() || null,
          companyTaxId: input.companyTaxId?.trim().toUpperCase() || null,
          companyAddress: input.companyAddress?.trim() || null,
        };

  return {
    buyerType,
    buyerCountryCode,
    ...companyFields,
    companyCountryCode,
    billingCurrency: "EUR",
    // Every invoice is an export invoice in EUR with 0% Serbian VAT
    // (export of services); see docs/plan/design-payments.md §5.
    billingVatRate: 0,
  };
}

export function billingCentsFromEurCents(
  eurCents: number,
  _snapshot?: unknown,
): number {
  void _snapshot;
  return Math.round(eurCents);
}

// ─── Charged-amount snapshot (presentment currency) ──────
//
// Locked once at order/charge creation: the buyer is charged exactly
// this amount in this currency via PayPal, whatever the FX table says
// later. The invoice stays EUR (billing snapshot above); this block is
// the payment-side twin.

export type ChargeSnapshot = {
  chargedCurrency: ChargeCurrency;
  /** Minor units; zero-decimal currencies (JPY/HUF/TWD) store whole units. */
  chargedAmountMinor: number;
  /** EUR→chargedCurrency rate used (1 for EUR). */
  chargedFxRate: number;
  chargedFxAsOf: Date;
};

/** Snapshot for an explicit currency — used when a charge inherits the
 * parent order's chargedCurrency. */
export function buildChargeSnapshotForCurrency(
  totalEurCents: number,
  currency: ChargeCurrency,
): ChargeSnapshot {
  // Zero totals (empty portal drafts) must not round up to a
  // marketable price point — keep them at zero until repriced.
  if (totalEurCents <= 0) {
    const zero = convertEurCentsToMinor(0, "EUR");
    return {
      chargedCurrency: currency,
      chargedAmountMinor: 0,
      chargedFxRate: currency === "EUR" ? 1 : convertEurCentsToMinor(100, currency).fxRate,
      chargedFxAsOf: new Date(zero.fxAsOf),
    };
  }
  const converted = convertEurCentsToMinor(Math.round(totalEurCents), currency);
  return {
    chargedCurrency: currency,
    chargedAmountMinor: converted.amountMinor,
    chargedFxRate: converted.fxRate,
    chargedFxAsOf: new Date(converted.fxAsOf),
  };
}

/** Snapshot from the buyer's (server-derived) geo country. Never trust
 * a client-passed currency — callers pass getPublicCountryCode(). */
export function buildChargeSnapshot(
  totalEurCents: number,
  countryCode: string | null,
): ChargeSnapshot {
  return buildChargeSnapshotForCurrency(
    totalEurCents,
    chargeCurrencyForCountry(countryCode),
  );
}

export function formatBillingMoney(
  cents: number,
  _currency: BillingCurrency | null | undefined = "EUR",
): string {
  void _currency;
  const value = cents / 100;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}
