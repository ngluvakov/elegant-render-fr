/**
 * interior-config.ts — Floors + rooms + cameras calculation for int-static.
 *
 * An int-static OrderItem can hold multiple floors. Each floor owns its own
 * rooms/cameras, description, files (via OrderFile.floorId), and advanced
 * fields. First floor base = €170, additional floors = €120 (30% discount).
 * Each floor includes 10 staged rooms + 10 renders; extra room = €28,
 * extra camera = €10. Every room has at least 1 camera.
 */

export type InteriorRoom = {
  name: string;
  cameras: number;
};

export type InteriorFloor = {
  id: string;
  name: string;
  rooms: InteriorRoom[];
  description?: string;
  styleDescription?: string;
  roomDetails?: string;
  technicalNotes?: string;
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
    styleDescription: "",
    roomDetails: "",
    technicalNotes: "",
  };
}
