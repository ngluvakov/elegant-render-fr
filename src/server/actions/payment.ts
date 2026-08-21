/**
 * payment.ts — PayPal payment server actions + shared completion hooks
 * (+ the dev-only mock card action).
 *
 * createPayPalOrderAction / capturePayPalOrderAction carry the double
 * idempotency guard proven in the pre-fork implementation:
 *   (a) pre-flight reuse of an attached, still-capturable PayPal order
 *       id so a double-clicked button never mints two PayPal orders;
 *   (b) a race-safe atomic winner — prisma.order.updateMany with a
 *       `paymentStatus != completed` condition — so exactly one of two
 *       concurrent captures (button vs webhook vs reconciler) runs the
 *       post-payment hooks.
 *
 * eCheck captures come back PENDING: we snapshot the capture and keep
 * paymentStatus "pending"; the webhook or the reconcile cron completes
 * the order days later.
 *
 * Used by: checkout step-payment, portal pending-payment-card,
 *          api/paypal/webhook, server/finance/reconcile-paypal,
 *          server/actions/mark-wire-paid.
 */
"use server";

import * as Sentry from "@sentry/nextjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { transitionOrder } from "@/lib/order/status-machine";
import {
  capturePayPalOrder,
  createPayPalOrderMinor,
  getPayPalOrder,
  isPayPalOrderNotFound,
} from "@/lib/payment/paypal";
import { isChargeCurrency } from "@/lib/currency/config";
import { processMockCardPaymentCents } from "@/lib/payment/mock-card";
import { enqueueOutboxEvent } from "@/lib/outbox";
import {
  checkRateLimit,
  getServerActionIdentifier,
  rateLimitMessage,
} from "@/lib/rate-limit";
import { applyPurchasedAiCreditsForOrder } from "@/server/actions/ai-credits";
import { issueInvoice } from "@/server/actions/issue-invoice";
import { buildPurchaseDataLayerEvent } from "@/server/analytics/google-conversions";
import type { GooglePurchaseDataLayerEvent } from "@/lib/analytics/google-data-layer";

export type PaymentResult = {
  error?: string;
  success?: boolean;
  /** "completed" — funds captured; "processing" — eCheck capture PENDING. */
  status?: "completed" | "processing";
  paypalOrderId?: string;
  purchaseEvent?: GooglePurchaseDataLayerEvent;
};

function getOrderAmountCents(order: { totalEur: number; totalCents: number | null }) {
  return order.totalCents ?? order.totalEur * 100;
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
    status: "completed",
    ...(purchaseEvent ? { purchaseEvent } : {}),
  };
}

export type FailedPaymentDetails = {
  provider?: "paypal" | "card_mock" | (string & {});
  reason?: string;
  /** Provider-level order/transaction status (e.g. VOIDED, EXPIRED). */
  response?: string;
  errMsg?: string;
};

/**
 * Symmetric counterpart to `finishSuccessfulPayment`. Called from the
 * PayPal webhook when a capture is denied and from the reconciler when
 * a query confirms the order died on PayPal's side.
 *
 * Leaves the order in `awaiting_payment` rather than `cancelled` so
 * the customer can retry from the same checkout state. Any forensic
 * snapshot (capture status, raw response) is persisted by the caller
 * before this runs — here we flip paymentStatus and email the customer.
 *
 * `enqueueEmail` (default true) can be turned off for terminal states
 * that aren't a real decline — e.g. the reconciler pruning an order
 * whose PayPal id no longer exists (sandbox id on live / expired order):
 * we still flip paymentStatus so it stops being reconciled, but must not
 * retroactively email the customer.
 */
export async function finishFailedPayment(
  orderId: string,
  details: FailedPaymentDetails,
  options: { enqueueEmail?: boolean } = {},
) {
  const enqueueEmail = options.enqueueEmail ?? true;

  await prisma.order.updateMany({
    where: { id: orderId, paymentStatus: { not: "completed" } },
    data: { paymentStatus: "failed" },
  });

  if (enqueueEmail) {
    await enqueueOutboxEvent({
      type: "payment_failure_email",
      payload: {
        orderId,
        reason: details.reason ?? null,
        response: details.response ?? null,
        errMsg: details.errMsg ?? null,
      },
      // Per-attempt key: include the provider status so a same-order
      // second decline still emails the customer, while a retried
      // delivery of the same decline doesn't email twice.
      idempotencyKey: `payment_failure:${orderId}:${details.response ?? details.reason ?? "x"}`,
    });
  }
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
      "Crédits IA activés — commande clôturée",
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
    // Provider-neutral confirmation for every paid order.
    await enqueueOutboxEvent({
      type: "order_confirmation_email",
      payload: { orderId },
      idempotencyKey: `order_confirmation:${orderId}`,
    });
    // PayPal orders additionally get the payment receipt email with
    // the capture id and the charged amount/currency.
    if (order.paymentProvider === "paypal") {
      await enqueueOutboxEvent({
        type: "payment_success_email",
        payload: { orderId },
        idempotencyKey: `payment_success:${orderId}`,
      });
    }
  }
}

// ─── PayPal ──────────────────────────────────────────────

export async function createPayPalOrderAction(
  orderId: string,
): Promise<PaymentResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "La commande est introuvable." };

  // Guest checkout has no session (knowing the fresh orderId is the
  // capability), but when a session exists it must belong to the
  // order's owner.
  const session = await auth();
  if (session?.user?.id && session.user.id !== order.userId) {
    return { error: "Vous n’avez pas accès à cette commande." };
  }

  if (order.paymentStatus === "completed" || order.status === "paid") {
    return { error: "Cette commande a déjà été payée." };
  }
  if (order.status !== "draft" && order.status !== "awaiting_payment") {
    return { error: "Cette commande n’est pas dans un état permettant le paiement." };
  }

  const identifier = await getServerActionIdentifier();
  const rate = await checkRateLimit("paypalCreate", identifier);
  if (!rate.ok) {
    return { error: rateLimitMessage(rate.retryAfterSeconds) };
  }

  // Fail-closed: PayPal charges exactly the snapshot locked at order
  // creation. No snapshot → no payment (never recompute here).
  if (
    order.chargedAmountMinor == null ||
    order.chargedAmountMinor <= 0 ||
    !isChargeCurrency(order.chargedCurrency)
  ) {
    Sentry.captureMessage("[paypal] order has no charge snapshot", {
      level: "error",
      extra: { orderId, chargedCurrency: order.chargedCurrency },
    });
    return { error: "Cette commande n’a pas de montant enregistré. Veuillez nous contacter." };
  }

  try {
    // Idempotency guard (a): if a PayPal order id is already attached
    // and PayPal still shows it capturable, reuse it instead of minting
    // a second one (a double-clicked button would orphan the first).
    if (order.paymentProvider === "paypal" && order.paymentId) {
      try {
        const existing = await getPayPalOrder(order.paymentId);
        if (existing.status === "CREATED" || existing.status === "APPROVED") {
          return { paypalOrderId: order.paymentId };
        }
      } catch (err) {
        // Lookup failure falls through to create; the PayPal-Request-Id
        // below dedupes on PayPal's side if the old order still exists.
        // A 404 (sandbox id on live / expired order) is the expected
        // fall-through case — mint a fresh order without alerting.
        if (!isPayPalOrderNotFound(err)) {
          Sentry.captureException(err, {
            tags: { area: "payment", flow: "paypal-create-lookup" },
            extra: { orderId, paypalOrderId: order.paymentId },
          });
        }
      }
    }

    // Attempt component is derived from the previous PayPal order id
    // (timestamp-free): retries of the SAME attempt reuse the request
    // id and PayPal dedupes; once a new PayPal order id is persisted,
    // the next attempt gets a fresh request id.
    const attempt = order.paymentId ?? "0";
    const paypalOrderId = await createPayPalOrderMinor({
      amountMinor: order.chargedAmountMinor,
      currency: order.chargedCurrency,
      referenceId: order.orderNumber,
      customId: order.id,
      description: "Elegant Render — visualisation architecturale",
      requestId: `order:${order.id}:${attempt}`,
    });

    // Conditional persist: never clobber a completed payment that
    // landed between our read and this write (webhook race).
    const persisted = await prisma.order.updateMany({
      where: { id: orderId, paymentStatus: { not: "completed" } },
      data: {
        paymentProvider: "paypal",
        paymentId: paypalOrderId,
        paymentStatus: "pending",
      },
    });
    if (persisted.count === 0) {
      return { error: "Cette commande a déjà été payée." };
    }

    if (order.status === "draft") {
      try {
        await transitionOrder(
          orderId,
          "awaiting_payment",
          undefined,
          "Paiement PayPal démarré",
        );
      } catch (err) {
        Sentry.captureException(err, {
          tags: { area: "payment", flow: "paypal-create" },
          extra: { orderId },
        });
      }
    }

    return { paypalOrderId };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "payment", flow: "paypal-create" },
      extra: { orderId },
    });
    return {
      error: "Impossible de démarrer le paiement PayPal. Veuillez réessayer.",
    };
  }
}

export async function capturePayPalOrderAction(
  orderId: string,
  paypalOrderId: string,
): Promise<PaymentResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "La commande est introuvable." };

  const session = await auth();
  if (session?.user?.id && session.user.id !== order.userId) {
    return { error: "Vous n’avez pas accès à cette commande." };
  }

  // Pre-flight idempotency: already settled (double click, or a
  // previous capture succeeded but the response was lost) — re-run the
  // idempotent hooks without emailing again and report success.
  if (order.paymentStatus === "completed" || order.status === "paid") {
    await finishSuccessfulPayment(orderId, { enqueueEmail: false });
    return paymentSuccessResult(orderId, "paypal_capture_replay");
  }

  // Only capture the PayPal order we created for this Order — a
  // client-supplied foreign id must never complete someone's payment.
  if (order.paymentProvider !== "paypal" || order.paymentId !== paypalOrderId) {
    return { error: "La référence de paiement ne correspond pas. Actualisez la page et réessayez." };
  }

  try {
    const result = await capturePayPalOrder(paypalOrderId);

    // Persist the forensic capture snapshot regardless of outcome
    // (conditional so a parallel completer is never overwritten).
    await prisma.order.updateMany({
      where: { id: orderId, paymentStatus: { not: "completed" } },
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

    // eCheck: the capture exists but funds haven't cleared. Keep
    // paymentStatus "pending" — the webhook / reconciler completes it.
    if (result.captureStatus === "PENDING") {
      return { success: true, status: "processing" };
    }

    if (result.captureStatus !== "COMPLETED") {
      return { error: "PayPal n’a pas finalisé le paiement. Vous n’avez pas été débité." };
    }

    // Amount check — fail-closed. PayPal captures the created order's
    // amount, so a mismatch means a stale snapshot; funds may be
    // captured but we do NOT complete the order. The reconciler +
    // Sentry alert path picks it up for a human decision.
    if (
      result.amountMinor !== order.chargedAmountMinor ||
      result.currencyCode !== order.chargedCurrency
    ) {
      Sentry.captureMessage("[paypal] captured amount mismatch", {
        level: "error",
        extra: {
          orderId,
          paypalOrderId,
          capturedAmountMinor: result.amountMinor,
          capturedCurrency: result.currencyCode,
          chargedAmountMinor: order.chargedAmountMinor,
          chargedCurrency: order.chargedCurrency,
        },
      });
      return {
        error: "Le montant du paiement ne correspond pas — notre équipe a été informée.",
      };
    }

    // Idempotency guard (b): race-safe atomic winner. Two concurrent
    // captures (button vs webhook) both pass the pre-flight check;
    // exactly one flips paymentStatus here. The loser short-circuits
    // without re-running hooks or re-emailing.
    const won = await prisma.order.updateMany({
      where: { id: orderId, paymentStatus: { not: "completed" } },
      data: {
        paymentStatus: "completed",
        paypalCaptureId: result.captureId,
        paypalCaptureStatus: result.captureStatus,
        paypalPayerEmail: result.payerEmail,
        paypalPayerCountry: result.payerCountryCode,
        paypalResponseRaw: JSON.parse(JSON.stringify(result.raw ?? null)),
        // Individuals never pick a country at checkout — PayPal's payer
        // country backfills the billing snapshot when geo left it empty.
        ...(order.buyerType === "individual" &&
        !order.buyerCountryCode &&
        result.payerCountryCode
          ? { buyerCountryCode: result.payerCountryCode }
          : {}),
      },
    });
    if (won.count === 0) {
      return paymentSuccessResult(orderId, "paypal_capture_race");
    }

    try {
      if (order.status === "draft") {
        await transitionOrder(
          orderId,
          "awaiting_payment",
          undefined,
          "Paiement PayPal démarré",
        );
      }
      await transitionOrder(orderId, "paid", undefined, "Paiement PayPal capturé");
    } catch (err) {
      // Status-machine hiccups must not fail a captured payment.
      Sentry.captureException(err, {
        tags: { area: "payment", flow: "paypal-capture-transition" },
        extra: { orderId },
      });
    }

    await finishSuccessfulPayment(orderId);

    return paymentSuccessResult(orderId, "paypal_capture");
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "payment", flow: "paypal-capture" },
      extra: { orderId, paypalOrderId },
    });
    return {
      error: "Le paiement n’a pas pu être confirmé. Veuillez réessayer.",
    };
  }
}

// ─── Mock Card (dev only) ────────────────────────────────

export async function mockCardPaymentAction(
  orderId: string,
): Promise<PaymentResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "La commande est introuvable." };

  // Idempotency guard 1: pre-flight. Run before the "valid status"
  // check so a double-clicked already-paid order returns success
  // instead of a confusing state error (paid orders fail the
  // draft/awaiting_payment filter).
  if (order.paymentStatus === "completed" || order.status === "paid") {
    await finishSuccessfulPayment(orderId, { enqueueEmail: false });
    return paymentSuccessResult(orderId, "mock_card_replay");
  }

  if (order.status !== "draft" && order.status !== "awaiting_payment") {
    return { error: "Cette commande n’est pas dans un état permettant le paiement." };
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

    await transitionOrder(orderId, "paid", undefined, "Paiement par carte confirmé (test)");

    await finishSuccessfulPayment(orderId);

    return paymentSuccessResult(orderId, "mock_card_success");
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "payment", flow: "card-mock-capture" },
      extra: { orderId },
    });
    return {
      error: `Erreur : ${err instanceof Error ? err.message : "erreur inconnue"}`,
    };
  }
}
