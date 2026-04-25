/**
 * tour360-config.ts — Per-floor configurator data model + pricing for the
 * int-360 product (360 virtual tour). Mirrors interior-config.ts's shape
 * and helper layout but with two per-room steppers (hotspots + static
 * cameras) and a per-item TourAssembly section.
 *
 * Prices reuse the values from the existing int-360 catalog entry so the
 * per-floor model just re-packages them: floor base €295 / extra floor
 * €205 (-30%), included 10 rooms + 10 hotspots + 10 static cameras,
 * extras €45 / €27 / €10 respectively. TourAssembly toggles are
 * operational flags in v1 (no price impact).
 */

import {
  ROOM_STYLES,
  TIMES_OF_DAY,
  SEASONS,
  ROOM_STYLE_IDS,
  TIME_OF_DAY_IDS,
  SEASON_IDS,
  STYLE_MODES,
  makeFloorId,
  type RoomStyleId,
  type TimeOfDayId,
  type SeasonId,
  type StyleMode,
} from "./interior-config";

// Re-export shared style/time/season vocab so consumers can import either
// from interior-config or tour360-config interchangeably.
export {
  ROOM_STYLES,
  TIMES_OF_DAY,
  SEASONS,
  ROOM_STYLE_IDS,
  TIME_OF_DAY_IDS,
  SEASON_IDS,
  STYLE_MODES,
  makeFloorId,
};
export type { RoomStyleId, TimeOfDayId, SeasonId, StyleMode };

export type Tour360Room = {
  name: string;
  hotspots: number;       // default 1, min 0
  staticCameras: number;  // default 0, min 0
  styleId?: RoomStyleId;
  notes?: string;
};

export type Tour360Floor = {
  id: string;
  name: string;
  rooms: Tour360Room[];
  description?: string;
  timeOfDay?: TimeOfDayId;
  season?: SeasonId;
  styleMode?: StyleMode;
  globalStyleId?: RoomStyleId;
};

export type TourAssembly = {
  webTourEnabled: boolean;          // default false
  floorPlanNavEnabled: boolean;     // gated by webTour at UI level
  whiteLabelEnabled: boolean;       // gated by webTour at UI level
  // The white-label logo lives as an OrderFile with kind="logo" on this
  // item — no need to track its ID here. The UI filters files by kind.
};

export type Tour360Config = {
  floors: Tour360Floor[];
  tourAssembly: TourAssembly;
};

export const TOUR360_FIRST_FLOOR_EUR = 295;
export const TOUR360_EXTRA_FLOOR_EUR = 205;          // -30% multi-floor
export const TOUR360_INCLUDED_HOTSPOTS = 10;         // total hotspots / floor
export const TOUR360_INCLUDED_CAMERAS = 10;          // static cameras / floor
export const TOUR360_EXTRA_HOTSPOT_EUR = 27;         // 11th+ hotspot per floor
export const TOUR360_EXTRA_CAMERA_EUR = 10;          // 11th+ static camera
export const TOUR360_ASSEMBLY_BASE_EUR = 20;         // free if order has ≥5 hotspots
export const TOUR360_ASSEMBLY_FREE_HOTSPOT_THRESHOLD = 5;
export const TOUR360_FLOOR_PLAN_NAV_EUR = 15;
export const TOUR360_WHITE_LABEL_EUR = 35;

export type Tour360FloorCalc = {
  totalRooms: number;
  totalHotspots: number;
  totalCameras: number;
  extraHotspots: number;       // hotspots beyond the 10 included on this floor
  extraCameras: number;
  extraHotspotsCost: number;
  extraCamerasCost: number;
  baseCost: number;
  floorTotal: number;
  remainingHotspots: number;
  remainingCameras: number;
  isFirstFloor: boolean;
};

export type Tour360AssemblyCalc = {
  enabled: boolean;
  baseCost: number;            // 0 if disabled, 0 if free-by-threshold, else 20
  floorPlanNavCost: number;
  whiteLabelCost: number;
  totalCost: number;
  freeByHotspotThreshold: boolean;
};

export type Tour360Calc = {
  floors: Tour360FloorCalc[];
  totalEur: number;
  floorCount: number;
  totalHotspots: number;
  assembly: Tour360AssemblyCalc;
};

export function calcTour360Floor(
  floor: Tour360Floor,
  isFirstFloor: boolean,
): Tour360FloorCalc {
  const totalRooms = floor.rooms.length;
  const totalHotspots = floor.rooms.reduce(
    (s, r) => s + Math.max(0, r.hotspots || 0),
    0,
  );
  const totalCameras = floor.rooms.reduce(
    (s, r) => s + Math.max(0, r.staticCameras || 0),
    0,
  );

  const extraHotspots = Math.max(0, totalHotspots - TOUR360_INCLUDED_HOTSPOTS);
  const extraCameras = Math.max(0, totalCameras - TOUR360_INCLUDED_CAMERAS);

  const extraHotspotsCost = extraHotspots * TOUR360_EXTRA_HOTSPOT_EUR;
  const extraCamerasCost = extraCameras * TOUR360_EXTRA_CAMERA_EUR;

  const baseCost = isFirstFloor
    ? TOUR360_FIRST_FLOOR_EUR
    : TOUR360_EXTRA_FLOOR_EUR;

  return {
    totalRooms,
    totalHotspots,
    totalCameras,
    extraHotspots,
    extraCameras,
    extraHotspotsCost,
    extraCamerasCost,
    baseCost,
    floorTotal: baseCost + extraHotspotsCost + extraCamerasCost,
    remainingHotspots: TOUR360_INCLUDED_HOTSPOTS - totalHotspots,
    remainingCameras: TOUR360_INCLUDED_CAMERAS - totalCameras,
    isFirstFloor,
  };
}

export function defaultTourAssembly(): TourAssembly {
  return {
    webTourEnabled: false,
    floorPlanNavEnabled: false,
    whiteLabelEnabled: false,
  };
}

// Tour Assembly: €20 base (FREE if total hotspots ≥ 5), +€15 floor plan
// nav, +€35 white-label. Per cenovnik (Pillar 1, "Tour Assembly &
// Hosting"). The free threshold is per the user's own int-360 item,
// which is also the per-order total since each product can only appear
// once per order (see addOrderItem).
export function calcTourAssemblyCost(
  assembly: TourAssembly,
  totalHotspots: number,
): Tour360AssemblyCalc {
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
  const free = totalHotspots >= TOUR360_ASSEMBLY_FREE_HOTSPOT_THRESHOLD;
  const baseCost = free ? 0 : TOUR360_ASSEMBLY_BASE_EUR;
  const floorPlanNavCost = assembly.floorPlanNavEnabled
    ? TOUR360_FLOOR_PLAN_NAV_EUR
    : 0;
  const whiteLabelCost = assembly.whiteLabelEnabled ? TOUR360_WHITE_LABEL_EUR : 0;
  return {
    enabled: true,
    baseCost,
    floorPlanNavCost,
    whiteLabelCost,
    totalCost: baseCost + floorPlanNavCost + whiteLabelCost,
    freeByHotspotThreshold: free,
  };
}

export function calcTour360Total(
  floors: Tour360Floor[],
  tourAssembly: TourAssembly,
): Tour360Calc {
  const floorCalcs = floors.map((f, idx) => calcTour360Floor(f, idx === 0));
  const totalHotspots = floorCalcs.reduce((s, f) => s + f.totalHotspots, 0);
  const assembly = calcTourAssemblyCost(tourAssembly, totalHotspots);
  return {
    floors: floorCalcs,
    floorCount: floors.length,
    totalHotspots,
    assembly,
    totalEur:
      floorCalcs.reduce((s, f) => s + f.floorTotal, 0) + assembly.totalCost,
  };
}

export function newTour360Floor(index: number): Tour360Floor {
  return {
    id: makeFloorId(),
    name: index === 0 ? "Sprat 1" : `Sprat ${index + 1}`,
    rooms: [],
    description: "",
  };
}
