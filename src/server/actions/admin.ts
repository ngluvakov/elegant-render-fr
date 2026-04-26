/**
 * admin.ts — Admin-only server actions (team comments, status changes, deliverables).
 *
 * Exports adminCreateComment, adminTransitionOrder, adminUploadDeliverable.
 * All gated behind requireAdmin() check. Syncs to Bitrix24 on every action.
 *
 * Used by: admin/porudzbine/[orderId] (comment-composer, status-changer,
 *          deliverable-upload)
 */
"use server";

import * as Sentry from "@sentry/nextjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { transitionOrder } from "@/lib/order/status-machine";
import type { OrderStatus } from "@/generated/prisma/client";
import { syncCommentToDeal } from "@/server/bitrix/sync-comment";
import { syncFileToDeal } from "@/server/bitrix/sync-file";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true, id: true },
  });
  if (!user?.isAdmin) throw new Error("Not admin");
  return user;
}

export async function adminCreateComment(orderId: string, body: string) {
  const admin = await requireAdmin();
  if (!body.trim()) return { error: "Poruka ne može biti prazna." };

  const comment = await prisma.orderComment.create({
    data: {
      orderId,
      authorId: admin.id,
      role: "team",
      body: body.trim(),
    },
  });

  syncCommentToDeal(comment.id).catch((err) => {
    Sentry.captureException(err, {
      tags: { area: "bitrix", flow: "sync-comment-team" },
      extra: { commentId: comment.id, orderId: comment.orderId },
    });
  });

  return { success: true };
}

export async function adminTransitionOrder(
  orderId: string,
  toStatus: string,
  note?: string,
) {
  const admin = await requireAdmin();

  try {
    await transitionOrder(orderId, toStatus as OrderStatus, admin.id, note);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška" };
  }
}

export async function adminUploadDeliverable(
  orderId: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  storagePath: string,
) {
  await requireAdmin();

  const file = await prisma.orderFile.create({
    data: {
      orderId,
      kind: "deliverable",
      fileName,
      fileSize,
      mimeType,
      storagePath,
    },
  });

  syncFileToDeal(file.id).catch((err) => {
    Sentry.captureException(err, {
      tags: { area: "bitrix", flow: "sync-file-deliverable" },
      extra: { fileId: file.id, orderId },
    });
  });

  return { success: true };
}
