/**
 * Tour360QuoteEditor — Per-room configurator for int-360 items on /pricing.
 * Mirrors the data shape of the portal's tour360-config-section
 * (Tour360Floor[] + TourAssembly) so math runs through calcTour360Total
 * and pricing matches the portal by construction.
 *
 * Surfaces the price-affecting fields:
 *   - floors (add / remove)
 *   - per-room hotspots + static cameras (each room independently)
 *   - tour assembly toggles (web tour + floor-plan nav + white-label)
 *   - cross-service discount panel in the footer when one applies
 *
 * Style / time-of-day / season / per-room descriptions / file uploads stay
 * portal-only — they don't change the price. The white-label option still
 * needs its logo uploaded later in the portal; here we just bill the fee.
 *
 * Used on: QuoteItemCard for int-360 items (/pricing page).
 */
"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  formatPublicPrice,
  type DisplayCurrency,
  type PublicPricingFormatSettings,
} from "@/lib/catalog/display-currency";
import {
  calcTour360Total,
  newTour360Floor,
  type Tour360Config,
  type Tour360Floor,
  type Tour360FloorCalc,
  type Tour360Pricing,
  type Tour360Room,
  type TourAssembly,
} from "@/lib/catalog/tour360-config";
import { ItemTotal, type EditorDiscount } from "./interior-quote-editor";

const MAX_FLOORS = 20;
const MAX_ROOMS_PER_FLOOR = 40;
const MAX_HOTSPOTS_PER_ROOM = 10;
const MAX_CAMERAS_PER_ROOM = 10;

type Props = {
  config: Tour360Config;
  onChange: (next: Tour360Config) => void;
  displayCurrency: DisplayCurrency;
  pricingSettings?: PublicPricingFormatSettings;
  pricing?: Tour360Pricing;
  /**
   * Cross-service discount metadata, propagated from the QuoteItemCard so
   * the footer can show the original (struck) total alongside the
   * discounted one. Per-floor totals stay un-discounted.
   */
  discount?: EditorDiscount | null;
};

export function Tour360QuoteEditor({
  config,
  onChange,
  discount,
  displayCurrency,
  pricingSettings,
  pricing,
}: Props) {
  const calc = calcTour360Total(config.floors, config.tourAssembly, pricing);

  const updateFloors = (next: Tour360Floor[]) => {
    onChange({ ...config, floors: next });
  };

  const updateFloor = (index: number, patch: Partial<Tour360Floor>) => {
    updateFloors(
      config.floors.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    );
  };

  const addRoom = (floorIdx: number) => {
    const floor = config.floors[floorIdx];
    if (floor.rooms.length >= MAX_ROOMS_PER_FLOOR) return;
    const next: Tour360Room = {
      name: `Room ${floor.rooms.length + 1}`,
      hotspots: 1,
      staticCameras: 0,
    };
    updateFloor(floorIdx, { rooms: [...floor.rooms, next] });
  };

  const removeRoom = (floorIdx: number, roomIdx: number) => {
    const floor = config.floors[floorIdx];
    updateFloor(floorIdx, {
      rooms: floor.rooms.filter((_, i) => i !== roomIdx),
    });
  };

  const setRoomHotspots = (floorIdx: number, roomIdx: number, n: number) => {
    const clamped = Math.max(0, Math.min(MAX_HOTSPOTS_PER_ROOM, n));
    const floor = config.floors[floorIdx];
    updateFloor(floorIdx, {
      rooms: floor.rooms.map((r, i) =>
        i === roomIdx ? { ...r, hotspots: clamped } : r,
      ),
    });
  };

  const setRoomStaticCameras = (
    floorIdx: number,
    roomIdx: number,
    n: number,
  ) => {
    const clamped = Math.max(0, Math.min(MAX_CAMERAS_PER_ROOM, n));
    const floor = config.floors[floorIdx];
    updateFloor(floorIdx, {
      rooms: floor.rooms.map((r, i) =>
        i === roomIdx ? { ...r, staticCameras: clamped } : r,
      ),
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

  const setAssembly = (patch: Partial<TourAssembly>) => {
    onChange({
      ...config,
      tourAssembly: { ...config.tourAssembly, ...patch },
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Each floor includes 10 rooms + 10 hotspots + 10 static frames in the
        base price. Additional items are charged above that threshold; following
        floors are automatically priced at a discount (-30%).
      </p>

      <div className="space-y-3">
        {config.floors.map((floor, idx) => (
          <FloorPanel
            key={floor.id}
            floor={floor}
            index={idx}
            calc={calc.floors[idx]}
            displayCurrency={displayCurrency}
            pricingSettings={pricingSettings}
            pricing={pricing}
            canRemoveFloor={config.floors.length > 1}
            onAddRoom={() => addRoom(idx)}
            onRemoveRoom={(rIdx) => removeRoom(idx, rIdx)}
            onSetRoomHotspots={(rIdx, n) => setRoomHotspots(idx, rIdx, n)}
            onSetRoomStaticCameras={(rIdx, n) =>
              setRoomStaticCameras(idx, rIdx, n)
            }
            onRemoveFloor={() => removeFloor(idx)}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border/60 bg-background/40 px-4 py-3">
        <button
          type="button"
          onClick={addFloor}
          disabled={config.floors.length >= MAX_FLOORS}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent transition-all hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:hover:bg-accent/15 disabled:hover:text-accent"
        >
          <Plus className="h-3 w-3" />
          Add floor
        </button>
        <p className="text-right text-xs text-muted-foreground">
          {config.floors.length}{" "}
          {config.floors.length === 1 ? "floor" : "floors"}
        </p>
      </div>

      <TourAssemblySection
        assembly={config.tourAssembly}
        totalHotspots={calc.totalHotspots}
        assemblyCost={calc.assembly.totalCost}
        webTourFree={calc.assembly.freeByHotspotThreshold}
        displayCurrency={displayCurrency}
        pricingSettings={pricingSettings}
        pricing={pricing}
        onChange={setAssembly}
      />

      <ItemTotal
        preDiscountEur={calc.totalEur}
        discount={discount}
        displayCurrency={displayCurrency}
        pricingSettings={pricingSettings}
      />
    </div>
  );
}

function FloorPanel({
  floor,
  index,
  calc,
  displayCurrency,
  pricingSettings,
  pricing,
  canRemoveFloor,
  onAddRoom,
  onRemoveRoom,
  onSetRoomHotspots,
  onSetRoomStaticCameras,
  onRemoveFloor,
}: {
  floor: Tour360Floor;
  index: number;
  calc: Tour360FloorCalc;
  displayCurrency: DisplayCurrency;
  pricingSettings?: PublicPricingFormatSettings;
  pricing?: Tour360Pricing;
  canRemoveFloor: boolean;
  onAddRoom: () => void;
  onRemoveRoom: (roomIdx: number) => void;
  onSetRoomHotspots: (roomIdx: number, n: number) => void;
  onSetRoomStaticCameras: (roomIdx: number, n: number) => void;
  onRemoveFloor: () => void;
}) {
  const floorLabel = index === 0 ? "Floor 1" : `Floor ${index + 1}`;
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-foreground">
          {floorLabel}
          {index > 0 && (
            <span className="ml-2 text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground">
              −30%
            </span>
          )}
        </div>
        {canRemoveFloor && (
          <button
            type="button"
            onClick={onRemoveFloor}
            aria-label={`Remove ${floorLabel}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        {floor.rooms.length === 0 && (
          <p className="rounded-lg bg-background/40 px-3 py-3 text-center text-[0.72rem] text-muted-foreground">
            No rooms yet - add the first one to see the calculation.
          </p>
        )}
        {floor.rooms.map((room, rIdx) => (
          <RoomRow
            key={rIdx}
            name={room.name || `Room ${rIdx + 1}`}
            hotspots={room.hotspots ?? 1}
            staticCameras={room.staticCameras ?? 0}
            onHotspotsChange={(n) => onSetRoomHotspots(rIdx, n)}
            onStaticCamerasChange={(n) => onSetRoomStaticCameras(rIdx, n)}
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
          Add room
        </button>
      </div>

      <FloorBreakdown
        calc={calc}
        displayCurrency={displayCurrency}
        pricingSettings={pricingSettings}
        pricing={pricing}
      />
    </div>
  );
}

function RoomRow({
  name,
  hotspots,
  staticCameras,
  onHotspotsChange,
  onStaticCamerasChange,
  onRemove,
}: {
  name: string;
  hotspots: number;
  staticCameras: number;
  onHotspotsChange: (n: number) => void;
  onStaticCamerasChange: (n: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background/60 px-3 py-1.5">
      <span className="truncate text-xs font-medium text-foreground">
        {name}
      </span>
      <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
        <CompactStepper
          label="hotspot"
          value={hotspots}
          min={0}
          max={MAX_HOTSPOTS_PER_ROOM}
          onChange={onHotspotsChange}
        />
        <CompactStepper
          label="static frame"
          value={staticCameras}
          min={0}
          max={MAX_CAMERAS_PER_ROOM}
          onChange={onStaticCamerasChange}
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function FloorBreakdown({
  calc,
  displayCurrency,
  pricingSettings,
  pricing,
}: {
  calc: Tour360FloorCalc;
  displayCurrency: DisplayCurrency;
  pricingSettings?: PublicPricingFormatSettings;
  pricing?: Tour360Pricing;
}) {
  const rows: { label: string; value: string }[] = [
    {
      label: calc.isFirstFloor
        ? "First floor price (includes 10 rooms + 10 hotspots + 10 frames)"
        : "Additional floor price (-30%)",
      value: formatPublicPrice(calc.baseCost, displayCurrency, pricingSettings),
    },
  ];
  if (calc.extraHotspotsCost > 0) {
    rows.push({
      label: `+${calc.extraHotspots} extra hotspot${calc.extraHotspots === 1 ? "" : "s"} · ${formatPublicPrice(pricing?.extraHotspotEur ?? 27, displayCurrency, pricingSettings)}/item`,
      value: formatPublicPrice(
        calc.extraHotspotsCost,
        displayCurrency,
        pricingSettings,
      ),
    });
  }
  if (calc.extraCamerasCost > 0) {
    rows.push({
      label: `+${calc.extraCameras} extra frame${calc.extraCameras === 1 ? "" : "s"} · ${formatPublicPrice(pricing?.extraCameraEur ?? 10, displayCurrency, pricingSettings)}/item`,
      value: formatPublicPrice(
        calc.extraCamerasCost,
        displayCurrency,
        pricingSettings,
      ),
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
        <span className="font-semibold font-mono uppercase tracking-[0.08em] text-muted-foreground">
          Floor total
        </span>
        <span className="text-sm font-bold text-foreground tabular-nums">
          {formatPublicPrice(
            calc.floorTotal,
            displayCurrency,
            pricingSettings,
          )}
        </span>
      </div>
    </div>
  );
}

function TourAssemblySection({
  assembly,
  totalHotspots,
  assemblyCost,
  webTourFree,
  displayCurrency,
  pricingSettings,
  pricing,
  onChange,
}: {
  assembly: TourAssembly;
  totalHotspots: number;
  assemblyCost: number;
  webTourFree: boolean;
  displayCurrency: DisplayCurrency;
  pricingSettings?: PublicPricingFormatSettings;
  pricing?: Tour360Pricing;
  onChange: (patch: Partial<TourAssembly>) => void;
}) {
  const webOn = assembly.webTourEnabled;
  const assemblyPricing = pricing?.assembly;
  const freeThreshold = assemblyPricing?.freeHotspotThreshold ?? 5;
  const baseEur = assemblyPricing?.baseEur ?? 20;
  const hotspotsToFree = Math.max(
    0,
    freeThreshold - totalHotspots,
  );
  const baseLabel = webTourFree
    ? `free (${freeThreshold}+ hotspots)`
    : webOn
      ? `+${formatPublicPrice(baseEur, displayCurrency, pricingSettings)}${hotspotsToFree > 0 ? ` (free with ${hotspotsToFree} more hotspot${hotspotsToFree === 1 ? "" : "s"})` : ""}`
      : `+${formatPublicPrice(baseEur, displayCurrency, pricingSettings)} (free with ${freeThreshold}+ hotspots)`;

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4">
      <p className="text-[0.72rem] font-bold font-mono uppercase tracking-[0.08em] text-muted-foreground">
        Web tour and branding
      </p>
      <p className="mt-1 text-[0.72rem] leading-relaxed text-muted-foreground">
        Converts the render into an interactive viewer that can be shared by
        link. Without these options, you receive static outputs only (panoramas
        and frames).
      </p>

      <div className="mt-3 space-y-2">
        <ToggleRow
          label="Web tour - interactive viewer"
          sub={baseLabel}
          checked={webOn}
          onChange={(v) =>
            onChange(
              v
                ? { webTourEnabled: true }
                : {
                    webTourEnabled: false,
                    floorPlanNavEnabled: false,
                    whiteLabelEnabled: false,
                  },
            )
          }
        />
        <ToggleRow
          label="Floor-plan navigation"
          sub={`+${formatPublicPrice(
            assemblyPricing?.floorPlanNavEur ?? 15,
            displayCurrency,
            pricingSettings,
          )}`}
          checked={webOn && assembly.floorPlanNavEnabled}
          disabled={!webOn}
          onChange={(v) => onChange({ floorPlanNavEnabled: v })}
          indented
        />
        <ToggleRow
          label="White-label branding"
          sub={`+${formatPublicPrice(
            assemblyPricing?.whiteLabelEur ?? 35,
            displayCurrency,
            pricingSettings,
          )} · logo is uploaded in the portal`}
          checked={webOn && assembly.whiteLabelEnabled}
          disabled={!webOn}
          onChange={(v) => onChange({ whiteLabelEnabled: v })}
          indented
        />
      </div>

      {webOn && (
        <div className="mt-3 flex items-baseline justify-between gap-2 border-t border-border/40 pt-2 text-xs">
          <span className="font-semibold font-mono uppercase tracking-[0.08em] text-muted-foreground">
            Web tour total
          </span>
          <span className="text-sm font-bold text-foreground tabular-nums">
            {formatPublicPrice(assemblyCost, displayCurrency, pricingSettings)}
          </span>
        </div>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  sub,
  checked,
  disabled,
  indented,
  onChange,
}: {
  label: string;
  sub: string;
  checked: boolean;
  disabled?: boolean;
  indented?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className={
        "flex items-center justify-between gap-3 rounded-lg bg-background/60 px-3 py-2" +
        (indented ? " ml-4" : "") +
        (disabled ? " opacity-50" : "")
      }
    >
      <div className="min-w-0">
        <div className="text-xs font-medium text-foreground">{label}</div>
        <div className="text-[0.65rem] text-muted-foreground">{sub}</div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
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
          aria-label={`Decrease ${label}`}
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
          aria-label={`Increase ${label}`}
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
