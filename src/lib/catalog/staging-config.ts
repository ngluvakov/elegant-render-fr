/**
 * staging-config.ts — Per-item config + vocabularies for the virtual
 * staging products: `vs-static` (statički staging) and `vs-360` (360
 * staging). One config shape covers both; the productId selects which
 * catalog add-ons get driven (vs-angle vs vs-360-hotspot, vs-restyle vs
 * vs-360-restyle).
 */

export type StagingProductId = "vs-static" | "vs-360";

// ─── Vocabularies ──────────────────────────────────────────────────────

export const VS_FURNITURE_STYLES = [
  { id: "modern", label: "Modern / Contemporary" },
  { id: "scandinavian", label: "Scandinavian" },
  { id: "minimalist", label: "Minimalist" },
  { id: "industrial", label: "Industrial" },
  { id: "classic", label: "Classic / Traditional" },
  { id: "boho", label: "Boho / Eclectic" },
] as const;
export type VsFurnitureStyleId =
  (typeof VS_FURNITURE_STYLES)[number]["id"];
export const VS_FURNITURE_STYLE_IDS = VS_FURNITURE_STYLES.map(
  (s) => s.id,
) as VsFurnitureStyleId[];

export const VS_ROOM_PURPOSES = [
  { id: "dnevna", label: "Dnevna soba" },
  { id: "spavaca", label: "Spavaća soba" },
  { id: "decija", label: "Dečija soba" },
  { id: "trpezarija", label: "Trpezarija" },
  { id: "radna", label: "Radna soba / Kancelarija" },
  { id: "open-space", label: "Prazan prostor (Open space)" },
] as const;
export type VsRoomPurposeId =
  (typeof VS_ROOM_PURPOSES)[number]["id"];
export const VS_ROOM_PURPOSE_IDS = VS_ROOM_PURPOSES.map(
  (r) => r.id,
) as VsRoomPurposeId[];

export const VS_MOODS = [
  { id: "airy", label: "Svetlo i prozračno (Airy)" },
  { id: "cozy", label: "Toplo i ušuškano (Cozy)" },
  { id: "moody", label: "Luksuzno i tamnije (Moody)" },
  { id: "neutralno", label: "Neutralno / Komercijalno" },
] as const;
export type VsMoodId = (typeof VS_MOODS)[number]["id"];
export const VS_MOOD_IDS = VS_MOODS.map((m) => m.id) as VsMoodId[];

export const VS_TARGET_AUDIENCES = [
  { id: "mladi-parovi", label: "Mladi parovi / Profesionalci" },
  { id: "porodice", label: "Porodice sa decom" },
  { id: "studenti", label: "Studenti" },
  { id: "luksuzni", label: "Luksuzni kupci" },
] as const;
export type VsTargetAudienceId =
  (typeof VS_TARGET_AUDIENCES)[number]["id"];
export const VS_TARGET_AUDIENCE_IDS = VS_TARGET_AUDIENCES.map(
  (a) => a.id,
) as VsTargetAudienceId[];

// ─── Main config ──────────────────────────────────────────────────────

export type StagingConfig = {
  roomName: string;
  furnitureStyle: VsFurnitureStyleId;
  roomPurpose: VsRoomPurposeId;
  description?: string;
  // advanced 2.1
  mood?: VsMoodId;
  lightingCorrection: boolean;
  artificialLight: boolean;
  // advanced 2.2 — item removal
  itemRemovalEnabled: boolean;
  itemsToRemove?: string;
  itemsToKeep?: string;
  // advanced 2.3
  targetAudience?: VsTargetAudienceId;
  // upsell
  extraAnglesCount: number;       // drives vs-angle / vs-360-hotspot
  restyleEnabled: boolean;        // drives vs-restyle / vs-360-restyle
  restyleStyle?: VsFurnitureStyleId;
};

export function defaultStagingConfig(): StagingConfig {
  return {
    roomName: "Dnevna soba",
    furnitureStyle: "modern",
    roomPurpose: "dnevna",
    lightingCorrection: false,
    artificialLight: false,
    itemRemovalEnabled: false,
    extraAnglesCount: 0,
    restyleEnabled: false,
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

export function sanitizeStagingConfig(c: StagingConfig): StagingConfig {
  const furnitureStyle =
    pickFromAllowlist<VsFurnitureStyleId>(
      c.furnitureStyle,
      VS_FURNITURE_STYLE_IDS,
    ) ?? "modern";
  const roomPurpose =
    pickFromAllowlist<VsRoomPurposeId>(c.roomPurpose, VS_ROOM_PURPOSE_IDS) ??
    "dnevna";
  const itemRemovalEnabled = Boolean(c.itemRemovalEnabled);
  const restyleEnabled = Boolean(c.restyleEnabled);
  const restyleStyle = pickFromAllowlist<VsFurnitureStyleId>(
    c.restyleStyle,
    VS_FURNITURE_STYLE_IDS,
  );
  return {
    roomName:
      String(c.roomName ?? "").trim().slice(0, 100) || "Dnevna soba",
    furnitureStyle,
    roomPurpose,
    ...((d) => (d ? { description: d } : {}))(
      String(c.description ?? "").slice(0, 2000),
    ),
    ...((v) => (v ? { mood: v } : {}))(
      pickFromAllowlist<VsMoodId>(c.mood, VS_MOOD_IDS),
    ),
    lightingCorrection: Boolean(c.lightingCorrection),
    artificialLight: Boolean(c.artificialLight),
    itemRemovalEnabled,
    ...(itemRemovalEnabled && c.itemsToRemove
      ? { itemsToRemove: String(c.itemsToRemove).slice(0, 2000) }
      : {}),
    ...((s) => (s ? { itemsToKeep: s } : {}))(
      String(c.itemsToKeep ?? "").slice(0, 2000),
    ),
    ...((v) => (v ? { targetAudience: v } : {}))(
      pickFromAllowlist<VsTargetAudienceId>(
        c.targetAudience,
        VS_TARGET_AUDIENCE_IDS,
      ),
    ),
    extraAnglesCount: clampCount(c.extraAnglesCount, 0, 30),
    restyleEnabled,
    ...(restyleEnabled && restyleStyle ? { restyleStyle } : {}),
  };
}

// ─── Add-on quantities derived from config ────────────────────────────

export function addOnQuantitiesFor(
  config: StagingConfig,
  productId: StagingProductId,
): Record<string, number> {
  const q: Record<string, number> = {};
  const angleAddOn = productId === "vs-static" ? "vs-angle" : "vs-360-hotspot";
  const restyleAddOn =
    productId === "vs-static" ? "vs-restyle" : "vs-360-restyle";
  if (config.extraAnglesCount > 0) q[angleAddOn] = config.extraAnglesCount;
  if (config.restyleEnabled) q[restyleAddOn] = 1;
  return q;
}

// ─── Per-product copy ─────────────────────────────────────────────────

export function stagingProductLabel(productId: StagingProductId): string {
  return productId === "vs-static" ? "Statički staging" : "360 staging";
}

export function angleNoun(
  productId: StagingProductId,
  count: number,
): string {
  if (productId === "vs-360") {
    return count === 1 ? "hotspot" : "hotspota";
  }
  if (count === 1) return "ugao";
  if (count >= 2 && count <= 4) return "ugla";
  return "uglova";
}

// ─── Read helper ──────────────────────────────────────────────────────

export function readStagingConfig(cj: unknown): StagingConfig {
  if (
    cj &&
    typeof cj === "object" &&
    !Array.isArray(cj) &&
    "furnitureStyle" in (cj as Record<string, unknown>) &&
    "roomPurpose" in (cj as Record<string, unknown>)
  ) {
    return sanitizeStagingConfig(cj as StagingConfig);
  }
  return defaultStagingConfig();
}
