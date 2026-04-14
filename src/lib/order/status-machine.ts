import type { OrderStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["awaiting_payment", "cancelled"],
  awaiting_payment: ["paid", "cancelled"],
  paid: ["in_progress", "cancelled", "refunded"],
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

  return updated;
}
