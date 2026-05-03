/**
 * InteriorQuoteEditor — Per-room configurator for int-static items on /cene.
 * Mirrors the data shape of the portal's interior-config-section
 * (InteriorFloor[]) so math runs through the same calcInteriorTotal helper
 * and pricing matches by construction.
 *
 * Surfaces the price-affecting fields:
 *   - floors (add / remove)
 *   - per-room cameras (each room can have its own count)
 *   - live mini breakdown reflecting calcFloor outputs
 *   - cross-service discount panel in the footer when one applies
 *
 * Style / time-of-day / season / per-room descriptions / file uploads stay
 * portal-only — they don't change the price and the portal has the right
 * context for them post-checkout.
 *
 * Used on: QuoteItemCard for int-static items (/cene page).
 */
"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { formatPublicPrice } from "@/lib/catalog/display-currency";
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

export type EditorDiscount = {
  pct: number;
  reason: string;
  originalTotalEur: number;
  totalEur: number;
};

type Props = {
  floors: InteriorFloor[];
  onChange: (next: InteriorFloor[]) => void;
  /**
   * If a cross-service discount applies to this item, pass it in so the
   * footer can show the original (struck) total alongside the discounted
   * one. Per-floor totals stay un-discounted because the discount is an
   * item-level reduction — splitting it across floors would be arbitrary.
   */
  discount?: EditorDiscount | null;
};

export function InteriorQuoteEditor({ floors, onChange, discount }: Props) {
  const calc = calcInteriorTotal(floors);

  const updateFloor = (index: number, patch: Partial<InteriorFloor>) => {
    onChange(floors.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const addRoom = (floorIdx: number) => {
    const floor = floors[floorIdx];
    if (floor.rooms.length >= MAX_ROOMS_PER_FLOOR) return;
    const next: InteriorRoom = {
      name: `Prostorija ${floor.rooms.length + 1}`,
      cameras: 1,
    };
    updateFloor(floorIdx, { rooms: [...floor.rooms, next] });
  };

  const removeRoom = (floorIdx: number, roomIdx: number) => {
    const floor = floors[floorIdx];
    updateFloor(floorIdx, {
      rooms: floor.rooms.filter((_, i) => i !== roomIdx),
    });
  };

  const setRoomCameras = (
    floorIdx: number,
    roomIdx: number,
    nextCameras: number,
  ) => {
    const clamped = Math.max(1, Math.min(MAX_CAMERAS_PER_ROOM, nextCameras));
    const floor = floors[floorIdx];
    updateFloor(floorIdx, {
      rooms: floor.rooms.map((r, i) =>
        i === roomIdx ? { ...r, cameras: clamped } : r,
      ),
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
        prostorije i kadrovi se obračunavaju iznad praga; sledeći spratovi
        automatski idu po sniženoj ceni (−30%).
      </p>

      <div className="space-y-3">
        {floors.map((floor, idx) => (
          <FloorPanel
            key={floor.id}
            floor={floor}
            index={idx}
            calc={calc.floors[idx]}
            canRemoveFloor={floors.length > 1}
            onAddRoom={() => addRoom(idx)}
            onRemoveRoom={(rIdx) => removeRoom(idx, rIdx)}
            onSetRoomCameras={(rIdx, n) => setRoomCameras(idx, rIdx, n)}
            onRemoveFloor={() => removeFloor(idx)}
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
        </p>
      </div>

      <ItemTotal preDiscountEur={calc.totalEur} discount={discount} />
    </div>
  );
}

function FloorPanel({
  floor,
  index,
  calc,
  canRemoveFloor,
  onAddRoom,
  onRemoveRoom,
  onSetRoomCameras,
  onRemoveFloor,
}: {
  floor: InteriorFloor;
  index: number;
  calc: InteriorFloorCalc;
  canRemoveFloor: boolean;
  onAddRoom: () => void;
  onRemoveRoom: (roomIdx: number) => void;
  onSetRoomCameras: (roomIdx: number, n: number) => void;
  onRemoveFloor: () => void;
}) {
  const floorLabel = index === 0 ? "Sprat 1" : `Sprat ${index + 1}`;
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-foreground">
          {floorLabel}
          {index > 0 && (
            <span className="ml-2 text-[0.68rem] font-medium uppercase tracking-wider text-[color:var(--color-sage-deep)]">
              −30%
            </span>
          )}
        </div>
        {canRemoveFloor && (
          <button
            type="button"
            onClick={onRemoveFloor}
            aria-label={`Ukloni ${floorLabel}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        {floor.rooms.length === 0 && (
          <p className="rounded-lg bg-background/40 px-3 py-3 text-center text-[0.72rem] text-muted-foreground">
            Bez prostorija — dodaj prvu da vidiš obračun.
          </p>
        )}
        {floor.rooms.map((room, rIdx) => (
          <RoomRow
            key={rIdx}
            name={room.name || `Prostorija ${rIdx + 1}`}
            cameras={room.cameras || 1}
            onCamerasChange={(n) => onSetRoomCameras(rIdx, n)}
            onRemove={() => onRemoveRoom(rIdx)}
          />
        ))}
        <button
          type="button"
          onClick={onAddRoom}
          disabled={floor.rooms.length >= MAX_ROOMS_PER_FLOOR}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 bg-transparent px-3 py-2 text-[0.72rem] font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
        >
          <Plus className="h-3 w-3" />
          Dodaj prostoriju
        </button>
      </div>

      <FloorBreakdown calc={calc} />
    </div>
  );
}

function RoomRow({
  name,
  cameras,
  onCamerasChange,
  onRemove,
}: {
  name: string;
  cameras: number;
  onCamerasChange: (n: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-background/60 px-3 py-1.5">
      <span className="truncate text-xs font-medium text-foreground">
        {name}
      </span>
      <div className="flex flex-shrink-0 items-center gap-2">
        <CompactStepper
          label="kadrova"
          value={cameras}
          min={1}
          max={MAX_CAMERAS_PER_ROOM}
          onChange={onCamerasChange}
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Ukloni ${name}`}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function FloorBreakdown({ calc }: { calc: InteriorFloorCalc }) {
  const rows: { label: string; value: string }[] = [
    {
      label: calc.isFirstFloor
        ? "Cena prvog sprata (uključeno 10 prostorija + 10 kadrova)"
        : "Cena dodatnog sprata (−30%)",
      value: formatPublicPrice(calc.baseCost),
    },
  ];
  if (calc.extraRoomsCost > 0) {
    rows.push({
      label: `+${calc.extraRooms} dodatn${calc.extraRooms === 1 ? "a prostorija" : "ih prostorija"} · ${formatPublicPrice(INT_STATIC_EXTRA_ROOM_EUR)}/kom`,
      value: formatPublicPrice(calc.extraRoomsCost),
    });
  }
  if (calc.extraCamerasCost > 0) {
    rows.push({
      label: `+${calc.extraCameras} dodatn${calc.extraCameras === 1 ? "i kadar" : "ih kadrova"} · ${formatPublicPrice(INT_STATIC_EXTRA_CAMERA_EUR)}/kom`,
      value: formatPublicPrice(calc.extraCamerasCost),
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
          {formatPublicPrice(calc.floorTotal)}
        </span>
      </div>
    </div>
  );
}

/**
 * Item-level total + optional cross-service discount panel. Per-floor totals
 * above are accurate to the floor's math (base first floor, discounted
 * additional). The cross-service discount applies to the whole item, not to
 * individual floors, so it lives here at the bottom only.
 */
export function ItemTotal({
  preDiscountEur,
  discount,
}: {
  preDiscountEur: number;
  discount?: EditorDiscount | null;
}) {
  const hasDiscount =
    !!discount && discount.pct > 0 && discount.totalEur < preDiscountEur;
  const savings = hasDiscount ? preDiscountEur - discount.totalEur : 0;

  if (!hasDiscount) {
    return (
      <div className="flex items-baseline justify-between gap-2 rounded-xl bg-foreground/5 px-4 py-3 text-sm">
        <span className="font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Ukupno
        </span>
        <span className="text-base font-bold text-foreground tabular-nums">
          {formatPublicPrice(preDiscountEur)}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl bg-foreground/5 px-4 py-3 text-xs">
      <div className="flex items-baseline justify-between gap-2 text-muted-foreground">
        <span>Subtotal</span>
        <span className="tabular-nums">{formatPublicPrice(preDiscountEur)}</span>
      </div>
      <div className="flex items-baseline justify-between gap-2 text-[color:var(--color-sage-deep)]">
        <span className="min-w-0 truncate">
          −{discount!.pct}%
          <span className="ml-1.5 text-[0.7rem] font-normal text-muted-foreground">
            {discount!.reason}
          </span>
        </span>
        <span className="flex-shrink-0 font-semibold tabular-nums">
          -{formatPublicPrice(savings)}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-2 border-t border-border/40 pt-2 text-sm">
        <span className="font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Ukupno
        </span>
        <span className="text-base font-bold text-foreground tabular-nums">
          {formatPublicPrice(discount!.totalEur)}
        </span>
      </div>
    </div>
  );
}

function CompactStepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  const atMin = value <= min;
  const atMax = value >= max;
  return (
    <div className="flex items-center gap-1.5">
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
        <span className="w-7 text-center text-xs font-semibold text-foreground tabular-nums">
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
      <span className="hidden text-[0.65rem] text-muted-foreground sm:inline">
        {label}
      </span>
    </div>
  );
}

// Re-export the calc helpers consumers may want when rendering this
// editor's totals elsewhere (e.g. the QuoteItemCard's price column).
export { calcFloor, calcInteriorTotal };
