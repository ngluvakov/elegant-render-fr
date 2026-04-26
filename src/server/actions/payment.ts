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
  createPayPalOrderCents as createPPOrder,
  capturePayPalOrder as capturePPOrder,
} from "@/lib/payment/paypal";
import { processMockCardPaymentCents } from "@/lib/payment/mock-card";
import { enqueueOutboxEvent } from "@/lib/outbox";
import { applyPurchasedAiCreditsForOrder } from "@/server/actions/ai-credits";

export type PaymentResult = {
  error?: string;
  success?: boolean;
  paypalOrderId?: string;
};

function getOrderAmountCents(order: { totalEur: number; totalCents: number | null }) {
  return order.totalCents ?? order.totalEur * 100;
}

async function finishSuccessfulPayment(
  orderId: string,
  options: { enqueueEmail?: boolean } = {},
) {
  const enqueueEmail = options.enqueueEmail ?? true;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { select: { kind: true } },
    },
  });
  if (!order) return;

  await applyPurchasedAiCreditsForOrder(orderId);

  const hasServiceItems = order.items.some((item) => item.kind === "service");
  const hasAiCreditItems = order.items.some((item) => item.kind === "ai_credits");

  if (hasAiCreditItems && !hasServiceItems && order.status === "paid") {
    await transitionOrder(
      orderId,
      "closed",
      undefined,
      "AI krediti aktivirani — porudžbina zatvorena",
    );
  }

  if (enqueueEmail) {
    // Enqueue confirmation email via outbox. Cron processor delivers it;
    // if Resend has a transient outage, the row stays pending and retries.
    await enqueueOutboxEvent({
      type: "order_confirmation_email",
      payload: { orderId },
      idempotencyKey: `order_confirmation:${orderId}`,
    });
  }
}

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
    const paypalOrderId = await createPPOrder(getOrderAmountCents(order));

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
  if (order.paymentStatus === "completed") {
    await finishSuccessfulPayment(orderId, { enqueueEmail: false });
    return { success: true };
  }

  // Idempotency guard 1: pre-flight. If the order is already paid (the
  // user double-clicked, or a previous capture succeeded but the
  // response was lost) treat as success without re-charging the card.
  if (order.paymentStatus === "completed" || order.status === "paid") {
    await finishSuccessfulPayment(orderId, { enqueueEmail: false });
    return { success: true };
  }

  try {
    const { capturedAmountCents, status } = await capturePPOrder(paypalOrderId);

    if (status !== "COMPLETED") {
      return { error: "PayPal plaćanje nije uspelo." };
    }

    if (capturedAmountCents !== getOrderAmountCents(order)) {
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

    await finishSuccessfulPayment(orderId);

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
    await finishSuccessfulPayment(orderId, { enqueueEmail: false });
    return { success: true };
  }

  if (order.status !== "draft" && order.status !== "awaiting_payment") {
    return { error: "Porudžbina nije u ispravnom statusu za plaćanje." };
  }

  try {
    const { paymentId } = await processMockCardPaymentCents(
      getOrderAmountCents(order),
    );

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

    await finishSuccessfulPayment(orderId);

    return { success: true };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "payment", flow: "card-mock-capture" },
      extra: { orderId },
    });
    return { error: `Greška: ${err instanceof Error ? err.message : "Nepoznata greška"}` };
  }
}
