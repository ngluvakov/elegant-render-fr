/**
 * VrConfigSection — Per-item configurator for VR experiences
 * (vr-existing + vr-standalone). One component handles both via
 * productId prop, which drives terminology + which add-on suffix gets
 * driven (vr-{suffix}-floor / -interactive).
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
import Link from "next/link";
import {
  Boxes,
  Check,
  Compass,
  DoorOpen,
  FileUp,
  Footprints,
  Gamepad2,
  Headphones,
  Layers,
  Lightbulb,
  MessageCircle,
  Minus,
  Palette,
  Pencil,
  Plus,
  Settings2,
  ShieldAlert,
  Sparkles,
  Sun,
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
  VR_DAY_NIGHT_MODES,
  VR_EXPERIENCE_TYPES,
  VR_FLOOR_EUR,
  VR_INTERACTIVE_EUR,
  VR_LOCOMOTION,
  VR_TARGET_DEVICES,
  vrProductLabel,
  type VrConfig,
  type VrDayNightModeId,
  type VrExperienceTypeId,
  type VrLocomotionId,
  type VrProductId,
  type VrTargetDeviceId,
} from "@/lib/catalog/vr-config";
import {
  confirmItemFileUpload,
  deleteOrderFile,
  updateVrConfig,
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

type FileKind = "source" | "logo";

export function VrConfigSection({
  itemId,
  orderId,
  productId,
  initialConfig,
  files,
  editable,
}: {
  itemId: string;
  orderId: string;
  productId: VrProductId;
  initialConfig: VrConfig;
  files: ItemFile[];
  editable: boolean;
}) {
  const [config, setConfig] = useState<VrConfig>(initialConfig);
  const [advanced, setAdvanced] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [, start] = useTransition();
  const [uploading, setUploading] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initRef = useRef(true);
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const totalEur = useMemo(() => {
    const calc = calculateQuote([
      {
        instanceId: itemId,
        productId,
        categoryId: "vr-experiences",
        addOnQuantities: addOnQuantitiesFor(config, productId),
      },
    ]);
    return calc.items[0]?.totalEur ?? 0;
  }, [itemId, productId, config]);

  useEffect(() => {
    if (!editable) return;
    if (initRef.current) {
      initRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      start(async () => {
        await updateVrConfig(itemId, config);
        setSavedAt(Date.now());
        router.refresh();
      });
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [config, itemId, editable, router]);

  const patch = (p: Partial<VrConfig>) =>
    setConfig((prev) => ({ ...prev, ...p }));

  const incFloors = () => {
    if (config.extraFloorsCount >= 30) return;
    patch({ extraFloorsCount: config.extraFloorsCount + 1 });
  };
  const decFloors = () => {
    if (config.extraFloorsCount <= 0) return;
    patch({ extraFloorsCount: config.extraFloorsCount - 1 });
  };
  const incInteractive = () => {
    if (config.interactiveTypeCount >= 30) return;
    patch({ interactiveTypeCount: config.interactiveTypeCount + 1 });
  };
  const decInteractive = () => {
    if (config.interactiveTypeCount <= 0) return;
    patch({ interactiveTypeCount: config.interactiveTypeCount - 1 });
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
      {/* Summary bar with type badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/30 bg-card/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Headphones className="h-4 w-4 text-accent" />
          <div>
            <p className="text-xs font-semibold text-foreground">
              {config.projectName || "VR Prezentacija"}
            </p>
            <p className="text-[0.72rem] text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded bg-accent/15 px-1.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider text-accent">
                {vrProductLabel(productId)}
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

      {/* Consultation prompt — VR is a premium product (€1500–3000) so we
          surface a pre-payment consultation invite right after the price. */}
      <div className="flex flex-col gap-3 rounded-xl border border-accent/30 bg-accent/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent text-white">
            <MessageCircle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Razgovaraj sa timom pre plaćanja
            </p>
            <p className="mt-0.5 text-[0.78rem] leading-relaxed text-muted-foreground">
              VR projekti zahtevaju dogovor o opsegu, target uređajima i
              roku — javite nam se da osmislimo tačan plan pre nego što
              krenemo u izradu.
            </p>
          </div>
        </div>
        <Link
          href="/kontakt"
          className={cn(
            "inline-flex flex-shrink-0 items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90",
          )}
        >
          Kontakt
        </Link>
      </div>

      {/* Project name */}
      <div className="space-y-1">
        <Label
          htmlFor={`name-${itemId}`}
          className="text-[0.72rem] uppercase tracking-wider text-muted-foreground"
        >
          <Pencil className="h-3 w-3 text-accent/60" />
          Naziv VR projekta
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

      {/* Experience type + target device */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label
            htmlFor={`exp-${itemId}`}
            className="text-[0.72rem] uppercase tracking-wider text-muted-foreground"
          >
            <Boxes className="h-3 w-3 text-accent/60" />
            Tip VR iskustva
          </Label>
          <select
            id={`exp-${itemId}`}
            value={config.experienceType}
            onChange={(e) =>
              patch({ experienceType: e.target.value as VrExperienceTypeId })
            }
            disabled={!editable}
            className="w-full rounded-md bg-secondary/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-60"
          >
            {VR_EXPERIENCE_TYPES.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label
            htmlFor={`device-${itemId}`}
            className="text-[0.72rem] uppercase tracking-wider text-muted-foreground"
          >
            <Gamepad2 className="h-3 w-3 text-accent/60" />
            Ciljni uređaj
          </Label>
          <select
            id={`device-${itemId}`}
            value={config.targetDevice}
            onChange={(e) =>
              patch({ targetDevice: e.target.value as VrTargetDeviceId })
            }
            disabled={!editable}
            className="w-full rounded-md bg-secondary/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-60"
          >
            {VR_TARGET_DEVICES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label htmlFor={`desc-${itemId}`} className="text-xs">
          <Pencil className="h-3 w-3 text-accent/60" />
          Opis projekta
        </Label>
        <Textarea
          id={`desc-${itemId}`}
          value={config.description ?? ""}
          onChange={(e) => patch({ description: e.target.value })}
          disabled={!editable}
          placeholder="Šta korisnik treba da doživi u VR-u (npr. ulazak u kuću, obilazak dnevne sobe i izlazak na terasu)…"
          rows={3}
          className="resize-none text-sm"
        />
      </div>

      {/* Source upload */}
      <div className="space-y-1.5">
        <Label className="text-xs">Osnove i 3D modeli</Label>
        {renderUploadZone(
          sourceInputRef,
          "Osnove, 3D modeli (ako postoje), referentne slike",
          "image/*,application/pdf,.dwg,.dxf,.skp,.fbx,.obj,.glb,.gltf",
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
            · interakcije, navigacija, atmosfera
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
          {/* 2.1 Navigation */}
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Navigacija i kretanje
            </p>
            <div className="space-y-1">
              <Label htmlFor={`loco-${itemId}`} className="text-[0.7rem]">
                <Footprints className="h-3 w-3 text-accent/60" />
                Sistem kretanja (locomotion)
              </Label>
              <select
                id={`loco-${itemId}`}
                value={config.locomotion ?? ""}
                onChange={(e) =>
                  patch({
                    locomotion: (e.target.value || undefined) as
                      | VrLocomotionId
                      | undefined,
                  })
                }
                disabled={!editable}
                className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
              >
                <option value="">— izaberite —</option>
                {VR_LOCOMOTION.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <label
              htmlFor={`restrict-${itemId}`}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-card/60 px-3 py-2"
            >
              <span className="flex items-center gap-2 text-[0.78rem] text-foreground">
                <ShieldAlert className="h-3.5 w-3.5 text-accent" />
                Ograniči kretanje samo na određene zone
              </span>
              <Switch
                id={`restrict-${itemId}`}
                checked={config.movementRestrictions}
                onCheckedChange={(v) => patch({ movementRestrictions: v })}
                disabled={!editable}
              />
            </label>
          </div>

          {/* 2.2 Interactions (descriptive flags) */}
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Interaktivni elementi
            </p>
            <p className="text-[0.62rem] text-muted-foreground">
              Označite koje TIPOVE interakcija želite. Ukupan broj
              naplativih tipova unesite u upsell stepperu ispod.
            </p>
            <div className="space-y-1.5">
              <label
                htmlFor={`door-${itemId}`}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-card/60 px-3 py-2"
              >
                <span className="flex items-center gap-2 text-[0.78rem] text-foreground">
                  <DoorOpen className="h-3.5 w-3.5 text-accent" />
                  Interakcija sa vratima
                </span>
                <Switch
                  id={`door-${itemId}`}
                  checked={config.doorInteraction}
                  onCheckedChange={(v) => patch({ doorInteraction: v })}
                  disabled={!editable}
                />
              </label>
              <label
                htmlFor={`lights-${itemId}`}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-card/60 px-3 py-2"
              >
                <span className="flex items-center gap-2 text-[0.78rem] text-foreground">
                  <Lightbulb className="h-3.5 w-3.5 text-accent" />
                  Interakcija sa svetlima
                </span>
                <Switch
                  id={`lights-${itemId}`}
                  checked={config.lightsInteraction}
                  onCheckedChange={(v) => patch({ lightsInteraction: v })}
                  disabled={!editable}
                />
              </label>
              <label
                htmlFor={`mat-${itemId}`}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-card/60 px-3 py-2"
              >
                <span className="flex items-center gap-2 text-[0.78rem] text-foreground">
                  <Palette className="h-3.5 w-3.5 text-accent" />
                  Promena materijala u realnom vremenu
                </span>
                <Switch
                  id={`mat-${itemId}`}
                  checked={config.materialsInteraction}
                  onCheckedChange={(v) => patch({ materialsInteraction: v })}
                  disabled={!editable}
                />
              </label>
            </div>

            <div className="space-y-1">
              <Label
                htmlFor={`custom-int-${itemId}`}
                className="text-[0.7rem]"
              >
                Opis dodatnih interakcija
              </Label>
              <Textarea
                id={`custom-int-${itemId}`}
                value={config.customInteractionDescription ?? ""}
                onChange={(e) =>
                  patch({ customInteractionDescription: e.target.value })
                }
                disabled={!editable}
                placeholder="Puštanje vode na slavini, paljenje TV-a, otvaranje frižidera…"
                rows={2}
                className="resize-none text-[0.78rem]"
              />
            </div>
          </div>

          {/* 2.3 Atmosphere & branding */}
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Atmosfera i UI
            </p>
            <div className="space-y-1">
              <Label htmlFor={`dn-${itemId}`} className="text-[0.7rem]">
                <Sun className="h-3 w-3 text-accent/60" />
                Doba dana u VR-u
              </Label>
              <select
                id={`dn-${itemId}`}
                value={config.dayNightMode ?? ""}
                onChange={(e) =>
                  patch({
                    dayNightMode: (e.target.value || undefined) as
                      | VrDayNightModeId
                      | undefined,
                  })
                }
                disabled={!editable}
                className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
              >
                <option value="">— izaberite —</option>
                {VR_DAY_NIGHT_MODES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <label
              htmlFor={`branding-${itemId}`}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-card/60 px-3 py-2"
            >
              <span className="flex items-center gap-2 text-[0.78rem] text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Brendiranje (white-label)
              </span>
              <Switch
                id={`branding-${itemId}`}
                checked={config.brandingEnabled}
                onCheckedChange={(v) => patch({ brandingEnabled: v })}
                disabled={!editable}
              />
            </label>

            <Collapsible open={config.brandingEnabled}>
              <div className="space-y-1.5 rounded-md border border-border/30 bg-background/40 p-3">
                <Label className="text-[0.7rem]">Logo (PNG / SVG / JPG)</Label>
                {renderUploadZone(
                  logoInputRef,
                  "Otpremite logo za VR meni i početni ekran",
                  "image/*",
                  "logo",
                )}
                {renderFileList(logoFiles)}
              </div>
            </Collapsible>
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
            Dodatni spratovi / područja i broj naplativih interaktivnih
            tipova.
          </p>
        </div>

        {/* Floors stepper */}
        <div className="space-y-2 rounded-md bg-secondary/30 px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-accent" />
              <div>
                <span className="block text-[0.78rem] font-medium text-foreground">
                  Dodatni sprat / područje
                </span>
                <span className="block text-[0.7rem] text-muted-foreground">
                  Bazna cena pokriva 1 sprat / zonu
                </span>
              </div>
            </div>
            <div className="inline-flex items-center rounded-md bg-card/80">
              <button
                type="button"
                disabled={!editable || config.extraFloorsCount <= 0}
                onClick={decFloors}
                aria-label="Smanji broj spratova"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="min-w-[1.5rem] text-center text-[0.78rem] font-semibold tabular-nums text-foreground">
                {config.extraFloorsCount}
              </span>
              <button
                type="button"
                disabled={!editable || config.extraFloorsCount >= 30}
                onClick={incFloors}
                aria-label="Povećaj broj spratova"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
          <p className="text-[0.7rem] text-muted-foreground">
            +€{VR_FLOOR_EUR} po dodatnom spratu / zoni
            {config.extraFloorsCount > 0 && (
              <span className="ml-1 font-semibold text-accent">
                · ukupno +€{config.extraFloorsCount * VR_FLOOR_EUR}
              </span>
            )}
          </p>
        </div>

        {/* Interactive types stepper */}
        <div className="space-y-2 rounded-md bg-secondary/30 px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Compass className="h-3.5 w-3.5 text-accent" />
              <div>
                <span className="block text-[0.78rem] font-medium text-foreground">
                  Broj interaktivnih elemenata
                </span>
                <span className="block text-[0.7rem] text-muted-foreground">
                  Različitih tipova (vrata, svetla, materijali, …)
                </span>
              </div>
            </div>
            <div className="inline-flex items-center rounded-md bg-card/80">
              <button
                type="button"
                disabled={!editable || config.interactiveTypeCount <= 0}
                onClick={decInteractive}
                aria-label="Smanji broj interakcija"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="min-w-[1.5rem] text-center text-[0.78rem] font-semibold tabular-nums text-foreground">
                {config.interactiveTypeCount}
              </span>
              <button
                type="button"
                disabled={!editable || config.interactiveTypeCount >= 30}
                onClick={incInteractive}
                aria-label="Povećaj broj interakcija"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
          <p className="text-[0.7rem] text-muted-foreground">
            +€{VR_INTERACTIVE_EUR} po tipu interakcije
            {config.interactiveTypeCount > 0 && (
              <span className="ml-1 font-semibold text-accent">
                · ukupno +€{config.interactiveTypeCount * VR_INTERACTIVE_EUR}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
