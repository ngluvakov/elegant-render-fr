/**
 * POST /api/paypal/webhook — PayPal event receiver (safety net).
 *
 * The primary completion path is capture-on-return in the checkout /
 * portal server actions; this webhook covers everything that path
 * misses: eCheck captures that complete days later (PENDING →
 * COMPLETED), captures denied after the buyer left, and refunds issued
 * from the PayPal dashboard.
 *
 * Security: every delivery is verified against PayPal's
 * verify-webhook-signature API (fail-closed 400 — requires
 * PAYPAL_WEBHOOK_ID). Deliveries are deduped via PaymentWebhookEvent
 * keyed on PayPal's event id (PayPal retries; a unique violation means
 * already processed → ack 200 without reprocessing).
 *
 * Response policy: after signature verification always return 200 —
 * even on internal errors (captured in Sentry) — so PayPal doesn't
 * retry-storm us; 400 only for unverifiable payloads.
 */

import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { verifyPayPalWebhookSignature } from "@/lib/payment/paypal";
import { transitionOrder } from "@/lib/order/status-machine";
import {
  finishFailedPayment,
  finishSuccessfulPayment,
} from "@/server/actions/payment";
import {
  finishFailedChargePayment,
  finishSuccessfulChargePayment,
} from "@/server/actions/charge-payment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PayPalWebhookEvent = {
  id: string;
  event_type: string;
  resource?: {
    id?: string;
    status?: string;
    custom_id?: string;
    amount?: { value: string; currency_code: string };
    supplementary_data?: { related_ids?: { order_id?: string } };
  };
};

/** Find the Order or OrderCharge a capture event belongs to. paymentId
 * holds the PayPal order id; custom_id carries our DB id as fallback. */
async function locateTarget(event: PayPalWebhookEvent) {
  const paypalOrderId = event.resource?.supplementary_data?.related_ids?.order_id ?? null;
  const customId = event.resource?.custom_id ?? null;

  if (paypalOrderId) {
    const order = await prisma.order.findFirst({
      where: { paymentId: paypalOrderId, paymentProvider: "paypal" },
      select: { id: true, paymentStatus: true, status: true },
    });
    if (order) return { kind: "order" as const, id: order.id, paymentStatus: order.paymentStatus };
    const charge = await prisma.orderCharge.findFirst({
      where: { paymentId: paypalOrderId, paymentProvider: "paypal" },
      select: { id: true, paymentStatus: true },
    });
    if (charge) return { kind: "charge" as const, id: charge.id, paymentStatus: charge.paymentStatus };
  }

  if (customId) {
    const order = await prisma.order.findUnique({
      where: { id: customId },
      select: { id: true, paymentStatus: true, paymentProvider: true },
    });
    if (order?.paymentProvider === "paypal") {
      return { kind: "order" as const, id: order.id, paymentStatus: order.paymentStatus };
    }
    const charge = await prisma.orderCharge.findUnique({
      where: { id: customId },
      select: { id: true, paymentStatus: true, paymentProvider: true },
    });
    if (charge?.paymentProvider === "paypal") {
      return { kind: "charge" as const, id: charge.id, paymentStatus: charge.paymentStatus };
    }
  }

  return null;
}

async function handleCaptureCompleted(event: PayPalWebhookEvent) {
  const target = await locateTarget(event);
  if (!target) {
    Sentry.captureMessage("[paypal-webhook] capture completed for unknown target", {
      level: "warning",
      extra: { eventId: event.id, resourceId: event.resource?.id },
    });
    return;
  }

  const captureId = event.resource?.id ?? null;

  if (target.kind === "order") {
    // Atomic winner guard — identical semantics to the capture action:
    // only the first completer flips paymentStatus and runs the hooks.
    const won = await prisma.order.updateMany({
      where: { id: target.id, paymentStatus: { not: "completed" } },
      data: {
        paymentStatus: "completed",
        paypalCaptureId: captureId,
        paypalCaptureStatus: "COMPLETED",
        paypalResponseRaw: JSON.parse(JSON.stringify(event)),
      },
    });
    if (won.count === 0) return; // capture action already settled it

    const order = await prisma.order.findUniqueOrThrow({
      where: { id: target.id },
      select: { status: true },
    });
    if (order.status === "draft" || order.status === "awaiting_payment") {
      if (order.status === "draft") {
        await transitionOrder(target.id, "awaiting_payment", undefined, "PayPal webhook", "app");
      }
      await transitionOrder(target.id, "paid", undefined, "PayPal capture completed (webhook)", "app");
    }
    await finishSuccessfulPayment(target.id);
    return;
  }

  const won = await prisma.orderCharge.updateMany({
    where: { id: target.id, paymentStatus: { not: "completed" } },
    data: {
      paypalCaptureId: captureId,
      paypalCaptureStatus: "COMPLETED",
      paypalResponseRaw: JSON.parse(JSON.stringify(event)),
    },
  });
  if (won.count === 0) return;
  await finishSuccessfulChargePayment(target.id, "paypal");
}

async function handleCaptureFailed(event: PayPalWebhookEvent) {
  const target = await locateTarget(event);
  if (!target || target.paymentStatus === "completed") return;

  if (target.kind === "order") {
    await prisma.order.updateMany({
      where: { id: target.id, paymentStatus: { not: "completed" } },
      data: {
        paypalCaptureStatus: event.resource?.status ?? "DECLINED",
        paypalResponseRaw: JSON.parse(JSON.stringify(event)),
      },
    });
    await finishFailedPayment(target.id, {
      reason: `PayPal ${event.event_type}`,
    });
  } else {
    await finishFailedChargePayment(target.id);
  }
}

async function handleCaptureRefunded(event: PayPalWebhookEvent) {
  const target = await locateTarget(event);
  if (!target) return;

  if (target.kind === "order") {
    await prisma.order.update({
      where: { id: target.id },
      data: {
        paymentStatus: "refunded",
        paypalCaptureStatus: "REFUNDED",
        paypalResponseRaw: JSON.parse(JSON.stringify(event)),
      },
    });
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: target.id },
      select: { status: true },
    });
    // FSM allows paid → refunded; dashboards can refund later states too,
    // where the status transition may be invalid — record payment status
    // regardless and only transition when the FSM permits it.
    if (order.status === "paid") {
      await transitionOrder(target.id, "refunded", undefined, "Refunded via PayPal (webhook)", "app");
    }
  } else {
    await prisma.orderCharge.update({
      where: { id: target.id },
      data: { paymentStatus: "refunded", paypalCaptureStatus: "REFUNDED" },
    });
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  let verified = false;
  try {
    verified = await verifyPayPalWebhookSignature(request.headers, rawBody);
  } catch (err) {
    Sentry.captureException(err, { tags: { area: "paypal-webhook" } });
  }
  if (!verified) {
    return NextResponse.json({ error: "signature verification failed" }, { status: 400 });
  }

  let event: PayPalWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!event?.id || !event?.event_type) {
    return NextResponse.json({ error: "missing event id/type" }, { status: 400 });
  }

  // Dedupe: first insert wins; a unique violation means this delivery
  // was already processed (PayPal retries) — ack without reprocessing.
  try {
    await prisma.paymentWebhookEvent.create({
      data: {
        id: event.id,
        eventType: event.event_type,
        resourceId: event.resource?.id ?? null,
        payload: JSON.parse(rawBody),
      },
    });
  } catch {
    return NextResponse.json({ ok: true, deduped: true });
  }

  try {
    switch (event.event_type) {
      case "PAYMENT.CAPTURE.COMPLETED":
        await handleCaptureCompleted(event);
        break;
      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.DECLINED":
        await handleCaptureFailed(event);
        break;
      case "PAYMENT.CAPTURE.REFUNDED":
      case "PAYMENT.CAPTURE.REVERSED":
        await handleCaptureRefunded(event);
        break;
      default:
        // Unhandled event types are acked and kept in the dedupe table
        // for forensics; nothing to do.
        break;
    }
    await prisma.paymentWebhookEvent.update({
      where: { id: event.id },
      data: { processedAt: new Date() },
    });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "paypal-webhook" },
      extra: { eventId: event.id, eventType: event.event_type },
    });
    // Deliberate 200: the event row exists without processedAt, so the
    // reconcile cron / manual replay can pick it up; a non-2xx would
    // make PayPal retry into the same dedupe wall anyway.
  }

  return NextResponse.json({ ok: true });
}
