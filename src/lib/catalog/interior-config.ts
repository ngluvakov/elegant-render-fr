/**
 * interior-config.ts — Floors + rooms + cameras calculation for int-static.
 *
 * An int-static OrderItem can hold multiple floors. Each floor owns its own
 * rooms/cameras, description, files (via OrderFile.floorId), and advanced
 * fields. First floor base = €170, additional floors = €120 (30% discount).
 * Each floor includes 10 staged rooms + 10 renders; extra room = €28,
 * extra camera = €10. Every room has at least 1 camera.
 */

export const ROOM_STYLES = [
  {
    id: "industrial-urban",
    label: "Industrial / urban",
    description:
      "Sirove teksture — cigla, čelik, beton. Visoki plafoni, otvorene instalacije.",
    swatch: "linear-gradient(135deg, #5d5449 0%, #8a7c6e 50%, #3d3530 100%)",
  },
  {
    id: "scandinavian",
    label: "Scandinavian",
    description:
      "Svetle neutralne boje, belo drvo, minimalizam. Čisto i funkcionalno.",
    swatch: "linear-gradient(135deg, #f5f0e6 0%, #d9cdbc 60%, #a89880 100%)",
  },
  {
    id: "farmhouse",
    label: "Farmhouse",
    description:
      "Rustični elementi, patinirano drvo, topli tekstil. Domaće i udobno.",
    swatch: "linear-gradient(135deg, #d9b487 0%, #a88b68 60%, #735a3e 100%)",
  },
  {
    id: "modern",
    label: "Modern",
    description:
      "Čiste linije, neutralne boje, minimalna dekoracija. Strogo i uređeno.",
    swatch: "linear-gradient(135deg, #2d2d2d 0%, #6b6b6b 60%, #c5c5c5 100%)",
  },
  {
    id: "contemporary",
    label: "Contemporary",
    description:
      "Aktualni trendovi, mešanje tekstura i materijala. Elegantno bez rigidnih pravila.",
    swatch: "linear-gradient(135deg, #4a4852 0%, #9c8e80 60%, #e8dfd1 100%)",
  },
  {
    id: "mid-century",
    label: "Mid-century",
    description:
      "Retro 1950ih–60ih. Organsko drvo, geometrijski oblici, topli akcenti.",
    swatch: "linear-gradient(135deg, #c26b3d 0%, #d4a259 50%, #5e7a6a 100%)",
  },
  {
    id: "primorski",
    label: "Primorski stil",
    description:
      "Mediteran — bela, peščana i plava, lagane tkanine, maksimalna svetlost.",
    swatch: "linear-gradient(135deg, #f4f0e8 0%, #b9d5d9 55%, #4c7f96 100%)",
  },
] as const;
export type RoomStyleId = (typeof ROOM_STYLES)[number]["id"];
export const ROOM_STYLE_IDS = ROOM_STYLES.map((s) => s.id) as RoomStyleId[];

export const TIMES_OF_DAY = [
  { id: "jutro", label: "Jutro" },
  { id: "podne", label: "Podne" },
  { id: "popodne", label: "Popodne" },
  { id: "vece", label: "Veče" },
  { id: "noc", label: "Noć" },
] as const;
export type TimeOfDayId = (typeof TIMES_OF_DAY)[number]["id"];
export const TIME_OF_DAY_IDS = TIMES_OF_DAY.map((t) => t.id) as TimeOfDayId[];

export const SEASONS = [
  { id: "prolece", label: "Proleće" },
  { id: "leto", label: "Leto" },
  { id: "jesen", label: "Jesen" },
  { id: "zima", label: "Zima" },
] as const;
export type SeasonId = (typeof SEASONS)[number]["id"];
export const SEASON_IDS = SEASONS.map((s) => s.id) as SeasonId[];

export type InteriorRoom = {
  name: string;
  cameras: number;
  styleId?: RoomStyleId;
  notes?: string;
};

export type InteriorFloor = {
  id: string;
  name: string;
  rooms: InteriorRoom[];
  description?: string;
  timeOfDay?: TimeOfDayId;
  season?: SeasonId;
};

export const INT_STATIC_FIRST_FLOOR_EUR = 170;
export const INT_STATIC_EXTRA_FLOOR_EUR = 120;
export const INT_STATIC_INCLUDED_ROOMS = 10;
export const INT_STATIC_INCLUDED_CAMERAS = 10;
export const INT_STATIC_EXTRA_ROOM_EUR = 28;
export const INT_STATIC_EXTRA_CAMERA_EUR = 10;

export type InteriorFloorCalc = {
  totalRooms: number;
  totalCameras: number;
  extraRooms: number;
  extraCameras: number;
  extraRoomsCost: number;
  extraCamerasCost: number;
  baseCost: number;
  floorTotal: number;
  remainingRenders: number;
  isFirstFloor: boolean;
};

export type InteriorCalc = {
  floors: InteriorFloorCalc[];
  totalEur: number;
  floorCount: number;
};

export function calcFloor(
  floor: InteriorFloor,
  isFirstFloor: boolean,
): InteriorFloorCalc {
  const totalRooms = floor.rooms.length;
  const totalCameras = floor.rooms.reduce(
    (s, r) => s + Math.max(1, r.cameras || 1),
    0,
  );

  const extraRooms = Math.max(0, totalRooms - INT_STATIC_INCLUDED_ROOMS);
  const extraCameras = Math.max(0, totalCameras - INT_STATIC_INCLUDED_CAMERAS);

  const extraRoomsCost = extraRooms * INT_STATIC_EXTRA_ROOM_EUR;
  const extraCamerasCost = extraCameras * INT_STATIC_EXTRA_CAMERA_EUR;
  const baseCost = isFirstFloor
    ? INT_STATIC_FIRST_FLOOR_EUR
    : INT_STATIC_EXTRA_FLOOR_EUR;

  return {
    totalRooms,
    totalCameras,
    extraRooms,
    extraCameras,
    extraRoomsCost,
    extraCamerasCost,
    baseCost,
    floorTotal: baseCost + extraRoomsCost + extraCamerasCost,
    remainingRenders: INT_STATIC_INCLUDED_CAMERAS - totalCameras,
    isFirstFloor,
  };
}

export function calcInteriorTotal(floors: InteriorFloor[]): InteriorCalc {
  const floorCalcs = floors.map((f, idx) => calcFloor(f, idx === 0));
  return {
    floors: floorCalcs,
    totalEur: floorCalcs.reduce((s, f) => s + f.floorTotal, 0),
    floorCount: floors.length,
  };
}

export function makeFloorId(): string {
  return `floor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function newFloor(index: number): InteriorFloor {
  return {
    id: makeFloorId(),
    name: index === 0 ? "Sprat 1" : `Sprat ${index + 1}`,
    rooms: [],
    description: "",
  };
}
