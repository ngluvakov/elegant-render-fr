/**
 * rework.ts — Rework/revision request server action.
 *
 * Exports requestReworkAction() which transitions an in_review order
 * to revision_requested status via the status machine.
 *
 * Used by: portal/rework-request-card
 */
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { transitionOrder } from "@/lib/order/status-machine";

export async function requestReworkAction(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Vous n’êtes pas connecté." };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== session.user.id) {
    return { error: "Commande introuvable." };
  }

  if (order.status !== "in_review") {
    return { error: "Une révision ne peut être demandée que lorsque le projet est en relecture." };
  }

  await transitionOrder(orderId, "revision_requested", session.user.id, "Le client a demandé des modifications");

  return { success: true };
}
