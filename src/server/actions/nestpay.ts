/**
 * nestpay.ts — Banca Intesa Nestpay HPP payment initiation.
 *
 * Exports `initiateNestpayPayment` — called by the checkout payment
 * step picker when the customer chooses the "Kartica (Banca Intesa)"
 * tile. Returns `{ url, fields }` for a hidden auto-submitting form
 * that redirects the customer to the bank's hosted card-entry page.
 *
 * The bank clears in RSD (currency=941) regardless of buyer locale.
 * Serbian (RSD-billed) orders use the snapshotted billingTotalCents.
 * Foreign (EUR-billed) orders are converted at the public rate at
 * initiation time, and the converted amount + rate are snapshotted on
 * the order for invoice reconciliation per EPM standard 2.1.3
 * "Izjava o konverziji".
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
} from "@/lib/nestpay";
import {
  PUBLIC_EUR_TO_RSD_RATE,
  eurToPublicRsd,
} from "@/lib/catalog/display-currency";
import {
  checkRateLimit,
  getServerActionIdentifier,
  rateLimitMessage,
} from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

export type NestpayInitiateResult =
  | { error: string }
  | { url: string; fields: Record<string, string> };

function getClientIp(forwardedFor: string | null): string | null {
  if (!forwardedFor) return null;
  return forwardedFor.split(",")[0]?.trim() ?? null;
}

type InitiateInput = {
  orderId: string;
  turnstileToken?: string | null;
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
          "Plaćanje karticom još nije konfigurisano. Probajte PayPal ili nas kontaktirajte.",
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

  // Idempotency / state guard. Match the PayPal action's tolerance:
  // a double-click on an order that already completed shouldn't return
  // an error to the user — but for Nestpay we re-render the success
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

  // Resolve the amount in RSD cents (paras). Banca Intesa clears in
  // RSD; the customer's display currency is independent.
  let amountRsdCents: number;
  let chargeRate: number | null;
  if (order.billingCurrency === "RSD") {
    if (order.billingTotalCents == null) {
      return { error: "Iznos porudžbine nije izračunat. Osvežite stranu." };
    }
    amountRsdCents = order.billingTotalCents;
    chargeRate = order.billingEurToRsdRate ?? PUBLIC_EUR_TO_RSD_RATE;
  } else {
    const eurAmount = order.totalCents
      ? order.totalCents / 100
      : order.totalEur;
    amountRsdCents = eurToPublicRsd(eurAmount) * 100;
    chargeRate = PUBLIC_EUR_TO_RSD_RATE;
  }

  if (!Number.isFinite(amountRsdCents) || amountRsdCents <= 0) {
    return { error: "Iznos porudžbine je neispravan." };
  }

  const config = getNestpayConfig();
  const oid = mintOid(order.orderNumber, config.oidPrefix);

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
      nestpayChargeRate: chargeRate ?? undefined,
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
  });

  return form;
}
