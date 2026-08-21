import type { InvoiceData, InvoiceLineItem } from "@/lib/invoice-pdf";
import {
  billingCentsFromEurCents,
  billingCurrencyForCountry,
  type BillingCurrency,
} from "@/lib/billing";

type BuyerType = "individual" | "business";

type InvoiceBuyer = {
  buyerType: BuyerType;
  buyerCountryCode?: string | null;
  companyName: string | null;
  companyTaxId: string | null;
  companyAddress: string | null;
  companyCountryCode: string | null;
  billingCurrency?: BillingCurrency | null;
  billingVatRate?: number | null;
  user: { name: string | null; email: string | null };
};

export function buildInvoiceRecipient(
  buyer: InvoiceBuyer,
): InvoiceData["recipient"] {
  if (buyer.buyerType === "individual") {
    return {
      name: buyer.user.name ?? buyer.user.email ?? "Client",
      address: "-",
      countryCode: buyer.buyerCountryCode ?? null,
      email: buyer.user.email,
    };
  }
  return {
    name: buyer.companyName ?? "-",
    address: buyer.companyAddress ?? "-",
    taxId: buyer.companyTaxId,
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
  if (typeof buyer === "string") return "EUR";
  return billingCurrencyForCountry(null);
}

export function isExportInvoice(
  buyer: BuyerType | Pick<
    InvoiceBuyer,
    "buyerType" | "buyerCountryCode" | "companyCountryCode" | "billingCurrency"
  >,
): boolean {
  void buyer;
  // Every invoice is an export invoice: White Rook DOO (RS) supplying
  // services to foreign recipients, 0% Serbian VAT.
  return true;
}

export function invoiceVatRateForBuyer(
  buyer: Pick<
    InvoiceBuyer,
    "buyerType" | "buyerCountryCode" | "companyCountryCode" | "billingCurrency" | "billingVatRate"
  >,
): number {
  if (buyer.billingVatRate != null) return buyer.billingVatRate;
  return 0;
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
  >,
): number {
  void buyer;
  return billingCentsFromEurCents(eurCents);
}

export function paymentMethodLabel(
  provider: string | null,
  isExport: boolean,
): string {
  void isExport;
  if (provider === "wire_transfer") {
    return "Virement bancaire (SWIFT)";
  }
  if (provider === "card_mock") {
    return "Paiement par carte";
  }
  if (provider === "paypal") {
    return "PayPal";
  }
  return "Paiement en ligne";
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
