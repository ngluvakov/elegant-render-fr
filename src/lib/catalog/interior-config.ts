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
      "Raw textures — brick, steel, concrete. High ceilings, exposed installations.",
    image: "/styles/industrial-urban.webp",
  },
  {
    id: "scandinavian",
    label: "Scandinavian",
    description:
      "Light neutral colors, white wood, minimalism. Clean and functional.",
    image: "/styles/scandinavian.webp",
  },
  {
    id: "farmhouse",
    label: "Farmhouse",
    description:
      "Rustic elements, weathered wood, warm textiles. Homely and comfortable.",
    image: "/styles/farmhouse.webp",
  },
  {
    id: "modern",
    label: "Modern",
    description:
      "Clean lines, neutral colors, minimal decoration. Strict and orderly.",
    image: "/styles/modern.webp",
  },
  {
    id: "contemporary",
    label: "Contemporary",
    description:
      "Current trends, mixed textures and materials. Elegant without rigid rules.",
    image: "/styles/contemporary.webp",
  },
  {
    id: "mid-century",
    label: "Mid-century",
    description:
      "1950s-60s retro. Organic wood, geometric shapes, warm accents.",
    image: "/styles/mid-century.webp",
  },
  {
    id: "coastal",
    label: "Coastal",
    description:
      "Mediterranean — white, sand and blue, light fabrics, maximum daylight.",
    image: "/styles/coastal.webp",
  },
] as const;
export type RoomStyleId = (typeof ROOM_STYLES)[number]["id"];
export const ROOM_STYLE_IDS = ROOM_STYLES.map((s) => s.id) as RoomStyleId[];

export const TIMES_OF_DAY = [
  { id: "morning", label: "Morning" },
  { id: "midday", label: "Midday" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
  { id: "night", label: "Night" },
] as const;
export type TimeOfDayId = (typeof TIMES_OF_DAY)[number]["id"];
export const TIME_OF_DAY_IDS = TIMES_OF_DAY.map((t) => t.id) as TimeOfDayId[];

export const SEASONS = [
  { id: "spring", label: "Spring" },
  { id: "summer", label: "Summer" },
  { id: "autumn", label: "Autumn" },
  { id: "winter", label: "Winter" },
] as const;
export type SeasonId = (typeof SEASONS)[number]["id"];
export const SEASON_IDS = SEASONS.map((s) => s.id) as SeasonId[];

export type InteriorRoom = {
  name: string;
  cameras: number;
  styleId?: RoomStyleId;
  notes?: string;
};

export type StyleMode = "all" | "per-room";
export const STYLE_MODES = ["all", "per-room"] as const;

export type InteriorFloor = {
  id: string;
  name: string;
  rooms: InteriorRoom[];
  description?: string;
  timeOfDay?: TimeOfDayId;
  season?: SeasonId;
  styleMode?: StyleMode;
  globalStyleId?: RoomStyleId;
};

/**
 * Resolves the style that actually applies to a room. In "all" mode the
 * floor-level globalStyleId wins; the per-room styleId is preserved on
 * the room object but not used. In "per-room" mode the room's own
 * styleId is used. Treat undefined floor.styleMode as "all" for
 * backwards-compat with floors created before the toggle existed.
 */
export function effectiveStyleId(
  floor: InteriorFloor,
  room: InteriorRoom,
): RoomStyleId | undefined {
  return (floor.styleMode ?? "all") === "per-room"
    ? room.styleId
    : floor.globalStyleId;
}

export const INT_STATIC_FIRST_FLOOR_EUR = 170;
export const INT_STATIC_EXTRA_FLOOR_EUR = 120;
export const INT_STATIC_INCLUDED_ROOMS = 10;
export const INT_STATIC_INCLUDED_CAMERAS = 10;
export const INT_STATIC_EXTRA_ROOM_EUR = 28;
export const INT_STATIC_EXTRA_CAMERA_EUR = 10;

export type InteriorPricing = {
  firstFloorEur: number;
  extraFloorEur: number;
  includedRooms: number;
  includedCameras: number;
  extraRoomEur: number;
  extraCameraEur: number;
};

export const DEFAULT_INTERIOR_PRICING: InteriorPricing = {
  firstFloorEur: INT_STATIC_FIRST_FLOOR_EUR,
  extraFloorEur: INT_STATIC_EXTRA_FLOOR_EUR,
  includedRooms: INT_STATIC_INCLUDED_ROOMS,
  includedCameras: INT_STATIC_INCLUDED_CAMERAS,
  extraRoomEur: INT_STATIC_EXTRA_ROOM_EUR,
  extraCameraEur: INT_STATIC_EXTRA_CAMERA_EUR,
};

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
  pricing: InteriorPricing = DEFAULT_INTERIOR_PRICING,
): InteriorFloorCalc {
  const totalRooms = floor.rooms.length;
  const totalCameras = floor.rooms.reduce(
    (s, r) => s + Math.max(1, r.cameras || 1),
    0,
  );

  const extraRooms = Math.max(0, totalRooms - pricing.includedRooms);
  const extraCameras = Math.max(0, totalCameras - pricing.includedCameras);

  const extraRoomsCost = extraRooms * pricing.extraRoomEur;
  const extraCamerasCost = extraCameras * pricing.extraCameraEur;
  const baseCost = isFirstFloor
    ? pricing.firstFloorEur
    : pricing.extraFloorEur;

  return {
    totalRooms,
    totalCameras,
    extraRooms,
    extraCameras,
    extraRoomsCost,
    extraCamerasCost,
    baseCost,
    floorTotal: baseCost + extraRoomsCost + extraCamerasCost,
    remainingRenders: pricing.includedCameras - totalCameras,
    isFirstFloor,
  };
}

export function calcInteriorTotal(
  floors: InteriorFloor[],
  pricing: InteriorPricing = DEFAULT_INTERIOR_PRICING,
): InteriorCalc {
  const floorCalcs = floors.map((f, idx) => calcFloor(f, idx === 0, pricing));
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
    name: index === 0 ? "Floor 1" : `Floor ${index + 1}`,
    rooms: [],
    description: "",
  };
}
