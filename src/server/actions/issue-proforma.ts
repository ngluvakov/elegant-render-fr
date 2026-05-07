/**
 * issue-proforma.ts — Generates a predračun (proforma) for an order
 * the customer is expected to pay by wire transfer.
 *
 * Pipeline (best-effort, idempotent):
 *   1. Load the order with items + user
 *   2. Skip if proformaNumber already exists
 *   3. Allocate a fresh proforma number (P-{year}-{seq})
 *   4. Render PDF via src/lib/proforma-pdf.tsx
 *   5. Upload to Supabase storage at proformas/{year}/{number}.pdf
 *   6. Update Order.proformaNumber, proformaIssuedAt, proformaPdfPath
 *   7. Enqueue proforma_issued_email outbox event
 *   8. Audit-log proforma.issued (or proforma.error on failure)
 *
 * Difference from issueInvoice (A.2):
 *   - Different counter (ProformaCounter, "P-" prefix)
 *   - Different PDF (PREDRAČUN header + bank instructions block)
 *   - Different Supabase prefix (proformas/ instead of invoices/)
 *   - NOT a tax document — final faktura is issued separately when
 *     funds land via the existing finishSuccessfulPayment hook
 */
"use server";

import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase";
import { recordAuditLog } from "@/lib/audit";
import { allocateProformaNumber } from "@/lib/proforma-number";
import { renderProformaPdf } from "@/lib/proforma-pdf";
import { enqueueOutboxEvent } from "@/lib/outbox";
import { UPLOADS_BUCKET } from "@/lib/file-scan";
import { requireAdmin } from "@/server/actions/admin";
import { buildProformaDataForOrder } from "@/lib/proforma-data-builder";

export type IssueProformaResult =
  | { ok: true; proformaNumber: string }
  | { ok: false; reason: string };

const PROFORMA_VALIDITY_DAYS = 14;

export async function issueProforma(orderId: string): Promise<IssueProformaResult> {
  // Admin-only — only triggered by the admin button on order detail.
  // The wizard for inquiry → order conversion (separate later PR)
  // will also call this through requireAdmin().
  try {
    await requireAdmin();
  } catch {
    return { ok: false, reason: "not_admin" };
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: { select: { name: true, email: true } },
      },
    });
    if (!order) return { ok: false, reason: "order_not_found" };

    if (order.proformaNumber) {
      return { ok: true, proformaNumber: order.proformaNumber };
    }

    // Cheap pre-flight: refuse before burning a counter slot if the
    // order has no billable items. The full builder runs again below
    // with the real number.
    const billable = order.items.filter(
      (it) => it.totalCents != null && it.totalCents > 0,
    );
    if (billable.length === 0) {
      return { ok: false, reason: "no_billable_items" };
    }

    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + PROFORMA_VALIDITY_DAYS);

    const year = now.getFullYear();
    const allocation = await allocateProformaNumber(year);

    const built = buildProformaDataForOrder(order, {
      proformaNumber: allocation.formatted,
      issueDate: now,
      dueDate,
    });
    if (!built.ok) return { ok: false, reason: built.reason };
    const proformaData = built.data;
    const buyerType = proformaData.buyerType;
    const currency = proformaData.currency;

    const pdfBuffer = await renderProformaPdf(proformaData);

    const storagePath = `proformas/${year}/${allocation.formatted}.pdf`;
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
        proformaNumber: allocation.formatted,
        proformaIssuedAt: now,
        proformaPdfPath: storagePath,
        // Implicitly mark this as a wire-transfer order if it wasn't
        // already — the predračun action only makes sense for that
        // payment method.
        paymentMethod: "wire_transfer",
      },
    });

    if (order.user.email) {
      await enqueueOutboxEvent({
        type: "proforma_issued_email",
        payload: {
          orderId,
          to: order.user.email,
          proformaNumber: allocation.formatted,
          totalEur: order.totalEur,
          pdfPath: storagePath,
          dueDate: dueDate.toISOString(),
        },
        idempotencyKey: `proforma_issued_email:${orderId}:${allocation.formatted}`,
      });
    }

    await recordAuditLog({
      action: "proforma.issued",
      entityType: "Order",
      entityId: orderId,
      metadata: {
        proformaNumber: allocation.formatted,
        buyerType,
        currency,
        totalEur: order.totalEur,
        pdfPath: storagePath,
      },
    });

    return { ok: true, proformaNumber: allocation.formatted };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "proforma", flow: "issue" },
      extra: { orderId },
    });
    await recordAuditLog({
      action: "proforma.error",
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

