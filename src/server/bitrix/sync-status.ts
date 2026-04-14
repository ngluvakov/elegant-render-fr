/**
 * sync-status.ts — Pushes order status changes to the Bitrix24 Deal stage.
 *
 * Exports syncDealStatus() which maps OrderStatus to a pipeline stage
 * and calls crm.deal.update. Skipped if the order has no linked Deal.
 *
 * Used by: lib/order/status-machine (called on every status transition)
 */
import { prisma } from "@/lib/db";
import { bitrixCall } from "@/lib/bitrix24/client";
import { orderStatusToStage } from "@/lib/bitrix24/stage-map";
import type { OrderStatus } from "@/generated/prisma/client";

export async function syncDealStatus(orderId: string, status: OrderStatus) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order?.bitrix24DealId) return;

  const stageId = orderStatusToStage(status);
  if (!stageId) return;

  await bitrixCall("crm.deal.update", {
    id: order.bitrix24DealId,
    fields: { STAGE_ID: stageId },
  }, { entityType: "deal", entityId: orderId, direction: "outbound" });
}
