/**
 * FloorplanConfigSection — Per-item configurator for the fp3d-single
 * product (3D osnove prostora). Single-level; the "broj nivoa" stepper
 * drives progressive add-on pricing (fp3d-second + fp3d-extra). Display
 * type, furniture style, advanced viewing/labels options live in
 * configJson. Bottom upsell card toggles design variant + identical
 * duplicate add-ons.
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
import { useRouter } from "next/navigation";
import {
  Check,
  Compass,
  Copy,
  FileUp,
  Grid2x2,
  Layers,
  Minus,
  Palette,
  Pencil,
  Plus,
  Settings2,
  Sofa,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateQuote, formatEur } from "@/lib/catalog/calculate";
import { Collapsible } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  addOnQuantitiesFor,
  FP_BACKGROUNDS,
  FP_CAMERA_ANGLES,
  FP_DISPLAY_TYPES,
  FP_FURNITURE_STYLES,
  FP_WALL_DISPLAYS,
  type FloorplanConfig,
  type FpBackgroundId,
  type FpCameraAngleId,
  type FpDisplayTypeId,
  type FpFurnitureStyleId,
  type FpWallDisplayId,
} from "@/lib/catalog/floorplan-config";
import {
  confirmItemFileUpload,
  deleteOrderFile,
  updateFloorplanConfig,
} from "@/server/actions/item-config";

// Catalog prices (kept inline for the "+ €N" hints; source of truth is
// configurator.ts).
const FP3D_VARIANT_EUR = 6;
const FP3D_DUPLICATE_EUR = 10;

type ItemFile = {
  id: string;
  fileName: string;
  fileSize: number;
  kind: string;
  floorId: string | null;
};

function formatSize(b: number) {
  return b < 1024 * 1024
    ? `${(b / 1024).toFixed(0)} KB`
    : `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

type FileKind = "source" | "material-spec" | "reference";

export function FloorplanConfigSection({
  itemId,
  orderId,
  initialConfig,
  files,
  editable,
}: {
  itemId: string;
  orderId: string;
  initialConfig: FloorplanConfig;
  files: ItemFile[];
  editable: boolean;
}) {
  const [config, setConfig] = useState<FloorplanConfig>(initialConfig);
  const [advanced, setAdvanced] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [, start] = useTransition();
  const [uploading, setUploading] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initRef = useRef(true);
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const materialInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const totalEur = useMemo(() => {
    const calc = calculateQuote([
      {
        instanceId: itemId,
        productId: "fp3d-single",
        categoryId: "floorplans-3d",
        addOnQuantities: addOnQuantitiesFor(config),
      },
    ]);
    return calc.items[0]?.totalEur ?? 0;
  }, [itemId, config]);

  useEffect(() => {
    if (!editable) return;
    if (initRef.current) {
      initRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      start(async () => {
        await updateFloorplanConfig(itemId, config);
        setSavedAt(Date.now());
        router.refresh();
      });
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [config, itemId, editable, router]);

  const patch = (p: Partial<FloorplanConfig>) =>
    setConfig((prev) => ({ ...prev, ...p }));

  const incLevels = () => {
    if (config.levels >= 30) return;
    patch({ levels: config.levels + 1 });
  };
  const decLevels = () => {
    if (config.levels <= 1) return;
    patch({ levels: config.levels - 1 });
  };

  const isFurnished =
    config.displayType === "furnished" || config.displayType === "both";

  const sourceFiles = files.filter((f) => f.kind === "source");
  const materialFiles = files.filter((f) => f.kind === "material-spec");
  const referenceFiles = files.filter((f) => f.kind === "reference");

  const uploadFile = useCallback(
    async (file: File, kind: FileKind) => {
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
        if (!urlRes.ok) throw new Error("Greška");
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
          undefined,
        );
        router.refresh();
      } catch {}
      setUploading((prev) => prev.filter((n) => n !== file.name));
    },
    [orderId, itemId, router],
  );

  const handleFileDelete = async (fileId: string) => {
    await deleteOrderFile(fileId);
    router.refresh();
  };

  const renderFileList = (list: ItemFile[]) =>
    list.length > 0 ? (
      <div className="space-y-1">
        {list.map((f) => (
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
                aria-label="Ukloni fajl"
                onClick={() => handleFileDelete(f.id)}
                className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    ) : null;

  const renderUploadZone = (
    ref: React.RefObject<HTMLInputElement | null>,
    label: string,
    accept: string,
    kind: FileKind,
  ) => (
    <div
      onClick={() => editable && ref.current?.click()}
      className={cn(
        "flex items-center justify-center rounded-md border-2 border-dashed border-border/40 px-3 py-3 transition-colors",
        editable ? "cursor-pointer hover:border-accent/40" : "opacity-60",
      )}
    >
      <Upload className="mr-2 h-3.5 w-3.5 text-muted-foreground/50" />
      <span className="text-[0.7rem] text-muted-foreground">{label}</span>
      <input
        ref={ref}
        type="file"
        multiple
        accept={accept}
        disabled={!editable}
        onChange={(e) => {
          if (e.target.files) {
            Array.from(e.target.files).forEach((f) => uploadFile(f, kind));
            e.target.value = "";
          }
        }}
        className="hidden"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/30 bg-card/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Grid2x2 className="h-4 w-4 text-accent" />
          <div>
            <p className="text-xs font-semibold text-foreground">
              {config.projectName || "Osnova"}
            </p>
            <p className="text-[0.72rem] text-muted-foreground">
              {config.levels} nivo{config.levels === 1 ? "" : "a"} ·{" "}
              {config.displayType === "unfurnished"
                ? "prazna"
                : config.displayType === "furnished"
                  ? "nameštena"
                  : "obe varijante"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && Date.now() - savedAt < 2500 && (
            <span className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-[color:var(--color-sage-deep)] animate-in fade-in duration-200">
              <Check className="h-3 w-3" />
              Sačuvano
            </span>
          )}
          <p className="text-base font-bold text-foreground tabular-nums">
            {formatEur(totalEur)}
          </p>
        </div>
      </div>

      {/* Project name */}
      <div className="space-y-1">
        <Label
          htmlFor={`name-${itemId}`}
          className="text-[0.72rem] uppercase tracking-wider text-muted-foreground"
        >
          <Pencil className="h-3 w-3 text-accent/60" />
          Naziv osnove / sprata
        </Label>
        <input
          id={`name-${itemId}`}
          type="text"
          value={config.projectName}
          onChange={(e) => patch({ projectName: e.target.value })}
          disabled={!editable}
          maxLength={100}
          className="w-full rounded-md bg-secondary/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50"
        />
      </div>

      {/* Levels stepper + display type */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[0.72rem] uppercase tracking-wider text-muted-foreground">
            <Layers className="h-3 w-3 text-accent/60" />
            Broj nivoa (spratova)
          </Label>
          <div className="inline-flex items-center rounded-md bg-secondary/40">
            <button
              type="button"
              disabled={!editable || config.levels <= 1}
              onClick={decLevels}
              aria-label="Smanji broj nivoa"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums text-foreground">
              {config.levels}
            </span>
            <button
              type="button"
              disabled={!editable || config.levels >= 30}
              onClick={incLevels}
              aria-label="Povećaj broj nivoa"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <span className="ml-2 text-[0.7rem] text-muted-foreground">
              1 uključen, +€17 za 2., pa +€15 svaki sledeći
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <Label
            htmlFor={`display-${itemId}`}
            className="text-[0.72rem] uppercase tracking-wider text-muted-foreground"
          >
            Tip prikaza (nameštaj)
          </Label>
          <select
            id={`display-${itemId}`}
            value={config.displayType}
            onChange={(e) =>
              patch({
                displayType: e.target.value as FpDisplayTypeId,
                ...(e.target.value === "unfurnished"
                  ? { furnitureStyleId: undefined }
                  : {}),
              })
            }
            disabled={!editable}
            className="w-full rounded-md bg-secondary/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-60"
          >
            {FP_DISPLAY_TYPES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
          {isFurnished && (
            <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
              + Overlay nameštaja: €8
            </p>
          )}
        </div>
      </div>

      {/* Furniture style (conditional) */}
      <Collapsible open={isFurnished}>
        <div className="space-y-1">
          <Label
            htmlFor={`fstyle-${itemId}`}
            className="text-[0.72rem] uppercase tracking-wider text-muted-foreground"
          >
            <Sofa className="h-3 w-3 text-accent/60" />
            Stil nameštaja
          </Label>
          <select
            id={`fstyle-${itemId}`}
            value={config.furnitureStyleId ?? ""}
            onChange={(e) =>
              patch({
                furnitureStyleId: (e.target.value || undefined) as
                  | FpFurnitureStyleId
                  | undefined,
              })
            }
            disabled={!editable}
            className="w-full rounded-md bg-secondary/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-60"
          >
            <option value="">— izaberite —</option>
            {FP_FURNITURE_STYLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </Collapsible>

      {/* Description */}
      <div className="space-y-1">
        <Label htmlFor={`desc-${itemId}`} className="text-xs">
          <Pencil className="h-3 w-3 text-accent/60" />
          Opis i napomene
        </Label>
        <Textarea
          id={`desc-${itemId}`}
          value={config.description ?? ""}
          onChange={(e) => patch({ description: e.target.value })}
          disabled={!editable}
          placeholder="Posebni zahtevi za raspored, namenu prostorija ili boje…"
          rows={3}
          className="resize-none text-sm"
        />
      </div>

      {/* Source files */}
      <div className="space-y-1.5">
        <Label className="text-xs">2D osnove i nacrti</Label>
        {renderUploadZone(
          sourceInputRef,
          "Prevucite ili kliknite — PDF, DWG, CAD, skice sa merama",
          "image/*,application/pdf,.dwg,.dxf",
          "source",
        )}
        {renderFileList(sourceFiles)}
      </div>

      {uploading.length > 0 && (
        <div className="space-y-1">
          {uploading.map((name) => (
            <div
              key={name}
              className="flex items-center gap-2 rounded bg-accent/5 px-2.5 py-1.5 text-[0.7rem]"
            >
              <FileUp className="h-3 w-3 text-accent" />
              <span className="flex-1 truncate text-foreground">{name}</span>
              <span className="text-accent">Otpremanje…</span>
            </div>
          ))}
        </div>
      )}

      {/* Advanced toggle */}
      <label
        htmlFor={`adv-${itemId}`}
        className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-secondary/30 px-3 py-2"
      >
        <div className="flex items-center gap-2">
          <Settings2 className="h-3 w-3 text-accent" />
          <span className="text-[0.7rem] font-medium text-foreground">
            Napredno podešavanje
          </span>
          <span className="hidden text-[0.72rem] text-muted-foreground sm:inline">
            · ugao gledanja, oznake, materijali
          </span>
        </div>
        <Switch
          id={`adv-${itemId}`}
          checked={advanced}
          onCheckedChange={setAdvanced}
          disabled={!editable}
        />
      </label>

      <Collapsible open={advanced}>
        <div className="space-y-4 rounded-md border border-border/30 bg-secondary/20 p-3">
          {/* 2.1 Viewing & presentation */}
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Ugao gledanja i prezentacija
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor={`cam-${itemId}`} className="text-[0.7rem]">
                  Ugao kamere
                </Label>
                <select
                  id={`cam-${itemId}`}
                  value={config.cameraAngle ?? ""}
                  onChange={(e) =>
                    patch({
                      cameraAngle: (e.target.value || undefined) as
                        | FpCameraAngleId
                        | undefined,
                    })
                  }
                  disabled={!editable}
                  className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
                >
                  <option value="">— izaberite —</option>
                  {FP_CAMERA_ANGLES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor={`walls-${itemId}`} className="text-[0.7rem]">
                  Prikaz zidova
                </Label>
                <select
                  id={`walls-${itemId}`}
                  value={config.wallDisplay ?? ""}
                  onChange={(e) =>
                    patch({
                      wallDisplay: (e.target.value || undefined) as
                        | FpWallDisplayId
                        | undefined,
                    })
                  }
                  disabled={!editable}
                  className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
                >
                  <option value="">— izaberite —</option>
                  {FP_WALL_DISPLAYS.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor={`bg-${itemId}`} className="text-[0.7rem]">
                  Boja pozadine
                </Label>
                <select
                  id={`bg-${itemId}`}
                  value={config.backgroundColor ?? ""}
                  onChange={(e) =>
                    patch({
                      backgroundColor: (e.target.value || undefined) as
                        | FpBackgroundId
                        | undefined,
                    })
                  }
                  disabled={!editable}
                  className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
                >
                  <option value="">— izaberite —</option>
                  {FP_BACKGROUNDS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2.2 Labels & technical */}
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Oznake i tehnički detalji
            </p>
            <div className="space-y-1.5">
              <label
                htmlFor={`labels-${itemId}`}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-card/60 px-3 py-2"
              >
                <span className="text-[0.78rem] text-foreground">
                  Prikaži nazive prostorija na renderu
                </span>
                <Switch
                  id={`labels-${itemId}`}
                  checked={config.showRoomLabels}
                  onCheckedChange={(v) => patch({ showRoomLabels: v })}
                  disabled={!editable}
                />
              </label>
              <label
                htmlFor={`dims-${itemId}`}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-card/60 px-3 py-2"
              >
                <span className="text-[0.78rem] text-foreground">
                  Prikaži kvadraturu (m²) i dimenzije
                </span>
                <Switch
                  id={`dims-${itemId}`}
                  checked={config.showDimensions}
                  onCheckedChange={(v) => patch({ showDimensions: v })}
                  disabled={!editable}
                />
              </label>
              <label
                htmlFor={`compass-${itemId}`}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-card/60 px-3 py-2"
              >
                <span className="flex items-center gap-2 text-[0.78rem] text-foreground">
                  <Compass className="h-3.5 w-3.5 text-accent" />
                  Dodaj oznaku za orijentaciju (Sever)
                </span>
                <Switch
                  id={`compass-${itemId}`}
                  checked={config.showCompass}
                  onCheckedChange={(v) => patch({ showCompass: v })}
                  disabled={!editable}
                />
              </label>
            </div>
          </div>

          {/* 2.3 Materials & references */}
          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Materijali i reference
            </p>

            <div className="space-y-1.5">
              <Label className="text-[0.7rem]">Specifikacija materijala</Label>
              {renderUploadZone(
                materialInputRef,
                "Tabele / dokumenti sa podovima, pločicama, bojama zidova",
                "image/*,application/pdf,.xlsx,.xls",
                "material-spec",
              )}
              {renderFileList(materialFiles)}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[0.7rem]">Reference za stil</Label>
              {renderUploadZone(
                refInputRef,
                "Slike željenog nameštaja ili atmosfere",
                "image/*",
                "reference",
              )}
              {renderFileList(referenceFiles)}
            </div>
          </div>
        </div>
      </Collapsible>

      {/* Upsell card */}
      <div className="space-y-3 rounded-xl border border-border/40 bg-card/80 p-4">
        <div>
          <h5 className="text-sm font-semibold text-foreground">
            Dodatne varijante
          </h5>
          <p className="mt-1 text-[0.78rem] leading-relaxed text-muted-foreground">
            Naručite isti raspored sa drugim stilom ili identičnu osnovu sa
            drugačijim nazivima prostorija.
          </p>
        </div>

        {/* Variant toggle */}
        <label
          htmlFor={`variant-${itemId}`}
          className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-secondary/30 px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <Palette className="h-3.5 w-3.5 text-accent" />
            <div>
              <span className="block text-[0.78rem] font-medium text-foreground">
                Dodatna varijanta dizajna
              </span>
              <span className="block text-[0.7rem] text-muted-foreground">
                Isti raspored, potpuno drugačiji stil nameštaja
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {config.variantEnabled && (
              <span className="text-[0.72rem] font-semibold text-accent tabular-nums">
                +€{FP3D_VARIANT_EUR}
              </span>
            )}
            <Switch
              id={`variant-${itemId}`}
              checked={config.variantEnabled}
              onCheckedChange={(v) =>
                patch({
                  variantEnabled: v,
                  ...(v ? {} : { variantStyleId: undefined }),
                })
              }
              disabled={!editable}
            />
          </div>
        </label>

        <Collapsible open={config.variantEnabled}>
          <div className="space-y-1 rounded-md border border-border/30 bg-background/40 p-3">
            <Label
              htmlFor={`vstyle-${itemId}`}
              className="text-[0.7rem]"
            >
              Stil za drugu varijantu
            </Label>
            <select
              id={`vstyle-${itemId}`}
              value={config.variantStyleId ?? ""}
              onChange={(e) =>
                patch({
                  variantStyleId: (e.target.value || undefined) as
                    | FpFurnitureStyleId
                    | undefined,
                })
              }
              disabled={!editable}
              className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
            >
              <option value="">— izaberite —</option>
              {FP_FURNITURE_STYLES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </Collapsible>

        {/* Duplicate toggle */}
        <label
          htmlFor={`dupe-${itemId}`}
          className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-secondary/30 px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <Copy className="h-3.5 w-3.5 text-accent" />
            <div>
              <span className="block text-[0.78rem] font-medium text-foreground">
                Duplikat osnove
              </span>
              <span className="block text-[0.7rem] text-muted-foreground">
                Identična osnova sa drugim nazivima prostorija
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {config.duplicateEnabled && (
              <span className="text-[0.72rem] font-semibold text-accent tabular-nums">
                +€{FP3D_DUPLICATE_EUR}
              </span>
            )}
            <Switch
              id={`dupe-${itemId}`}
              checked={config.duplicateEnabled}
              onCheckedChange={(v) => patch({ duplicateEnabled: v })}
              disabled={!editable}
            />
          </div>
        </label>
      </div>
    </div>
  );
}
