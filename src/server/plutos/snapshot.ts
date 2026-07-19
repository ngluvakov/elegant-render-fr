import { prisma } from "@/lib/db";
import { plutosOutboxKey } from "./ids";
import type { PlutosSyncSnapshot, PlutosTarget } from "./types";

/**
 * snapshot.ts — Read-only view of a target's Plutos state for the admin order
 * detail page. Combines the persisted `plutos*` fields with the current outbox
 * event status so the panel can show "Queued / Syncing / Synced / Failed".
 *
 * Imported by the server component (Track B); it is not a server action.
 */

const QUEUE_STATUSES = ["pending", "running", "succeeded", "failed"] as const;
type QueueStatus = (typeof QUEUE_STATUSES)[number];

function toQueueStatus(value: string | null | undefined): QueueStatus | null {
  return QUEUE_STATUSES.includes(value as QueueStatus)
    ? (value as QueueStatus)
    : null;
}

const PLUTOS_SELECT = {
  plutosInvoiceId: true,
  plutosNumber: true,
  plutosStatus: true,
  plutosSefStatus: true,
  plutosLastAttemptAt: true,
  plutosSyncedAt: true,
  plutosLastError: true,
} as const;

export async function loadPlutosSyncSnapshot(
  target: PlutosTarget,
  targetId: string,
): Promise<PlutosSyncSnapshot> {
  const [entity, event] = await Promise.all([
    target === "order"
      ? prisma.order.findUnique({
          where: { id: targetId },
          select: PLUTOS_SELECT,
        })
      : prisma.orderCharge.findUnique({
          where: { id: targetId },
          select: PLUTOS_SELECT,
        }),
    prisma.outboxEvent.findUnique({
      where: { idempotencyKey: plutosOutboxKey(target, targetId) },
      select: { status: true },
    }),
  ]);

  return {
    invoiceId: entity?.plutosInvoiceId ?? null,
    number: entity?.plutosNumber ?? null,
    status: entity?.plutosStatus ?? null,
    sefStatus: entity?.plutosSefStatus ?? null,
    queueStatus: toQueueStatus(event?.status),
    lastAttemptAt: entity?.plutosLastAttemptAt?.toISOString() ?? null,
    syncedAt: entity?.plutosSyncedAt?.toISOString() ?? null,
    lastError: entity?.plutosLastError ?? null,
  };
}
