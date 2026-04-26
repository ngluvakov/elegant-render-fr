/**
 * payment.ts — PayPal and mock card payment server actions.
 *
 * Exports createPayPalOrderAction, capturePayPalOrderAction, and
 * mockCardPaymentAction. Each transitions order status and sends
 * confirmation email on successful capture.
 *
 * Used by: poruci/steps/step-payment, paypal-buttons,
 *          portal/pending-payment-card, paypal-portal-buttons
 */
"use server";

import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { transitionOrder } from "@/lib/order/status-machine";
import {
  createPayPalOrder as createPPOrder,
  capturePayPalOrder as capturePPOrder,
} from "@/lib/payment/paypal";
import { processMockCardPayment } from "@/lib/payment/mock-card";
import { enqueueOutboxEvent } from "@/lib/outbox";

export type PaymentResult = {
  error?: string;
  success?: boolean;
  paypalOrderId?: string;
};

// ─── PayPal ──────────────────────────────────────────────

export async function createPayPalOrderAction(
  orderId: string,
): Promise<PaymentResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Porudžbina nije pronađena." };
  if (order.status !== "draft" && order.status !== "awaiting_payment") {
    return { error: "Porudžbina nije u ispravnom statusu za plaćanje." };
  }

  // Idempotency: if a PayPal order id is already attached to this Order
  // and we haven't captured yet, reuse it instead of creating a second
  // PayPal order. Without this, a double-click on the PayPal button
  // creates two PayPal orders and orphans the first.
  if (
    order.paymentProvider === "paypal" &&
    order.paymentId &&
    order.paymentStatus !== "completed"
  ) {
    return { paypalOrderId: order.paymentId };
  }

  try {
    const paypalOrderId = await createPPOrder(order.totalEur);

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentProvider: "paypal",
        paymentId: paypalOrderId,
      },
    });

    if (order.status === "draft") {
      await transitionOrder(orderId, "awaiting_payment", undefined, "PayPal plaćanje započeto");
    }

    return { paypalOrderId };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "payment", flow: "paypal-create" },
      extra: { orderId },
    });
    return { error: `PayPal greška: ${err instanceof Error ? err.message : "Nepoznata greška"}` };
  }
}

export async function capturePayPalOrderAction(
  orderId: string,
  paypalOrderId: string,
): Promise<PaymentResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Porudžbina nije pronađena." };

  // Idempotency guard 1: pre-flight. If the order is already paid (the
  // user double-clicked, or a previous capture succeeded but the
  // response was lost) treat as success without re-charging the card.
  if (order.paymentStatus === "completed" || order.status === "paid") {
    return { success: true };
  }

  try {
    const { capturedAmount, status } = await capturePPOrder(paypalOrderId);

    if (status !== "COMPLETED") {
      return { error: "PayPal plaćanje nije uspelo." };
    }

    if (capturedAmount !== order.totalEur) {
      return { error: "Iznos plaćanja se ne poklapa." };
    }

    // Idempotency guard 2: race-safe atomic transition. Two concurrent
    // captures both pass the pre-flight check above; updateMany with the
    // `paymentStatus != completed` condition lets exactly one succeed.
    // The loser sees count=0 and short-circuits without re-emailing.
    const result = await prisma.order.updateMany({
      where: { id: orderId, paymentStatus: { not: "completed" } },
      data: { paymentStatus: "completed" },
    });
    if (result.count === 0) {
      // Concurrent request beat us; their flow handles the email.
      return { success: true };
    }

    await transitionOrder(orderId, "paid", undefined, "PayPal plaćanje potvrđeno");

    // Enqueue confirmation email via outbox. Cron processor delivers
    // it; if Resend has a transient outage, the row stays pending and
    // retries with exponential backoff. Idempotency key prevents
    // re-enqueue on duplicate captures (the unique constraint on the
    // outbox table enforces this).
    await enqueueOutboxEvent({
      type: "order_confirmation_email",
      payload: { orderId },
      idempotencyKey: `order_confirmation:${orderId}`,
    });

    return { success: true };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "payment", flow: "paypal-capture" },
      extra: { orderId, paypalOrderId },
    });
    return { error: `Greška pri potvrdi: ${err instanceof Error ? err.message : "Nepoznata greška"}` };
  }
}

// ─── Mock Card ───────────────────────────────────────────

export async function mockCardPaymentAction(
  orderId: string,
): Promise<PaymentResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Porudžbina nije pronađena." };

  // Idempotency guard 1: pre-flight. Run before the "valid status"
  // check so a double-clicked already-paid order returns success
  // instead of the confusing "Porudžbina nije u ispravnom statusu"
  // error (paid orders fail the draft/awaiting_payment filter).
  if (order.paymentStatus === "completed" || order.status === "paid") {
    return { success: true };
  }

  if (order.status !== "draft" && order.status !== "awaiting_payment") {
    return { error: "Porudžbina nije u ispravnom statusu za plaćanje." };
  }

  try {
    const { paymentId } = await processMockCardPayment(order.totalEur);

    if (order.status === "draft") {
      await transitionOrder(orderId, "awaiting_payment");
    }

    // Idempotency guard 2: atomic transition that wins exactly once
    // even if two captures race. Sets paymentStatus + provider + id in
    // the same conditional update so we don't double-email.
    const result = await prisma.order.updateMany({
      where: { id: orderId, paymentStatus: { not: "completed" } },
      data: {
        paymentProvider: "card_mock",
        paymentId,
        paymentStatus: "completed",
      },
    });
    if (result.count === 0) {
      return { success: true };
    }

    await transitionOrder(orderId, "paid", undefined, "Kartično plaćanje potvrđeno (test)");

    await enqueueOutboxEvent({
      type: "order_confirmation_email",
      payload: { orderId },
      idempotencyKey: `order_confirmation:${orderId}`,
    });

    return { success: true };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "payment", flow: "card-mock-capture" },
      extra: { orderId },
    });
    return { error: `Greška: ${err instanceof Error ? err.message : "Nepoznata greška"}` };
  }
}
