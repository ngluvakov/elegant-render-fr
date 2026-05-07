/**
 * mark-wire-paid.ts — Admin action that records a successful wire
 * transfer payment against an order on the predračun (proforma) flow.
 *
 * Closes the loop opened by issueProforma: the customer paid the
 * predračun off-platform (bank transfer), and the admin now flips the
 * order to paid + completed payment. That triggers the same
 * post-payment hook (finishSuccessfulPayment) used by PayPal/card —
 * konačni račun is issued, AI credits are applied, the customer
 * receives the order_confirmation_email with the invoice attached.
 *
 * Used by: admin order detail (admin-mark-paid-button)
 */
"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { transitionOrder } from "@/lib/order/status-machine";
import { recordAuditLog } from "@/lib/audit";
import { requireAdmin } from "@/server/actions/admin";
import { finishSuccessfulPayment } from "@/server/actions/payment";

export type MarkWirePaidResult =
  | { ok: true }
  | { ok: false; reason: string };

export async function markWireTransferPaid(
  orderId: string,
): Promise<MarkWirePaidResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, reason: "not_admin" };
  }

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return { ok: false, reason: "order_not_found" };

    if (order.paymentMethod !== "wire_transfer") {
      return { ok: false, reason: "not_wire_transfer" };
    }
    if (!order.proformaNumber) {
      return { ok: false, reason: "no_proforma" };
    }
    if (order.paymentStatus === "completed") {
      return { ok: false, reason: "already_paid" };
    }

    // Atomic flip: paymentStatus + provider in one update with a
    // not-completed guard, mirroring the PayPal/card pattern. If two
    // admins click the button at the same time, only one wins.
    const result = await prisma.order.updateMany({
      where: { id: orderId, paymentStatus: { not: "completed" } },
      data: {
        paymentProvider: "wire_transfer",
        paymentStatus: "completed",
      },
    });
    if (result.count === 0) {
      return { ok: false, reason: "already_paid" };
    }

    // FSM only allows draft → awaiting_payment → paid, so step
    // through awaiting_payment if the order never started a payment.
    // Predračun by itself doesn't transition status (issueProforma
    // leaves order in draft) — admin marking paid is the first
    // transition for the wire-transfer flow.
    if (order.status === "draft") {
      await transitionOrder(
        orderId,
        "awaiting_payment",
        admin.id,
        "Predračun aktivan — čeka uplatu",
      );
    }
    await transitionOrder(
      orderId,
      "paid",
      admin.id,
      "Uplata po predračunu primljena",
    );

    // Same hook as PayPal/card: applies AI credits, transitions
    // AI-only orders to closed, issues the konačni račun, and
    // enqueues the confirmation email with the invoice attached.
    await finishSuccessfulPayment(orderId);

    await recordAuditLog({
      action: "payment.wire_received",
      entityType: "Order",
      entityId: orderId,
      metadata: {
        proformaNumber: order.proformaNumber,
        totalEur: order.totalEur,
        buyerType: order.buyerType,
      },
    });

    revalidatePath(`/portal/admin/porudzbine/${orderId}`);
    revalidatePath(`/portal/porudzbine/${orderId}`);

    return { ok: true };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "payment", flow: "wire-mark-paid" },
      extra: { orderId },
    });
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "unknown",
    };
  }
}
