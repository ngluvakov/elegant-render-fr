/**
 * issue-charge-invoice.ts — Generates the legal invoice for a paid
 * additional charge.
 *
 * Extra payment requests are self-serve payments attached to an existing
 * order. Once the charge payment is captured, this mirrors the order
 * invoice pipeline: allocate a number, render PDF, upload it, store the
 * invoice fields on OrderCharge, email the PDF, and audit the event.
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
  invoiceCurrencyForBuyer,
  isExportInvoice,
  paymentMethodLabel,
} from "@/lib/invoice-data";
import { enqueueOutboxEvent } from "@/lib/outbox";
import { UPLOADS_BUCKET } from "@/lib/file-scan";

export type IssueChargeInvoiceResult =
  | { ok: true; invoiceNumber: string }
  | { ok: false; reason: string };

export async function issueChargeInvoice(
  chargeId: string,
): Promise<IssueChargeInvoiceResult> {
  try {
    const charge = await prisma.orderCharge.findUnique({
      where: { id: chargeId },
      include: {
        items: true,
        order: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });
    if (!charge) return { ok: false, reason: "charge_not_found" };

    if (charge.invoiceNumber) {
      return { ok: true, invoiceNumber: charge.invoiceNumber };
    }
    if (charge.status !== "paid" || charge.paymentStatus !== "completed") {
      return { ok: false, reason: "not_paid" };
    }

    const order = charge.order;
    const buyerType = order.buyerType;
    const isExport = isExportInvoice(buyerType);
    const currency = invoiceCurrencyForBuyer(buyerType);
    const recipient = buildInvoiceRecipient(order);
    const items = charge.items
      .filter((it) => it.amountCents > 0 && it.quantity > 0)
      .map((it) =>
        buildInvoiceLineItem({
          description: it.label,
          grossUnitCents: it.amountCents,
          quantity: it.quantity,
          isExport,
        }),
      );

    if (items.length === 0) {
      return { ok: false, reason: "no_billable_items" };
    }

    const now = new Date();
    const year = now.getFullYear();
    const allocation = await allocateInvoiceNumber(year);

    const invoiceData: InvoiceData = {
      invoiceNumber: allocation.formatted,
      issueDate: now,
      serviceDate: charge.paidAt ?? now,
      buyerType,
      recipient,
      items,
      currency,
      paymentMethod: paymentMethodLabel(charge.paymentProvider, isExport),
    };

    const pdfBuffer = await renderInvoicePdf(invoiceData);
    const storagePath = `invoices/${year}/${allocation.formatted}.pdf`;
    const upload = await getSupabaseAdmin().storage
      .from(UPLOADS_BUCKET)
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });
    if (upload.error) {
      throw new Error(`Supabase upload failed: ${upload.error.message}`);
    }

    await prisma.orderCharge.update({
      where: { id: chargeId },
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
          orderId: order.id,
          chargeId,
          to: order.user.email,
          invoiceNumber: allocation.formatted,
          totalEur: charge.totalCents / 100,
          pdfPath: storagePath,
        },
        idempotencyKey: `charge_invoice_issued_email:${chargeId}:${allocation.formatted}`,
      });
    }

    await recordAuditLog({
      action: "invoice.charge_issued",
      entityType: "OrderCharge",
      entityId: chargeId,
      metadata: {
        orderId: order.id,
        invoiceNumber: allocation.formatted,
        buyerType,
        currency,
        totalEur: charge.totalCents / 100,
        pdfPath: storagePath,
      },
    });

    return { ok: true, invoiceNumber: allocation.formatted };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "invoice", flow: "issue-charge" },
      extra: { chargeId },
    });
    await recordAuditLog({
      action: "invoice.charge_error",
      entityType: "OrderCharge",
      entityId: chargeId,
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
