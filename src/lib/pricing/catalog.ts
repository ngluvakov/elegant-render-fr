import {
  AI_CREDIT_EXPIRES_AFTER_MONTHS,
  AI_CREDIT_TIERS,
  AI_CREDIT_UNITS_PER_CREDIT,
  type AiCreditTier,
} from "@/lib/ai-studio/catalog";
import {
  type ConfiguratorCategory,
  type ConfiguratorProduct,
  CONFIGURATOR_CATEGORIES,
} from "@/lib/catalog/configurator";
import { PUBLIC_SERBIA_VAT_RATE } from "@/lib/catalog/display-currency";
import {
  INT_STATIC_EXTRA_CAMERA_EUR,
  INT_STATIC_EXTRA_FLOOR_EUR,
  INT_STATIC_EXTRA_ROOM_EUR,
  INT_STATIC_FIRST_FLOOR_EUR,
  INT_STATIC_INCLUDED_CAMERAS,
  INT_STATIC_INCLUDED_ROOMS,
  type InteriorPricing,
} from "@/lib/catalog/interior-config";
import {
  TOUR360_EXTRA_CAMERA_EUR,
  TOUR360_EXTRA_FLOOR_EUR,
  TOUR360_EXTRA_HOTSPOT_EUR,
  TOUR360_FIRST_FLOOR_EUR,
  TOUR360_INCLUDED_CAMERAS,
  TOUR360_INCLUDED_HOTSPOTS,
  type Tour360Pricing,
} from "@/lib/catalog/tour360-config";
import {
  TOUR_ASSEMBLY_BASE_EUR,
  TOUR_ASSEMBLY_FREE_HOTSPOT_THRESHOLD,
  TOUR_FLOOR_PLAN_NAV_EUR,
  TOUR_WHITE_LABEL_EUR,
  type TourAssemblyPricing,
} from "@/lib/catalog/tour-assembly";

export type PricingBookViewStatus = "static" | "draft" | "published";

export type PricingSettings = {
  serbiaVatRate: number;
  aiCreditUnitsPerCredit: number;
  aiCreditExpiresAfterMonths: number;
  aiCreditTiers: AiCreditTier[];
  specialPricing: {
    interior: InteriorPricing;
    tour360: Tour360Pricing;
    tourAssembly: TourAssemblyPricing;
  };
};

export type ResolvedPricingCatalog = {
  bookId: string | null;
  name: string;
  status: PricingBookViewStatus;
  publishedAt: string | null;
  updatedAt: string | null;
  categories: ConfiguratorCategory[];
  settings: PricingSettings;
};

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  serbiaVatRate: PUBLIC_SERBIA_VAT_RATE,
  aiCreditUnitsPerCredit: AI_CREDIT_UNITS_PER_CREDIT,
  aiCreditExpiresAfterMonths: AI_CREDIT_EXPIRES_AFTER_MONTHS,
  aiCreditTiers: [...AI_CREDIT_TIERS],
  specialPricing: {
    interior: {
      firstFloorEur: INT_STATIC_FIRST_FLOOR_EUR,
      extraFloorEur: INT_STATIC_EXTRA_FLOOR_EUR,
      includedRooms: INT_STATIC_INCLUDED_ROOMS,
      includedCameras: INT_STATIC_INCLUDED_CAMERAS,
      extraRoomEur: INT_STATIC_EXTRA_ROOM_EUR,
      extraCameraEur: INT_STATIC_EXTRA_CAMERA_EUR,
    },
    tour360: {
      firstFloorEur: TOUR360_FIRST_FLOOR_EUR,
      extraFloorEur: TOUR360_EXTRA_FLOOR_EUR,
      includedHotspots: TOUR360_INCLUDED_HOTSPOTS,
      includedCameras: TOUR360_INCLUDED_CAMERAS,
      extraHotspotEur: TOUR360_EXTRA_HOTSPOT_EUR,
      extraCameraEur: TOUR360_EXTRA_CAMERA_EUR,
      assembly: {
        baseEur: TOUR_ASSEMBLY_BASE_EUR,
        freeHotspotThreshold: TOUR_ASSEMBLY_FREE_HOTSPOT_THRESHOLD,
        floorPlanNavEur: TOUR_FLOOR_PLAN_NAV_EUR,
        whiteLabelEur: TOUR_WHITE_LABEL_EUR,
      },
    },
    tourAssembly: {
      baseEur: TOUR_ASSEMBLY_BASE_EUR,
      freeHotspotThreshold: TOUR_ASSEMBLY_FREE_HOTSPOT_THRESHOLD,
      floorPlanNavEur: TOUR_FLOOR_PLAN_NAV_EUR,
      whiteLabelEur: TOUR_WHITE_LABEL_EUR,
    },
  },
};

export function getStaticPricingCatalog(): ResolvedPricingCatalog {
  return {
    bookId: null,
    name: "Hardkodovani cenovnik",
    status: "static",
    publishedAt: null,
    updatedAt: null,
    categories: decodePricingCatalog(encodePricingCatalog(CONFIGURATOR_CATEGORIES)),
    settings: normalizePricingSettings(DEFAULT_PRICING_SETTINGS),
  };
}

export function normalizePricingSettings(input: unknown): PricingSettings {
  const raw =
    input && typeof input === "object"
      ? (input as Partial<PricingSettings>)
      : {};
  const special: Partial<PricingSettings["specialPricing"]> =
    raw.specialPricing && typeof raw.specialPricing === "object"
      ? (raw.specialPricing as Partial<PricingSettings["specialPricing"]>)
      : {};
  const interior: Partial<PricingSettings["specialPricing"]["interior"]> =
    "interior" in special && special.interior
      ? special.interior
      : DEFAULT_PRICING_SETTINGS.specialPricing.interior;
  const tour360: Partial<PricingSettings["specialPricing"]["tour360"]> =
    "tour360" in special && special.tour360
      ? special.tour360
      : DEFAULT_PRICING_SETTINGS.specialPricing.tour360;
  const tourAssembly: Partial<
    PricingSettings["specialPricing"]["tourAssembly"]
  > =
    "tourAssembly" in special && special.tourAssembly
      ? special.tourAssembly
      : DEFAULT_PRICING_SETTINGS.specialPricing.tourAssembly;

  return {
    serbiaVatRate: nonNegativeNumber(
      raw.serbiaVatRate,
      DEFAULT_PRICING_SETTINGS.serbiaVatRate,
    ),
    aiCreditUnitsPerCredit: positiveInteger(
      raw.aiCreditUnitsPerCredit,
      DEFAULT_PRICING_SETTINGS.aiCreditUnitsPerCredit,
    ),
    aiCreditExpiresAfterMonths: positiveInteger(
      raw.aiCreditExpiresAfterMonths,
      DEFAULT_PRICING_SETTINGS.aiCreditExpiresAfterMonths,
    ),
    aiCreditTiers: normalizeAiCreditTiers(raw.aiCreditTiers),
    specialPricing: {
      interior: {
        firstFloorEur: positiveNumber(
          interior.firstFloorEur,
          DEFAULT_PRICING_SETTINGS.specialPricing.interior.firstFloorEur,
        ),
        extraFloorEur: positiveNumber(
          interior.extraFloorEur,
          DEFAULT_PRICING_SETTINGS.specialPricing.interior.extraFloorEur,
        ),
        includedRooms: nonNegativeInteger(
          interior.includedRooms,
          DEFAULT_PRICING_SETTINGS.specialPricing.interior.includedRooms,
        ),
        includedCameras: nonNegativeInteger(
          interior.includedCameras,
          DEFAULT_PRICING_SETTINGS.specialPricing.interior.includedCameras,
        ),
        extraRoomEur: positiveNumber(
          interior.extraRoomEur,
          DEFAULT_PRICING_SETTINGS.specialPricing.interior.extraRoomEur,
        ),
        extraCameraEur: positiveNumber(
          interior.extraCameraEur,
          DEFAULT_PRICING_SETTINGS.specialPricing.interior.extraCameraEur,
        ),
      },
      tour360: {
        firstFloorEur: positiveNumber(
          tour360.firstFloorEur,
          DEFAULT_PRICING_SETTINGS.specialPricing.tour360.firstFloorEur,
        ),
        extraFloorEur: positiveNumber(
          tour360.extraFloorEur,
          DEFAULT_PRICING_SETTINGS.specialPricing.tour360.extraFloorEur,
        ),
        includedHotspots: nonNegativeInteger(
          tour360.includedHotspots,
          DEFAULT_PRICING_SETTINGS.specialPricing.tour360.includedHotspots,
        ),
        includedCameras: nonNegativeInteger(
          tour360.includedCameras,
          DEFAULT_PRICING_SETTINGS.specialPricing.tour360.includedCameras,
        ),
        extraHotspotEur: positiveNumber(
          tour360.extraHotspotEur,
          DEFAULT_PRICING_SETTINGS.specialPricing.tour360.extraHotspotEur,
        ),
        extraCameraEur: positiveNumber(
          tour360.extraCameraEur,
          DEFAULT_PRICING_SETTINGS.specialPricing.tour360.extraCameraEur,
        ),
        assembly: {
          baseEur: nonNegativeNumber(
            tourAssembly.baseEur,
            DEFAULT_PRICING_SETTINGS.specialPricing.tourAssembly.baseEur,
          ),
          freeHotspotThreshold: nonNegativeInteger(
            tourAssembly.freeHotspotThreshold,
            DEFAULT_PRICING_SETTINGS.specialPricing.tourAssembly
              .freeHotspotThreshold,
          ),
          floorPlanNavEur: nonNegativeNumber(
            tourAssembly.floorPlanNavEur,
            DEFAULT_PRICING_SETTINGS.specialPricing.tourAssembly.floorPlanNavEur,
          ),
          whiteLabelEur: nonNegativeNumber(
            tourAssembly.whiteLabelEur,
            DEFAULT_PRICING_SETTINGS.specialPricing.tourAssembly.whiteLabelEur,
          ),
        },
      },
      tourAssembly: {
        baseEur: nonNegativeNumber(
          tourAssembly.baseEur,
          DEFAULT_PRICING_SETTINGS.specialPricing.tourAssembly.baseEur,
        ),
        freeHotspotThreshold: nonNegativeInteger(
          tourAssembly.freeHotspotThreshold,
          DEFAULT_PRICING_SETTINGS.specialPricing.tourAssembly
            .freeHotspotThreshold,
        ),
        floorPlanNavEur: nonNegativeNumber(
          tourAssembly.floorPlanNavEur,
          DEFAULT_PRICING_SETTINGS.specialPricing.tourAssembly.floorPlanNavEur,
        ),
        whiteLabelEur: nonNegativeNumber(
          tourAssembly.whiteLabelEur,
          DEFAULT_PRICING_SETTINGS.specialPricing.tourAssembly.whiteLabelEur,
        ),
      },
    },
  };
}

export function encodePricingCatalog(
  categories: ConfiguratorCategory[],
): unknown {
  return categories.map((category) => ({
    ...category,
    products: category.products.map(encodeProduct),
  }));
}

export function decodePricingCatalog(input: unknown): ConfiguratorCategory[] {
  if (!Array.isArray(input)) return CONFIGURATOR_CATEGORIES;
  return input.map((category) => {
    const raw = category as ConfiguratorCategory;
    return {
      ...raw,
      products: Array.isArray(raw.products)
        ? raw.products.map(decodeProduct)
        : [],
    };
  });
}

export function findProductInCatalog(
  productId: string,
  catalog?: ResolvedPricingCatalog | ConfiguratorCategory[],
): { category: ConfiguratorCategory; product: ConfiguratorProduct } | undefined {
  const categories = Array.isArray(catalog)
    ? catalog
    : catalog?.categories ?? CONFIGURATOR_CATEGORIES;
  for (const category of categories) {
    const product = category.products.find((item) => item.id === productId);
    if (product) return { category, product };
  }
  return undefined;
}

export function getPricingSettings(
  catalog?: ResolvedPricingCatalog,
): PricingSettings {
  return normalizePricingSettings(catalog?.settings);
}

function encodeProduct(product: ConfiguratorProduct): Record<string, unknown> {
  return {
    ...product,
    addOns: product.addOns.map((addOn) => ({
      ...addOn,
      maxQty: Number.isFinite(addOn.maxQty) ? addOn.maxQty : null,
    })),
    durationConfig: product.durationConfig
      ? {
          ...product.durationConfig,
          maxSeconds: Number.isFinite(product.durationConfig.maxSeconds)
            ? product.durationConfig.maxSeconds
            : null,
          discountTiers: product.durationConfig.discountTiers.map((tier) => ({
            ...tier,
            maxSec: Number.isFinite(tier.maxSec) ? tier.maxSec : null,
          })),
        }
      : undefined,
  };
}

function decodeProduct(product: ConfiguratorProduct): ConfiguratorProduct {
  return {
    ...product,
    addOns: Array.isArray(product.addOns)
      ? product.addOns.map((addOn) => ({
          ...addOn,
          maxQty:
            addOn.maxQty === null || addOn.maxQty === undefined
              ? Infinity
              : addOn.maxQty,
        }))
      : [],
    durationConfig: product.durationConfig
      ? {
          ...product.durationConfig,
          maxSeconds:
            product.durationConfig.maxSeconds === null ||
            product.durationConfig.maxSeconds === undefined
              ? Infinity
              : product.durationConfig.maxSeconds,
          discountTiers: product.durationConfig.discountTiers.map((tier) => ({
            ...tier,
            maxSec:
              tier.maxSec === null || tier.maxSec === undefined
                ? Infinity
                : tier.maxSec,
          })),
        }
      : undefined,
  };
}

function normalizeAiCreditTiers(input: unknown): AiCreditTier[] {
  const tiers = Array.isArray(input) ? input : DEFAULT_PRICING_SETTINGS.aiCreditTiers;
  const normalized = tiers
    .map((tier) => ({
      minCredits: positiveInteger(tier?.minCredits, 0),
      centsPerCredit: positiveInteger(tier?.centsPerCredit, 0),
    }))
    .filter((tier) => tier.minCredits > 0 && tier.centsPerCredit > 0)
    .sort((a, b) => b.minCredits - a.minCredits);
  return normalized.length > 0
    ? normalized
    : [...DEFAULT_PRICING_SETTINGS.aiCreditTiers];
}

function positiveNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function nonNegativeNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function positiveInteger(value: unknown, fallback: number): number {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function nonNegativeInteger(value: unknown, fallback: number): number {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}
