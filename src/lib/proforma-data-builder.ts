/**
 * proforma-data-builder.ts — Shared helper that turns an Order row
 * (with items + user) into a ProformaData payload for the renderer.
 *
 * Used by:
 *   - issueProforma server action (real issuance — allocates a number,
 *     persists, emails)
 *   - /api/admin/proforma-preview route (preview-only — no DB writes,
 *     placeholder number, lets admin sanity-check the PDF before
 *     issuing for real)
 *
 * Keeping the buyer-type → currency / VAT / recipient mapping in one
 * place avoids divergence between what's previewed and what's
 * actually issued. Numbers/dates flow in as parameters so the caller
 * controls those — the preview uses placeholders, real issuance uses
 * allocated values.
 */
import type { ProformaData, ProformaLineItem } from "@/lib/proforma-pdf";

type OrderForProforma = {
  orderNumber: string;
  buyerType: "individual" | "company_rs" | "company_foreign";
  companyName: string | null;
  companyTaxId: string | null;
  companyMb: string | null;
  companyAddress: string | null;
  companyCountryCode: string | null;
  user: { name: string | null; email: string | null };
  items: Array<{
    productLabel: string;
    totalCents: number | null;
    totalEur: number;
  }>;
};

export type BuildProformaDataOptions = {
  proformaNumber: string;
  issueDate: Date;
  dueDate: Date;
};

export type BuildProformaDataResult =
  | { ok: true; data: ProformaData }
  | { ok: false; reason: "no_billable_items" };

export function buildProformaDataForOrder(
  order: OrderForProforma,
  options: BuildProformaDataOptions,
): BuildProformaDataResult {
  const buyerType = order.buyerType;
  const isExport = buyerType === "company_foreign";
  const currency: "RSD" | "EUR" = isExport ? "EUR" : "RSD";

  const recipient = buildRecipient(order);
  const items: ProformaLineItem[] = order.items
    .filter((it) => it.totalCents != null && it.totalCents > 0)
    .map((it) => {
      const totalCents = it.totalCents ?? Math.round(it.totalEur * 100);
      // Cents already include VAT for domestic orders. The PDF wants
      // net cents per line so it can break out VAT separately.
      // Domestic VAT is 20%: net = total / 1.2.
      const unitNet = isExport ? totalCents : Math.round(totalCents / 1.2);
      return {
        description: it.productLabel,
        quantity: 1,
        unitPriceNetCents: unitNet,
        vatRate: isExport ? 0 : 0.2,
      };
    });

  if (items.length === 0) return { ok: false, reason: "no_billable_items" };

  return {
    ok: true,
    data: {
      proformaNumber: options.proformaNumber,
      issueDate: options.issueDate,
      dueDate: options.dueDate,
      buyerType,
      recipient,
      items,
      currency,
      paymentReference: order.orderNumber,
    },
  };
}

function buildRecipient(order: OrderForProforma): ProformaData["recipient"] {
  if (order.buyerType === "individual") {
    return {
      name: order.user.name ?? order.user.email ?? "Kupac",
      address: "—",
      email: order.user.email,
    };
  }
  return {
    name: order.companyName ?? "—",
    address: order.companyAddress ?? "—",
    taxId: order.companyTaxId,
    mb: order.companyMb,
    countryCode: order.companyCountryCode,
    email: order.user.email,
  };
}
