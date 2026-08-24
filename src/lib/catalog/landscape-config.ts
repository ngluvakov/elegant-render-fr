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
  { id: "modern-minimalist", label: "Moderne / Minimaliste" },
  { id: "mediterranean", label: "Méditerranéen" },
  { id: "english-garden", label: "Jardin à l’anglaise" },
  { id: "wild", label: "Naturel / Sauvage" },
  { id: "tropical", label: "Tropical" },
  { id: "japanese-garden", label: "Jardin japonais" },
  { id: "traditional", label: "Traditionnel" },
] as const;
export type LandscapeStyleId = (typeof LANDSCAPE_STYLES)[number]["id"];
export const LANDSCAPE_STYLE_IDS = LANDSCAPE_STYLES.map(
  (s) => s.id,
) as LandscapeStyleId[];

export const VEGETATION_AGES = [
  { id: "newly-planted", label: "Plantation récente (jeunes plants)" },
  { id: "medium-growth", label: "Croissance moyenne (1-3 ans)" },
  { id: "mature", label: "Mature (pleine croissance)" },
] as const;
export type VegetationAgeId = (typeof VEGETATION_AGES)[number]["id"];
export const VEGETATION_AGE_IDS = VEGETATION_AGES.map(
  (v) => v.id,
) as VegetationAgeId[];

export const TOPOGRAPHIES = [
  { id: "flat", label: "Terrain plat" },
  { id: "gentle-slope", label: "Pente douce" },
  { id: "steep-slope", label: "Pente raide / Cascades" },
  { id: "terraced", label: "Terrain en terrasses avec murs de soutènement" },
] as const;
export type TopographyId = (typeof TOPOGRAPHIES)[number]["id"];
export const TOPOGRAPHY_IDS = TOPOGRAPHIES.map(
  (t) => t.id,
) as TopographyId[];

export const PATH_MATERIALS = [
  { id: "stamped-concrete", label: "Béton imprimé" },
  { id: "pavers", label: "Pavés / Dallage" },
  { id: "natural-stone", label: "Pierre naturelle" },
  { id: "wood-decking", label: "Terrasse en bois" },
  { id: "gravel", label: "Gravier" },
  { id: "combined", label: "Combiné" },
] as const;
export type PathMaterialId = (typeof PATH_MATERIALS)[number]["id"];
export const PATH_MATERIAL_IDS = PATH_MATERIALS.map(
  (p) => p.id,
) as PathMaterialId[];

export const FENCES = [
  { id: "masonry", label: "Clôture maçonnée" },
  { id: "wire-panel", label: "Clôture grillagée / à panneaux" },
  { id: "wooden", label: "Clôture en bois" },
  { id: "hedge", label: "Haie" },
  { id: "no-fence", label: "Sans clôture (ouvert)" },
] as const;
export type FenceId = (typeof FENCES)[number]["id"];
export const FENCE_IDS = FENCES.map((f) => f.id) as FenceId[];

export const AERIAL_ENV_REPS = [
  { id: "3d", label: "Environnement modélisé en 3D" },
  { id: "photomontage", label: "Intégration dans une photographie de drone" },
  { id: "abstract", label: "Environnement abstrait" },
] as const;
export type AerialEnvRepId = (typeof AERIAL_ENV_REPS)[number]["id"];
export const AERIAL_ENV_REP_IDS = AERIAL_ENV_REPS.map(
  (a) => a.id,
) as AerialEnvRepId[];

// ─── Checkbox groups ──────────────────────────────────────────────────

export const WATER_FEATURE_OPTIONS = [
  { key: "pool", label: "Piscine" },
  { key: "pond", label: "Bassin décoratif" },
  { key: "fountain", label: "Fontaine" },
  { key: "stream", label: "Ruisseau" },
] as const;
export type WaterFeatures = {
  pool: boolean;
  pond: boolean;
  fountain: boolean;
  stream: boolean;
};

export const STRUCTURE_OPTIONS = [
  { key: "pergola", label: "Kiosque / Pergola" },
  { key: "summerKitchen", label: "Cuisine d’été / Barbecue" },
  { key: "firePit", label: "Foyer extérieur" },
  { key: "playground", label: "Aire de jeux pour enfants" },
] as const;
export type Structures = {
  pergola: boolean;
  summerKitchen: boolean;
  firePit: boolean;
  playground: boolean;
};

export const EXTERIOR_LIGHTING_OPTIONS = [
  { key: "ground", label: "Éclairage au sol / encastré" },
  { key: "wall", label: "Appliques murales" },
  { key: "spotlights", label: "Projecteurs pour arbres" },
  { key: "ambient", label: "Ambiance (guirlandes lumineuses / bornes)" },
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
    projectName: "Paysage 1",
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
      String(c.projectName ?? "").trim().slice(0, 100) || "Paysage 1",
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
