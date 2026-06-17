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
import {
  buildInvoiceLineItem,
  buildInvoiceRecipient,
  invoiceGrossCentsFromRsdCents,
  invoiceCurrencyForBuyer,
  invoiceVatRateForBuyer,
  isExportInvoice,
  paymentMethodLabel,
} from "@/lib/invoice-data";
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

    // Idempotency — invoice already issued (e.g. payment callback
    // retried after a transient error). Return the existing number.
    if (order.invoiceNumber) {
      return { ok: true, invoiceNumber: order.invoiceNumber };
    }

    // Decide currency + recipient block from buyer type. The split
    // mirrors the three layouts in invoice-pdf.tsx so a customer always
    // sees a document that matches what they entered at checkout.
    const buyerType = order.buyerType;
    const isExport = isExportInvoice(order);
    const currency = invoiceCurrencyForBuyer(order);
    const vatRate = invoiceVatRateForBuyer(order);
    const recipient = buildInvoiceRecipient(order);
    const items = order.items
      .filter((it) => (it.totalCents ?? Math.round(it.totalRsd * 100)) > 0)
      .map((it) => {
        const totalCents = it.totalCents ?? Math.round(it.totalRsd * 100);
        return buildInvoiceLineItem({
          description: it.productLabel,
          grossUnitCents: invoiceGrossCentsFromRsdCents(totalCents, order),
          vatRate,
        });
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
          totalRsd: order.totalRsd,
          billingCurrency: currency,
          billingTotalCents: order.billingTotalCents,
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
        totalRsd: order.totalRsd,
        billingTotalCents: order.billingTotalCents,
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
