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
    label: "Rendus d’extérieur",
    sectionLabel: "1.1 — Rendu",
    icon: "grid",
    description:
      "Visualisation 3D extérieure complète — façades, matériaux, environnement",
    products: [
      {
        id: "ext-static",
        creates: ["exterior-shell"],
        consumes: [
          { requires: "complete-model", discountPct: 50, reason: "Le modèle complet existe déjà" },
          {
            requires: "exterior-shell",
            discountPct: 20,
            reason: "Le volume de base du bâtiment est déjà construit dans le plan de masse",
            sourceProducts: ["sp-first"],
          },
          {
            requires: "terrain-model",
            discountPct: 15,
            reason: "Les environs existent déjà grâce au rendu paysager",
            sourceProducts: ["land-static"],
          },
        ],
        label: "Extérieur statique",
        basePriceEur: 250,
        unitLabel: "modèle complet + première vue",
        displayPerUnitEur: 125,
        displayUnitLabel: "rendu",
        displayPackageNote: "Le forfait comprend le modèle 3D et 2 vues. Chaque vue supplémentaire : €48.",
        includes: ["Modèle 3D complet", "Scène et éclairage", "2 vues incluses"],
        disclaimers: [
          "La géométrie supplémentaire (+25 %) est facturée une seule fois si une vue nécessite un côté non visible du modèle",
        ],
        addOns: [
          {
            id: "ext-static-cam",
            label: "Vue supplémentaire",
            description: "Nouvel angle, même côté du modèle",
            priceEur: 48,
            priceType: "fixed",
            includedQty: 1,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "ext-static-extended",
            label: "Géométrie supplémentaire (+25 %)",
            description: "Supplément unique pour la géométrie d’un côté non visible (+25 %)",
            priceEur: 63,
            priceType: "fixed",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
          {
            id: "ext-static-photo",
            label: "Photomontage (intégration dans une photographie)",
            description: "Modèle 3D intégré dans une photographie du site — analyse de perspective, correspondance de caméra et d’éclairage",
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
          { requires: "exterior-shell", discountPct: 40, reason: "Le modèle est déjà construit pour un rendu précédent" },
          { requires: "complete-model", discountPct: 50, reason: "Le modèle complet existe déjà" },
        ],
        label: "Extérieur 360",
        basePriceEur: 335,
        unitLabel: "modèle complet + sortie VR",
        displayPerUnitEur: 168,
        displayUnitLabel: "panorama",
        displayPackageNote: "Le forfait comprend le modèle 3D et 2 points interactifs. Chaque point supplémentaire : €48.",
        includes: [
          "Modèle 3D complet",
          "Sortie 360 compatible VR",
          "2 points interactifs inclus",
        ],
        disclaimers: [
          "Le supplément côté non visible (€60) est facturé une seule fois si un point nécessite la vue d’un côté absent du modèle",
        ],
        addOns: [
          {
            id: "ext-360-hotspot",
            label: "Point interactif (hotspot)",
            description: "Nouveau point de vue dans le panorama 360",
            priceEur: 48,
            priceType: "fixed",
            includedQty: 1,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 4, priceEur: 53 }],
          },
          {
            id: "ext-360-extended",
            label: "Supplément côté non visible",
            description:
              "Supplément unique lorsqu’un point nécessite un côté du modèle qui n’était pas encore modélisé",
            priceEur: 60,
            priceType: "fixed",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
          {
            id: "ext-360-photo",
            label: "Photomontage (panorama 360 du site)",
            description: "Intégration du modèle 3D dans une photographie panoramique 360° du site",
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
          { requires: "exterior-shell", discountPct: 35, reason: "Le modèle est déjà construit pour un rendu d’extérieur" },
          { requires: "terrain-model", discountPct: 25, reason: "Les environs existent déjà grâce au plan de masse ou au rendu paysager" },
          { requires: "complete-model", discountPct: 50, reason: "Le modèle complet existe déjà" },
        ],
        label: "Vue 3D de la rue et des environs",
        basePriceEur: 420,
        unitLabel: "modèle + environs + premier angle",
        displayPerUnitEur: 210,
        displayUnitLabel: "rendu",
        displayPackageNote: "Le forfait comprend le modèle 3D, les environs et 2 angles (perspective de rue ou aérienne). Chaque angle supplémentaire : €48.",
        includes: [
          "Modèle 3D complet + environs",
          "Perspective de rue ou aérienne",
          "2 angles inclus",
        ],
        disclaimers: [
          "Un supplément (+25 %) est facturé une seule fois pour montrer la face arrière",
        ],
        addOns: [
          {
            id: "ext-aerial-cam",
            label: "Angle supplémentaire",
            description: "Nouveau point de vue (rue ou aérien)",
            priceEur: 48,
            priceType: "fixed",
            includedQty: 1,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "ext-aerial-extended",
            label: "Supplément face arrière (+25 %)",
            description: "Supplément unique pour montrer la face arrière (+25 %)",
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
    label: "Rendus d’intérieur",
    sectionLabel: "1.1 — Rendu",
    icon: "home",
    description:
      "Forfaits par niveau avec caméras illimitées dans des pièces meublées",
    products: [
      {
        id: "int-static",
        creates: ["interior-model"],
        consumes: [
          { requires: "complete-model", discountPct: 50, reason: "Le modèle complet existe déjà" },
        ],
        label: "Rendu d’intérieur classique (par niveau)",
        basePriceEur: 170,
        unitLabel: "niveau entier, jusqu’à 10 pièces",
        displayPerUnitEur: 17,
        displayMinQty: 10,
        displayUnitLabel: "rendu",
        displayPackageNote: "forfait de 10 pièces, un niveau",
        includes: [
          "10 pièces meublées",
          "angles de caméra illimités",
          "plan du niveau",
        ],
        addOns: [
          {
            id: "int-static-room",
            label: "Pièce meublée supplémentaire (à partir de la 11e)",
            description: "Ameublement + rendu pour une pièce supplémentaire",
            priceEur: 28,
            priceType: "fixed",
            includedQty: 10,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "int-static-cam",
            label: "Angle de caméra supplémentaire",
            description: "Nouvel angle de caméra dans une pièce déjà meublée",
            priceEur: 10,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "int-static-floor",
            label: "Niveau supplémentaire",
            description: "Même forfait, 30 % moins cher",
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
          { requires: "interior-model", discountPct: 40, reason: "Le modèle d’intérieur existe déjà" },
          { requires: "complete-model", discountPct: 50, reason: "Le modèle complet existe déjà" },
        ],
        label: "Intérieur 360 (par niveau)",
        basePriceEur: 295,
        unitLabel: "niveau entier en visite 360",
        displayPerUnitEur: 30,
        displayMinQty: 10,
        displayUnitLabel: "panorama",
        displayPackageNote: "forfait de 10 panoramas, un niveau",
        includes: [
          "10 pièces interactives en visite 360",
          "10 angles de caméra statiques",
          "plan du niveau",
        ],
        addOns: [
          {
            id: "int-360-room",
            label: "Pièce interactive (hotspot)",
            description: "Ameublement + rendu 360 pour une pièce supplémentaire",
            priceEur: 45,
            priceType: "fixed",
            includedQty: 10,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "int-360-hotspot",
            label: "Point supplémentaire dans une pièce existante",
            description: "Nouveau point de vue dans une pièce déjà meublée",
            priceEur: 27,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "int-360-static",
            label: "Caméras statiques",
            description: "Angles statiques dans n’importe quelle pièce",
            priceEur: 10,
            priceType: "fixed",
            includedQty: 10,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "int-360-floor",
            label: "Niveau supplémentaire (360)",
            description: "Même forfait, 30 % moins cher",
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
    label: "Rendus paysagers",
    sectionLabel: "1.1 — Rendu",
    icon: "tree",
    description: "Jardins, parcs, cours et espaces urbains avec terrain",
    products: [
      {
        id: "land-static",
        creates: ["terrain-model"],
        consumes: [
          { requires: "exterior-shell", discountPct: 25, reason: "Le contexte existe déjà grâce au rendu d’extérieur" },
          { requires: "terrain-model", discountPct: 40, reason: "Le terrain existe déjà grâce au plan de masse" },
          { requires: "complete-model", discountPct: 50, reason: "Le modèle complet existe déjà" },
        ],
        label: "Rendu paysager",
        basePriceEur: 220,
        unitLabel: "terrain + végétation + première vue",
        displayPerUnitEur: 110,
        displayUnitLabel: "rendu",
        displayPackageNote: "Le forfait comprend le terrain, la végétation et 2 vues. Chaque vue supplémentaire : €45.",
        includes: [
          "Modélisation du terrain",
          "Végétation et plantations",
          "2 vues incluses",
        ],
        disclaimers: [
          "Géométrie supplémentaire (+25 %) si un nouveau terrain ou de nouvelles plantations sont nécessaires",
        ],
        addOns: [
          {
            id: "land-cam",
            label: "Vue supplémentaire",
            description: "Le modèle existe, nouvel angle",
            priceEur: 45,
            priceType: "fixed",
            includedQty: 1,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "land-extended",
            label: "Géométrie supplémentaire (+25 %)",
            description: "Terrain/plantations non visibles nécessaires (+25 %, une seule fois)",
            priceEur: 55,
            priceType: "fixed",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
          {
            id: "land-aerial",
            label: "Vue paysagère aérienne",
            description: "Vue aérienne complète des environs",
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
    label: "Plans 3D",
    sectionLabel: "1.2 — Plans",
    icon: "grid",
    description: "Plans architecturaux 3D détaillés avec mobilier",
    products: [
      {
        id: "fp3d-single",
        consumes: [
          { requires: "interior-model", discountPct: 70, reason: "L’espace est déjà modélisé dans le rendu d’intérieur" },
          { requires: "complete-model", discountPct: 70, reason: "L’espace est déjà modélisé dans le modèle complet" },
        ],
        label: "Plan 3D, un seul niveau",
        basePriceEur: 29,
        unitLabel: "plan 3D sur un seul niveau",
        displayPerUnitEur: 29,
        displayUnitLabel: "niveau",
        includes: ["Plan complet du niveau", "Libellés des pièces", "Dimensions"],
        addOns: [
          {
            id: "fp3d-second",
            label: "Deuxième niveau (duplex)",
            description: "Plan sur deux niveaux au total",
            priceEur: 17,
            priceType: "fixed",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
          {
            id: "fp3d-extra",
            label: "Chaque niveau supplémentaire",
            description: "Style défini, plan uniquement",
            priceEur: 15,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "fp3d-duplicate",
            label: "Duplication de niveau",
            description: "Plan identique — une copie",
            priceEur: 10,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "fp3d-furniture",
            label: "Ajout du mobilier",
            description: "Plan de niveau meublé",
            priceEur: 8,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "fp3d-variant",
            label: "Variante de design",
            description: "Même plan, mobilier différent",
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
    label: "Plans 2D",
    sectionLabel: "1.2 — Plans",
    icon: "file-image",
    description: "Plans épurés et colorisés — réseau de partenaires",
    products: [
      {
        id: "fp2d-single",
        consumes: [
          { requires: "interior-model", discountPct: 50, reason: "Le plan est déjà défini dans le modèle d’intérieur" },
        ],
        label: "Plan 2D, un seul niveau",
        basePriceEur: 20,
        unitLabel: "plan vectoriel épuré",
        displayPerUnitEur: 20,
        displayUnitLabel: "niveau",
        includes: ["Plan vectoriel épuré", "Libellés des pièces", "Code couleur"],
        addOns: [
          {
            id: "fp2d-double",
            label: "Duplex (deux niveaux)",
            description: "La structure est reprise",
            priceEur: 12,
            priceType: "fixed",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
          {
            id: "fp2d-extra",
            label: "Chaque niveau supplémentaire",
            description: "Gabarit défini",
            priceEur: 10,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "fp2d-duplicate",
            label: "Duplication de niveau",
            description: "Copie avec modification des libellés",
            priceEur: 6,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "fp2d-furnished",
            label: "Plan meublé",
            description: "Ajout du mobilier",
            priceEur: 6,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "fp2d-variant",
            label: "Variante de couleur/style",
            description: "Changement de palette",
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
    label: "Plans de masse 3D",
    sectionLabel: "1.2 — Plans",
    icon: "layers",
    description:
      "Vues photoréalistes de sites entiers avec aménagement paysager et contexte",
    products: [
      {
        id: "sp-first",
        creates: ["terrain-model", "exterior-shell"],
        consumes: [
          { requires: "exterior-shell", discountPct: 30, reason: "Le modèle est déjà construit pour un rendu d’extérieur" },
          { requires: "terrain-model", discountPct: 40, reason: "Le terrain existe déjà grâce au rendu paysager" },
          { requires: "complete-model", discountPct: 35, reason: "Le modèle complet existe déjà" },
        ],
        label: "Plan de masse 3D",
        basePriceEur: 350,
        unitLabel: "terrain + bâtiments + aménagement paysager",
        displayPerUnitEur: 350,
        displayUnitLabel: "plan de masse",
        displayPackageNote: "comprend le terrain, les bâtiments et l’aménagement paysager ; angles supplémentaires €65",
        includes: [
          "Modélisation du terrain",
          "Implantation des bâtiments",
          "Aménagement paysager et voirie",
        ],
        addOns: [
          {
            id: "sp-angle",
            label: "Angle supplémentaire",
            description: "Le modèle existe, nouveau point de vue",
            priceEur: 65,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "sp-season",
            label: "Variante saisonnière",
            description: "Végétation + éclairage",
            priceEur: 85,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "sp-phase",
            label: "Variante par phase",
            description: "Vue par phase de construction — les parties visibles sont sélectionnées",
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
    label: "Animation 3D",
    sectionLabel: "1.3 — Animation et immersion",
    icon: "camera",
    description: "Survol et visite cinématiques — minimum 15 secondes",
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
          { requires: "exterior-shell", discountPct: 33, reason: "L’extérieur est déjà construit dans le modèle" },
          { requires: "interior-model", discountPct: 33, reason: "L’intérieur est déjà construit dans le modèle" },
          { requires: "terrain-model", discountPct: 20, reason: "Le terrain existe déjà grâce au plan de masse" },
        ],
        label: "Animation (à partir de zéro)",
        basePriceEur: 15,
        unitLabel: "€15/sec, minimum 15 sec (€225)",
        displayPerUnitEur: 15,
        displayMinQty: 15,
        displayUnitLabel: "seconde",
        displayPackageNote: "minimum 15 secondes (€225)",
        includes: [
          "Modèle 3D complet",
          "Conception du parcours d’animation",
          "Rendu",
          "Min. 15 secondes",
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
            label: "Parcours de caméra supplémentaire",
            description: "Nouvelle trajectoire, même modèle — €5/sec",
            priceEur: 5,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "anim-daynight",
            label: "Version jour/nuit",
            description: "Reprise de l’éclairage + rendu",
            priceEur: 30,
            priceType: "percent",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
          {
            id: "anim-season",
            label: "Variation saisonnière",
            description: "Modification de l’environnement et des matériaux",
            priceEur: 40,
            priceType: "percent",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
        ],
        sourceModeRules: {
          scratch: {
            label: "Animation (à partir de zéro)",
            unitLabel: "€15/sec, minimum 15 sec (€225)",
            // scratch mode uses defaults — no overrides needed,
            // but kept here so the resolver can detect the mode.
            addOnsAvailable: ["anim-path", "anim-daynight", "anim-season"],
          },
          existing: {
            label: "Animation (modèle existant)",
            unitLabel: "€10/sec, minimum 15 sec (€150) — remise de 33 %",
            basePriceEur: 10,
            perSecondEur: 10,
            // existing mode does NOT create complete-model (it reuses one)
            creates: [],
            consumes: [
              { requires: "exterior-shell", discountPct: 33, reason: "L’extérieur est déjà construit dans le modèle" },
              { requires: "interior-model", discountPct: 33, reason: "L’intérieur est déjà construit dans le modèle" },
              { requires: "complete-model", discountPct: 47, reason: "Le modèle complet existe déjà" },
            ],
            addOnsAvailable: ["anim-path", "anim-daynight"],
          },
          active: {
            label: "Animation (projet en cours)",
            unitLabel: "€8/sec, minimum 15 sec (€120) — remise de 47 %",
            basePriceEur: 8,
            perSecondEur: 8,
            creates: [],
            consumes: [
              { requires: "complete-model", discountPct: 47, reason: "Le modèle complet existe déjà" },
            ],
            disclaimers: [
              "Réservé aux clients ayant un projet de rendu en cours",
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
    label: "Expériences VR",
    sectionLabel: "1.3 — Animation et immersion",
    icon: "camera",
    description:
      "Expériences VR immersives pour Meta Quest et casques similaires — réseau de partenaires",
    products: [
      {
        id: "vr-existing",
        inquiryOnly: true,
        consumes: [
          { requires: "exterior-shell", discountPct: 50, reason: "L’extérieur est déjà construit dans le modèle" },
          { requires: "interior-model", discountPct: 50, reason: "L’intérieur est déjà construit dans le modèle" },
          { requires: "complete-model", discountPct: 50, reason: "Le modèle complet existe déjà" },
        ],
        label: "Visite VR (modèle existant)",
        basePriceEur: 1500,
        unitLabel: "Dès €1500 — consultation avant production",
        includes: [
          "Optimisation VR",
          "Sortie prête pour casque VR",
          "Système de navigation",
        ],
        disclaimers: ["Réalisé via notre réseau de partenaires"],
        addOns: [
          {
            id: "vr-existing-floor",
            label: "Niveau/zone supplémentaire",
            description: "Ajout progressif à la VR existante",
            priceEur: 500,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "vr-existing-interactive",
            label: "Élément interactif",
            description: "Par type d’interaction (portes, éclairages, matériaux)",
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
          { requires: "exterior-shell", discountPct: 50, reason: "L’extérieur est déjà construit dans le modèle" },
          { requires: "interior-model", discountPct: 50, reason: "L’intérieur est déjà construit dans le modèle" },
          { requires: "complete-model", discountPct: 50, reason: "Le modèle complet existe déjà" },
        ],
        label: "Visite VR (autonome)",
        basePriceEur: 3000,
        unitLabel: "Dès €3000 — consultation avant production",
        includes: [
          "Modèle 3D complet",
          "Optimisation VR",
          "Sortie prête pour casque VR",
          "Système de navigation",
        ],
        disclaimers: ["Réalisé via notre réseau de partenaires"],
        addOns: [
          {
            id: "vr-standalone-floor",
            label: "Niveau/zone supplémentaire",
            description: "Ajout progressif",
            priceEur: 500,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "vr-standalone-interactive",
            label: "Élément interactif",
            description: "Par type d’interaction (portes, éclairages, matériaux)",
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
    label: "Home staging virtuel",
    sectionLabel: "1.4 — Transformation",
    icon: "sparkles",
    description: "Mise en scène photoréaliste d’espaces vides",
    products: [
      {
        id: "vs-static",
        label: "Home staging statique",
        basePriceEur: 18,
        unitLabel: "première image mise en scène",
        displayPerUnitEur: 18,
        displayUnitLabel: "image",
        includes: [
          "Analyse de la pièce",
          "Sélection et disposition du mobilier",
          "Ajustement de l’éclairage",
        ],
        addOns: [
          {
            id: "vs-angle",
            label: "Angle supplémentaire (même pièce)",
            description: "Remise de 33 % — décisions de mise en scène prises",
            priceEur: 12,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "vs-room",
            label: "Autre pièce (même bien)",
            description: "Remise de 17 % — style défini",
            priceEur: 15,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 10, priceEur: 13 }],
          },
          {
            id: "vs-restyle",
            label: "Nouvelle mise en scène (autre style)",
            description: "Changement de mobilier, composition déjà résolue",
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
        label: "Home staging 360 interactif",
        basePriceEur: 34,
        unitLabel: "premier panorama 360 mis en scène",
        displayPerUnitEur: 34,
        displayUnitLabel: "panorama",
        includes: [
          "Mise en scène 360 complète de la pièce",
          "Sélection du mobilier",
          "Ajustement de l’éclairage",
        ],
        addOns: [
          {
            id: "vs-360-hotspot",
            label: "Point supplémentaire dans la même pièce",
            description: "Remise de 30 % — la mise en scène existe déjà",
            priceEur: 24,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "vs-360-room",
            label: "Autre pièce (même bien)",
            description: "Remise de 18 % — style défini",
            priceEur: 28,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 6, priceEur: 24 }],
          },
          {
            id: "vs-360-restyle",
            label: "Nouvelle mise en scène (autre style)",
            description: "Changement de style uniquement",
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
    label: "Rénovation virtuelle",
    sectionLabel: "1.4 — Transformation",
    icon: "refresh",
    description: "Transformation d’espaces existants avec un nouveau design",
    products: [
      {
        id: "reno-image",
        label: "Rénovation virtuelle",
        basePriceEur: 66,
        unitLabel: "rénovation complète d’une vue",
        displayPerUnitEur: 66,
        displayUnitLabel: "vue",
        includes: [
          "Conception complète de la rénovation",
          "Sélection des matériaux",
          "1 vue rendue",
        ],
        addOns: [
          {
            id: "reno-angle",
            label: "Angle supplémentaire (même pièce)",
            description: "Remise de 10 % — décisions prises, nouvelle caméra",
            priceEur: 59,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 3, priceEur: 53 }],
          },
          {
            id: "reno-room",
            label: "Autre pièce (même bien)",
            description: "Remise de 15 % — palette définie",
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
    label: "Jour au crépuscule",
    sectionLabel: "1.4 — Transformation",
    icon: "sun",
    description: "Transformation de photographies de jour en scènes de crépuscule spectaculaires",
    products: [
      {
        id: "dtd-image",
        label: "Conversion jour au crépuscule",
        basePriceEur: 10,
        unitLabel: "par image",
        displayPerUnitEur: 10,
        displayUnitLabel: "image",
        includes: ["Remplacement du ciel", "Ajustement de l’éclairage", "Étalonnage des couleurs"],
        addOns: [
          {
            id: "dtd-shadow",
            label: "Suppression des ombres",
            description: "Correction d’ombres complexes",
            priceEur: 5,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "dtd-volume",
            label: "Images supplémentaires (10+)",
            description: "Prix réduit pour les volumes importants",
            priceEur: 8,
            priceType: "fixed",
            includedQty: 1,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 10, priceEur: 8 }],
          },
          {
            id: "dtd-rush",
            label: "Livraison express (24 h)",
            description: "Traitement prioritaire",
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
    label: "Suppression d’objets",
    sectionLabel: "1.4 — Transformation",
    icon: "eraser",
    description:
      "Nettoyage numérique — suppression d’objets personnels, du désordre et des éléments indésirables",
    products: [
      {
        id: "ir-simple",
        label: "Suppression simple",
        basePriceEur: 12,
        unitLabel: "par image",
        displayPerUnitEur: 12,
        displayUnitLabel: "image",
        includes: [
          "Identification des objets",
          "Suppression propre",
          "Reconstruction de l’arrière-plan",
        ],
        addOns: [
          {
            id: "ir-simple-additional",
            label: "Image supplémentaire (simple)",
            description: "Remise de 33 % — style défini",
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
        label: "Suppression complexe",
        basePriceEur: 25,
        unitLabel: "par image",
        displayPerUnitEur: 25,
        displayUnitLabel: "image",
        includes: [
          "Suppression d’objets volumineux",
          "Reconstruction de l’arrière-plan",
          "Restauration des détails",
        ],
        addOns: [
          {
            id: "ir-complex-additional",
            label: "Image supplémentaire (complexe)",
            description: "Remise de 28 % — approche définie",
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
