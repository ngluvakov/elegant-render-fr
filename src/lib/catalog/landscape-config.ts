/**
 * landscape-config.ts — Per-item config shape + vocabularies for the
 * land-static product (Pejzažni render). Single-level config (no
 * floors). Drives the engine's add-on quantities for `land-cam` (extra
 * cameras over 1) and `land-aerial` (binary upsell, 44.536 RSD).
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
  { id: "mediterranean", label: "Mediteranski" },
  { id: "english-garden", label: "Engleski vrt" },
  { id: "wild", label: "Prirodni / Divlji (Wild)" },
  { id: "tropical", label: "Tropski" },
  { id: "japanese-garden", label: "Japanski vrt" },
  { id: "traditional", label: "Tradicionalni" },
] as const;
export type LandscapeStyleId = (typeof LANDSCAPE_STYLES)[number]["id"];
export const LANDSCAPE_STYLE_IDS = LANDSCAPE_STYLES.map(
  (s) => s.id,
) as LandscapeStyleId[];

export const VEGETATION_AGES = [
  { id: "newly-planted", label: "Tek posađeno (mlade sadnice)" },
  { id: "medium-growth", label: "Srednji rast (1–3 godine)" },
  { id: "mature", label: "Zrelo (potpuno izraslo)" },
] as const;
export type VegetationAgeId = (typeof VEGETATION_AGES)[number]["id"];
export const VEGETATION_AGE_IDS = VEGETATION_AGES.map(
  (v) => v.id,
) as VegetationAgeId[];

export const TOPOGRAPHIES = [
  { id: "flat", label: "Ravan teren" },
  { id: "gentle-slope", label: "Blagi nagib" },
  { id: "steep-slope", label: "Strmi nagib / Kaskade" },
  { id: "terraced", label: "Terasast teren sa potpornim zidovima" },
] as const;
export type TopographyId = (typeof TOPOGRAPHIES)[number]["id"];
export const TOPOGRAPHY_IDS = TOPOGRAPHIES.map(
  (t) => t.id,
) as TopographyId[];

export const PATH_MATERIALS = [
  { id: "stamped-concrete", label: "Štampani beton" },
  { id: "pavers", label: "Behaton / Popločanje" },
  { id: "natural-stone", label: "Prirodni kamen" },
  { id: "wood-decking", label: "Drveni deking" },
  { id: "gravel", label: "Šljunak / Rizla" },
  { id: "combined", label: "Kombinovano" },
] as const;
export type PathMaterialId = (typeof PATH_MATERIALS)[number]["id"];
export const PATH_MATERIAL_IDS = PATH_MATERIALS.map(
  (p) => p.id,
) as PathMaterialId[];

export const FENCES = [
  { id: "masonry", label: "Zidana ograda" },
  { id: "wire-panel", label: "Žičana / Panelna" },
  { id: "wooden", label: "Drvena ograda" },
  { id: "hedge", label: "Živa ograda" },
  { id: "no-fence", label: "Bez ograde (otvoreno)" },
] as const;
export type FenceId = (typeof FENCES)[number]["id"];
export const FENCE_IDS = FENCES.map((f) => f.id) as FenceId[];

export const AERIAL_ENV_REPS = [
  { id: "3d", label: "3D modelovano okruženje" },
  { id: "photomontage", label: "Uklapanje u dron fotografiju" },
  { id: "abstract", label: "Apstraktno okruženje" },
] as const;
export type AerialEnvRepId = (typeof AERIAL_ENV_REPS)[number]["id"];
export const AERIAL_ENV_REP_IDS = AERIAL_ENV_REPS.map(
  (a) => a.id,
) as AerialEnvRepId[];

// ─── Checkbox groups ──────────────────────────────────────────────────

export const WATER_FEATURE_OPTIONS = [
  { key: "pool", label: "Bazen" },
  { key: "pond", label: "Dekorativno jezerce" },
  { key: "fountain", label: "Fontana / Česma" },
  { key: "stream", label: "Potok" },
] as const;
export type WaterFeatures = {
  pool: boolean;
  pond: boolean;
  fountain: boolean;
  stream: boolean;
};

export const STRUCTURE_OPTIONS = [
  { key: "pergola", label: "Letnjikovac / Pergola" },
  { key: "summerKitchen", label: "Letnja kuhinja / Roštilj" },
  { key: "firePit", label: "Ognjište (Fire pit)" },
  { key: "playground", label: "Dečije igralište" },
] as const;
export type Structures = {
  pergola: boolean;
  summerKitchen: boolean;
  firePit: boolean;
  playground: boolean;
};

export const EXTERIOR_LIGHTING_OPTIONS = [
  { key: "ground", label: "Podna / Ugradna rasveta" },
  { key: "wall", label: "Zidne lampe" },
  { key: "spotlights", label: "Reflektori za drveće" },
  { key: "ambient", label: "Ambijentalne (visilice / stubići)" },
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
    projectName: "Pejzaž 1",
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
      String(c.projectName ?? "").trim().slice(0, 100) || "Pejzaž 1",
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
