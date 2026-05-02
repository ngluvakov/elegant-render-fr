/**
 * Tour360QuoteEditor — Slim per-floor configurator for int-360 items on
 * /cene. Mirrors the data shape of the portal's tour360-config-section
 * (Tour360Floor[] + TourAssembly) so math runs through calcTour360Total
 * and pricing matches the portal by construction.
 *
 * Surfaces ONLY the fields that affect price for the typical preview:
 *   - floors (add / remove)
 *   - per-floor: rooms count, hotspots-per-room, static-cameras-per-room
 *   - live mini breakdown
 *
 * TourAssembly toggles (web tour / floor plan / white label) are
 * deferred to the portal — they ride on the order and are easier to
 * decide once the customer has committed.
 *
 * Used on: QuoteItemCard for int-360 items (/cene page).
 */
"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatEur } from "@/lib/catalog/calculate";
import {
  TOUR360_EXTRA_CAMERA_EUR,
  TOUR360_EXTRA_HOTSPOT_EUR,
  calcTour360Total,
  newTour360Floor,
  type Tour360Config,
  type Tour360Floor,
  type Tour360FloorCalc,
  type Tour360Room,
} from "@/lib/catalog/tour360-config";

const MAX_FLOORS = 20;
const MAX_ROOMS_PER_FLOOR = 40;
const MAX_HOTSPOTS_PER_ROOM = 10;
const MAX_CAMERAS_PER_ROOM = 10;

type Props = {
  config: Tour360Config;
  onChange: (next: Tour360Config) => void;
};

export function Tour360QuoteEditor({ config, onChange }: Props) {
  const calc = calcTour360Total(config.floors, config.tourAssembly);

  const updateFloors = (next: Tour360Floor[]) => {
    onChange({ ...config, floors: next });
  };

  const updateFloor = (index: number, patch: Partial<Tour360Floor>) => {
    updateFloors(
      config.floors.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    );
  };

  const setRoomCount = (index: number, nextCount: number) => {
    const clamped = Math.max(0, Math.min(MAX_ROOMS_PER_FLOOR, nextCount));
    const floor = config.floors[index];
    const hotspots = hotspotsPerRoom(floor);
    const cameras = staticCamerasPerRoom(floor);
    const nextRooms: Tour360Room[] = Array.from({ length: clamped }, (_, i) => {
      const existing = floor.rooms[i];
      return existing
        ? { ...existing }
        : {
            name: `Prostorija ${i + 1}`,
            hotspots,
            staticCameras: cameras,
          };
    });
    updateFloor(index, { rooms: nextRooms });
  };

  const setHotspotsPerRoom = (index: number, nextHotspots: number) => {
    const clamped = Math.max(0, Math.min(MAX_HOTSPOTS_PER_ROOM, nextHotspots));
    const floor = config.floors[index];
    updateFloor(index, {
      rooms: floor.rooms.map((r) => ({ ...r, hotspots: clamped })),
    });
  };

  const setStaticCamerasPerRoom = (index: number, nextCameras: number) => {
    const clamped = Math.max(0, Math.min(MAX_CAMERAS_PER_ROOM, nextCameras));
    const floor = config.floors[index];
    updateFloor(index, {
      rooms: floor.rooms.map((r) => ({ ...r, staticCameras: clamped })),
    });
  };

  const addFloor = () => {
    if (config.floors.length >= MAX_FLOORS) return;
    updateFloors([...config.floors, newTour360Floor(config.floors.length)]);
  };

  const removeFloor = (index: number) => {
    if (config.floors.length <= 1) return;
    updateFloors(config.floors.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Svaki sprat uključuje 10 prostorija + 10 hotspotova + 10 statičkih
        kadrova u baznoj ceni. Iznad praga se obračunavaju dodatni; sledeći
        spratovi automatski idu po sniženoj ceni (−30%). Web ture i white-label
        opcije se konfigurišu u portalu posle naručivanja.
      </p>

      <div className="space-y-3">
        {config.floors.map((floor, idx) => (
          <FloorRow
            key={floor.id}
            floor={floor}
            index={idx}
            calc={calc.floors[idx]}
            canRemove={config.floors.length > 1}
            onRoomCountChange={(n) => setRoomCount(idx, n)}
            onHotspotsPerRoomChange={(n) => setHotspotsPerRoom(idx, n)}
            onStaticCamerasPerRoomChange={(n) =>
              setStaticCamerasPerRoom(idx, n)
            }
            onRemove={() => removeFloor(idx)}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border/60 bg-background/40 px-4 py-3">
        <button
          type="button"
          onClick={addFloor}
          disabled={config.floors.length >= MAX_FLOORS}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent transition-all hover:bg-accent hover:text-white disabled:opacity-40 disabled:hover:bg-accent/15 disabled:hover:text-accent"
        >
          <Plus className="h-3 w-3" />
          Dodaj sprat
        </button>
        <p className="text-right text-xs text-muted-foreground">
          {config.floors.length}{" "}
          {config.floors.length === 1 ? "sprat" : "sprata"}
          <span className="mx-1.5 text-foreground/30">·</span>
          ukupno{" "}
          <span className="font-semibold text-foreground">
            {formatEur(calc.totalEur)}
          </span>
        </p>
      </div>
    </div>
  );
}

function FloorRow({
  floor,
  index,
  calc,
  canRemove,
  onRoomCountChange,
  onHotspotsPerRoomChange,
  onStaticCamerasPerRoomChange,
  onRemove,
}: {
  floor: Tour360Floor;
  index: number;
  calc: Tour360FloorCalc;
  canRemove: boolean;
  onRoomCountChange: (n: number) => void;
  onHotspotsPerRoomChange: (n: number) => void;
  onStaticCamerasPerRoomChange: (n: number) => void;
  onRemove: () => void;
}) {
  const roomCount = floor.rooms.length;
  const hotspots = hotspotsPerRoom(floor);
  const cameras = staticCamerasPerRoom(floor);

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-foreground">
          {index === 0 ? "Sprat 1" : `Sprat ${index + 1}`}
          {index > 0 && (
            <span className="ml-2 text-[0.68rem] font-medium uppercase tracking-wider text-[color:var(--color-sage-deep)]">
              −30%
            </span>
          )}
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Ukloni ${index === 0 ? "Sprat 1" : `Sprat ${index + 1}`}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Stepper
          label="Prostorije"
          hint="ukupno na ovom spratu"
          value={roomCount}
          min={0}
          max={MAX_ROOMS_PER_FLOOR}
          onChange={onRoomCountChange}
        />
        <Stepper
          label="Hotspotova po sobi"
          hint={hotspots === 1 ? "1 hotspot (uobičajeno)" : `${hotspots} po sobi`}
          value={hotspots}
          min={0}
          max={MAX_HOTSPOTS_PER_ROOM}
          onChange={onHotspotsPerRoomChange}
          disabled={roomCount === 0}
        />
        <Stepper
          label="Statičkih kadrova po sobi"
          hint={cameras === 0 ? "bez statičkih" : `${cameras} po sobi`}
          value={cameras}
          min={0}
          max={MAX_CAMERAS_PER_ROOM}
          onChange={onStaticCamerasPerRoomChange}
          disabled={roomCount === 0}
        />
      </div>

      <FloorBreakdown calc={calc} />
    </div>
  );
}

function FloorBreakdown({ calc }: { calc: Tour360FloorCalc }) {
  const rows: { label: string; value: string }[] = [
    {
      label: calc.isFirstFloor
        ? "Cena prvog sprata (uključeno 10 prostorija + 10 hotspotova + 10 kadrova)"
        : "Cena dodatnog sprata (−30%)",
      value: formatEur(calc.baseCost),
    },
  ];
  if (calc.extraHotspotsCost > 0) {
    rows.push({
      label: `+${calc.extraHotspots} dodatn${calc.extraHotspots === 1 ? "i hotspot" : "ih hotspotova"} · €${TOUR360_EXTRA_HOTSPOT_EUR}/kom`,
      value: formatEur(calc.extraHotspotsCost),
    });
  }
  if (calc.extraCamerasCost > 0) {
    rows.push({
      label: `+${calc.extraCameras} dodatn${calc.extraCameras === 1 ? "i kadar" : "ih kadrova"} · €${TOUR360_EXTRA_CAMERA_EUR}/kom`,
      value: formatEur(calc.extraCamerasCost),
    });
  }

  return (
    <div className="mt-3 space-y-1 border-t border-border/40 pt-2.5">
      {rows.map((r) => (
        <div
          key={r.label}
          className="flex items-baseline justify-between gap-2 text-[0.72rem]"
        >
          <span className="text-muted-foreground">{r.label}</span>
          <span className="font-semibold text-foreground tabular-nums">
            {r.value}
          </span>
        </div>
      ))}
      <div className="mt-1.5 flex items-baseline justify-between gap-2 border-t border-border/40 pt-2 text-xs">
        <span className="font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Sprat ukupno
        </span>
        <span className="text-sm font-bold text-foreground tabular-nums">
          {formatEur(calc.floorTotal)}
        </span>
      </div>
    </div>
  );
}

function Stepper({
  label,
  hint,
  value,
  min,
  max,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (n: number) => void;
}) {
  const atMin = disabled || value <= min;
  const atMax = disabled || value >= max;
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg bg-background/60 px-3 py-2",
        disabled && "opacity-50",
      )}
    >
      <div className="min-w-0">
        <div className="text-xs font-medium text-foreground">{label}</div>
        <div className="text-[0.65rem] text-muted-foreground">{hint}</div>
      </div>
      <div className="flex items-center rounded-md bg-secondary/70">
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={atMin}
          aria-label={`Smanji ${label}`}
          className="flex h-7 w-7 items-center justify-center rounded-l-md transition-colors hover:bg-muted disabled:opacity-30"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-8 text-center text-sm font-semibold text-foreground tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={atMax}
          aria-label={`Povećaj ${label}`}
          className="flex h-7 w-7 items-center justify-center rounded-r-md transition-colors hover:bg-muted disabled:opacity-30"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// Read uniform per-room hotspot count from existing floor state. Defaults
// to 1 when rooms array is empty so the next room added picks up that
// sensible baseline. Mirrors the portal's per-room hotspot picker reduced
// to a single slider — the per-room variance is preserved on round-trip
// because we only collapse to uniform on /cene's UI surface.
function hotspotsPerRoom(floor: Tour360Floor): number {
  if (floor.rooms.length === 0) return 1;
  return Math.max(
    0,
    Math.max(...floor.rooms.map((r) => Math.max(0, r.hotspots || 0))),
  );
}

function staticCamerasPerRoom(floor: Tour360Floor): number {
  if (floor.rooms.length === 0) return 0;
  return Math.max(
    0,
    Math.max(...floor.rooms.map((r) => Math.max(0, r.staticCameras || 0))),
  );
}
