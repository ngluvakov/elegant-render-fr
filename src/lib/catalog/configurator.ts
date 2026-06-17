/**
 * configurator.ts — Machine-readable pricing catalog for the order configurator.
 *
 * Exports ConfiguratorCategory[], ConfiguratorProduct, add-on types, and
 * getConfiguratorProduct() lookup. Drives the interactive pricing UI.
 *
 * Used by: catalog/calculate, quote-item, service-adder, quote-context
 */

// Source of truth: current RSD catalog derived from docs/pricing/pillar-1-extracted.md.
// Public list amounts are stored in RSD gross amounts with PDV included.

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
  priceRsd: number;
};

export type ConfiguratorAddOn = {
  id: string;
  label: string;
  description: string;
  priceRsd: number;
  priceType: "fixed" | "percent";
  includedQty: number;
  maxQty: number;
  volumeRules: VolumeRule[];
};

export type DurationConfig = {
  minSeconds: number;
  defaultSeconds: number;
  maxSeconds: number;
  perSecondRsd: number;
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
  basePriceRsd?: number;
  perSecondRsd?: number;          // overrides durationConfig.perSecondRsd
  creates?: ModelAsset[];
  consumes?: ConsumeRule[];
  addOnsAvailable?: string[];     // which addOn IDs are valid in this mode
  disclaimers?: string[];
};

export type ConfiguratorProduct = {
  id: string;
  label: string;
  basePriceRsd: number;
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
  // Invisible to calculateQuote / priceItems — they read only basePriceRsd,
  // addOns, and durationConfig. Author per-product when a meaningful
  // unit price + package minimum exists (e.g. int-static: 1.992 RSD/render in a
  // 10-render package). Omit when the product is a single-unit entry.
  displayPerUnitRsd?: number;
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
    label: "Spoljašnji renderi",
    sectionLabel: "1.1 — Rendering",
    icon: "grid",
    description:
      "Kompletna 3D vizuelizacija eksterijera — fasade, materijali, okruženje",
    products: [
      {
        id: "ext-static",
        creates: ["exterior-shell"],
        consumes: [
          { requires: "complete-model", discountPct: 50, reason: "Kompletan model već postoji" },
          {
            requires: "exterior-shell",
            discountPct: 20,
            reason: "Osnovni oblik zgrade je već urađen u situacionom planu",
            sourceProducts: ["sp-first"],
          },
          {
            requires: "terrain-model",
            discountPct: 15,
            reason: "Okruženje postoji iz pejzažnog prikaza",
            sourceProducts: ["land-static"],
          },
        ],
        label: "Statički eksterijer",
        basePriceRsd: 29300,
        unitLabel: "kompletan model + prvi kadar",
        displayPerUnitRsd: 14650,
        displayUnitLabel: "render",
        displayPackageNote: "Paket uključuje 3D model i 2 kadra. Svaki sledeći kadar: 5.626 RSD.",
        includes: ["Pun 3D model", "Scena i osvetljenje", "2 kadra uključena"],
        disclaimers: [
          "Dodatna geometrija (+25%) se obračunava jednom ako kadar zahteva neviđenu stranu modela",
        ],
        addOns: [
          {
            id: "ext-static-cam",
            label: "Dodatni kadar",
            description: "Novi ugao, ista strana modela",
            priceRsd: 5626,
            priceType: "fixed",
            includedQty: 1,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "ext-static-extended",
            label: "Dodatna geometrija (+25%)",
            description: "Jednokratna doplata za geometriju sa neviđene strane (+25%)",
            priceRsd: 7384,
            priceType: "fixed",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
          {
            id: "ext-static-photo",
            label: "Fotomontaža (uklapanje u fotografiju)",
            description: "3D model komponovan u fotografiju lokacije — analiza perspektive, uklapanje kamere i osvetljenja",
            priceRsd: 5860,
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
          { requires: "exterior-shell", discountPct: 40, reason: "Model je već izgrađen za prethodni render" },
          { requires: "complete-model", discountPct: 50, reason: "Kompletan model već postoji" },
        ],
        label: "360 eksterijer",
        basePriceRsd: 39262,
        unitLabel: "kompletan model + VR izlaz",
        displayPerUnitRsd: 19690,
        displayUnitLabel: "panoramu",
        displayPackageNote: "Paket uključuje 3D model i 2 interaktivne tačke. Svaka sledeća: 5.626 RSD.",
        includes: [
          "Pun 3D model",
          "VR-ready 360 izlaz",
          "2 interaktivne tačke uključene",
        ],
        disclaimers: [
          "Doplata za neviđenu stranu modela (7.032 RSD) naplaćuje se jednom ako tačka zahteva pogled na stranu koja nije bila u modelu",
        ],
        addOns: [
          {
            id: "ext-360-hotspot",
            label: "Interaktivna tačka (hotspot)",
            description: "Nova tačka gledanja u 360 panorami",
            priceRsd: 5626,
            priceType: "fixed",
            includedQty: 1,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 4, priceRsd: 6212 }],
          },
          {
            id: "ext-360-extended",
            label: "Doplata za neviđenu stranu",
            description:
              "Jednokratna doplata kada tačka zahteva stranu modela koja ranije nije bila modelovana",
            priceRsd: 7032,
            priceType: "fixed",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
          {
            id: "ext-360-photo",
            label: "Fotomontaža (360 panorama lokacije)",
            description: "Uklapanje 3D modela u 360° panoramsku fotografiju lokacije",
            priceRsd: 5860,
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
          { requires: "exterior-shell", discountPct: 35, reason: "Model je već izgrađen za eksterijerni render" },
          { requires: "terrain-model", discountPct: 25, reason: "Okruženje postoji iz situacionog/pejzažnog prikaza" },
          { requires: "complete-model", discountPct: 50, reason: "Kompletan model već postoji" },
        ],
        label: "3D prikaz ulice i okruženja",
        basePriceRsd: 49224,
        unitLabel: "model + okruženje + prvi ugao",
        displayPerUnitRsd: 24612,
        displayUnitLabel: "render",
        displayPackageNote: "Paket uključuje 3D model, okruženje i 2 ugla (ulična ili vazdušna perspektiva). Svaki sledeći ugao: 5.626 RSD.",
        includes: [
          "Pun 3D model + okruženje",
          "Ulična ili vazdušna perspektiva",
          "2 ugla uključena",
        ],
        disclaimers: [
          "Doplata (+25%) se obračunava jednom za prikaz zadnje strane",
        ],
        addOns: [
          {
            id: "ext-aerial-cam",
            label: "Dodatni ugao",
            description: "Nova tačka gledanja (ulična ili vazdušna)",
            priceRsd: 5626,
            priceType: "fixed",
            includedQty: 1,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "ext-aerial-extended",
            label: "Doplata za zadnju stranu (+25%)",
            description: "Jednokratna doplata za prikaz zadnje strane (+25%)",
            priceRsd: 12306,
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
    label: "Unutrašnji renderi",
    sectionLabel: "1.1 — Rendering",
    icon: "home",
    description:
      "Paketi po spratu sa neograničenim kamerama unutar opremljenih soba",
    products: [
      {
        id: "int-static",
        creates: ["interior-model"],
        consumes: [
          { requires: "complete-model", discountPct: 50, reason: "Kompletan model već postoji" },
        ],
        label: "Klasični prikaz enterijera (po spratu)",
        basePriceRsd: 19924,
        unitLabel: "ceo sprat sa do 10 prostorija",
        displayPerUnitRsd: 1992,
        displayMinQty: 10,
        displayUnitLabel: "render",
        displayPackageNote: "paket od 10 prostorija, jedan sprat",
        includes: [
          "10 opremljenih prostorija",
          "neograničen broj uglova kamere",
          "tlocrt sprata",
        ],
        addOns: [
          {
            id: "int-static-room",
            label: "Dodatna opremljena soba (11. i sledeća)",
            description: "Opremanje + render za dodatnu sobu",
            priceRsd: 3282,
            priceType: "fixed",
            includedQty: 10,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "int-static-cam",
            label: "Dodatni ugao kamere",
            description: "Novi ugao kamere u već opremljenoj sobi",
            priceRsd: 1172,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "int-static-floor",
            label: "Dodatni sprat",
            description: "Isti paket, 30% jeftinije",
            priceRsd: 14064,
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
          { requires: "interior-model", discountPct: 40, reason: "Enterijerski model već postoji" },
          { requires: "complete-model", discountPct: 50, reason: "Kompletan model već postoji" },
        ],
        label: "360 enterijer (po spratu)",
        basePriceRsd: 34574,
        unitLabel: "ceo sprat u 360 turi",
        displayPerUnitRsd: 3516,
        displayMinQty: 10,
        displayUnitLabel: "panoramu",
        displayPackageNote: "paket od 10 panorama, jedan sprat",
        includes: [
          "10 interaktivnih soba u 360 turi",
          "10 statičkih uglova kamere",
          "tlocrt sprata",
        ],
        addOns: [
          {
            id: "int-360-room",
            label: "Interaktivna soba (hotspot)",
            description: "Opremanje + 360 render za dodatnu sobu",
            priceRsd: 5274,
            priceType: "fixed",
            includedQty: 10,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "int-360-hotspot",
            label: "Dodatna tačka u postojećoj sobi",
            description: "Novi ugao gledanja u već opremljenoj sobi",
            priceRsd: 3164,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "int-360-static",
            label: "Statičke kamere",
            description: "Statički uglovi u bilo kojoj sobi",
            priceRsd: 1172,
            priceType: "fixed",
            includedQty: 10,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "int-360-floor",
            label: "Dodatni sprat (360)",
            description: "Isti paket, 30% jeftinije",
            priceRsd: 24026,
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
    label: "Prikazi dvorišta i okruženja",
    sectionLabel: "1.1 — Rendering",
    icon: "tree",
    description: "Bašte, parkovi, dvorišta i urbani prostori sa terenom",
    products: [
      {
        id: "land-static",
        creates: ["terrain-model"],
        consumes: [
          { requires: "exterior-shell", discountPct: 25, reason: "Kontekst postoji iz eksterijernog rendera" },
          { requires: "terrain-model", discountPct: 40, reason: "Teren postoji iz situacionog prikaza" },
          { requires: "complete-model", discountPct: 50, reason: "Kompletan model već postoji" },
        ],
        label: "Pejzažni render",
        basePriceRsd: 25784,
        unitLabel: "teren + vegetacija + prvi kadar",
        displayPerUnitRsd: 12892,
        displayUnitLabel: "render",
        displayPackageNote: "Paket uključuje teren, vegetaciju i 2 kadra. Svaki sledeći kadar: 5.274 RSD.",
        includes: [
          "Modelovanje terena",
          "Vegetacija i sadnja",
          "2 kadra uključena",
        ],
        disclaimers: [
          "Dodatna geometrija (+25%) ako je potreban novi teren/sadnja",
        ],
        addOns: [
          {
            id: "land-cam",
            label: "Dodatni kadar",
            description: "Model postoji, novi ugao",
            priceRsd: 5274,
            priceType: "fixed",
            includedQty: 1,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "land-extended",
            label: "Dodatna geometrija (+25%)",
            description: "Neviđeni teren/sadnja potrebna (+25%, jednokratno)",
            priceRsd: 6446,
            priceType: "fixed",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
          {
            id: "land-aerial",
            label: "Prikaz pejzaža iz vazduha",
            description: "Kompletan pogled na okruženje iz vazduha",
            priceRsd: 44536,
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
    label: "3D osnove prostora",
    sectionLabel: "1.2 — Planovi",
    icon: "grid",
    description: "Detaljni 3D arhitektonski planovi sa nameštajem",
    products: [
      {
        id: "fp3d-single",
        consumes: [
          { requires: "interior-model", discountPct: 70, reason: "Prostor je već modelovan u enterijerskom renderu" },
          { requires: "complete-model", discountPct: 70, reason: "Prostor je već modelovan u kompletnom modelu" },
        ],
        label: "3D osnova jednog nivoa",
        basePriceRsd: 3399,
        unitLabel: "jednonivoski 3D layout",
        displayPerUnitRsd: 3399,
        displayUnitLabel: "nivo",
        includes: ["Kompletni raspored sprata", "Oznake prostorija", "Dimenzije"],
        addOns: [
          {
            id: "fp3d-second",
            label: "Drugi nivo (dupleks)",
            description: "Dvospratni layout ukupno",
            priceRsd: 1992,
            priceType: "fixed",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
          {
            id: "fp3d-extra",
            label: "Svaki sledeći nivo",
            description: "Stil definisan, samo raspored",
            priceRsd: 1758,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "fp3d-duplicate",
            label: "Duplikat sprata",
            description: "Identičan layout — kopija",
            priceRsd: 1172,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "fp3d-furniture",
            label: "Overlay nameštaja",
            description: "Namešten plan sprata",
            priceRsd: 938,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "fp3d-variant",
            label: "Varijanta dizajna",
            description: "Isti raspored, drugi nameštaj",
            priceRsd: 703,
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
    label: "2D osnove prostora",
    sectionLabel: "1.2 — Planovi",
    icon: "file-image",
    description: "Čisti, kolorizovani planovi — partner mreža",
    products: [
      {
        id: "fp2d-single",
        consumes: [
          { requires: "interior-model", discountPct: 50, reason: "Raspored je već definisan u enterijerskom modelu" },
        ],
        label: "2D osnova jednog nivoa",
        basePriceRsd: 2344,
        unitLabel: "čist vektorski layout",
        displayPerUnitRsd: 2344,
        displayUnitLabel: "nivo",
        includes: ["Čist vektorski layout", "Oznake prostorija", "Kodiranje bojom"],
        addOns: [
          {
            id: "fp2d-double",
            label: "Dupleks (dva nivoa)",
            description: "Struktura se prenosi",
            priceRsd: 1406,
            priceType: "fixed",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
          {
            id: "fp2d-extra",
            label: "Svaki sledeći nivo",
            description: "Šablon definisan",
            priceRsd: 1172,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "fp2d-duplicate",
            label: "Duplikat sprata",
            description: "Kopija sa promenom oznaka",
            priceRsd: 703,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "fp2d-furnished",
            label: "Namešten plan",
            description: "Overlay nameštaja",
            priceRsd: 703,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "fp2d-variant",
            label: "Varijanta boje/stila",
            description: "Promena palete",
            priceRsd: 469,
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
    label: "3D situacioni prikazi",
    sectionLabel: "1.2 — Planovi",
    icon: "layers",
    description:
      "Fotorealistični prikazi celih lokacija sa pejzažom i kontekstom",
    products: [
      {
        id: "sp-first",
        creates: ["terrain-model", "exterior-shell"],
        consumes: [
          { requires: "exterior-shell", discountPct: 30, reason: "Model je već izgrađen za eksterijerni render" },
          { requires: "terrain-model", discountPct: 40, reason: "Teren postoji iz pejzažnog prikaza" },
          { requires: "complete-model", discountPct: 35, reason: "Kompletan model već postoji" },
        ],
        label: "3D situacioni plan",
        basePriceRsd: 41020,
        unitLabel: "teren + objekti + pejzaž",
        displayPerUnitRsd: 41020,
        displayUnitLabel: "situacioni plan",
        displayPackageNote: "uključuje teren, objekte i pejzaž; dodatni uglovi 7.618 RSD",
        includes: [
          "Modelovanje terena",
          "Postavljanje objekata",
          "Pejzaž i putevi",
        ],
        addOns: [
          {
            id: "sp-angle",
            label: "Dodatni ugao",
            description: "Model postoji, nova tačka gledanja",
            priceRsd: 7618,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "sp-season",
            label: "Sezonska varijanta",
            description: "Vegetacija + osvetljenje",
            priceRsd: 9962,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "sp-phase",
            label: "Fazna varijanta",
            description: "Prikaz po fazama gradnje — biraju se vidljivi delovi",
            priceRsd: 11134,
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
    label: "3D animacija",
    sectionLabel: "1.3 — Animacija i imerzija",
    icon: "camera",
    description: "Cinematski flythrough i walkthrough — minimum 15 sekundi",
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
          { requires: "exterior-shell", discountPct: 33, reason: "Eksterijer je već izgrađen u modelu" },
          { requires: "interior-model", discountPct: 33, reason: "Enterijer je već izgrađen u modelu" },
          { requires: "terrain-model", discountPct: 20, reason: "Teren postoji iz situacionog prikaza" },
        ],
        label: "Animacija (od nule)",
        basePriceRsd: 1758,
        unitLabel: "1.758 RSD/sek, minimum 15 sek (26.370 RSD)",
        displayPerUnitRsd: 1758,
        displayMinQty: 15,
        displayUnitLabel: "sekundu",
        displayPackageNote: "minimum 15 sekundi (26.370 RSD)",
        includes: [
          "Pun 3D model",
          "Dizajn putanje animacije",
          "Renderovanje",
          "Min. 15 sekundi",
        ],
        durationConfig: {
          minSeconds: 15,
          defaultSeconds: 15,
          maxSeconds: 300,
          perSecondRsd: 1758,
          discountTiers: ANIMATION_DURATION_TIERS,
        },
        addOns: [
          {
            id: "anim-path",
            label: "Dodatna putanja kamere",
            description: "Nova trajektorija, isti model — 586 RSD/sek",
            priceRsd: 586,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "anim-daynight",
            label: "Dan/noć verzija",
            description: "Ponovna izrada osvetljenja + render",
            priceRsd: 30,
            priceType: "percent",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
          {
            id: "anim-season",
            label: "Sezonska varijacija",
            description: "Promene okruženja/materijala",
            priceRsd: 40,
            priceType: "percent",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
        ],
        sourceModeRules: {
          scratch: {
            label: "Animacija (od nule)",
            unitLabel: "1.758 RSD/sek, minimum 15 sek (26.370 RSD)",
            // scratch mode uses defaults — no overrides needed,
            // but kept here so the resolver can detect the mode.
            addOnsAvailable: ["anim-path", "anim-daynight", "anim-season"],
          },
          existing: {
            label: "Animacija (postojeći model)",
            unitLabel: "1.172 RSD/sek, minimum 15 sek (17.580 RSD) — 33% popusta",
            basePriceRsd: 1172,
            perSecondRsd: 1172,
            // existing mode does NOT create complete-model (it reuses one)
            creates: [],
            consumes: [
              { requires: "exterior-shell", discountPct: 33, reason: "Eksterijer je već izgrađen u modelu" },
              { requires: "interior-model", discountPct: 33, reason: "Enterijer je već izgrađen u modelu" },
              { requires: "complete-model", discountPct: 47, reason: "Kompletan model već postoji" },
            ],
            addOnsAvailable: ["anim-path", "anim-daynight"],
          },
          active: {
            label: "Animacija (aktivan projekat)",
            unitLabel: "938 RSD/sek, minimum 15 sek (14.064 RSD) — 47% popusta",
            basePriceRsd: 938,
            perSecondRsd: 938,
            creates: [],
            consumes: [
              { requires: "complete-model", discountPct: 47, reason: "Kompletan model već postoji" },
            ],
            disclaimers: [
              "Dostupno samo za klijente sa aktivnim projektom renderovanja",
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
    label: "VR iskustva",
    sectionLabel: "1.3 — Animacija i imerzija",
    icon: "camera",
    description:
      "Immersivna VR iskustva za Meta Quest i slične headset uređaje — partner mreža",
    products: [
      {
        id: "vr-existing",
        inquiryOnly: true,
        consumes: [
          { requires: "exterior-shell", discountPct: 50, reason: "Eksterijer je već izgrađen u modelu" },
          { requires: "interior-model", discountPct: 50, reason: "Enterijer je već izgrađen u modelu" },
          { requires: "complete-model", discountPct: 50, reason: "Kompletan model već postoji" },
        ],
        label: "VR Walkthrough (postojeći model)",
        basePriceRsd: 175800,
        unitLabel: "Od 175.800 RSD — konsultacija pre izrade",
        includes: [
          "VR optimizacija",
          "Headset-ready izlaz",
          "Sistem navigacije",
        ],
        disclaimers: ["Isporučuje se kroz partnersku mrežu"],
        addOns: [
          {
            id: "vr-existing-floor",
            label: "Dodatni sprat/područje",
            description: "Inkrementalno dodavanje postojećem VR",
            priceRsd: 58600,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "vr-existing-interactive",
            label: "Interaktivni element",
            description: "Po funkcionalnosti (vrata, svetla, materijali)",
            priceRsd: 23440,
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
          { requires: "exterior-shell", discountPct: 50, reason: "Eksterijer je već izgrađen u modelu" },
          { requires: "interior-model", discountPct: 50, reason: "Enterijer je već izgrađen u modelu" },
          { requires: "complete-model", discountPct: 50, reason: "Kompletan model već postoji" },
        ],
        label: "VR Walkthrough (samostalno)",
        basePriceRsd: 351600,
        unitLabel: "Od 351.600 RSD — konsultacija pre izrade",
        includes: [
          "Kompletan 3D model",
          "VR optimizacija",
          "Headset-ready izlaz",
          "Sistem navigacije",
        ],
        disclaimers: ["Isporučuje se kroz partnersku mrežu"],
        addOns: [
          {
            id: "vr-standalone-floor",
            label: "Dodatni sprat/područje",
            description: "Inkrementalno dodavanje",
            priceRsd: 58600,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "vr-standalone-interactive",
            label: "Interaktivni element",
            description: "Po funkcionalnosti (vrata, svetla, materijali)",
            priceRsd: 23440,
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
    label: "Virtuelno opremanje",
    sectionLabel: "1.4 — Transformacija",
    icon: "sparkles",
    description: "Fotorealistično opremanje praznih prostora",
    products: [
      {
        id: "vs-static",
        label: "Statički staging",
        basePriceRsd: 2110,
        unitLabel: "prva opremljena slika",
        displayPerUnitRsd: 2110,
        displayUnitLabel: "sliku",
        includes: [
          "Analiza prostorije",
          "Izbor i postavljanje nameštaja",
          "Podešavanje osvetljenja",
        ],
        addOns: [
          {
            id: "vs-angle",
            label: "Dodatni ugao (ista soba)",
            description: "33% popusta — staging odluke donete",
            priceRsd: 1406,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "vs-room",
            label: "Druga soba (isti objekat)",
            description: "17% popusta — stil definisan",
            priceRsd: 1758,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 10, priceRsd: 1524 }],
          },
          {
            id: "vs-restyle",
            label: "Ponovno opremanje (drugi stil)",
            description: "Zamena nameštaja, kompozicija rešena",
            priceRsd: 1406,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
        ],
      },
      {
        id: "vs-360",
        label: "Interaktivno 360 opremanje",
        basePriceRsd: 3985,
        unitLabel: "prva opremljena 360 panorama",
        displayPerUnitRsd: 3985,
        displayUnitLabel: "panoramu",
        includes: [
          "Kompletno 360 opremanje sobe",
          "Izbor nameštaja",
          "Podešavanje osvetljenja",
        ],
        addOns: [
          {
            id: "vs-360-hotspot",
            label: "Dodatna tačka u istoj sobi",
            description: "30% popust — opremanje već postoji",
            priceRsd: 2813,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "vs-360-room",
            label: "Druga soba (isti objekat)",
            description: "18% popusta — stil definisan",
            priceRsd: 3282,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 6, priceRsd: 2813 }],
          },
          {
            id: "vs-360-restyle",
            label: "Ponovno opremanje (drugi stil)",
            description: "Samo zamena stila",
            priceRsd: 2578,
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
    label: "Virtuelna renovacija",
    sectionLabel: "1.4 — Transformacija",
    icon: "refresh",
    description: "Transformacija postojećih prostora novim dizajnom",
    products: [
      {
        id: "reno-image",
        label: "Virtuelna renovacija",
        basePriceRsd: 7735,
        unitLabel: "kompletna renovacija jednog pogleda",
        displayPerUnitRsd: 7735,
        displayUnitLabel: "pogled",
        includes: [
          "Kompletan dizajn renovacije",
          "Izbor materijala",
          "1 renderovan pogled",
        ],
        addOns: [
          {
            id: "reno-angle",
            label: "Dodatni ugao (ista soba)",
            description: "10% popusta — odluke donete, nova kamera",
            priceRsd: 6915,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 3, priceRsd: 6212 }],
          },
          {
            id: "reno-room",
            label: "Druga soba (isti objekat)",
            description: "15% popusta — paleta definisana",
            priceRsd: 6563,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 5, priceRsd: 5860 }],
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
    label: "Dan u noć",
    sectionLabel: "1.4 — Transformacija",
    icon: "sun",
    description: "Transformacija dnevnih fotografija u dramatične sumračne scene",
    products: [
      {
        id: "dtd-image",
        label: "Dan u noć konverzija",
        basePriceRsd: 1172,
        unitLabel: "po slici",
        displayPerUnitRsd: 1172,
        displayUnitLabel: "sliku",
        includes: ["Zamena neba", "Podešavanje osvetljenja", "Color grading"],
        addOns: [
          {
            id: "dtd-shadow",
            label: "Uklanjanje senki",
            description: "Složena korekcija senki",
            priceRsd: 586,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "dtd-volume",
            label: "Dodatne slike (10+)",
            description: "Snižena cena za veću količinu",
            priceRsd: 938,
            priceType: "fixed",
            includedQty: 1,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 10, priceRsd: 938 }],
          },
          {
            id: "dtd-rush",
            label: "Hitna isporuka (24h)",
            description: "Prioritetna obrada",
            priceRsd: 50,
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
    label: "Uklanjanje elemenata",
    sectionLabel: "1.4 — Transformacija",
    icon: "eraser",
    description:
      "Digitalno čišćenje — uklanjanje ličnih stvari, nereda i neželjenih objekata",
    products: [
      {
        id: "ir-simple",
        label: "Jednostavno uklanjanje",
        basePriceRsd: 1406,
        unitLabel: "po slici",
        displayPerUnitRsd: 1406,
        displayUnitLabel: "sliku",
        includes: [
          "Identifikacija elemenata",
          "Čisto uklanjanje",
          "Rekonstrukcija pozadine",
        ],
        addOns: [
          {
            id: "ir-simple-additional",
            label: "Dodatna slika (jednostavno)",
            description: "33% popusta — stil definisan",
            priceRsd: 938,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 10, priceRsd: 1172 }],
          },
        ],
      },
      {
        id: "ir-complex",
        label: "Složeno uklanjanje",
        basePriceRsd: 2930,
        unitLabel: "po slici",
        displayPerUnitRsd: 2930,
        displayUnitLabel: "sliku",
        includes: [
          "Uklanjanje velikih elemenata",
          "Rekonstrukcija pozadine",
          "Restauracija detalja",
        ],
        addOns: [
          {
            id: "ir-complex-additional",
            label: "Dodatna slika (složeno)",
            description: "28% popusta — pristup definisan",
            priceRsd: 2110,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 10, priceRsd: 2344 }],
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
        perSecondRsd:
          override.perSecondRsd ?? product.durationConfig.perSecondRsd,
      }
    : undefined;

  const merged: ConfiguratorProduct = {
    ...product,
    label: override.label ?? product.label,
    unitLabel: override.unitLabel ?? product.unitLabel,
    basePriceRsd: override.basePriceRsd ?? product.basePriceRsd,
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
