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
