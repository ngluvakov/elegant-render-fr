/**
 * LandscapeConfigSection — Per-item configurator for the land-static
 * product (Landscapeni render). Single-level config (no floors): name,
 * camera stepper (drives land-cam add-on), style, description, source +
 * site-photo uploads, an Aerial Upsell card surfaced above the advanced
 * toggle (land-aerial add-on, +€380), then the advanced collapsible
 * (atmosphere / terrain / optional elements / references).
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
  Image as ImageIcon,
  Minus,
  MountainSnow,
  Pencil,
  Plus,
  Settings2,
  Trees,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  calculateQuote,
  type LineItemBreakdown,
} from "@/lib/catalog/calculate";
import { useOrderCurrency } from "@/components/portal/order-currency-context";
import { PricingBreakdown } from "./pricing-breakdown";
import { HelpTip } from "@/components/ui/help-tip";
import { Collapsible } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AERIAL_ENV_REPS,
  EXTERIOR_LIGHTING_OPTIONS,
  FENCES,
  LANDSCAPE_STYLES,
  PATH_MATERIALS,
  STRUCTURE_OPTIONS,
  TOPOGRAPHIES,
  VEGETATION_AGES,
  WATER_FEATURE_OPTIONS,
  type AerialEnvRepId,
  type ExteriorLighting,
  type FenceId,
  type LandscapeConfig,
  type LandscapeStyleId,
  type PathMaterialId,
  type Structures,
  type TopographyId,
  type VegetationAgeId,
  type WaterFeatures,
} from "@/lib/catalog/landscape-config";
import {
  SEASONS,
  TIMES_OF_DAY,
  type SeasonId,
  type TimeOfDayId,
} from "@/lib/catalog/interior-config";
import {
  confirmItemFileUpload,
  deleteOrderFile,
  updateLandscapeConfig,
} from "@/server/actions/item-config";

const LAND_AERIAL_PRICE_EUR = 380;

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

type FileKind = "source" | "site-photo" | "reference" | "planting-plan" | "drone-photo";

export function LandscapeConfigSection({
  itemId,
  orderId,
  initialConfig,
  files,
  editable,
}: {
  itemId: string;
  orderId: string;
  initialConfig: LandscapeConfig;
  files: ItemFile[];
  editable: boolean;
}) {
  const [config, setConfig] = useState<LandscapeConfig>(initialConfig);
  const [advanced, setAdvanced] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [, start] = useTransition();
  const [uploading, setUploading] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initRef = useRef(true);
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const sitePhotoInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const plantingInputRef = useRef<HTMLInputElement>(null);
  const droneInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { formatPrice } = useOrderCurrency();

  const breakdown = useMemo<LineItemBreakdown>(() => {
    const addOnQuantities: Record<string, number> = {
      "land-cam": Math.max(0, config.cameraCount - 1),
    };
    if (config.aerialEnabled) addOnQuantities["land-aerial"] = 1;
    const calc = calculateQuote([
      {
        instanceId: itemId,
        productId: "land-static",
        categoryId: "landscape",
        addOnQuantities,
      },
    ]);
    return calc.items[0]!;
  }, [itemId, config.cameraCount, config.aerialEnabled]);
  const totalEur = breakdown.totalEur;

  useEffect(() => {
    if (!editable) return;
    if (initRef.current) {
      initRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      start(async () => {
        await updateLandscapeConfig(itemId, config);
        setSavedAt(Date.now());
        router.refresh();
      });
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [config, itemId, editable, router]);

  const patch = (p: Partial<LandscapeConfig>) =>
    setConfig((prev) => ({ ...prev, ...p }));

  const incCameras = () => {
    if (config.cameraCount >= 30) return;
    patch({ cameraCount: config.cameraCount + 1 });
  };
  const decCameras = () => {
    if (config.cameraCount <= 1) return;
    patch({ cameraCount: config.cameraCount - 1 });
  };

  const sourceFiles = files.filter((f) => f.kind === "source");
  const sitePhotoFiles = files.filter((f) => f.kind === "site-photo");
  const referenceFiles = files.filter((f) => f.kind === "reference");
  const plantingFiles = files.filter((f) => f.kind === "planting-plan");
  const droneFiles = files.filter((f) => f.kind === "drone-photo");

  const showDroneUpload =
    config.aerialEnabled && config.aerialEnvRepresentation === "photomontage";

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
    <>
      <div
        onClick={() => editable && ref.current?.click()}
        className={cn(
          "flex items-center justify-center rounded-md border-2 border-dashed border-border/40 px-3 py-3 transition-colors",
          editable
            ? "cursor-pointer hover:border-accent/40"
            : "opacity-60",
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
    </>
  );

  // Generic checkbox row component for the three boolean groups
  const CheckboxRow = <K extends string>({
    options,
    state,
    onToggle,
  }: {
    options: readonly { key: K; label: string }[];
    state: Record<K, boolean>;
    onToggle: (key: K, checked: boolean) => void;
  }) => (
    <div className="grid gap-1.5 sm:grid-cols-2">
      {options.map((o) => (
        <label
          key={o.key}
          htmlFor={`${itemId}-${o.key}`}
          className="flex cursor-pointer items-center gap-2 rounded-md bg-card/60 px-2.5 py-1.5 hover:bg-card/80"
        >
          <input
            id={`${itemId}-${o.key}`}
            type="checkbox"
            className="h-3.5 w-3.5 accent-accent"
            checked={state[o.key]}
            onChange={(e) => onToggle(o.key, e.target.checked)}
            disabled={!editable}
          />
          <span className="text-[0.78rem] text-foreground">{o.label}</span>
        </label>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/30 bg-card/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Trees className="h-4 w-4 text-accent" />
          <div>
            <p className="text-xs font-semibold text-foreground">
              {config.projectName || "Landscape"}
            </p>
            <p className="text-[0.72rem] text-muted-foreground">
              {config.cameraCount} camera{config.cameraCount === 1 ? "" : "s"}
              {config.aerialEnabled ? " · aerial" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && Date.now() - savedAt < 2500 && (
            <span className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-muted-foreground animate-in fade-in duration-200">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
          <p className="text-base font-bold text-foreground tabular-nums">
            {formatPrice(totalEur)}
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
          Project / location name
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

      {/* Camera stepper + style dropdown */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[0.72rem] uppercase tracking-wider text-muted-foreground">
            <Camera className="h-3 w-3 text-accent/60" />
            Number of frames
          </Label>
          <div className="inline-flex items-center rounded-md bg-secondary/40">
            <button
              type="button"
              disabled={!editable || config.cameraCount <= 1}
              onClick={decCameras}
              aria-label="Decrease number of frames"
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
              onClick={incCameras}
              aria-label="Increase number of frames"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <span className="ml-2 text-[0.7rem] text-muted-foreground">
              1 included, +{formatPrice(45)} each additional
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <Label
            htmlFor={`style-${itemId}`}
            className="text-[0.72rem] uppercase tracking-wider text-muted-foreground"
          >
            Landscape design style
          </Label>
          <select
            id={`style-${itemId}`}
            value={config.styleId ?? ""}
            onChange={(e) =>
              patch({
                styleId: (e.target.value || undefined) as
                  | LandscapeStyleId
                  | undefined,
              })
            }
            disabled={!editable}
            className="w-full rounded-md bg-secondary/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-60"
          >
            <option value="">Select...</option>
            {LANDSCAPE_STYLES.map((s) => (
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
          Project description
        </Label>
        <Textarea
          id={`desc-${itemId}`}
          value={config.description ?? ""}
          onChange={(e) => patch({ description: e.target.value })}
          disabled={!editable}
          placeholder="Terrain description, desired plants, paths, fences, pool, or water features..."
          rows={3}
          className="resize-none text-sm"
        />
      </div>

      {/* Source files */}
      <div className="space-y-1.5">
        <Label className="text-xs">Site plan and drawings</Label>
        {renderUploadZone(
          sourceInputRef,
          "Drag or click - PDF, DWG, CAD, sketches",
          "image/*,application/pdf,.dwg,.dxf",
          "source",
        )}
        {renderFileList(sourceFiles)}
      </div>

      {/* Site photos */}
      <div className="space-y-1.5">
        <Label className="text-xs">Photos of the current condition</Label>
        {renderUploadZone(
          sitePhotoInputRef,
          "Location images from several angles",
          "image/*",
          "site-photo",
        )}
        {renderFileList(sitePhotoFiles)}
      </div>

      {/* Uploading indicator (shared across all uploads) */}
      {uploading.length > 0 && (
        <div className="space-y-1">
          {uploading.map((name) => (
            <div
              key={name}
              className="flex items-center gap-2 rounded bg-accent/5 px-2.5 py-1.5 text-[0.7rem]"
            >
              <FileUp className="h-3 w-3 text-accent" />
              <span className="flex-1 truncate text-foreground">{name}</span>
              <span className="text-accent">Uploading...</span>
            </div>
          ))}
        </div>
      )}

      {/* Aerial upsell — surfaced above the advanced toggle so the
          €380 add-on is visible without expanding fine-tuning. */}
      <div className="space-y-3 rounded-xl border border-border/40 bg-card/80 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h5 className="text-sm font-semibold text-foreground">
              Aerial landscape view
            </h5>
            <p className="mt-1 text-[0.78rem] leading-relaxed text-muted-foreground">
              Add a bird's-eye view of the full solution.
            </p>
          </div>
          {config.aerialEnabled && (
            <p className="flex-shrink-0 text-sm font-bold text-foreground tabular-nums">
              +{formatPrice(LAND_AERIAL_PRICE_EUR)}
            </p>
          )}
        </div>

        <label
          htmlFor={`aerial-${itemId}`}
          className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-secondary/30 px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <MountainSnow className="h-3.5 w-3.5 text-accent" />
            <span className="text-[0.78rem] font-medium text-foreground">
              I want an aerial view
            </span>
          </div>
          <Switch
            id={`aerial-${itemId}`}
            checked={config.aerialEnabled}
            onCheckedChange={(v) =>
              patch({
                aerialEnabled: v,
                ...(v ? {} : { aerialEnvRepresentation: undefined }),
              })
            }
            disabled={!editable}
          />
        </label>

        <Collapsible open={config.aerialEnabled}>
          <div className="space-y-2 rounded-md border border-border/30 bg-background/40 p-3">
            <div className="space-y-1">
              <Label htmlFor={`aer-env-${itemId}`} className="text-[0.7rem]">
                Wider surroundings view
              </Label>
              <select
                id={`aer-env-${itemId}`}
                value={config.aerialEnvRepresentation ?? ""}
                onChange={(e) =>
                  patch({
                    aerialEnvRepresentation: (e.target.value || undefined) as
                      | AerialEnvRepId
                      | undefined,
                  })
                }
                disabled={!editable}
                className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
              >
                <option value="">Select...</option>
                {AERIAL_ENV_REPS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>

            <Collapsible open={showDroneUpload}>
              <div className="space-y-1.5 rounded-md bg-card/60 p-2.5">
                <Label className="text-[0.7rem]">
                  <ImageIcon className="h-3 w-3 text-accent/60" />
                  Drone photos (for photomontage)
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

      {/* Advanced toggle */}
      <p className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
        <Check className="h-3 w-3" />
        This item is ready to order. Fine-tuning is below.
      </p>
      <label
        htmlFor={`adv-${itemId}`}
        className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-secondary/30 px-3 py-2"
      >
        <div className="flex items-center gap-2">
          <Settings2 className="h-3 w-3 text-accent" />
          <span className="text-[0.7rem] font-medium text-foreground">
            Advanced settings{" "}
            <span className="text-muted-foreground">(optional)</span>
          </span>
          <span className="hidden text-[0.72rem] text-muted-foreground sm:inline">
            · terrain, vegetation, lighting, atmosphere
          </span>
        </div>
        <Switch
          id={`adv-${itemId}`}
          checked={advanced}
          onCheckedChange={setAdvanced}
          disabled={!editable}
        />
      </label>

      {/* Advanced collapsible */}
      <Collapsible open={advanced}>
        <div className="space-y-4 rounded-md border border-border/30 bg-secondary/20 p-3">
          {/* 2.1 Atmosphere */}
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Atmosphere and surroundings
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor={`tod-${itemId}`} className="text-[0.7rem]">
                  Time of day
                </Label>
                <select
                  id={`tod-${itemId}`}
                  value={config.timeOfDay ?? ""}
                  onChange={(e) =>
                    patch({
                      timeOfDay: (e.target.value || undefined) as
                        | TimeOfDayId
                        | undefined,
                    })
                  }
                  disabled={!editable}
                  className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
                >
                  <option value="">Select...</option>
                  {TIMES_OF_DAY.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor={`season-${itemId}`} className="text-[0.7rem]">
                  Season
                </Label>
                <select
                  id={`season-${itemId}`}
                  value={config.season ?? ""}
                  onChange={(e) =>
                    patch({
                      season: (e.target.value || undefined) as
                        | SeasonId
                        | undefined,
                    })
                  }
                  disabled={!editable}
                  className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
                >
                  <option value="">Select...</option>
                  {SEASONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor={`vegage-${itemId}`} className="text-[0.7rem]">
                  Vegetation age
                </Label>
                <select
                  id={`vegage-${itemId}`}
                  value={config.vegetationAge ?? ""}
                  onChange={(e) =>
                    patch({
                      vegetationAge: (e.target.value || undefined) as
                        | VegetationAgeId
                        | undefined,
                    })
                  }
                  disabled={!editable}
                  className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
                >
                  <option value="">Select...</option>
                  {VEGETATION_AGES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2.2 Terrain & hardscape */}
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Terrain and hardscape
              <HelpTip>
                <strong>Hardscape</strong> - non-living landscape elements:
                paths, paved areas, low walls, stairs, fences,
                wooden decks. The opposite of “softscape” (plants, grass).
              </HelpTip>
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor={`topo-${itemId}`} className="text-[0.7rem]">
                  Terrain topography
                </Label>
                <select
                  id={`topo-${itemId}`}
                  value={config.topography ?? ""}
                  onChange={(e) =>
                    patch({
                      topography: (e.target.value || undefined) as
                        | TopographyId
                        | undefined,
                    })
                  }
                  disabled={!editable}
                  className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
                >
                  <option value="">Select...</option>
                  {TOPOGRAPHIES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor={`paths-${itemId}`} className="text-[0.7rem]">
                  Path materials
                </Label>
                <select
                  id={`paths-${itemId}`}
                  value={config.pathMaterial ?? ""}
                  onChange={(e) =>
                    patch({
                      pathMaterial: (e.target.value || undefined) as
                        | PathMaterialId
                        | undefined,
                    })
                  }
                  disabled={!editable}
                  className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
                >
                  <option value="">Select...</option>
                  {PATH_MATERIALS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor={`fence-${itemId}`} className="text-[0.7rem]">
                  Fences and boundaries
                </Label>
                <select
                  id={`fence-${itemId}`}
                  value={config.fence ?? ""}
                  onChange={(e) =>
                    patch({
                      fence: (e.target.value || undefined) as
                        | FenceId
                        | undefined,
                    })
                  }
                  disabled={!editable}
                  className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
                >
                  <option value="">Select...</option>
                  {FENCES.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2.3 Optional elements */}
          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Specific elements
            </p>

            <div className="space-y-1">
              <Label className="text-[0.7rem]">Water features</Label>
              <CheckboxRow<keyof WaterFeatures>
                options={WATER_FEATURE_OPTIONS}
                state={config.waterFeatures}
                onToggle={(key, checked) =>
                  patch({
                    waterFeatures: { ...config.waterFeatures, [key]: checked },
                  })
                }
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[0.7rem]">Additional objects in the space</Label>
              <CheckboxRow<keyof Structures>
                options={STRUCTURE_OPTIONS}
                state={config.structures}
                onToggle={(key, checked) =>
                  patch({
                    structures: { ...config.structures, [key]: checked },
                  })
                }
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[0.7rem]">Outdoor lighting</Label>
              <CheckboxRow<keyof ExteriorLighting>
                options={EXTERIOR_LIGHTING_OPTIONS}
                state={config.exteriorLighting}
                onToggle={(key, checked) =>
                  patch({
                    exteriorLighting: {
                      ...config.exteriorLighting,
                      [key]: checked,
                    },
                  })
                }
              />
            </div>
          </div>

          {/* 2.4 Reference uploads */}
          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Reference
            </p>

            <div className="space-y-1.5">
              <Label className="text-[0.7rem]">Plant and material references</Label>
              {renderUploadZone(
                referenceInputRef,
                "Images of desired plants, textures, furniture",
                "image/*",
                "reference",
              )}
              {renderFileList(referenceFiles)}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[0.7rem]">Planting plan</Label>
              {renderUploadZone(
                plantingInputRef,
                "PDF, tables with a plant list",
                "image/*,application/pdf",
                "planting-plan",
              )}
              {renderFileList(plantingFiles)}
            </div>
          </div>

          <PricingBreakdown breakdown={breakdown} />
        </div>
      </Collapsible>

    </div>
  );
}
