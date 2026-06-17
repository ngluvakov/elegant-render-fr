/**
 * tour-assembly.ts — Shared TourAssembly type + pricing for products
 * that can be assembled into an interactive web tour. Currently used
 * by `int-360` (per-floor configurator) and `ext-360` (exterior 360
 * configurator). Decoupling here avoids circular imports between
 * tour360-config and exterior-config.
 *
 * Pricing (per Pillar 1 cenovnik):
 *   - 2.344 RSD base assembly fee — FREE if the item has ≥5 hotspots
 *   - +1.758 RSD floor-plan navigation
 *   - +4.102 RSD white-label branding
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

export const TOUR_ASSEMBLY_BASE_RSD = 2344;
export const TOUR_ASSEMBLY_FREE_HOTSPOT_THRESHOLD = 5;
export const TOUR_FLOOR_PLAN_NAV_RSD = 1758;
export const TOUR_WHITE_LABEL_RSD = 4102;

export type TourAssemblyPricing = {
  baseRsd: number;
  freeHotspotThreshold: number;
  floorPlanNavRsd: number;
  whiteLabelRsd: number;
};

export const DEFAULT_TOUR_ASSEMBLY_PRICING: TourAssemblyPricing = {
  baseRsd: TOUR_ASSEMBLY_BASE_RSD,
  freeHotspotThreshold: TOUR_ASSEMBLY_FREE_HOTSPOT_THRESHOLD,
  floorPlanNavRsd: TOUR_FLOOR_PLAN_NAV_RSD,
  whiteLabelRsd: TOUR_WHITE_LABEL_RSD,
};

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
  pricing: TourAssemblyPricing = DEFAULT_TOUR_ASSEMBLY_PRICING,
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
  const free = totalHotspots >= pricing.freeHotspotThreshold;
  const baseCost = free ? 0 : pricing.baseRsd;
  const floorPlanNavCost = assembly.floorPlanNavEnabled
    ? pricing.floorPlanNavRsd
    : 0;
  const whiteLabelCost = assembly.whiteLabelEnabled
    ? pricing.whiteLabelRsd
    : 0;
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
