/**
 * status-machine.ts — Order status finite state machine.
 *
 * Exports canTransition() and transitionOrder() which enforce valid status
 * changes, persist StatusEvents, and trigger Bitrix24 stage sync.
 *
 * Used by: server/actions/payment, rework, admin, server/bitrix/inbound
 */
import * as Sentry from "@sentry/nextjs";
import type { OrderStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { syncDealStatus } from "@/server/bitrix/sync-status";

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["awaiting_payment", "cancelled"],
  awaiting_payment: ["paid", "cancelled"],
  paid: ["in_progress", "closed", "cancelled", "refunded"],
  in_progress: ["in_review", "cancelled"],
  in_review: ["revision_requested", "delivered"],
  revision_requested: ["in_progress"],
  delivered: ["closed"],
  closed: [],
  cancelled: [],
  refunded: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function transitionOrder(
  orderId: string,
  toStatus: OrderStatus,
  actorId?: string,
  note?: string,
  source?: "app" | "bitrix24",
) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });

  if (!canTransition(order.status, toStatus)) {
    throw new Error(
      `Invalid transition: ${order.status} → ${toStatus}`,
    );
  }

  const [updated] = await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: toStatus },
    }),
    prisma.orderStatusEvent.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus,
        actorId,
        note,
      },
    }),
  ]);

  // Sync to Bitrix24 (skip if change came from Bitrix24 to prevent loops)
  if (source !== "bitrix24") {
    syncDealStatus(orderId, toStatus).catch((err) => {
      Sentry.captureException(err, {
        tags: { area: "bitrix", flow: "sync-deal-status" },
        extra: { orderId, toStatus, fromStatus: order.status },
      });
    });
  }

  return updated;
}
