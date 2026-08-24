/**
 * SiteplanConfigSection — Per-item configurator for the sp-first
 * product (3D site plan view). Single-level; angle-count stepper
 * drives sp-angle add-on; season/phase variant toggles drive sp-season
 * and sp-phase add-ons.
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
  CalendarClock,
  Check,
  Compass,
  FileUp,
  Layers,
  MapPin,
  Minus,
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
  addOnQuantitiesFor,
  SP_AMENITY_OPTIONS,
  SP_ANGLE_TYPES,
  SP_ENV_REPS,
  SP_LANDSCAPE_STYLES,
  SP_TRAFFIC_OPTIONS,
  type SiteplanConfig,
  type SpAmenities,
  type SpAngleTypeId,
  type SpEnvRepId,
  type SpLandscapeStyleId,
  type SpTraffic,
} from "@/lib/catalog/siteplan-config";
import {
  SEASONS,
  TIMES_OF_DAY,
  type SeasonId,
  type TimeOfDayId,
} from "@/lib/catalog/interior-config";
import {
  confirmItemFileUpload,
  deleteOrderFile,
  updateSiteplanConfig,
} from "@/server/actions/item-config";

const SP_SEASON_EUR = 85;
const SP_PHASE_EUR = 95;

type ItemFile = {
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

type FileKind = "source" | "architecture" | "drone-photo";

export function SiteplanConfigSection({
  itemId,
  orderId,
  initialConfig,
  files,
  editable,
}: {
  itemId: string;
  orderId: string;
  initialConfig: SiteplanConfig;
  files: ItemFile[];
  editable: boolean;
}) {
  const [config, setConfig] = useState<SiteplanConfig>(initialConfig);
  const [advanced, setAdvanced] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [, start] = useTransition();
  const [uploading, setUploading] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initRef = useRef(true);
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const archInputRef = useRef<HTMLInputElement>(null);
  const droneInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { formatPrice } = useOrderCurrency();

  const breakdown = useMemo<LineItemBreakdown>(() => {
    const calc = calculateQuote([
      {
        instanceId: itemId,
        productId: "sp-first",
        categoryId: "siteplans",
        addOnQuantities: addOnQuantitiesFor(config),
      },
    ]);
    return calc.items[0]!;
  }, [itemId, config]);
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
        await updateSiteplanConfig(itemId, config);
        setSavedAt(Date.now());
        router.refresh();
      });
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [config, itemId, editable, router]);

  const patch = (p: Partial<SiteplanConfig>) =>
    setConfig((prev) => ({ ...prev, ...p }));

  const incBuildings = () => {
    if (config.buildingCount >= 100) return;
    patch({ buildingCount: config.buildingCount + 1 });
  };
  const decBuildings = () => {
    if (config.buildingCount <= 1) return;
    patch({ buildingCount: config.buildingCount - 1 });
  };
  const incAngles = () => {
    if (config.angleCount >= 30) return;
    patch({ angleCount: config.angleCount + 1 });
  };
  const decAngles = () => {
    if (config.angleCount <= 1) return;
    patch({ angleCount: config.angleCount - 1 });
  };

  const sourceFiles = files.filter((f) => f.kind === "source");
  const archFiles = files.filter((f) => f.kind === "architecture");
  const droneFiles = files.filter((f) => f.kind === "drone-photo");

  const showDroneUpload = config.envRepresentation === "photomontage";

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

  // Generic boolean-group renderer for traffic/amenities checkboxes
  const renderCheckboxGroup = <K extends string>(
    options: readonly { key: K; label: string }[],
    state: Record<K, boolean>,
    onToggle: (key: K, checked: boolean) => void,
  ) => (
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
          <MapPin className="h-4 w-4 text-accent" />
          <div>
            <p className="text-xs font-semibold text-foreground">
              {config.projectName || "Plan de masse"}
            </p>
            <p className="text-[0.72rem] text-muted-foreground">
              {config.buildingCount} bâtiment{config.buildingCount === 1 ? "" : "s"} ·{" "}
              {config.angleCount} angle{config.angleCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && Date.now() - savedAt < 2500 && (
            <span className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-muted-foreground animate-in fade-in duration-200">
              <Check className="h-3 w-3" />
              Enregistré
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
          Nom du complexe / du site
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

      {/* Building count + Angle count */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[0.72rem] uppercase tracking-wider text-muted-foreground">
            <Building2 className="h-3 w-3 text-accent/60" />
            Nombre de bâtiments principaux
          </Label>
          <div className="inline-flex items-center rounded-md bg-secondary/40">
            <button
              type="button"
              disabled={!editable || config.buildingCount <= 1}
              onClick={decBuildings}
              aria-label="Diminuer le nombre de bâtiments"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums text-foreground">
              {config.buildingCount}
            </span>
            <button
              type="button"
              disabled={!editable || config.buildingCount >= 100}
              onClick={incBuildings}
              aria-label="Augmenter le nombre de bâtiments"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <span className="ml-2 text-[0.7rem] text-muted-foreground">
              combien de bâtiments/maisons
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-[0.72rem] uppercase tracking-wider text-muted-foreground">
            <Camera className="h-3 w-3 text-accent/60" />
            Nombre d’angles (vues)
          </Label>
          <div className="inline-flex items-center rounded-md bg-secondary/40">
            <button
              type="button"
              disabled={!editable || config.angleCount <= 1}
              onClick={decAngles}
              aria-label="Diminuer le nombre d’angles"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums text-foreground">
              {config.angleCount}
            </span>
            <button
              type="button"
              disabled={!editable || config.angleCount >= 30}
              onClick={incAngles}
              aria-label="Augmenter le nombre d’angles"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <span className="ml-2 text-[0.7rem] text-muted-foreground">
              1 inclus, +{formatPrice(65)} par angle supplémentaire
            </span>
          </div>
        </div>
      </div>

      {/* Angle type dropdown */}
      <div className="space-y-1">
        <Label
          htmlFor={`angle-type-${itemId}`}
          className="text-[0.72rem] uppercase tracking-wider text-muted-foreground"
        >
          Type de vue (angle)
        </Label>
        <select
          id={`angle-type-${itemId}`}
          value={config.angleType}
          onChange={(e) => patch({ angleType: e.target.value as SpAngleTypeId })}
          disabled={!editable}
          className="w-full rounded-md bg-secondary/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-60"
        >
          {SP_ANGLE_TYPES.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label htmlFor={`desc-${itemId}`} className="text-xs">
          <Pencil className="h-3 w-3 text-accent/60" />
          Description du projet
        </Label>
        <Textarea
          id={`desc-${itemId}`}
          value={config.description ?? ""}
          onChange={(e) => patch({ description: e.target.value })}
          disabled={!editable}
          placeholder="Décrivez l’usage des bâtiments, les axes principaux, les espaces verts…"
          rows={3}
          className="resize-none text-sm"
        />
      </div>

      {/* Master plan upload */}
      <div className="space-y-1.5">
        <Label className="text-xs">Plan de masse (master plan)</Label>
        {renderUploadZone(
          sourceInputRef,
          "PDF, DWG, CAD avec les limites de parcelle et la position des bâtiments",
          "image/*,application/pdf,.dwg,.dxf",
          "source",
        )}
        {renderFileList(sourceFiles)}
      </div>

      {/* Architecture upload */}
      <div className="space-y-1.5">
        <Label className="text-xs">Architecture des bâtiments</Label>
        {renderUploadZone(
          archInputRef,
          "Façades, plans ou modèles 3D des bâtiments de la parcelle",
          "image/*,application/pdf,.dwg,.dxf,.skp,.3ds,.fbx,.obj",
          "architecture",
        )}
        {renderFileList(archFiles)}
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
              <span className="text-accent">Import en cours…</span>
            </div>
          ))}
        </div>
      )}

      {/* Advanced toggle */}
      <p className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
        <Check className="h-3 w-3" />
        Cet élément est prêt à commander. Les réglages fins sont ci-dessous.
      </p>
      <label
        htmlFor={`adv-${itemId}`}
        className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-secondary/30 px-3 py-2"
      >
        <div className="flex items-center gap-2">
          <Settings2 className="h-3 w-3 text-accent" />
          <span className="text-[0.7rem] font-medium text-foreground">
            Paramètres avancés{" "}
            <span className="text-muted-foreground">(facultatif)</span>
          </span>
          <span className="hidden text-[0.72rem] text-muted-foreground sm:inline">
            · environnement, infrastructures, annotations
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
          {/* 2.1 Context & atmosphere */}
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Contexte et environnement
            </p>
            <div className="space-y-1">
              <Label htmlFor={`env-${itemId}`} className="text-[0.7rem]">
                Représentation des environs
              </Label>
              <select
                id={`env-${itemId}`}
                value={config.envRepresentation ?? ""}
                onChange={(e) =>
                  patch({
                    envRepresentation: (e.target.value || undefined) as
                      | SpEnvRepId
                      | undefined,
                  })
                }
                disabled={!editable}
                className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
              >
                <option value="">Sélectionner…</option>
                {SP_ENV_REPS.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor={`tod-${itemId}`} className="text-[0.7rem]">
                  Moment de la journée
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
                  <option value="">Sélectionner…</option>
                  {TIMES_OF_DAY.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor={`season-${itemId}`} className="text-[0.7rem]">
                  Saison
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
                  <option value="">Sélectionner…</option>
                  {SEASONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conditional drone-photo upload */}
            <Collapsible open={showDroneUpload}>
              <div className="space-y-1.5 rounded-md bg-card/60 p-2.5">
                <Label className="text-[0.7rem]">
                  Photos de drone (pour photomontage)
                </Label>
                {renderUploadZone(
                  droneInputRef,
                  "Photos de drone existantes du site",
                  "image/*",
                  "drone-photo",
                )}
                {renderFileList(droneFiles)}
              </div>
            </Collapsible>
          </div>

          {/* 2.2 Infrastructure & landscape */}
          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Infrastructures et paysage
            </p>

            <div className="space-y-1">
              <Label className="text-[0.7rem]">Circulation et stationnement</Label>
              {renderCheckboxGroup<keyof SpTraffic>(
                SP_TRAFFIC_OPTIONS,
                config.traffic,
                (key, checked) =>
                  patch({ traffic: { ...config.traffic, [key]: checked } }),
              )}
            </div>

            <div className="space-y-1">
              <Label
                htmlFor={`landscape-${itemId}`}
                className="text-[0.7rem]"
              >
                <Trees className="h-3 w-3 text-accent/60" />
                Style d’aménagement paysager
              </Label>
              <select
                id={`landscape-${itemId}`}
                value={config.landscapeStyle ?? ""}
                onChange={(e) =>
                  patch({
                    landscapeStyle: (e.target.value || undefined) as
                      | SpLandscapeStyleId
                      | undefined,
                  })
                }
                disabled={!editable}
                className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
              >
                <option value="">Sélectionner…</option>
                {SP_LANDSCAPE_STYLES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[0.7rem]">Équipements communs</Label>
              {renderCheckboxGroup<keyof SpAmenities>(
                SP_AMENITY_OPTIONS,
                config.amenities,
                (key, checked) =>
                  patch({
                    amenities: { ...config.amenities, [key]: checked },
                  }),
              )}
            </div>
          </div>

          {/* 2.3 Labels & graphics */}
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Annotations et graphismes
            </p>
            <div className="space-y-1.5">
              <label
                htmlFor={`labels-${itemId}`}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-card/60 px-3 py-2"
              >
                <span className="text-[0.78rem] text-foreground">
                  Libellés texte pour les bâtiments et les rues
                </span>
                <Switch
                  id={`labels-${itemId}`}
                  checked={config.showLabels}
                  onCheckedChange={(v) => patch({ showLabels: v })}
                  disabled={!editable}
                />
              </label>
              <label
                htmlFor={`boundary-${itemId}`}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-card/60 px-3 py-2"
              >
                <span className="text-[0.78rem] text-foreground">
                  Mettre en évidence les limites de parcelle
                </span>
                <Switch
                  id={`boundary-${itemId}`}
                  checked={config.highlightBoundary}
                  onCheckedChange={(v) => patch({ highlightBoundary: v })}
                  disabled={!editable}
                />
              </label>
              <label
                htmlFor={`compass-${itemId}`}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-card/60 px-3 py-2"
              >
                <span className="flex items-center gap-2 text-[0.78rem] text-foreground">
                  <Compass className="h-3.5 w-3.5 text-accent" />
                  Repère du nord (boussole)
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

          <PricingBreakdown breakdown={breakdown} />
        </div>
      </Collapsible>

      {/* Upsell card */}
      <div className="space-y-3 rounded-xl border border-border/40 bg-card/80 p-4">
        <div>
          <h5 className="text-sm font-semibold text-foreground">
            Options supplémentaires
          </h5>
          <p className="mt-1 text-[0.78rem] leading-relaxed text-muted-foreground">
            Variantes saisonnières et de phasage de la même vue pour les
            présentations d’urbanisme.
          </p>
        </div>

        {/* Season variant */}
        <label
          htmlFor={`svar-${itemId}`}
          className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-secondary/30 px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <CalendarClock className="h-3.5 w-3.5 text-accent" />
            <div>
              <span className="flex items-center gap-1.5 text-[0.78rem] font-medium text-foreground">
                Variante saisonnière
                <HelpTip>
                  Le même rendu généré à nouveau avec d’autres conditions météo
                  (par exemple jour d’hiver + nuit d’été). Utile pour le
                  marketing - une présentation couvre plusieurs saisons.
                </HelpTip>
              </span>
              <span className="block text-[0.7rem] text-muted-foreground">
                La même vue à un autre moment de la journée ou dans une autre saison
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {config.seasonVariantEnabled && (
              <span className="text-[0.72rem] font-semibold text-accent tabular-nums">
                +{formatPrice(SP_SEASON_EUR)}
              </span>
            )}
            <Switch
              id={`svar-${itemId}`}
              checked={config.seasonVariantEnabled}
              onCheckedChange={(v) =>
                patch({
                  seasonVariantEnabled: v,
                  ...(v
                    ? {}
                    : {
                        seasonVariantTimeOfDay: undefined,
                        seasonVariantSeason: undefined,
                      }),
                })
              }
              disabled={!editable}
            />
          </div>
        </label>

        <Collapsible open={config.seasonVariantEnabled}>
          <div className="grid gap-3 rounded-md border border-border/30 bg-background/40 p-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label
                htmlFor={`svar-tod-${itemId}`}
                className="text-[0.7rem]"
              >
                Moment de la journée pour la variante
              </Label>
              <select
                id={`svar-tod-${itemId}`}
                value={config.seasonVariantTimeOfDay ?? ""}
                onChange={(e) =>
                  patch({
                    seasonVariantTimeOfDay: (e.target.value || undefined) as
                      | TimeOfDayId
                      | undefined,
                  })
                }
                disabled={!editable}
                className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
              >
                <option value="">— sans changement —</option>
                {TIMES_OF_DAY.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label
                htmlFor={`svar-season-${itemId}`}
                className="text-[0.7rem]"
              >
                Saison pour la variante
              </Label>
              <select
                id={`svar-season-${itemId}`}
                value={config.seasonVariantSeason ?? ""}
                onChange={(e) =>
                  patch({
                    seasonVariantSeason: (e.target.value || undefined) as
                      | SeasonId
                      | undefined,
                  })
                }
                disabled={!editable}
                className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
              >
                <option value="">— sans changement —</option>
                {SEASONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Collapsible>

        {/* Phase variant */}
        <label
          htmlFor={`pvar-${itemId}`}
          className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-secondary/30 px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-accent" />
            <div>
              <span className="flex items-center gap-1.5 text-[0.78rem] font-medium text-foreground">
                Variante par phases (phasing)
                <HelpTip>
                  Le <strong>phasing</strong> montre la construction par étapes —
                  les structures déjà bâties sont pleines, la phase prévue
                  apparaît en blocs transparents ou esquissés. Un standard des
                  présentations d’urbanisme pour les grands ensembles.
                </HelpTip>
              </span>
              <span className="block text-[0.7rem] text-muted-foreground">
                Phase 1 construite, phase 2 en blocs transparents
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {config.phaseVariantEnabled && (
              <span className="text-[0.72rem] font-semibold text-accent tabular-nums">
                +{formatPrice(SP_PHASE_EUR)}
              </span>
            )}
            <Switch
              id={`pvar-${itemId}`}
              checked={config.phaseVariantEnabled}
              onCheckedChange={(v) =>
                patch({
                  phaseVariantEnabled: v,
                  ...(v ? {} : { phaseDescription: undefined }),
                })
              }
              disabled={!editable}
            />
          </div>
        </label>

        <Collapsible open={config.phaseVariantEnabled}>
          <div className="space-y-1 rounded-md border border-border/30 bg-background/40 p-3">
            <Label htmlFor={`pdesc-${itemId}`} className="text-[0.7rem]">
              Description des phases
            </Label>
            <Textarea
              id={`pdesc-${itemId}`}
              value={config.phaseDescription ?? ""}
              onChange={(e) => patch({ phaseDescription: e.target.value })}
              disabled={!editable}
              placeholder="Décrivez ce qui appartient à chaque phase…"
              rows={3}
              className="resize-none text-sm"
            />
          </div>
        </Collapsible>
      </div>
    </div>
  );
}
