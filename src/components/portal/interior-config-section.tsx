/**
 * InteriorConfigSection — Multi-floor editor for the int-static product.
 *
 * Each floor is a self-contained subset: rooms + cameras (with the
 * per-room camera noun), description, per-floor files (OrderFile.floorId),
 * and an advanced-settings switch (references / per-room details / tech
 * notes). First floor base = €170; every additional floor = €120 (30%
 * discount over the standalone price). Autosaves the floors array to
 * OrderItem.configJson with a 600ms debounce.
 */
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Plus,
  Minus,
  Trash2,
  Home,
  Camera,
  Check,
  Info,
  ChevronDown,
  Settings2,
  Upload,
  FileUp,
  Layers,
  Pencil,
  Palette,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrderCurrency } from "@/components/portal/order-currency-context";
import { Collapsible } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  calcInteriorTotal,
  INT_STATIC_EXTRA_CAMERA_EUR,
  INT_STATIC_EXTRA_FLOOR_EUR,
  INT_STATIC_EXTRA_ROOM_EUR,
  INT_STATIC_INCLUDED_CAMERAS,
  makeFloorId,
  newFloor,
  ROOM_STYLES,
  SEASONS,
  TIMES_OF_DAY,
  type InteriorFloor,
  type InteriorFloorCalc,
  type InteriorRoom,
  type RoomStyleId,
  type SeasonId,
  type StyleMode,
  type TimeOfDayId,
} from "@/lib/catalog/interior-config";
import {
  confirmItemFileUpload,
  deleteOrderFile,
  updateInteriorFloors,
} from "@/server/actions/item-config";
import { PricingBreakdown } from "./pricing-breakdown";

function floorPricingRows(calc: InteriorFloorCalc) {
  const rows: { label: string; value: number; sub?: string }[] = [
    {
      label: calc.isFirstFloor
        ? "Prix du premier niveau (10 pièces + 10 rendus inclus)"
        : "Prix par niveau supplémentaire (-30 %)",
      value: calc.baseCost,
    },
  ];
  if (calc.extraRoomsCost > 0) {
    rows.push({
      label:
        calc.extraRooms === 1
          ? "+1 pièce supplémentaire"
          : `+${calc.extraRooms} pièces supplémentaires`,
      value: calc.extraRoomsCost,
      sub: `€${INT_STATIC_EXTRA_ROOM_EUR} chacune`,
    });
  }
  if (calc.extraCamerasCost > 0) {
    rows.push({
      label:
        calc.extraCameras === 1
          ? "+1 vue supplémentaire"
          : `+${calc.extraCameras} vues supplémentaires`,
      value: calc.extraCamerasCost,
      sub: `€${INT_STATIC_EXTRA_CAMERA_EUR} chacune`,
    });
  }
  return rows;
}

export function cameraNoun(n: number): string {
  return n === 1 ? "caméra" : "caméras";
}

type FloorFile = {
  id: string;
  fileName: string;
  fileSize: number;
  kind: string;
  floorId: string | null;
};

function formatSize(b: number) {
  return b < 1024 * 1024
    ? `${(b / 1024).toFixed(0)} Ko`
    : `${(b / (1024 * 1024)).toFixed(1)} Mo`;
}

// ─── FloorPanel ──────────────────────────────────────────────────────────

function FloorPanel({
  floor,
  idx,
  calc,
  editable,
  orderId,
  itemId,
  files,
  isOnly,
  onPatch,
  onRemove,
}: {
  floor: InteriorFloor;
  idx: number;
  calc: InteriorFloorCalc;
  editable: boolean;
  orderId: string;
  itemId: string;
  files: FloorFile[];
  isOnly: boolean;
  onPatch: (patch: Partial<InteriorFloor>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(idx === 0);
  const [advanced, setAdvanced] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploading, setUploading] = useState<string[]>([]);
  const [styleGuideOpen, setStyleGuideOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const viewInputRef = useRef<HTMLInputElement>(null);
  const { formatPrice } = useOrderCurrency();
  const router = useRouter();

  const sourceFiles = files.filter((f) => f.kind !== "window-view");
  const viewFiles = files.filter((f) => f.kind === "window-view");

  const styleMode: StyleMode = floor.styleMode ?? "all";

  const updateRoom = (rIdx: number, patch: Partial<InteriorRoom>) => {
    onPatch({
      rooms: floor.rooms.map((r, i) => (i === rIdx ? { ...r, ...patch } : r)),
    });
  };

  const incCamera = (rIdx: number) => {
    const cur = floor.rooms[rIdx];
    if (cur.cameras >= 10) return;
    updateRoom(rIdx, { cameras: cur.cameras + 1 });
  };
  const decCamera = (rIdx: number) => {
    const cur = floor.rooms[rIdx];
    if (cur.cameras <= 1) return;
    updateRoom(rIdx, { cameras: cur.cameras - 1 });
  };
  const addRoom = () => {
    if (floor.rooms.length >= 40) return;
    onPatch({
      rooms: [
        ...floor.rooms,
        {
          name: `Pièce ${floor.rooms.length + 1}`,
          cameras: 1,
          ...(floor.globalStyleId ? { styleId: floor.globalStyleId } : {}),
        },
      ],
    });
  };
  const removeRoom = (rIdx: number) => {
    onPatch({ rooms: floor.rooms.filter((_, i) => i !== rIdx) });
  };

  const uploadFile = useCallback(
    async (file: File, kind: "source" | "window-view") => {
      setUploading((prev) => [...prev, file.name]);
      try {
        const urlRes = await fetch("/api/checkout/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
          }),
        });
        if (!urlRes.ok) throw new Error("Erreur");
        const { signedUrl, storagePath } = await urlRes.json();
        await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type, "x-upsert": "true" },
          body: file,
        });
        await confirmItemFileUpload(
          orderId,
          itemId,
          file.name,
          file.size,
          file.type,
          storagePath,
          kind,
          floor.id,
        );
        router.refresh();
      } catch {}
      setUploading((prev) => prev.filter((n) => n !== file.name));
    },
    [orderId, itemId, floor.id, router],
  );

  const handleFileDelete = async (fileId: string) => {
    await deleteOrderFile(fileId);
    router.refresh();
  };

  const floorIsConfigured =
    (floor.description?.trim().length ?? 0) > 0 || files.length > 0;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card/80 transition-all",
        floorIsConfigured
          ? "border-border/40"
          : "border-amber-300",
      )}
    >
      {/* Floor header */}
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-4 text-left transition-colors hover:bg-foreground/[0.015]"
        >
          <Layers className="h-4 w-4 flex-shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h5 className="text-sm font-semibold text-foreground">
                {floor.name}
              </h5>
              {!calc.isFirstFloor && (
                <span className="inline-flex items-center gap-1 rounded bg-accent/15 px-1.5 py-0.5 text-[0.62rem] font-semibold text-foreground">
                  −30 %
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[0.72rem] text-muted-foreground">
              {calc.totalRooms} pièce{calc.totalRooms === 1 ? "" : "s"} ·{" "}
              {calc.totalCameras} {cameraNoun(calc.totalCameras)} ·{" "}
              {formatPrice(calc.floorTotal)}
            </p>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-300",
              expanded && "rotate-180",
            )}
          />
        </button>

        {editable && !isOnly && (
          <div className="flex items-center pr-3">
            {!confirmDelete ? (
              <button
                type="button"
                aria-label={`Supprimer ${floor.name}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConfirmDelete(true);
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            ) : (
              <div className="inline-flex items-center gap-0.5 rounded-md bg-destructive/10 p-0.5 text-destructive animate-in fade-in duration-150">
                <span className="px-1 text-[0.62rem] font-semibold">Supprimer ?</span>
                <button
                  type="button"
                  onClick={onRemove}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-sm hover:bg-destructive hover:text-white"
                >
                  <Check className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <Collapsible open={expanded}>
        <div className="border-t border-border/30 p-4 space-y-4">
          {/* Floor name editor */}
          <div className="space-y-1">
            <Label
              htmlFor={`floor-name-${floor.id}`}
              className="text-[0.72rem] uppercase tracking-wider text-muted-foreground"
            >
              <Pencil className="h-3 w-3 text-accent/60" />
              Nom du niveau
            </Label>
            <input
              id={`floor-name-${floor.id}`}
              type="text"
              value={floor.name}
              onChange={(e) => onPatch({ name: e.target.value })}
              disabled={!editable}
              maxLength={80}
              className="w-full rounded-md bg-secondary/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50"
            />
          </div>

          {/* Advanced toggle — switch stays at top; body renders at bottom. */}
          <p className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
            <Check className="h-3 w-3" />
            Ce niveau est prêt à commander. Les réglages fins sont ci-dessous.
          </p>
          <label
            htmlFor={`adv-${floor.id}`}
            className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-secondary/30 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <Settings2 className="h-3 w-3 text-accent" />
              <span className="text-[0.7rem] font-medium text-foreground">
                Paramètres avancés{" "}
                <span className="text-muted-foreground">(facultatif)</span>
              </span>
              <span className="hidden text-[0.72rem] text-muted-foreground sm:inline">
                · moment de la journée, saison, vue depuis la fenêtre
              </span>
            </div>
            <Switch
              id={`adv-${floor.id}`}
              checked={advanced}
              onCheckedChange={setAdvanced}
              disabled={!editable}
            />
          </label>

          {/* Rooms & cameras */}
          <div className="space-y-3 rounded-xl border border-accent/20 bg-accent/[0.03] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h6 className="text-xs font-semibold text-foreground">
                  Pièces et caméras
                </h6>
                <p className="mt-0.5 text-[0.72rem] text-muted-foreground">
                  10 pièces + 10 rendus inclus par niveau
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStyleGuideOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-[0.72rem] font-semibold text-foreground transition-all hover:border-accent hover:bg-accent/15"
              >
                <Palette className="h-3.5 w-3.5" />
                Guide des styles
              </button>
            </div>

            <div className="flex items-start gap-2 rounded-md bg-secondary/30 px-2.5 py-1.5 text-[0.72rem] text-muted-foreground">
              <Info className="mt-0.5 h-3 w-3 flex-shrink-0 text-accent/70" />
              <p>
                Le nombre à côté de chaque pièce indique le nombre de caméras/rendus pour
                cette pièce. Au-delà de 10 rendus par niveau = {formatPrice(INT_STATIC_EXTRA_CAMERA_EUR)} par caméra.
              </p>
            </div>

            {/* Counters */}
            <div className="grid grid-cols-3 gap-2">
              <CounterPill icon={<Home className="h-3 w-3" />} label="Pièces" value={calc.totalRooms} extra={calc.extraRooms} />
              <CounterPill icon={<Camera className="h-3 w-3" />} label="Rendus" value={calc.totalCameras} slash={INT_STATIC_INCLUDED_CAMERAS} />
              <CounterPill
                label="Restants"
                value={calc.remainingRenders >= 0 ? calc.remainingRenders : `+${Math.abs(calc.remainingRenders)}`}
                variant={
                  calc.remainingRenders >= 3 ? "good" : calc.remainingRenders >= 0 ? "warn" : "bad"
                }
              />
            </div>

            {/* Style mode toggle + global picker */}
            <div className="space-y-2 rounded-md border border-border/30 bg-secondary/20 p-2.5">
              <label
                htmlFor={`style-mode-${floor.id}`}
                className="flex cursor-pointer items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <Palette className="h-3 w-3 text-accent" />
                  <span className="text-[0.7rem] font-medium text-foreground">
                    Style par pièce
                  </span>
                  <span className="hidden text-[0.72rem] text-muted-foreground sm:inline">
                    · {styleMode === "per-room"
                      ? "chaque pièce choisit séparément"
                      : "même style pour toutes les pièces"}
                  </span>
                </div>
                <Switch
                  id={`style-mode-${floor.id}`}
                  checked={styleMode === "per-room"}
                  onCheckedChange={(v) =>
                    onPatch({ styleMode: v ? "per-room" : "all" })
                  }
                  disabled={!editable}
                />
              </label>

              {styleMode === "all" && (
                <div className="space-y-1">
                  <Label
                    htmlFor={`global-style-${floor.id}`}
                    className="text-[0.7rem]"
                  >
                    Style pour toutes les pièces
                  </Label>
                  <select
                    id={`global-style-${floor.id}`}
                    value={floor.globalStyleId ?? ""}
                    onChange={(e) =>
                      onPatch({
                        globalStyleId:
                          (e.target.value || undefined) as
                            | RoomStyleId
                            | undefined,
                      })
                    }
                    disabled={!editable}
                    className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
                  >
                    <option value="">Sélectionner…</option>
                    {ROOM_STYLES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Rooms list */}
            {floor.rooms.length === 0 ? (
              <div className="rounded-md border border-dashed border-border/40 px-3 py-4 text-center">
                <p className="text-[0.72rem] text-muted-foreground">
                  Aucune pièce pour l’instant. Ajoutez la première ci-dessous.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {floor.rooms.map((room, rIdx) => {
                  const isBeyondRooms = rIdx >= 10;
                  return (
                    <div
                      key={rIdx}
                      className={cn(
                        "space-y-2 rounded-md bg-card/90 px-2.5 py-2",
                        isBeyondRooms && "ring-1 ring-accent/30",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={room.name}
                          onChange={(e) => updateRoom(rIdx, { name: e.target.value })}
                          disabled={!editable}
                          maxLength={80}
                          className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/50"
                          placeholder="Nom de la pièce"
                        />
                        {styleMode === "per-room" && (
                          <select
                            value={room.styleId ?? ""}
                            onChange={(e) =>
                              updateRoom(rIdx, {
                                styleId: (e.target.value || undefined) as RoomStyleId | undefined,
                              })
                            }
                            disabled={!editable}
                            aria-label="Style d’intérieur"
                            className="rounded bg-secondary/60 px-2 py-1 text-[0.72rem] text-foreground outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-60"
                          >
                            <option value="">Style - sélectionner</option>
                            {ROOM_STYLES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        )}
                        {isBeyondRooms && (
                          <span className="hidden sm:inline-flex rounded bg-accent/15 px-1 py-0.5 text-[0.62rem] font-semibold text-foreground">
                            +{formatPrice(INT_STATIC_EXTRA_ROOM_EUR)}
                          </span>
                        )}
                        <div className="inline-flex items-center rounded bg-secondary/60">
                          <button
                            type="button"
                            disabled={!editable || room.cameras <= 1}
                            onClick={() => decCamera(rIdx)}
                            aria-label="Diminuer le nombre de caméras dans cette pièce"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="min-w-[1.5rem] text-center text-[0.7rem] font-semibold tabular-nums text-foreground">
                            {room.cameras}
                          </span>
                          <button
                            type="button"
                            disabled={!editable || room.cameras >= 10}
                            onClick={() => incCamera(rIdx)}
                            aria-label="Augmenter le nombre de caméras dans cette pièce"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="hidden w-12 text-[0.72rem] text-muted-foreground sm:inline">
                          {cameraNoun(room.cameras)}
                        </span>
                        {editable && (
                          <button
                            type="button"
                            onClick={() => removeRoom(rIdx)}
                            aria-label="Supprimer la pièce"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <Textarea
                        value={room.notes ?? ""}
                        onChange={(e) => updateRoom(rIdx, { notes: e.target.value })}
                        disabled={!editable}
                        placeholder="Détails pour cette pièce - position de caméra, ambiance, exigences particulières…"
                        rows={2}
                        className="resize-none text-[0.78rem]"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {editable && (
              <button
                type="button"
                onClick={addRoom}
                className="inline-flex items-center gap-1.5 self-start rounded-lg border border-accent/50 bg-accent/10 px-3.5 py-1.5 text-xs font-semibold text-foreground transition-all hover:border-accent hover:bg-accent/15 hover:shadow-[0_1px_3px_rgba(17,17,17,0.06)]"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter une pièce
                {calc.totalRooms >= 10 && (
                  <span className="text-[0.62rem] text-accent/80">
                    (+{formatPrice(INT_STATIC_EXTRA_ROOM_EUR)})
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor={`desc-${floor.id}`} className="text-xs">
              <Pencil className="h-3 w-3 text-accent/60" />
              Description du projet pour ce niveau
            </Label>
            <Textarea
              id={`desc-${floor.id}`}
              value={floor.description ?? ""}
              onChange={(e) => onPatch({ description: e.target.value })}
              disabled={!editable}
              placeholder="Style, ambiance, exigences particulières pour ce niveau…"
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          {/* Files */}
          <div className="space-y-1.5">
            <Label className="text-xs">Plans et photos (ce niveau)</Label>
            <div
              onClick={() => editable && inputRef.current?.click()}
              className={cn(
                "flex items-center justify-center rounded-md border-2 border-dashed border-border/40 px-3 py-3 transition-colors",
                editable
                  ? "cursor-pointer hover:border-accent/40"
                  : "opacity-60",
              )}
            >
              <Upload className="mr-2 h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="text-[0.7rem] text-muted-foreground">
                Glissez ou cliquez - plans, photos, croquis
              </span>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                disabled={!editable}
                onChange={(e) => {
                  if (e.target.files) {
                    Array.from(e.target.files).forEach((f) => uploadFile(f, "source"));
                    e.target.value = "";
                  }
                }}
                className="hidden"
              />
            </div>

            {sourceFiles.length > 0 && (
              <div className="space-y-1">
                {sourceFiles.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-2 rounded bg-secondary/40 px-2.5 py-1.5 text-[0.7rem]"
                  >
                    <FileUp className="h-3 w-3 text-muted-foreground" />
                    <span className="flex-1 truncate text-foreground">{f.fileName}</span>
                    <span className="text-muted-foreground">{formatSize(f.fileSize)}</span>
                    {editable && (
                      <button
                        type="button"
                        aria-label="Supprimer le fichier"
                        onClick={() => handleFileDelete(f.id)}
                        className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {uploading.length > 0 && (
              <div className="space-y-1">
                {uploading.map((name) => (
                  <div
                    key={name}
                    className="flex items-center gap-2 rounded bg-accent/5 px-2.5 py-1.5 text-[0.7rem]"
                  >
                    <FileUp className="h-3 w-3 text-accent" />
                    <span className="flex-1 truncate text-foreground">{name}</span>
                    <span className="text-accent">Import en cours…</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Advanced settings — at bottom. Values persist across toggles
             because Collapsible hides via CSS, not unmount. */}
          <Collapsible open={advanced}>
            <div className="space-y-3 rounded-md border border-border/30 bg-secondary/20 p-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Avancé
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor={`tod-${floor.id}`} className="text-[0.7rem]">
                    Moment de la journée
                  </Label>
                  <select
                    id={`tod-${floor.id}`}
                    value={floor.timeOfDay ?? ""}
                    onChange={(e) =>
                      onPatch({
                        timeOfDay:
                          (e.target.value || undefined) as TimeOfDayId | undefined,
                      })
                    }
                    disabled={!editable}
                    className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
                  >
                    <option value="">Sélectionner…</option>
                    {TIMES_OF_DAY.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`season-${floor.id}`} className="text-[0.7rem]">
                    Saison
                  </Label>
                  <select
                    id={`season-${floor.id}`}
                    value={floor.season ?? ""}
                    onChange={(e) =>
                      onPatch({
                        season:
                          (e.target.value || undefined) as SeasonId | undefined,
                      })
                    }
                    disabled={!editable}
                    className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
                  >
                    <option value="">Sélectionner…</option>
                    {SEASONS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[0.7rem]">
                  Vue depuis la fenêtre (référence)
                </Label>
                <div
                  onClick={() => editable && viewInputRef.current?.click()}
                  className={cn(
                    "flex items-center justify-center rounded-md border-2 border-dashed border-border/40 px-3 py-3 transition-colors",
                    editable
                      ? "cursor-pointer hover:border-accent/40"
                      : "opacity-60",
                  )}
                >
                  <Upload className="mr-2 h-3.5 w-3.5 text-muted-foreground/50" />
                  <span className="text-[0.7rem] text-muted-foreground">
                    Photos de la vue depuis la fenêtre pour ce niveau
                  </span>
                  <input
                    ref={viewInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    disabled={!editable}
                    onChange={(e) => {
                      if (e.target.files) {
                        Array.from(e.target.files).forEach((f) =>
                          uploadFile(f, "window-view"),
                        );
                        e.target.value = "";
                      }
                    }}
                    className="hidden"
                  />
                </div>

                {viewFiles.length > 0 && (
                  <div className="space-y-1">
                    {viewFiles.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center gap-2 rounded bg-secondary/40 px-2.5 py-1.5 text-[0.7rem]"
                      >
                        <FileUp className="h-3 w-3 text-muted-foreground" />
                        <span className="flex-1 truncate text-foreground">
                          {f.fileName}
                        </span>
                        <span className="text-muted-foreground">
                          {formatSize(f.fileSize)}
                        </span>
                        {editable && (
                          <button
                            type="button"
                            aria-label="Supprimer le fichier"
                            onClick={() => handleFileDelete(f.id)}
                            className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <PricingBreakdown
                title="Détail du prix pour ce niveau"
                rows={floorPricingRows(calc)}
                total={calc.floorTotal}
              />
            </div>
          </Collapsible>
        </div>
      </Collapsible>

      {styleGuideOpen && (
        <StyleGuideModal
          onClose={() => setStyleGuideOpen(false)}
          onApplyToAll={(styleId) => {
            if (styleMode === "all") {
              onPatch({ globalStyleId: styleId });
            } else {
              onPatch({
                rooms: floor.rooms.map((r) => ({ ...r, styleId })),
              });
            }
            setStyleGuideOpen(false);
          }}
          editable={editable && (styleMode === "all" || floor.rooms.length > 0)}
        />
      )}
    </div>
  );
}

// ─── StyleGuideModal ──────────────────────────────────────────────────

export function StyleGuideModal({
  onClose,
  onApplyToAll,
  editable,
}: {
  onClose: () => void;
  onApplyToAll: (styleId: RoomStyleId) => void;
  editable: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-card shadow-xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border/40 p-5">
          <div>
            <h3 className="font-heading text-xl text-foreground">
              Guide des styles
            </h3>
            <p className="mt-1 text-[0.78rem] text-muted-foreground">
              Cliquez sur « Appliquer à toutes les pièces » pour définir rapidement
              le même style pour toutes les pièces de ce niveau. Vous pourrez
              toujours modifier chaque pièce manuellement plus tard.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {ROOM_STYLES.map((style) => (
            <div
              key={style.id}
              className="overflow-hidden rounded-xl border border-border/40 bg-background/60 transition-all hover:border-accent/40 hover:shadow-[0_1px_3px_rgba(17,17,17,0.06)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <Image
                  src={style.image}
                  alt={`Exemple d’intérieur : ${style.label}`}
                  fill
                  sizes="(min-width: 640px) 40vw, 90vw"
                  className="object-cover"
                />
              </div>
              <div className="space-y-2 p-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {style.label}
                  </p>
                  <p className="mt-1 text-[0.78rem] leading-relaxed text-muted-foreground">
                    {style.description}
                  </p>
                </div>
                {editable && (
                  <button
                    type="button"
                    onClick={() => onApplyToAll(style.id)}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-accent/40 bg-accent/10 px-2.5 py-1.5 text-[0.72rem] font-semibold text-foreground transition-all hover:border-accent hover:bg-accent/15"
                  >
                    <Check className="h-3 w-3" />
                    Appliquer à toutes les pièces
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end border-t border-border/40 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export function CounterPill({
  icon,
  label,
  value,
  slash,
  extra,
  variant,
}: {
  icon?: React.ReactNode;
  label: string;
  value: number | string;
  slash?: number;
  extra?: number;
  variant?: "good" | "warn" | "bad";
}) {
  return (
    <div className="rounded bg-card/60 px-2 py-1.5">
      <div className="flex items-center gap-1 text-[0.62rem] text-muted-foreground">
        {icon}
        {label}
      </div>
      <p
        className={cn(
          "mt-0.5 text-sm font-bold tabular-nums",
          variant === "good" && "text-muted-foreground",
          variant === "warn" && "text-accent",
          variant === "bad" && "text-destructive",
          !variant && "text-foreground",
        )}
      >
        {value}
        {slash !== undefined && (
          <span className="ml-0.5 text-[0.62rem] font-normal text-muted-foreground">
            / {slash}
          </span>
        )}
        {extra !== undefined && extra > 0 && (
          <span className="ml-1 text-[0.62rem] font-semibold text-accent">
            +{extra}
          </span>
        )}
      </p>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────

export function InteriorConfigSection({
  itemId,
  orderId,
  initialFloors,
  files,
  editable,
}: {
  itemId: string;
  orderId: string;
  initialFloors: InteriorFloor[] | null;
  files: FloorFile[];
  editable: boolean;
}) {
  const [floors, setFloors] = useState<InteriorFloor[]>(
    initialFloors && initialFloors.length > 0 ? initialFloors : [],
  );
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [styleGuideOpen, setStyleGuideOpen] = useState(false);
  const [, start] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initRef = useRef(true);
  const router = useRouter();
  const { formatPrice } = useOrderCurrency();

  const calc = useMemo(() => calcInteriorTotal(floors), [floors]);

  useEffect(() => {
    if (!editable) return;
    if (initRef.current) {
      initRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      start(async () => {
        await updateInteriorFloors(itemId, floors);
        setSavedAt(Date.now());
        router.refresh();
      });
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [floors, itemId, editable, router]);

  useEffect(() => {
    if (!savedAt) return;
    const timeout = setTimeout(() => setSavedAt(null), 2500);
    return () => clearTimeout(timeout);
  }, [savedAt]);

  const patchFloor = (fIdx: number, patch: Partial<InteriorFloor>) => {
    setFloors((prev) =>
      prev.map((f, i) => (i === fIdx ? { ...f, ...patch } : f)),
    );
  };

  const addFloor = () => {
    if (floors.length >= 20) return;
    setFloors((prev) => {
      const next = [...prev];
      next.push({ ...newFloor(next.length), id: makeFloorId() });
      return next;
    });
  };

  const removeFloor = (fIdx: number) => {
    setFloors((prev) => prev.filter((_, i) => i !== fIdx));
  };

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/30 bg-card/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-accent" />
          <div>
            <p className="text-xs font-semibold text-foreground">
              {calc.floorCount} niveau{calc.floorCount === 1 ? "" : "x"}
            </p>
            <p className="text-[0.72rem] text-muted-foreground">
              {calc.floors.reduce((s, f) => s + f.totalRooms, 0)} pièces ·{" "}
              {calc.floors.reduce((s, f) => s + f.totalCameras, 0)} rendus au total
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-muted-foreground animate-in fade-in duration-200">
              <Check className="h-3 w-3" />
              Enregistré
            </span>
          )}
          <p className="text-base font-bold text-foreground tabular-nums">
            {formatPrice(calc.totalEur)}
          </p>
        </div>
      </div>

      {/* Style guide CTA — surfaced at section level so customers can
          browse the gallery before configuring any floors. Per-floor
          panels also have their own "Guide des styles" button that
          can apply the picked style to that floor's rooms. */}
      <button
        type="button"
        onClick={() => setStyleGuideOpen(true)}
        className="group flex w-full items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/[0.05] px-4 py-3 text-left transition-all hover:border-accent/60 hover:bg-accent/[0.08]"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent transition-transform">
            <Palette className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Voir la galerie de styles
            </p>
            <p className="text-[0.72rem] text-muted-foreground">
              Scandinave, moderne, classique, industriel - choisissez ce qui vous plaît avant de configurer les niveaux.
            </p>
          </div>
        </div>
        <span className="hidden flex-shrink-0 text-[0.72rem] font-semibold text-accent sm:inline">
          Ouvrir →
        </span>
      </button>

      {/* Floor list */}
      {floors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/40 bg-card/40 px-4 py-8 text-center">
          <Layers className="mx-auto h-6 w-6 text-muted-foreground/40" />
          <p className="mt-2 text-xs text-muted-foreground">
            Aucun niveau ajouté pour l’instant. Ajoutez le premier ci-dessous.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {floors.map((floor, idx) => (
            <FloorPanel
              key={floor.id}
              floor={floor}
              idx={idx}
              calc={calc.floors[idx]}
              editable={editable}
              orderId={orderId}
              itemId={itemId}
              files={files.filter((f) => f.floorId === floor.id)}
              isOnly={floors.length === 1}
              onPatch={(patch) => patchFloor(idx, patch)}
              onRemove={() => removeFloor(idx)}
            />
          ))}
        </div>
      )}

      {/* Add floor */}
      {editable && (
        <button
          type="button"
          onClick={addFloor}
          className="group flex w-full items-center justify-between gap-3 rounded-xl border border-dashed border-accent/40 bg-accent/5 px-4 py-3 text-left transition-all hover:border-accent/60 hover:bg-accent/10"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent transition-transform group-hover:rotate-90">
              <Plus className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {floors.length === 0 ? "Ajouter le premier niveau" : "Ajouter un autre niveau"}
              </p>
              <p className="text-[0.72rem] text-muted-foreground">
                Chaque niveau a ses propres pièces, photos et paramètres.
              </p>
            </div>
          </div>
          {floors.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-1 text-[0.72rem] font-bold uppercase tracking-wider text-foreground">
              −30 % · {formatPrice(INT_STATIC_EXTRA_FLOOR_EUR)}
            </span>
          )}
        </button>
      )}

      {/* Section-level style guide modal — browse-only (editable=false
          so there's no "Appliquer à toutes les pièces" button). Customers apply styles
          per-floor via each FloorPanel's own style picker. */}
      {styleGuideOpen && (
        <StyleGuideModal
          onClose={() => setStyleGuideOpen(false)}
          onApplyToAll={() => setStyleGuideOpen(false)}
          editable={false}
        />
      )}
    </div>
  );
}
