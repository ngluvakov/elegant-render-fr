/**
 * siteplan-config.ts — Per-item config + vocabularies for the sp-first
 * product (3D situacioni prikaz). Single-level config; the angleCount
 * stepper drives `sp-angle` add-on quantity; season/phase variant
 * toggles drive `sp-season` and `sp-phase`.
 */

import type { TimeOfDayId, SeasonId } from "./interior-config";
import { TIME_OF_DAY_IDS, SEASON_IDS } from "./interior-config";

// ─── Vocabularies ──────────────────────────────────────────────────────

export const SP_ANGLE_TYPES = [
  { id: "top-down", label: "Vue de dessus verticale (esprit 2D)" },
  { id: "isometric", label: "Isométrique (45°)" },
  { id: "birds-eye", label: "Vue à vol d’oiseau (aérienne inclinée)" },
] as const;
export type SpAngleTypeId = (typeof SP_ANGLE_TYPES)[number]["id"];
export const SP_ANGLE_TYPE_IDS = SP_ANGLE_TYPES.map(
  (a) => a.id,
) as SpAngleTypeId[];

export const SP_ENV_REPS = [
  { id: "parcel-only", label: "Parcelle seule (sans environs)" },
  { id: "abstract", label: "Environnement abstrait (volumes blancs autour)" },
  { id: "3d", label: "Environnement modélisé en 3D (réaliste)" },
  { id: "photomontage", label: "Intégration dans une photographie de drone" },
] as const;
export type SpEnvRepId = (typeof SP_ENV_REPS)[number]["id"];
export const SP_ENV_REP_IDS = SP_ENV_REPS.map((e) => e.id) as SpEnvRepId[];

export const SP_LANDSCAPE_STYLES = [
  { id: "minimalist", label: "Minimaliste (pelouse et arbres simples uniquement)" },
  { id: "lush", label: "Luxuriant / Boisé" },
  { id: "urban", label: "Urbain (plus de béton / places)" },
  { id: "per-plan", label: "Selon le plan paysager fourni" },
] as const;
export type SpLandscapeStyleId =
  (typeof SP_LANDSCAPE_STYLES)[number]["id"];
export const SP_LANDSCAPE_STYLE_IDS = SP_LANDSCAPE_STYLES.map(
  (l) => l.id,
) as SpLandscapeStyleId[];

// ─── Checkbox groups ──────────────────────────────────────────────────

export const SP_TRAFFIC_OPTIONS = [
  { key: "vehiclesParked", label: "Voitures sur les parkings" },
  { key: "vehiclesMoving", label: "Véhicules en mouvement dans les rues" },
  { key: "pedestrians", label: "Piétons sur les cheminements" },
] as const;
export type SpTraffic = {
  vehiclesParked: boolean;
  vehiclesMoving: boolean;
  pedestrians: boolean;
};

export const SP_AMENITY_OPTIONS = [
  { key: "playgrounds", label: "Aires de jeux pour enfants" },
  { key: "sports", label: "Terrains de sport" },
  { key: "water", label: "Piscines / Plans d’eau" },
  { key: "parks", label: "Parcs / Places" },
] as const;
export type SpAmenities = {
  playgrounds: boolean;
  sports: boolean;
  water: boolean;
  parks: boolean;
};

// ─── Main config ──────────────────────────────────────────────────────

export type SiteplanConfig = {
  projectName: string;
  buildingCount: number;            // min 1; informational, no add-on
  angleCount: number;               // min 1; drives sp-angle (count - 1)
  angleType: SpAngleTypeId;
  description?: string;
  // advanced 2.1 — context & atmosphere
  envRepresentation?: SpEnvRepId;
  timeOfDay?: TimeOfDayId;
  season?: SeasonId;
  // advanced 2.2 — infrastructure & landscape
  traffic: SpTraffic;
  landscapeStyle?: SpLandscapeStyleId;
  amenities: SpAmenities;
  // advanced 2.3 — labels & graphics
  showLabels: boolean;
  highlightBoundary: boolean;
  showCompass: boolean;
  // upsell — drives sp-season: 1
  seasonVariantEnabled: boolean;
  seasonVariantTimeOfDay?: TimeOfDayId;
  seasonVariantSeason?: SeasonId;
  // upsell — drives sp-phase: 1
  phaseVariantEnabled: boolean;
  phaseDescription?: string;
};

export function defaultTraffic(): SpTraffic {
  return { vehiclesParked: false, vehiclesMoving: false, pedestrians: false };
}
export function defaultAmenities(): SpAmenities {
  return { playgrounds: false, sports: false, water: false, parks: false };
}

export function defaultSiteplanConfig(): SiteplanConfig {
  return {
    projectName: "Plan de masse 1",
    buildingCount: 1,
    angleCount: 1,
    angleType: "isometric",
    traffic: defaultTraffic(),
    amenities: defaultAmenities(),
    showLabels: false,
    highlightBoundary: false,
    showCompass: false,
    seasonVariantEnabled: false,
    phaseVariantEnabled: false,
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

export function sanitizeSiteplanConfig(c: SiteplanConfig): SiteplanConfig {
  const angleType =
    pickFromAllowlist<SpAngleTypeId>(c.angleType, SP_ANGLE_TYPE_IDS) ??
    "isometric";
  const seasonVariantEnabled = Boolean(c.seasonVariantEnabled);
  const phaseVariantEnabled = Boolean(c.phaseVariantEnabled);
  const seasonVariantTimeOfDay = pickFromAllowlist<TimeOfDayId>(
    c.seasonVariantTimeOfDay,
    TIME_OF_DAY_IDS,
  );
  const seasonVariantSeason = pickFromAllowlist<SeasonId>(
    c.seasonVariantSeason,
    SEASON_IDS,
  );
  return {
    projectName:
      String(c.projectName ?? "").trim().slice(0, 100) || "Plan de masse 1",
    buildingCount: clampCount(c.buildingCount, 1, 100),
    angleCount: clampCount(c.angleCount, 1, 30),
    angleType,
    ...((d) => (d ? { description: d } : {}))(
      String(c.description ?? "").slice(0, 2000),
    ),
    ...((v) => (v ? { envRepresentation: v } : {}))(
      pickFromAllowlist<SpEnvRepId>(c.envRepresentation, SP_ENV_REP_IDS),
    ),
    ...((v) => (v ? { timeOfDay: v } : {}))(
      pickFromAllowlist<TimeOfDayId>(c.timeOfDay, TIME_OF_DAY_IDS),
    ),
    ...((v) => (v ? { season: v } : {}))(
      pickFromAllowlist<SeasonId>(c.season, SEASON_IDS),
    ),
    traffic: sanitizeBooleans(c.traffic, defaultTraffic()),
    ...((v) => (v ? { landscapeStyle: v } : {}))(
      pickFromAllowlist<SpLandscapeStyleId>(
        c.landscapeStyle,
        SP_LANDSCAPE_STYLE_IDS,
      ),
    ),
    amenities: sanitizeBooleans(c.amenities, defaultAmenities()),
    showLabels: Boolean(c.showLabels),
    highlightBoundary: Boolean(c.highlightBoundary),
    showCompass: Boolean(c.showCompass),
    seasonVariantEnabled,
    ...(seasonVariantEnabled && seasonVariantTimeOfDay
      ? { seasonVariantTimeOfDay }
      : {}),
    ...(seasonVariantEnabled && seasonVariantSeason
      ? { seasonVariantSeason }
      : {}),
    phaseVariantEnabled,
    ...(phaseVariantEnabled
      ? {
          phaseDescription: String(c.phaseDescription ?? "").slice(0, 2000),
        }
      : {}),
  };
}

// ─── Add-on quantities derived from config ────────────────────────────

export function addOnQuantitiesFor(
  config: SiteplanConfig,
): Record<string, number> {
  const q: Record<string, number> = {};
  if (config.angleCount > 1) q["sp-angle"] = config.angleCount - 1;
  if (config.seasonVariantEnabled) q["sp-season"] = 1;
  if (config.phaseVariantEnabled) q["sp-phase"] = 1;
  return q;
}

// ─── Read helper ──────────────────────────────────────────────────────

export function readSiteplanConfig(cj: unknown): SiteplanConfig {
  if (
    cj &&
    typeof cj === "object" &&
    !Array.isArray(cj) &&
    "angleCount" in (cj as Record<string, unknown>) &&
    "buildingCount" in (cj as Record<string, unknown>)
  ) {
    return sanitizeSiteplanConfig(cj as SiteplanConfig);
  }
  return defaultSiteplanConfig();
}
