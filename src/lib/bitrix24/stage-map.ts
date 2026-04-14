/**
 * stage-map.ts — Bidirectional mapping between OrderStatus and Bitrix24 Deal stages.
 *
 * Exports orderStatusToStage() and stageToOrderStatus() for translating
 * between our status enum and Bitrix24 pipeline stage IDs (from env vars).
 *
 * Used by: server/bitrix/sync-deal, sync-status, inbound, reconcile
 */
import type { OrderStatus } from "@/generated/prisma/client";

const ORDER_STATUS_TO_STAGE: Record<string, string> = {
  draft: process.env.BITRIX24_STAGE_DRAFT ?? "",
  awaiting_payment: process.env.BITRIX24_STAGE_AWAITING_PAYMENT ?? "",
  paid: process.env.BITRIX24_STAGE_PAID ?? "",
  in_progress: process.env.BITRIX24_STAGE_IN_PROGRESS ?? "",
  in_review: process.env.BITRIX24_STAGE_IN_REVIEW ?? "",
  revision_requested: process.env.BITRIX24_STAGE_REVISION_REQUESTED ?? "",
  delivered: process.env.BITRIX24_STAGE_DELIVERED ?? "",
  closed: process.env.BITRIX24_STAGE_CLOSED ?? "",
  cancelled: process.env.BITRIX24_STAGE_CANCELLED ?? "",
  refunded: process.env.BITRIX24_STAGE_REFUNDED ?? "",
};

export function orderStatusToStage(status: OrderStatus): string {
  return ORDER_STATUS_TO_STAGE[status] ?? "";
}

export function stageToOrderStatus(stageId: string): OrderStatus | null {
  for (const [status, stage] of Object.entries(ORDER_STATUS_TO_STAGE)) {
    if (stage === stageId) return status as OrderStatus;
  }
  return null;
}
