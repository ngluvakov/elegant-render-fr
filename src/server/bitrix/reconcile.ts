/**
 * reconcile.ts — Nightly reconciliation between platform orders and Bitrix24.
 *
 * Exports reconcileAllOrders() which detects stage drift on synced orders
 * and retries sync for orders that failed initial deal creation.
 *
 * A linked Deal can disappear on the Bitrix side (deleted or merged). bitrixCall
 * now throws BitrixEmptyResultError / BitrixApiError(NOT_FOUND) instead of handing
 * back `undefined`, so a missing Deal is handled per-order and the run continues
 * rather than crashing on `deal.STAGE_ID`. We never auto-clear bitrix24DealId or
 * recreate the Deal: an ambiguous empty response can be transient, and blind
 * auto-repair risks duplicate Deals. See docs/platform-decisions.md for the
 * (manual, confirmed) repair path.
 *
 * Used by: api/cron/bitrix-reconcile/route
 */
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import {
  bitrixCall,
  BitrixEmptyResultError,
  isBitrixNotFound,
} from "@/lib/bitrix24/client";
import { orderStatusToStage } from "@/lib/bitrix24/stage-map";
import { syncNewDeal } from "./sync-deal";
import type { BitrixDeal } from "@/lib/bitrix24/types";
import type { OrderStatus } from "@/generated/prisma/client";

export type ReconcileSummary = {
  checked: number;
  drift: number;
  missing: number;
  errors: number;
  retried: number;
};

/**
 * Persist a reconciliation outcome to BitrixSyncLog. Never let a logging failure
 * abort the run — the reconcile must keep checking the remaining orders.
 */
async function recordSyncLog(orderId: string, message: string) {
  await prisma.bitrixSyncLog
    .create({
      data: {
        entityType: "deal",
        entityId: orderId,
        direction: "reconciliation",
        method: "reconcile",
        error: message,
        success: false,
      },
    })
    .catch(() => {});
}

export async function reconcileAllOrders(): Promise<ReconcileSummary> {
  console.log("[Reconcile] Starting nightly reconciliation...");

  // 1. Check synced orders for drift
  const syncedOrders = await prisma.order.findMany({
    where: {
      bitrix24DealId: { not: null },
      status: { notIn: ["closed", "cancelled", "refunded"] },
    },
    select: { id: true, orderNumber: true, status: true, bitrix24DealId: true },
  });

  let driftCount = 0;
  let missingCount = 0;
  let errorCount = 0;

  for (const order of syncedOrders) {
    const context = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      bitrix24DealId: order.bitrix24DealId,
    };

    try {
      const deal = await bitrixCall<BitrixDeal>("crm.deal.get", {
        id: order.bitrix24DealId,
      });

      // Defensive: bitrixCall already throws on an empty result, but never read
      // STAGE_ID off anything that is not a real object, even if the client
      // contract changes later.
      if (!deal || typeof deal !== "object") {
        missingCount++;
        await recordSyncLog(
          order.id,
          `Deal ${order.bitrix24DealId} returned no object for ${order.orderNumber} — left linked, no auto-repair`,
        );
        console.warn(
          `[Reconcile] MISSING deal (empty object) for ${order.orderNumber} (deal ${order.bitrix24DealId})`,
        );
        continue;
      }

      const expectedStage = orderStatusToStage(order.status as OrderStatus);

      if (deal.STAGE_ID !== expectedStage) {
        driftCount++;
        await recordSyncLog(
          order.id,
          `Stage drift: app=${order.status} (${expectedStage}), bitrix=${deal.STAGE_ID}`,
        );
        console.log(
          `[Reconcile] DRIFT: ${order.orderNumber} — app=${order.status}, bitrix=${deal.STAGE_ID}`,
        );
      }
    } catch (err) {
      if (isBitrixNotFound(err)) {
        // The Deal is gone (deleted/merged) or Bitrix returned an empty result.
        // Record it, alert, and continue — but do NOT clear bitrix24DealId or
        // recreate the Deal here: an ambiguous empty response could be transient
        // and blind recreation risks duplicate Deals. Repair is a confirmed,
        // manual step (see docs/platform-decisions.md).
        missingCount++;
        const reason =
          err instanceof BitrixEmptyResultError ? "empty-result" : "not-found";
        await recordSyncLog(
          order.id,
          `Deal ${order.bitrix24DealId} missing in Bitrix (${reason}) for ${order.orderNumber} — left linked, no auto-repair`,
        );
        Sentry.captureMessage("Bitrix reconcile: linked Deal missing", {
          level: "warning",
          tags: { area: "bitrix", flow: "reconcile-check-drift", reason },
          extra: context,
        });
        console.warn(
          `[Reconcile] MISSING deal (${reason}) for ${order.orderNumber} (deal ${order.bitrix24DealId})`,
        );
        continue;
      }

      // Unexpected error (network, auth, rate limit, unknown Bitrix error):
      // count it, capture it with full order context, and keep checking the rest.
      errorCount++;
      Sentry.captureException(err, {
        tags: { area: "bitrix", flow: "reconcile-check-drift" },
        extra: context,
      });
      await recordSyncLog(
        order.id,
        `Reconcile check failed for ${order.orderNumber}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      console.error(
        `[Reconcile] ERROR checking ${order.orderNumber} (deal ${order.bitrix24DealId}):`,
        err,
      );
    }
  }

  // 2. Retry unsynced orders (paid+ but no bitrix24DealId)
  const unsyncedOrders = await prisma.order.findMany({
    where: {
      bitrix24DealId: null,
      status: { notIn: ["draft", "awaiting_payment"] },
    },
    select: { id: true, orderNumber: true },
  });

  let retriedCount = 0;

  for (const order of unsyncedOrders) {
    try {
      await syncNewDeal(order.id);
      retriedCount++;
      console.log(`[Reconcile] Synced missing deal for ${order.orderNumber}`);
    } catch (err) {
      errorCount++;
      Sentry.captureException(err, {
        tags: { area: "bitrix", flow: "reconcile-retry-sync" },
        extra: { orderId: order.id, orderNumber: order.orderNumber },
      });
      console.error(`[Reconcile] ERROR syncing ${order.orderNumber}:`, err);
    }
  }

  const summary: ReconcileSummary = {
    checked: syncedOrders.length,
    drift: driftCount,
    missing: missingCount,
    errors: errorCount,
    retried: retriedCount,
  };

  console.log(
    `[Reconcile] Done. Checked ${summary.checked} orders, ${summary.drift} drift, ${summary.missing} missing, ${summary.errors} errors, ${summary.retried} retried.`,
  );

  return summary;
}
