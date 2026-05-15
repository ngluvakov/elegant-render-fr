import type { InvoiceData, InvoiceLineItem } from "@/lib/invoice-pdf";

type BuyerType = "individual" | "company_rs" | "company_foreign";

type InvoiceBuyer = {
  buyerType: BuyerType;
  companyName: string | null;
  companyTaxId: string | null;
  companyMb: string | null;
  companyAddress: string | null;
  companyCountryCode: string | null;
  user: { name: string | null; email: string | null };
};

export function buildInvoiceRecipient(
  buyer: InvoiceBuyer,
): InvoiceData["recipient"] {
  if (buyer.buyerType === "individual") {
    return {
      name: buyer.user.name ?? buyer.user.email ?? "Kupac",
      address: "-",
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
  buyerType: BuyerType,
): InvoiceData["currency"] {
  return buyerType === "company_foreign" ? "EUR" : "RSD";
}

export function isExportInvoice(buyerType: BuyerType): boolean {
  return buyerType === "company_foreign";
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
  isExport: boolean;
}): InvoiceLineItem {
  const quantity = Math.max(1, Math.floor(args.quantity ?? 1));
  return {
    description: args.description,
    quantity,
    unitPriceNetCents: args.isExport
      ? args.grossUnitCents
      : Math.round(args.grossUnitCents / 1.2),
    vatRate: args.isExport ? 0 : 0.2,
  };
}
