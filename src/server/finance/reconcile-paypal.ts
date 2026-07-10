/**
 * Reconciles PayPal orders whose capture never settled.
 *
 * Scenarios this covers:
 *   - Buyer approved in the PayPal popup but our capture call (or the
 *     buyer's tab) died before the server action completed.
 *   - eCheck captures stuck in PENDING whose webhook delivery was lost.
 *   - Orders voided/expired on PayPal's side that we still show pending.
 *
 * For each candidate we GET /v2/checkout/orders/:id and settle:
 *   COMPLETED capture → the same atomic-winner completion path the
 *   capture action and webhook use; APPROVED-but-uncaptured and younger
 *   than the capture window → capture server-side; VOIDED/EXPIRED (or
 *   older than the give-up window) → finishFailedPayment.
 *
 * Cron: /api/cron/paypal-reconcile every 15 minutes (CRON_SECRET-gated
 * via isAuthorizedCronRequest — no unauthenticated exceptions).
 */

import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import {
  capturePayPalOrder,
  getPayPalOrder,
  isPayPalOrderNotFound,
} from "@/lib/payment/paypal";
import { transitionOrder } from "@/lib/order/status-machine";
import {
  finishFailedPayment,
  finishSuccessfulPayment,
} from "@/server/actions/payment";

const DEFAULT_LIMIT = 50;
const MIN_AGE_MS = 15 * 60 * 1000; // the buyer may still be inside the PayPal popup
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // eChecks can take days; give up after a week
const CAPTURE_WINDOW_MS = 3 * 60 * 60 * 1000; // only auto-capture recently approved orders
const REQUERY_INTERVAL_MS = 30 * 60 * 1000;

export type ReconcilePayPalStats = {
  ok: boolean;
  scanned: number;
  completed: number;
  captured: number;
  failed: number;
  /** Orders PayPal no longer knows (404) — settled failed, not alerted. */
  pruned: number;
  stillPending: number;
  errors: Array<{ orderId: string; reason: string }>;
};

export async function reconcilePayPalPending(
  limit = DEFAULT_LIMIT,
): Promise<ReconcilePayPalStats> {
  const now = new Date();
  const minCreatedAt = new Date(now.getTime() - MAX_AGE_MS);
  const maxCreatedAt = new Date(now.getTime() - MIN_AGE_MS);
  const lastQueryCutoff = new Date(now.getTime() - REQUERY_INTERVAL_MS);

  const candidates = await prisma.order.findMany({
    where: {
      paymentProvider: "paypal",
      paymentStatus: "pending",
      paymentId: { not: null },
      createdAt: { gte: minCreatedAt },
      updatedAt: { lte: maxCreatedAt },
      OR: [
        { paypalLastQueryAt: null },
        { paypalLastQueryAt: { lte: lastQueryCutoff } },
      ],
    },
    select: { id: true, paymentId: true, status: true, createdAt: true },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  const errors: ReconcilePayPalStats["errors"] = [];
  let completed = 0;
  let captured = 0;
  let failed = 0;
  let pruned = 0;
  let stillPending = 0;

  for (const order of candidates) {
    if (!order.paymentId) continue;
    try {
      let result = await getPayPalOrder(order.paymentId);

      // Approved but never captured (the buyer's return leg died):
      // capture it ourselves while the approval is still fresh.
      if (
        result.status === "APPROVED" &&
        !result.captureId &&
        now.getTime() - order.createdAt.getTime() <= CAPTURE_WINDOW_MS
      ) {
        result = await capturePayPalOrder(order.paymentId);
        captured += 1;
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paypalLastQueryAt: new Date(),
          ...(result.captureId ? { paypalCaptureId: result.captureId } : {}),
          ...(result.captureStatus
            ? { paypalCaptureStatus: result.captureStatus }
            : {}),
          ...(result.payerEmail ? { paypalPayerEmail: result.payerEmail } : {}),
          ...(result.payerCountryCode
            ? { paypalPayerCountry: result.payerCountryCode }
            : {}),
        },
      });

      const captureCompleted = result.captureStatus === "COMPLETED";
      const orderDead =
        result.status === "VOIDED" ||
        result.status === "EXPIRED" ||
        result.captureStatus === "DECLINED" ||
        result.captureStatus === "FAILED" ||
        // Created-but-never-approved orders older than the give-up window.
        (result.status === "CREATED" &&
          now.getTime() - order.createdAt.getTime() > MAX_AGE_MS);

      if (captureCompleted) {
        const won = await prisma.order.updateMany({
          where: { id: order.id, paymentStatus: { not: "completed" } },
          data: {
            paymentStatus: "completed",
            paypalResponseRaw: JSON.parse(JSON.stringify(result.raw)),
          },
        });
        if (won.count > 0) {
          if (order.status === "draft") {
            await transitionOrder(order.id, "awaiting_payment", undefined, "PayPal reconciler", "app");
          }
          if (order.status !== "paid") {
            await transitionOrder(
              order.id,
              "paid",
              undefined,
              "PayPal capture confirmed (reconciler)",
            );
          }
          await finishSuccessfulPayment(order.id);
        }
        completed += 1;
      } else if (orderDead) {
        await finishFailedPayment(order.id, {
          provider: "paypal",
          response: result.status,
          errMsg: result.captureStatus ?? undefined,
        });
        failed += 1;
      } else {
        // CREATED/APPROVED outside the capture window, or PENDING
        // eCheck — leave for the webhook / next pass.
        stillPending += 1;
      }
    } catch (err) {
      // The PayPal order no longer exists (a sandbox id queried on live
      // after the mode flip, or an order PayPal expired/purged). It can
      // never settle, and the throttle stamp below is never reached on
      // this path, so it would re-throw and re-alert every run until it
      // ages out at 7 days. Settle it failed — WITHOUT emailing the
      // customer — so it drops out of the candidate query for good.
      if (isPayPalOrderNotFound(err)) {
        await finishFailedPayment(
          order.id,
          {
            provider: "paypal",
            response: "NOT_FOUND",
            reason: "paypal_order_not_found",
          },
          { enqueueEmail: false },
        );
        pruned += 1;
        continue;
      }

      const message = err instanceof Error ? err.message : String(err);
      Sentry.captureException(err, {
        tags: { area: "payment", flow: "paypal-reconcile" },
        extra: { orderId: order.id, paypalOrderId: order.paymentId },
      });
      errors.push({ orderId: order.id, reason: message });
      // Back off a persistently-erroring order to the 30-min requery
      // cadence instead of re-hitting (and re-alerting) it every run.
      // Best-effort: a stamp failure must not mask the original error.
      await prisma.order
        .update({
          where: { id: order.id },
          data: { paypalLastQueryAt: new Date() },
        })
        .catch(() => {});
    }
  }

  return {
    ok: errors.length === 0,
    scanned: candidates.length,
    completed,
    captured,
    failed,
    pruned,
    stillPending,
    errors,
  };
}
