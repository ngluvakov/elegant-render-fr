/**
 * charge-payment.ts — PayPal and mock card payment actions for OrderCharge.
 *
 * Mirrors payment.ts but operates on OrderCharge. The low-level
 * PayPal and mock-card libs are payment-target agnostic — they take
 * cents and return a payment id — so all this layer does is plumb
 * the same idempotency dance against the charge row instead of the
 * order row. On successful capture the charge transitions to paid
 * and a confirmation email is enqueued via the outbox.
 *
 * Used by: portal/porudzbine/[orderId] charge payment buttons
 *          (paypal-portal-buttons + pending-payment-card variants).
 */
"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  createPayPalOrderCents as createPPOrder,
  capturePayPalOrder as capturePPOrder,
} from "@/lib/payment/paypal";
import { processMockCardPaymentCents } from "@/lib/payment/mock-card";
import { enqueueOutboxEvent } from "@/lib/outbox";
import { captureServerEvent } from "@/lib/posthog";
import { issueChargeInvoice } from "@/server/actions/issue-charge-invoice";

export type ChargePaymentResult = {
  error?: string;
  success?: boolean;
  paypalOrderId?: string;
};

async function loadChargeForPayment(chargeId: string) {
  return prisma.orderCharge.findUnique({
    where: { id: chargeId },
    select: {
      id: true,
      orderId: true,
      totalCents: true,
      status: true,
      paymentStatus: true,
      paymentProvider: true,
      paymentId: true,
      order: {
        select: {
          orderNumber: true,
          userId: true,
          user: { select: { email: true } },
        },
      },
    },
  });
}

async function trackChargePaid(args: {
  chargeId: string;
  orderId: string;
  userId: string;
  totalCents: number;
  provider: "paypal" | "card_mock";
}) {
  await captureServerEvent({
    distinctId: `user:${args.userId}`,
    event: "additional_charge_paid",
    properties: {
      charge_id: args.chargeId,
      order_id: args.orderId,
      total_cents: args.totalCents,
      provider: args.provider,
    },
  });
}

async function enqueuePaidEmail(args: {
  chargeId: string;
  orderId: string;
  orderNumber: string;
  email: string | null;
  totalCents: number;
}) {
  if (!args.email) return;
  await enqueueOutboxEvent({
    type: "additional_charge_paid_email",
    payload: {
      to: args.email,
      orderNumber: args.orderNumber,
      orderId: args.orderId,
      chargeId: args.chargeId,
      totalCents: args.totalCents,
    },
    idempotencyKey: `additional_charge_paid:${args.chargeId}`,
  });
}

async function finishSuccessfulChargePayment(args: {
  chargeId: string;
  orderId: string;
}) {
  try {
    await issueChargeInvoice(args.chargeId);
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "invoice", flow: "post-charge-payment-hook" },
      extra: { chargeId: args.chargeId, orderId: args.orderId },
    });
  }

  revalidatePath(`/portal/porudzbine/${args.orderId}`);
  revalidatePath("/portal/finansije");
}

// ─── PayPal ──────────────────────────────────────────────

export async function createPayPalChargeAction(
  chargeId: string,
): Promise<ChargePaymentResult> {
  const charge = await loadChargeForPayment(chargeId);
  if (!charge) return { error: "Naplata nije pronađena." };
  if (charge.status === "cancelled") return { error: "Naplata je otkazana." };
  if (charge.status === "paid" || charge.paymentStatus === "completed") {
    return { error: "Naplata je već plaćena." };
  }

  // Idempotency: reuse an existing PayPal order id if one is attached
  // and not yet captured. Mirrors payment.ts:88 — without this, a
  // double-clicked button creates two PayPal orders and orphans one.
  // (paymentStatus is already narrowed to non-completed by the guard
  // above, so we don't recheck it here.)
  if (charge.paymentProvider === "paypal" && charge.paymentId) {
    return { paypalOrderId: charge.paymentId };
  }

  try {
    const paypalOrderId = await createPPOrder(charge.totalCents);

    await prisma.orderCharge.update({
      where: { id: chargeId },
      data: { paymentProvider: "paypal", paymentId: paypalOrderId },
    });

    return { paypalOrderId };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "payment", flow: "paypal-charge-create" },
      extra: { chargeId },
    });
    return {
      error: `PayPal greška: ${err instanceof Error ? err.message : "Nepoznata greška"}`,
    };
  }
}

export async function capturePayPalChargeAction(
  chargeId: string,
  paypalOrderId: string,
): Promise<ChargePaymentResult> {
  const charge = await loadChargeForPayment(chargeId);
  if (!charge) return { error: "Naplata nije pronađena." };

  // Pre-flight idempotency: already captured (double-click, retried
  // POST after lost response) — return success without re-charging.
  if (charge.paymentStatus === "completed" || charge.status === "paid") {
    return { success: true };
  }

  try {
    const { capturedAmountCents, status } = await capturePPOrder(paypalOrderId);

    if (status !== "COMPLETED") return { error: "PayPal plaćanje nije uspelo." };
    if (capturedAmountCents !== charge.totalCents) {
      return { error: "Iznos plaćanja se ne poklapa." };
    }

    // Atomic guard: only one of two racing captures wins. The loser
    // sees count=0 and short-circuits without re-emailing.
    const result = await prisma.orderCharge.updateMany({
      where: { id: chargeId, paymentStatus: { not: "completed" } },
      data: {
        paymentStatus: "completed",
        status: "paid",
        paidAt: new Date(),
      },
    });
    if (result.count === 0) return { success: true };

    await finishSuccessfulChargePayment({
      chargeId: charge.id,
      orderId: charge.orderId,
    });
    await enqueuePaidEmail({
      chargeId: charge.id,
      orderId: charge.orderId,
      orderNumber: charge.order.orderNumber,
      email: charge.order.user.email,
      totalCents: charge.totalCents,
    });
    await trackChargePaid({
      chargeId: charge.id,
      orderId: charge.orderId,
      userId: charge.order.userId,
      totalCents: charge.totalCents,
      provider: "paypal",
    });

    return { success: true };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "payment", flow: "paypal-charge-capture" },
      extra: { chargeId, paypalOrderId },
    });
    return {
      error: `Greška pri potvrdi: ${err instanceof Error ? err.message : "Nepoznata greška"}`,
    };
  }
}

// ─── Mock Card ───────────────────────────────────────────

export async function mockCardChargePaymentAction(
  chargeId: string,
): Promise<ChargePaymentResult> {
  const charge = await loadChargeForPayment(chargeId);
  if (!charge) return { error: "Naplata nije pronađena." };
  if (charge.status === "cancelled") return { error: "Naplata je otkazana." };

  if (charge.paymentStatus === "completed" || charge.status === "paid") {
    return { success: true };
  }

  try {
    const { paymentId } = await processMockCardPaymentCents(charge.totalCents);

    const result = await prisma.orderCharge.updateMany({
      where: { id: chargeId, paymentStatus: { not: "completed" } },
      data: {
        paymentProvider: "card_mock",
        paymentId,
        paymentStatus: "completed",
        status: "paid",
        paidAt: new Date(),
      },
    });
    if (result.count === 0) return { success: true };

    await finishSuccessfulChargePayment({
      chargeId: charge.id,
      orderId: charge.orderId,
    });
    await enqueuePaidEmail({
      chargeId: charge.id,
      orderId: charge.orderId,
      orderNumber: charge.order.orderNumber,
      email: charge.order.user.email,
      totalCents: charge.totalCents,
    });
    await trackChargePaid({
      chargeId: charge.id,
      orderId: charge.orderId,
      userId: charge.order.userId,
      totalCents: charge.totalCents,
      provider: "card_mock",
    });

    return { success: true };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "payment", flow: "card-mock-charge-capture" },
      extra: { chargeId },
    });
    return {
      error: `Greška: ${err instanceof Error ? err.message : "Nepoznata greška"}`,
    };
  }
}
