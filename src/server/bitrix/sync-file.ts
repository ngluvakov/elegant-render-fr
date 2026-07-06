/**
 * sync-file.ts — Pushes file upload links to the Bitrix24 Deal timeline.
 *
 * Exports syncFileToDeal() which posts a timeline comment with file
 * metadata and a portal download link. Labels by kind (source/deliverable).
 *
 * Used by: server/actions/order, server/actions/admin
 */
import { prisma } from "@/lib/db";
import { bitrixCall } from "@/lib/bitrix24/client";

export async function syncFileToDeal(fileId: string) {
  const file = await prisma.orderFile.findUniqueOrThrow({
    where: { id: fileId },
    include: { order: { select: { bitrix24DealId: true, id: true } } },
  });

  if (!file.order.bitrix24DealId) return;
  if (file.bitrix24FileId) return; // Already synced

  const kindLabel = file.kind === "deliverable" ? "Deliverable" : file.kind === "revision" ? "Revision" : "Source file";
  const portalUrl = `${process.env.AUTH_URL}/api/portal/download?path=${encodeURIComponent(file.storagePath)}&orderId=${file.order.id}`;

  const resultId = await bitrixCall<number>("crm.timeline.comment.add", {
    fields: {
      ENTITY_ID: file.order.bitrix24DealId,
      ENTITY_TYPE: "deal",
      COMMENT: `[${kindLabel}] ${file.fileName} (${(file.fileSize / (1024 * 1024)).toFixed(1)} MB)\nLink: ${portalUrl}`,
    },
  }, { entityType: "file", entityId: fileId, direction: "outbound" });

  await prisma.orderFile.update({
    where: { id: fileId },
    data: { bitrix24FileId: String(resultId) },
  });
}
