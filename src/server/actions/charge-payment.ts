/**
 * charge-payment.ts — shared completion hooks and dev mock-card action
 * for OrderCharge.
 */
"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { processMockCardPaymentCents } from "@/lib/payment/mock-card";
import { enqueueOutboxEvent } from "@/lib/outbox";
import { captureServerEvent } from "@/lib/posthog";
import { issueChargeInvoice } from "@/server/actions/issue-charge-invoice";
import type { BillingCurrency } from "@/lib/billing";

export type ChargePaymentResult = {
  error?: string;
  success?: boolean;
};

async function loadChargeForPayment(chargeId: string) {
  return prisma.orderCharge.findUnique({
    where: { id: chargeId },
    select: {
      id: true,
      orderId: true,
      totalCents: true,
      billingCurrency: true,
      billingTotalCents: true,
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
  billingCurrency: BillingCurrency | null;
  billingTotalCents: number | null;
  provider: "nestpay" | "card_mock";
}) {
  await captureServerEvent({
    distinctId: `user:${args.userId}`,
    event: "additional_charge_paid",
    properties: {
      charge_id: args.chargeId,
      order_id: args.orderId,
      total_cents: args.totalCents,
      billing_currency: args.billingCurrency,
      billing_total_cents: args.billingTotalCents,
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
  billingCurrency: BillingCurrency | null;
  billingTotalCents: number | null;
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
      billingCurrency: args.billingCurrency,
      billingTotalCents: args.billingTotalCents,
    },
    idempotencyKey: `additional_charge_paid:${args.chargeId}`,
  });
}

export async function finishSuccessfulChargePayment(
  chargeId: string,
  provider: "nestpay" | "card_mock",
): Promise<ChargePaymentResult> {
  const charge = await loadChargeForPayment(chargeId);
  if (!charge) return { error: "Naplata nije pronađena." };

  const result = await prisma.orderCharge.updateMany({
    where: { id: chargeId, paymentStatus: { not: "completed" } },
    data: {
      paymentProvider: provider,
      paymentStatus: "completed",
      status: "paid",
      paidAt: new Date(),
    },
  });

  if (result.count > 0) {
    try {
      await issueChargeInvoice(chargeId);
    } catch (err) {
      Sentry.captureException(err, {
        tags: { area: "invoice", flow: "post-charge-payment-hook" },
        extra: { chargeId, orderId: charge.orderId },
      });
    }

    await enqueuePaidEmail({
      chargeId: charge.id,
      orderId: charge.orderId,
      orderNumber: charge.order.orderNumber,
      email: charge.order.user.email,
      totalCents: charge.totalCents,
      billingCurrency: charge.billingCurrency,
      billingTotalCents: charge.billingTotalCents,
    });
    await trackChargePaid({
      chargeId: charge.id,
      orderId: charge.orderId,
      userId: charge.order.userId,
      totalCents: charge.totalCents,
      billingCurrency: charge.billingCurrency,
      billingTotalCents: charge.billingTotalCents,
      provider,
    });
  }

  revalidatePath(`/portal/porudzbine/${charge.orderId}`);
  revalidatePath("/portal/finansije");

  return { success: true };
}

export async function finishFailedChargePayment(chargeId: string) {
  await prisma.orderCharge.updateMany({
    where: { id: chargeId, paymentStatus: { not: "completed" } },
    data: { paymentStatus: "failed" },
  });
}

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
    const { paymentId } = await processMockCardPaymentCents(
      charge.billingTotalCents ?? charge.totalCents,
    );

    await prisma.orderCharge.update({
      where: { id: chargeId },
      data: {
        paymentProvider: "card_mock",
        paymentId,
      },
    });

    return finishSuccessfulChargePayment(chargeId, "card_mock");
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
