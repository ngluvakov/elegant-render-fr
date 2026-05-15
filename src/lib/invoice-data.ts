import type { InvoiceData, InvoiceLineItem } from "@/lib/invoice-pdf";
import {
  billingCentsFromEurCents,
  billingCurrencyForCountry,
  type BillingCurrency,
} from "@/lib/billing";
import {
  PUBLIC_EUR_TO_RSD_RATE,
  PUBLIC_SERBIA_VAT_RATE,
} from "@/lib/catalog/display-currency";

type BuyerType = "individual" | "company_rs" | "company_foreign";

type InvoiceBuyer = {
  buyerType: BuyerType;
  buyerCountryCode?: string | null;
  companyName: string | null;
  companyTaxId: string | null;
  companyMb: string | null;
  companyAddress: string | null;
  companyCountryCode: string | null;
  billingCurrency?: BillingCurrency | null;
  billingVatRate?: number | null;
  billingEurToRsdRate?: number | null;
  user: { name: string | null; email: string | null };
};

export function buildInvoiceRecipient(
  buyer: InvoiceBuyer,
): InvoiceData["recipient"] {
  if (buyer.buyerType === "individual") {
    return {
      name: buyer.user.name ?? buyer.user.email ?? "Kupac",
      address: "-",
      countryCode: buyer.buyerCountryCode ?? null,
      email: buyer.user.email,
    };
  }
  return {
    name: buyer.companyName ?? "-",
    address: buyer.companyAddress ?? "-",
    taxId: buyer.companyTaxId,
    mb: buyer.companyMb,
    countryCode: buyer.companyCountryCode,
    email: buyer.user.email,
  };
}

export function invoiceCurrencyForBuyer(
  buyer: BuyerType | Pick<
    InvoiceBuyer,
    "buyerType" | "buyerCountryCode" | "companyCountryCode" | "billingCurrency"
  >,
): InvoiceData["currency"] {
  if (typeof buyer === "string") {
    return buyer === "company_foreign" ? "EUR" : "RSD";
  }
  if (buyer.billingCurrency) return buyer.billingCurrency;
  const countryCode =
    buyer.buyerCountryCode ??
    (buyer.buyerType === "company_rs" ? "RS" : buyer.companyCountryCode);
  if (!countryCode) {
    return buyer.buyerType === "company_foreign" ? "EUR" : "RSD";
  }
  return billingCurrencyForCountry(countryCode);
}

export function isExportInvoice(
  buyer: BuyerType | Pick<
    InvoiceBuyer,
    "buyerType" | "buyerCountryCode" | "companyCountryCode" | "billingCurrency"
  >,
): boolean {
  return invoiceCurrencyForBuyer(buyer) === "EUR";
}

export function invoiceVatRateForBuyer(
  buyer: Pick<
    InvoiceBuyer,
    "buyerType" | "buyerCountryCode" | "companyCountryCode" | "billingCurrency" | "billingVatRate"
  >,
): number {
  if (buyer.billingVatRate != null) return buyer.billingVatRate;
  return isExportInvoice(buyer) ? 0 : PUBLIC_SERBIA_VAT_RATE;
}

export function invoiceGrossCentsFromEurCents(
  eurCents: number,
  buyer: Pick<
    InvoiceBuyer,
    | "buyerType"
    | "buyerCountryCode"
    | "companyCountryCode"
    | "billingCurrency"
    | "billingVatRate"
    | "billingEurToRsdRate"
  >,
): number {
  const billingCurrency = invoiceCurrencyForBuyer(buyer);
  return billingCentsFromEurCents(eurCents, {
    billingCurrency,
    billingVatRate: invoiceVatRateForBuyer(buyer),
    billingEurToRsdRate: buyer.billingEurToRsdRate ?? PUBLIC_EUR_TO_RSD_RATE,
  });
}

export function paymentMethodLabel(
  provider: string | null,
  isExport: boolean,
): string {
  if (provider === "paypal") return "PayPal";
  if (provider === "wire_transfer") {
    return isExport ? "Bank transfer" : "Uplata na račun";
  }
  if (provider === "card_mock") {
    return isExport ? "Card payment" : "Platna kartica";
  }
  if (provider === "intesa") {
    return isExport ? "Card (Banca Intesa)" : "Platna kartica (Banca Intesa)";
  }
  return isExport ? "Online payment" : "Online plaćanje";
}

export function buildInvoiceLineItem(args: {
  description: string;
  grossUnitCents: number;
  quantity?: number;
  vatRate: number;
}): InvoiceLineItem {
  const quantity = Math.max(1, Math.floor(args.quantity ?? 1));
  const hasVat = args.vatRate > 0;
  return {
    description: args.description,
    quantity,
    unitPriceNetCents: !hasVat
      ? args.grossUnitCents
      : Math.round(args.grossUnitCents / (1 + args.vatRate)),
    vatRate: args.vatRate,
  };
}
