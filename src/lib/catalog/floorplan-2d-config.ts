/**
 * floorplan-2d-config.ts — Per-item config + vocabularies for the
 * fp2d-single product (2D osnove prostora). Drives engine add-on
 * quantities for fp2d-double (2nd level), fp2d-extra (3rd+ level),
 * fp2d-furnished (furniture overlay), fp2d-variant (style variant),
 * fp2d-duplicate (identical-layout duplicate).
 *
 * Single-level config; the `levels` field controls progressive multi-
 * level pricing via add-on quantities.
 */

// ─── Vocabularies ──────────────────────────────────────────────────────

export const FP2D_DISPLAY_STYLES = [
  { id: "black-white", label: "Black and white (technical)" },
  { id: "colorized", label: "Colorized (each room a different color)" },
  { id: "textured", label: "Textured (realistic floors — wood, tiles)" },
] as const;
export type Fp2dDisplayStyleId =
  (typeof FP2D_DISPLAY_STYLES)[number]["id"];
export const FP2D_DISPLAY_STYLE_IDS = FP2D_DISPLAY_STYLES.map(
  (s) => s.id,
) as Fp2dDisplayStyleId[];

export const FP2D_DISPLAY_TYPES = [
  { id: "unfurnished", label: "Unfurnished plan (walls and fixtures only)" },
  { id: "furnished", label: "Furnished (with 2D furniture icons)" },
] as const;
export type Fp2dDisplayTypeId =
  (typeof FP2D_DISPLAY_TYPES)[number]["id"];
export const FP2D_DISPLAY_TYPE_IDS = FP2D_DISPLAY_TYPES.map(
  (d) => d.id,
) as Fp2dDisplayTypeId[];

export const FP2D_LABEL_LANGUAGES = [
  { id: "serbian", label: "Serbian" },
  { id: "english", label: "English" },
  { id: "german", label: "German" },
  { id: "bilingual", label: "Bilingual (Serbian / English)" },
] as const;
export type Fp2dLabelLanguageId =
  (typeof FP2D_LABEL_LANGUAGES)[number]["id"];
export const FP2D_LABEL_LANGUAGE_IDS = FP2D_LABEL_LANGUAGES.map(
  (l) => l.id,
) as Fp2dLabelLanguageId[];

export const FP2D_DELIVERY_FORMAT_OPTIONS = [
  { key: "pdf", label: "PDF (vector)" },
  { key: "svg", label: "SVG (vector for web)" },
  { key: "png", label: "PNG (high resolution)" },
  { key: "jpg", label: "JPG (standard)" },
] as const;
export type Fp2dDeliveryFormats = {
  pdf: boolean;
  svg: boolean;
  png: boolean;
  jpg: boolean;
};

// ─── Main config ──────────────────────────────────────────────────────

export type Floorplan2dConfig = {
  projectName: string;
  levels: number;                       // min 1; drives fp2d-double + fp2d-extra
  displayStyle: Fp2dDisplayStyleId;     // black-white | colorized | textured
  displayType: Fp2dDisplayTypeId;       // unfurnished | furnished
  description?: string;
  // advanced — labels & technical
  showRoomLabels: boolean;
  showDimensions: boolean;
  showCompass: boolean;
  labelLanguage?: Fp2dLabelLanguageId;
  // advanced — branding
  brandingEnabled: boolean;
  brandPrimaryColor?: string;           // HEX, e.g. "#1c1a19"
  // delivery formats (at least one expected)
  deliveryFormats: Fp2dDeliveryFormats;
  // upsell
  variantEnabled: boolean;
  variantStyleId?: Fp2dDisplayStyleId;
  duplicateEnabled: boolean;
};

export function defaultDeliveryFormats(): Fp2dDeliveryFormats {
  return { pdf: true, svg: false, png: false, jpg: false };
}

export function defaultFloorplan2dConfig(): Floorplan2dConfig {
  return {
    projectName: "Floor plan 1",
    levels: 1,
    displayStyle: "colorized",
    displayType: "unfurnished",
    showRoomLabels: false,
    showDimensions: false,
    showCompass: false,
    brandingEnabled: false,
    deliveryFormats: defaultDeliveryFormats(),
    variantEnabled: false,
    duplicateEnabled: false,
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

// HEX color validator: accepts "#RGB", "#RRGGBB", "#RRGGBBAA", with or
// without the leading "#". Returns the normalized "#RRGGBB" form, or
// undefined if invalid.
function sanitizeHexColor(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim().replace(/^#/, "");
  if (!/^[0-9A-Fa-f]+$/.test(trimmed)) return undefined;
  if (trimmed.length === 3) {
    // Expand "abc" → "aabbcc"
    return `#${trimmed
      .split("")
      .map((c) => c + c)
      .join("")
      .toUpperCase()}`;
  }
  if (trimmed.length === 6 || trimmed.length === 8) {
    return `#${trimmed.toUpperCase()}`;
  }
  return undefined;
}

function sanitizeDeliveryFormats(raw: unknown): Fp2dDeliveryFormats {
  const fallback = defaultDeliveryFormats();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fallback;
  const obj = raw as Record<string, unknown>;
  const out: Fp2dDeliveryFormats = {
    pdf: Boolean(obj.pdf),
    svg: Boolean(obj.svg),
    png: Boolean(obj.png),
    jpg: Boolean(obj.jpg),
  };
  // Ensure at least one format is selected; fall back to PDF.
  if (!out.pdf && !out.svg && !out.png && !out.jpg) out.pdf = true;
  return out;
}

export function sanitizeFloorplan2dConfig(
  c: Floorplan2dConfig,
): Floorplan2dConfig {
  const displayStyle =
    pickFromAllowlist<Fp2dDisplayStyleId>(
      c.displayStyle,
      FP2D_DISPLAY_STYLE_IDS,
    ) ?? "colorized";
  const displayType =
    pickFromAllowlist<Fp2dDisplayTypeId>(c.displayType, FP2D_DISPLAY_TYPE_IDS) ??
    "unfurnished";
  const labelLanguage = pickFromAllowlist<Fp2dLabelLanguageId>(
    c.labelLanguage,
    FP2D_LABEL_LANGUAGE_IDS,
  );
  const brandingEnabled = Boolean(c.brandingEnabled);
  const brandPrimaryColor = sanitizeHexColor(c.brandPrimaryColor);
  const variantEnabled = Boolean(c.variantEnabled);
  const variantStyleId = pickFromAllowlist<Fp2dDisplayStyleId>(
    c.variantStyleId,
    FP2D_DISPLAY_STYLE_IDS,
  );
  return {
    projectName:
      String(c.projectName ?? "").trim().slice(0, 100) || "Floor plan 1",
    levels: clampCount(c.levels, 1, 30),
    displayStyle,
    displayType,
    ...((d) => (d ? { description: d } : {}))(
      String(c.description ?? "").slice(0, 2000),
    ),
    showRoomLabels: Boolean(c.showRoomLabels),
    showDimensions: Boolean(c.showDimensions),
    showCompass: Boolean(c.showCompass),
    ...(labelLanguage ? { labelLanguage } : {}),
    brandingEnabled,
    ...(brandingEnabled && brandPrimaryColor
      ? { brandPrimaryColor }
      : {}),
    deliveryFormats: sanitizeDeliveryFormats(c.deliveryFormats),
    variantEnabled,
    ...(variantEnabled && variantStyleId
      ? { variantStyleId }
      : {}),
    duplicateEnabled: Boolean(c.duplicateEnabled),
  };
}

// ─── Add-on quantities derived from config ────────────────────────────

export function addOnQuantitiesFor(
  config: Floorplan2dConfig,
): Record<string, number> {
  const q: Record<string, number> = {};
  if (config.levels >= 2) q["fp2d-double"] = 1;
  if (config.levels >= 3) q["fp2d-extra"] = config.levels - 2;
  if (config.displayType === "furnished") q["fp2d-furnished"] = 1;
  if (config.variantEnabled) q["fp2d-variant"] = 1;
  if (config.duplicateEnabled) q["fp2d-duplicate"] = 1;
  return q;
}

// ─── Read helper ──────────────────────────────────────────────────────

export function readFloorplan2dConfig(cj: unknown): Floorplan2dConfig {
  if (
    cj &&
    typeof cj === "object" &&
    !Array.isArray(cj) &&
    "levels" in (cj as Record<string, unknown>) &&
    "displayStyle" in (cj as Record<string, unknown>)
  ) {
    return sanitizeFloorplan2dConfig(cj as Floorplan2dConfig);
  }
  return defaultFloorplan2dConfig();
}
