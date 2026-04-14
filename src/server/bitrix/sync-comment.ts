import { prisma } from "@/lib/db";
import { bitrixCall } from "@/lib/bitrix24/client";

export async function syncCommentToDeal(commentId: string) {
  const comment = await prisma.orderComment.findUniqueOrThrow({
    where: { id: commentId },
    include: {
      order: { select: { bitrix24DealId: true } },
      author: { select: { name: true } },
    },
  });

  if (!comment.order.bitrix24DealId) return;
  if (comment.bitrix24CommentId) return; // Already synced

  const prefix = comment.role === "team" ? "[Tim]" : "[Klijent]";
  const authorName = comment.author?.name ?? "Korisnik";

  const resultId = await bitrixCall<number>("crm.timeline.comment.add", {
    fields: {
      ENTITY_ID: comment.order.bitrix24DealId,
      ENTITY_TYPE: "deal",
      COMMENT: `${prefix} ${authorName}:\n${comment.body}`,
    },
  }, { entityType: "comment", entityId: commentId, direction: "outbound" });

  await prisma.orderComment.update({
    where: { id: commentId },
    data: { bitrix24CommentId: String(resultId) },
  });
}
