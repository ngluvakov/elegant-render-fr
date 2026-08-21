/**
 * admin-refund.ts — Admin action that issues a full PayPal refund for a
 * completed order payment.
 *
 * Finance-admin gated (FINANCE_MANAGE). Requires the order to carry a
 * paypalCaptureId (the capture is what PayPal refunds) and a completed
 * paymentStatus. On success flips paymentStatus to "refunded" and
 * transitions the order to "refunded" when the FSM allows it (paid →
 * refunded; later states keep their status but record the payment
 * state). Partial refunds are out of scope — the owner issues those in
 * the PayPal dashboard and the webhook syncs the status.
 *
 * Used by: portal/admin/orders/[orderId] (admin-refund-button).
 */
"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { canTransition, transitionOrder } from "@/lib/order/status-machine";
import { refundPayPalCapture } from "@/lib/payment/paypal";
import { recordAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/admin-auth";

export type RefundPayPalResult =
  | { ok: true; refundId: string | null }
  | { ok: false; reason: string };

export async function refundPayPalPaymentAction(
  orderId: string,
): Promise<RefundPayPalResult> {
  let admin;
  try {
    admin = await requirePermission("FINANCE_MANAGE");
  } catch {
    return { ok: false, reason: "not_admin" };
  }

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return { ok: false, reason: "order_not_found" };

    if (order.paymentProvider !== "paypal") {
      return { ok: false, reason: "not_paypal" };
    }
    if (order.paymentStatus !== "completed") {
      return { ok: false, reason: "not_completed" };
    }
    if (!order.paypalCaptureId) {
      return { ok: false, reason: "no_capture_id" };
    }

    // Full refund of the captured amount — no amount body means PayPal
    // refunds the capture in full, in the currency it was captured in.
    const refund = await refundPayPalCapture(order.paypalCaptureId);

    // Atomic flip mirroring the payment guards: only one of two racing
    // refund clicks records the state change (PayPal itself rejects the
    // second refund of an already-refunded capture).
    const flipped = await prisma.order.updateMany({
      where: { id: orderId, paymentStatus: "completed" },
      data: {
        paymentStatus: "refunded",
        paypalCaptureStatus: "REFUNDED",
      },
    });

    if (flipped.count > 0 && canTransition(order.status, "refunded")) {
      try {
        await transitionOrder(
          orderId,
          "refunded",
          admin.id,
          "Remboursement PayPal émis",
        );
      } catch (err) {
        Sentry.captureException(err, {
          tags: { area: "payment", flow: "paypal-refund-transition" },
          extra: { orderId },
        });
      }
    }

    await recordAuditLog({
      action: "payment.paypal_refund_issued",
      entityType: "Order",
      entityId: orderId,
      metadata: {
        captureId: order.paypalCaptureId,
        refundId: refund.refundId,
        refundStatus: refund.status,
        chargedCurrency: order.chargedCurrency,
        chargedAmountMinor: order.chargedAmountMinor,
      },
    });

    revalidatePath(`/portal/admin/orders/${orderId}`);
    revalidatePath(`/portal/orders/${orderId}`);

    return { ok: true, refundId: refund.refundId };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "payment", flow: "paypal-refund" },
      extra: { orderId },
    });
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "unknown",
    };
  }
}
