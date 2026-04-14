/**
 * reconcile.ts — Nightly reconciliation between platform orders and Bitrix24.
 *
 * Exports reconcileAllOrders() which detects stage drift on synced orders
 * and retries sync for orders that failed initial deal creation.
 *
 * Used by: api/cron/bitrix-reconcile/route
 */
import { prisma } from "@/lib/db";
import { bitrixCall } from "@/lib/bitrix24/client";
import { orderStatusToStage } from "@/lib/bitrix24/stage-map";
import { syncNewDeal } from "./sync-deal";
import type { BitrixDeal } from "@/lib/bitrix24/types";
import type { OrderStatus } from "@/generated/prisma/client";

export async function reconcileAllOrders() {
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

  for (const order of syncedOrders) {
    try {
      const deal = await bitrixCall<BitrixDeal>("crm.deal.get", {
        id: order.bitrix24DealId,
      });

      const expectedStage = orderStatusToStage(order.status as OrderStatus);

      if (deal.STAGE_ID !== expectedStage) {
        driftCount++;
        await prisma.bitrixSyncLog.create({
          data: {
            entityType: "deal",
            entityId: order.id,
            direction: "reconciliation",
            method: "reconcile",
            error: `Stage drift: app=${order.status} (${expectedStage}), bitrix=${deal.STAGE_ID}`,
            success: false,
          },
        });
        console.log(
          `[Reconcile] DRIFT: ${order.orderNumber} — app=${order.status}, bitrix=${deal.STAGE_ID}`,
        );
      }
    } catch (err) {
      console.error(`[Reconcile] Error checking ${order.orderNumber}:`, err);
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

  for (const order of unsyncedOrders) {
    try {
      await syncNewDeal(order.id);
      console.log(`[Reconcile] Synced missing deal for ${order.orderNumber}`);
    } catch (err) {
      console.error(`[Reconcile] Failed to sync ${order.orderNumber}:`, err);
    }
  }

  console.log(
    `[Reconcile] Done. Checked ${syncedOrders.length} orders, ${driftCount} drift, ${unsyncedOrders.length} retried.`,
  );
}
