/**
 * Builds a unified list of invoice-like documents for a single order:
 * predračun + račun porudžbine + račun za svaku doplatu.
 * Shared by the finansije page and the project detail "Računi" card.
 */
import {
  invoiceCurrencyForBuyer,
  invoiceGrossCentsFromRsdCents,
} from "@/lib/invoice-data";
import type { BillingCurrency } from "@/lib/billing";

export type InvoiceDoc = {
  id: string;
  kind: "proforma" | "invoice" | "charge_invoice";
  number: string;
  issuedAt: Date;
  amountCents: number | null;
  currency: BillingCurrency | null;
  label: string;
  href: string;
};

type OrderInput = {
  id: string;
  buyerType: "individual" | "company_rs" | "company_foreign";
  buyerCountryCode?: string | null;
  companyCountryCode: string | null;
  billingCurrency?: BillingCurrency | null;
  billingVatRate?: number | null;
  billingRsdRate?: number | null;
  billingTotalCents?: number | null;
  totalCents: number | null;
  totalRsd: number;
  proformaNumber: string | null;
  proformaIssuedAt: Date | null;
  proformaPdfPath: string | null;
  invoiceNumber: string | null;
  invoiceIssuedAt: Date | null;
  invoicePdfPath: string | null;
};

type ChargeInput = {
  id: string;
  reason: string | null;
  totalCents: number;
  buyerType?: "individual" | "company_rs" | "company_foreign" | null;
  buyerCountryCode?: string | null;
  companyCountryCode?: string | null;
  billingCurrency?: BillingCurrency | null;
  billingVatRate?: number | null;
  billingRsdRate?: number | null;
  billingTotalCents?: number | null;
  status: "pending" | "paid" | "cancelled";
  invoiceNumber: string | null;
  invoiceIssuedAt: Date | null;
  invoicePdfPath: string | null;
};

export function buildInvoiceList(
  order: OrderInput,
  charges: ChargeInput[],
): InvoiceDoc[] {
  const docs: InvoiceDoc[] = [];

  if (
    order.proformaNumber &&
    order.proformaPdfPath &&
    order.proformaIssuedAt
  ) {
    docs.push({
      id: "proforma",
      kind: "proforma",
      number: order.proformaNumber,
      issuedAt: order.proformaIssuedAt,
      amountCents: order.billingTotalCents ?? orderAmountCents(order),
      currency: invoiceCurrencyForBuyer(order),
      label: "Predračun",
      href: `/api/portal/proforma/${order.id}`,
    });
  }

  if (order.invoiceNumber && order.invoicePdfPath && order.invoiceIssuedAt) {
    docs.push({
      id: "invoice",
      kind: "invoice",
      number: order.invoiceNumber,
      issuedAt: order.invoiceIssuedAt,
      amountCents: order.billingTotalCents ?? orderAmountCents(order),
      currency: invoiceCurrencyForBuyer(order),
      label: "Račun za porudžbinu",
      href: `/api/portal/invoice/${order.id}`,
    });
  }

  for (const charge of charges) {
    if (charge.status === "cancelled") continue;
    if (
      !charge.invoiceNumber ||
      !charge.invoicePdfPath ||
      !charge.invoiceIssuedAt
    ) {
      continue;
    }
    const reasonHint = charge.reason ? ` — ${charge.reason}` : "";
    const chargeBuyer = {
      buyerType: charge.buyerType ?? order.buyerType,
      buyerCountryCode: charge.buyerCountryCode ?? order.buyerCountryCode ?? null,
      companyCountryCode:
        charge.companyCountryCode ?? order.companyCountryCode ?? null,
      billingCurrency: charge.billingCurrency ?? order.billingCurrency ?? null,
      billingVatRate: charge.billingVatRate ?? order.billingVatRate ?? null,
      billingRsdRate:
        charge.billingRsdRate ?? order.billingRsdRate ?? null,
    };
    docs.push({
      id: `charge:${charge.id}`,
      kind: "charge_invoice",
      number: charge.invoiceNumber,
      issuedAt: charge.invoiceIssuedAt,
      amountCents:
        charge.billingTotalCents ??
        invoiceGrossCentsFromRsdCents(charge.totalCents, chargeBuyer),
      currency: invoiceCurrencyForBuyer(chargeBuyer),
      label: `Račun za doplatu${reasonHint}`,
      href: `/api/portal/charge-invoice/${charge.id}`,
    });
  }

  return docs.sort((a, b) => a.issuedAt.getTime() - b.issuedAt.getTime());
}

function orderAmountCents(order: OrderInput): number {
  return invoiceGrossCentsFromRsdCents(
    order.totalCents ?? order.totalRsd * 100,
    order,
  );
}
