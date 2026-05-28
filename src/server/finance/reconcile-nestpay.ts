/**
 * Reconciles Nestpay orders whose return POST never arrived.
 *
 * Scenarios this covers:
 *   - Customer closed the tab between 3DS challenge and our okUrl.
 *   - Bank's POST timed out or was lost in the network.
 *   - We accepted the POST but a downstream write crashed before
 *     transitioning the order.
 *
 * For each candidate the reconciler asks Nestpay's CC5 Order Status
 * Query API (XML) what the bank actually saw, then either confirms or
 * fails the order. Cron runs every 5 minutes.
 */

import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { queryOrderStatus } from "@/lib/nestpay";
import { transitionOrder } from "@/lib/order/status-machine";
import {
  finishFailedPayment,
  finishSuccessfulPayment,
} from "@/server/actions/payment";

const DEFAULT_LIMIT = 50;
const MIN_AGE_MS = 2 * 60 * 1000;          // ignore very fresh attempts — the bank's redirect may still be in flight
const MAX_AGE_MS = 24 * 60 * 60 * 1000;    // give up after a day; older rows are admin-investigation work
const REQUERY_INTERVAL_MS = 10 * 60 * 1000;

export type ReconcileNestpayStats = {
  ok: boolean;
  scanned: number;
  approved: number;
  declined: number;
  pending: number;
  errors: Array<{ orderId: string; reason: string }>;
};

export async function reconcileNestpayPending(
  limit = DEFAULT_LIMIT,
): Promise<ReconcileNestpayStats> {
  const now = new Date();
  const minCreatedAt = new Date(now.getTime() - MAX_AGE_MS);
  const maxCreatedAt = new Date(now.getTime() - MIN_AGE_MS);
  const lastQueryCutoff = new Date(now.getTime() - REQUERY_INTERVAL_MS);

  const candidates = await prisma.order.findMany({
    where: {
      paymentProvider: "nestpay",
      paymentStatus: "pending",
      paymentId: { not: null },
      createdAt: { gte: minCreatedAt, lte: maxCreatedAt },
      OR: [
        { nestpayLastQueryAt: null },
        { nestpayLastQueryAt: { lte: lastQueryCutoff } },
      ],
    },
    select: { id: true, paymentId: true, status: true },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  const errors: ReconcileNestpayStats["errors"] = [];
  let approved = 0;
  let declined = 0;
  let pending = 0;

  for (const order of candidates) {
    if (!order.paymentId) continue;
    try {
      const queryResult = await queryOrderStatus(order.paymentId);

      // Persist whatever we got back so the next reconciler pass has
      // forensic context regardless of branch.
      await prisma.order.update({
        where: { id: order.id },
        data: {
          nestpayLastQueryAt: new Date(),
          ...(queryResult.transId
            ? { nestpayTransId: queryResult.transId }
            : {}),
          ...(queryResult.authCode
            ? { nestpayAuthCode: queryResult.authCode }
            : {}),
          ...(queryResult.procReturnCode
            ? { nestpayProcReturnCode: queryResult.procReturnCode }
            : {}),
          ...(queryResult.mdStatus
            ? { nestpayMdStatus: queryResult.mdStatus }
            : {}),
          ...(queryResult.hostRefNum
            ? { nestpayHostRefNum: queryResult.hostRefNum }
            : {}),
          ...(queryResult.extraTrxDate
            ? { nestpayExtraTrxDate: queryResult.extraTrxDate }
            : {}),
        },
      });

      const apiApproved =
        queryResult.response === "Approved" &&
        queryResult.procReturnCode === "00";
      const apiDeclined =
        Boolean(queryResult.response) &&
        queryResult.response !== "Approved";

      if (apiApproved) {
        const captured = await prisma.order.updateMany({
          where: { id: order.id, paymentStatus: { not: "completed" } },
          data: { paymentStatus: "completed" },
        });
        if (captured.count > 0) {
          if (order.status !== "paid") {
            await transitionOrder(
              order.id,
              "paid",
              undefined,
              "Nestpay plaćanje potvrđeno (reconciler)",
            );
          }
          await finishSuccessfulPayment(order.id);
        }
        approved += 1;
      } else if (apiDeclined) {
        await finishFailedPayment(order.id, {
          provider: "nestpay",
          response: queryResult.response || undefined,
          procReturnCode: queryResult.procReturnCode || undefined,
          errMsg: queryResult.errMsg || undefined,
        });
        declined += 1;
      } else {
        pending += 1;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      Sentry.captureException(err, {
        tags: { area: "payment", flow: "nestpay-reconcile" },
        extra: { orderId: order.id, oid: order.paymentId },
      });
      errors.push({ orderId: order.id, reason: message });
    }
  }

  return {
    ok: errors.length === 0,
    scanned: candidates.length,
    approved,
    declined,
    pending,
    errors,
  };
}
