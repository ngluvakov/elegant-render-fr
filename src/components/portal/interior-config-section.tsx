/**
 * InteriorConfigSection — Rooms + cameras editor for the int-static product.
 *
 * Shows a remaining-renders counter (10 - totalCameras), per-room camera
 * steppers, room rename/delete, add-room action. Live-recalculates total
 * and persists to OrderItem.configJson via updateInteriorConfig.
 */
"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, Trash2, Home, Camera, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatEur } from "@/lib/catalog/calculate";

// Serbian pluralization for "kamera"
// 1, 21, 31… → "kamera"; 2-4, 22-24… → "kamere"; 0, 5-20, 25+ → "kamera"
function kameraNoun(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "kamera";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "kamere";
  return "kamera";
}
import {
  calcInteriorTotal,
  INT_STATIC_EXTRA_CAMERA_EUR,
  INT_STATIC_EXTRA_ROOM_EUR,
  INT_STATIC_INCLUDED_CAMERAS,
  type InteriorRoom,
} from "@/lib/catalog/interior-config";
import { updateInteriorConfig } from "@/server/actions/item-config";

export function InteriorConfigSection({
  itemId,
  initialRooms,
  editable,
}: {
  itemId: string;
  initialRooms: InteriorRoom[] | null;
  editable: boolean;
}) {
  const [rooms, setRooms] = useState<InteriorRoom[]>(initialRooms ?? []);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [, start] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const initRef = useRef(true);

  const calc = useMemo(() => calcInteriorTotal(rooms), [rooms]);

  // Autosave on change (debounced)
  useEffect(() => {
    if (!editable) return;
    if (initRef.current) {
      initRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      start(async () => {
        await updateInteriorConfig(itemId, rooms);
        setSavedAt(Date.now());
        router.refresh();
      });
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [rooms, itemId, editable, router]);

  const updateRoom = (idx: number, patch: Partial<InteriorRoom>) => {
    setRooms((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    );
  };

  const incCamera = (idx: number) => {
    const current = rooms[idx];
    if (current.cameras >= 10) return;
    updateRoom(idx, { cameras: current.cameras + 1 });
  };

  const decCamera = (idx: number) => {
    const current = rooms[idx];
    if (current.cameras <= 1) return;
    updateRoom(idx, { cameras: current.cameras - 1 });
  };

  const addRoom = () => {
    if (rooms.length >= 40) return;
    setRooms((prev) => [
      ...prev,
      { name: `Prostorija ${prev.length + 1}`, cameras: 1 },
    ]);
  };

  const removeRoom = (idx: number) => {
    setRooms((prev) => prev.filter((_, i) => i !== idx));
  };

  const renderCountLabel =
    calc.remainingRenders >= 0
      ? `${calc.remainingRenders} preostalo`
      : `+${Math.abs(calc.remainingRenders)} extra`;
  const renderCountColor =
    calc.remainingRenders >= 3
      ? "text-[color:var(--color-sage-deep)]"
      : calc.remainingRenders >= 0
        ? "text-accent"
        : "text-destructive";

  return (
    <div className="space-y-4 rounded-xl border border-accent/20 bg-gradient-to-br from-accent/[0.02] to-transparent p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            Sobe i kadrovi
          </h4>
          <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
            Bazni paket: 10 prostorija + 10 rendera
          </p>
        </div>
        {savedAt && Date.now() - savedAt < 2500 && (
          <span className="inline-flex items-center gap-1 text-[0.6rem] font-medium text-[color:var(--color-sage-deep)] animate-in fade-in duration-200">
            <Check className="h-3 w-3" />
            Sačuvano
          </span>
        )}
      </div>

      <div className="flex items-start gap-2 rounded-md bg-secondary/30 px-3 py-2 text-[0.65rem] text-muted-foreground">
        <Info className="mt-0.5 h-3 w-3 flex-shrink-0 text-accent/70" />
        <p>
          Broj pored prostorije predstavlja broj kamera (rendera) u toj
          prostoriji. Bazni paket uključuje 10 rendera ukupno — dodatne kamere
          se doplaćuju €{INT_STATIC_EXTRA_CAMERA_EUR} po kameri.
        </p>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-card/60 px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-[0.6rem] text-muted-foreground">
            <Home className="h-3 w-3" />
            Sobe
          </div>
          <p className="mt-0.5 text-lg font-bold text-foreground tabular-nums">
            {calc.totalRooms}
            {calc.extraRooms > 0 && (
              <span className="ml-1 text-[0.65rem] font-semibold text-accent">
                +{calc.extraRooms}
              </span>
            )}
          </p>
        </div>
        <div className="rounded-lg bg-card/60 px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-[0.6rem] text-muted-foreground">
            <Camera className="h-3 w-3" />
            Renderi
          </div>
          <p className="mt-0.5 text-lg font-bold text-foreground tabular-nums">
            {calc.totalCameras}
            <span className="ml-1 text-[0.55rem] font-normal text-muted-foreground">
              / {INT_STATIC_INCLUDED_CAMERAS}
            </span>
          </p>
        </div>
        <div className="rounded-lg bg-card/60 px-3 py-2.5">
          <div className="text-[0.6rem] text-muted-foreground">Preostalo</div>
          <p
            className={cn(
              "mt-0.5 text-lg font-bold tabular-nums transition-colors",
              renderCountColor,
            )}
          >
            {renderCountLabel}
          </p>
        </div>
      </div>

      {/* Rooms list */}
      {rooms.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/40 bg-card/40 px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            Nemate nijednu prostoriju. Dodajte prvu ispod.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {rooms.map((room, idx) => {
            const isBeyondRooms = idx >= 10;
            return (
              <div
                key={idx}
                className={cn(
                  "group flex items-center gap-2 rounded-lg bg-card/80 px-3 py-2 transition-all",
                  isBeyondRooms && "ring-1 ring-accent/30",
                )}
              >
                <input
                  type="text"
                  value={room.name}
                  onChange={(e) => updateRoom(idx, { name: e.target.value })}
                  disabled={!editable}
                  maxLength={80}
                  className="flex-1 min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:text-foreground"
                  placeholder="Naziv prostorije"
                />
                {isBeyondRooms && (
                  <span className="hidden sm:inline-flex rounded bg-accent/15 px-1.5 py-0.5 text-[0.55rem] font-semibold text-accent">
                    +€{INT_STATIC_EXTRA_ROOM_EUR}
                  </span>
                )}

                {/* Camera stepper */}
                <div className="inline-flex items-center rounded-md bg-secondary/60">
                  <button
                    type="button"
                    disabled={!editable || room.cameras <= 1}
                    onClick={() => decCamera(idx)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                    aria-label="Smanji broj kamera u ovoj sobi"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="min-w-[2rem] text-center text-xs font-semibold tabular-nums text-foreground">
                    {room.cameras}
                  </span>
                  <button
                    type="button"
                    disabled={!editable || room.cameras >= 10}
                    onClick={() => incCamera(idx)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                    aria-label="Povećaj broj kamera u ovoj sobi"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <span className="hidden w-14 text-[0.65rem] text-muted-foreground sm:inline">
                  {kameraNoun(room.cameras)}
                </span>

                {editable && (
                  <button
                    type="button"
                    onClick={() => removeRoom(idx)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Ukloni prostoriju"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editable && (
        <button
          type="button"
          onClick={addRoom}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border/40 bg-transparent px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
        >
          <Plus className="h-3.5 w-3.5" />
          Dodaj prostoriju
          {calc.totalRooms >= 10 && (
            <span className="text-[0.6rem] text-accent">
              (+€{INT_STATIC_EXTRA_ROOM_EUR})
            </span>
          )}
        </button>
      )}

      {/* Total row */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border/30 bg-card/60 px-3 py-2.5">
        <div className="space-y-0.5">
          {(calc.extraRoomsCost > 0 || calc.extraCamerasCost > 0) && (
            <p className="text-[0.6rem] text-muted-foreground">
              {calc.extraRooms > 0 && (
                <span>
                  {calc.extraRooms} × €{INT_STATIC_EXTRA_ROOM_EUR}
                </span>
              )}
              {calc.extraRooms > 0 && calc.extraCameras > 0 && (
                <span> · </span>
              )}
              {calc.extraCameras > 0 && (
                <span>
                  {calc.extraCameras} × €{INT_STATIC_EXTRA_CAMERA_EUR}
                </span>
              )}
            </p>
          )}
          <p className="text-xs text-muted-foreground">Ukupno za ovu stavku</p>
        </div>
        <p className="text-lg font-bold text-foreground tabular-nums">
          {formatEur(calc.totalEur)}
        </p>
      </div>
    </div>
  );
}
