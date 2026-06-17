/**
 * customer-groups.ts — Public-facing groupings for the /cene preview cards
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
  | "renderi-eksterijera"
  | "enterijer"
  | "planovi"
  | "animacija"
  | "opremanje-renovacija"
  | "vr-iskustvo";

export type CustomerGroup = {
  id: CustomerGroupId;
  label: string;
  shortLabel: string;
  blurb: string;
  catIds: string[];
  imageSrc: string;
  // Optional MP4 video to render in place of imageSrc on the preview card.
  // The animacija group uses this so the card actually animates — matches
  // what the customer is buying. Other groups stay as still images.
  videoSrc?: string;
};

export const CUSTOMER_GROUPS: CustomerGroup[] = [
  {
    id: "renderi-eksterijera",
    label: "Renderi eksterijera",
    shortLabel: "Eksterijer",
    blurb: "Fasade, kuće, zgrade, dvorišta i okruženje",
    catIds: ["exterior", "landscape"],
    imageSrc: "/artwork/cene-card-eksterijer.webp",
  },
  {
    id: "enterijer",
    label: "Enterijer",
    shortLabel: "Enterijer",
    blurb: "Opremljene sobe i stanovi po spratu",
    catIds: ["interior"],
    imageSrc: "/artwork/cene-card-enterijer.webp",
  },
  {
    id: "planovi",
    label: "Planovi & situacioni prikazi",
    shortLabel: "Planovi",
    blurb: "2D osnove, 3D planovi i situacioni prikazi",
    catIds: ["floorplans-2d", "floorplans-3d", "siteplans"],
    imageSrc: "/artwork/cene-card-planovi.webp",
  },
  {
    id: "animacija",
    label: "360 i Animacija",
    shortLabel: "Animacija",
    blurb: "3D animacije i 360° ture",
    catIds: ["animation"],
    imageSrc: "/artwork/cene-card-animacija.webp",
    videoSrc: "/artwork/cene-card-animacija.mp4",
  },
  {
    id: "opremanje-renovacija",
    label: "Virtuelno opremanje i renovacija",
    shortLabel: "Opremanje",
    blurb: "Staging, renovacija, dan u noć, uklanjanje elemenata",
    catIds: ["staging", "renovation", "day-to-dusk", "item-removal"],
    imageSrc: "/artwork/cene-card-opremanje-renovacija.webp",
  },
  {
    id: "vr-iskustvo",
    label: "VR iskustvo",
    shortLabel: "VR",
    blurb: "Imerzivni VR walkthrough — konsultacija pre izrade",
    catIds: ["vr-experiences"],
    imageSrc: "/artwork/cene-card-animacija.webp",
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
 * `minSeconds × perSecondRsd` for duration-based products (animation).
 *
 * Always returns the live catalog value — never cache or hardcode.
 */
export function getGroupStartingPriceRsd(
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
          product.durationConfig.perSecondRsd
        : product.basePriceRsd;
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
