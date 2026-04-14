"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type CommentResult = {
  error?: string;
  success?: boolean;
};

export async function createCommentAction(
  orderId: string,
  body: string,
): Promise<CommentResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Niste prijavljeni." };

  if (!body.trim()) return { error: "Poruka ne može biti prazna." };

  // Verify ownership
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== session.user.id) {
    return { error: "Porudžbina nije pronađena." };
  }

  await prisma.orderComment.create({
    data: {
      orderId,
      authorId: session.user.id,
      role: "client",
      body: body.trim(),
    },
  });

  return { success: true };
}

export async function getCommentsAction(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== session.user.id) return [];

  return prisma.orderComment.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { name: true, email: true } } },
  });
}
