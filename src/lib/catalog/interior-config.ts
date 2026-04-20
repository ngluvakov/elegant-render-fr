/**
 * interior-config.ts — Rooms + cameras calculation for int-static product.
 *
 * Base package: 10 staged rooms + 10 renders (cameras) for €170.
 * Extra room beyond 10 → +€28. Extra camera beyond 10 renders → +€10.
 * Every room has at least 1 camera. Total renders = sum of cameras across rooms.
 */

export type InteriorRoom = {
  name: string;
  cameras: number;
};

export const INT_STATIC_BASE_EUR = 170;
export const INT_STATIC_INCLUDED_ROOMS = 10;
export const INT_STATIC_INCLUDED_CAMERAS = 10;
export const INT_STATIC_EXTRA_ROOM_EUR = 28;
export const INT_STATIC_EXTRA_CAMERA_EUR = 10;

export type InteriorCalc = {
  totalRooms: number;
  totalCameras: number;
  extraRooms: number;
  extraCameras: number;
  extraRoomsCost: number;
  extraCamerasCost: number;
  totalEur: number;
  remainingRenders: number; // 10 - totalCameras, may be negative
};

export function calcInteriorTotal(rooms: InteriorRoom[]): InteriorCalc {
  const totalRooms = rooms.length;
  const totalCameras = rooms.reduce(
    (s, r) => s + Math.max(1, r.cameras || 1),
    0,
  );

  const extraRooms = Math.max(0, totalRooms - INT_STATIC_INCLUDED_ROOMS);
  const extraCameras = Math.max(0, totalCameras - INT_STATIC_INCLUDED_CAMERAS);

  const extraRoomsCost = extraRooms * INT_STATIC_EXTRA_ROOM_EUR;
  const extraCamerasCost = extraCameras * INT_STATIC_EXTRA_CAMERA_EUR;

  return {
    totalRooms,
    totalCameras,
    extraRooms,
    extraCameras,
    extraRoomsCost,
    extraCamerasCost,
    totalEur: INT_STATIC_BASE_EUR + extraRoomsCost + extraCamerasCost,
    remainingRenders: INT_STATIC_INCLUDED_CAMERAS - totalCameras,
  };
}
