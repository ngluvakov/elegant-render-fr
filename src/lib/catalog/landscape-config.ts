/**
 * landscape-config.ts — Per-item config shape + vocabularies for the
 * land-static product (landscape render). Single-level config (no
 * floors). Drives the engine's add-on quantities for `land-cam` (extra
 * cameras over 1) and `land-aerial` (binary upsell, €380).
 *
 * Reuses TIMES_OF_DAY + SEASONS from interior-config; defines
 * landscape-specific vocabularies (style, vegetation age, topography,
 * path materials, fences, aerial environment representation) plus three
 * boolean checkbox groups for water features, structures, and
 * exterior lighting.
 */

import type { TimeOfDayId, SeasonId } from "./interior-config";
import { TIME_OF_DAY_IDS, SEASON_IDS } from "./interior-config";

// ─── Vocabularies ──────────────────────────────────────────────────────

export const LANDSCAPE_STYLES = [
  { id: "modern-minimalist", label: "Modern / Minimalist" },
  { id: "mediterranean", label: "Mediterranean" },
  { id: "english-garden", label: "English garden" },
  { id: "wild", label: "Natural / Wild" },
  { id: "tropical", label: "Tropical" },
  { id: "japanese-garden", label: "Japanese garden" },
  { id: "traditional", label: "Traditional" },
] as const;
export type LandscapeStyleId = (typeof LANDSCAPE_STYLES)[number]["id"];
export const LANDSCAPE_STYLE_IDS = LANDSCAPE_STYLES.map(
  (s) => s.id,
) as LandscapeStyleId[];

export const VEGETATION_AGES = [
  { id: "newly-planted", label: "Newly planted (young saplings)" },
  { id: "medium-growth", label: "Medium growth (1-3 years)" },
  { id: "mature", label: "Mature (fully grown)" },
] as const;
export type VegetationAgeId = (typeof VEGETATION_AGES)[number]["id"];
export const VEGETATION_AGE_IDS = VEGETATION_AGES.map(
  (v) => v.id,
) as VegetationAgeId[];

export const TOPOGRAPHIES = [
  { id: "flat", label: "Flat terrain" },
  { id: "gentle-slope", label: "Gentle slope" },
  { id: "steep-slope", label: "Steep slope / Cascades" },
  { id: "terraced", label: "Terraced terrain with retaining walls" },
] as const;
export type TopographyId = (typeof TOPOGRAPHIES)[number]["id"];
export const TOPOGRAPHY_IDS = TOPOGRAPHIES.map(
  (t) => t.id,
) as TopographyId[];

export const PATH_MATERIALS = [
  { id: "stamped-concrete", label: "Stamped concrete" },
  { id: "pavers", label: "Pavers / Paving" },
  { id: "natural-stone", label: "Natural stone" },
  { id: "wood-decking", label: "Wood decking" },
  { id: "gravel", label: "Gravel" },
  { id: "combined", label: "Combined" },
] as const;
export type PathMaterialId = (typeof PATH_MATERIALS)[number]["id"];
export const PATH_MATERIAL_IDS = PATH_MATERIALS.map(
  (p) => p.id,
) as PathMaterialId[];

export const FENCES = [
  { id: "masonry", label: "Masonry fence" },
  { id: "wire-panel", label: "Wire / Panel fence" },
  { id: "wooden", label: "Wooden fence" },
  { id: "hedge", label: "Hedge" },
  { id: "no-fence", label: "No fence (open)" },
] as const;
export type FenceId = (typeof FENCES)[number]["id"];
export const FENCE_IDS = FENCES.map((f) => f.id) as FenceId[];

export const AERIAL_ENV_REPS = [
  { id: "3d", label: "3D modeled surroundings" },
  { id: "photomontage", label: "Integration into a drone photograph" },
  { id: "abstract", label: "Abstract surroundings" },
] as const;
export type AerialEnvRepId = (typeof AERIAL_ENV_REPS)[number]["id"];
export const AERIAL_ENV_REP_IDS = AERIAL_ENV_REPS.map(
  (a) => a.id,
) as AerialEnvRepId[];

// ─── Checkbox groups ──────────────────────────────────────────────────

export const WATER_FEATURE_OPTIONS = [
  { key: "pool", label: "Pool" },
  { key: "pond", label: "Decorative pond" },
  { key: "fountain", label: "Fountain" },
  { key: "stream", label: "Stream" },
] as const;
export type WaterFeatures = {
  pool: boolean;
  pond: boolean;
  fountain: boolean;
  stream: boolean;
};

export const STRUCTURE_OPTIONS = [
  { key: "pergola", label: "Gazebo / Pergola" },
  { key: "summerKitchen", label: "Outdoor kitchen / Barbecue" },
  { key: "firePit", label: "Fire pit" },
  { key: "playground", label: "Children's playground" },
] as const;
export type Structures = {
  pergola: boolean;
  summerKitchen: boolean;
  firePit: boolean;
  playground: boolean;
};

export const EXTERIOR_LIGHTING_OPTIONS = [
  { key: "ground", label: "Ground / Recessed lighting" },
  { key: "wall", label: "Wall lamps" },
  { key: "spotlights", label: "Tree spotlights" },
  { key: "ambient", label: "Ambient (string lights / bollards)" },
] as const;
export type ExteriorLighting = {
  ground: boolean;
  wall: boolean;
  spotlights: boolean;
  ambient: boolean;
};

// ─── Main config ──────────────────────────────────────────────────────

export type LandscapeConfig = {
  projectName: string;
  cameraCount: number;            // min 1; quantity for land-cam = count - 1
  styleId?: LandscapeStyleId;
  description?: string;
  // advanced — atmosphere
  timeOfDay?: TimeOfDayId;
  season?: SeasonId;
  vegetationAge?: VegetationAgeId;
  // advanced — terrain
  topography?: TopographyId;
  pathMaterial?: PathMaterialId;
  fence?: FenceId;
  // advanced — optional elements (boolean groups)
  waterFeatures: WaterFeatures;
  structures: Structures;
  exteriorLighting: ExteriorLighting;
  // aerial upsell — drives land-aerial add-on quantity (0 or 1)
  aerialEnabled: boolean;
  aerialEnvRepresentation?: AerialEnvRepId;
};

export function defaultWaterFeatures(): WaterFeatures {
  return { pool: false, pond: false, fountain: false, stream: false };
}
export function defaultStructures(): Structures {
  return { pergola: false, summerKitchen: false, firePit: false, playground: false };
}
export function defaultExteriorLighting(): ExteriorLighting {
  return { ground: false, wall: false, spotlights: false, ambient: false };
}

export function defaultLandscapeConfig(): LandscapeConfig {
  return {
    projectName: "Landscape 1",
    cameraCount: 1,
    waterFeatures: defaultWaterFeatures(),
    structures: defaultStructures(),
    exteriorLighting: defaultExteriorLighting(),
    aerialEnabled: false,
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

function sanitizeBooleans<T extends Record<string, boolean>>(
  raw: unknown,
  fallback: T,
): T {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fallback;
  const obj = raw as Record<string, unknown>;
  const out: Record<string, boolean> = {};
  for (const k of Object.keys(fallback)) {
    out[k] = Boolean(obj[k]);
  }
  return out as T;
}

export function sanitizeLandscapeConfig(c: LandscapeConfig): LandscapeConfig {
  return {
    projectName:
      String(c.projectName ?? "").trim().slice(0, 100) || "Landscape 1",
    cameraCount: clampCount(c.cameraCount, 1, 30),
    ...((s) => (s ? { styleId: s } : {}))(
      pickFromAllowlist<LandscapeStyleId>(c.styleId, LANDSCAPE_STYLE_IDS),
    ),
    ...((d) => (d ? { description: d } : {}))(
      String(c.description ?? "").slice(0, 2000),
    ),
    ...((v) => (v ? { timeOfDay: v } : {}))(
      pickFromAllowlist<TimeOfDayId>(c.timeOfDay, TIME_OF_DAY_IDS),
    ),
    ...((v) => (v ? { season: v } : {}))(
      pickFromAllowlist<SeasonId>(c.season, SEASON_IDS),
    ),
    ...((v) => (v ? { vegetationAge: v } : {}))(
      pickFromAllowlist<VegetationAgeId>(c.vegetationAge, VEGETATION_AGE_IDS),
    ),
    ...((v) => (v ? { topography: v } : {}))(
      pickFromAllowlist<TopographyId>(c.topography, TOPOGRAPHY_IDS),
    ),
    ...((v) => (v ? { pathMaterial: v } : {}))(
      pickFromAllowlist<PathMaterialId>(c.pathMaterial, PATH_MATERIAL_IDS),
    ),
    ...((v) => (v ? { fence: v } : {}))(
      pickFromAllowlist<FenceId>(c.fence, FENCE_IDS),
    ),
    waterFeatures: sanitizeBooleans(c.waterFeatures, defaultWaterFeatures()),
    structures: sanitizeBooleans(c.structures, defaultStructures()),
    exteriorLighting: sanitizeBooleans(
      c.exteriorLighting,
      defaultExteriorLighting(),
    ),
    aerialEnabled: Boolean(c.aerialEnabled),
    ...((v) =>
      v && c.aerialEnabled ? { aerialEnvRepresentation: v } : {})(
      pickFromAllowlist<AerialEnvRepId>(
        c.aerialEnvRepresentation,
        AERIAL_ENV_REP_IDS,
      ),
    ),
  };
}

// ─── Type guard / read helper ────────────────────────────────────────

export function readLandscapeConfig(cj: unknown): LandscapeConfig {
  if (
    cj &&
    typeof cj === "object" &&
    !Array.isArray(cj) &&
    "cameraCount" in (cj as Record<string, unknown>)
  ) {
    return sanitizeLandscapeConfig(cj as LandscapeConfig);
  }
  return defaultLandscapeConfig();
}
