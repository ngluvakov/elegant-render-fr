/**
 * InteriorQuoteEditor — Slim per-floor configurator for int-static items
 * on /cene. Mirrors the data shape of the portal's interior-config-section
 * (InteriorFloor[]) so math runs through the same calcInteriorTotal helper
 * and pricing matches by construction.
 *
 * Surfaces ONLY the fields that affect price:
 *   - floors (add / remove)
 *   - per-floor: rooms count, cameras-per-room (uniform across rooms)
 *   - live mini breakdown
 *
 * Everything richer (per-room style, per-room camera count, time of day,
 * season, file uploads, descriptions) is intentionally deferred to the
 * portal post-checkout — that page has the right context (a real Order
 * with files attached) and the customer is no longer browsing.
 *
 * Used on: QuoteItemCard for int-static items (/cene page).
 */
"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatEur } from "@/lib/catalog/calculate";
import {
  INT_STATIC_EXTRA_CAMERA_EUR,
  INT_STATIC_EXTRA_ROOM_EUR,
  calcFloor,
  calcInteriorTotal,
  newFloor,
  type InteriorFloor,
  type InteriorFloorCalc,
  type InteriorRoom,
} from "@/lib/catalog/interior-config";

const MAX_FLOORS = 20;
const MAX_ROOMS_PER_FLOOR = 40;
const MAX_CAMERAS_PER_ROOM = 10;

type Props = {
  floors: InteriorFloor[];
  onChange: (next: InteriorFloor[]) => void;
};

export function InteriorQuoteEditor({ floors, onChange }: Props) {
  const calc = calcInteriorTotal(floors);

  const updateFloor = (index: number, patch: Partial<InteriorFloor>) => {
    onChange(floors.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const setRoomCount = (index: number, nextCount: number) => {
    const clamped = Math.max(0, Math.min(MAX_ROOMS_PER_FLOOR, nextCount));
    const floor = floors[index];
    const currentCameras = camerasPerRoom(floor);
    const nextRooms: InteriorRoom[] = Array.from({ length: clamped }, (_, i) => {
      const existing = floor.rooms[i];
      return existing
        ? { ...existing }
        : {
            name: `Prostorija ${i + 1}`,
            cameras: currentCameras,
          };
    });
    updateFloor(index, { rooms: nextRooms });
  };

  const setCamerasPerRoom = (index: number, nextCameras: number) => {
    const clamped = Math.max(1, Math.min(MAX_CAMERAS_PER_ROOM, nextCameras));
    const floor = floors[index];
    updateFloor(index, {
      rooms: floor.rooms.map((r) => ({ ...r, cameras: clamped })),
    });
  };

  const addFloor = () => {
    if (floors.length >= MAX_FLOORS) return;
    onChange([...floors, newFloor(floors.length)]);
  };

  const removeFloor = (index: number) => {
    if (floors.length <= 1) return;
    onChange(floors.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Svaki sprat uključuje 10 prostorija + 10 kadrova u baznoj ceni. Dodatne
        prostorije i kadrovi se pridružuju iznad praga; sledeći spratovi
        automatski idu po sniženoj ceni (−30%).
      </p>

      <div className="space-y-3">
        {floors.map((floor, idx) => (
          <FloorRow
            key={floor.id}
            floor={floor}
            index={idx}
            calc={calc.floors[idx]}
            canRemove={floors.length > 1}
            onRoomCountChange={(n) => setRoomCount(idx, n)}
            onCamerasPerRoomChange={(n) => setCamerasPerRoom(idx, n)}
            onRemove={() => removeFloor(idx)}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border/60 bg-background/40 px-4 py-3">
        <button
          type="button"
          onClick={addFloor}
          disabled={floors.length >= MAX_FLOORS}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent transition-all hover:bg-accent hover:text-white disabled:opacity-40 disabled:hover:bg-accent/15 disabled:hover:text-accent"
        >
          <Plus className="h-3 w-3" />
          Dodaj sprat
        </button>
        <p className="text-right text-xs text-muted-foreground">
          {floors.length} {floors.length === 1 ? "sprat" : "sprata"}
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
  onCamerasPerRoomChange,
  onRemove,
}: {
  floor: InteriorFloor;
  index: number;
  calc: InteriorFloorCalc;
  canRemove: boolean;
  onRoomCountChange: (n: number) => void;
  onCamerasPerRoomChange: (n: number) => void;
  onRemove: () => void;
}) {
  const roomCount = floor.rooms.length;
  const cameras = camerasPerRoom(floor);

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

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Stepper
          label="Prostorije"
          hint="ukupno na ovom spratu"
          value={roomCount}
          min={0}
          max={MAX_ROOMS_PER_FLOOR}
          onChange={onRoomCountChange}
        />
        <Stepper
          label="Kadrova po sobi"
          hint={cameras === 1 ? "1 kadar (uobičajeno)" : `${cameras} kadrova po sobi`}
          value={cameras}
          min={1}
          max={MAX_CAMERAS_PER_ROOM}
          onChange={onCamerasPerRoomChange}
          disabled={roomCount === 0}
        />
      </div>

      <FloorBreakdown calc={calc} />
    </div>
  );
}

function FloorBreakdown({ calc }: { calc: InteriorFloorCalc }) {
  const rows: { label: string; value: string }[] = [
    {
      label: calc.isFirstFloor
        ? "Cena prvog sprata (uključeno 10 prostorija + 10 kadrova)"
        : "Cena dodatnog sprata (−30%)",
      value: formatEur(calc.baseCost),
    },
  ];
  if (calc.extraRoomsCost > 0) {
    rows.push({
      label: `+${calc.extraRooms} dodatn${calc.extraRooms === 1 ? "a prostorija" : "ih prostorija"} · €${INT_STATIC_EXTRA_ROOM_EUR}/kom`,
      value: formatEur(calc.extraRoomsCost),
    });
  }
  if (calc.extraCamerasCost > 0) {
    rows.push({
      label: `+${calc.extraCameras} dodatn${calc.extraCameras === 1 ? "i kadar" : "ih kadrova"} · €${INT_STATIC_EXTRA_CAMERA_EUR}/kom`,
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

// On /cene we model uniform cameras per room (each floor's rooms share the
// same camera count). Portal lets the customer customize per-room post-
// checkout — that variance is preserved here by reading the existing
// rooms' max(cameras) so re-hydrating a portal-edited cart on /cene
// shows a sensible uniform value rather than collapsing to 1.
function camerasPerRoom(floor: InteriorFloor): number {
  if (floor.rooms.length === 0) return 1;
  return Math.max(
    1,
    Math.max(...floor.rooms.map((r) => Math.max(1, r.cameras || 1))),
  );
}

// Re-export the calc helpers consumers may want when rendering this
// editor's totals elsewhere (e.g. the QuoteItemCard's price column).
export { calcFloor, calcInteriorTotal };
