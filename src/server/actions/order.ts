/**
 * order.ts — Order creation and file upload confirmation server actions.
 *
 * Exports createOrder() (server-side quote verification + Prisma insert +
 * Bitrix24 deal sync) and confirmFileUpload() for source material uploads.
 *
 * Used by: poruci/steps/step-review, step-upload, revision-upload-card
 */
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import * as Sentry from "@sentry/nextjs";
import { calculateQuote, type QuoteItem } from "@/lib/catalog/calculate";
import { getConfiguratorProduct } from "@/lib/catalog/configurator";
import { generateOrderNumber } from "@/lib/order/generate-number";
import {
  checkRateLimit,
  getServerActionIdentifier,
  rateLimitMessage,
} from "@/lib/rate-limit";
import { repriceOrder } from "@/server/actions/item-config";
import { syncNewDeal } from "@/server/bitrix/sync-deal";
import { syncFileToDeal } from "@/server/bitrix/sync-file";

export type OrderResult = {
  error?: string;
  orderId?: string;
  orderNumber?: string;
};

export async function createOrder(
  userId: string,
  quoteItems: QuoteItem[],
  customerNote?: string,
): Promise<OrderResult> {
  if (!userId) return { error: "Korisnik nije identifikovan." };
  if (!quoteItems.length) return { error: "Ponuda je prazna." };

  // Rate-limit before any DB writes. createOrder is reachable from
  // /poruci by anyone (guest or logged-in), so a tampered client could
  // spam Order rows. Identifier prefers user:<id> when authenticated.
  const identifier = await getServerActionIdentifier();
  const limit = await checkRateLimit("checkout", identifier);
  if (!limit.ok) {
    return { error: rateLimitMessage(limit.retryAfterSeconds) };
  }

  // Defensive: inquiry-only products (VR) must never enter the order /
  // payment flow. They route to /usluge/vr/konsultacija from /cene; if
  // one slips through (tampered cart, stale URL), refuse the order.
  for (const qi of quoteItems) {
    const lookup = getConfiguratorProduct(qi.productId);
    if (lookup?.product.inquiryOnly) {
      return {
        error:
          "VR usluge se ne mogu plaćati direktno — zatražite konsultaciju.",
      };
    }
  }

  // Server-side price verification
  const calculation = calculateQuote(quoteItems);

  if (calculation.total <= 0) {
    return { error: "Ukupna cena mora biti veća od 0." };
  }

  const orderNumber = generateOrderNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      totalEur: calculation.total,
      customerNote: customerNote || null,
      items: {
        create: calculation.items.map((item) => ({
          productId: item.productId,
          categoryId: quoteItems.find((q) => q.instanceId === item.instanceId)
            ?.categoryId ?? "",
          productLabel: item.productLabel,
          categoryLabel: item.categoryLabel,
          basePriceEur: item.basePriceEur,
          totalEur: item.totalEur,
          addOnsJson: item.addOns,
          durationSeconds: item.durationSeconds ?? null,
          durationDiscount: item.durationDiscount ?? null,
          originalTotalEur: item.originalTotalEur,
          discountPct: item.discountPct,
          discountReason: item.discountReason,
        })),
      },
      statusEvents: {
        create: {
          toStatus: "draft",
          note: "Porudžbina kreirana",
        },
      },
    },
  });

  // Sync to Bitrix24
  syncNewDeal(order.id).catch((err) => {
    Sentry.captureException(err, {
      tags: { area: "bitrix", flow: "sync-new-deal" },
      extra: { orderId: order.id, orderNumber: order.orderNumber },
    });
  });

  return { orderId: order.id, orderNumber: order.orderNumber };
}

export async function createEmptyDraft(): Promise<OrderResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Niste prijavljeni." };

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: session.user.id,
      totalEur: 0,
      items: { create: [] },
      statusEvents: {
        create: { toStatus: "draft", note: "Nacrt kreiran iz portala" },
      },
    },
  });

  revalidatePath("/portal/porudzbine");
  revalidatePath("/portal");

  return { orderId: order.id, orderNumber: order.orderNumber };
}

export async function deleteDraftOrder(
  orderId: string,
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Niste prijavljeni." };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true, status: true },
  });
  if (!order) return { error: "Porudžbina ne postoji." };
  if (order.userId !== session.user.id)
    return { error: "Nemate pristup." };
  if (order.status !== "draft" && order.status !== "cancelled")
    return { error: "Samo nacrti i otkazane porudžbine se mogu obrisati." };

  await prisma.order.delete({ where: { id: orderId } });
  revalidatePath("/portal/porudzbine");
  revalidatePath("/portal");
  return { success: true };
}

/**
 * setOrderReference — link a draft order to a prior paid order so its
 * model assets feed the cross-service discount resolver.
 * Pass referencedOrderId = null to clear the link.
 */
export async function setOrderReference(
  orderId: string,
  referencedOrderId: string | null,
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Niste prijavljeni." };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true, status: true },
  });
  if (!order) return { error: "Porudžbina ne postoji." };
  if (order.userId !== session.user.id) return { error: "Nemate pristup." };
  if (order.status !== "draft")
    return { error: "Referenca se postavlja samo u nacrtu." };

  if (referencedOrderId) {
    if (referencedOrderId === orderId)
      return { error: "Porudžbina ne može da referencira samu sebe." };
    const ref = await prisma.order.findUnique({
      where: { id: referencedOrderId },
      select: { userId: true, status: true },
    });
    if (!ref) return { error: "Referencirana porudžbina ne postoji." };
    if (ref.userId !== session.user.id)
      return { error: "Nemate pristup referenciranoj porudžbini." };
    if (ref.status === "draft" || ref.status === "awaiting_payment")
      return { error: "Referenca mora da bude plaćena porudžbina." };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { referencedOrderId },
  });

  // Discounts for the current order may change — re-run the engine.
  await repriceOrder(orderId);
  revalidatePath(`/portal/porudzbine/${orderId}`);
  return { success: true };
}

export async function updateProjectName(
  orderId: string,
  name: string,
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Niste prijavljeni." };

  const trimmed = name.trim().slice(0, 100);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true },
  });
  if (!order) return { error: "Porudžbina ne postoji." };
  if (order.userId !== session.user.id)
    return { error: "Nemate pristup." };

  await prisma.order.update({
    where: { id: orderId },
    data: { projectName: trimmed.length > 0 ? trimmed : null },
  });
  revalidatePath(`/portal/porudzbine/${orderId}`);
  return { success: true };
}

export async function confirmFileUpload(
  orderId: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  storagePath: string,
) {
  const file = await prisma.orderFile.create({
    data: {
      orderId,
      fileName,
      fileSize,
      mimeType,
      storagePath,
      kind: "source",
    },
  });

  syncFileToDeal(file.id).catch((err) => {
    Sentry.captureException(err, {
      tags: { area: "bitrix", flow: "sync-file" },
      extra: { fileId: file.id, orderId: file.orderId ?? null },
    });
  });
}
