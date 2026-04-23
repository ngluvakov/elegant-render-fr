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
  resolveDiscount,
  type QuoteItem,
  type AddOnBreakdown,
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

// Re-price every item in an order. Applies the cross-service "model-first"
// discount resolver across all siblings so adding/removing one item can update
// sibling discounts. int-static items keep their calcInteriorTotal-based base
// total and apply the resolved discount as a flat scalar on top.
export async function repriceOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { referencedOrderId: true },
  });
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    orderBy: { id: "asc" },
  });

  // Reconstruct QuoteItem[] from persisted items so the resolver sees every
  // sibling's productId and add-on quantities.
  const toQuoteItem = (i: (typeof items)[number]): QuoteItem => {
    const addOns = (Array.isArray(i.addOnsJson)
      ? (i.addOnsJson as unknown as AddOnBreakdown[])
      : []) as AddOnBreakdown[];
    const addOnQuantities: Record<string, number> = {};
    for (const ao of addOns) addOnQuantities[ao.addOnId] = ao.quantity;
    return {
      instanceId: i.id,
      productId: i.productId,
      categoryId: i.categoryId,
      addOnQuantities,
      ...(i.durationSeconds != null ? { durationSeconds: i.durationSeconds } : {}),
    };
  };
  const quoteItems: QuoteItem[] = items.map(toQuoteItem);

  // Rule 3: pull assets from a referenced prior order so they feed the
  // discount resolver without showing up in the current order's totals.
  let externalSources: QuoteItem[] = [];
  if (order?.referencedOrderId) {
    const refItems = await prisma.orderItem.findMany({
      where: { orderId: order.referencedOrderId },
      orderBy: { id: "asc" },
    });
    externalSources = refItems.map(toQuoteItem);
  }

  // Non-int-static items re-price through the full engine.
  const standardItems = quoteItems.filter((qi) => qi.productId !== "int-static");
  const calc = calculateQuote(standardItems, externalSources);
  const breakdownById = new Map(calc.items.map((b) => [b.instanceId, b]));

  let orderTotal = 0;

  for (const i of items) {
    if (i.productId === "int-static") {
      // int-static pricing derives from configJson.floors; apply discount on top.
      const floors = (i.configJson && typeof i.configJson === "object" &&
        "floors" in (i.configJson as Record<string, unknown>)
        ? (i.configJson as { floors: InteriorFloor[] }).floors
        : []) as InteriorFloor[];
      const preDiscount = calcInteriorTotal(floors).totalEur;
      const target = quoteItems.find((q) => q.instanceId === i.id);
      const discount = target
        ? resolveDiscount(target, [...quoteItems, ...externalSources])
        : null;
      const totalEur = discount
        ? Math.round(preDiscount * (1 - discount.pct / 100))
        : preDiscount;
      await prisma.orderItem.update({
        where: { id: i.id },
        data: {
          totalEur,
          originalTotalEur: preDiscount,
          discountPct: discount?.pct ?? 0,
          discountReason: discount?.reason ?? null,
        },
      });
      orderTotal += totalEur;
      continue;
    }

    const bd = breakdownById.get(i.id);
    if (!bd) {
      // Unknown product id (shouldn't happen) — leave the row as-is.
      orderTotal += i.totalEur;
      continue;
    }
    await prisma.orderItem.update({
      where: { id: i.id },
      data: {
        basePriceEur: bd.basePriceEur,
        totalEur: bd.totalEur,
        addOnsJson: bd.addOns,
        durationSeconds: bd.durationSeconds ?? null,
        durationDiscount: bd.durationDiscount ?? null,
        originalTotalEur: bd.originalTotalEur,
        discountPct: bd.discountPct,
        discountReason: bd.discountReason,
      },
    });
    orderTotal += bd.totalEur;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { totalEur: orderTotal },
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
  await repriceOrder(orderId);

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

  await repriceOrder(orderId);
  revalidatePath(`/portal/porudzbine/${orderId}`);
  return { success: true };
}

function sanitizeRoom(r: InteriorRoom): InteriorRoom {
  const styleId = (r.styleId ?? "") as string;
  const validStyle = (ROOM_STYLE_IDS as readonly string[]).includes(styleId)
    ? (styleId as RoomStyleId)
    : undefined;
  const notes = String(r.notes ?? "").slice(0, 2000);
  return {
    name: String(r.name ?? "").trim().slice(0, 80) || "Prostorija",
    cameras: Math.max(1, Math.min(20, Number(r.cameras) || 1)),
    ...(validStyle ? { styleId: validStyle } : {}),
    ...(notes ? { notes } : {}),
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

  await repriceOrder(item.order.id);
  revalidatePath(`/portal/porudzbine/${item.order.id}`);
  return { success: true };
}
