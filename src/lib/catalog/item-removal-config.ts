/**
 * item-removal-config.ts — Per-item config + vocabularies for the
 * item-removal products: `ir-simple` (simple removal) and
 * `ir-complex` (complex removal). One config shape covers both;
 * the productId selects which catalog add-on gets driven
 * (ir-simple-additional vs ir-complex-additional).
 *
 * The "stagingUpsell" toggle is informational in v1 — it just stores
 * intent in configJson; customers add vs-static via the standard
 * "Add product" flow if they want staging.
 */

import {
  VS_FURNITURE_STYLE_IDS,
  type VsFurnitureStyleId,
} from "./staging-config";

export type ItemRemovalProductId = "ir-simple" | "ir-complex";

// ─── Main config ──────────────────────────────────────────────────────

export type ItemRemovalConfig = {
  imageName: string;
  photoCount: number;             // min 1; drives ir-*-additional = count - 1
  description?: string;            // what to remove
  // advanced 2.1
  itemsToKeep?: string;
  // advanced 2.2 — only meaningful when productId === "ir-complex"
  backgroundDescription?: string;
  // upsell — informational flag (UI hints to add vs-static separately)
  stagingUpsellEnabled: boolean;
  stagingUpsellStyle?: VsFurnitureStyleId;
};

export function defaultItemRemovalConfig(): ItemRemovalConfig {
  return {
    imageName: "Image 1",
    photoCount: 1,
    stagingUpsellEnabled: false,
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

export function sanitizeItemRemovalConfig(
  c: ItemRemovalConfig,
): ItemRemovalConfig {
  const stagingUpsellEnabled = Boolean(c.stagingUpsellEnabled);
  const stagingUpsellStyle = pickFromAllowlist<VsFurnitureStyleId>(
    c.stagingUpsellStyle,
    VS_FURNITURE_STYLE_IDS,
  );
  return {
    imageName: String(c.imageName ?? "").trim().slice(0, 100) || "Image 1",
    photoCount: clampCount(c.photoCount, 1, 200),
    ...((d) => (d ? { description: d } : {}))(
      String(c.description ?? "").slice(0, 2000),
    ),
    ...((s) => (s ? { itemsToKeep: s } : {}))(
      String(c.itemsToKeep ?? "").slice(0, 2000),
    ),
    ...((s) => (s ? { backgroundDescription: s } : {}))(
      String(c.backgroundDescription ?? "").slice(0, 2000),
    ),
    stagingUpsellEnabled,
    ...(stagingUpsellEnabled && stagingUpsellStyle
      ? { stagingUpsellStyle }
      : {}),
  };
}

// ─── Add-on quantities derived from config ────────────────────────────

export function addOnQuantitiesFor(
  config: ItemRemovalConfig,
  productId: ItemRemovalProductId,
): Record<string, number> {
  const q: Record<string, number> = {};
  const additional =
    productId === "ir-simple"
      ? "ir-simple-additional"
      : "ir-complex-additional";
  if (config.photoCount > 1) q[additional] = config.photoCount - 1;
  return q;
}

// ─── Per-product copy ─────────────────────────────────────────────────

export function itemRemovalProductLabel(
  productId: ItemRemovalProductId,
): string {
  return productId === "ir-simple"
    ? "Simple removal"
    : "Complex removal";
}

export function itemRemovalAdditionalPriceEur(
  productId: ItemRemovalProductId,
): number {
  return productId === "ir-simple" ? 8 : 18;
}

// ─── Read helper ──────────────────────────────────────────────────────

export function readItemRemovalConfig(cj: unknown): ItemRemovalConfig {
  if (
    cj &&
    typeof cj === "object" &&
    !Array.isArray(cj) &&
    "imageName" in (cj as Record<string, unknown>) &&
    "photoCount" in (cj as Record<string, unknown>)
  ) {
    return sanitizeItemRemovalConfig(cj as ItemRemovalConfig);
  }
  return defaultItemRemovalConfig();
}
