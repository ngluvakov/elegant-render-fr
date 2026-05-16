/**
 * retry-invoice.ts — Admin-only fallback that re-runs the invoice
 * issuance pipeline on a paid order whose post-payment hook didn't
 * land an invoiceNumber.
 *
 * The normal path (finishSuccessfulPayment → issueInvoice) is
 * best-effort: if Supabase or PDF rendering fails, the order stays
 * paid but invoiceNumber is null. issueInvoice is idempotent (returns
 * the existing number if one was set in a prior call), so this action
 * is safe to call any number of times.
 *
 * Audits invoice.retry_requested separately from invoice.issued so
 * ops can tell at-a-glance which invoices were ops-rescued vs
 * automatic.
 */
"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/admin-auth";
import {
  issueInvoice,
  type IssueInvoiceResult,
} from "@/server/actions/issue-invoice";

export async function retryIssueInvoice(
  orderId: string,
): Promise<IssueInvoiceResult> {
  let admin;
  try {
    admin = await requirePermission("FINANCE_MANAGE");
  } catch {
    return { ok: false, reason: "not_admin" };
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        paymentStatus: true,
        invoiceNumber: true,
      },
    });
    if (!order) return { ok: false, reason: "order_not_found" };

    // Refuse the retry if the underlying payment isn't completed —
    // we never want admin clicks to manufacture invoices for orders
    // that haven't actually paid.
    if (order.paymentStatus !== "completed") {
      return { ok: false, reason: "not_paid" };
    }

    await recordAuditLog({
      action: "invoice.retry_requested",
      entityType: "Order",
      entityId: orderId,
      metadata: {
        existingInvoiceNumber: order.invoiceNumber,
        actorId: admin.id,
      },
    });

    const result = await issueInvoice(orderId);

    revalidatePath(`/portal/admin/porudzbine/${orderId}`);
    revalidatePath(`/portal/porudzbine/${orderId}`);

    return result;
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "invoice", flow: "retry" },
      extra: { orderId },
    });
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "unknown",
    };
  }
}
