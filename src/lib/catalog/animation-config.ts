/**
 * animation-config.ts — Per-item config + vocabularies for the three
 * animation products: `anim-scratch` (od nule), `anim-existing`
 * (postojeći model), `anim-active` (aktivan projekat). One config
 * shape covers all three; the productId picks the correct add-on
 * suffix for paths/daynight, and gates which upsell options are
 * available (daynight not on anim-active; season only on anim-scratch).
 *
 * Pricing per second is handled by the engine via `durationConfig` on
 * each product entry. The configurator stores `durationSeconds` on the
 * config and the server action propagates it onto the QuoteItem so
 * `calcLineItem` applies the correct base × seconds × duration tier.
 */

export type AnimationProductId =
  | "anim-scratch"
  | "anim-existing"
  | "anim-active";

export const ANIM_DURATION_MIN = 15;
export const ANIM_DURATION_MAX = 300;
export const ANIM_DURATION_STEP = 5;

// Per-product lookup
const ANIM_SUFFIX = {
  "anim-scratch": "scratch",
  "anim-existing": "exist",
  "anim-active": "active",
} as const;

const ANIM_PER_SECOND_EUR = {
  "anim-scratch": 15,
  "anim-existing": 10,
  "anim-active": 8,
} as const;

const ANIM_PRODUCT_LABELS = {
  "anim-scratch": "Animacija (od nule)",
  "anim-existing": "Animacija (postojeći model)",
  "anim-active": "Animacija (aktivan projekat)",
} as const;

export function animProductLabel(productId: AnimationProductId): string {
  return ANIM_PRODUCT_LABELS[productId];
}

export function animPerSecondEur(productId: AnimationProductId): number {
  return ANIM_PER_SECOND_EUR[productId];
}

export function animSupportsDayNight(productId: AnimationProductId): boolean {
  return productId !== "anim-active";
}

export function animSupportsSeason(productId: AnimationProductId): boolean {
  return productId === "anim-scratch";
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
  // upsell
  extraPathsCount: number;          // drives anim-{suffix}-path
  dayNightVariant: boolean;         // drives anim-{suffix}-daynight (where supported)
  seasonalVariant: boolean;         // drives anim-scratch-season (anim-scratch only)
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

export function defaultAnimationConfig(): AnimationConfig {
  return {
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
  const animationType =
    pickFromAllowlist<AnimTypeId>(c.animationType, ANIM_TYPE_IDS) ??
    "eksterijer";
  return {
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
    dayNightVariant: Boolean(c.dayNightVariant),
    seasonalVariant: Boolean(c.seasonalVariant),
  };
}

// ─── Add-on quantities derived from config ────────────────────────────

export function addOnQuantitiesFor(
  config: AnimationConfig,
  productId: AnimationProductId,
): Record<string, number> {
  const q: Record<string, number> = {};
  const suffix = ANIM_SUFFIX[productId];

  // Each extra path is billed as €5/sec of path-seconds. We approximate
  // path length = main animation length, so quantity = pathCount × seconds.
  if (config.extraPathsCount > 0 && config.durationSeconds > 0) {
    q[`anim-${suffix}-path`] =
      config.extraPathsCount * config.durationSeconds;
  }

  // Day/Night: percent add-on, only available on scratch + existing
  if (config.dayNightVariant && animSupportsDayNight(productId)) {
    q[`anim-${suffix}-daynight`] = 1;
  }

  // Seasonal: percent add-on, only available on scratch
  if (config.seasonalVariant && productId === "anim-scratch") {
    q["anim-scratch-season"] = 1;
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
