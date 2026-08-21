/**
 * quote.ts — Save and load shareable quote snapshots.
 *
 * Exposes:
 *   - saveQuote(items)   → creates a Quote row, returns { token }.
 *     Token is the cuid id; share URL is /pricing?q=<token>.
 *   - loadQuote(token)   → returns { items } if token valid + not expired.
 *     Stamps openedAt for analytics.
 *
 * Quotes expire after 30 days. Item count is capped at 50 to avoid
 * pathological payloads. Both actions are unauthenticated — guests can
 * save their cart and share it before checking out.
 */
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { QuoteItem } from "@/lib/catalog/calculate";
import { getConfiguratorProduct } from "@/lib/catalog/configurator";
import {
  makeFloorId,
  newFloor,
  type InteriorFloor,
  type InteriorRoom,
} from "@/lib/catalog/interior-config";
import {
  defaultTourAssembly,
  newTour360Floor,
  type Tour360Config,
  type Tour360Floor,
  type Tour360Room,
} from "@/lib/catalog/tour360-config";

const QUOTE_TTL_DAYS = 30;
const MAX_ITEMS = 50;

export type SaveQuoteResult = { token: string } | { error: string };
export type LoadQuoteResult = { items: QuoteItem[] } | { error: string };

function sanitizeInteriorFloors(input: unknown): InteriorFloor[] | undefined {
  if (!Array.isArray(input) || input.length === 0) return undefined;
  const out: InteriorFloor[] = [];
  for (const f of input) {
    if (!f || typeof f !== "object") continue;
    const ro = f as Record<string, unknown>;
    const id = typeof ro.id === "string" ? ro.id : makeFloorId();
    const name = typeof ro.name === "string" ? ro.name : `Étage ${out.length + 1}`;
    const roomsInput = Array.isArray(ro.rooms) ? ro.rooms : [];
    const rooms: InteriorRoom[] = [];
    for (const r of roomsInput) {
      if (!r || typeof r !== "object") continue;
      const rr = r as Record<string, unknown>;
      const roomName = typeof rr.name === "string" ? rr.name : "Pièce";
      const cameras =
        typeof rr.cameras === "number" && Number.isFinite(rr.cameras)
          ? Math.max(1, Math.floor(rr.cameras))
          : 1;
      rooms.push({ name: roomName, cameras });
    }
    out.push({ id, name, rooms });
  }
  return out.length > 0 ? out : undefined;
}

function sanitizeTour360Config(input: unknown): Tour360Config | undefined {
  if (!input || typeof input !== "object") return undefined;
  const ro = input as Record<string, unknown>;
  const floorsInput = Array.isArray(ro.floors) ? ro.floors : [];
  const floors: Tour360Floor[] = [];
  for (const f of floorsInput) {
    if (!f || typeof f !== "object") continue;
    const fo = f as Record<string, unknown>;
    const id = typeof fo.id === "string" ? fo.id : makeFloorId();
    const name = typeof fo.name === "string" ? fo.name : `Étage ${floors.length + 1}`;
    const roomsInput = Array.isArray(fo.rooms) ? fo.rooms : [];
    const rooms: Tour360Room[] = [];
    for (const r of roomsInput) {
      if (!r || typeof r !== "object") continue;
      const rr = r as Record<string, unknown>;
      const roomName = typeof rr.name === "string" ? rr.name : "Pièce";
      const hotspots =
        typeof rr.hotspots === "number" && Number.isFinite(rr.hotspots)
          ? Math.max(0, Math.floor(rr.hotspots))
          : 1;
      const staticCameras =
        typeof rr.staticCameras === "number" && Number.isFinite(rr.staticCameras)
          ? Math.max(0, Math.floor(rr.staticCameras))
          : 0;
      rooms.push({ name: roomName, hotspots, staticCameras });
    }
    floors.push({ id, name, rooms });
  }
  if (floors.length === 0) return undefined;
  const ta = ro.tourAssembly;
  const tourAssembly =
    ta && typeof ta === "object"
      ? {
          webTourEnabled: !!(ta as Record<string, unknown>).webTourEnabled,
          floorPlanNavEnabled: !!(ta as Record<string, unknown>)
            .floorPlanNavEnabled,
          whiteLabelEnabled: !!(ta as Record<string, unknown>).whiteLabelEnabled,
        }
      : defaultTourAssembly();
  return { floors, tourAssembly };
}

/**
 * Best-effort migration for share-quote tokens minted before the per-floor
 * editor existed. Reads legacy addOnQuantities (room / cam / floor) for
 * int-static and int-360 and synthesizes a single floor (plus any extra
 * empty floors for the floor add-on) so the canonical helpers can price
 * the cart correctly. May produce a small price drift from the original
 * token (cameras are now coupled to rooms and threshold is shared); this
 * is acceptable for a 30-day TTL share-link feature.
 */
function migrateLegacyInterior(item: QuoteItem): QuoteItem {
  if (item.productId !== "int-static" || item.interiorConfig) return item;
  const roomQty = item.addOnQuantities?.["int-static-room"] ?? 10;
  const camQty = item.addOnQuantities?.["int-static-cam"] ?? 0;
  const floorQty = item.addOnQuantities?.["int-static-floor"] ?? 0;
  const camerasPerRoom = Math.max(
    1,
    Math.ceil((Math.max(0, roomQty) + Math.max(0, camQty)) /
      Math.max(1, roomQty)),
  );
  const firstFloor: InteriorFloor = {
    id: makeFloorId(),
    name: "Étage 1",
    rooms: Array.from({ length: Math.max(0, Math.floor(roomQty)) }, (_, i) => ({
      name: `Pièce ${i + 1}`,
      cameras: camerasPerRoom,
    })),
  };
  const extraFloors = Array.from(
    { length: Math.max(0, Math.floor(floorQty)) },
    (_, i) => newFloor(i + 1),
  );
  return { ...item, interiorConfig: [firstFloor, ...extraFloors] };
}

function migrateLegacyTour360(item: QuoteItem): QuoteItem {
  if (item.productId !== "int-360" || item.tour360Config) return item;
  const roomQty = item.addOnQuantities?.["int-360-room"] ?? 10;
  const hotspotQty = item.addOnQuantities?.["int-360-hotspot"] ?? 0;
  const staticQty = item.addOnQuantities?.["int-360-static"] ?? 10;
  const floorQty = item.addOnQuantities?.["int-360-floor"] ?? 0;
  const hotspotsPerRoom = Math.max(
    0,
    Math.ceil(Math.max(0, hotspotQty) / Math.max(1, roomQty)),
  );
  const staticPerRoom = Math.max(
    0,
    Math.ceil(Math.max(0, staticQty) / Math.max(1, roomQty)),
  );
  const firstFloor: Tour360Floor = {
    id: makeFloorId(),
    name: "Étage 1",
    rooms: Array.from({ length: Math.max(0, Math.floor(roomQty)) }, (_, i) => ({
      name: `Pièce ${i + 1}`,
      hotspots: hotspotsPerRoom,
      staticCameras: staticPerRoom,
    })),
  };
  const extraFloors = Array.from(
    { length: Math.max(0, Math.floor(floorQty)) },
    (_, i) => newTour360Floor(i + 1),
  );
  return {
    ...item,
    tour360Config: {
      floors: [firstFloor, ...extraFloors],
      tourAssembly: defaultTourAssembly(),
    },
  };
}

function sanitizeItems(input: unknown): QuoteItem[] | null {
  if (!Array.isArray(input)) return null;
  if (input.length === 0 || input.length > MAX_ITEMS) return null;

  const out: QuoteItem[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    const productId = typeof r.productId === "string" ? r.productId : null;
    const categoryId = typeof r.categoryId === "string" ? r.categoryId : null;
    if (!productId || !categoryId) return null;
    if (!getConfiguratorProduct(productId)) return null;

    const addOnQuantities: Record<string, number> = {};
    if (r.addOnQuantities && typeof r.addOnQuantities === "object") {
      for (const [k, v] of Object.entries(
        r.addOnQuantities as Record<string, unknown>,
      )) {
        if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
          addOnQuantities[k] = Math.floor(v);
        }
      }
    }

    const durationSeconds =
      typeof r.durationSeconds === "number" && Number.isFinite(r.durationSeconds)
        ? Math.max(0, Math.floor(r.durationSeconds))
        : undefined;

    const interiorConfig = sanitizeInteriorFloors(r.interiorConfig);
    const tour360Config = sanitizeTour360Config(r.tour360Config);

    let item: QuoteItem = {
      instanceId:
        typeof r.instanceId === "string" && r.instanceId
          ? r.instanceId
          : crypto.randomUUID(),
      productId,
      categoryId,
      addOnQuantities,
      ...(durationSeconds !== undefined ? { durationSeconds } : {}),
      ...(interiorConfig ? { interiorConfig } : {}),
      ...(tour360Config ? { tour360Config } : {}),
    };

    // Best-effort migration for legacy share tokens minted before the
    // per-floor editor existed. No-op when interiorConfig/tour360Config
    // is already present (i.e. tokens minted by the new code path).
    item = migrateLegacyInterior(item);
    item = migrateLegacyTour360(item);

    out.push(item);
  }
  return out;
}

export async function saveQuote(items: unknown): Promise<SaveQuoteResult> {
  const sanitized = sanitizeItems(items);
  if (!sanitized) {
    return { error: "Le devis est vide ou non valide." };
  }

  const session = await auth();
  const expiresAt = new Date(Date.now() + QUOTE_TTL_DAYS * 24 * 60 * 60 * 1000);

  const quote = await prisma.quote.create({
    data: {
      itemsJson: sanitized,
      userId: session?.user?.id ?? null,
      expiresAt,
    },
    select: { id: true },
  });

  return { token: quote.id };
}

export async function loadQuote(token: unknown): Promise<LoadQuoteResult> {
  if (typeof token !== "string" || !token) {
    return { error: "Jeton non valide." };
  }

  const quote = await prisma.quote.findUnique({
    where: { id: token },
    select: { itemsJson: true, expiresAt: true },
  });

  if (!quote) {
    return { error: "Le devis n’existe pas ou a expiré." };
  }
  if (quote.expiresAt < new Date()) {
    return { error: "Ce devis a expiré." };
  }

  const items = sanitizeItems(quote.itemsJson);
  if (!items) {
    return { error: "Le contenu du devis est corrompu." };
  }

  // Stamp openedAt (best-effort; ignore failures)
  void prisma.quote
    .update({ where: { id: token }, data: { openedAt: new Date() } })
    .catch(() => {});

  return { items };
}
