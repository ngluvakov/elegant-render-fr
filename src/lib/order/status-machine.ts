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
import { canTransition } from "@/lib/order/status-transitions";
import { syncDealStatus } from "@/server/bitrix/sync-status";
import { irisAfter } from "@/server/iris/client";
import { irisOrderStatus } from "@/server/iris/sync";

// The transition table lives in status-transitions.ts (a pure module,
// testable without the DB) — only the DB-bound transitionOrder stays here.
export { canTransition } from "@/lib/order/status-transitions";

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
  // Iris hears every transition, including ones Bitrix24 initiated —
  // there is no Iris → platform path, so no loop.
  irisAfter("order-status", { orderId, toStatus, fromStatus: order.status }, () => irisOrderStatus(orderId, toStatus));

  return updated;
}
