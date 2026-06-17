/**
 * animation-config.ts — Per-item config + vocabularies for the
 * consolidated `anim` product. Source mode (scratch / existing /
 * active) is stored on QuoteItem.sourceMode AND on configJson, and
 * drives:
 *   - which add-ons are available (path always; daynight not on
 *     active; season only on scratch)
 *   - per-second pricing (1.758 RSD / 1.172 RSD / 938 RSD) — resolved by
 *     getEffectiveProduct(productId, sourceMode) in the catalog
 *   - cross-product creates/consumes (resolved the same way)
 *
 * The configurator UI exposes a 3-way mode picker that writes
 * `sourceMode` into configJson; calculate.ts reads it from QuoteItem.
 */

import type { ConsumeRule, ModelAsset } from "./configurator";
import {
  ANIMATION_DURATION_TIERS,
} from "./configurator";

void ANIMATION_DURATION_TIERS;
void ({} as ConsumeRule);
void ({} as ModelAsset);

export const ANIM_PRODUCT_ID = "anim" as const;

export type AnimSourceMode = "scratch" | "existing" | "active";

export const ANIM_SOURCE_MODES: ReadonlyArray<{
  id: AnimSourceMode;
  label: string;
  shortLabel: string;
  perSecondRsd: number;
  description: string;
}> = [
  {
    id: "scratch",
    label: "Animacija (od nule)",
    shortLabel: "Od nule",
    perSecondRsd: 15,
    description: "Pravimo 3D model i animaciju — kreće od skica/foto-referenci.",
  },
  {
    id: "existing",
    label: "Animacija (postojeći model)",
    shortLabel: "Postojeći model",
    perSecondRsd: 10,
    description: "Već imate 3D model — mi pravimo animaciju iz njega.",
  },
  {
    id: "active",
    label: "Animacija (aktivan projekat)",
    shortLabel: "Aktivan projekat",
    perSecondRsd: 8,
    description: "Imate aktivan render projekat kod nas — koristimo isti model.",
  },
];

const ANIM_SOURCE_MODE_IDS = ANIM_SOURCE_MODES.map(
  (m) => m.id,
) as AnimSourceMode[];

export const ANIM_DURATION_MIN = 15;
export const ANIM_DURATION_MAX = 300;
export const ANIM_DURATION_STEP = 5;

export function animSourceModeLabel(mode: AnimSourceMode): string {
  return ANIM_SOURCE_MODES.find((m) => m.id === mode)?.label ?? mode;
}

export function animPerSecondRsd(mode: AnimSourceMode): number {
  return ANIM_SOURCE_MODES.find((m) => m.id === mode)?.perSecondRsd ?? 15;
}

export function animSupportsDayNight(mode: AnimSourceMode): boolean {
  return mode !== "active";
}

export function animSupportsSeason(mode: AnimSourceMode): boolean {
  return mode === "scratch";
}

// Tier discount (matches ANIMATION_DURATION_TIERS in configurator.ts):
// 15-30 = 0%, 31-60 = -10%, 61-120 = -20%, 121+ = -25%
export function animTierDiscountPct(seconds: number): number {
  if (seconds >= 121) return 25;
  if (seconds >= 61) return 20;
  if (seconds >= 31) return 10;
  return 0;
}

// ─── Vocabularies ──────────────────────────────────────────────────────

export const ANIM_TYPES = [
  { id: "eksterijer", label: "Eksterijer (Flythrough)" },
  { id: "enterijer", label: "Enterijer (Walkthrough)" },
  { id: "kombinovano", label: "Kombinovano (Eksterijer + Enterijer)" },
] as const;
export type AnimTypeId = (typeof ANIM_TYPES)[number]["id"];
export const ANIM_TYPE_IDS = ANIM_TYPES.map((t) => t.id) as AnimTypeId[];

export const ANIM_TIMES_OF_DAY = [
  { id: "dnevno", label: "Dnevno svetlo (sunčano)" },
  { id: "zlatni-sat", label: "Zlatni sat (zalazak)" },
  { id: "sumrak-noc", label: "Sumrak / Noć (upaljena svetla)" },
  { id: "oblacno", label: "Oblačno / Moody" },
] as const;
export type AnimTimeOfDayId = (typeof ANIM_TIMES_OF_DAY)[number]["id"];
export const ANIM_TIME_OF_DAY_IDS = ANIM_TIMES_OF_DAY.map(
  (t) => t.id,
) as AnimTimeOfDayId[];

export const ANIM_SEASONS = [
  { id: "leto-prolece", label: "Leto / Proleće (zeleno)" },
  { id: "jesen", label: "Jesen (žuto lišće)" },
  { id: "zima", label: "Zima (sneg)" },
] as const;
export type AnimSeasonId = (typeof ANIM_SEASONS)[number]["id"];
export const ANIM_SEASON_IDS = ANIM_SEASONS.map((s) => s.id) as AnimSeasonId[];

export const ANIM_CAMERA_SPEEDS = [
  { id: "spora", label: "Spora / cinematska (fokus na detalje)" },
  { id: "srednja", label: "Srednja (standardni walkthrough)" },
  { id: "brza", label: "Brza / dinamična (pregled celog prostora)" },
] as const;
export type AnimCameraSpeedId =
  (typeof ANIM_CAMERA_SPEEDS)[number]["id"];
export const ANIM_CAMERA_SPEED_IDS = ANIM_CAMERA_SPEEDS.map(
  (c) => c.id,
) as AnimCameraSpeedId[];

export const ANIM_MUSIC_MOODS = [
  { id: "bez-muzike", label: "Bez muzike" },
  { id: "opustajuca", label: "Opuštajuća / Ambijentalna" },
  { id: "dinamicna", label: "Dinamična / Moderna" },
  { id: "korporativna", label: "Korporativna / Prezentaciona" },
] as const;
export type AnimMusicMoodId = (typeof ANIM_MUSIC_MOODS)[number]["id"];
export const ANIM_MUSIC_MOOD_IDS = ANIM_MUSIC_MOODS.map(
  (m) => m.id,
) as AnimMusicMoodId[];

// ─── Checkbox groups ──────────────────────────────────────────────────

export const ANIM_FOCUS_AREA_OPTIONS = [
  { key: "arhitektura", label: "Arhitektura / Fasada" },
  { key: "enterijer", label: "Dizajn enterijera" },
  { key: "pejzaz", label: "Pejzaž / Dvorište" },
  { key: "sadrzaji", label: "Sadržaji kompleksa (bazeni, parkovi)" },
] as const;
export type AnimFocusAreas = {
  arhitektura: boolean;
  enterijer: boolean;
  pejzaz: boolean;
  sadrzaji: boolean;
};

export const ANIM_SCENE_ELEMENT_OPTIONS = [
  { key: "ljudi", label: "Ljudi u pokretu (3D siluete)" },
  { key: "automobili", label: "Automobili u pokretu" },
  { key: "vodaDrvece", label: "Animacija vode / drveća na vetru" },
] as const;
export type AnimSceneElements = {
  ljudi: boolean;
  automobili: boolean;
  vodaDrvece: boolean;
};

// ─── Main config ──────────────────────────────────────────────────────

export type AnimationConfig = {
  sourceMode: AnimSourceMode;
  animationName: string;
  animationType: AnimTypeId;
  durationSeconds: number;          // multiple of ANIM_DURATION_STEP, min 15
  description?: string;
  // advanced 2.1
  timeOfDay?: AnimTimeOfDayId;
  season?: AnimSeasonId;
  cameraSpeed?: AnimCameraSpeedId;
  // advanced 2.2
  focusAreas: AnimFocusAreas;
  sceneElements: AnimSceneElements;
  musicMood?: AnimMusicMoodId;
  // upsell — drive add-on quantities
  extraPathsCount: number;          // anim-path
  dayNightVariant: boolean;         // anim-daynight (when supported)
  seasonalVariant: boolean;         // anim-season (scratch only)
};

export function defaultFocusAreas(): AnimFocusAreas {
  return {
    arhitektura: false,
    enterijer: false,
    pejzaz: false,
    sadrzaji: false,
  };
}
export function defaultSceneElements(): AnimSceneElements {
  return { ljudi: false, automobili: false, vodaDrvece: false };
}

export function defaultAnimationConfig(
  sourceMode: AnimSourceMode = "scratch",
): AnimationConfig {
  return {
    sourceMode,
    animationName: "Animacija 1",
    animationType: "eksterijer",
    durationSeconds: ANIM_DURATION_MIN,
    focusAreas: defaultFocusAreas(),
    sceneElements: defaultSceneElements(),
    extraPathsCount: 0,
    dayNightVariant: false,
    seasonalVariant: false,
  };
}

// ─── Sanitizers ───────────────────────────────────────────────────────

function clampCount(n: unknown, min: number, max: number): number {
  const parsed = Number(n);
  if (!Number.isFinite(parsed)) return min;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function clampDuration(n: unknown): number {
  const parsed = Number(n);
  if (!Number.isFinite(parsed)) return ANIM_DURATION_MIN;
  const rounded =
    Math.round(parsed / ANIM_DURATION_STEP) * ANIM_DURATION_STEP;
  return Math.max(
    ANIM_DURATION_MIN,
    Math.min(ANIM_DURATION_MAX, rounded),
  );
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

export function sanitizeAnimationConfig(
  c: AnimationConfig,
): AnimationConfig {
  const sourceMode =
    pickFromAllowlist<AnimSourceMode>(c.sourceMode, ANIM_SOURCE_MODE_IDS) ??
    "scratch";
  const animationType =
    pickFromAllowlist<AnimTypeId>(c.animationType, ANIM_TYPE_IDS) ??
    "eksterijer";
  // Force-clear add-on flags that aren't supported by the chosen mode so
  // saved configs can't keep stale toggles after a mode switch.
  const dayNightVariant =
    Boolean(c.dayNightVariant) && animSupportsDayNight(sourceMode);
  const seasonalVariant =
    Boolean(c.seasonalVariant) && animSupportsSeason(sourceMode);
  return {
    sourceMode,
    animationName:
      String(c.animationName ?? "").trim().slice(0, 100) || "Animacija 1",
    animationType,
    durationSeconds: clampDuration(c.durationSeconds),
    ...((d) => (d ? { description: d } : {}))(
      String(c.description ?? "").slice(0, 2000),
    ),
    ...((v) => (v ? { timeOfDay: v } : {}))(
      pickFromAllowlist<AnimTimeOfDayId>(
        c.timeOfDay,
        ANIM_TIME_OF_DAY_IDS,
      ),
    ),
    ...((v) => (v ? { season: v } : {}))(
      pickFromAllowlist<AnimSeasonId>(c.season, ANIM_SEASON_IDS),
    ),
    ...((v) => (v ? { cameraSpeed: v } : {}))(
      pickFromAllowlist<AnimCameraSpeedId>(
        c.cameraSpeed,
        ANIM_CAMERA_SPEED_IDS,
      ),
    ),
    focusAreas: sanitizeBooleans(c.focusAreas, defaultFocusAreas()),
    sceneElements: sanitizeBooleans(c.sceneElements, defaultSceneElements()),
    ...((v) => (v ? { musicMood: v } : {}))(
      pickFromAllowlist<AnimMusicMoodId>(c.musicMood, ANIM_MUSIC_MOOD_IDS),
    ),
    extraPathsCount: clampCount(c.extraPathsCount, 0, 10),
    dayNightVariant,
    seasonalVariant,
  };
}

// ─── Add-on quantities derived from config ────────────────────────────

export function addOnQuantitiesFor(
  config: AnimationConfig,
): Record<string, number> {
  const q: Record<string, number> = {};

  // Each extra path is billed as 586 RSD/sec of path-seconds. We approximate
  // path length = main animation length, so quantity = pathCount × seconds.
  if (config.extraPathsCount > 0 && config.durationSeconds > 0) {
    q["anim-path"] = config.extraPathsCount * config.durationSeconds;
  }

  // Day/Night: percent add-on, only available on scratch + existing
  if (config.dayNightVariant && animSupportsDayNight(config.sourceMode)) {
    q["anim-daynight"] = 1;
  }

  // Seasonal: percent add-on, only available on scratch
  if (config.seasonalVariant && animSupportsSeason(config.sourceMode)) {
    q["anim-season"] = 1;
  }

  return q;
}

// ─── Read helper ──────────────────────────────────────────────────────

export function readAnimationConfig(cj: unknown): AnimationConfig {
  if (
    cj &&
    typeof cj === "object" &&
    !Array.isArray(cj) &&
    "animationType" in (cj as Record<string, unknown>) &&
    "durationSeconds" in (cj as Record<string, unknown>)
  ) {
    return sanitizeAnimationConfig(cj as AnimationConfig);
  }
  return defaultAnimationConfig();
}
