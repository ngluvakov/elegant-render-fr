/**
 * RenovationConfigSection — Per-item configurator for the reno-image
 * product (virtuelna renovacija). Single-level. Captures structural
 * changes, materials, furniture style, and an upsell pair: extra
 * angles (drives reno-angle) + design variant (drives reno-room as a
 * proxy until the catalog gets a dedicated restyle add-on).
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
  Building2,
  Camera,
  Check,
  DoorOpen,
  FileUp,
  Hammer,
  Home,
  Layers,
  Minus,
  Palette,
  Paintbrush,
  Pencil,
  Plus,
  Settings2,
  Sofa,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateQuote } from "@/lib/catalog/calculate";
import { useOrderCurrency } from "@/components/portal/order-currency-context";
import { Collapsible } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HelpTip } from "@/components/ui/help-tip";
import {
  addOnQuantitiesFor,
  RENO_FLOOR_MATERIALS,
  RENO_FURNITURE_STYLES,
  RENO_ROOM_TYPES,
  RENO_SCOPES,
  RENO_WALL_MATERIALS,
  type RenoFloorMaterialId,
  type RenoFurnitureStyleId,
  type RenoRoomTypeId,
  type RenoScopeId,
  type RenoWallMaterialId,
  type RenovationConfig,
} from "@/lib/catalog/renovation-config";
import {
  confirmItemFileUpload,
  deleteOrderFile,
  updateRenovationConfig,
} from "@/server/actions/item-config";

// Catalog prices (kept inline for the +€N hints; source of truth is
// configurator.ts).
const RENO_ANGLE_EUR = 59;       // drops to €53 from 4th onward (volume rule)
const RENO_VARIANT_EUR = 56;     // reno-room (drops to €50 from 6th onward)

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

type FileKind = "source" | "reference" | "material-spec" | "extra-angle";

export function RenovationConfigSection({
  itemId,
  orderId,
  initialConfig,
  files,
  editable,
}: {
  itemId: string;
  orderId: string;
  initialConfig: RenovationConfig;
  files: ItemFile[];
  editable: boolean;
}) {
  const [config, setConfig] = useState<RenovationConfig>(initialConfig);
  const [advanced, setAdvanced] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [, start] = useTransition();
  const [uploading, setUploading] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initRef = useRef(true);
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);
  const materialInputRef = useRef<HTMLInputElement>(null);
  const extraInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { formatPrice } = useOrderCurrency();

  const totalEur = useMemo(() => {
    const calc = calculateQuote([
      {
        instanceId: itemId,
        productId: "reno-image",
        categoryId: "renovation",
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
        await updateRenovationConfig(itemId, config);
        setSavedAt(Date.now());
        router.refresh();
      });
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [config, itemId, editable, router]);

  const patch = (p: Partial<RenovationConfig>) =>
    setConfig((prev) => ({ ...prev, ...p }));

  const incExtra = () => {
    if (config.extraAnglesCount >= 30) return;
    patch({ extraAnglesCount: config.extraAnglesCount + 1 });
  };
  const decExtra = () => {
    if (config.extraAnglesCount <= 0) return;
    patch({ extraAnglesCount: config.extraAnglesCount - 1 });
  };

  const sourceFiles = files.filter((f) => f.kind === "source");
  const referenceFiles = files.filter((f) => f.kind === "reference");
  const materialFiles = files.filter((f) => f.kind === "material-spec");
  const extraFiles = files.filter((f) => f.kind === "extra-angle");

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
          <Hammer className="h-4 w-4 text-accent" />
          <div>
            <p className="text-xs font-semibold text-foreground">
              {config.roomName || "Renovacija"}
            </p>
            <p className="text-[0.72rem] text-muted-foreground">
              {RENO_ROOM_TYPES.find((r) => r.id === config.roomType)?.label} ·{" "}
              {RENO_SCOPES.find((s) => s.id === config.scope)?.label}
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
            {formatPrice(totalEur)}
          </p>
        </div>
      </div>

      {/* Room name */}
      <div className="space-y-1">
        <Label
          htmlFor={`name-${itemId}`}
          className="text-[0.72rem] uppercase tracking-wider text-muted-foreground"
        >
          <Pencil className="h-3 w-3 text-accent/60" />
          Naziv prostorije
        </Label>
        <input
          id={`name-${itemId}`}
          type="text"
          value={config.roomName}
          onChange={(e) => patch({ roomName: e.target.value })}
          disabled={!editable}
          maxLength={100}
          className="w-full rounded-md bg-secondary/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50"
        />
      </div>

      {/* Room type + scope */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label
            htmlFor={`rtype-${itemId}`}
            className="text-[0.72rem] uppercase tracking-wider text-muted-foreground"
          >
            <Home className="h-3 w-3 text-accent/60" />
            Tip prostorije
          </Label>
          <select
            id={`rtype-${itemId}`}
            value={config.roomType}
            onChange={(e) =>
              patch({ roomType: e.target.value as RenoRoomTypeId })
            }
            disabled={!editable}
            className="w-full rounded-md bg-secondary/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-60"
          >
            {RENO_ROOM_TYPES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label
            htmlFor={`scope-${itemId}`}
            className="text-[0.72rem] uppercase tracking-wider text-muted-foreground"
          >
            Obim renovacije
          </Label>
          <select
            id={`scope-${itemId}`}
            value={config.scope}
            onChange={(e) =>
              patch({ scope: e.target.value as RenoScopeId })
            }
            disabled={!editable}
            className="w-full rounded-md bg-secondary/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-60"
          >
            {RENO_SCOPES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label htmlFor={`desc-${itemId}`} className="text-xs">
          <Pencil className="h-3 w-3 text-accent/60" />
          Opis željenih promena
        </Label>
        <Textarea
          id={`desc-${itemId}`}
          value={config.description ?? ""}
          onChange={(e) => patch({ description: e.target.value })}
          disabled={!editable}
          placeholder="Tamne pločice na podu, bela kuhinja bez ručki, srušiti zid prema trpezariji…"
          rows={3}
          className="resize-none text-sm"
        />
      </div>

      {/* Source photos (existing state) */}
      <div className="space-y-1.5">
        <Label className="text-xs">Fotografije postojećeg stanja</Label>
        {renderUploadZone(
          sourceInputRef,
          "Fotografije prostora koji se renovira",
          "image/*",
          "source",
        )}
        {renderFileList(sourceFiles)}
      </div>

      {/* Reference photos (inspiration) */}
      <div className="space-y-1.5">
        <Label className="text-xs">Reference (inspiracija)</Label>
        {renderUploadZone(
          refInputRef,
          "Pinterest, primeri materijala ili stilova",
          "image/*",
          "reference",
        )}
        {renderFileList(referenceFiles)}
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
            · materijali, struktura, detalji
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
          {/* 2.1 Structural changes */}
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Strukturne promene
            </p>
            <label
              htmlFor={`walls-${itemId}`}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-card/60 px-3 py-2"
            >
              <span className="flex items-center gap-2 text-[0.78rem] text-foreground">
                <Building2 className="h-3.5 w-3.5 text-accent" />
                Promena zidova i pregrada
              </span>
              <Switch
                id={`walls-${itemId}`}
                checked={config.wallChangesEnabled}
                onCheckedChange={(v) =>
                  patch({
                    wallChangesEnabled: v,
                    ...(v ? {} : { wallChangesDescription: undefined }),
                  })
                }
                disabled={!editable}
              />
            </label>
            <Collapsible open={config.wallChangesEnabled}>
              <div className="space-y-1 rounded-md border border-border/30 bg-background/40 p-3">
                <Label
                  htmlFor={`walls-desc-${itemId}`}
                  className="text-[0.7rem]"
                >
                  Opis strukturnih promena
                </Label>
                <Textarea
                  id={`walls-desc-${itemId}`}
                  value={config.wallChangesDescription ?? ""}
                  onChange={(e) =>
                    patch({ wallChangesDescription: e.target.value })
                  }
                  disabled={!editable}
                  placeholder="Koji zid se ruši, gde se dodaje pregrada…"
                  rows={2}
                  className="resize-none text-[0.78rem]"
                />
              </div>
            </Collapsible>

            <label
              htmlFor={`doors-${itemId}`}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-card/60 px-3 py-2"
            >
              <span className="flex items-center gap-2 text-[0.78rem] text-foreground">
                <DoorOpen className="h-3.5 w-3.5 text-accent" />
                Promena prozora i vrata
              </span>
              <Switch
                id={`doors-${itemId}`}
                checked={config.windowDoorChanges}
                onCheckedChange={(v) => patch({ windowDoorChanges: v })}
                disabled={!editable}
              />
            </label>
          </div>

          {/* 2.2 Materials */}
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Materijali i obrade
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label
                  htmlFor={`floor-${itemId}`}
                  className="text-[0.7rem]"
                >
                  <Layers className="h-3 w-3 text-accent/60" />
                  Novi podovi
                </Label>
                <select
                  id={`floor-${itemId}`}
                  value={config.floorMaterial ?? ""}
                  onChange={(e) =>
                    patch({
                      floorMaterial: (e.target.value || undefined) as
                        | RenoFloorMaterialId
                        | undefined,
                    })
                  }
                  disabled={!editable}
                  className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
                >
                  <option value="">— izaberite —</option>
                  {RENO_FLOOR_MATERIALS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor={`wall-mat-${itemId}`}
                  className="text-[0.7rem]"
                >
                  <Paintbrush className="h-3 w-3 text-accent/60" />
                  Novi zidovi
                </Label>
                <select
                  id={`wall-mat-${itemId}`}
                  value={config.wallMaterial ?? ""}
                  onChange={(e) =>
                    patch({
                      wallMaterial: (e.target.value || undefined) as
                        | RenoWallMaterialId
                        | undefined,
                    })
                  }
                  disabled={!editable}
                  className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
                >
                  <option value="">— izaberite —</option>
                  {RENO_WALL_MATERIALS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[0.7rem]">Specifični materijali</Label>
              {renderUploadZone(
                materialInputRef,
                "Teksture pločica, parketa ili boja",
                "image/*,application/pdf",
                "material-spec",
              )}
              {renderFileList(materialFiles)}
            </div>
          </div>

          {/* 2.3 Furniture & retention */}
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Opremanje i nameštaj
            </p>
            <div className="space-y-1">
              <Label
                htmlFor={`fstyle-${itemId}`}
                className="text-[0.7rem]"
              >
                <Sofa className="h-3 w-3 text-accent/60" />
                Stil nameštaja
              </Label>
              <select
                id={`fstyle-${itemId}`}
                value={config.furnitureStyle ?? ""}
                onChange={(e) =>
                  patch({
                    furnitureStyle: (e.target.value || undefined) as
                      | RenoFurnitureStyleId
                      | undefined,
                  })
                }
                disabled={!editable}
                className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
              >
                <option value="">— izaberite —</option>
                {RENO_FURNITURE_STYLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor={`keep-${itemId}`} className="text-[0.7rem]">
                Šta obavezno mora ostati?
              </Label>
              <Textarea
                id={`keep-${itemId}`}
                value={config.itemsToKeep ?? ""}
                onChange={(e) => patch({ itemsToKeep: e.target.value })}
                disabled={!editable}
                placeholder="Postojeći kamin, isti prozor, ugradni plakar…"
                rows={2}
                className="resize-none text-[0.78rem]"
              />
            </div>
          </div>
        </div>
      </Collapsible>

      {/* Upsell card */}
      <div className="space-y-3 rounded-xl border border-border/40 bg-card/80 p-4">
        <div>
          <h5 className="text-sm font-semibold text-foreground">
            Dodatne opcije
          </h5>
          <p className="mt-1 text-[0.78rem] leading-relaxed text-muted-foreground">
            Dodatni uglovi iste sobe ili druga varijanta dizajna iste
            prostorije.
          </p>
        </div>

        {/* Extra angles stepper */}
        <div className="space-y-2 rounded-md bg-secondary/30 px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Camera className="h-3.5 w-3.5 text-accent" />
              <div>
                <span className="block text-[0.78rem] font-medium text-foreground">
                  Dodatni ugao iste sobe
                </span>
                <span className="block text-[0.7rem] text-muted-foreground">
                  Renovirana soba iz drugog ugla
                </span>
              </div>
            </div>
            <div className="inline-flex items-center rounded-md bg-card/80">
              <button
                type="button"
                disabled={!editable || config.extraAnglesCount <= 0}
                onClick={decExtra}
                aria-label="Smanji broj uglova"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="min-w-[1.5rem] text-center text-[0.78rem] font-semibold tabular-nums text-foreground">
                {config.extraAnglesCount}
              </span>
              <button
                type="button"
                disabled={!editable || config.extraAnglesCount >= 30}
                onClick={incExtra}
                aria-label="Povećaj broj uglova"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
          <p className="text-[0.7rem] text-muted-foreground">
            +€{RENO_ANGLE_EUR} po dodatnom uglu (€53 od 4. ugla nadalje)
          </p>

          <Collapsible open={config.extraAnglesCount > 0}>
            <div className="space-y-1.5">
              <Label className="text-[0.7rem]">Upload za dodatne uglove</Label>
              {renderUploadZone(
                extraInputRef,
                "Dodatne fotografije iste sobe",
                "image/*",
                "extra-angle",
              )}
              {renderFileList(extraFiles)}
            </div>
          </Collapsible>
        </div>

        {/* Variant toggle */}
        <label
          htmlFor={`variant-${itemId}`}
          className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-secondary/30 px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <Palette className="h-3.5 w-3.5 text-accent" />
            <div>
              <span className="flex items-center gap-1.5 text-[0.78rem] font-medium text-foreground">
                Varijanta dizajna
                <HelpTip>
                  <strong>Drugi predlog dizajna</strong> iste sobe — npr.
                  prvi render je moderni minimalizam, drugi je topli
                  skandi stil. Geometrija prostora je ista, samo se menja
                  paleta materijala / nameštaja, pa je jeftinije nego
                  novi render od nule.
                </HelpTip>
              </span>
              <span className="block text-[0.7rem] text-muted-foreground">
                Ista prostorija u drugačijem stilu ili sa drugim materijalima
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {config.variantEnabled && (
              <span className="text-[0.72rem] font-semibold text-accent tabular-nums">
                +€{RENO_VARIANT_EUR}
              </span>
            )}
            <Switch
              id={`variant-${itemId}`}
              checked={config.variantEnabled}
              onCheckedChange={(v) =>
                patch({
                  variantEnabled: v,
                  ...(v ? {} : { variantDescription: undefined }),
                })
              }
              disabled={!editable}
            />
          </div>
        </label>

        <Collapsible open={config.variantEnabled}>
          <div className="space-y-1 rounded-md border border-border/30 bg-background/40 p-3">
            <Label
              htmlFor={`variant-desc-${itemId}`}
              className="text-[0.7rem]"
            >
              Opis za varijantu
            </Label>
            <Textarea
              id={`variant-desc-${itemId}`}
              value={config.variantDescription ?? ""}
              onChange={(e) =>
                patch({ variantDescription: e.target.value })
              }
              disabled={!editable}
              placeholder="Po čemu se varijanta razlikuje od prve verzije…"
              rows={2}
              className="resize-none text-[0.78rem]"
            />
          </div>
        </Collapsible>
      </div>
    </div>
  );
}
