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
  if (!session?.user?.id) return { error: "You are not signed in." };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== session.user.id) {
    return { error: "Order not found." };
  }

  if (order.status !== "in_review") {
    return { error: "A revision can only be requested while the project is in review." };
  }

  await transitionOrder(orderId, "revision_requested", session.user.id, "Client requested changes");

  return { success: true };
}
