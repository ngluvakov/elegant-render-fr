/**
 * ExtAerialConfigSection — Per-item configurator for the ext-aerial
 * product (aerial render). Camera stepper drives ext-aerial-cam.
 * Aerial-specific advanced fields (env representation + parcel
 * boundaries toggle + conditional drone-photos upload).
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
  Camera,
  Check,
  FileUp,
  MapPin,
  Minus,
  Pencil,
  Plus,
  Settings2,
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
import {
  AERIAL_VIEWS,
  ENV_REPRESENTATIONS,
  extAerialAddOnQuantitiesFor,
  type AerialViewId,
  type EnvRepId,
  type ExtAerialConfig,
} from "@/lib/catalog/exterior-config";
import {
  SEASONS,
  TIMES_OF_DAY,
  type SeasonId,
  type TimeOfDayId,
} from "@/lib/catalog/interior-config";
import {
  confirmItemFileUpload,
  deleteOrderFile,
  updateExtAerialConfig,
} from "@/server/actions/item-config";

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

type FileKind = "source" | "drone-photo";

export function ExtAerialConfigSection({
  itemId,
  orderId,
  initialConfig,
  files,
  editable,
}: {
  itemId: string;
  orderId: string;
  initialConfig: ExtAerialConfig;
  files: ItemFile[];
  editable: boolean;
}) {
  const [config, setConfig] = useState<ExtAerialConfig>(initialConfig);
  const [advanced, setAdvanced] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [, start] = useTransition();
  const [uploading, setUploading] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initRef = useRef(true);
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const droneInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { formatPrice } = useOrderCurrency();

  const totalEur = useMemo(() => {
    const calc = calculateQuote([
      {
        instanceId: itemId,
        productId: "ext-aerial",
        categoryId: "exterior",
        addOnQuantities: extAerialAddOnQuantitiesFor(config),
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
        await updateExtAerialConfig(itemId, config);
        setSavedAt(Date.now());
        router.refresh();
      });
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [config, itemId, editable, router]);

  const patch = (p: Partial<ExtAerialConfig>) =>
    setConfig((prev) => ({ ...prev, ...p }));
  const inc = () => {
    if (config.cameraCount >= 30) return;
    patch({ cameraCount: config.cameraCount + 1 });
  };
  const dec = () => {
    if (config.cameraCount <= 1) return;
    patch({ cameraCount: config.cameraCount - 1 });
  };

  const sourceFiles = files.filter(
    (f) => f.kind !== "drone-photo" && f.kind !== "logo",
  );
  const droneFiles = files.filter((f) => f.kind === "drone-photo");
  const showDroneUpload = config.environmentRepresentation === "photomontage";

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
        if (!urlRes.ok) throw new Error("Error");
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
                aria-label="Remove file"
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/30 bg-card/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-accent" />
          <div>
            <p className="text-xs font-semibold text-foreground">
              {config.complexName || "Complex"}
            </p>
            <p className="text-[0.72rem] text-muted-foreground">
              {config.cameraCount} aerial camera
              {config.cameraCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && Date.now() - savedAt < 2500 && (
            <span className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-[color:var(--color-sage-deep)] animate-in fade-in duration-200">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
          <p className="text-base font-bold text-foreground tabular-nums">
            {formatPrice(totalEur)}
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor={`name-${itemId}`} className="text-[0.72rem] uppercase tracking-wider text-muted-foreground">
          <Pencil className="h-3 w-3 text-accent/60" />
          Object / complex name
        </Label>
        <input
          id={`name-${itemId}`}
          type="text"
          value={config.complexName}
          onChange={(e) => patch({ complexName: e.target.value })}
          disabled={!editable}
          maxLength={80}
          className="w-full rounded-md bg-secondary/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[0.72rem] uppercase tracking-wider text-muted-foreground">
            <Camera className="h-3 w-3 text-accent/60" />
            Number of aerial cameras
          </Label>
          <div className="inline-flex items-center rounded-md bg-secondary/40">
            <button
              type="button"
              disabled={!editable || config.cameraCount <= 1}
              onClick={dec}
              aria-label="Decrease number of cameras"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums text-foreground">
              {config.cameraCount}
            </span>
            <button
              type="button"
              disabled={!editable || config.cameraCount >= 30}
              onClick={inc}
              aria-label="Increase number of cameras"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <span className="ml-2 text-[0.7rem] text-muted-foreground">
              1 included, +{formatPrice(48)} each additional
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor={`view-${itemId}`} className="text-[0.72rem] uppercase tracking-wider text-muted-foreground">
            Aerial view type
          </Label>
          <select
            id={`view-${itemId}`}
            value={config.aerialView}
            onChange={(e) => patch({ aerialView: e.target.value as AerialViewId })}
            disabled={!editable}
            className="w-full rounded-md bg-secondary/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-60"
          >
            {AERIAL_VIEWS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor={`desc-${itemId}`} className="text-xs">
          <Pencil className="h-3 w-3 text-accent/60" />
          Project description
        </Label>
        <Textarea
          id={`desc-${itemId}`}
          value={config.description ?? ""}
          onChange={(e) => patch({ description: e.target.value })}
          disabled={!editable}
          placeholder="Object description, plot boundaries, wider surroundings..."
          rows={3}
          className="resize-none text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Site plan and drawings</Label>
        {renderUploadZone(sourceInputRef, "PDF, DWG, CAD, images", "image/*,application/pdf,.dwg,.dxf", "source")}
        {renderFileList(sourceFiles)}
      </div>

      {uploading.length > 0 && (
        <div className="space-y-1">
          {uploading.map((name) => (
            <div key={name} className="flex items-center gap-2 rounded bg-accent/5 px-2.5 py-1.5 text-[0.7rem]">
              <FileUp className="h-3 w-3 text-accent" />
              <span className="flex-1 truncate text-foreground">{name}</span>
              <span className="text-accent">Uploading...</span>
            </div>
          ))}
        </div>
      )}

      <label
        htmlFor={`adv-${itemId}`}
        className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-secondary/30 px-3 py-2"
      >
        <div className="flex items-center gap-2">
          <Settings2 className="h-3 w-3 text-accent" />
          <span className="text-[0.7rem] font-medium text-foreground">Advanced settings</span>
          <span className="hidden text-[0.72rem] text-muted-foreground sm:inline">
            · time of day, surroundings, boundaries
          </span>
        </div>
        <Switch id={`adv-${itemId}`} checked={advanced} onCheckedChange={setAdvanced} disabled={!editable} />
      </label>

      <Collapsible open={advanced}>
        <div className="space-y-3 rounded-md border border-border/30 bg-secondary/20 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor={`tod-${itemId}`} className="text-[0.7rem]">Time of day</Label>
              <select
                id={`tod-${itemId}`}
                value={config.timeOfDay ?? ""}
                onChange={(e) => patch({ timeOfDay: (e.target.value || undefined) as TimeOfDayId | undefined })}
                disabled={!editable}
                className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
              >
                <option value="">Select...</option>
                {TIMES_OF_DAY.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`season-${itemId}`} className="text-[0.7rem]">Season</Label>
              <select
                id={`season-${itemId}`}
                value={config.season ?? ""}
                onChange={(e) => patch({ season: (e.target.value || undefined) as SeasonId | undefined })}
                disabled={!editable}
                className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
              >
                <option value="">Select...</option>
                {SEASONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor={`env-rep-${itemId}`} className="text-[0.7rem]">
              Wider surroundings view
            </Label>
            <select
              id={`env-rep-${itemId}`}
              value={config.environmentRepresentation ?? ""}
              onChange={(e) =>
                patch({
                  environmentRepresentation: (e.target.value || undefined) as
                    | EnvRepId
                    | undefined,
                })
              }
              disabled={!editable}
              className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
            >
              <option value="">Select...</option>
              {ENV_REPRESENTATIONS.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
            </select>
          </div>

          <label
            htmlFor={`parcel-${itemId}`}
            className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-card/60 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-accent" />
              <div>
                <span className="block text-[0.78rem] font-medium text-foreground">
                  Plot boundary marking
                </span>
                <span className="block text-[0.7rem] text-muted-foreground">
                  Show plot boundary lines on the render
                </span>
              </div>
            </div>
            <Switch
              id={`parcel-${itemId}`}
              checked={config.showParcelBoundaries}
              onCheckedChange={(v) => patch({ showParcelBoundaries: v })}
              disabled={!editable}
            />
          </label>

          <Collapsible open={showDroneUpload}>
            <div className="space-y-1.5 rounded-md bg-card/60 p-2.5">
              <Label className="text-[0.7rem]">
                Drone photos (for matching)
              </Label>
              {renderUploadZone(
                droneInputRef,
                "Existing drone photos of the location",
                "image/*",
                "drone-photo",
              )}
              {renderFileList(droneFiles)}
            </div>
          </Collapsible>
        </div>
      </Collapsible>
    </div>
  );
}
