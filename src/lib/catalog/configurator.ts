/**
 * configurator.ts — Machine-readable pricing catalog for the order configurator.
 *
 * Exports ConfiguratorCategory[], ConfiguratorProduct, add-on types, and
 * getConfiguratorProduct() lookup. Drives the interactive pricing UI.
 *
 * Used by: catalog/calculate, quote-item, service-adder, quote-context
 */

// Source of truth: docs/pricing/pillar-1-extracted.md
// Public list amounts are stored in integer EUR (major units); *Cents
// twins are EUR cents. Buyer-currency display converts these at render time.

import type { ServiceIcon } from "./services";

// ─── Types ───────────────────────────────────────────────

export type ModelAsset =
  | "exterior-shell"
  | "interior-model"
  | "terrain-model"
  | "complete-model"
  | "tour-content";

export type ConsumeCondition = { type: "addOnAbsent"; addOnId: string };

export type ConsumeRule = {
  requires: ModelAsset;
  discountPct: number;
  reason: string;
  condition?: ConsumeCondition;
  // Optional whitelist of source product IDs. If set, the rule only
  // qualifies when a matching creator is in the order AND that creator's
  // productId is in this list. Used to scope "exterior-shell from Apartment"
  // differently from "exterior-shell from another ext-static render".
  sourceProducts?: string[];
};

export type VolumeRule = {
  afterQty: number;
  priceEur: number;
};

export type ConfiguratorAddOn = {
  id: string;
  label: string;
  description: string;
  priceEur: number;
  priceType: "fixed" | "percent";
  includedQty: number;
  maxQty: number;
  volumeRules: VolumeRule[];
};

export type DurationConfig = {
  minSeconds: number;
  defaultSeconds: number;
  maxSeconds: number;
  perSecondEur: number;
  discountTiers: Array<{
    minSec: number;
    maxSec: number;
    discountPct: number;
  }>;
};

// SourceModeOverride — fields that vary per source-mode for a single
// catalog product. Only `anim` uses this today (3 source modes:
// scratch / existing / active). The fields that differ across modes
// override the product's defaults; everything else (includes, addOns
// list, durationConfig tiers) is shared.
export type SourceModeOverride = {
  label?: string;
  unitLabel?: string;
  basePriceEur?: number;
  perSecondEur?: number;          // overrides durationConfig.perSecondEur
  creates?: ModelAsset[];
  consumes?: ConsumeRule[];
  addOnsAvailable?: string[];     // which addOn IDs are valid in this mode
  disclaimers?: string[];
};

export type ConfiguratorProduct = {
  id: string;
  label: string;
  basePriceEur: number;
  unitLabel: string;
  includes: string[];
  addOns: ConfiguratorAddOn[];
  durationConfig?: DurationConfig;
  disclaimers?: string[];
  creates?: ModelAsset[];
  consumes?: ConsumeRule[];
  // If set, the product has multiple source modes that override pricing /
  // dependencies / available add-ons. Resolver applies the override at
  // calc time given a QuoteItem.sourceMode.
  sourceModeRules?: Record<string, SourceModeOverride>;
  // If true, the product cannot be added to a cart and instead routes
  // to a consultation intake form (currently used for VR products that
  // require scope alignment before commitment).
  inquiryOnly?: boolean;
  // Presentation-only fields for the "per-render" entry card frame.
  // Invisible to calculateQuote / priceItems — they read only basePriceEur,
  // addOns, and durationConfig. Author per-product when a meaningful
  // unit price + package minimum exists (e.g. int-static: €17/render in a
  // 10-render package). Omit when the product is a single-unit entry.
  displayPerUnitEur?: number;
  displayMinQty?: number;
  displayUnitLabel?: string;
  displayPackageNote?: string;
};

export type ConfiguratorCategory = {
  id: string;
  label: string;
  sectionLabel: string;
  icon: ServiceIcon;
  description: string;
  products: ConfiguratorProduct[];
};

// ─── Animation duration discount tiers ───────────────────

export const ANIMATION_DURATION_TIERS: DurationConfig["discountTiers"] = [
  { minSec: 15, maxSec: 30, discountPct: 0 },
  { minSec: 31, maxSec: 60, discountPct: 10 },
  { minSec: 61, maxSec: 120, discountPct: 20 },
  { minSec: 121, maxSec: Infinity, discountPct: 25 },
];

// ─── Product & category data ─────────────────────────────

export const CONFIGURATOR_CATEGORIES: ConfiguratorCategory[] = [
  // ═══════════════════════════════════════════
  // 1.1 — EXTERIOR RENDERING
  // ═══════════════════════════════════════════
  {
    id: "exterior",
    label: "Exterior renders",
    sectionLabel: "1.1 — Rendering",
    icon: "grid",
    description:
      "Complete 3D exterior visualization — facades, materials, surroundings",
    products: [
      {
        id: "ext-static",
        creates: ["exterior-shell"],
        consumes: [
          { requires: "complete-model", discountPct: 50, reason: "Complete model already exists" },
          {
            requires: "exterior-shell",
            discountPct: 20,
            reason: "The basic building shape is already built in the site plan",
            sourceProducts: ["sp-first"],
          },
          {
            requires: "terrain-model",
            discountPct: 15,
            reason: "Surroundings already exist from the landscape render",
            sourceProducts: ["land-static"],
          },
        ],
        label: "Static exterior",
        basePriceEur: 250,
        unitLabel: "complete model + first shot",
        displayPerUnitEur: 125,
        displayUnitLabel: "render",
        displayPackageNote: "Package includes the 3D model and 2 shots. Each additional shot: €48.",
        includes: ["Full 3D model", "Scene and lighting", "2 shots included"],
        disclaimers: [
          "Additional geometry (+25%) is charged once if a shot requires an unseen side of the model",
        ],
        addOns: [
          {
            id: "ext-static-cam",
            label: "Additional shot",
            description: "New angle, same side of the model",
            priceEur: 48,
            priceType: "fixed",
            includedQty: 1,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "ext-static-extended",
            label: "Additional geometry (+25%)",
            description: "One-time surcharge for geometry on an unseen side (+25%)",
            priceEur: 63,
            priceType: "fixed",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
          {
            id: "ext-static-photo",
            label: "Photomontage (integration into a photograph)",
            description: "3D model composited into a site photograph — perspective analysis, camera and lighting matching",
            priceEur: 50,
            priceType: "fixed",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
        ],
      },
      {
        id: "ext-360",
        creates: ["exterior-shell"],
        consumes: [
          { requires: "exterior-shell", discountPct: 40, reason: "The model is already built for a previous render" },
          { requires: "complete-model", discountPct: 50, reason: "Complete model already exists" },
        ],
        label: "360 exterior",
        basePriceEur: 335,
        unitLabel: "complete model + VR output",
        displayPerUnitEur: 168,
        displayUnitLabel: "panorama",
        displayPackageNote: "Package includes the 3D model and 2 interactive points. Each additional one: €48.",
        includes: [
          "Full 3D model",
          "VR-ready 360 output",
          "2 interactive points included",
        ],
        disclaimers: [
          "The unseen-side surcharge (€60) is charged once if a point requires a view of a side that was not in the model",
        ],
        addOns: [
          {
            id: "ext-360-hotspot",
            label: "Interactive point (hotspot)",
            description: "New viewpoint in the 360 panorama",
            priceEur: 48,
            priceType: "fixed",
            includedQty: 1,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 4, priceEur: 53 }],
          },
          {
            id: "ext-360-extended",
            label: "Unseen-side surcharge",
            description:
              "One-time surcharge when a point requires a side of the model that was not previously modeled",
            priceEur: 60,
            priceType: "fixed",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
          {
            id: "ext-360-photo",
            label: "Photomontage (360 site panorama)",
            description: "Integrating the 3D model into a 360° panoramic photograph of the site",
            priceEur: 50,
            priceType: "fixed",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
        ],
      },
      {
        id: "ext-aerial",
        creates: ["exterior-shell"],
        consumes: [
          { requires: "exterior-shell", discountPct: 35, reason: "The model is already built for an exterior render" },
          { requires: "terrain-model", discountPct: 25, reason: "Surroundings already exist from the site plan or landscape render" },
          { requires: "complete-model", discountPct: 50, reason: "Complete model already exists" },
        ],
        label: "3D street and surroundings view",
        basePriceEur: 420,
        unitLabel: "model + surroundings + first angle",
        displayPerUnitEur: 210,
        displayUnitLabel: "render",
        displayPackageNote: "Package includes the 3D model, surroundings and 2 angles (street or aerial perspective). Each additional angle: €48.",
        includes: [
          "Full 3D model + surroundings",
          "Street or aerial perspective",
          "2 angles included",
        ],
        disclaimers: [
          "A surcharge (+25%) is charged once for showing the rear side",
        ],
        addOns: [
          {
            id: "ext-aerial-cam",
            label: "Additional angle",
            description: "New viewpoint (street or aerial)",
            priceEur: 48,
            priceType: "fixed",
            includedQty: 1,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "ext-aerial-extended",
            label: "Rear-side surcharge (+25%)",
            description: "One-time surcharge for showing the rear side (+25%)",
            priceEur: 105,
            priceType: "fixed",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 1.1 — INTERIOR RENDERING
  // ═══════════════════════════════════════════
  {
    id: "interior",
    label: "Interior renders",
    sectionLabel: "1.1 — Rendering",
    icon: "home",
    description:
      "Per-floor packages with unlimited cameras inside furnished rooms",
    products: [
      {
        id: "int-static",
        creates: ["interior-model"],
        consumes: [
          { requires: "complete-model", discountPct: 50, reason: "Complete model already exists" },
        ],
        label: "Classic interior render (per floor)",
        basePriceEur: 170,
        unitLabel: "entire floor with up to 10 rooms",
        displayPerUnitEur: 17,
        displayMinQty: 10,
        displayUnitLabel: "render",
        displayPackageNote: "package of 10 rooms, one floor",
        includes: [
          "10 furnished rooms",
          "unlimited camera angles",
          "floor plan",
        ],
        addOns: [
          {
            id: "int-static-room",
            label: "Additional furnished room (11th and beyond)",
            description: "Furnishing + render for an additional room",
            priceEur: 28,
            priceType: "fixed",
            includedQty: 10,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "int-static-cam",
            label: "Additional camera angle",
            description: "New camera angle in an already furnished room",
            priceEur: 10,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "int-static-floor",
            label: "Additional floor",
            description: "Same package, 30% cheaper",
            priceEur: 120,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
        ],
      },
      {
        id: "int-360",
        creates: ["interior-model", "tour-content"],
        consumes: [
          { requires: "interior-model", discountPct: 40, reason: "Interior model already exists" },
          { requires: "complete-model", discountPct: 50, reason: "Complete model already exists" },
        ],
        label: "360 interior (per floor)",
        basePriceEur: 295,
        unitLabel: "entire floor in a 360 tour",
        displayPerUnitEur: 30,
        displayMinQty: 10,
        displayUnitLabel: "panorama",
        displayPackageNote: "package of 10 panoramas, one floor",
        includes: [
          "10 interactive rooms in a 360 tour",
          "10 static camera angles",
          "floor plan",
        ],
        addOns: [
          {
            id: "int-360-room",
            label: "Interactive room (hotspot)",
            description: "Furnishing + 360 render for an additional room",
            priceEur: 45,
            priceType: "fixed",
            includedQty: 10,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "int-360-hotspot",
            label: "Additional point in an existing room",
            description: "New viewpoint in an already furnished room",
            priceEur: 27,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "int-360-static",
            label: "Static cameras",
            description: "Static angles in any room",
            priceEur: 10,
            priceType: "fixed",
            includedQty: 10,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "int-360-floor",
            label: "Additional floor (360)",
            description: "Same package, 30% cheaper",
            priceEur: 205,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 1.1 — LANDSCAPE RENDERING
  // ═══════════════════════════════════════════
  {
    id: "landscape",
    label: "Landscape renders",
    sectionLabel: "1.1 — Rendering",
    icon: "tree",
    description: "Gardens, parks, yards and urban spaces with terrain",
    products: [
      {
        id: "land-static",
        creates: ["terrain-model"],
        consumes: [
          { requires: "exterior-shell", discountPct: 25, reason: "Context already exists from the exterior render" },
          { requires: "terrain-model", discountPct: 40, reason: "Terrain already exists from the site plan" },
          { requires: "complete-model", discountPct: 50, reason: "Complete model already exists" },
        ],
        label: "Landscape render",
        basePriceEur: 220,
        unitLabel: "terrain + vegetation + first shot",
        displayPerUnitEur: 110,
        displayUnitLabel: "render",
        displayPackageNote: "Package includes terrain, vegetation and 2 shots. Each additional shot: €45.",
        includes: [
          "Terrain modeling",
          "Vegetation and planting",
          "2 shots included",
        ],
        disclaimers: [
          "Additional geometry (+25%) if new terrain/planting is needed",
        ],
        addOns: [
          {
            id: "land-cam",
            label: "Additional shot",
            description: "Model exists, new angle",
            priceEur: 45,
            priceType: "fixed",
            includedQty: 1,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "land-extended",
            label: "Additional geometry (+25%)",
            description: "Unseen terrain/planting needed (+25%, one-time)",
            priceEur: 55,
            priceType: "fixed",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
          {
            id: "land-aerial",
            label: "Aerial landscape view",
            description: "Complete aerial view of the surroundings",
            priceEur: 380,
            priceType: "fixed",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 1.2 — 3D FLOOR PLANS
  // ═══════════════════════════════════════════
  {
    id: "floorplans-3d",
    label: "3D floor plans",
    sectionLabel: "1.2 — Plans",
    icon: "grid",
    description: "Detailed 3D architectural plans with furniture",
    products: [
      {
        id: "fp3d-single",
        consumes: [
          { requires: "interior-model", discountPct: 70, reason: "The space is already modeled in the interior render" },
          { requires: "complete-model", discountPct: 70, reason: "The space is already modeled in the complete model" },
        ],
        label: "3D floor plan, single level",
        basePriceEur: 29,
        unitLabel: "single-level 3D layout",
        displayPerUnitEur: 29,
        displayUnitLabel: "level",
        includes: ["Complete floor layout", "Room labels", "Dimensions"],
        addOns: [
          {
            id: "fp3d-second",
            label: "Second level (duplex)",
            description: "Two-level layout in total",
            priceEur: 17,
            priceType: "fixed",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
          {
            id: "fp3d-extra",
            label: "Each additional level",
            description: "Style defined, layout only",
            priceEur: 15,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "fp3d-duplicate",
            label: "Floor duplicate",
            description: "Identical layout — a copy",
            priceEur: 10,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "fp3d-furniture",
            label: "Furniture overlay",
            description: "Furnished floor plan",
            priceEur: 8,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "fp3d-variant",
            label: "Design variant",
            description: "Same layout, different furniture",
            priceEur: 6,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 1.2 — 2D FLOOR PLANS (OUTSOURCED)
  // ═══════════════════════════════════════════
  {
    id: "floorplans-2d",
    label: "2D floor plans",
    sectionLabel: "1.2 — Plans",
    icon: "file-image",
    description: "Clean, colorized plans — partner network",
    products: [
      {
        id: "fp2d-single",
        consumes: [
          { requires: "interior-model", discountPct: 50, reason: "The layout is already defined in the interior model" },
        ],
        label: "2D floor plan, single level",
        basePriceEur: 20,
        unitLabel: "clean vector layout",
        displayPerUnitEur: 20,
        displayUnitLabel: "level",
        includes: ["Clean vector layout", "Room labels", "Color coding"],
        addOns: [
          {
            id: "fp2d-double",
            label: "Duplex (two levels)",
            description: "Structure carries over",
            priceEur: 12,
            priceType: "fixed",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
          {
            id: "fp2d-extra",
            label: "Each additional level",
            description: "Template defined",
            priceEur: 10,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "fp2d-duplicate",
            label: "Floor duplicate",
            description: "Copy with label changes",
            priceEur: 6,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "fp2d-furnished",
            label: "Furnished plan",
            description: "Furniture overlay",
            priceEur: 6,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "fp2d-variant",
            label: "Color/style variant",
            description: "Palette change",
            priceEur: 4,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 1.2 — 3D SITE PLANS
  // ═══════════════════════════════════════════
  {
    id: "siteplans",
    label: "3D site plans",
    sectionLabel: "1.2 — Plans",
    icon: "layers",
    description:
      "Photorealistic views of entire sites with landscaping and context",
    products: [
      {
        id: "sp-first",
        creates: ["terrain-model", "exterior-shell"],
        consumes: [
          { requires: "exterior-shell", discountPct: 30, reason: "The model is already built for an exterior render" },
          { requires: "terrain-model", discountPct: 40, reason: "Terrain already exists from the landscape render" },
          { requires: "complete-model", discountPct: 35, reason: "Complete model already exists" },
        ],
        label: "3D site plan",
        basePriceEur: 350,
        unitLabel: "terrain + buildings + landscaping",
        displayPerUnitEur: 350,
        displayUnitLabel: "site plan",
        displayPackageNote: "includes terrain, buildings and landscaping; additional angles €65",
        includes: [
          "Terrain modeling",
          "Building placement",
          "Landscaping and roads",
        ],
        addOns: [
          {
            id: "sp-angle",
            label: "Additional angle",
            description: "Model exists, new viewpoint",
            priceEur: 65,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "sp-season",
            label: "Seasonal variant",
            description: "Vegetation + lighting",
            priceEur: 85,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "sp-phase",
            label: "Phase variant",
            description: "View by construction phase — visible parts are selected",
            priceEur: 95,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 1.3 — 3D ANIMATION
  // ═══════════════════════════════════════════
  {
    id: "animation",
    label: "3D animation",
    sectionLabel: "1.3 — Animation and immersion",
    icon: "camera",
    description: "Cinematic flythrough and walkthrough — minimum 15 seconds",
    products: [
      {
        // Single consolidated animation product. Source mode (scratch /
        // existing / active) is stored on QuoteItem.sourceMode and the
        // configurator UI exposes it as a 3-way picker. Catalog defaults
        // here describe the "scratch" mode; sourceModeRules below override
        // pricing / dependencies / addOn availability for the other modes.
        id: "anim",
        creates: ["complete-model"],
        consumes: [
          { requires: "exterior-shell", discountPct: 33, reason: "The exterior is already built in the model" },
          { requires: "interior-model", discountPct: 33, reason: "The interior is already built in the model" },
          { requires: "terrain-model", discountPct: 20, reason: "Terrain already exists from the site plan" },
        ],
        label: "Animation (from scratch)",
        basePriceEur: 15,
        unitLabel: "€15/sec, minimum 15 sec (€225)",
        displayPerUnitEur: 15,
        displayMinQty: 15,
        displayUnitLabel: "second",
        displayPackageNote: "minimum 15 seconds (€225)",
        includes: [
          "Full 3D model",
          "Animation path design",
          "Rendering",
          "Min. 15 seconds",
        ],
        durationConfig: {
          minSeconds: 15,
          defaultSeconds: 15,
          maxSeconds: 300,
          perSecondEur: 15,
          discountTiers: ANIMATION_DURATION_TIERS,
        },
        addOns: [
          {
            id: "anim-path",
            label: "Additional camera path",
            description: "New trajectory, same model — €5/sec",
            priceEur: 5,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "anim-daynight",
            label: "Day/night version",
            description: "Lighting rework + render",
            priceEur: 30,
            priceType: "percent",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
          {
            id: "anim-season",
            label: "Seasonal variation",
            description: "Environment/material changes",
            priceEur: 40,
            priceType: "percent",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
        ],
        sourceModeRules: {
          scratch: {
            label: "Animation (from scratch)",
            unitLabel: "€15/sec, minimum 15 sec (€225)",
            // scratch mode uses defaults — no overrides needed,
            // but kept here so the resolver can detect the mode.
            addOnsAvailable: ["anim-path", "anim-daynight", "anim-season"],
          },
          existing: {
            label: "Animation (existing model)",
            unitLabel: "€10/sec, minimum 15 sec (€150) — 33% discount",
            basePriceEur: 10,
            perSecondEur: 10,
            // existing mode does NOT create complete-model (it reuses one)
            creates: [],
            consumes: [
              { requires: "exterior-shell", discountPct: 33, reason: "The exterior is already built in the model" },
              { requires: "interior-model", discountPct: 33, reason: "The interior is already built in the model" },
              { requires: "complete-model", discountPct: 47, reason: "Complete model already exists" },
            ],
            addOnsAvailable: ["anim-path", "anim-daynight"],
          },
          active: {
            label: "Animation (active project)",
            unitLabel: "€8/sec, minimum 15 sec (€120) — 47% discount",
            basePriceEur: 8,
            perSecondEur: 8,
            creates: [],
            consumes: [
              { requires: "complete-model", discountPct: 47, reason: "Complete model already exists" },
            ],
            disclaimers: [
              "Available only to clients with an active rendering project",
            ],
            addOnsAvailable: ["anim-path"],
          },
        },
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 1.3 — VR EXPERIENCES (OUTSOURCED)
  // ═══════════════════════════════════════════
  {
    id: "vr-experiences",
    label: "VR experiences",
    sectionLabel: "1.3 — Animation and immersion",
    icon: "camera",
    description:
      "Immersive VR experiences for Meta Quest and similar headsets — partner network",
    products: [
      {
        id: "vr-existing",
        inquiryOnly: true,
        consumes: [
          { requires: "exterior-shell", discountPct: 50, reason: "The exterior is already built in the model" },
          { requires: "interior-model", discountPct: 50, reason: "The interior is already built in the model" },
          { requires: "complete-model", discountPct: 50, reason: "Complete model already exists" },
        ],
        label: "VR walkthrough (existing model)",
        basePriceEur: 1500,
        unitLabel: "From €1500 — consultation before production",
        includes: [
          "VR optimization",
          "Headset-ready output",
          "Navigation system",
        ],
        disclaimers: ["Delivered through our partner network"],
        addOns: [
          {
            id: "vr-existing-floor",
            label: "Additional floor/area",
            description: "Incremental addition to the existing VR",
            priceEur: 500,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "vr-existing-interactive",
            label: "Interactive element",
            description: "Per interaction type (doors, lights, materials)",
            priceEur: 200,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
        ],
      },
      {
        id: "vr-standalone",
        inquiryOnly: true,
        creates: ["complete-model"],
        consumes: [
          { requires: "exterior-shell", discountPct: 50, reason: "The exterior is already built in the model" },
          { requires: "interior-model", discountPct: 50, reason: "The interior is already built in the model" },
          { requires: "complete-model", discountPct: 50, reason: "Complete model already exists" },
        ],
        label: "VR walkthrough (standalone)",
        basePriceEur: 3000,
        unitLabel: "From €3000 — consultation before production",
        includes: [
          "Complete 3D model",
          "VR optimization",
          "Headset-ready output",
          "Navigation system",
        ],
        disclaimers: ["Delivered through our partner network"],
        addOns: [
          {
            id: "vr-standalone-floor",
            label: "Additional floor/area",
            description: "Incremental addition",
            priceEur: 500,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "vr-standalone-interactive",
            label: "Interactive element",
            description: "Per interaction type (doors, lights, materials)",
            priceEur: 200,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 1.4 — VIRTUAL STAGING
  // ═══════════════════════════════════════════
  {
    id: "staging",
    label: "Virtual staging",
    sectionLabel: "1.4 — Transformation",
    icon: "sparkles",
    description: "Photorealistic staging of empty spaces",
    products: [
      {
        id: "vs-static",
        label: "Static staging",
        basePriceEur: 18,
        unitLabel: "first staged image",
        displayPerUnitEur: 18,
        displayUnitLabel: "image",
        includes: [
          "Room analysis",
          "Furniture selection and placement",
          "Lighting adjustment",
        ],
        addOns: [
          {
            id: "vs-angle",
            label: "Additional angle (same room)",
            description: "33% discount — staging decisions made",
            priceEur: 12,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "vs-room",
            label: "Another room (same property)",
            description: "17% discount — style defined",
            priceEur: 15,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 10, priceEur: 13 }],
          },
          {
            id: "vs-restyle",
            label: "Restaging (different style)",
            description: "Furniture swap, composition already solved",
            priceEur: 12,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
        ],
      },
      {
        id: "vs-360",
        label: "Interactive 360 staging",
        basePriceEur: 34,
        unitLabel: "first staged 360 panorama",
        displayPerUnitEur: 34,
        displayUnitLabel: "panorama",
        includes: [
          "Complete 360 room staging",
          "Furniture selection",
          "Lighting adjustment",
        ],
        addOns: [
          {
            id: "vs-360-hotspot",
            label: "Additional point in the same room",
            description: "30% discount — staging already exists",
            priceEur: 24,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "vs-360-room",
            label: "Another room (same property)",
            description: "18% discount — style defined",
            priceEur: 28,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 6, priceEur: 24 }],
          },
          {
            id: "vs-360-restyle",
            label: "Restaging (different style)",
            description: "Style swap only",
            priceEur: 22,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 1.4 — VIRTUAL RENOVATION
  // ═══════════════════════════════════════════
  {
    id: "renovation",
    label: "Virtual renovation",
    sectionLabel: "1.4 — Transformation",
    icon: "refresh",
    description: "Transforming existing spaces with a new design",
    products: [
      {
        id: "reno-image",
        label: "Virtual renovation",
        basePriceEur: 66,
        unitLabel: "complete renovation of one view",
        displayPerUnitEur: 66,
        displayUnitLabel: "view",
        includes: [
          "Complete renovation design",
          "Material selection",
          "1 rendered view",
        ],
        addOns: [
          {
            id: "reno-angle",
            label: "Additional angle (same room)",
            description: "10% discount — decisions made, new camera",
            priceEur: 59,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 3, priceEur: 53 }],
          },
          {
            id: "reno-room",
            label: "Another room (same property)",
            description: "15% discount — palette defined",
            priceEur: 56,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 5, priceEur: 50 }],
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 1.4 — DAY-TO-DUSK (OUTSOURCED)
  // ═══════════════════════════════════════════
  {
    id: "day-to-dusk",
    label: "Day-to-dusk",
    sectionLabel: "1.4 — Transformation",
    icon: "sun",
    description: "Transforming daylight photographs into dramatic dusk scenes",
    products: [
      {
        id: "dtd-image",
        label: "Day-to-dusk conversion",
        basePriceEur: 10,
        unitLabel: "per image",
        displayPerUnitEur: 10,
        displayUnitLabel: "image",
        includes: ["Sky replacement", "Lighting adjustment", "Color grading"],
        addOns: [
          {
            id: "dtd-shadow",
            label: "Shadow removal",
            description: "Complex shadow correction",
            priceEur: 5,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "dtd-volume",
            label: "Additional images (10+)",
            description: "Reduced price for larger volumes",
            priceEur: 8,
            priceType: "fixed",
            includedQty: 1,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 10, priceEur: 8 }],
          },
          {
            id: "dtd-rush",
            label: "Rush delivery (24h)",
            description: "Priority processing",
            priceEur: 50,
            priceType: "percent",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 1.4 — ITEM REMOVAL
  // ═══════════════════════════════════════════
  {
    id: "item-removal",
    label: "Item removal",
    sectionLabel: "1.4 — Transformation",
    icon: "eraser",
    description:
      "Digital cleanup — removing personal items, clutter and unwanted objects",
    products: [
      {
        id: "ir-simple",
        label: "Simple removal",
        basePriceEur: 12,
        unitLabel: "per image",
        displayPerUnitEur: 12,
        displayUnitLabel: "image",
        includes: [
          "Item identification",
          "Clean removal",
          "Background reconstruction",
        ],
        addOns: [
          {
            id: "ir-simple-additional",
            label: "Additional image (simple)",
            description: "33% discount — style defined",
            priceEur: 8,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 10, priceEur: 10 }],
          },
        ],
      },
      {
        id: "ir-complex",
        label: "Complex removal",
        basePriceEur: 25,
        unitLabel: "per image",
        displayPerUnitEur: 25,
        displayUnitLabel: "image",
        includes: [
          "Large item removal",
          "Background reconstruction",
          "Detail restoration",
        ],
        addOns: [
          {
            id: "ir-complex-additional",
            label: "Additional image (complex)",
            description: "28% discount — approach defined",
            priceEur: 18,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 10, priceEur: 20 }],
          },
        ],
      },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────

export function getConfiguratorProduct(
  productId: string,
  categories: ConfiguratorCategory[] = CONFIGURATOR_CATEGORIES,
): { category: ConfiguratorCategory; product: ConfiguratorProduct } | undefined {
  for (const cat of categories) {
    for (const prod of cat.products) {
      if (prod.id === productId) return { category: cat, product: prod };
    }
  }
  return undefined;
}

// Resolver that applies SourceModeOverride to a product. Use when pricing
// or rendering an item that may have a sourceMode (currently only `anim`).
// Returns the same shape as `getConfiguratorProduct` so call sites can
// switch over without other changes.
export function getEffectiveProduct(
  productId: string,
  sourceMode: string | null | undefined,
  categories: ConfiguratorCategory[] = CONFIGURATOR_CATEGORIES,
): { category: ConfiguratorCategory; product: ConfiguratorProduct } | undefined {
  const result = getConfiguratorProduct(productId, categories);
  if (!result) return undefined;
  if (!result.product.sourceModeRules || !sourceMode) return result;
  const override = result.product.sourceModeRules[sourceMode];
  if (!override) return result;

  const product = result.product;
  const mergedDuration = product.durationConfig
    ? {
        ...product.durationConfig,
        perSecondEur:
          override.perSecondEur ?? product.durationConfig.perSecondEur,
      }
    : undefined;

  const merged: ConfiguratorProduct = {
    ...product,
    label: override.label ?? product.label,
    unitLabel: override.unitLabel ?? product.unitLabel,
    basePriceEur: override.basePriceEur ?? product.basePriceEur,
    creates: override.creates ?? product.creates,
    consumes: override.consumes ?? product.consumes,
    disclaimers: override.disclaimers ?? product.disclaimers,
    durationConfig: mergedDuration,
    addOns: override.addOnsAvailable
      ? product.addOns.filter((a) =>
          override.addOnsAvailable!.includes(a.id),
        )
      : product.addOns,
  };
  return { category: result.category, product: merged };
}

export function getAddOnDef(
  productId: string,
  addOnId: string,
  categories: ConfiguratorCategory[] = CONFIGURATOR_CATEGORIES,
): ConfiguratorAddOn | undefined {
  const result = getConfiguratorProduct(productId, categories);
  if (!result) return undefined;
  return result.product.addOns.find((ao) => ao.id === addOnId);
}
