/**
 * item-config.ts — Server actions for per-item configuration in the portal.
 *
 * Exports updateItemConfig (save note + advanced config),
 * confirmItemFileUpload (attach file to specific order item / floor),
 * addOrderItem / deleteOrderItem (draft-only item management),
 * updateInteriorFloors (per-floor rooms+cameras+description+advanced for
 * int-static), and deleteOrderFile (remove an uploaded file).
 *
 * Used by: portal/orders/[orderId] item configuration UI
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
// repriceOrder lives in @/server/order/reprice.ts (a plain module) so it is
// not exposed as a public server-action endpoint — we call it only after the
// ownership/status checks in the actions below.
import { repriceOrder } from "@/server/order/reprice";
import { getConfiguratorProduct } from "@/lib/catalog/configurator";
import { enforceCleanScan } from "@/lib/file-scan";
import {
  calcInteriorTotal,
  newFloor,
  makeFloorId,
  ROOM_STYLE_IDS,
  STYLE_MODES,
  TIME_OF_DAY_IDS,
  SEASON_IDS,
  type InteriorFloor,
  type InteriorRoom,
  type RoomStyleId,
  type StyleMode,
  type TimeOfDayId,
  type SeasonId,
} from "@/lib/catalog/interior-config";
import {
  calcTour360Total,
  defaultTourAssembly,
  newTour360Floor,
  sanitizeTourAssembly,
  type Tour360Config,
  type Tour360Floor,
  type Tour360Room,
} from "@/lib/catalog/tour360-config";
import {
  defaultLandscapeConfig,
  sanitizeLandscapeConfig,
  type LandscapeConfig,
} from "@/lib/catalog/landscape-config";
import {
  addOnQuantitiesFor as fpAddOnQuantitiesFor,
  defaultFloorplanConfig,
  sanitizeFloorplanConfig,
  type FloorplanConfig,
} from "@/lib/catalog/floorplan-config";
import {
  addOnQuantitiesFor as fp2dAddOnQuantitiesFor,
  defaultFloorplan2dConfig,
  sanitizeFloorplan2dConfig,
  type Floorplan2dConfig,
} from "@/lib/catalog/floorplan-2d-config";
import {
  addOnQuantitiesFor as spAddOnQuantitiesFor,
  defaultSiteplanConfig,
  sanitizeSiteplanConfig,
  type SiteplanConfig,
} from "@/lib/catalog/siteplan-config";
import {
  addOnQuantitiesFor as vsAddOnQuantitiesFor,
  defaultStagingConfig,
  sanitizeStagingConfig,
  type StagingConfig,
  type StagingProductId,
} from "@/lib/catalog/staging-config";
import {
  addOnQuantitiesFor as renoAddOnQuantitiesFor,
  defaultRenovationConfig,
  sanitizeRenovationConfig,
  type RenovationConfig,
} from "@/lib/catalog/renovation-config";
import {
  addOnQuantitiesFor as dtdAddOnQuantitiesFor,
  defaultDtdConfig,
  sanitizeDtdConfig,
  type DtdConfig,
} from "@/lib/catalog/dtd-config";
import {
  addOnQuantitiesFor as irAddOnQuantitiesFor,
  defaultItemRemovalConfig,
  sanitizeItemRemovalConfig,
  type ItemRemovalConfig,
  type ItemRemovalProductId,
} from "@/lib/catalog/item-removal-config";
import {
  ANIM_PRODUCT_ID,
  addOnQuantitiesFor as animAddOnQuantitiesFor,
  defaultAnimationConfig,
  sanitizeAnimationConfig,
  type AnimationConfig,
} from "@/lib/catalog/animation-config";
import {
  defaultExt360Config,
  defaultExtAerialConfig,
  defaultExtStaticConfig,
  ext360AddOnQuantitiesFor,
  extAerialAddOnQuantitiesFor,
  extStaticAddOnQuantitiesFor,
  sanitizeExt360Config,
  sanitizeExtAerialConfig,
  sanitizeExtStaticConfig,
  type Ext360Config,
  type ExtAerialConfig,
  type ExtStaticConfig,
} from "@/lib/catalog/exterior-config";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";

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
  if (!session?.user?.id) return { error: "You are not signed in." };

  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { order: { select: { id: true, userId: true, status: true } } },
  });

  if (!item || item.order.userId !== session.user.id) {
    return { error: "Item not found." };
  }

  // Same gate as canEditItems on the order detail: item data is filled in
  // until production starts; after that everything is locked.
  const EDITABLE_STATUSES = ["draft", "awaiting_payment", "paid"];
  if (!EDITABLE_STATUSES.includes(item.order.status)) {
    return { error: "The order is in production — items can no longer be changed." };
  }

  const updateData: Record<string, unknown> = {};
  if (data.clientNote !== undefined) updateData.clientNote = data.clientNote;
  if (data.configJson !== undefined) updateData.configJson = data.configJson;

  await prisma.orderItem.update({
    where: { id: itemId },
    data: updateData,
  });

  revalidatePath(`/portal/orders/${item.order.id}`);
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
  if (!session?.user?.id) return { error: "You are not signed in." };

  // ISO 27001 A.8.7. Sync AV scan before any DB row is created — an
  // infected upload never enters our system. enforceCleanScan handles
  // delete-from-storage + audit log on failure.
  const scan = await enforceCleanScan({
    storagePath,
    fileName,
    fileSize,
    mimeType,
    entityType: "Order",
    entityId: orderId,
  });
  if (!scan.ok) return { error: scan.userError };

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
      scanStatus: "clean",
      scannedAt: new Date(),
    },
  });

  revalidatePath(`/portal/orders/${orderId}`);
  return { success: true };
}

export async function deleteOrderFile(
  fileId: string,
): Promise<ItemConfigResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You are not signed in." };

  const file = await prisma.orderFile.findUnique({
    where: { id: fileId },
    include: { order: { select: { userId: true, status: true, id: true } } },
  });
  if (!file) return { error: "File not found." };
  if (file.order.userId !== session.user.id)
    return { error: "You do not have access." };
  if (file.order.status !== "draft")
    return { error: "Files can only be deleted on a draft." };

  await prisma.orderFile.delete({ where: { id: fileId } });
  revalidatePath(`/portal/orders/${file.order.id}`);
  return { success: true };
}

export async function deleteOrderItem(
  itemId: string,
): Promise<ItemConfigResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You are not signed in." };

  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { order: { select: { userId: true, status: true, id: true } } },
  });
  if (!item) return { error: "Item not found." };
  if (item.order.userId !== session.user.id)
    return { error: "You do not have access." };
  if (item.order.status !== "draft")
    return { error: "Items can only be deleted on a draft." };

  const orderId = item.order.id;

  await prisma.orderItem.delete({ where: { id: itemId } });
  await repriceOrder(orderId);

  revalidatePath(`/portal/orders/${orderId}`);
  return { success: true };
}

export async function addOrderItem(
  orderId: string,
  productId: string,
  sourceMode?: string,
): Promise<ItemConfigResult & { newItemId?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You are not signed in." };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      userId: true,
      status: true,
      items: { select: { productId: true } },
    },
  });
  if (!order) return { error: "Order not found." };
  if (order.userId !== session.user.id)
    return { error: "You do not have access." };
  if (order.status !== "draft")
    return { error: "Items can only be added on a draft." };
  if (order.items.some((i) => i.productId === productId))
    return { error: "This service is already in the order." };

  const pricingCatalog = await getPublishedPricingCatalog();
  const lookup = getConfiguratorProduct(productId, pricingCatalog.categories);
  if (!lookup) return { error: "Unknown service." };
  if (lookup.product.inquiryOnly)
    return { error: "This service requires a consultation and cannot be added to the cart." };

  const quoteItem: QuoteItem = {
    instanceId: `new-${Date.now()}`,
    productId,
    categoryId: lookup.category.id,
    addOnQuantities: {},
    ...(lookup.product.durationConfig
      ? { durationSeconds: lookup.product.durationConfig.defaultSeconds }
      : {}),
    ...(sourceMode ? { sourceMode } : {}),
  };

  const calc = calculateQuote([quoteItem], [], pricingCatalog);
  const breakdown = calc.items[0];
  if (!breakdown) return { error: "Calculation error." };

  // int-static and int-360 always start with one default floor so the
  // price is stable (first-floor EUR anchors from specialPricing) and the
  // UI has something to show.
  // land-static seeds its default landscape config so the configurator
  // opens with name/stepper pre-filled.
  const initialConfigJson: Prisma.InputJsonValue | undefined =
    productId === "int-static"
      ? { floors: [newFloor(0)] }
      : productId === "int-360"
        ? ({
            floors: [newTour360Floor(0)],
            tourAssembly: defaultTourAssembly(),
          } as unknown as Prisma.InputJsonValue)
        : productId === "land-static"
          ? (defaultLandscapeConfig() as unknown as Prisma.InputJsonValue)
          : productId === "fp3d-single"
            ? (defaultFloorplanConfig() as unknown as Prisma.InputJsonValue)
            : productId === "fp2d-single"
              ? (defaultFloorplan2dConfig() as unknown as Prisma.InputJsonValue)
              : productId === "sp-first"
                ? (defaultSiteplanConfig() as unknown as Prisma.InputJsonValue)
                : productId === "vs-static" || productId === "vs-360"
                  ? (defaultStagingConfig() as unknown as Prisma.InputJsonValue)
                  : productId === "reno-image"
                    ? (defaultRenovationConfig() as unknown as Prisma.InputJsonValue)
                    : productId === "dtd-image"
                      ? (defaultDtdConfig() as unknown as Prisma.InputJsonValue)
                      : productId === "ir-simple" || productId === "ir-complex"
                        ? (defaultItemRemovalConfig() as unknown as Prisma.InputJsonValue)
                        : productId === ANIM_PRODUCT_ID
                          ? (defaultAnimationConfig(
                              (sourceMode as
                                | "scratch"
                                | "existing"
                                | "active") ?? "scratch",
                            ) as unknown as Prisma.InputJsonValue)
                          : productId === "ext-static"
                              ? (defaultExtStaticConfig() as unknown as Prisma.InputJsonValue)
                              : productId === "ext-360"
                                ? (defaultExt360Config() as unknown as Prisma.InputJsonValue)
                                : productId === "ext-aerial"
                                  ? (defaultExtAerialConfig() as unknown as Prisma.InputJsonValue)
                                  : undefined;
  const initialTotal =
    productId === "int-static"
      ? pricingCatalog.settings.specialPricing.interior.firstFloorEur
      : productId === "int-360"
        ? pricingCatalog.settings.specialPricing.tour360.firstFloorEur
        : breakdown.totalEur;

  const created = await prisma.orderItem.create({
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
    select: { id: true },
  });

  await repriceOrder(orderId);
  revalidatePath(`/portal/orders/${orderId}`);
  return { success: true, newItemId: created.id };
}

function sanitizeRoom(r: InteriorRoom): InteriorRoom {
  const styleId = (r.styleId ?? "") as string;
  const validStyle = (ROOM_STYLE_IDS as readonly string[]).includes(styleId)
    ? (styleId as RoomStyleId)
    : undefined;
  const notes = String(r.notes ?? "").slice(0, 2000);
  return {
    name: String(r.name ?? "").trim().slice(0, 80) || "Room",
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
  const styleMode = (f.styleMode ?? "") as string;
  const validStyleMode = (STYLE_MODES as readonly string[]).includes(styleMode)
    ? (styleMode as StyleMode)
    : undefined;
  const globalStyleId = (f.globalStyleId ?? "") as string;
  const validGlobalStyle = (ROOM_STYLE_IDS as readonly string[]).includes(
    globalStyleId,
  )
    ? (globalStyleId as RoomStyleId)
    : undefined;
  return {
    id: String(f.id || makeFloorId()),
    name: String(f.name || `Floor ${idx + 1}`).trim().slice(0, 80),
    rooms: (f.rooms ?? []).map(sanitizeRoom).slice(0, 40),
    description: String(f.description ?? "").slice(0, 2000),
    ...(validTime ? { timeOfDay: validTime } : {}),
    ...(validSeason ? { season: validSeason } : {}),
    ...(validStyleMode ? { styleMode: validStyleMode } : {}),
    ...(validGlobalStyle ? { globalStyleId: validGlobalStyle } : {}),
  };
}

// ─── Tour360 (int-360) sanitizers + helpers ────────────────────────────

function sanitizeTour360Room(r: Tour360Room): Tour360Room {
  const styleId = (r.styleId ?? "") as string;
  const validStyle = (ROOM_STYLE_IDS as readonly string[]).includes(styleId)
    ? (styleId as RoomStyleId)
    : undefined;
  const notes = String(r.notes ?? "").slice(0, 2000);
  return {
    name: String(r.name ?? "").trim().slice(0, 80) || "Room",
    hotspots: Math.max(0, Math.min(20, Number(r.hotspots) || 0)),
    staticCameras: Math.max(0, Math.min(20, Number(r.staticCameras) || 0)),
    ...(validStyle ? { styleId: validStyle } : {}),
    ...(notes ? { notes } : {}),
  };
}

function sanitizeTour360Floor(f: Tour360Floor, idx: number): Tour360Floor {
  const timeOfDay = (f.timeOfDay ?? "") as string;
  const validTime = (TIME_OF_DAY_IDS as readonly string[]).includes(timeOfDay)
    ? (timeOfDay as TimeOfDayId)
    : undefined;
  const season = (f.season ?? "") as string;
  const validSeason = (SEASON_IDS as readonly string[]).includes(season)
    ? (season as SeasonId)
    : undefined;
  const styleMode = (f.styleMode ?? "") as string;
  const validStyleMode = (STYLE_MODES as readonly string[]).includes(styleMode)
    ? (styleMode as StyleMode)
    : undefined;
  const globalStyleId = (f.globalStyleId ?? "") as string;
  const validGlobalStyle = (ROOM_STYLE_IDS as readonly string[]).includes(
    globalStyleId,
  )
    ? (globalStyleId as RoomStyleId)
    : undefined;
  return {
    id: String(f.id || makeFloorId()),
    name: String(f.name || `Floor ${idx + 1}`).trim().slice(0, 80),
    rooms: (f.rooms ?? []).map(sanitizeTour360Room).slice(0, 40),
    description: String(f.description ?? "").slice(0, 2000),
    ...(validTime ? { timeOfDay: validTime } : {}),
    ...(validSeason ? { season: validSeason } : {}),
    ...(validStyleMode ? { styleMode: validStyleMode } : {}),
    ...(validGlobalStyle ? { globalStyleId: validGlobalStyle } : {}),
  };
}


export async function updateTour360Config(
  itemId: string,
  config: Tour360Config,
): Promise<ItemConfigResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You are not signed in." };

  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { order: { select: { userId: true, status: true, id: true } } },
  });
  if (!item) return { error: "Item not found." };
  if (item.order.userId !== session.user.id)
    return { error: "You do not have access." };
  if (item.productId !== "int-360")
    return { error: "Only for the 360 virtual tour." };
  if (item.order.status !== "draft")
    return { error: "Changes are allowed only on a draft." };

  const sanitizedFloors = (config.floors ?? [])
    .slice(0, 20)
    .map(sanitizeTour360Floor);
  const sanitizedAssembly = sanitizeTourAssembly(config.tourAssembly);
  const { totalEur } = calcTour360Total(sanitizedFloors, sanitizedAssembly);

  await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      configJson: {
        floors: sanitizedFloors,
        tourAssembly: sanitizedAssembly,
      } as unknown as Prisma.InputJsonValue,
      totalEur,
    },
  });

  await repriceOrder(item.order.id);
  revalidatePath(`/portal/orders/${item.order.id}`);
  return { success: true };
}

// ─── Landscape (land-static) ───────────────────────────────────────────

export async function updateLandscapeConfig(
  itemId: string,
  config: LandscapeConfig,
): Promise<ItemConfigResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You are not signed in." };

  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { order: { select: { userId: true, status: true, id: true } } },
  });
  if (!item) return { error: "Item not found." };
  if (item.order.userId !== session.user.id)
    return { error: "You do not have access." };
  if (item.productId !== "land-static")
    return { error: "Only for the landscape render." };
  if (item.order.status !== "draft")
    return { error: "Changes are allowed only on a draft." };

  const sanitized = sanitizeLandscapeConfig(config);

  // Translate config inputs into add-on quantities so the standard
  // engine path (calculateQuote inside repriceOrder) prices the item:
  //   land-cam: cameraCount - 1 (basePrice covers the first kadar)
  //   land-aerial: aerialEnabled ? 1 : 0
  const addOnQuantities: Record<string, number> = {
    "land-cam": Math.max(0, sanitized.cameraCount - 1),
  };
  if (sanitized.aerialEnabled) {
    addOnQuantities["land-aerial"] = 1;
  }
  const qi: QuoteItem = {
    instanceId: itemId,
    productId: "land-static",
    categoryId: "landscape",
    addOnQuantities,
  };
  const calc = calculateQuote([qi]);
  const addOns = calc.items[0]?.addOns ?? [];

  await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      configJson: sanitized as unknown as Prisma.InputJsonValue,
      addOnsJson: addOns as unknown as Prisma.InputJsonValue,
    },
  });

  await repriceOrder(item.order.id);
  revalidatePath(`/portal/orders/${item.order.id}`);
  return { success: true };
}

// ─── Floorplan 3D (fp3d-single) ────────────────────────────────────────

export async function updateFloorplanConfig(
  itemId: string,
  config: FloorplanConfig,
): Promise<ItemConfigResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You are not signed in." };

  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { order: { select: { userId: true, status: true, id: true } } },
  });
  if (!item) return { error: "Item not found." };
  if (item.order.userId !== session.user.id)
    return { error: "You do not have access." };
  if (item.productId !== "fp3d-single")
    return { error: "Only for 3D floor plans." };
  if (item.order.status !== "draft")
    return { error: "Changes are allowed only on a draft." };

  const sanitized = sanitizeFloorplanConfig(config);
  const qi: QuoteItem = {
    instanceId: itemId,
    productId: "fp3d-single",
    categoryId: "floorplans-3d",
    addOnQuantities: fpAddOnQuantitiesFor(sanitized),
  };
  const calc = calculateQuote([qi]);
  const addOns = calc.items[0]?.addOns ?? [];

  await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      configJson: sanitized as unknown as Prisma.InputJsonValue,
      addOnsJson: addOns as unknown as Prisma.InputJsonValue,
    },
  });

  await repriceOrder(item.order.id);
  revalidatePath(`/portal/orders/${item.order.id}`);
  return { success: true };
}

// ─── Floorplan 2D (fp2d-single) ────────────────────────────────────────

export async function updateFloorplan2dConfig(
  itemId: string,
  config: Floorplan2dConfig,
): Promise<ItemConfigResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You are not signed in." };

  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { order: { select: { userId: true, status: true, id: true } } },
  });
  if (!item) return { error: "Item not found." };
  if (item.order.userId !== session.user.id)
    return { error: "You do not have access." };
  if (item.productId !== "fp2d-single")
    return { error: "Only for 2D floor plans." };
  if (item.order.status !== "draft")
    return { error: "Changes are allowed only on a draft." };

  const sanitized = sanitizeFloorplan2dConfig(config);
  const qi: QuoteItem = {
    instanceId: itemId,
    productId: "fp2d-single",
    categoryId: "floorplans-2d",
    addOnQuantities: fp2dAddOnQuantitiesFor(sanitized),
  };
  const calc = calculateQuote([qi]);
  const addOns = calc.items[0]?.addOns ?? [];

  await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      configJson: sanitized as unknown as Prisma.InputJsonValue,
      addOnsJson: addOns as unknown as Prisma.InputJsonValue,
    },
  });

  await repriceOrder(item.order.id);
  revalidatePath(`/portal/orders/${item.order.id}`);
  return { success: true };
}

// ─── Site plan (sp-first) ──────────────────────────────────────────────

export async function updateSiteplanConfig(
  itemId: string,
  config: SiteplanConfig,
): Promise<ItemConfigResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You are not signed in." };

  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { order: { select: { userId: true, status: true, id: true } } },
  });
  if (!item) return { error: "Item not found." };
  if (item.order.userId !== session.user.id)
    return { error: "You do not have access." };
  if (item.productId !== "sp-first")
    return { error: "Only for the 3D site plan." };
  if (item.order.status !== "draft")
    return { error: "Changes are allowed only on a draft." };

  const sanitized = sanitizeSiteplanConfig(config);
  const qi: QuoteItem = {
    instanceId: itemId,
    productId: "sp-first",
    categoryId: "siteplans",
    addOnQuantities: spAddOnQuantitiesFor(sanitized),
  };
  const calc = calculateQuote([qi]);
  const addOns = calc.items[0]?.addOns ?? [];

  await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      configJson: sanitized as unknown as Prisma.InputJsonValue,
      addOnsJson: addOns as unknown as Prisma.InputJsonValue,
    },
  });

  await repriceOrder(item.order.id);
  revalidatePath(`/portal/orders/${item.order.id}`);
  return { success: true };
}

// ─── Virtual staging (vs-static + vs-360) ──────────────────────────────

export async function updateStagingConfig(
  itemId: string,
  config: StagingConfig,
): Promise<ItemConfigResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You are not signed in." };

  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { order: { select: { userId: true, status: true, id: true } } },
  });
  if (!item) return { error: "Item not found." };
  if (item.order.userId !== session.user.id)
    return { error: "You do not have access." };
  if (item.productId !== "vs-static" && item.productId !== "vs-360")
    return { error: "Only for virtual staging." };
  if (item.order.status !== "draft")
    return { error: "Changes are allowed only on a draft." };

  const productId = item.productId as StagingProductId;
  const sanitized = sanitizeStagingConfig(config);
  const qi: QuoteItem = {
    instanceId: itemId,
    productId,
    categoryId: "staging",
    addOnQuantities: vsAddOnQuantitiesFor(sanitized, productId),
  };
  const calc = calculateQuote([qi]);
  const addOns = calc.items[0]?.addOns ?? [];

  await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      configJson: sanitized as unknown as Prisma.InputJsonValue,
      addOnsJson: addOns as unknown as Prisma.InputJsonValue,
    },
  });

  await repriceOrder(item.order.id);
  revalidatePath(`/portal/orders/${item.order.id}`);
  return { success: true };
}

// ─── Staging type swap (vs-static ↔ vs-360) ──────────────────────────
//
// Replaces a staging item with one of the other type. Resets configJson
// to defaults because the source-photo expectation differs (regular
// photos vs equirectangular panoramas) and add-on IDs are mode-specific.
// Files are kept attached to the new item — the customer can delete /
// re-upload as needed.

export async function swapStagingType(
  itemId: string,
): Promise<ItemConfigResult & { newItemId?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You are not signed in." };

  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: {
      order: {
        select: {
          userId: true,
          status: true,
          id: true,
          items: { select: { productId: true } },
        },
      },
    },
  });
  if (!item) return { error: "Item not found." };
  if (item.order.userId !== session.user.id)
    return { error: "You do not have access." };
  if (item.productId !== "vs-static" && item.productId !== "vs-360")
    return { error: "Only for virtual staging." };
  if (item.order.status !== "draft")
    return { error: "Changes are allowed only on a draft." };

  const targetProductId =
    item.productId === "vs-static" ? "vs-360" : "vs-static";
  if (
    item.order.items.some(
      (i) => i.productId === targetProductId && i.productId !== item.productId,
    )
  ) {
    return {
      error:
        "The other staging type already exists in this order. Delete it first.",
    };
  }

  const lookup = getConfiguratorProduct(targetProductId);
  if (!lookup) return { error: "Unknown service." };

  const sanitized = sanitizeStagingConfig({
    ...defaultStagingConfig(),
    // Carry over the room name so the customer doesn't lose context
    roomName: (item.configJson as { roomName?: string } | null)?.roomName ?? "Room",
  });
  const qi: QuoteItem = {
    instanceId: `swap-${Date.now()}`,
    productId: targetProductId,
    categoryId: "staging",
    addOnQuantities: vsAddOnQuantitiesFor(sanitized, targetProductId),
  };
  const calc = calculateQuote([qi]);
  const breakdown = calc.items[0];
  if (!breakdown) return { error: "Calculation error." };

  // Order is critical: OrderFile.orderItemId has no onDelete cascade, so
  // deleting the old item before re-pointing files would fail with an FK
  // constraint. We create the new item first, re-attach files, then
  // delete the old item — all inside a transaction.
  const newItem = await prisma.$transaction(async (tx) => {
    const created = await tx.orderItem.create({
      data: {
        orderId: item.order.id,
        productId: targetProductId,
        categoryId: "staging",
        productLabel: lookup.product.label,
        categoryLabel: lookup.category.label,
        basePriceEur: lookup.product.basePriceEur,
        totalEur: breakdown.totalEur,
        configJson: sanitized as unknown as Prisma.InputJsonValue,
        addOnsJson: breakdown.addOns as unknown as Prisma.InputJsonValue,
      },
      select: { id: true },
    });
    await tx.orderFile.updateMany({
      where: { orderItemId: itemId },
      data: { orderItemId: created.id },
    });
    await tx.orderItem.delete({ where: { id: itemId } });
    return created;
  });

  await repriceOrder(item.order.id);
  revalidatePath(`/portal/orders/${item.order.id}`);
  return { success: true, newItemId: newItem.id };
}

// ─── Virtual renovation (reno-image) ──────────────────────────────────

export async function updateRenovationConfig(
  itemId: string,
  config: RenovationConfig,
): Promise<ItemConfigResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You are not signed in." };

  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { order: { select: { userId: true, status: true, id: true } } },
  });
  if (!item) return { error: "Item not found." };
  if (item.order.userId !== session.user.id)
    return { error: "You do not have access." };
  if (item.productId !== "reno-image")
    return { error: "Only for virtual renovation." };
  if (item.order.status !== "draft")
    return { error: "Changes are allowed only on a draft." };

  const sanitized = sanitizeRenovationConfig(config);
  const qi: QuoteItem = {
    instanceId: itemId,
    productId: "reno-image",
    categoryId: "renovation",
    addOnQuantities: renoAddOnQuantitiesFor(sanitized),
  };
  const calc = calculateQuote([qi]);
  const addOns = calc.items[0]?.addOns ?? [];

  await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      configJson: sanitized as unknown as Prisma.InputJsonValue,
      addOnsJson: addOns as unknown as Prisma.InputJsonValue,
    },
  });

  await repriceOrder(item.order.id);
  revalidatePath(`/portal/orders/${item.order.id}`);
  return { success: true };
}

// ─── Day-to-Dusk (dtd-image) ──────────────────────────────────────────

export async function updateDtdConfig(
  itemId: string,
  config: DtdConfig,
): Promise<ItemConfigResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You are not signed in." };

  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { order: { select: { userId: true, status: true, id: true } } },
  });
  if (!item) return { error: "Item not found." };
  if (item.order.userId !== session.user.id)
    return { error: "You do not have access." };
  if (item.productId !== "dtd-image")
    return { error: "Only for the day-to-dusk conversion." };
  if (item.order.status !== "draft")
    return { error: "Changes are allowed only on a draft." };

  const sanitized = sanitizeDtdConfig(config);
  const qi: QuoteItem = {
    instanceId: itemId,
    productId: "dtd-image",
    categoryId: "day-to-dusk",
    addOnQuantities: dtdAddOnQuantitiesFor(sanitized),
  };
  const calc = calculateQuote([qi]);
  const addOns = calc.items[0]?.addOns ?? [];

  await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      configJson: sanitized as unknown as Prisma.InputJsonValue,
      addOnsJson: addOns as unknown as Prisma.InputJsonValue,
    },
  });

  await repriceOrder(item.order.id);
  revalidatePath(`/portal/orders/${item.order.id}`);
  return { success: true };
}

// ─── Item Removal (ir-simple + ir-complex) ─────────────────────────────

export async function updateItemRemovalConfig(
  itemId: string,
  config: ItemRemovalConfig,
): Promise<ItemConfigResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You are not signed in." };

  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { order: { select: { userId: true, status: true, id: true } } },
  });
  if (!item) return { error: "Item not found." };
  if (item.order.userId !== session.user.id)
    return { error: "You do not have access." };
  if (item.productId !== "ir-simple" && item.productId !== "ir-complex")
    return { error: "Only for item removal." };
  if (item.order.status !== "draft")
    return { error: "Changes are allowed only on a draft." };

  const productId = item.productId as ItemRemovalProductId;
  const sanitized = sanitizeItemRemovalConfig(config);
  const qi: QuoteItem = {
    instanceId: itemId,
    productId,
    categoryId: "item-removal",
    addOnQuantities: irAddOnQuantitiesFor(sanitized, productId),
  };
  const calc = calculateQuote([qi]);
  const addOns = calc.items[0]?.addOns ?? [];

  await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      configJson: sanitized as unknown as Prisma.InputJsonValue,
      addOnsJson: addOns as unknown as Prisma.InputJsonValue,
    },
  });

  await repriceOrder(item.order.id);
  revalidatePath(`/portal/orders/${item.order.id}`);
  return { success: true };
}

// ─── 3D animation (consolidated `anim` product, sourceMode in config) ─

export async function updateAnimationConfig(
  itemId: string,
  config: AnimationConfig,
): Promise<ItemConfigResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You are not signed in." };

  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { order: { select: { userId: true, status: true, id: true } } },
  });
  if (!item) return { error: "Item not found." };
  if (item.order.userId !== session.user.id)
    return { error: "You do not have access." };
  if (item.productId !== ANIM_PRODUCT_ID)
    return { error: "Only for 3D animation." };
  if (item.order.status !== "draft")
    return { error: "Changes are allowed only on a draft." };

  const sanitized = sanitizeAnimationConfig(config);
  const qi: QuoteItem = {
    instanceId: itemId,
    productId: ANIM_PRODUCT_ID,
    categoryId: "animation",
    addOnQuantities: animAddOnQuantitiesFor(sanitized),
    durationSeconds: sanitized.durationSeconds,
    sourceMode: sanitized.sourceMode,
  };
  const calc = calculateQuote([qi]);
  const breakdown = calc.items[0];
  const addOns = breakdown?.addOns ?? [];

  await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      configJson: sanitized as unknown as Prisma.InputJsonValue,
      addOnsJson: addOns as unknown as Prisma.InputJsonValue,
      durationSeconds: sanitized.durationSeconds,
      durationDiscount: breakdown?.durationDiscount ?? null,
    },
  });

  await repriceOrder(item.order.id);
  revalidatePath(`/portal/orders/${item.order.id}`);
  return { success: true };
}

// ─── Exterior products (ext-static / ext-360 / ext-aerial) ────────────

async function authorizeExteriorEdit(itemId: string, productId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "You are not signed in." } as const;
  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { order: { select: { userId: true, status: true, id: true } } },
  });
  if (!item) return { error: "Item not found." } as const;
  if (item.order.userId !== session.user.id)
    return { error: "You do not have access." } as const;
  if (item.productId !== productId)
    return { error: `Only for ${productId}.` } as const;
  if (item.order.status !== "draft")
    return { error: "Changes are allowed only on a draft." } as const;
  return { item } as const;
}

export async function updateExtStaticConfig(
  itemId: string,
  config: ExtStaticConfig,
): Promise<ItemConfigResult> {
  const auth = await authorizeExteriorEdit(itemId, "ext-static");
  if ("error" in auth) return auth;
  const sanitized = sanitizeExtStaticConfig(config);
  const qi: QuoteItem = {
    instanceId: itemId,
    productId: "ext-static",
    categoryId: "exterior",
    addOnQuantities: extStaticAddOnQuantitiesFor(sanitized),
  };
  const calc = calculateQuote([qi]);
  const addOns = calc.items[0]?.addOns ?? [];
  await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      configJson: sanitized as unknown as Prisma.InputJsonValue,
      addOnsJson: addOns as unknown as Prisma.InputJsonValue,
    },
  });
  await repriceOrder(auth.item.order.id);
  revalidatePath(`/portal/orders/${auth.item.order.id}`);
  return { success: true };
}

export async function updateExt360Config(
  itemId: string,
  config: Ext360Config,
): Promise<ItemConfigResult> {
  const auth = await authorizeExteriorEdit(itemId, "ext-360");
  if ("error" in auth) return auth;
  const sanitized = sanitizeExt360Config(config);
  const qi: QuoteItem = {
    instanceId: itemId,
    productId: "ext-360",
    categoryId: "exterior",
    addOnQuantities: ext360AddOnQuantitiesFor(sanitized),
  };
  const calc = calculateQuote([qi]);
  const addOns = calc.items[0]?.addOns ?? [];
  await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      configJson: sanitized as unknown as Prisma.InputJsonValue,
      addOnsJson: addOns as unknown as Prisma.InputJsonValue,
    },
  });
  await repriceOrder(auth.item.order.id);
  revalidatePath(`/portal/orders/${auth.item.order.id}`);
  return { success: true };
}

export async function updateExtAerialConfig(
  itemId: string,
  config: ExtAerialConfig,
): Promise<ItemConfigResult> {
  const auth = await authorizeExteriorEdit(itemId, "ext-aerial");
  if ("error" in auth) return auth;
  const sanitized = sanitizeExtAerialConfig(config);
  const qi: QuoteItem = {
    instanceId: itemId,
    productId: "ext-aerial",
    categoryId: "exterior",
    addOnQuantities: extAerialAddOnQuantitiesFor(sanitized),
  };
  const calc = calculateQuote([qi]);
  const addOns = calc.items[0]?.addOns ?? [];
  await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      configJson: sanitized as unknown as Prisma.InputJsonValue,
      addOnsJson: addOns as unknown as Prisma.InputJsonValue,
    },
  });
  await repriceOrder(auth.item.order.id);
  revalidatePath(`/portal/orders/${auth.item.order.id}`);
  return { success: true };
}

export async function updateInteriorFloors(
  itemId: string,
  floors: InteriorFloor[],
): Promise<ItemConfigResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You are not signed in." };

  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { order: { select: { userId: true, status: true, id: true } } },
  });
  if (!item) return { error: "Item not found." };
  if (item.order.userId !== session.user.id)
    return { error: "You do not have access." };
  if (item.productId !== "int-static")
    return { error: "Only for the interior render (static)." };
  if (item.order.status !== "draft")
    return { error: "Changes are allowed only on a draft." };

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
  revalidatePath(`/portal/orders/${item.order.id}`);
  return { success: true };
}
