/**
 * vr-config.ts — Per-item config + vocabularies for the two VR
 * products: `vr-existing` (existing model, €1500) and `vr-standalone`
 * (standalone, €3000). One config shape covers both; productId picks
 * the correct add-on suffix (vr-{suffix}-floor / -interactive).
 *
 * Both products share the same add-on schema:
 *   - vr-{suffix}-floor: €500 per additional floor / area
 *   - vr-{suffix}-interactive: €200 per interactive type
 *
 * Section 2.2 toggles (door/lights/materials) are descriptive flags in
 * configJson and don't directly drive the interactive add-on count —
 * the user enters the total count separately in the upsell stepper.
 */

export type VrProductId = "vr-existing" | "vr-standalone";

const VR_SUFFIX = {
  "vr-existing": "existing",
  "vr-standalone": "standalone",
} as const;

const VR_PRODUCT_LABELS = {
  "vr-existing": "VR walkthrough (existing model)",
  "vr-standalone": "VR walkthrough (standalone)",
} as const;

const VR_BASE_PRICE = {
  "vr-existing": 1500,
  "vr-standalone": 3000,
} as const;

export function vrProductLabel(productId: VrProductId): string {
  return VR_PRODUCT_LABELS[productId];
}
export function vrBasePriceEur(productId: VrProductId): number {
  return VR_BASE_PRICE[productId];
}

export const VR_FLOOR_EUR = 500;
export const VR_INTERACTIVE_EUR = 200;

// ─── Vocabularies ──────────────────────────────────────────────────────

export const VR_EXPERIENCE_TYPES = [
  { id: "exterior", label: "Exterior (free movement around the building)" },
  { id: "interior", label: "Interior (movement through rooms)" },
  { id: "complex", label: "Complex (exterior + interior)" },
] as const;
export type VrExperienceTypeId =
  (typeof VR_EXPERIENCE_TYPES)[number]["id"];
export const VR_EXPERIENCE_TYPE_IDS = VR_EXPERIENCE_TYPES.map(
  (t) => t.id,
) as VrExperienceTypeId[];

export const VR_TARGET_DEVICES = [
  { id: "meta-quest", label: "Meta Quest 2 / 3 / Pro (standalone VR)" },
  { id: "pc-vr", label: "PC VR (tethered, higher graphics quality)" },
  { id: "web-vr", label: "Web VR (in the browser, lower quality)" },
] as const;
export type VrTargetDeviceId =
  (typeof VR_TARGET_DEVICES)[number]["id"];
export const VR_TARGET_DEVICE_IDS = VR_TARGET_DEVICES.map(
  (d) => d.id,
) as VrTargetDeviceId[];

export const VR_LOCOMOTION = [
  { id: "teleport", label: "Teleportation (best against motion sickness)" },
  { id: "smooth", label: "Free walking (smooth locomotion)" },
  { id: "guided", label: "Guided tour (on rails)" },
] as const;
export type VrLocomotionId = (typeof VR_LOCOMOTION)[number]["id"];
export const VR_LOCOMOTION_IDS = VR_LOCOMOTION.map(
  (l) => l.id,
) as VrLocomotionId[];

export const VR_DAY_NIGHT_MODES = [
  { id: "daylight", label: "Daylight" },
  { id: "night", label: "Night lighting" },
  { id: "dynamic", label: "Dynamic (user switches day / night)" },
] as const;
export type VrDayNightModeId =
  (typeof VR_DAY_NIGHT_MODES)[number]["id"];
export const VR_DAY_NIGHT_MODE_IDS = VR_DAY_NIGHT_MODES.map(
  (m) => m.id,
) as VrDayNightModeId[];

// ─── Main config ──────────────────────────────────────────────────────

export type VrConfig = {
  projectName: string;
  experienceType: VrExperienceTypeId;
  targetDevice: VrTargetDeviceId;
  description?: string;
  // advanced 2.1 — navigation
  locomotion?: VrLocomotionId;
  movementRestrictions: boolean;
  // advanced 2.2 — interactions (descriptive flags)
  doorInteraction: boolean;
  lightsInteraction: boolean;
  materialsInteraction: boolean;
  customInteractionDescription?: string;
  // advanced 2.3 — atmosphere / UI
  dayNightMode?: VrDayNightModeId;
  brandingEnabled: boolean;
  // upsell
  extraFloorsCount: number;          // drives vr-{suffix}-floor
  interactiveTypeCount: number;      // drives vr-{suffix}-interactive
};

export function defaultVrConfig(): VrConfig {
  return {
    projectName: "VR presentation 1",
    experienceType: "interior",
    targetDevice: "meta-quest",
    movementRestrictions: false,
    doorInteraction: false,
    lightsInteraction: false,
    materialsInteraction: false,
    brandingEnabled: false,
    extraFloorsCount: 0,
    interactiveTypeCount: 0,
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

export function sanitizeVrConfig(c: VrConfig): VrConfig {
  const experienceType =
    pickFromAllowlist<VrExperienceTypeId>(
      c.experienceType,
      VR_EXPERIENCE_TYPE_IDS,
    ) ?? "interior";
  const targetDevice =
    pickFromAllowlist<VrTargetDeviceId>(
      c.targetDevice,
      VR_TARGET_DEVICE_IDS,
    ) ?? "meta-quest";
  return {
    projectName:
      String(c.projectName ?? "").trim().slice(0, 100) ||
      "VR presentation 1",
    experienceType,
    targetDevice,
    ...((d) => (d ? { description: d } : {}))(
      String(c.description ?? "").slice(0, 2000),
    ),
    ...((v) => (v ? { locomotion: v } : {}))(
      pickFromAllowlist<VrLocomotionId>(c.locomotion, VR_LOCOMOTION_IDS),
    ),
    movementRestrictions: Boolean(c.movementRestrictions),
    doorInteraction: Boolean(c.doorInteraction),
    lightsInteraction: Boolean(c.lightsInteraction),
    materialsInteraction: Boolean(c.materialsInteraction),
    ...((s) => (s ? { customInteractionDescription: s } : {}))(
      String(c.customInteractionDescription ?? "").slice(0, 2000),
    ),
    ...((v) => (v ? { dayNightMode: v } : {}))(
      pickFromAllowlist<VrDayNightModeId>(
        c.dayNightMode,
        VR_DAY_NIGHT_MODE_IDS,
      ),
    ),
    brandingEnabled: Boolean(c.brandingEnabled),
    extraFloorsCount: clampCount(c.extraFloorsCount, 0, 30),
    interactiveTypeCount: clampCount(c.interactiveTypeCount, 0, 30),
  };
}

// ─── Add-on quantities derived from config ────────────────────────────

export function addOnQuantitiesFor(
  config: VrConfig,
  productId: VrProductId,
): Record<string, number> {
  const q: Record<string, number> = {};
  const suffix = VR_SUFFIX[productId];
  if (config.extraFloorsCount > 0) {
    q[`vr-${suffix}-floor`] = config.extraFloorsCount;
  }
  if (config.interactiveTypeCount > 0) {
    q[`vr-${suffix}-interactive`] = config.interactiveTypeCount;
  }
  return q;
}

// ─── Read helper ──────────────────────────────────────────────────────

export function readVrConfig(cj: unknown): VrConfig {
  if (
    cj &&
    typeof cj === "object" &&
    !Array.isArray(cj) &&
    "experienceType" in (cj as Record<string, unknown>) &&
    "targetDevice" in (cj as Record<string, unknown>)
  ) {
    return sanitizeVrConfig(cj as VrConfig);
  }
  return defaultVrConfig();
}
