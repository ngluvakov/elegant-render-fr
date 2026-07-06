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

// TourAssembly + pricing now live in tour-assembly.ts so ext-360 can
// reuse without coupling. Re-exported here for backwards-compat with
// callers that imported these names from tour360-config.
export {
  defaultTourAssembly,
  calcTourAssemblyCost,
  sanitizeTourAssembly,
  TOUR_ASSEMBLY_BASE_EUR as TOUR360_ASSEMBLY_BASE_EUR,
  TOUR_ASSEMBLY_FREE_HOTSPOT_THRESHOLD as TOUR360_ASSEMBLY_FREE_HOTSPOT_THRESHOLD,
  TOUR_FLOOR_PLAN_NAV_EUR as TOUR360_FLOOR_PLAN_NAV_EUR,
  TOUR_WHITE_LABEL_EUR as TOUR360_WHITE_LABEL_EUR,
} from "./tour-assembly";
export type {
  TourAssembly,
  TourAssemblyCalc as Tour360AssemblyCalc,
} from "./tour-assembly";

import {
  DEFAULT_TOUR_ASSEMBLY_PRICING,
  calcTourAssemblyCost,
  type TourAssembly,
  type TourAssemblyCalc,
  type TourAssemblyPricing,
} from "./tour-assembly";

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

export type Tour360Pricing = {
  firstFloorEur: number;
  extraFloorEur: number;
  includedHotspots: number;
  includedCameras: number;
  extraHotspotEur: number;
  extraCameraEur: number;
  assembly: TourAssemblyPricing;
};

export const DEFAULT_TOUR360_PRICING: Tour360Pricing = {
  firstFloorEur: TOUR360_FIRST_FLOOR_EUR,
  extraFloorEur: TOUR360_EXTRA_FLOOR_EUR,
  includedHotspots: TOUR360_INCLUDED_HOTSPOTS,
  includedCameras: TOUR360_INCLUDED_CAMERAS,
  extraHotspotEur: TOUR360_EXTRA_HOTSPOT_EUR,
  extraCameraEur: TOUR360_EXTRA_CAMERA_EUR,
  assembly: DEFAULT_TOUR_ASSEMBLY_PRICING,
};

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

export type Tour360Calc = {
  floors: Tour360FloorCalc[];
  totalEur: number;
  floorCount: number;
  totalHotspots: number;
  assembly: TourAssemblyCalc;
};

export function calcTour360Floor(
  floor: Tour360Floor,
  isFirstFloor: boolean,
  pricing: Tour360Pricing = DEFAULT_TOUR360_PRICING,
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

  const extraHotspots = Math.max(0, totalHotspots - pricing.includedHotspots);
  const extraCameras = Math.max(0, totalCameras - pricing.includedCameras);

  const extraHotspotsCost = extraHotspots * pricing.extraHotspotEur;
  const extraCamerasCost = extraCameras * pricing.extraCameraEur;

  const baseCost = isFirstFloor
    ? pricing.firstFloorEur
    : pricing.extraFloorEur;

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
    remainingHotspots: pricing.includedHotspots - totalHotspots,
    remainingCameras: pricing.includedCameras - totalCameras,
    isFirstFloor,
  };
}

export function calcTour360Total(
  floors: Tour360Floor[],
  tourAssembly: TourAssembly,
  pricing: Tour360Pricing = DEFAULT_TOUR360_PRICING,
): Tour360Calc {
  const floorCalcs = floors.map((f, idx) =>
    calcTour360Floor(f, idx === 0, pricing),
  );
  const totalHotspots = floorCalcs.reduce((s, f) => s + f.totalHotspots, 0);
  const assembly = calcTourAssemblyCost(
    tourAssembly,
    totalHotspots,
    pricing.assembly,
  );
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
