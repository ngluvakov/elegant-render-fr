/**
 * configurator.ts — Machine-readable pricing catalog for the order configurator.
 *
 * Exports ConfiguratorCategory[], ConfiguratorProduct, add-on types, and
 * getConfiguratorProduct() lookup. Drives the interactive pricing UI.
 *
 * Used by: catalog/calculate, quote-item, service-adder, quote-context
 */

// Source of truth: docs/pricing/pillar-1-extracted.md
// All prices in EUR, excluding VAT/PDV

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
            discountPct: 25,
            reason: "Model postoji iz fotomontaže",
            sourceProducts: ["pm-first"],
            condition: { type: "addOnAbsent", addOnId: "pm-extended" },
          },
          {
            requires: "exterior-shell",
            discountPct: 15,
            reason: "Model postoji iz fotomontaže (delimično)",
            sourceProducts: ["pm-first"],
          },
          {
            requires: "exterior-shell",
            discountPct: 20,
            reason: "Massing postoji iz situacionog plana",
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
        basePriceEur: 250,
        unitLabel: "kompletan model + prvi kadar",
        includes: ["Pun 3D model", "Scena i osvetljenje", "1 kadar uključen"],
        disclaimers: [
          "Extended Model Surcharge (+25%) se obračunava jednom ako kadar zahteva novu geometriju",
        ],
        addOns: [
          {
            id: "ext-static-cam",
            label: "Dodatni kadar",
            description: "Novi ugao, ista strana modela",
            priceEur: 48,
            priceType: "fixed",
            includedQty: 1,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "ext-static-extended",
            label: "Extended Model Surcharge",
            description: "Jednokratna doplata za geometriju sa neviđene strane (+25%)",
            priceEur: 63,
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
          { requires: "exterior-shell", discountPct: 40, reason: "Model postoji iz statičkog eksterijera" },
          { requires: "complete-model", discountPct: 50, reason: "Kompletan model već postoji" },
        ],
        label: "360 eksterijer",
        basePriceEur: 335,
        unitLabel: "kompletan model + VR izlaz",
        includes: ["Pun 3D model", "VR-ready 360 izlaz", "1 hotspot uključen"],
        disclaimers: [
          "Extended Model Hotspot (€60) se naplaćuje jednom ako je potrebna nova geometrija",
        ],
        addOns: [
          {
            id: "ext-360-hotspot",
            label: "Hotspot",
            description: "Interaktivna tačka gledanja",
            priceEur: 48,
            priceType: "fixed",
            includedQty: 1,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 4, priceEur: 53 }],
          },
          {
            id: "ext-360-extended",
            label: "Extended Model Hotspot",
            description: "Hotspot koji zahteva neviđenu geometriju (jednokratno)",
            priceEur: 60,
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
          { requires: "exterior-shell", discountPct: 35, reason: "Model postoji iz eksterijernog rendera" },
          { requires: "terrain-model", discountPct: 25, reason: "Okruženje postoji iz situacionog/pejzažnog prikaza" },
          { requires: "complete-model", discountPct: 50, reason: "Kompletan model već postoji" },
        ],
        label: "Aerial render",
        basePriceEur: 420,
        unitLabel: "model + okruženje iz vazduha",
        includes: [
          "Pun 3D model + okruženje",
          "Aerial kamera",
          "1 ugao uključen",
        ],
        disclaimers: [
          "Extended Model (+25%) se obračunava jednom za prikaz zadnje strane",
        ],
        addOns: [
          {
            id: "ext-aerial-cam",
            label: "Dodatni aerial ugao",
            description: "Nova tačka gledanja iz vazduha",
            priceEur: 48,
            priceType: "fixed",
            includedQty: 1,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "ext-aerial-extended",
            label: "Extended Model (zadnja strana)",
            description: "Jednokratna doplata za prikaz zadnje strane (+25%)",
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
        label: "Render enterijera (statički)",
        basePriceEur: 170,
        unitLabel: "10 prostorija + 10 rendera",
        includes: [
          "10 opremljenih prostorija",
          "10 rendera uključeno",
          "3D osnova sprata",
        ],
        addOns: [
          {
            id: "int-static-room",
            label: "Opremljene sobe",
            description: "Staging + render za dodatnu sobu",
            priceEur: 28,
            priceType: "fixed",
            includedQty: 10,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "int-static-cam",
            label: "Dodatni kadar",
            description: "Ekstra ugao u postojećoj sobi",
            priceEur: 10,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "int-static-floor",
            label: "Dodatni sprat",
            description: "Isti paket, 30% jeftinije",
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
          { requires: "interior-model", discountPct: 40, reason: "Enterijerski model već postoji" },
          { requires: "complete-model", discountPct: 50, reason: "Kompletan model već postoji" },
        ],
        label: "360 enterijer (po spratu)",
        basePriceEur: 295,
        unitLabel: "360 paket po spratu",
        includes: [
          "10 hotspot soba",
          "10 statičkih kamera",
          "3D osnova sprata",
        ],
        addOns: [
          {
            id: "int-360-room",
            label: "Hotspot sobe",
            description: "Staging + 360 render za dodatnu sobu",
            priceEur: 45,
            priceType: "fixed",
            includedQty: 10,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "int-360-hotspot",
            label: "Dodatni hotspot",
            description: "Nova tačka gledanja u postojećoj sobi",
            priceEur: 27,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "int-360-static",
            label: "Statičke kamere",
            description: "Statički uglovi u bilo kojoj sobi",
            priceEur: 10,
            priceType: "fixed",
            includedQty: 10,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "int-360-floor",
            label: "Dodatni sprat (360)",
            description: "Isti paket, 30% jeftinije",
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
        basePriceEur: 220,
        unitLabel: "teren + vegetacija + prvi kadar",
        includes: [
          "Modelovanje terena",
          "Vegetacija i sadnja",
          "1 kadar uključen",
        ],
        disclaimers: [
          "Extended Model Surcharge (+25%) ako je potreban novi teren/sadnja",
        ],
        addOns: [
          {
            id: "land-cam",
            label: "Dodatni kadar",
            description: "Model postoji, novi ugao",
            priceEur: 45,
            priceType: "fixed",
            includedQty: 1,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "land-extended",
            label: "Extended Model Surcharge",
            description: "Neviđeni teren/sadnja potrebna (+25%, jednokratno)",
            priceEur: 55,
            priceType: "fixed",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
          {
            id: "land-aerial",
            label: "Aerial pejzažni prikaz",
            description: "Kompletni overhead kontekst",
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
  // 1.1 — PHOTOMONTAGE
  // ═══════════════════════════════════════════
  {
    id: "photomontage",
    label: "Fotomontaža",
    sectionLabel: "1.1 — Rendering",
    icon: "images",
    description:
      "3D-renderirani objekti ukomponovani u fotografiju lokacije",
    products: [
      {
        id: "pm-first",
        creates: ["exterior-shell"],
        consumes: [
          {
            requires: "exterior-shell",
            discountPct: 50,
            reason: "Model postoji iz eksterijernog rendera",
            condition: { type: "addOnAbsent", addOnId: "pm-extended" },
          },
          { requires: "exterior-shell", discountPct: 15, reason: "Model postoji iz eksterijernog rendera (delimično)" },
          { requires: "complete-model", discountPct: 60, reason: "Kompletan model već postoji" },
        ],
        label: "Fotomontaža",
        basePriceEur: 300,
        unitLabel: "3D model + foto uklapanje + kompoziting",
        includes: [
          "Analiza fotografije lokacije",
          "Uklapanje kamere",
          "Uklapanje osvetljenja",
          "Kompoziting",
        ],
        disclaimers: [
          "Extended Model Surcharge (+25%) ako je potrebna nova geometrija",
        ],
        addOns: [
          {
            id: "pm-angle",
            label: "Dodatni ugao (ista foto)",
            description: "Samo ponovno uklapanje kamere",
            priceEur: 55,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "pm-photo",
            label: "Druga fotografija lokacije",
            description: "Nova analiza + kompoziting",
            priceEur: 85,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "pm-extended",
            label: "Extended Model Surcharge",
            description: "Ako je potrebna nova geometrija (+25%, jednokratno)",
            priceEur: 75,
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
          { requires: "interior-model", discountPct: 70, reason: "Geometrija postoji iz enterijerskog modela" },
          { requires: "complete-model", discountPct: 70, reason: "Geometrija postoji iz kompletnog modela" },
        ],
        label: "3D osnova jednog nivoa",
        basePriceEur: 29,
        unitLabel: "jednonivoski 3D layout",
        includes: ["Kompletni raspored sprata", "Oznake prostorija", "Dimenzije"],
        addOns: [
          {
            id: "fp3d-second",
            label: "Drugi nivo (dupleks)",
            description: "Dvospratni layout ukupno",
            priceEur: 17,
            priceType: "fixed",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
          {
            id: "fp3d-extra",
            label: "Svaki sledeći nivo",
            description: "Stil definisan, samo raspored",
            priceEur: 15,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "fp3d-duplicate",
            label: "Duplikat sprata",
            description: "Identičan layout — kopija",
            priceEur: 10,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "fp3d-furniture",
            label: "Overlay nameštaja",
            description: "Namešten plan sprata",
            priceEur: 8,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "fp3d-variant",
            label: "Varijanta dizajna",
            description: "Isti raspored, drugi nameštaj",
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
    label: "2D osnove prostora",
    sectionLabel: "1.2 — Planovi",
    icon: "file-image",
    description: "Čisti, kolorizovani planovi — partner mreža",
    products: [
      {
        id: "fp2d-single",
        consumes: [
          { requires: "interior-model", discountPct: 50, reason: "Raspored postoji iz enterijerskog modela" },
        ],
        label: "2D osnova jednog nivoa",
        basePriceEur: 20,
        unitLabel: "čist vektorski layout",
        includes: ["Čist vektorski layout", "Oznake prostorija", "Kodiranje bojom"],
        addOns: [
          {
            id: "fp2d-double",
            label: "Dupleks (dva nivoa)",
            description: "Struktura se prenosi",
            priceEur: 12,
            priceType: "fixed",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
          {
            id: "fp2d-extra",
            label: "Svaki sledeći nivo",
            description: "Šablon definisan",
            priceEur: 10,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "fp2d-duplicate",
            label: "Duplikat sprata",
            description: "Kopija sa promenom oznaka",
            priceEur: 6,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "fp2d-furnished",
            label: "Namešten plan",
            description: "Overlay nameštaja",
            priceEur: 6,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "fp2d-variant",
            label: "Varijanta boje/stila",
            description: "Promena palete",
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
          { requires: "exterior-shell", discountPct: 30, reason: "Model postoji iz eksterijernog rendera" },
          { requires: "terrain-model", discountPct: 40, reason: "Teren postoji iz pejzažnog prikaza" },
          { requires: "complete-model", discountPct: 35, reason: "Kompletan model već postoji" },
        ],
        label: "3D situacioni plan",
        basePriceEur: 350,
        unitLabel: "teren + objekti + pejzaž",
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
            priceEur: 65,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "sp-season",
            label: "Sezonska varijanta",
            description: "Vegetacija + osvetljenje",
            priceEur: 85,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "sp-phase",
            label: "Fazna varijanta",
            description: "Faze gradnje — selektivna vidljivost",
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
    label: "3D animacija",
    sectionLabel: "1.3 — Animacija i imerzija",
    icon: "camera",
    description: "Cinematski flythrough i walkthrough — minimum 15 sekundi",
    products: [
      {
        id: "anim-scratch",
        creates: ["complete-model"],
        consumes: [
          { requires: "exterior-shell", discountPct: 33, reason: "Eksterijerski model postoji" },
          { requires: "interior-model", discountPct: 33, reason: "Enterijerski model postoji" },
          { requires: "terrain-model", discountPct: 20, reason: "Teren postoji iz situacionog prikaza" },
        ],
        label: "Animacija (od nule)",
        basePriceEur: 15,
        unitLabel: "€15/sek, minimum 15 sek (€225)",
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
          perSecondEur: 15,
          discountTiers: ANIMATION_DURATION_TIERS,
        },
        addOns: [
          {
            id: "anim-scratch-path",
            label: "Dodatna putanja kamere",
            description: "Nova trajektorija, isti model — €5/sek",
            priceEur: 5,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "anim-scratch-daynight",
            label: "Dan/noć verzija",
            description: "Ponovna izrada osvetljenja + render",
            priceEur: 30,
            priceType: "percent",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
          {
            id: "anim-scratch-season",
            label: "Sezonska varijacija",
            description: "Promene okruženja/materijala",
            priceEur: 40,
            priceType: "percent",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
        ],
      },
      {
        id: "anim-existing",
        consumes: [
          { requires: "exterior-shell", discountPct: 33, reason: "Eksterijerski model postoji" },
          { requires: "interior-model", discountPct: 33, reason: "Enterijerski model postoji" },
          { requires: "complete-model", discountPct: 47, reason: "Kompletan model već postoji" },
        ],
        label: "Animacija (postojeći model)",
        basePriceEur: 10,
        unitLabel: "€10/sek, minimum 15 sek (€150) — 33% popusta",
        includes: [
          "Koristi postojeći model",
          "Dizajn putanje animacije",
          "Renderovanje",
          "Min. 15 sekundi",
        ],
        durationConfig: {
          minSeconds: 15,
          defaultSeconds: 15,
          maxSeconds: 300,
          perSecondEur: 10,
          discountTiers: ANIMATION_DURATION_TIERS,
        },
        addOns: [
          {
            id: "anim-exist-path",
            label: "Dodatna putanja kamere",
            description: "Nova trajektorija, isti model — €5/sek",
            priceEur: 5,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "anim-exist-daynight",
            label: "Dan/noć verzija",
            description: "Ponovna izrada osvetljenja + render",
            priceEur: 30,
            priceType: "percent",
            includedQty: 0,
            maxQty: 1,
            volumeRules: [],
          },
        ],
      },
      {
        id: "anim-active",
        consumes: [
          { requires: "complete-model", discountPct: 47, reason: "Kompletan model već postoji" },
        ],
        label: "Animacija (aktivan projekat)",
        basePriceEur: 8,
        unitLabel: "€8/sek, minimum 15 sek (€120) — 47% popusta",
        includes: [
          "Koristi model iz aktivnog projekta",
          "Dizajn putanje animacije",
          "Renderovanje",
          "Min. 15 sekundi",
        ],
        disclaimers: [
          "Dostupno samo za klijente sa aktivnim projektom renderovanja",
        ],
        durationConfig: {
          minSeconds: 15,
          defaultSeconds: 15,
          maxSeconds: 300,
          perSecondEur: 8,
          discountTiers: ANIMATION_DURATION_TIERS,
        },
        addOns: [
          {
            id: "anim-active-path",
            label: "Dodatna putanja kamere",
            description: "Nova trajektorija, isti model — €5/sek",
            priceEur: 5,
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
        consumes: [
          { requires: "exterior-shell", discountPct: 50, reason: "Eksterijerski model postoji" },
          { requires: "interior-model", discountPct: 50, reason: "Enterijerski model postoji" },
          { requires: "complete-model", discountPct: 50, reason: "Kompletan model već postoji" },
        ],
        label: "VR Walkthrough (postojeći model)",
        basePriceEur: 1500,
        unitLabel: "50% popusta — model već izgrađen",
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
            priceEur: 500,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "vr-existing-interactive",
            label: "Interaktivni element",
            description: "Po funkcionalnosti (vrata, svetla, materijali)",
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
        creates: ["complete-model"],
        consumes: [
          { requires: "exterior-shell", discountPct: 50, reason: "Eksterijerski model postoji" },
          { requires: "interior-model", discountPct: 50, reason: "Enterijerski model postoji" },
          { requires: "complete-model", discountPct: 50, reason: "Kompletan model već postoji" },
        ],
        label: "VR Walkthrough (samostalno)",
        basePriceEur: 3000,
        unitLabel: "puna izgradnja + VR optimizacija",
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
            priceEur: 500,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "vr-standalone-interactive",
            label: "Interaktivni element",
            description: "Po funkcionalnosti (vrata, svetla, materijali)",
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
    label: "Virtuelno opremanje",
    sectionLabel: "1.4 — Transformacija",
    icon: "sparkles",
    description: "Fotorealistično opremanje praznih prostora",
    products: [
      {
        id: "vs-static",
        label: "Statički staging",
        basePriceEur: 18,
        unitLabel: "prva opremljena slika",
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
            priceEur: 12,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "vs-room",
            label: "Druga soba (isti objekat)",
            description: "17% popusta — stil definisan",
            priceEur: 15,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 10, priceEur: 13 }],
          },
          {
            id: "vs-restyle",
            label: "Ponovno opremanje (drugi stil)",
            description: "Zamena nameštaja, kompozicija rešena",
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
        label: "360 staging",
        basePriceEur: 34,
        unitLabel: "prvi 360 hotspot",
        includes: [
          "Pun 360 staging sobe",
          "Izbor nameštaja",
          "Podešavanje osvetljenja",
        ],
        addOns: [
          {
            id: "vs-360-hotspot",
            label: "Dodatni hotspot (ista soba)",
            description: "30% popusta — staging postoji",
            priceEur: 24,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "vs-360-room",
            label: "Druga soba (isti objekat)",
            description: "18% popusta — stil definisan",
            priceEur: 28,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 6, priceEur: 24 }],
          },
          {
            id: "vs-360-restyle",
            label: "Ponovno opremanje (drugi stil)",
            description: "Samo zamena stila",
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
    label: "Virtuelna renovacija",
    sectionLabel: "1.4 — Transformacija",
    icon: "refresh",
    description: "Transformacija postojećih prostora novim dizajnom",
    products: [
      {
        id: "reno-image",
        label: "Virtuelna renovacija",
        basePriceEur: 66,
        unitLabel: "kompletna renovacija jednog pogleda",
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
            priceEur: 59,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 3, priceEur: 53 }],
          },
          {
            id: "reno-room",
            label: "Druga soba (isti objekat)",
            description: "15% popusta — paleta definisana",
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
    label: "Dan u noć",
    sectionLabel: "1.4 — Transformacija",
    icon: "sun",
    description: "Transformacija dnevnih fotografija u dramatične sumračne scene",
    products: [
      {
        id: "dtd-image",
        label: "Dan u noć konverzija",
        basePriceEur: 10,
        unitLabel: "po slici",
        includes: ["Zamena neba", "Podešavanje osvetljenja", "Color grading"],
        addOns: [
          {
            id: "dtd-shadow",
            label: "Uklanjanje senki",
            description: "Složena korekcija senki",
            priceEur: 5,
            priceType: "fixed",
            includedQty: 0,
            maxQty: Infinity,
            volumeRules: [],
          },
          {
            id: "dtd-volume",
            label: "Dodatne slike (10+)",
            description: "Volumen cena po slici",
            priceEur: 8,
            priceType: "fixed",
            includedQty: 1,
            maxQty: Infinity,
            volumeRules: [{ afterQty: 10, priceEur: 8 }],
          },
          {
            id: "dtd-rush",
            label: "Hitna isporuka (24h)",
            description: "Prioritetna obrada",
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
    label: "Uklanjanje elemenata",
    sectionLabel: "1.4 — Transformacija",
    icon: "eraser",
    description:
      "Digitalno čišćenje — uklanjanje ličnih stvari, nereda i neželjenih objekata",
    products: [
      {
        id: "ir-simple",
        label: "Jednostavno uklanjanje",
        basePriceEur: 12,
        unitLabel: "po slici",
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
        label: "Složeno uklanjanje",
        basePriceEur: 25,
        unitLabel: "po slici",
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
): { category: ConfiguratorCategory; product: ConfiguratorProduct } | undefined {
  for (const cat of CONFIGURATOR_CATEGORIES) {
    for (const prod of cat.products) {
      if (prod.id === productId) return { category: cat, product: prod };
    }
  }
  return undefined;
}

export function getAddOnDef(
  productId: string,
  addOnId: string,
): ConfiguratorAddOn | undefined {
  const result = getConfiguratorProduct(productId);
  if (!result) return undefined;
  return result.product.addOns.find((ao) => ao.id === addOnId);
}
