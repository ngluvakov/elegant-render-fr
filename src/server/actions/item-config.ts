/**
 * item-config.ts — Server actions for per-item configuration in the portal.
 *
 * Exports updateItemConfig (save note + advanced config) and
 * confirmItemFileUpload (attach file to specific order item).
 *
 * Used by: portal/porudzbine/[orderId] item configuration UI
 */
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type ItemConfigResult = {
  error?: string;
  success?: boolean;
};

export async function updateItemConfig(
  itemId: string,
  data: {
    clientNote?: string;
    configJson?: Record<string, unknown>;
  },
): Promise<ItemConfigResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Niste prijavljeni." };

  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { order: { select: { userId: true } } },
  });

  if (!item || item.order.userId !== session.user.id) {
    return { error: "Stavka nije pronađena." };
  }

  const updateData: Record<string, unknown> = {};
  if (data.clientNote !== undefined) updateData.clientNote = data.clientNote;
  if (data.configJson !== undefined) updateData.configJson = data.configJson;

  await prisma.orderItem.update({
    where: { id: itemId },
    data: updateData,
  });

  return { success: true };
}

export async function confirmItemFileUpload(
  orderId: string,
  itemId: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  storagePath: string,
  kind: string = "source",
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Niste prijavljeni." };

  await prisma.orderFile.create({
    data: {
      orderId,
      orderItemId: itemId,
      kind,
      fileName,
      fileSize,
      mimeType,
      storagePath,
    },
  });

  return { success: true };
}
