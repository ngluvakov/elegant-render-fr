/**
 * tour-assembly.ts — Shared TourAssembly type + pricing for products
 * that can be assembled into an interactive web tour. Currently used
 * by `int-360` (per-floor configurator) and `ext-360` (exterior 360
 * configurator). Decoupling here avoids circular imports between
 * tour360-config and exterior-config.
 *
 * Pricing (per Pillar 1 cenovnik):
 *   - €20 base assembly fee — FREE if the item has ≥5 hotspots
 *   - +€15 floor-plan navigation
 *   - +€35 white-label branding
 *
 * The free-by-hotspot threshold is evaluated per item; since each
 * product appears at most once per order this is also the per-order
 * check.
 */

export type TourAssembly = {
  webTourEnabled: boolean;
  floorPlanNavEnabled: boolean;     // gated by webTour at UI level
  whiteLabelEnabled: boolean;       // gated by webTour at UI level
  // White-label logo lives as an OrderFile with kind="logo" on the
  // item — no need to track its ID here.
};

export type TourAssemblyCalc = {
  enabled: boolean;
  baseCost: number;            // 0 if disabled, 0 if free-by-threshold, else 20
  floorPlanNavCost: number;
  whiteLabelCost: number;
  totalCost: number;
  freeByHotspotThreshold: boolean;
};

export const TOUR_ASSEMBLY_BASE_EUR = 20;
export const TOUR_ASSEMBLY_FREE_HOTSPOT_THRESHOLD = 5;
export const TOUR_FLOOR_PLAN_NAV_EUR = 15;
export const TOUR_WHITE_LABEL_EUR = 35;

export function defaultTourAssembly(): TourAssembly {
  return {
    webTourEnabled: false,
    floorPlanNavEnabled: false,
    whiteLabelEnabled: false,
  };
}

export function calcTourAssemblyCost(
  assembly: TourAssembly,
  totalHotspots: number,
): TourAssemblyCalc {
  if (!assembly.webTourEnabled) {
    return {
      enabled: false,
      baseCost: 0,
      floorPlanNavCost: 0,
      whiteLabelCost: 0,
      totalCost: 0,
      freeByHotspotThreshold: false,
    };
  }
  const free = totalHotspots >= TOUR_ASSEMBLY_FREE_HOTSPOT_THRESHOLD;
  const baseCost = free ? 0 : TOUR_ASSEMBLY_BASE_EUR;
  const floorPlanNavCost = assembly.floorPlanNavEnabled
    ? TOUR_FLOOR_PLAN_NAV_EUR
    : 0;
  const whiteLabelCost = assembly.whiteLabelEnabled ? TOUR_WHITE_LABEL_EUR : 0;
  return {
    enabled: true,
    baseCost,
    floorPlanNavCost,
    whiteLabelCost,
    totalCost: baseCost + floorPlanNavCost + whiteLabelCost,
    freeByHotspotThreshold: free,
  };
}

export function sanitizeTourAssembly(
  a: TourAssembly | undefined,
): TourAssembly {
  const base = defaultTourAssembly();
  if (!a) return base;
  const web = Boolean(a.webTourEnabled);
  return {
    webTourEnabled: web,
    floorPlanNavEnabled: web && Boolean(a.floorPlanNavEnabled),
    whiteLabelEnabled: web && Boolean(a.whiteLabelEnabled),
  };
}
