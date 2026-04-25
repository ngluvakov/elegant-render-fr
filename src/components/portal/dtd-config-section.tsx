/**
 * DtdConfigSection — Per-item configurator for the dtd-image product
 * (Dan u noć / Day-to-Dusk). Photo-count stepper drives dtd-volume
 * (€8 per extra photo). Shadow-removal toggle drives dtd-shadow (€5
 * one-time). Rush-delivery toggle drives dtd-rush (+50% percent).
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
  CloudMoon,
  FileUp,
  Lightbulb,
  Minus,
  Pencil,
  Plus,
  Settings2,
  Sparkles,
  Sun,
  Upload,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateQuote, formatEur } from "@/lib/catalog/calculate";
import { Collapsible } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  addOnQuantitiesFor,
  DTD_COLOR_GRADES,
  DTD_EXTERIOR_LIGHTING_OPTIONS,
  DTD_INTERIOR_LIGHTS,
  DTD_SKY_MOODS,
  type DtdColorGradeId,
  type DtdConfig,
  type DtdExteriorLighting,
  type DtdInteriorLightId,
  type DtdSkyMoodId,
} from "@/lib/catalog/dtd-config";
import {
  confirmItemFileUpload,
  deleteOrderFile,
  updateDtdConfig,
} from "@/server/actions/item-config";

const DTD_PHOTO_EUR = 8;       // dtd-volume per extra photo
const DTD_SHADOW_EUR = 5;      // dtd-shadow one-time
const DTD_RUSH_PERCENT = 50;   // dtd-rush +50% on item total

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

type FileKind = "source" | "reference";

export function DtdConfigSection({
  itemId,
  orderId,
  initialConfig,
  files,
  editable,
}: {
  itemId: string;
  orderId: string;
  initialConfig: DtdConfig;
  files: ItemFile[];
  editable: boolean;
}) {
  const [config, setConfig] = useState<DtdConfig>(initialConfig);
  const [advanced, setAdvanced] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [, start] = useTransition();
  const [uploading, setUploading] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initRef = useRef(true);
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const totalEur = useMemo(() => {
    const calc = calculateQuote([
      {
        instanceId: itemId,
        productId: "dtd-image",
        categoryId: "day-to-dusk",
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
        await updateDtdConfig(itemId, config);
        setSavedAt(Date.now());
        router.refresh();
      });
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [config, itemId, editable, router]);

  const patch = (p: Partial<DtdConfig>) =>
    setConfig((prev) => ({ ...prev, ...p }));

  const incPhotos = () => {
    if (config.photoCount >= 200) return;
    patch({ photoCount: config.photoCount + 1 });
  };
  const decPhotos = () => {
    if (config.photoCount <= 1) return;
    patch({ photoCount: config.photoCount - 1 });
  };

  const sourceFiles = files.filter((f) => f.kind === "source");
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
          <CloudMoon className="h-4 w-4 text-accent" />
          <div>
            <p className="text-xs font-semibold text-foreground">
              {config.projectName || "Nekretnina"}
            </p>
            <p className="text-[0.72rem] text-muted-foreground">
              {config.photoCount} fotografij
              {config.photoCount === 1 ? "a" : "e"} ·{" "}
              {DTD_SKY_MOODS.find((m) => m.id === config.skyMood)?.label ??
                config.skyMood}
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
          Naziv projekta / nekretnine
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

      {/* Photo count + sky mood */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[0.72rem] uppercase tracking-wider text-muted-foreground">
            <Camera className="h-3 w-3 text-accent/60" />
            Broj fotografija
          </Label>
          <div className="inline-flex items-center rounded-md bg-secondary/40">
            <button
              type="button"
              disabled={!editable || config.photoCount <= 1}
              onClick={decPhotos}
              aria-label="Smanji broj fotografija"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums text-foreground">
              {config.photoCount}
            </span>
            <button
              type="button"
              disabled={!editable || config.photoCount >= 200}
              onClick={incPhotos}
              aria-label="Povećaj broj fotografija"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <span className="ml-2 text-[0.7rem] text-muted-foreground">
              1 uključena, +€{DTD_PHOTO_EUR} svaka sledeća
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <Label
            htmlFor={`sky-${itemId}`}
            className="text-[0.72rem] uppercase tracking-wider text-muted-foreground"
          >
            <CloudMoon className="h-3 w-3 text-accent/60" />
            Željena atmosfera (nebo)
          </Label>
          <select
            id={`sky-${itemId}`}
            value={config.skyMood}
            onChange={(e) =>
              patch({ skyMood: e.target.value as DtdSkyMoodId })
            }
            disabled={!editable}
            className="w-full rounded-md bg-secondary/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-60"
          >
            {DTD_SKY_MOODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

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
          placeholder="Posebni zahtevi za osvetljenje (npr. obavezno upaliti svetla na bazenu)…"
          rows={3}
          className="resize-none text-sm"
        />
      </div>

      {/* Source photos */}
      <div className="space-y-1.5">
        <Label className="text-xs">Dnevne fotografije</Label>
        {renderUploadZone(
          sourceInputRef,
          "Prevucite više slika odjednom",
          "image/*",
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
            · osvetljenje, senke, detalji
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
          {/* 2.1 Lighting */}
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Kontrola osvetljenja
            </p>
            <div className="space-y-1">
              <Label
                htmlFor={`int-light-${itemId}`}
                className="text-[0.7rem]"
              >
                <Lightbulb className="h-3 w-3 text-accent/60" />
                Unutrašnje osvetljenje
              </Label>
              <select
                id={`int-light-${itemId}`}
                value={config.interiorLight ?? ""}
                onChange={(e) =>
                  patch({
                    interiorLight: (e.target.value || undefined) as
                      | DtdInteriorLightId
                      | undefined,
                  })
                }
                disabled={!editable}
                className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
              >
                <option value="">— izaberite —</option>
                {DTD_INTERIOR_LIGHTS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[0.7rem]">Spoljašnje osvetljenje</Label>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {DTD_EXTERIOR_LIGHTING_OPTIONS.map((o) => (
                  <label
                    key={o.key}
                    htmlFor={`${itemId}-ext-${o.key}`}
                    className="flex cursor-pointer items-center gap-2 rounded-md bg-card/60 px-2.5 py-1.5 hover:bg-card/80"
                  >
                    <input
                      id={`${itemId}-ext-${o.key}`}
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-accent"
                      checked={
                        config.exteriorLighting[
                          o.key as keyof DtdExteriorLighting
                        ]
                      }
                      onChange={(e) =>
                        patch({
                          exteriorLighting: {
                            ...config.exteriorLighting,
                            [o.key]: e.target.checked,
                          },
                        })
                      }
                      disabled={!editable}
                    />
                    <span className="text-[0.78rem] text-foreground">
                      {o.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 2.2 Photo corrections */}
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Korekcije fotografije
            </p>

            <label
              htmlFor={`shadow-${itemId}`}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-card/60 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <Sun className="h-3.5 w-3.5 text-accent" />
                <div>
                  <span className="block text-[0.78rem] font-medium text-foreground">
                    Uklanjanje oštrih dnevnih senki
                  </span>
                  <span className="block text-[0.7rem] text-muted-foreground">
                    Složena korekcija jakih senki sa fasade
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {config.shadowRemoval && (
                  <span className="text-[0.72rem] font-semibold text-accent tabular-nums">
                    +€{DTD_SHADOW_EUR}
                  </span>
                )}
                <Switch
                  id={`shadow-${itemId}`}
                  checked={config.shadowRemoval}
                  onCheckedChange={(v) => patch({ shadowRemoval: v })}
                  disabled={!editable}
                />
              </div>
            </label>

            <div className="space-y-1">
              <Label
                htmlFor={`grade-${itemId}`}
                className="text-[0.7rem]"
              >
                <Wand2 className="h-3 w-3 text-accent/60" />
                Korekcija boja (color grading)
              </Label>
              <select
                id={`grade-${itemId}`}
                value={config.colorGrade ?? ""}
                onChange={(e) =>
                  patch({
                    colorGrade: (e.target.value || undefined) as
                      | DtdColorGradeId
                      | undefined,
                  })
                }
                disabled={!editable}
                className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
              >
                <option value="">— izaberite —</option>
                {DTD_COLOR_GRADES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2.3 References */}
          <div className="space-y-1.5">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Reference
            </p>
            <Label className="text-[0.7rem]">
              Reference za nebo / atmosferu
            </Label>
            {renderUploadZone(
              refInputRef,
              "Slike željenog neba ili atmosfere",
              "image/*",
              "reference",
            )}
            {renderFileList(referenceFiles)}
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
            Hitna isporuka sa prioritetnom obradom.
          </p>
        </div>

        <label
          htmlFor={`rush-${itemId}`}
          className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-secondary/30 px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-accent" />
            <div>
              <span className="block text-[0.78rem] font-medium text-foreground">
                Hitna isporuka (24h)
              </span>
              <span className="block text-[0.7rem] text-muted-foreground">
                Prioritetna obrada i isporuka u roku od 24 sata
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {config.rushDelivery && (
              <span className="text-[0.72rem] font-semibold text-accent tabular-nums">
                +{DTD_RUSH_PERCENT}%
              </span>
            )}
            <Switch
              id={`rush-${itemId}`}
              checked={config.rushDelivery}
              onCheckedChange={(v) => patch({ rushDelivery: v })}
              disabled={!editable}
            />
          </div>
        </label>
      </div>
    </div>
  );
}
