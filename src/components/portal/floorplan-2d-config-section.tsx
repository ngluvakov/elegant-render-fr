/**
 * Floorplan2dConfigSection — Per-item configurator for the fp2d-single
 * product (2D room plans). Single-level; the levels stepper drives
 * progressive add-on pricing (fp2d-double + fp2d-extra). Display style
 * (color/texture) and display type (empty/furnished) live in configJson;
 * "furnished" toggles fp2d-furnished. Branding section (logo + brand
 * color + delivery format checkboxes). Bottom upsell card toggles
 * design variant + identical duplicate add-ons.
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
  FileImage,
  FileUp,
  Languages,
  Layers,
  Minus,
  Palette,
  Pencil,
  Plus,
  Settings2,
  Sparkles,
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
  addOnQuantitiesFor,
  FP2D_DELIVERY_FORMAT_OPTIONS,
  FP2D_DISPLAY_STYLES,
  FP2D_DISPLAY_TYPES,
  FP2D_LABEL_LANGUAGES,
  type Fp2dDeliveryFormats,
  type Fp2dDisplayStyleId,
  type Fp2dDisplayTypeId,
  type Fp2dLabelLanguageId,
  type Floorplan2dConfig,
} from "@/lib/catalog/floorplan-2d-config";
import {
  confirmItemFileUpload,
  deleteOrderFile,
  updateFloorplan2dConfig,
} from "@/server/actions/item-config";

const FP2D_VARIANT_EUR = 4;
const FP2D_DUPLICATE_EUR = 6;

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

type FileKind = "source" | "logo";

export function Floorplan2dConfigSection({
  itemId,
  orderId,
  initialConfig,
  files,
  editable,
}: {
  itemId: string;
  orderId: string;
  initialConfig: Floorplan2dConfig;
  files: ItemFile[];
  editable: boolean;
}) {
  const [config, setConfig] = useState<Floorplan2dConfig>(initialConfig);
  const [advanced, setAdvanced] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [, start] = useTransition();
  const [uploading, setUploading] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initRef = useRef(true);
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { formatPrice, formatPriceText } = useOrderCurrency();

  const totalEur = useMemo(() => {
    const calc = calculateQuote([
      {
        instanceId: itemId,
        productId: "fp2d-single",
        categoryId: "floorplans-2d",
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
        await updateFloorplan2dConfig(itemId, config);
        setSavedAt(Date.now());
        router.refresh();
      });
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [config, itemId, editable, router]);

  const patch = (p: Partial<Floorplan2dConfig>) =>
    setConfig((prev) => ({ ...prev, ...p }));

  const incLevels = () => {
    if (config.levels >= 30) return;
    patch({ levels: config.levels + 1 });
  };
  const decLevels = () => {
    if (config.levels <= 1) return;
    patch({ levels: config.levels - 1 });
  };

  const sourceFiles = files.filter((f) => f.kind === "source");
  const logoFiles = files.filter((f) => f.kind === "logo");

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

  const toggleDeliveryFormat = (key: keyof Fp2dDeliveryFormats, v: boolean) => {
    const next = { ...config.deliveryFormats, [key]: v };
    // Don't allow all four to be off — keep at least one ticked.
    if (!next.pdf && !next.svg && !next.png && !next.jpg) return;
    patch({ deliveryFormats: next });
  };

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/30 bg-card/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <FileImage className="h-4 w-4 text-accent" />
          <div>
            <p className="text-xs font-semibold text-foreground">
              {config.projectName || "Floor plan"}
            </p>
            <p className="text-[0.72rem] text-muted-foreground">
              {config.levels} level{config.levels === 1 ? "" : "s"} ·{" "}
              {config.displayType === "furnished" ? "furnished" : "empty"} ·{" "}
              {FP2D_DISPLAY_STYLES.find((s) => s.id === config.displayStyle)
                ?.label ?? config.displayStyle}
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
          Plan / floor name
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

      {/* Levels stepper + display style + display type */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[0.72rem] uppercase tracking-wider text-muted-foreground">
            <Layers className="h-3 w-3 text-accent/60" />
            Number of levels (floors)
          </Label>
          <div className="inline-flex items-center rounded-md bg-secondary/40">
            <button
              type="button"
              disabled={!editable || config.levels <= 1}
              onClick={decLevels}
              aria-label="Decrease number of levels"
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
              aria-label="Increase number of levels"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <span className="ml-2 text-[0.7rem] text-muted-foreground">
              {formatPriceText("1 included, +€12 for the second, then +€10 each additional")}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <Label
            htmlFor={`style-${itemId}`}
            className="text-[0.72rem] uppercase tracking-wider text-muted-foreground"
          >
            Display style (colors and textures)
          </Label>
          <select
            id={`style-${itemId}`}
            value={config.displayStyle}
            onChange={(e) =>
              patch({ displayStyle: e.target.value as Fp2dDisplayStyleId })
            }
            disabled={!editable}
            className="w-full rounded-md bg-secondary/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-60"
          >
            {FP2D_DISPLAY_STYLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <Label
          htmlFor={`disp-type-${itemId}`}
          className="text-[0.72rem] uppercase tracking-wider text-muted-foreground"
        >
          Display type (furniture)
        </Label>
        <select
          id={`disp-type-${itemId}`}
          value={config.displayType}
          onChange={(e) =>
            patch({ displayType: e.target.value as Fp2dDisplayTypeId })
          }
          disabled={!editable}
          className="w-full rounded-md bg-secondary/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-60"
        >
          {FP2D_DISPLAY_TYPES.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
        {config.displayType === "furnished" && (
          <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
            + Overlay furniture: {formatPrice(6)}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label htmlFor={`desc-${itemId}`} className="text-xs">
          <Pencil className="h-3 w-3 text-accent/60" />
          Description and notes
        </Label>
        <Textarea
          id={`desc-${itemId}`}
          value={config.description ?? ""}
          onChange={(e) => patch({ description: e.target.value })}
          disabled={!editable}
          placeholder="Special requirements for layout, room purpose, or colors..."
          rows={3}
          className="resize-none text-sm"
        />
      </div>

      {/* Source files */}
      <div className="space-y-1.5">
        <Label className="text-xs">Plans and sketches</Label>
        {renderUploadZone(
          sourceInputRef,
          "PDF, DWG, CAD, hand sketches with dimensions",
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
              <span className="text-accent">Uploading...</span>
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
            Advanced settings
          </span>
          <span className="hidden text-[0.72rem] text-muted-foreground sm:inline">
            · labels, dimensions, branding
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
          {/* 2.1 Labels & technical */}
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Labels and technical details
            </p>
            <div className="space-y-1.5">
              <label
                htmlFor={`labels-${itemId}`}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-card/60 px-3 py-2"
              >
                <span className="text-[0.78rem] text-foreground">
                  Show room names
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
                  Show area (m²) and dimensions
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
                  Add orientation marker (north)
                </span>
                <Switch
                  id={`compass-${itemId}`}
                  checked={config.showCompass}
                  onCheckedChange={(v) => patch({ showCompass: v })}
                  disabled={!editable}
                />
              </label>
            </div>

            <div className="space-y-1">
              <Label htmlFor={`lang-${itemId}`} className="text-[0.7rem]">
                <Languages className="h-3 w-3 text-accent/60" />
                Jezik oznaka
              </Label>
              <select
                id={`lang-${itemId}`}
                value={config.labelLanguage ?? ""}
                onChange={(e) =>
                  patch({
                    labelLanguage: (e.target.value || undefined) as
                      | Fp2dLabelLanguageId
                      | undefined,
                  })
                }
                disabled={!editable}
                className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
              >
                <option value="">Select...</option>
                {FP2D_LABEL_LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2.2 Branding & export */}
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Branding and export
            </p>

            <label
              htmlFor={`branding-${itemId}`}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-card/60 px-3 py-2"
            >
              <span className="flex items-center gap-2 text-[0.78rem] text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Add logo and contact details to the floor plan
              </span>
              <Switch
                id={`branding-${itemId}`}
                checked={config.brandingEnabled}
                onCheckedChange={(v) =>
                  patch({
                    brandingEnabled: v,
                    ...(v ? {} : { brandPrimaryColor: undefined }),
                  })
                }
                disabled={!editable}
              />
            </label>

            <Collapsible open={config.brandingEnabled}>
              <div className="space-y-2 rounded-md border border-border/30 bg-background/40 p-3">
                <div className="space-y-1.5">
                  <Label className="text-[0.7rem]">Logo (PNG / SVG / JPG)</Label>
                  {renderUploadZone(
                    logoInputRef,
                    "Upload the company logo",
                    "image/*",
                    "logo",
                  )}
                  {renderFileList(logoFiles)}
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`brand-color-${itemId}`} className="text-[0.7rem]">
                    <Palette className="h-3 w-3 text-accent/60" />
                    Primary brand color (HEX)
                  </Label>
                  <input
                    id={`brand-color-${itemId}`}
                    type="text"
                    value={config.brandPrimaryColor ?? ""}
                    onChange={(e) =>
                      patch({ brandPrimaryColor: e.target.value })
                    }
                    disabled={!editable}
                    placeholder="#1c1a19"
                    maxLength={9}
                    className="w-full rounded-md bg-card/80 px-2.5 py-1.5 font-mono text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
                  />
                </div>
              </div>
            </Collapsible>

            <div className="space-y-1">
              <Label className="text-[0.7rem]">Delivery format</Label>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {FP2D_DELIVERY_FORMAT_OPTIONS.map((o) => (
                  <label
                    key={o.key}
                    htmlFor={`fmt-${itemId}-${o.key}`}
                    className="flex cursor-pointer items-center gap-2 rounded-md bg-card/60 px-2.5 py-1.5 hover:bg-card/80"
                  >
                    <input
                      id={`fmt-${itemId}-${o.key}`}
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-accent"
                      checked={config.deliveryFormats[o.key]}
                      onChange={(e) =>
                        toggleDeliveryFormat(o.key, e.target.checked)
                      }
                      disabled={!editable}
                    />
                    <span className="text-[0.78rem] text-foreground">{o.label}</span>
                  </label>
                ))}
              </div>
              <p className="mt-0.5 text-[0.62rem] text-muted-foreground">
                At least one format must be selected.
              </p>
            </div>
          </div>
        </div>
      </Collapsible>

      {/* Upsell card */}
      <div className="space-y-3 rounded-xl border border-border/40 bg-card/80 p-4">
        <div>
          <h5 className="text-sm font-semibold text-foreground">
            Additional variants
          </h5>
          <p className="mt-1 text-[0.78rem] leading-relaxed text-muted-foreground">
            Order the same layout with another style or an identical floor plan with
            different room names.
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
                Additional style variant
              </span>
              <span className="block text-[0.7rem] text-muted-foreground">
                Same layout in another colour palette or style
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {config.variantEnabled && (
              <span className="text-[0.72rem] font-semibold text-accent tabular-nums">
                +{formatPrice(FP2D_VARIANT_EUR)}
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
            <Label htmlFor={`vstyle-${itemId}`} className="text-[0.7rem]">
              Style for the second variant
            </Label>
            <select
              id={`vstyle-${itemId}`}
              value={config.variantStyleId ?? ""}
              onChange={(e) =>
                patch({
                  variantStyleId: (e.target.value || undefined) as
                    | Fp2dDisplayStyleId
                    | undefined,
                })
              }
              disabled={!editable}
              className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
            >
              <option value="">Select...</option>
              {FP2D_DISPLAY_STYLES.map((s) => (
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
                Duplikat plans
              </span>
              <span className="block text-[0.7rem] text-muted-foreground">
                Identical plan with different room names
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {config.duplicateEnabled && (
              <span className="text-[0.72rem] font-semibold text-accent tabular-nums">
                +{formatPrice(FP2D_DUPLICATE_EUR)}
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
