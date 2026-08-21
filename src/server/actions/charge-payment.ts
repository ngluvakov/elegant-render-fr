/**
 * charge-payment.ts — PayPal payment actions, shared completion hooks
 * and the dev-only mock card action for OrderCharge.
 *
 * Mirrors payment.ts but operates on OrderCharge rows: the same double
 * idempotency guard (pre-flight PayPal-order-id reuse + race-safe
 * `paymentStatus != completed` atomic winner), the same fail-closed
 * charge-snapshot and captured-amount checks, and the same PENDING
 * (eCheck) handling — the webhook / reconciler completes those later.
 *
 * Used by: portal charge-payment-card, api/paypal/webhook.
 */
"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  capturePayPalOrder,
  createPayPalOrderMinor,
  getPayPalOrder,
  isPayPalOrderNotFound,
} from "@/lib/payment/paypal";
import { isChargeCurrency } from "@/lib/currency/config";
import { processMockCardPaymentCents } from "@/lib/payment/mock-card";
import { enqueueOutboxEvent } from "@/lib/outbox";
import { captureServerEvent } from "@/lib/posthog";
import {
  checkRateLimit,
  getServerActionIdentifier,
  rateLimitMessage,
} from "@/lib/rate-limit";
import { issueChargeInvoice } from "@/server/actions/issue-charge-invoice";
import type { BillingCurrency } from "@/lib/billing";

export type ChargePaymentResult = {
  error?: string;
  success?: boolean;
  /** "completed" — funds captured; "processing" — eCheck capture PENDING. */
  status?: "completed" | "processing";
  paypalOrderId?: string;
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
      chargedCurrency: true,
      chargedAmountMinor: true,
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
  provider: "paypal" | "card_mock";
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
  provider: "paypal" | "card_mock",
): Promise<ChargePaymentResult> {
  const charge = await loadChargeForPayment(chargeId);
  if (!charge) return { error: "Le supplément est introuvable." };

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

  revalidatePath(`/portal/orders/${charge.orderId}`);
  revalidatePath("/portal/finance");

  return { success: true, status: "completed" };
}

export async function finishFailedChargePayment(chargeId: string) {
  await prisma.orderCharge.updateMany({
    where: { id: chargeId, paymentStatus: { not: "completed" } },
    data: { paymentStatus: "failed" },
  });
}

// ─── PayPal ──────────────────────────────────────────────

export async function createPayPalChargeAction(
  chargeId: string,
): Promise<ChargePaymentResult> {
  const charge = await loadChargeForPayment(chargeId);
  if (!charge) return { error: "Le supplément est introuvable." };
  if (charge.status === "cancelled") return { error: "Ce supplément a été annulé." };
  if (charge.status === "paid" || charge.paymentStatus === "completed") {
    return { error: "Ce supplément a déjà été payé." };
  }

  const session = await auth();
  if (session?.user?.id && session.user.id !== charge.order.userId) {
    return { error: "Vous n’avez pas accès à ce supplément." };
  }

  const identifier = await getServerActionIdentifier();
  const rate = await checkRateLimit("paypalCreate", identifier);
  if (!rate.ok) {
    return { error: rateLimitMessage(rate.retryAfterSeconds) };
  }

  // Fail-closed: charges carry their own charge snapshot (inherited
  // from the parent order's currency at creation). No snapshot → no
  // payment.
  if (
    charge.chargedAmountMinor == null ||
    charge.chargedAmountMinor <= 0 ||
    !isChargeCurrency(charge.chargedCurrency)
  ) {
    Sentry.captureMessage("[paypal] charge has no charge snapshot", {
      level: "error",
      extra: { chargeId, chargedCurrency: charge.chargedCurrency },
    });
    return { error: "Ce supplément n’a pas de montant enregistré. Veuillez nous contacter." };
  }

  try {
    // Idempotency guard (a): reuse an attached, still-capturable
    // PayPal order id instead of minting a second one.
    if (charge.paymentProvider === "paypal" && charge.paymentId) {
      try {
        const existing = await getPayPalOrder(charge.paymentId);
        if (existing.status === "CREATED" || existing.status === "APPROVED") {
          return { paypalOrderId: charge.paymentId };
        }
      } catch (err) {
        // A 404 (sandbox id on live / expired order) is the expected
        // fall-through — mint a fresh order without alerting.
        if (!isPayPalOrderNotFound(err)) {
          Sentry.captureException(err, {
            tags: { area: "payment", flow: "paypal-charge-create-lookup" },
            extra: { chargeId, paypalOrderId: charge.paymentId },
          });
        }
      }
    }

    const attempt = charge.paymentId ?? "0";
    const paypalOrderId = await createPayPalOrderMinor({
      amountMinor: charge.chargedAmountMinor,
      currency: charge.chargedCurrency,
      referenceId: `${charge.order.orderNumber}-CHG-${charge.id.slice(-6).toUpperCase()}`,
      customId: charge.id,
      description: "Elegant Render — supplément",
      requestId: `charge:${charge.id}:${attempt}`,
    });

    const persisted = await prisma.orderCharge.updateMany({
      where: { id: chargeId, paymentStatus: { not: "completed" } },
      data: {
        paymentProvider: "paypal",
        paymentId: paypalOrderId,
        paymentStatus: "pending",
      },
    });
    if (persisted.count === 0) {
      return { error: "Ce supplément a déjà été payé." };
    }

    return { paypalOrderId };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "payment", flow: "paypal-charge-create" },
      extra: { chargeId },
    });
    return {
      error: "Impossible de démarrer le paiement PayPal. Veuillez réessayer.",
    };
  }
}

export async function capturePayPalChargeAction(
  chargeId: string,
  paypalOrderId: string,
): Promise<ChargePaymentResult> {
  const charge = await loadChargeForPayment(chargeId);
  if (!charge) return { error: "Le supplément est introuvable." };

  const session = await auth();
  if (session?.user?.id && session.user.id !== charge.order.userId) {
    return { error: "Vous n’avez pas accès à ce supplément." };
  }

  // Pre-flight idempotency: already captured (double click, retried
  // POST after a lost response) — success without re-charging.
  if (charge.paymentStatus === "completed" || charge.status === "paid") {
    return { success: true, status: "completed" };
  }

  if (charge.paymentProvider !== "paypal" || charge.paymentId !== paypalOrderId) {
    return { error: "La référence de paiement ne correspond pas. Actualisez la page et réessayez." };
  }

  try {
    const result = await capturePayPalOrder(paypalOrderId);

    // Forensic snapshot regardless of outcome (never overwrite a
    // parallel completer).
    await prisma.orderCharge.updateMany({
      where: { id: chargeId, paymentStatus: { not: "completed" } },
      data: {
        ...(result.captureId ? { paypalCaptureId: result.captureId } : {}),
        ...(result.captureStatus
          ? { paypalCaptureStatus: result.captureStatus }
          : {}),
        ...(result.payerEmail ? { paypalPayerEmail: result.payerEmail } : {}),
        ...(result.payerCountryCode
          ? { paypalPayerCountry: result.payerCountryCode }
          : {}),
        paypalResponseRaw: JSON.parse(JSON.stringify(result.raw ?? null)),
        paypalLastQueryAt: new Date(),
      },
    });

    // eCheck: funds not cleared yet — the webhook / reconciler
    // completes the charge when PayPal confirms.
    if (result.captureStatus === "PENDING") {
      return { success: true, status: "processing" };
    }

    if (result.captureStatus !== "COMPLETED") {
      return { error: "PayPal n’a pas finalisé le paiement. Vous n’avez pas été débité." };
    }

    // Amount check — fail-closed (see capturePayPalOrderAction).
    if (
      result.amountMinor !== charge.chargedAmountMinor ||
      result.currencyCode !== charge.chargedCurrency
    ) {
      Sentry.captureMessage("[paypal] captured charge amount mismatch", {
        level: "error",
        extra: {
          chargeId,
          paypalOrderId,
          capturedAmountMinor: result.amountMinor,
          capturedCurrency: result.currencyCode,
          chargedAmountMinor: charge.chargedAmountMinor,
          chargedCurrency: charge.chargedCurrency,
        },
      });
      return {
        error: "Le montant du paiement ne correspond pas — notre équipe a été informée.",
      };
    }

    // finishSuccessfulChargePayment carries the atomic winner guard:
    // only the first completer issues the invoice / emails / tracks.
    return await finishSuccessfulChargePayment(chargeId, "paypal");
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "payment", flow: "paypal-charge-capture" },
      extra: { chargeId, paypalOrderId },
    });
    return {
      error: "Le paiement n’a pas pu être confirmé. Veuillez réessayer.",
    };
  }
}

// ─── Mock Card (dev only) ────────────────────────────────

export async function mockCardChargePaymentAction(
  chargeId: string,
): Promise<ChargePaymentResult> {
  const charge = await loadChargeForPayment(chargeId);
  if (!charge) return { error: "Le supplément est introuvable." };
  if (charge.status === "cancelled") return { error: "Ce supplément a été annulé." };

  if (charge.paymentStatus === "completed" || charge.status === "paid") {
    return { success: true, status: "completed" };
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
      error: `Erreur : ${err instanceof Error ? err.message : "erreur inconnue"}`,
    };
  }
}
