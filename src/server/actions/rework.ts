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
  if (!session?.user?.id) return { error: "Niste prijavljeni." };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== session.user.id) {
    return { error: "Porudžbina nije pronađena." };
  }

  if (order.status !== "in_review") {
    return { error: "Revizija se može zatražiti samo kada je projekat na pregledu." };
  }

  await transitionOrder(orderId, "revision_requested", session.user.id, "Klijent zatražio izmene");

  return { success: true };
}
