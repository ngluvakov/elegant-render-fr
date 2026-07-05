/**
 * sync-deal.ts — Creates a Bitrix24 CRM Deal from a platform Order.
 *
 * Exports syncNewDeal() which ensures a Contact exists, then creates the
 * Deal with line items, price, and portal link. Stores bitrix24DealId.
 *
 * Used by: server/actions/order, server/bitrix/reconcile
 */
import { prisma } from "@/lib/db";
import { bitrixCall } from "@/lib/bitrix24/client";
import { orderStatusToStage } from "@/lib/bitrix24/stage-map";
import { syncContact } from "./sync-contact";
import type { OrderStatus } from "@/generated/prisma/client";

export async function syncNewDeal(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      user: true,
      items: {
        where: { kind: "service" },
        select: { productLabel: true, categoryLabel: true, totalRsd: true },
      },
    },
  });

  if (order.items.length === 0) return null;

  // Skip if already synced
  if (order.bitrix24DealId) return order.bitrix24DealId;

  // Ensure contact exists
  const contactId = await syncContact(order.userId);

  const firstItem = order.items[0];
  const itemsDescription = order.items
    .map(
      (i) =>
        `${i.productLabel} (${i.categoryLabel}) — ${i.totalRsd.toLocaleString("sr-Latn-RS", { maximumFractionDigits: 0 })} RSD`,
    )
    .join("\n");

  const stageId = orderStatusToStage(order.status as OrderStatus);

  const dealId = await bitrixCall<number>("crm.deal.add", {
    fields: {
      TITLE: `${order.orderNumber} — ${firstItem?.productLabel ?? "Porudžbina"}`,
      CATEGORY_ID: process.env.BITRIX24_PIPELINE_ID,
      STAGE_ID: stageId,
      CONTACT_ID: contactId,
      OPPORTUNITY: order.premiumTotalRsd ?? order.totalRsd,
      CURRENCY_ID: "RSD",
      COMMENTS: `Portal: ${process.env.AUTH_URL}/portal/admin/orders/${order.id}\n\nStavke:\n${itemsDescription}${order.customerNote ? `\n\nNapomena: ${order.customerNote}` : ""}`,
    },
  }, { entityType: "deal", entityId: orderId, direction: "outbound" });

  await prisma.order.update({
    where: { id: orderId },
    data: { bitrix24DealId: String(dealId) },
  });

  return String(dealId);
}
