/**
 * AnimationConfigSection — Per-item configurator for the consolidated
 * `anim` product. Source mode (scratch / existing / active) lives on
 * config.sourceMode and drives:
 *   - the type badge label
 *   - per-second base price (€15 / €10 / €8)
 *   - which add-on suffix gets driven for paths/daynight
 *   - visibility of upsell options (daynight not on active; season
 *     only on scratch)
 *
 * Mode picker is rendered as a 3-segment selector near the top of the
 * section so the customer can switch source mode without re-adding the
 * item. Switching the mode auto-clears unsupported add-on flags via
 * sanitizeAnimationConfig.
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
  Clapperboard,
  Clock,
  CloudMoon,
  FileUp,
  Film,
  Gauge,
  Leaf,
  Minus,
  Music,
  Pencil,
  Plus,
  Settings2,
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
  ANIM_CAMERA_SPEEDS,
  ANIM_DURATION_MAX,
  ANIM_DURATION_MIN,
  ANIM_DURATION_STEP,
  ANIM_FOCUS_AREA_OPTIONS,
  ANIM_MUSIC_MOODS,
  ANIM_PRODUCT_ID,
  ANIM_SCENE_ELEMENT_OPTIONS,
  ANIM_SEASONS,
  ANIM_SOURCE_MODES,
  ANIM_TIMES_OF_DAY,
  ANIM_TYPES,
  addOnQuantitiesFor,
  animPerSecondEur,
  animSourceModeLabel,
  animSupportsDayNight,
  animSupportsSeason,
  animTierDiscountPct,
  type AnimationConfig,
  type AnimSourceMode,
  type AnimCameraSpeedId,
  type AnimFocusAreas,
  type AnimMusicMoodId,
  type AnimSceneElements,
  type AnimSeasonId,
  type AnimTimeOfDayId,
  type AnimTypeId,
} from "@/lib/catalog/animation-config";
import {
  confirmItemFileUpload,
  deleteOrderFile,
  updateAnimationConfig,
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

type FileKind = "source";

export function AnimationConfigSection({
  itemId,
  orderId,
  initialConfig,
  files,
  editable,
}: {
  itemId: string;
  orderId: string;
  initialConfig: AnimationConfig;
  files: ItemFile[];
  editable: boolean;
}) {
  const [config, setConfig] = useState<AnimationConfig>(initialConfig);
  const [advanced, setAdvanced] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [, start] = useTransition();
  const [uploading, setUploading] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initRef = useRef(true);
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const showDayNight = animSupportsDayNight(config.sourceMode);
  const showSeason = animSupportsSeason(config.sourceMode);
  const perSecondEur = animPerSecondEur(config.sourceMode);
  const tierDiscountPct = animTierDiscountPct(config.durationSeconds);

  const totalEur = useMemo(() => {
    const calc = calculateQuote([
      {
        instanceId: itemId,
        productId: ANIM_PRODUCT_ID,
        categoryId: "animation",
        addOnQuantities: addOnQuantitiesFor(config),
        durationSeconds: config.durationSeconds,
        sourceMode: config.sourceMode,
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
        await updateAnimationConfig(itemId, config);
        setSavedAt(Date.now());
        router.refresh();
      });
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [config, itemId, editable, router]);

  const patch = (p: Partial<AnimationConfig>) =>
    setConfig((prev) => ({ ...prev, ...p }));

  const incDuration = () => {
    if (config.durationSeconds >= ANIM_DURATION_MAX) return;
    patch({
      durationSeconds: Math.min(
        ANIM_DURATION_MAX,
        config.durationSeconds + ANIM_DURATION_STEP,
      ),
    });
  };
  const decDuration = () => {
    if (config.durationSeconds <= ANIM_DURATION_MIN) return;
    patch({
      durationSeconds: Math.max(
        ANIM_DURATION_MIN,
        config.durationSeconds - ANIM_DURATION_STEP,
      ),
    });
  };

  const incPaths = () => {
    if (config.extraPathsCount >= 10) return;
    patch({ extraPathsCount: config.extraPathsCount + 1 });
  };
  const decPaths = () => {
    if (config.extraPathsCount <= 0) return;
    patch({ extraPathsCount: config.extraPathsCount - 1 });
  };

  const sourceFiles = files.filter((f) => f.kind === "source");

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

  return (
    <div className="space-y-4">
      {/* Summary bar with type badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/30 bg-card/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-accent" />
          <div>
            <p className="text-xs font-semibold text-foreground">
              {config.animationName || "Animacija"}
            </p>
            <p className="text-[0.72rem] text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded bg-accent/15 px-1.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider text-accent">
                {animSourceModeLabel(config.sourceMode)}
              </span>
              <span className="ml-2">
                {config.durationSeconds}s
                {tierDiscountPct > 0 && (
                  <span className="ml-1 text-[color:var(--color-sage-deep)]">
                    (−{tierDiscountPct}%)
                  </span>
                )}
              </span>
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

      {/* Source mode picker — switches per-second pricing and which
          add-ons are available. Switching mode auto-clears unsupported
          flags via sanitizeAnimationConfig on save. */}
      <div className="space-y-2 rounded-xl border border-border/40 bg-card/60 p-3">
        <Label className="text-[0.72rem] uppercase tracking-wider text-muted-foreground">
          Šta već postoji?
        </Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {ANIM_SOURCE_MODES.map((m) => {
            const isActive = config.sourceMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => patch({ sourceMode: m.id })}
                disabled={!editable}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-lg border px-3 py-2 text-left transition-colors",
                  isActive
                    ? "border-accent bg-accent/10"
                    : "border-border/40 bg-background/40 hover:border-accent/40",
                  !editable && "opacity-60",
                )}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="text-[0.78rem] font-semibold text-foreground">
                    {m.shortLabel}
                  </span>
                  <span className="text-[0.7rem] font-bold text-accent tabular-nums">
                    €{m.perSecondEur}/s
                  </span>
                </span>
                <span className="text-[0.7rem] leading-snug text-muted-foreground">
                  {m.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Animation name */}
      <div className="space-y-1">
        <Label
          htmlFor={`name-${itemId}`}
          className="text-[0.72rem] uppercase tracking-wider text-muted-foreground"
        >
          <Pencil className="h-3 w-3 text-accent/60" />
          Naziv animacije
        </Label>
        <input
          id={`name-${itemId}`}
          type="text"
          value={config.animationName}
          onChange={(e) => patch({ animationName: e.target.value })}
          disabled={!editable}
          maxLength={100}
          className="w-full rounded-md bg-secondary/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50"
        />
      </div>

      {/* Animation type + duration */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label
            htmlFor={`atype-${itemId}`}
            className="text-[0.72rem] uppercase tracking-wider text-muted-foreground"
          >
            <Clapperboard className="h-3 w-3 text-accent/60" />
            Tip animacije
          </Label>
          <select
            id={`atype-${itemId}`}
            value={config.animationType}
            onChange={(e) =>
              patch({ animationType: e.target.value as AnimTypeId })
            }
            disabled={!editable}
            className="w-full rounded-md bg-secondary/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-60"
          >
            {ANIM_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label className="text-[0.72rem] uppercase tracking-wider text-muted-foreground">
            <Clock className="h-3 w-3 text-accent/60" />
            Dužina animacije
          </Label>
          <div className="inline-flex items-center rounded-md bg-secondary/40">
            <button
              type="button"
              disabled={!editable || config.durationSeconds <= ANIM_DURATION_MIN}
              onClick={decDuration}
              aria-label={`Smanji za ${ANIM_DURATION_STEP}s`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[3rem] text-center text-sm font-semibold tabular-nums text-foreground">
              {config.durationSeconds}s
            </span>
            <button
              type="button"
              disabled={!editable || config.durationSeconds >= ANIM_DURATION_MAX}
              onClick={incDuration}
              aria-label={`Povećaj za ${ANIM_DURATION_STEP}s`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <span className="ml-2 text-[0.7rem] text-muted-foreground">
              €{perSecondEur}/sek
              {tierDiscountPct > 0 && (
                <span className="ml-1 font-semibold text-[color:var(--color-sage-deep)]">
                  · −{tierDiscountPct}% tier
                </span>
              )}
            </span>
          </div>
          <p className="mt-0.5 text-[0.62rem] text-muted-foreground">
            Tier popusti: 31–60s = −10% · 61–120s = −20% · 121s+ = −25%
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label htmlFor={`desc-${itemId}`} className="text-xs">
          <Pencil className="h-3 w-3 text-accent/60" />
          Opis putanje kamere
        </Label>
        <Textarea
          id={`desc-${itemId}`}
          value={config.description ?? ""}
          onChange={(e) => patch({ description: e.target.value })}
          disabled={!editable}
          placeholder="Počinje ispred kuće, ulazi kroz ulazna vrata, prolazi kroz dnevnu sobu do terase…"
          rows={3}
          className="resize-none text-sm"
        />
      </div>

      {/* Source upload */}
      <div className="space-y-1.5">
        <Label className="text-xs">Osnove i reference</Label>
        <div
          onClick={() => editable && sourceInputRef.current?.click()}
          className={cn(
            "flex items-center justify-center rounded-md border-2 border-dashed border-border/40 px-3 py-3 transition-colors",
            editable ? "cursor-pointer hover:border-accent/40" : "opacity-60",
          )}
        >
          <Upload className="mr-2 h-3.5 w-3.5 text-muted-foreground/50" />
          <span className="text-[0.7rem] text-muted-foreground">
            Osnove, skice putanje, referentni video klipovi
          </span>
          <input
            ref={sourceInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,video/*,.dwg,.dxf,.skp,.mp4,.mov"
            disabled={!editable}
            onChange={(e) => {
              if (e.target.files) {
                Array.from(e.target.files).forEach((f) =>
                  uploadFile(f, "source"),
                );
                e.target.value = "";
              }
            }}
            className="hidden"
          />
        </div>
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
            · atmosfera, stil, dodatne putanje
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
          {/* 2.1 Atmosphere */}
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Atmosfera i okruženje
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor={`tod-${itemId}`} className="text-[0.7rem]">
                  Doba dana
                </Label>
                <select
                  id={`tod-${itemId}`}
                  value={config.timeOfDay ?? ""}
                  onChange={(e) =>
                    patch({
                      timeOfDay: (e.target.value || undefined) as
                        | AnimTimeOfDayId
                        | undefined,
                    })
                  }
                  disabled={!editable}
                  className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
                >
                  <option value="">— izaberite —</option>
                  {ANIM_TIMES_OF_DAY.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor={`season-${itemId}`}
                  className="text-[0.7rem]"
                >
                  Godišnje doba
                </Label>
                <select
                  id={`season-${itemId}`}
                  value={config.season ?? ""}
                  onChange={(e) =>
                    patch({
                      season: (e.target.value || undefined) as
                        | AnimSeasonId
                        | undefined,
                    })
                  }
                  disabled={!editable}
                  className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
                >
                  <option value="">— izaberite —</option>
                  {ANIM_SEASONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor={`speed-${itemId}`} className="text-[0.7rem]">
                  <Gauge className="h-3 w-3 text-accent/60" />
                  Brzina kamere
                </Label>
                <select
                  id={`speed-${itemId}`}
                  value={config.cameraSpeed ?? ""}
                  onChange={(e) =>
                    patch({
                      cameraSpeed: (e.target.value || undefined) as
                        | AnimCameraSpeedId
                        | undefined,
                    })
                  }
                  disabled={!editable}
                  className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
                >
                  <option value="">— izaberite —</option>
                  {ANIM_CAMERA_SPEEDS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2.2 Direction & detail */}
          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Režija i detalji
            </p>

            <div className="space-y-1">
              <Label className="text-[0.7rem]">Fokus animacije</Label>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {ANIM_FOCUS_AREA_OPTIONS.map((o) => (
                  <label
                    key={o.key}
                    htmlFor={`${itemId}-fa-${o.key}`}
                    className="flex cursor-pointer items-center gap-2 rounded-md bg-card/60 px-2.5 py-1.5 hover:bg-card/80"
                  >
                    <input
                      id={`${itemId}-fa-${o.key}`}
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-accent"
                      checked={
                        config.focusAreas[o.key as keyof AnimFocusAreas]
                      }
                      onChange={(e) =>
                        patch({
                          focusAreas: {
                            ...config.focusAreas,
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

            <div className="space-y-1">
              <Label className="text-[0.7rem]">Dodatni elementi u sceni</Label>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {ANIM_SCENE_ELEMENT_OPTIONS.map((o) => (
                  <label
                    key={o.key}
                    htmlFor={`${itemId}-se-${o.key}`}
                    className="flex cursor-pointer items-center gap-2 rounded-md bg-card/60 px-2.5 py-1.5 hover:bg-card/80"
                  >
                    <input
                      id={`${itemId}-se-${o.key}`}
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-accent"
                      checked={
                        config.sceneElements[o.key as keyof AnimSceneElements]
                      }
                      onChange={(e) =>
                        patch({
                          sceneElements: {
                            ...config.sceneElements,
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

            <div className="space-y-1">
              <Label htmlFor={`music-${itemId}`} className="text-[0.7rem]">
                <Music className="h-3 w-3 text-accent/60" />
                Muzika i zvuk
              </Label>
              <select
                id={`music-${itemId}`}
                value={config.musicMood ?? ""}
                onChange={(e) =>
                  patch({
                    musicMood: (e.target.value || undefined) as
                      | AnimMusicMoodId
                      | undefined,
                  })
                }
                disabled={!editable}
                className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
              >
                <option value="">— izaberite —</option>
                {ANIM_MUSIC_MOODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
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
            Dodatne putanje kamere ili sezonske / dnevno-noćne
            varijacije iste animacije.
          </p>
        </div>

        {/* Extra paths stepper */}
        <div className="space-y-2 rounded-md bg-secondary/30 px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Camera className="h-3.5 w-3.5 text-accent" />
              <div>
                <span className="block text-[0.78rem] font-medium text-foreground">
                  Dodatna putanja kamere
                </span>
                <span className="block text-[0.7rem] text-muted-foreground">
                  Još jedan video iz istog modela — €5/sek po putanji
                </span>
              </div>
            </div>
            <div className="inline-flex items-center rounded-md bg-card/80">
              <button
                type="button"
                disabled={!editable || config.extraPathsCount <= 0}
                onClick={decPaths}
                aria-label="Smanji broj putanja"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="min-w-[1.5rem] text-center text-[0.78rem] font-semibold tabular-nums text-foreground">
                {config.extraPathsCount}
              </span>
              <button
                type="button"
                disabled={!editable || config.extraPathsCount >= 10}
                onClick={incPaths}
                aria-label="Povećaj broj putanja"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
          {config.extraPathsCount > 0 && (
            <p className="text-[0.7rem] text-muted-foreground">
              {config.extraPathsCount} ×{" "}
              {config.durationSeconds}s × €5 ={" "}
              <span className="font-semibold text-accent">
                +€{config.extraPathsCount * config.durationSeconds * 5}
              </span>
            </p>
          )}
        </div>

        {/* Day/Night toggle (hidden in active mode) */}
        {showDayNight && (
          <label
            htmlFor={`daynight-${itemId}`}
            className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-secondary/30 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <CloudMoon className="h-3.5 w-3.5 text-accent" />
              <div>
                <span className="block text-[0.78rem] font-medium text-foreground">
                  Dan / Noć verzija
                </span>
                <span className="block text-[0.7rem] text-muted-foreground">
                  Ista animacija u dnevnoj i noćnoj varijanti
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {config.dayNightVariant && (
                <span className="text-[0.72rem] font-semibold text-accent tabular-nums">
                  +30%
                </span>
              )}
              <Switch
                id={`daynight-${itemId}`}
                checked={config.dayNightVariant}
                onCheckedChange={(v) => patch({ dayNightVariant: v })}
                disabled={!editable}
              />
            </div>
          </label>
        )}

        {/* Seasonal toggle (only in scratch mode) */}
        {showSeason && (
          <label
            htmlFor={`seasonvar-${itemId}`}
            className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-secondary/30 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <Leaf className="h-3.5 w-3.5 text-accent" />
              <div>
                <span className="block text-[0.78rem] font-medium text-foreground">
                  Sezonska varijacija
                </span>
                <span className="block text-[0.7rem] text-muted-foreground">
                  Ista animacija u drugom godišnjem dobu
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {config.seasonalVariant && (
                <span className="text-[0.72rem] font-semibold text-accent tabular-nums">
                  +40%
                </span>
              )}
              <Switch
                id={`seasonvar-${itemId}`}
                checked={config.seasonalVariant}
                onCheckedChange={(v) => patch({ seasonalVariant: v })}
                disabled={!editable}
              />
            </div>
          </label>
        )}
      </div>
    </div>
  );
}
