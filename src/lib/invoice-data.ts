import type { InvoiceData, InvoiceLineItem } from "@/lib/invoice-pdf";
import {
  billingCentsFromRsdCents,
  billingCurrencyForCountry,
  type BillingCurrency,
} from "@/lib/billing";
import { PUBLIC_SERBIA_VAT_RATE } from "@/lib/catalog/display-currency";

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
  billingRsdRate?: number | null;
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
  void buyer;
  if (typeof buyer === "string") return "RSD";
  return billingCurrencyForCountry("RS");
}

export function isExportInvoice(
  buyer: BuyerType | Pick<
    InvoiceBuyer,
    "buyerType" | "buyerCountryCode" | "companyCountryCode" | "billingCurrency"
  >,
): boolean {
  void buyer;
  return false;
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

export function invoiceGrossCentsFromRsdCents(
  rsdCents: number,
  buyer: Pick<
    InvoiceBuyer,
    | "buyerType"
    | "buyerCountryCode"
    | "companyCountryCode"
    | "billingCurrency"
    | "billingVatRate"
    | "billingRsdRate"
  >,
): number {
  void buyer;
  return billingCentsFromRsdCents(rsdCents);
}

export function paymentMethodLabel(
  provider: string | null,
  isExport: boolean,
): string {
  void isExport;
  if (provider === "wire_transfer") {
    return "Uplata na račun";
  }
  if (provider === "card_mock") {
    return "Platna kartica";
  }
  if (provider === "nestpay") {
    return "Platna kartica (Banca Intesa)";
  }
  return "Online plaćanje";
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
