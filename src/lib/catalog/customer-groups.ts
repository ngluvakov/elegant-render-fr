/**
 * customer-groups.ts — Public-facing groupings for the /tarifs preview cards
 * and the configurator's category picker. Internal section labels
 * ("1.1 — Rendering", "1.2 — Planovi") read like a SAP catalog; customers
 * shop by job-to-be-done. This module collapses the 10+ catalog categories
 * into 5 groups a buyer recognizes.
 *
 * Pricing is derived live from CONFIGURATOR_CATEGORIES — never hardcoded —
 * so any catalog price change automatically propagates to the preview.
 */

import {
  CONFIGURATOR_CATEGORIES,
  type ConfiguratorCategory,
} from "./configurator";

export type CustomerGroupId =
  | "exterior-renders"
  | "interior"
  | "plans"
  | "animation"
  | "staging-renovation"
  | "vr-experience";

export type CustomerGroup = {
  id: CustomerGroupId;
  label: string;
  shortLabel: string;
  blurb: string;
  catIds: string[];
  imageSrc: string;
  // Optional MP4 video to render in place of imageSrc on the preview card.
  // The animation group uses this so the card actually animates — matches
  // what the customer is buying. Other groups stay as still images.
  videoSrc?: string;
};

export const CUSTOMER_GROUPS: CustomerGroup[] = [
  {
    id: "exterior-renders",
    label: "Rendus d’extérieur",
    shortLabel: "Extérieur",
    blurb: "Façades, maisons, immeubles, cours et environs",
    catIds: ["exterior", "landscape"],
    imageSrc: "/artwork/pricing-card-exterior.webp",
  },
  {
    id: "interior",
    label: "Intérieur",
    shortLabel: "Intérieur",
    blurb: "Pièces meublées et appartements par niveau",
    catIds: ["interior"],
    imageSrc: "/artwork/pricing-card-interior.webp",
  },
  {
    id: "plans",
    label: "Plans et plans de masse",
    shortLabel: "Plans",
    blurb: "Plans 2D, plans 3D et plans de masse",
    catIds: ["floorplans-2d", "floorplans-3d", "siteplans"],
    imageSrc: "/artwork/pricing-card-plans.webp",
  },
  {
    id: "animation",
    label: "360 et animation",
    shortLabel: "Animation",
    blurb: "Animations 3D et visites virtuelles 360",
    catIds: ["animation"],
    imageSrc: "/artwork/architectural-animation-demo-poster.webp",
    videoSrc: "/artwork/pricing-card-animation.mp4",
  },
  {
    id: "staging-renovation",
    label: "Home staging virtuel et rénovation",
    shortLabel: "Staging",
    blurb: "Home staging, rénovation, jour au crépuscule, suppression d’objets",
    catIds: ["staging", "renovation", "day-to-dusk", "item-removal"],
    imageSrc: "/artwork/pricing-card-staging-renovation.webp",
  },
  {
    id: "vr-experience",
    label: "Expérience VR",
    shortLabel: "VR",
    blurb: "Visite VR immersive — consultation avant production",
    catIds: ["vr-experiences"],
    imageSrc: "/artwork/architectural-animation-demo-poster.webp",
  },
];

export const CUSTOMER_GROUP_BY_ID: Record<CustomerGroupId, CustomerGroup> =
  CUSTOMER_GROUPS.reduce(
    (acc, g) => {
      acc[g.id] = g;
      return acc;
    },
    {} as Record<CustomerGroupId, CustomerGroup>,
  );

/**
 * Lowest entry price across all products in a group's catalog categories.
 * Skips inquiry-only products (consultations like VR) and uses
 * `minSeconds × perSecondEur` for duration-based products (animation).
 *
 * Always returns the live catalog value — never cache or hardcode.
 */
export function getGroupStartingPriceEur(
  group: CustomerGroup,
  categories: ConfiguratorCategory[] = CONFIGURATOR_CATEGORIES,
): number {
  const prices: number[] = [];
  for (const cat of categories) {
    if (!group.catIds.includes(cat.id)) continue;
    for (const product of cat.products) {
      if (product.inquiryOnly) continue;
      const price = product.durationConfig
        ? product.durationConfig.minSeconds *
          product.durationConfig.perSecondEur
        : product.basePriceEur;
      prices.push(price);
    }
  }
  if (prices.length === 0) return 0;
  return Math.min(...prices);
}

/**
 * Given a catalog category id (e.g. "exterior"), find the customer group it
 * belongs to. Used by ServiceAdder to map catalog → customer-facing tab.
 */
export function findGroupForCategory(
  categoryId: string,
): CustomerGroup | undefined {
  return CUSTOMER_GROUPS.find((g) => g.catIds.includes(categoryId));
}
