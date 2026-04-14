"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { transitionOrder } from "@/lib/order/status-machine";
import type { OrderStatus } from "@/generated/prisma/client";

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

  await prisma.orderComment.create({
    data: {
      orderId,
      authorId: admin.id,
      role: "team",
      body: body.trim(),
    },
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

  await prisma.orderFile.create({
    data: {
      orderId,
      kind: "deliverable",
      fileName,
      fileSize,
      mimeType,
      storagePath,
    },
  });

  return { success: true };
}
