/**
 * nestpay.ts — Banca Intesa Nestpay HPP payment initiation.
 *
 * Exports `initiateNestpayPayment` and `initiateNestpayChargePayment` —
 * called when the customer chooses card payment.
 * Returns `{ url, fields }` for a hidden auto-submitting form
 * that redirects the customer to the bank's hosted card-entry page.
 *
 * The bank clears in RSD (currency=941). Orders and additional charges
 * use the snapshotted RSD billingTotalCents.
 *
 * Used by: src/app/(marketing)/poruci/steps/step-payment.tsx
 */
"use server";

import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { transitionOrder } from "@/lib/order/status-machine";
import {
  buildHostedPaymentForm,
  getNestpayConfig,
  getNestpayPublicBaseUrl,
  mintOid,
  normalizeNestpayInstallmentCount,
} from "@/lib/nestpay";
import {
  checkRateLimit,
  getServerActionIdentifier,
  rateLimitMessage,
} from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

export type NestpayInitiateResult =
  | { error: string }
  | { url: string; fields: Record<string, string> };

const NESTPAY_INSTALLMENTS_ENABLED =
  process.env.NEXT_PUBLIC_NESTPAY_INSTALLMENTS_ENABLED === "true";

function getClientIp(forwardedFor: string | null): string | null {
  if (!forwardedFor) return null;
  return forwardedFor.split(",")[0]?.trim() ?? null;
}

type InitiateInput = {
  orderId: string;
  turnstileToken?: string | null;
  taksit?: number | null;
};

type InitiateChargeInput = {
  chargeId: string;
  turnstileToken?: string | null;
  taksit?: number | null;
};

export async function initiateNestpayPayment(
  input: InitiateInput,
): Promise<NestpayInitiateResult> {
  try {
    return await initiateNestpayPaymentImpl(input);
  } catch (err) {
    // Surface ANY unhandled error to the client as a structured response
    // so the calling UI can show a message and re-enable the button. An
    // uncaught throw from a server action propagates to the client as a
    // generic rejection and leaves the loading state stuck.
    Sentry.captureException(err, {
      tags: { area: "payment", flow: "nestpay-initiate" },
      extra: { orderId: input.orderId },
    });
    const message = err instanceof Error ? err.message : String(err);
    // Friendlier copy for the most common cause: env vars not set yet.
    if (message.startsWith("[nestpay]")) {
      return {
        error:
          "Plaćanje karticom još nije konfigurisano. Kontaktirajte nas.",
      };
    }
    return {
      error: `Greška pri pokretanju plaćanja: ${message.slice(0, 200)}`,
    };
  }
}

export async function initiateNestpayChargePayment(
  input: InitiateChargeInput,
): Promise<NestpayInitiateResult> {
  try {
    return await initiateNestpayChargePaymentImpl(input);
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "payment", flow: "nestpay-charge-initiate" },
      extra: { chargeId: input.chargeId },
    });
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith("[nestpay]")) {
      return {
        error: "Plaćanje karticom još nije konfigurisano. Kontaktirajte nas.",
      };
    }
    return {
      error: `Greška pri pokretanju plaćanja: ${message.slice(0, 200)}`,
    };
  }
}

async function initiateNestpayPaymentImpl(
  input: InitiateInput,
): Promise<NestpayInitiateResult> {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!order) return { error: "Porudžbina nije pronađena." };

  // Idempotency / state guard. A double-click on an order that already
  // completed shouldn't return an error to the user, but for NestPay we re-render the success
  // page directly rather than continuing the redirect dance.
  if (order.paymentStatus === "completed" || order.status === "paid") {
    return { error: "Porudžbina je već plaćena." };
  }
  if (order.status !== "draft" && order.status !== "awaiting_payment") {
    return { error: "Porudžbina nije u ispravnom statusu za plaćanje." };
  }

  const session = await auth();
  const sessionUserId = session?.user?.id ?? null;
  if (sessionUserId && sessionUserId !== order.userId) {
    return { error: "Nemate pristup ovoj porudžbini." };
  }

  const identifier = await getServerActionIdentifier();
  const rate = await checkRateLimit("nestpayInitiate", identifier);
  if (!rate.ok) {
    return { error: rateLimitMessage(rate.retryAfterSeconds) };
  }

  const headerList = await headers();
  const clientIp = getClientIp(headerList.get("x-forwarded-for"));
  const turnstile = await verifyTurnstile(input.turnstileToken, clientIp);
  if (!turnstile.ok) {
    return {
      error:
        "Verifikacija sigurnosne provere nije uspela. Osvežite stranu i pokušajte ponovo.",
    };
  }

  if (order.billingTotalCents == null) {
    return { error: "Iznos porudžbine nije izračunat. Osvežite stranu." };
  }
  const amountRsdCents = order.billingTotalCents;

  if (!Number.isFinite(amountRsdCents) || amountRsdCents <= 0) {
    return { error: "Iznos porudžbine je neispravan." };
  }

  const config = getNestpayConfig();
  const oid = mintOid(order.orderNumber, config.oidPrefix);
  const installmentCount = NESTPAY_INSTALLMENTS_ENABLED
    ? normalizeNestpayInstallmentCount(input.taksit)
    : 1;

  // Persist the new attempt's oid + provider BEFORE returning the form.
  // The bank's return POST keys back to us by oid; if we crashed after
  // sending the form but before persisting, the return handler would
  // be unable to locate the order. We update conditionally to avoid
  // racing a paid status set by a parallel return handler.
  const persisted = await prisma.order.updateMany({
    where: {
      id: input.orderId,
      paymentStatus: { not: "completed" },
    },
    data: {
      paymentProvider: "nestpay",
      paymentId: oid,
      paymentStatus: "pending",
      nestpayChargedAmountCents: amountRsdCents,
      nestpayChargedCurrency: "RSD",
      nestpayChargeRate: 1,
      nestpayInstallmentCount: installmentCount,
    },
  });
  if (persisted.count === 0) {
    return { error: "Porudžbina je već plaćena." };
  }

  if (order.status === "draft") {
    try {
      await transitionOrder(
        input.orderId,
        "awaiting_payment",
        undefined,
        "Nestpay plaćanje započeto",
      );
    } catch (err) {
      Sentry.captureException(err, {
        tags: { area: "payment", flow: "nestpay-initiate" },
        extra: { orderId: input.orderId },
      });
    }
  }

  const returnUrl = `${getNestpayPublicBaseUrl()}/api/nestpay/return`;
  const form = buildHostedPaymentForm({
    oid,
    amountRsdCents,
    lang: "sr",
    buyerEmail: order.user.email ?? undefined,
    buyerName: order.user.name ?? undefined,
    returnUrl,
    taksit: installmentCount,
    allowInstallments: NESTPAY_INSTALLMENTS_ENABLED,
  });

  return form;
}

async function initiateNestpayChargePaymentImpl(
  input: InitiateChargeInput,
): Promise<NestpayInitiateResult> {
  const charge = await prisma.orderCharge.findUnique({
    where: { id: input.chargeId },
    include: {
      order: {
        include: { user: { select: { email: true, name: true } } },
      },
    },
  });
  if (!charge) return { error: "Naplata nije pronađena." };
  if (charge.status === "cancelled") return { error: "Naplata je otkazana." };
  if (charge.paymentStatus === "completed" || charge.status === "paid") {
    return { error: "Naplata je već plaćena." };
  }

  const session = await auth();
  const sessionUserId = session?.user?.id ?? null;
  if (sessionUserId && sessionUserId !== charge.order.userId) {
    return { error: "Nemate pristup ovoj naplati." };
  }

  const identifier = await getServerActionIdentifier();
  const rate = await checkRateLimit("nestpayInitiate", identifier);
  if (!rate.ok) {
    return { error: rateLimitMessage(rate.retryAfterSeconds) };
  }

  const headerList = await headers();
  const clientIp = getClientIp(headerList.get("x-forwarded-for"));
  const turnstile = await verifyTurnstile(input.turnstileToken, clientIp);
  if (!turnstile.ok) {
    return {
      error:
        "Verifikacija sigurnosne provere nije uspela. Osvežite stranu i pokušajte ponovo.",
    };
  }

  const amountRsdCents = charge.billingTotalCents ?? charge.totalCents;
  if (!Number.isFinite(amountRsdCents) || amountRsdCents <= 0) {
    return { error: "Iznos naplate je neispravan." };
  }

  const config = getNestpayConfig();
  const oid = mintOid(
    `${charge.order.orderNumber}-CHG-${charge.id.slice(-6).toUpperCase()}`,
    config.oidPrefix,
  );
  const installmentCount = NESTPAY_INSTALLMENTS_ENABLED
    ? normalizeNestpayInstallmentCount(input.taksit)
    : 1;

  const persisted = await prisma.orderCharge.updateMany({
    where: {
      id: input.chargeId,
      paymentStatus: { not: "completed" },
    },
    data: {
      paymentProvider: "nestpay",
      paymentId: oid,
      paymentStatus: "pending",
      nestpayChargedAmountCents: amountRsdCents,
      nestpayChargedCurrency: "RSD",
      nestpayChargeRate: 1,
    },
  });
  if (persisted.count === 0) {
    return { error: "Naplata je već plaćena." };
  }

  const returnUrl = `${getNestpayPublicBaseUrl()}/api/nestpay/return`;
  return buildHostedPaymentForm({
    oid,
    amountRsdCents,
    lang: "sr",
    buyerEmail: charge.order.user.email ?? undefined,
    buyerName: charge.order.user.name ?? undefined,
    returnUrl,
    taksit: installmentCount,
    allowInstallments: NESTPAY_INSTALLMENTS_ENABLED,
  });
}
