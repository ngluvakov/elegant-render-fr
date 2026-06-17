/**
 * payment.ts — shared payment completion hooks and dev mock-card action.
 *
 * NestPay return/reconciliation, wire transfer marking, and the test-only
 * mock card path all use the same success/failure hooks.
 */
"use server";

import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { transitionOrder } from "@/lib/order/status-machine";
import { processMockCardPaymentCents } from "@/lib/payment/mock-card";
import { enqueueOutboxEvent } from "@/lib/outbox";
import { applyPurchasedAiCreditsForOrder } from "@/server/actions/ai-credits";
import { issueInvoice } from "@/server/actions/issue-invoice";
import { buildPurchaseDataLayerEvent } from "@/server/analytics/google-conversions";
import type { GooglePurchaseDataLayerEvent } from "@/lib/analytics/google-data-layer";

export type PaymentResult = {
  error?: string;
  success?: boolean;
  purchaseEvent?: GooglePurchaseDataLayerEvent;
};

function getOrderAmountCents(order: { totalRsd: number; totalCents: number | null }) {
  return order.totalCents ?? order.totalRsd * 100;
}

async function paymentSuccessResult(
  orderId: string,
  conversionSource: Parameters<typeof buildPurchaseDataLayerEvent>[1],
): Promise<PaymentResult> {
  const purchaseEvent = await buildPurchaseDataLayerEvent(
    orderId,
    conversionSource,
  );
  return {
    success: true,
    ...(purchaseEvent ? { purchaseEvent } : {}),
  };
}

export type FailedPaymentDetails = {
  provider: "nestpay";
  reason?: string;
  procReturnCode?: string;
  response?: string;
  errMsg?: string;
};

/**
 * Symmetric counterpart to `finishSuccessfulPayment`. Called from
 * the Nestpay return handler when the bank reports a decline or
 * error, and from the reconciler when a query confirms the same.
 *
 * Leaves the order in `awaiting_payment` rather than `cancelled` so
 * the customer can retry from the same checkout state. The forensic
 * snapshot (transId, procReturnCode, etc.) is persisted by the route
 * handler before this is called — here we flip paymentStatus and fire
 * the bank-mandated failure email.
 */
export async function finishFailedPayment(
  orderId: string,
  details: FailedPaymentDetails,
) {
  await prisma.order.updateMany({
    where: { id: orderId, paymentStatus: { not: "completed" } },
    data: { paymentStatus: "failed" },
  });

  await enqueueOutboxEvent({
    type: "payment_failure_email",
    payload: {
      orderId,
      reason: details.reason ?? null,
      procReturnCode: details.procReturnCode ?? null,
      response: details.response ?? null,
      errMsg: details.errMsg ?? null,
    },
    // Per-attempt key: include transId so a same-order second decline
    // still emails the customer. Falls back to the response code so
    // we don't end up emailing twice when the bank retries the POST.
    idempotencyKey: `payment_failure:${orderId}:${details.procReturnCode ?? details.response ?? "x"}`,
  });
}

export async function finishSuccessfulPayment(
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

  // Issue the legal invoice. Best-effort: a failure here doesn't
  // reverse the payment (funds are already captured by the provider),
  // and issueInvoice is idempotent on retry — calling it again on an
  // order that already has invoiceNumber returns the existing one.
  // Errors surface to Sentry + audit log inside issueInvoice itself.
  try {
    await issueInvoice(orderId);
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "invoice", flow: "post-payment-hook" },
      extra: { orderId },
    });
  }

  if (enqueueEmail) {
    // NestPay orders receive the bank-format payment confirmation email
    // (EPM standard 2.7 — 5 mandatory blocks + 7 transaction parameters)
    // instead of the platform's generic order confirmation. The
    // generic confirmation continues to fire for card_mock and
    // wire_transfer orders where no bank-specific copy applies.
    const isNestpay = order.paymentProvider === "nestpay";
    await enqueueOutboxEvent({
      type: isNestpay ? "payment_success_email" : "order_confirmation_email",
      payload: { orderId },
      idempotencyKey: isNestpay
        ? `payment_success:${orderId}`
        : `order_confirmation:${orderId}`,
    });
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
    return paymentSuccessResult(orderId, "mock_card_replay");
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
      return paymentSuccessResult(orderId, "mock_card_race");
    }

    await transitionOrder(orderId, "paid", undefined, "Kartično plaćanje potvrđeno (test)");

    await finishSuccessfulPayment(orderId);

    return paymentSuccessResult(orderId, "mock_card_success");
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "payment", flow: "card-mock-capture" },
      extra: { orderId },
    });
    return { error: `Greška: ${err instanceof Error ? err.message : "Nepoznata greška"}` };
  }
}
