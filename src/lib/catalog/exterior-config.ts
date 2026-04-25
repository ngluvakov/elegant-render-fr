/**
 * exterior-config.ts — Per-item config + vocabularies for the three
 * exterior products: ext-static, ext-360, ext-aerial. Each has its own
 * shape because the per-room steppers and advanced fields differ
 * (ext-static + ext-360 share most of the structure; ext-aerial uses
 * aerial-specific dropdowns instead).
 *
 * Reuses TIMES_OF_DAY + SEASONS from interior-config.
 */

import type { TimeOfDayId, SeasonId } from "./interior-config";
import { TIME_OF_DAY_IDS, SEASON_IDS } from "./interior-config";
import type { TourAssembly } from "./tour-assembly";
import { defaultTourAssembly, sanitizeTourAssembly } from "./tour-assembly";

// ─── Shared exterior vocabularies ──────────────────────────────────────

export const ARCH_STYLES = [
  { id: "modern", label: "Modern" },
  { id: "contemporary", label: "Contemporary" },
  { id: "traditional", label: "Traditional" },
  { id: "minimalist", label: "Minimalist" },
  { id: "industrial", label: "Industrial" },
  { id: "mediterranean", label: "Mediterranean" },
  { id: "alpine", label: "Alpine" },
] as const;
export type ArchStyleId = (typeof ARCH_STYLES)[number]["id"];
export const ARCH_STYLE_IDS = ARCH_STYLES.map((s) => s.id) as ArchStyleId[];

export const WEATHER = [
  { id: "suncano", label: "Sunčano" },
  { id: "oblacno", label: "Oblačno" },
  { id: "kisa", label: "Kiša" },
  { id: "magla", label: "Magla" },
  { id: "sneg", label: "Sneg" },
] as const;
export type WeatherId = (typeof WEATHER)[number]["id"];
export const WEATHER_IDS = WEATHER.map((w) => w.id) as WeatherId[];

export const ENVIRONMENTS = [
  { id: "urbano", label: "Urbano (grad)" },
  { id: "prigradsko", label: "Prigradsko (naselje)" },
  { id: "priroda", label: "Priroda (šuma / planina)" },
  { id: "obala", label: "Obala (voda)" },
] as const;
export type EnvironmentId = (typeof ENVIRONMENTS)[number]["id"];
export const ENVIRONMENT_IDS = ENVIRONMENTS.map((e) => e.id) as EnvironmentId[];

// ─── Aerial-specific vocabularies ─────────────────────────────────────

export const AERIAL_VIEWS = [
  { id: "ptica", label: "Ptičja perspektiva (visoko)" },
  { id: "polu-aerial", label: "Polu-aerial (srednja visina)" },
  { id: "dron", label: "Dron pogled (nisko)" },
] as const;
export type AerialViewId = (typeof AERIAL_VIEWS)[number]["id"];
export const AERIAL_VIEW_IDS = AERIAL_VIEWS.map((a) => a.id) as AerialViewId[];

export const ENV_REPRESENTATIONS = [
  { id: "3d", label: "3D modelovano okruženje" },
  { id: "fotomontaza", label: "Uklapanje u dron fotografiju" },
  { id: "apstraktno", label: "Apstraktno (bele mase)" },
] as const;
export type EnvRepId = (typeof ENV_REPRESENTATIONS)[number]["id"];
export const ENV_REP_IDS = ENV_REPRESENTATIONS.map((e) => e.id) as EnvRepId[];

// ─── Shared sanitize helpers ──────────────────────────────────────────

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

// ─── ext-static ────────────────────────────────────────────────────────

export type ExtStaticConfig = {
  modelName: string;
  cameraCount: number;            // min 1; quantity for ext-static-cam = count - 1
  styleId?: ArchStyleId;
  description?: string;
  timeOfDay?: TimeOfDayId;
  season?: SeasonId;
  weather?: WeatherId;
  environment?: EnvironmentId;
};

export function defaultExtStaticConfig(): ExtStaticConfig {
  return { modelName: "Objekat 1", cameraCount: 1 };
}

export function sanitizeExtStaticConfig(
  c: ExtStaticConfig,
): ExtStaticConfig {
  return {
    modelName:
      String(c.modelName ?? "").trim().slice(0, 80) || "Objekat 1",
    cameraCount: clampCount(c.cameraCount, 1, 30),
    ...((s) => (s ? { styleId: s } : {}))(
      pickFromAllowlist<ArchStyleId>(c.styleId, ARCH_STYLE_IDS),
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
    ...((v) => (v ? { weather: v } : {}))(
      pickFromAllowlist<WeatherId>(c.weather, WEATHER_IDS),
    ),
    ...((v) => (v ? { environment: v } : {}))(
      pickFromAllowlist<EnvironmentId>(c.environment, ENVIRONMENT_IDS),
    ),
  };
}

export function readExtStaticConfig(cj: unknown): ExtStaticConfig {
  if (
    cj &&
    typeof cj === "object" &&
    !Array.isArray(cj) &&
    "cameraCount" in (cj as Record<string, unknown>)
  ) {
    return sanitizeExtStaticConfig(cj as ExtStaticConfig);
  }
  return defaultExtStaticConfig();
}

// ─── ext-360 ───────────────────────────────────────────────────────────

export type Ext360Config = {
  modelName: string;
  hotspotCount: number;           // min 1; quantity for ext-360-hotspot = count - 1
  styleId?: ArchStyleId;
  description?: string;
  timeOfDay?: TimeOfDayId;
  season?: SeasonId;
  weather?: WeatherId;
  environment?: EnvironmentId;
  tourAssembly: TourAssembly;
};

export function defaultExt360Config(): Ext360Config {
  return {
    modelName: "Objekat 1",
    hotspotCount: 1,
    tourAssembly: defaultTourAssembly(),
  };
}

export function sanitizeExt360Config(c: Ext360Config): Ext360Config {
  return {
    modelName:
      String(c.modelName ?? "").trim().slice(0, 80) || "Objekat 1",
    hotspotCount: clampCount(c.hotspotCount, 1, 30),
    ...((s) => (s ? { styleId: s } : {}))(
      pickFromAllowlist<ArchStyleId>(c.styleId, ARCH_STYLE_IDS),
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
    ...((v) => (v ? { weather: v } : {}))(
      pickFromAllowlist<WeatherId>(c.weather, WEATHER_IDS),
    ),
    ...((v) => (v ? { environment: v } : {}))(
      pickFromAllowlist<EnvironmentId>(c.environment, ENVIRONMENT_IDS),
    ),
    tourAssembly: sanitizeTourAssembly(c.tourAssembly),
  };
}

export function readExt360Config(cj: unknown): Ext360Config {
  if (
    cj &&
    typeof cj === "object" &&
    !Array.isArray(cj) &&
    "hotspotCount" in (cj as Record<string, unknown>)
  ) {
    return sanitizeExt360Config(cj as Ext360Config);
  }
  return defaultExt360Config();
}

// ─── ext-aerial ────────────────────────────────────────────────────────

export type ExtAerialConfig = {
  complexName: string;
  cameraCount: number;            // min 1; quantity for ext-aerial-cam = count - 1
  aerialView: AerialViewId;
  description?: string;
  timeOfDay?: TimeOfDayId;
  season?: SeasonId;
  environmentRepresentation?: EnvRepId;
  showParcelBoundaries: boolean;
};

export function defaultExtAerialConfig(): ExtAerialConfig {
  return {
    complexName: "Kompleks 1",
    cameraCount: 1,
    aerialView: "ptica",
    showParcelBoundaries: false,
  };
}

export function sanitizeExtAerialConfig(
  c: ExtAerialConfig,
): ExtAerialConfig {
  const aerialView =
    pickFromAllowlist<AerialViewId>(c.aerialView, AERIAL_VIEW_IDS) ?? "ptica";
  return {
    complexName:
      String(c.complexName ?? "").trim().slice(0, 80) || "Kompleks 1",
    cameraCount: clampCount(c.cameraCount, 1, 30),
    aerialView,
    ...((d) => (d ? { description: d } : {}))(
      String(c.description ?? "").slice(0, 2000),
    ),
    ...((v) => (v ? { timeOfDay: v } : {}))(
      pickFromAllowlist<TimeOfDayId>(c.timeOfDay, TIME_OF_DAY_IDS),
    ),
    ...((v) => (v ? { season: v } : {}))(
      pickFromAllowlist<SeasonId>(c.season, SEASON_IDS),
    ),
    ...((v) => (v ? { environmentRepresentation: v } : {}))(
      pickFromAllowlist<EnvRepId>(c.environmentRepresentation, ENV_REP_IDS),
    ),
    showParcelBoundaries: Boolean(c.showParcelBoundaries),
  };
}

export function readExtAerialConfig(cj: unknown): ExtAerialConfig {
  if (
    cj &&
    typeof cj === "object" &&
    !Array.isArray(cj) &&
    "aerialView" in (cj as Record<string, unknown>)
  ) {
    return sanitizeExtAerialConfig(cj as ExtAerialConfig);
  }
  return defaultExtAerialConfig();
}

// ─── Add-on quantities derived from each config ────────────────────────

export function extStaticAddOnQuantitiesFor(
  config: ExtStaticConfig,
): Record<string, number> {
  const q: Record<string, number> = {};
  if (config.cameraCount > 1)
    q["ext-static-cam"] = config.cameraCount - 1;
  return q;
}

export function ext360AddOnQuantitiesFor(
  config: Ext360Config,
): Record<string, number> {
  const q: Record<string, number> = {};
  if (config.hotspotCount > 1)
    q["ext-360-hotspot"] = config.hotspotCount - 1;
  return q;
}

export function extAerialAddOnQuantitiesFor(
  config: ExtAerialConfig,
): Record<string, number> {
  const q: Record<string, number> = {};
  if (config.cameraCount > 1)
    q["ext-aerial-cam"] = config.cameraCount - 1;
  return q;
}
