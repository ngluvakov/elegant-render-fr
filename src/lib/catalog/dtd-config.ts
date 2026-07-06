/**
 * dtd-config.ts — Per-item config + vocabularies for the dtd-image
 * product (Dan u noć / Day-to-Dusk). Drives engine add-on quantities
 * for `dtd-volume` (photos beyond the first), `dtd-shadow` (one-time
 * shadow removal toggle), and `dtd-rush` (50% rush surcharge).
 */

// ─── Vocabularies ──────────────────────────────────────────────────────

export const DTD_SKY_MOODS = [
  { id: "golden-hour", label: "Zlatni sat (Toplo / Zalazak)" },
  { id: "dramatic-dusk", label: "Dramatičan sumrak (Ljubičasto / Plavo)" },
  { id: "clear-night", label: "Vedra noć (Tamno plavo, sa zvezdama)" },
  { id: "overcast-dusk", label: "Oblačan sumrak (Moody)" },
] as const;
export type DtdSkyMoodId = (typeof DTD_SKY_MOODS)[number]["id"];
export const DTD_SKY_MOOD_IDS = DTD_SKY_MOODS.map(
  (m) => m.id,
) as DtdSkyMoodId[];

export const DTD_INTERIOR_LIGHTS = [
  { id: "warm-yellow", label: "Toplo žuto svetlo (Cozy)" },
  { id: "neutral-white", label: "Neutralno belo svetlo" },
  { id: "cool", label: "Hladno svetlo (moderno)" },
] as const;
export type DtdInteriorLightId =
  (typeof DTD_INTERIOR_LIGHTS)[number]["id"];
export const DTD_INTERIOR_LIGHT_IDS = DTD_INTERIOR_LIGHTS.map(
  (l) => l.id,
) as DtdInteriorLightId[];

export const DTD_COLOR_GRADES = [
  { id: "natural", label: "Prirodno (samo zamena neba)" },
  { id: "cinematic", label: "Filmski (pojačan kontrast i boje)" },
  { id: "warm", label: "Toplo (naglašen zalazak sunca)" },
] as const;
export type DtdColorGradeId = (typeof DTD_COLOR_GRADES)[number]["id"];
export const DTD_COLOR_GRADE_IDS = DTD_COLOR_GRADES.map(
  (g) => g.id,
) as DtdColorGradeId[];

// ─── Boolean group ────────────────────────────────────────────────────

export const DTD_EXTERIOR_LIGHTING_OPTIONS = [
  { key: "street", label: "Upali uličnu rasvetu" },
  { key: "facade", label: "Upali svetla na fasadi" },
  { key: "pool", label: "Upali svetla u bazenu / dvorištu" },
  { key: "carHeadlights", label: "Upali farove na automobilima" },
] as const;
export type DtdExteriorLighting = {
  street: boolean;
  facade: boolean;
  pool: boolean;
  carHeadlights: boolean;
};

// ─── Main config ──────────────────────────────────────────────────────

export type DtdConfig = {
  projectName: string;
  photoCount: number;            // min 1; drives dtd-volume = count - 1
  skyMood: DtdSkyMoodId;
  description?: string;
  // advanced 2.1 — lighting
  interiorLight?: DtdInteriorLightId;
  exteriorLighting: DtdExteriorLighting;
  // advanced 2.2 — corrections
  shadowRemoval: boolean;        // drives dtd-shadow: 1 (one-time toggle)
  colorGrade?: DtdColorGradeId;
  // upsell
  rushDelivery: boolean;         // drives dtd-rush: 1 (+50% percent)
};

export function defaultExteriorLighting(): DtdExteriorLighting {
  return { street: false, facade: false, pool: false, carHeadlights: false };
}

export function defaultDtdConfig(): DtdConfig {
  return {
    projectName: "Nekretnina 1",
    photoCount: 1,
    skyMood: "golden-hour",
    exteriorLighting: defaultExteriorLighting(),
    shadowRemoval: false,
    rushDelivery: false,
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

export function sanitizeDtdConfig(c: DtdConfig): DtdConfig {
  const skyMood =
    pickFromAllowlist<DtdSkyMoodId>(c.skyMood, DTD_SKY_MOOD_IDS) ??
    "golden-hour";
  return {
    projectName:
      String(c.projectName ?? "").trim().slice(0, 100) || "Nekretnina 1",
    photoCount: clampCount(c.photoCount, 1, 200),
    skyMood,
    ...((d) => (d ? { description: d } : {}))(
      String(c.description ?? "").slice(0, 2000),
    ),
    ...((v) => (v ? { interiorLight: v } : {}))(
      pickFromAllowlist<DtdInteriorLightId>(
        c.interiorLight,
        DTD_INTERIOR_LIGHT_IDS,
      ),
    ),
    exteriorLighting: sanitizeBooleans(
      c.exteriorLighting,
      defaultExteriorLighting(),
    ),
    shadowRemoval: Boolean(c.shadowRemoval),
    ...((v) => (v ? { colorGrade: v } : {}))(
      pickFromAllowlist<DtdColorGradeId>(c.colorGrade, DTD_COLOR_GRADE_IDS),
    ),
    rushDelivery: Boolean(c.rushDelivery),
  };
}

// ─── Add-on quantities derived from config ────────────────────────────

export function addOnQuantitiesFor(
  config: DtdConfig,
): Record<string, number> {
  const q: Record<string, number> = {};
  if (config.photoCount > 1) q["dtd-volume"] = config.photoCount - 1;
  if (config.shadowRemoval) q["dtd-shadow"] = 1;
  if (config.rushDelivery) q["dtd-rush"] = 1;
  return q;
}

// ─── Read helper ──────────────────────────────────────────────────────

export function readDtdConfig(cj: unknown): DtdConfig {
  if (
    cj &&
    typeof cj === "object" &&
    !Array.isArray(cj) &&
    "photoCount" in (cj as Record<string, unknown>) &&
    "skyMood" in (cj as Record<string, unknown>)
  ) {
    return sanitizeDtdConfig(cj as DtdConfig);
  }
  return defaultDtdConfig();
}
