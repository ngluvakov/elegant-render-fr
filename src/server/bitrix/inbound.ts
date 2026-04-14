import { prisma } from "@/lib/db";
import { bitrixCall } from "@/lib/bitrix24/client";
import { stageToOrderStatus } from "@/lib/bitrix24/stage-map";
import { transitionOrder } from "@/lib/order/status-machine";
import type { BitrixDeal } from "@/lib/bitrix24/types";

export async function handleDealUpdate(dealId: string) {
  // Fetch deal from Bitrix24
  const deal = await bitrixCall<BitrixDeal>("crm.deal.get", { id: dealId });
  if (!deal) return;

  // Find our order by bitrix24DealId
  const order = await prisma.order.findUnique({
    where: { bitrix24DealId: String(dealId) },
  });

  if (!order) {
    console.log(`[Bitrix24 Inbound] Deal ${dealId} not linked to any order`);
    return;
  }

  // Map Bitrix24 stage to OrderStatus
  const newStatus = stageToOrderStatus(deal.STAGE_ID);
  if (!newStatus) {
    console.log(`[Bitrix24 Inbound] Unknown stage: ${deal.STAGE_ID}`);
    return;
  }

  // Skip if status hasn't changed
  if (newStatus === order.status) return;

  // Transition with source="bitrix24" to prevent outbound echo
  try {
    await transitionOrder(
      order.id,
      newStatus,
      undefined,
      "Status ažuriran iz Bitrix24",
      "bitrix24",
    );
    console.log(`[Bitrix24 Inbound] Order ${order.orderNumber}: ${order.status} → ${newStatus}`);
  } catch (err) {
    console.error(`[Bitrix24 Inbound] Transition failed:`, err);
  }
}
