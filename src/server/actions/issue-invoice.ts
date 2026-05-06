/**
 * issue-invoice.ts — Generates the legal invoice for a paid order.
 *
 * Pipeline (best-effort, idempotent):
 *   1. Load the order with items + user (skip if invoice already
 *      issued — prevents duplicate numbers on retried captures).
 *   2. Allocate a fresh invoice number atomically per calendar year.
 *   3. Render the PDF via src/lib/invoice-pdf.tsx.
 *   4. Upload to Supabase storage (bucket order-files, path
 *      invoices/{year}/{number}.pdf).
 *   5. Update Order.invoiceNumber, invoiceIssuedAt, invoicePdfPath.
 *   6. Enqueue an outbox event so the customer gets the PDF by email.
 *   7. Audit-log invoice.issued (or invoice.error on failure).
 *
 * Failure semantics: this runs AFTER the payment provider has
 * confirmed funds. We never reverse the payment if invoicing fails —
 * the audit log + Sentry alert lets ops re-issue manually, but the
 * order stays paid.
 */
"use server";

import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase";
import { recordAuditLog } from "@/lib/audit";
import { allocateInvoiceNumber } from "@/lib/invoice-number";
import { renderInvoicePdf, type InvoiceData } from "@/lib/invoice-pdf";
import { enqueueOutboxEvent } from "@/lib/outbox";
import { UPLOADS_BUCKET } from "@/lib/file-scan";

export type IssueInvoiceResult =
  | { ok: true; invoiceNumber: string }
  | { ok: false; reason: string };

export async function issueInvoice(orderId: string): Promise<IssueInvoiceResult> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: { select: { name: true, email: true } },
      },
    });
    if (!order) return { ok: false, reason: "order_not_found" };

    // Idempotency — invoice already issued (e.g. PayPal capture
    // retried after a transient error). Return the existing number.
    if (order.invoiceNumber) {
      return { ok: true, invoiceNumber: order.invoiceNumber };
    }

    // Decide currency + recipient block from buyer type. The split
    // mirrors the three layouts in invoice-pdf.tsx so a customer always
    // sees a document that matches what they entered at checkout.
    const buyerType = order.buyerType;
    const isExport = buyerType === "company_foreign";
    // Currency follows the existing pricing model: EUR for foreign
    // orders, RSD for domestic. The order rows store totalCents in the
    // billed currency (totalCents already reflects geo-currency).
    const currency: "RSD" | "EUR" = isExport ? "EUR" : "RSD";

    const recipient = buildRecipient(order);
    const items = order.items
      .filter((it) => it.totalCents != null && it.totalCents > 0)
      .map((it) => {
        // Cents already include VAT for domestic orders. For invoices
        // we need NET cents per line so the PDF can break out the VAT
        // separately. Domestic VAT is 20%: net = total / 1.2.
        const totalCents = it.totalCents ?? Math.round(it.totalEur * 100);
        const unitNet = isExport
          ? totalCents
          : Math.round(totalCents / 1.2);
        return {
          description: it.productLabel,
          quantity: 1,
          unitPriceNetCents: unitNet,
          vatRate: isExport ? 0 : 0.2,
        };
      });

    // Allocate the number AFTER we've validated the order has billable
    // items — avoids burning a number on a malformed row.
    if (items.length === 0) {
      return { ok: false, reason: "no_billable_items" };
    }

    const now = new Date();
    const year = now.getFullYear();
    const allocation = await allocateInvoiceNumber(year);

    const invoiceData: InvoiceData = {
      invoiceNumber: allocation.formatted,
      issueDate: now,
      serviceDate: now,
      buyerType,
      recipient,
      items,
      currency,
      paymentMethod: paymentMethodLabel(order.paymentProvider, isExport),
    };

    const pdfBuffer = await renderInvoicePdf(invoiceData);

    const storagePath = `invoices/${year}/${allocation.formatted}.pdf`;
    const supabase = getSupabaseAdmin();
    const upload = await supabase.storage
      .from(UPLOADS_BUCKET)
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });
    if (upload.error) {
      throw new Error(`Supabase upload failed: ${upload.error.message}`);
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        invoiceNumber: allocation.formatted,
        invoiceIssuedAt: now,
        invoicePdfPath: storagePath,
      },
    });

    if (order.user.email) {
      await enqueueOutboxEvent({
        type: "invoice_issued_email",
        payload: {
          orderId,
          to: order.user.email,
          invoiceNumber: allocation.formatted,
          totalEur: order.totalEur,
          pdfPath: storagePath,
        },
        idempotencyKey: `invoice_issued_email:${orderId}:${allocation.formatted}`,
      });
    }

    await recordAuditLog({
      action: "invoice.issued",
      entityType: "Order",
      entityId: orderId,
      metadata: {
        invoiceNumber: allocation.formatted,
        buyerType,
        currency,
        totalEur: order.totalEur,
        pdfPath: storagePath,
      },
    });

    return { ok: true, invoiceNumber: allocation.formatted };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "invoice", flow: "issue" },
      extra: { orderId },
    });
    await recordAuditLog({
      action: "invoice.error",
      entityType: "Order",
      entityId: orderId,
      metadata: {
        errorReason: err instanceof Error ? err.message : String(err),
      },
    });
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "unknown",
    };
  }
}

function buildRecipient(order: {
  buyerType: "individual" | "company_rs" | "company_foreign";
  companyName: string | null;
  companyTaxId: string | null;
  companyMb: string | null;
  companyAddress: string | null;
  companyCountryCode: string | null;
  user: { name: string | null; email: string | null };
}): InvoiceData["recipient"] {
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

function paymentMethodLabel(
  provider: string | null,
  isExport: boolean,
): string {
  if (provider === "paypal") return "PayPal";
  if (provider === "intesa") {
    return isExport ? "Card (Banca Intesa)" : "Platna kartica (Banca Intesa)";
  }
  return isExport ? "Online payment" : "Online plaćanje";
}
