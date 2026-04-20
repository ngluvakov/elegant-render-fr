/**
 * item-config.ts — Server actions for per-item configuration in the portal.
 *
 * Exports updateItemConfig (save note + advanced config),
 * confirmItemFileUpload (attach file to specific order item / floor),
 * addOrderItem / deleteOrderItem (draft-only item management),
 * updateInteriorFloors (per-floor rooms+cameras+description+advanced for
 * int-static), and deleteOrderFile (remove an uploaded file).
 *
 * Used by: portal/porudzbine/[orderId] item configuration UI
 */
"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  calculateQuote,
  type QuoteItem,
} from "@/lib/catalog/calculate";
import { getConfiguratorProduct } from "@/lib/catalog/configurator";
import {
  calcInteriorTotal,
  newFloor,
  makeFloorId,
  INT_STATIC_FIRST_FLOOR_EUR,
  ROOM_STYLE_IDS,
  TIME_OF_DAY_IDS,
  SEASON_IDS,
  type InteriorFloor,
  type InteriorRoom,
  type RoomStyleId,
  type TimeOfDayId,
  type SeasonId,
} from "@/lib/catalog/interior-config";

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
  floorId?: string,
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Niste prijavljeni." };

  await prisma.orderFile.create({
    data: {
      orderId,
      orderItemId: itemId,
      floorId: floorId ?? null,
      kind,
      fileName,
      fileSize,
      mimeType,
      storagePath,
    },
  });

  revalidatePath(`/portal/porudzbine/${orderId}`);
  return { success: true };
}

export async function deleteOrderFile(
  fileId: string,
): Promise<ItemConfigResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Niste prijavljeni." };

  const file = await prisma.orderFile.findUnique({
    where: { id: fileId },
    include: { order: { select: { userId: true, status: true, id: true } } },
  });
  if (!file) return { error: "Fajl nije pronađen." };
  if (file.order.userId !== session.user.id)
    return { error: "Nemate pristup." };
  if (file.order.status !== "draft")
    return { error: "Fajlovi se mogu brisati samo u nacrtu." };

  await prisma.orderFile.delete({ where: { id: fileId } });
  revalidatePath(`/portal/porudzbine/${file.order.id}`);
  return { success: true };
}

// Recalculate order total from its items (in-memory sum of item totals).
async function recalcOrderTotal(orderId: string) {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    select: { totalEur: true },
  });
  const totalEur = items.reduce((sum, i) => sum + i.totalEur, 0);
  await prisma.order.update({
    where: { id: orderId },
    data: { totalEur },
  });
}

export async function deleteOrderItem(
  itemId: string,
): Promise<ItemConfigResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Niste prijavljeni." };

  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { order: { select: { userId: true, status: true, id: true } } },
  });
  if (!item) return { error: "Stavka nije pronađena." };
  if (item.order.userId !== session.user.id)
    return { error: "Nemate pristup." };
  if (item.order.status !== "draft")
    return { error: "Stavke se mogu brisati samo u nacrtu." };

  const orderId = item.order.id;

  await prisma.orderItem.delete({ where: { id: itemId } });
  await recalcOrderTotal(orderId);

  revalidatePath(`/portal/porudzbine/${orderId}`);
  return { success: true };
}

export async function addOrderItem(
  orderId: string,
  productId: string,
): Promise<ItemConfigResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Niste prijavljeni." };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      userId: true,
      status: true,
      items: { select: { productId: true } },
    },
  });
  if (!order) return { error: "Porudžbina nije pronađena." };
  if (order.userId !== session.user.id)
    return { error: "Nemate pristup." };
  if (order.status !== "draft")
    return { error: "Stavke se mogu dodavati samo u nacrtu." };
  if (order.items.some((i) => i.productId === productId))
    return { error: "Ova usluga je već u porudžbini." };

  const lookup = getConfiguratorProduct(productId);
  if (!lookup) return { error: "Nepoznata usluga." };

  const quoteItem: QuoteItem = {
    instanceId: `new-${Date.now()}`,
    productId,
    categoryId: lookup.category.id,
    addOnQuantities: {},
    ...(lookup.product.durationConfig
      ? { durationSeconds: lookup.product.durationConfig.defaultSeconds }
      : {}),
  };

  const calc = calculateQuote([quoteItem]);
  const breakdown = calc.items[0];
  if (!breakdown) return { error: "Greška u izračunu." };

  // int-static items always start with one default floor so the price is
  // stable (€170) and the UI has something to show.
  const initialConfigJson: Prisma.InputJsonValue | undefined =
    productId === "int-static" ? { floors: [newFloor(0)] } : undefined;
  const initialTotal =
    productId === "int-static"
      ? INT_STATIC_FIRST_FLOOR_EUR
      : breakdown.totalEur;

  await prisma.orderItem.create({
    data: {
      orderId,
      productId,
      categoryId: lookup.category.id,
      productLabel: breakdown.productLabel,
      categoryLabel: breakdown.categoryLabel,
      basePriceEur: breakdown.basePriceEur,
      totalEur: initialTotal,
      addOnsJson: breakdown.addOns,
      durationSeconds: breakdown.durationSeconds ?? null,
      durationDiscount: breakdown.durationDiscount ?? null,
      ...(initialConfigJson ? { configJson: initialConfigJson } : {}),
    },
  });

  await recalcOrderTotal(orderId);
  revalidatePath(`/portal/porudzbine/${orderId}`);
  return { success: true };
}

function sanitizeRoom(r: InteriorRoom): InteriorRoom {
  const styleId = (r.styleId ?? "") as string;
  const validStyle = (ROOM_STYLE_IDS as readonly string[]).includes(styleId)
    ? (styleId as RoomStyleId)
    : undefined;
  return {
    name: String(r.name ?? "").trim().slice(0, 80) || "Prostorija",
    cameras: Math.max(1, Math.min(20, Number(r.cameras) || 1)),
    ...(validStyle ? { styleId: validStyle } : {}),
  };
}

function sanitizeFloor(f: InteriorFloor, idx: number): InteriorFloor {
  const timeOfDay = (f.timeOfDay ?? "") as string;
  const validTime = (TIME_OF_DAY_IDS as readonly string[]).includes(timeOfDay)
    ? (timeOfDay as TimeOfDayId)
    : undefined;
  const season = (f.season ?? "") as string;
  const validSeason = (SEASON_IDS as readonly string[]).includes(season)
    ? (season as SeasonId)
    : undefined;
  return {
    id: String(f.id || makeFloorId()),
    name: String(f.name || `Sprat ${idx + 1}`).trim().slice(0, 80),
    rooms: (f.rooms ?? []).map(sanitizeRoom).slice(0, 40),
    description: String(f.description ?? "").slice(0, 2000),
    ...(validTime ? { timeOfDay: validTime } : {}),
    ...(validSeason ? { season: validSeason } : {}),
  };
}

export async function updateInteriorFloors(
  itemId: string,
  floors: InteriorFloor[],
): Promise<ItemConfigResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Niste prijavljeni." };

  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { order: { select: { userId: true, status: true, id: true } } },
  });
  if (!item) return { error: "Stavka nije pronađena." };
  if (item.order.userId !== session.user.id)
    return { error: "Nemate pristup." };
  if (item.productId !== "int-static")
    return { error: "Samo za render enterijera (statički)." };
  if (item.order.status !== "draft")
    return { error: "Izmene dozvoljene samo u nacrtu." };

  const sanitized = floors.slice(0, 20).map(sanitizeFloor);
  const { totalEur } = calcInteriorTotal(sanitized);

  await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      configJson: { floors: sanitized } as unknown as Prisma.InputJsonValue,
      totalEur,
    },
  });

  await recalcOrderTotal(item.order.id);
  revalidatePath(`/portal/porudzbine/${item.order.id}`);
  return { success: true };
}
