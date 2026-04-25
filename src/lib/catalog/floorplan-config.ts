/**
 * floorplan-config.ts — Per-item config shape + vocabularies for the
 * fp3d-single product (3D osnove prostora). Drives the engine's add-on
 * quantities for `fp3d-second` (2nd level), `fp3d-extra` (3rd+ level),
 * `fp3d-furniture` (furniture overlay), `fp3d-variant` (alt design
 * variant), and `fp3d-duplicate` (identical-layout duplicate).
 *
 * Single-level config (no floors); the `levels` field controls the
 * progressive multi-level pricing via add-on quantities, not a nested
 * data structure.
 */

// ─── Vocabularies ──────────────────────────────────────────────────────

export const FP_DISPLAY_TYPES = [
  { id: "unfurnished", label: "Prazna osnova (samo zidovi i sanitarije)" },
  { id: "furnished", label: "Nameštena osnova" },
  { id: "both", label: "Obe varijante (nameštena + prazna)" },
] as const;
export type FpDisplayTypeId = (typeof FP_DISPLAY_TYPES)[number]["id"];
export const FP_DISPLAY_TYPE_IDS = FP_DISPLAY_TYPES.map(
  (d) => d.id,
) as FpDisplayTypeId[];

export const FP_FURNITURE_STYLES = [
  { id: "modern", label: "Modern" },
  { id: "scandinavian", label: "Scandinavian" },
  { id: "industrial", label: "Industrial" },
  { id: "minimalist", label: "Minimalist" },
  { id: "classic", label: "Classic / Traditional" },
] as const;
export type FpFurnitureStyleId =
  (typeof FP_FURNITURE_STYLES)[number]["id"];
export const FP_FURNITURE_STYLE_IDS = FP_FURNITURE_STYLES.map(
  (s) => s.id,
) as FpFurnitureStyleId[];

export const FP_CAMERA_ANGLES = [
  { id: "top-down", label: "Top-down (ptičja perspektiva)" },
  { id: "izometrija", label: "Izometrija (45°, najbolja dubina)" },
  { id: "perspektiva", label: "Perspektiva (dramatičniji ugao)" },
] as const;
export type FpCameraAngleId = (typeof FP_CAMERA_ANGLES)[number]["id"];
export const FP_CAMERA_ANGLE_IDS = FP_CAMERA_ANGLES.map(
  (c) => c.id,
) as FpCameraAngleId[];

export const FP_WALL_DISPLAYS = [
  { id: "puni", label: "Puni zidovi (presečeni na visini)" },
  { id: "transparentni", label: "Transparentni / Stakleni zidovi" },
] as const;
export type FpWallDisplayId = (typeof FP_WALL_DISPLAYS)[number]["id"];
export const FP_WALL_DISPLAY_IDS = FP_WALL_DISPLAYS.map(
  (w) => w.id,
) as FpWallDisplayId[];

export const FP_BACKGROUNDS = [
  { id: "bela", label: "Bela (čisto, za štampu)" },
  { id: "tamna", label: "Tamna / Crna (luksuzni izgled)" },
  { id: "transparentna", label: "Transparentna (PNG bez pozadine)" },
] as const;
export type FpBackgroundId = (typeof FP_BACKGROUNDS)[number]["id"];
export const FP_BACKGROUND_IDS = FP_BACKGROUNDS.map(
  (b) => b.id,
) as FpBackgroundId[];

// ─── Main config ──────────────────────────────────────────────────────

export type FloorplanConfig = {
  projectName: string;
  levels: number;                 // min 1; drives fp3d-second + fp3d-extra
  displayType: FpDisplayTypeId;   // unfurnished | furnished | both
  furnitureStyleId?: FpFurnitureStyleId;
  description?: string;
  // advanced — viewing
  cameraAngle?: FpCameraAngleId;
  wallDisplay?: FpWallDisplayId;
  backgroundColor?: FpBackgroundId;
  // advanced — labels / technical
  showRoomLabels: boolean;
  showDimensions: boolean;
  showCompass: boolean;
  // upsell
  variantEnabled: boolean;        // drives fp3d-variant: 1
  variantStyleId?: FpFurnitureStyleId;
  duplicateEnabled: boolean;      // drives fp3d-duplicate: 1
};

export function defaultFloorplanConfig(): FloorplanConfig {
  return {
    projectName: "Osnova 1",
    levels: 1,
    displayType: "unfurnished",
    showRoomLabels: false,
    showDimensions: false,
    showCompass: false,
    variantEnabled: false,
    duplicateEnabled: false,
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

export function sanitizeFloorplanConfig(c: FloorplanConfig): FloorplanConfig {
  const displayType =
    pickFromAllowlist<FpDisplayTypeId>(c.displayType, FP_DISPLAY_TYPE_IDS) ??
    "unfurnished";
  const isFurnished = displayType === "furnished" || displayType === "both";
  const furnitureStyleId = pickFromAllowlist<FpFurnitureStyleId>(
    c.furnitureStyleId,
    FP_FURNITURE_STYLE_IDS,
  );
  const variantEnabled = Boolean(c.variantEnabled);
  const variantStyleId = pickFromAllowlist<FpFurnitureStyleId>(
    c.variantStyleId,
    FP_FURNITURE_STYLE_IDS,
  );
  return {
    projectName:
      String(c.projectName ?? "").trim().slice(0, 100) || "Osnova 1",
    levels: clampCount(c.levels, 1, 30),
    displayType,
    ...(isFurnished && furnitureStyleId
      ? { furnitureStyleId }
      : {}),
    ...((d) => (d ? { description: d } : {}))(
      String(c.description ?? "").slice(0, 2000),
    ),
    ...((v) => (v ? { cameraAngle: v } : {}))(
      pickFromAllowlist<FpCameraAngleId>(c.cameraAngle, FP_CAMERA_ANGLE_IDS),
    ),
    ...((v) => (v ? { wallDisplay: v } : {}))(
      pickFromAllowlist<FpWallDisplayId>(c.wallDisplay, FP_WALL_DISPLAY_IDS),
    ),
    ...((v) => (v ? { backgroundColor: v } : {}))(
      pickFromAllowlist<FpBackgroundId>(
        c.backgroundColor,
        FP_BACKGROUND_IDS,
      ),
    ),
    showRoomLabels: Boolean(c.showRoomLabels),
    showDimensions: Boolean(c.showDimensions),
    showCompass: Boolean(c.showCompass),
    variantEnabled,
    ...(variantEnabled && variantStyleId
      ? { variantStyleId }
      : {}),
    duplicateEnabled: Boolean(c.duplicateEnabled),
  };
}

// ─── Add-on quantities derived from config ────────────────────────────

export function addOnQuantitiesFor(
  config: FloorplanConfig,
): Record<string, number> {
  const q: Record<string, number> = {};
  if (config.levels >= 2) q["fp3d-second"] = 1;
  if (config.levels >= 3) q["fp3d-extra"] = config.levels - 2;
  if (config.displayType === "furnished" || config.displayType === "both") {
    q["fp3d-furniture"] = 1;
  }
  if (config.variantEnabled) q["fp3d-variant"] = 1;
  if (config.duplicateEnabled) q["fp3d-duplicate"] = 1;
  return q;
}

// ─── Read helper ──────────────────────────────────────────────────────

export function readFloorplanConfig(cj: unknown): FloorplanConfig {
  if (
    cj &&
    typeof cj === "object" &&
    !Array.isArray(cj) &&
    "levels" in (cj as Record<string, unknown>)
  ) {
    return sanitizeFloorplanConfig(cj as FloorplanConfig);
  }
  return defaultFloorplanConfig();
}
