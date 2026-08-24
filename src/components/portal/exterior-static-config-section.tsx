/**
 * ExtStaticConfigSection — Per-item configurator for the ext-static
 * product (static exterior). Camera stepper drives ext-static-cam.
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
  FileUp,
  Image as ImageIcon,
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
import { HelpTip } from "@/components/ui/help-tip";
import {
  ARCH_STYLES,
  ENVIRONMENTS,
  RENDERING_MODES,
  WEATHER,
  extStaticAddOnQuantitiesFor,
  type ArchStyleId,
  type EnvironmentId,
  type ExtStaticConfig,
  type RenderingModeId,
  type WeatherId,
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
  updateExtStaticConfig,
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
    ? `${(b / 1024).toFixed(0)} Ko`
    : `${(b / (1024 * 1024)).toFixed(1)} Mo`;
}

type FileKind = "source" | "reference" | "location-photo";

export function ExtStaticConfigSection({
  itemId,
  orderId,
  initialConfig,
  files,
  editable,
}: {
  itemId: string;
  orderId: string;
  initialConfig: ExtStaticConfig;
  files: ItemFile[];
  editable: boolean;
}) {
  const [config, setConfig] = useState<ExtStaticConfig>(initialConfig);
  const [advanced, setAdvanced] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [, start] = useTransition();
  const [uploading, setUploading] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initRef = useRef(true);
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);
  const locationPhotoInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { formatPrice } = useOrderCurrency();

  const totalEur = useMemo(() => {
    const calc = calculateQuote([
      {
        instanceId: itemId,
        productId: "ext-static",
        categoryId: "exterior",
        addOnQuantities: extStaticAddOnQuantitiesFor(config),
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
        await updateExtStaticConfig(itemId, config);
        setSavedAt(Date.now());
        router.refresh();
      });
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [config, itemId, editable, router]);

  const patch = (p: Partial<ExtStaticConfig>) =>
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
    (f) =>
      f.kind !== "reference" &&
      f.kind !== "logo" &&
      f.kind !== "location-photo",
  );
  const referenceFiles = files.filter((f) => f.kind === "reference");
  const locationPhotoFiles = files.filter((f) => f.kind === "location-photo");

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/30 bg-card/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-accent" />
          <div>
            <p className="text-xs font-semibold text-foreground">
              {config.modelName || "Bâtiment"}
            </p>
            <p className="text-[0.72rem] text-muted-foreground">
              {config.cameraCount} vue{config.cameraCount === 1 ? "" : "s"}
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

      <div className="space-y-1">
        <Label htmlFor={`name-${itemId}`} className="text-[0.72rem] uppercase tracking-wider text-muted-foreground">
          <Pencil className="h-3 w-3 text-accent/60" />
          Nom du bâtiment / modèle
        </Label>
        <input
          id={`name-${itemId}`}
          type="text"
          value={config.modelName}
          onChange={(e) => patch({ modelName: e.target.value })}
          disabled={!editable}
          maxLength={80}
          className="w-full rounded-md bg-secondary/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[0.72rem] uppercase tracking-wider text-muted-foreground">
            <Camera className="h-3 w-3 text-accent/60" />
            Nombre de caméras statiques
          </Label>
          <div className="inline-flex items-center rounded-md bg-secondary/40">
            <button
              type="button"
              disabled={!editable || config.cameraCount <= 1}
              onClick={dec}
              aria-label="Diminuer le nombre de caméras"
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
              aria-label="Augmenter le nombre de caméras"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <span className="ml-2 text-[0.7rem] text-muted-foreground">
              1 incluse, +{formatPrice(48)} par caméra supplémentaire
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor={`style-${itemId}`} className="text-[0.72rem] uppercase tracking-wider text-muted-foreground">
            Style architectural
          </Label>
          <select
            id={`style-${itemId}`}
            value={config.styleId ?? ""}
            onChange={(e) =>
              patch({
                styleId: (e.target.value || undefined) as ArchStyleId | undefined,
              })
            }
            disabled={!editable}
            className="w-full rounded-md bg-secondary/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-60"
          >
            <option value="">Sélectionner…</option>
            {ARCH_STYLES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Rendering mode (standard vs photomontage) */}
      <div className="space-y-1">
        <Label
          htmlFor={`mode-${itemId}`}
          className="text-[0.72rem] uppercase tracking-wider text-muted-foreground"
        >
          <ImageIcon className="h-3 w-3 text-accent/60" />
          Type de rendu
          <HelpTip>
            <strong>Photomontage</strong> — le modèle 3D du bâtiment est
            intégré dans une photo réelle du site. Le résultat gagne en
            authenticité (bâti existant, voisinage, arbres), mais vous devez
            nous envoyer une photo de bonne qualité sous l’angle souhaité.
          </HelpTip>
        </Label>
        <select
          id={`mode-${itemId}`}
          value={config.renderingMode}
          onChange={(e) =>
            patch({ renderingMode: e.target.value as RenderingModeId })
          }
          disabled={!editable}
          className="w-full rounded-md bg-secondary/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-60"
        >
          {RENDERING_MODES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        {config.renderingMode === "photomontage" && (
          <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
            + Photomontage : {formatPrice(50)} (analyse de la perspective,
            calage de la caméra et de la lumière, compositing)
          </p>
        )}
      </div>

      {/* Conditional location-photo upload (only for photomontage mode) */}
      <Collapsible open={config.renderingMode === "photomontage"}>
        <div className="space-y-1.5 rounded-md border border-border/30 bg-secondary/20 p-3">
          <Label className="text-xs">Photo du site</Label>
          {renderUploadZone(
            locationPhotoInputRef,
            "Photo du site pour l’intégration du modèle 3D",
            "image/*",
            "location-photo",
          )}
          {renderFileList(locationPhotoFiles)}
        </div>
      </Collapsible>

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
          placeholder="Description de la façade, des matériaux et des abords…"
          rows={3}
          className="resize-none text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Plans, coupes et façades</Label>
        {renderUploadZone(
          sourceInputRef,
          "PDF, DWG, CAD, images",
          "image/*,application/pdf,.dwg,.dxf",
          "source",
        )}
        {renderFileList(sourceFiles)}
      </div>

      {uploading.length > 0 && (
        <div className="space-y-1">
          {uploading.map((name) => (
            <div key={name} className="flex items-center gap-2 rounded bg-accent/5 px-2.5 py-1.5 text-[0.7rem]">
              <FileUp className="h-3 w-3 text-accent" />
              <span className="flex-1 truncate text-foreground">{name}</span>
              <span className="text-accent">Import en cours…</span>
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
          <span className="text-[0.7rem] font-medium text-foreground">Paramètres avancés</span>
          <span className="hidden text-[0.72rem] text-muted-foreground sm:inline">
            · moment de la journée, saison, environnement
          </span>
        </div>
        <Switch id={`adv-${itemId}`} checked={advanced} onCheckedChange={setAdvanced} disabled={!editable} />
      </label>

      <Collapsible open={advanced}>
        <div className="space-y-3 rounded-md border border-border/30 bg-secondary/20 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor={`tod-${itemId}`} className="text-[0.7rem]">Moment de la journée</Label>
              <select
                id={`tod-${itemId}`}
                value={config.timeOfDay ?? ""}
                onChange={(e) => patch({ timeOfDay: (e.target.value || undefined) as TimeOfDayId | undefined })}
                disabled={!editable}
                className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
              >
                <option value="">Sélectionner…</option>
                {TIMES_OF_DAY.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`season-${itemId}`} className="text-[0.7rem]">Saison</Label>
              <select
                id={`season-${itemId}`}
                value={config.season ?? ""}
                onChange={(e) => patch({ season: (e.target.value || undefined) as SeasonId | undefined })}
                disabled={!editable}
                className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
              >
                <option value="">Sélectionner…</option>
                {SEASONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`weather-${itemId}`} className="text-[0.7rem]">Ambiance / météo</Label>
              <select
                id={`weather-${itemId}`}
                value={config.weather ?? ""}
                onChange={(e) => patch({ weather: (e.target.value || undefined) as WeatherId | undefined })}
                disabled={!editable}
                className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
              >
                <option value="">Sélectionner…</option>
                {WEATHER.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`env-${itemId}`} className="text-[0.7rem]">Type d’environnement</Label>
              <select
                id={`env-${itemId}`}
                value={config.environment ?? ""}
                onChange={(e) => patch({ environment: (e.target.value || undefined) as EnvironmentId | undefined })}
                disabled={!editable}
                className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
              >
                <option value="">Sélectionner…</option>
                {ENVIRONMENTS.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[0.7rem]">Références de matériaux</Label>
            {renderUploadZone(
              refInputRef,
              "Images d’inspiration pour façade, toiture et allées",
              "image/*",
              "reference",
            )}
            {renderFileList(referenceFiles)}
          </div>
        </div>
      </Collapsible>
    </div>
  );
}
