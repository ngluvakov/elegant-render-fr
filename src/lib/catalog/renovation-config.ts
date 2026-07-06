/**
 * renovation-config.ts — Per-item config + vocabularies for the
 * reno-image product (virtuelna renovacija). Drives the engine's
 * add-on quantities for `reno-angle` (extra angles, with a volume
 * rule from the 4th onward) and `reno-room` (approximates the spec's
 * "varijanta dizajna" until the catalog gains an explicit restyle
 * add-on).
 */

// ─── Vocabularies ──────────────────────────────────────────────────────

export const RENO_ROOM_TYPES = [
  { id: "bathroom", label: "Bathroom" },
  { id: "kitchen", label: "Kitchen" },
  { id: "living-room", label: "Living room" },
  { id: "bedroom", label: "Bedroom" },
  { id: "facade", label: "Exterior / Facade" },
  { id: "commercial", label: "Commercial space" },
] as const;
export type RenoRoomTypeId = (typeof RENO_ROOM_TYPES)[number]["id"];
export const RENO_ROOM_TYPE_IDS = RENO_ROOM_TYPES.map(
  (r) => r.id,
) as RenoRoomTypeId[];

export const RENO_SCOPES = [
  { id: "cosmetic", label: "Cosmetic (paint and furniture only)" },
  { id: "partial", label: "Partial (floor / tile replacement)" },
  {
    id: "complete",
    label: "Complete (wall demolition, new installations)",
  },
] as const;
export type RenoScopeId = (typeof RENO_SCOPES)[number]["id"];
export const RENO_SCOPE_IDS = RENO_SCOPES.map((s) => s.id) as RenoScopeId[];

export const RENO_FLOOR_MATERIALS = [
  { id: "keep-existing", label: "Keep existing" },
  { id: "parquet-light", label: "Parquet / Laminate (light wood)" },
  { id: "parquet-dark", label: "Parquet / Laminate (dark wood)" },
  { id: "tiles-marble", label: "Tiles (marble / stone)" },
  { id: "tiles-concrete", label: "Tiles (concrete / industrial)" },
  { id: "carpet", label: "Carpet" },
] as const;
export type RenoFloorMaterialId =
  (typeof RENO_FLOOR_MATERIALS)[number]["id"];
export const RENO_FLOOR_MATERIAL_IDS = RENO_FLOOR_MATERIALS.map(
  (m) => m.id,
) as RenoFloorMaterialId[];

export const RENO_WALL_MATERIALS = [
  { id: "keep-existing", label: "Keep existing" },
  { id: "paint-white", label: "Paint (white / neutral)" },
  { id: "paint-dark", label: "Paint (dark / accent)" },
  { id: "wallpaper", label: "Wallpaper" },
  { id: "wood-paneling", label: "Wood paneling" },
  { id: "stone-brick", label: "Decorative stone / brick" },
] as const;
export type RenoWallMaterialId =
  (typeof RENO_WALL_MATERIALS)[number]["id"];
export const RENO_WALL_MATERIAL_IDS = RENO_WALL_MATERIALS.map(
  (m) => m.id,
) as RenoWallMaterialId[];

export const RENO_FURNITURE_STYLES = [
  { id: "modern", label: "Modern / Contemporary" },
  { id: "scandinavian", label: "Scandinavian" },
  { id: "minimalist", label: "Minimalist" },
  { id: "industrial", label: "Industrial" },
  { id: "classic", label: "Classic / Traditional" },
  { id: "keep-existing", label: "Keep existing furniture" },
] as const;
export type RenoFurnitureStyleId =
  (typeof RENO_FURNITURE_STYLES)[number]["id"];
export const RENO_FURNITURE_STYLE_IDS = RENO_FURNITURE_STYLES.map(
  (s) => s.id,
) as RenoFurnitureStyleId[];

// ─── Main config ──────────────────────────────────────────────────────

export type RenovationConfig = {
  roomName: string;
  roomType: RenoRoomTypeId;
  scope: RenoScopeId;
  description?: string;
  // advanced 2.1 — structural changes
  wallChangesEnabled: boolean;
  wallChangesDescription?: string;
  windowDoorChanges: boolean;
  // advanced 2.2 — materials
  floorMaterial?: RenoFloorMaterialId;
  wallMaterial?: RenoWallMaterialId;
  // advanced 2.3 — furniture & retention
  furnitureStyle?: RenoFurnitureStyleId;
  itemsToKeep?: string;
  // upsell — drives reno-angle (count - 0)
  extraAnglesCount: number;
  // upsell — drives reno-room (approximates restyle until catalog has
  // a dedicated restyle add-on for renovation)
  variantEnabled: boolean;
  variantDescription?: string;
};

export function defaultRenovationConfig(): RenovationConfig {
  return {
    roomName: "Bathroom 1",
    roomType: "bathroom",
    scope: "complete",
    wallChangesEnabled: false,
    windowDoorChanges: false,
    extraAnglesCount: 0,
    variantEnabled: false,
  };
}

// ─── Sanitizers ───────────────────────────────────────────────────────

function clampCount(n: unknown, min: number, max: number): number {
  const parsed = Number(n);
  if (!Number.isFinite(parsed)) return min;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function pickFromAllowlist<T extends string>(
  value: unknown,
  allowlist: readonly string[],
): T | undefined {
  return typeof value === "string" && allowlist.includes(value)
    ? (value as T)
    : undefined;
}

export function sanitizeRenovationConfig(
  c: RenovationConfig,
): RenovationConfig {
  const roomType =
    pickFromAllowlist<RenoRoomTypeId>(c.roomType, RENO_ROOM_TYPE_IDS) ??
    "bathroom";
  const scope =
    pickFromAllowlist<RenoScopeId>(c.scope, RENO_SCOPE_IDS) ?? "complete";
  const wallChangesEnabled = Boolean(c.wallChangesEnabled);
  const variantEnabled = Boolean(c.variantEnabled);
  return {
    roomName:
      String(c.roomName ?? "").trim().slice(0, 100) || "Bathroom 1",
    roomType,
    scope,
    ...((d) => (d ? { description: d } : {}))(
      String(c.description ?? "").slice(0, 2000),
    ),
    wallChangesEnabled,
    ...(wallChangesEnabled && c.wallChangesDescription
      ? {
          wallChangesDescription: String(c.wallChangesDescription).slice(
            0,
            2000,
          ),
        }
      : {}),
    windowDoorChanges: Boolean(c.windowDoorChanges),
    ...((v) => (v ? { floorMaterial: v } : {}))(
      pickFromAllowlist<RenoFloorMaterialId>(
        c.floorMaterial,
        RENO_FLOOR_MATERIAL_IDS,
      ),
    ),
    ...((v) => (v ? { wallMaterial: v } : {}))(
      pickFromAllowlist<RenoWallMaterialId>(
        c.wallMaterial,
        RENO_WALL_MATERIAL_IDS,
      ),
    ),
    ...((v) => (v ? { furnitureStyle: v } : {}))(
      pickFromAllowlist<RenoFurnitureStyleId>(
        c.furnitureStyle,
        RENO_FURNITURE_STYLE_IDS,
      ),
    ),
    ...((s) => (s ? { itemsToKeep: s } : {}))(
      String(c.itemsToKeep ?? "").slice(0, 2000),
    ),
    extraAnglesCount: clampCount(c.extraAnglesCount, 0, 30),
    variantEnabled,
    ...(variantEnabled && c.variantDescription
      ? { variantDescription: String(c.variantDescription).slice(0, 2000) }
      : {}),
  };
}

// ─── Add-on quantities derived from config ────────────────────────────

export function addOnQuantitiesFor(
  config: RenovationConfig,
): Record<string, number> {
  const q: Record<string, number> = {};
  if (config.extraAnglesCount > 0) q["reno-angle"] = config.extraAnglesCount;
  if (config.variantEnabled) q["reno-room"] = 1;
  return q;
}

// ─── Read helper ──────────────────────────────────────────────────────

export function readRenovationConfig(cj: unknown): RenovationConfig {
  if (
    cj &&
    typeof cj === "object" &&
    !Array.isArray(cj) &&
    "roomType" in (cj as Record<string, unknown>) &&
    "scope" in (cj as Record<string, unknown>)
  ) {
    return sanitizeRenovationConfig(cj as RenovationConfig);
  }
  return defaultRenovationConfig();
}
