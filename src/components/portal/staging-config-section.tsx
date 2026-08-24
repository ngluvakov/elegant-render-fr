/**
 * StagingConfigSection — Per-item configurator for the virtual staging
 * products (vs-static + vs-360). One component handles both productIds;
 * the productId prop drives terminology (angle vs hotspot) and add-on
 * IDs (vs-angle / vs-restyle vs vs-360-hotspot / vs-360-restyle).
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
  ArrowLeftRight,
  Camera,
  Check,
  Eraser,
  FileUp,
  Lightbulb,
  Loader2,
  Minus,
  Palette,
  Pencil,
  Plus,
  Settings2,
  Sofa,
  Sparkles,
  Sun,
  Upload,
  Users,
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
  angleNoun,
  stagingProductLabel,
  VS_FURNITURE_STYLES,
  VS_MOODS,
  VS_ROOM_PURPOSES,
  VS_TARGET_AUDIENCES,
  type StagingConfig,
  type StagingProductId,
  type VsFurnitureStyleId,
  type VsMoodId,
  type VsRoomPurposeId,
  type VsTargetAudienceId,
} from "@/lib/catalog/staging-config";
import {
  confirmItemFileUpload,
  deleteOrderFile,
  swapStagingType,
  updateStagingConfig,
} from "@/server/actions/item-config";
import { track } from "@/lib/posthog-events";

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

type FileKind = "source" | "extra-angle" | "reference";

export function StagingConfigSection({
  itemId,
  orderId,
  productId,
  initialConfig,
  files,
  editable,
}: {
  itemId: string;
  orderId: string;
  productId: StagingProductId;
  initialConfig: StagingConfig;
  files: ItemFile[];
  editable: boolean;
}) {
  const [config, setConfig] = useState<StagingConfig>(initialConfig);
  const [advanced, setAdvanced] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [, start] = useTransition();
  const [uploading, setUploading] = useState<string[]>([]);
  const [swapState, setSwapState] = useState<
    | { kind: "idle" }
    | { kind: "confirm" }
    | { kind: "swapping" }
    | { kind: "error"; message: string }
  >({ kind: "idle" });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initRef = useRef(true);
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const extraInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { formatPrice } = useOrderCurrency();

  const is360 = productId === "vs-360";

  // Per-product copy
  const angleAddOnLabel = is360 ? "hotspot" : "angle";
  const angleStepperLabel = is360
    ? "Hotspot supplémentaire de la même pièce"
    : "Angle supplémentaire de la même pièce";
  const angleAddOnPriceEur = is360 ? 24 : 12;
  const restylePriceEur = is360 ? 22 : 12;
  const sourceAcceptHint = is360
    ? "Panoramas sphériques (équirectangulaires)"
    : "Photos standard de l’espace vide";

  const totalEur = useMemo(() => {
    const calc = calculateQuote([
      {
        instanceId: itemId,
        productId,
        categoryId: "staging",
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
        await updateStagingConfig(itemId, config);
        setSavedAt(Date.now());
        router.refresh();
      });
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [config, itemId, editable, router]);

  const patch = (p: Partial<StagingConfig>) =>
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
  const extraFiles = files.filter((f) => f.kind === "extra-angle");
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

  const handleSwapType = async () => {
    setSwapState({ kind: "swapping" });
    const res = await swapStagingType(itemId);
    if (res.error) {
      setSwapState({ kind: "error", message: res.error });
      return;
    }
    track("staging_type_swapped", {
      from: productId,
      to: productId === "vs-static" ? "vs-360" : "vs-static",
    });
    // Server-action revalidates the order page; refresh picks up the new
    // item (renders in the same panel layout, just with the other type).
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
      {/* Summary bar with type badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/30 bg-card/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <div>
            <p className="text-xs font-semibold text-foreground">
              {config.roomName || "Pièce"}
            </p>
            <p className="text-[0.72rem] text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded bg-accent/15 px-1.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider text-foreground">
                {stagingProductLabel(productId)}
              </span>
              {editable && (
                <button
                  type="button"
                  onClick={() =>
                    setSwapState({
                      kind:
                        swapState.kind === "confirm" ? "idle" : "confirm",
                    })
                  }
                  disabled={
                    swapState.kind === "swapping" || swapState.kind === "confirm"
                  }
                  className="ml-2 inline-flex items-center gap-1 text-[0.62rem] font-medium text-muted-foreground/80 underline-offset-2 hover:text-foreground hover:underline disabled:pointer-events-none disabled:opacity-60"
                >
                  <ArrowLeftRight className="h-3 w-3" />
                  Changer de type
                </button>
              )}
              {config.extraAnglesCount > 0 && (
                <span className="ml-2">
                  +{config.extraAnglesCount}{" "}
                  {is360
                    ? config.extraAnglesCount === 1
                      ? "hotspot supplémentaire"
                      : "hotspots supplémentaires"
                    : config.extraAnglesCount === 1
                      ? "angle supplémentaire"
                      : "angles supplémentaires"}
                </span>
              )}
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

      {/* Swap-type confirmation — destructive (resets config + add-ons) */}
      {swapState.kind === "confirm" && (
        <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/[0.06] p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.78rem] leading-relaxed text-foreground">
            Passer au{" "}
            <strong>
              {is360 ? "home staging statique" : "home staging 360°"}
            </strong>
             ? Les réglages actuels seront effacés (sauf le nom de la
            pièce), les fichiers restent joints - vérifiez qu’ils sont au bon
            format.
          </p>
          <div className="flex flex-shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setSwapState({ kind: "idle" })}
              className="inline-flex items-center justify-center rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSwapType}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-white hover:bg-destructive/90"
            >
              <ArrowLeftRight className="h-3 w-3" />
              Changer
            </button>
          </div>
        </div>
      )}
      {swapState.kind === "swapping" && (
        <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/60 p-3 text-[0.78rem] text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
          Changement de type…
        </div>
      )}
      {swapState.kind === "error" && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/[0.06] p-3 text-[0.78rem] text-destructive">
          <span>{swapState.message}</span>
          <button
            type="button"
            onClick={() => setSwapState({ kind: "idle" })}
            className="rounded p-1 hover:bg-destructive/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Room name */}
      <div className="space-y-1">
        <Label
          htmlFor={`room-name-${itemId}`}
          className="text-[0.72rem] uppercase tracking-wider text-muted-foreground"
        >
          <Pencil className="h-3 w-3 text-accent/60" />
          Nom de la pièce
        </Label>
        <input
          id={`room-name-${itemId}`}
          type="text"
          value={config.roomName}
          onChange={(e) => patch({ roomName: e.target.value })}
          disabled={!editable}
          maxLength={100}
          className="w-full rounded-md bg-secondary/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50"
        />
      </div>

      {/* Furniture style + room purpose */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label
            htmlFor={`fstyle-${itemId}`}
            className="text-[0.72rem] uppercase tracking-wider text-muted-foreground"
          >
            <Sofa className="h-3 w-3 text-accent/60" />
            Style de mobilier
          </Label>
          <select
            id={`fstyle-${itemId}`}
            value={config.furnitureStyle}
            onChange={(e) =>
              patch({ furnitureStyle: e.target.value as VsFurnitureStyleId })
            }
            disabled={!editable}
            className="w-full rounded-md bg-secondary/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-60"
          >
            {VS_FURNITURE_STYLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label
            htmlFor={`purpose-${itemId}`}
            className="text-[0.72rem] uppercase tracking-wider text-muted-foreground"
          >
            Usage de la pièce
          </Label>
          <select
            id={`purpose-${itemId}`}
            value={config.roomPurpose}
            onChange={(e) =>
              patch({ roomPurpose: e.target.value as VsRoomPurposeId })
            }
            disabled={!editable}
            className="w-full rounded-md bg-secondary/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-60"
          >
            {VS_ROOM_PURPOSES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label htmlFor={`desc-${itemId}`} className="text-xs">
          <Pencil className="h-3 w-3 text-accent/60" />
          Description et remarques
        </Label>
        <Textarea
          id={`desc-${itemId}`}
          value={config.description ?? ""}
          onChange={(e) => patch({ description: e.target.value })}
          disabled={!editable}
          placeholder="Qu’est-ce qui compte le plus à mettre en valeur dans cette pièce ? Y a-t-il un meuble que vous voulez absolument ?"
          rows={3}
          className="resize-none text-sm"
        />
      </div>

      {/* Source files */}
      <div className="space-y-1.5">
        <Label className="text-xs">Photos de la pièce vide</Label>
        {renderUploadZone(
          sourceInputRef,
          sourceAcceptHint,
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
              <span className="text-accent">Import en cours…</span>
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
            Paramètres avancés
          </span>
          <span className="hidden text-[0.72rem] text-muted-foreground sm:inline">
            · éclairage, détails, suppression d’objets
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
          {/* 2.1 Mood & lighting */}
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Atmosphère et éclairage
            </p>
            <div className="space-y-1">
              <Label htmlFor={`mood-${itemId}`} className="text-[0.7rem]">
                Ambiance
              </Label>
              <select
                id={`mood-${itemId}`}
                value={config.mood ?? ""}
                onChange={(e) =>
                  patch({
                    mood: (e.target.value || undefined) as
                      | VsMoodId
                      | undefined,
                  })
                }
                disabled={!editable}
                className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
              >
                <option value="">Sélectionner…</option>
                {VS_MOODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor={`light-corr-${itemId}`}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-card/60 px-3 py-2"
              >
                <span className="flex items-center gap-2 text-[0.78rem] text-foreground">
                  <Sun className="h-3.5 w-3.5 text-accent" />
                  Éclaircir et corriger les couleurs de la photo
                </span>
                <Switch
                  id={`light-corr-${itemId}`}
                  checked={config.lightingCorrection}
                  onCheckedChange={(v) => patch({ lightingCorrection: v })}
                  disabled={!editable}
                />
              </label>
              <label
                htmlFor={`art-light-${itemId}`}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-card/60 px-3 py-2"
              >
                <span className="flex items-center gap-2 text-[0.78rem] text-foreground">
                  <Lightbulb className="h-3.5 w-3.5 text-accent" />
                  Inclure des lampes et un éclairage d’ambiance
                </span>
                <Switch
                  id={`art-light-${itemId}`}
                  checked={config.artificialLight}
                  onCheckedChange={(v) => patch({ artificialLight: v })}
                  disabled={!editable}
                />
              </label>
            </div>
          </div>

          {/* 2.2 Item removal */}
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Corrections de la pièce
            </p>
            <label
              htmlFor={`removal-${itemId}`}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-card/60 px-3 py-2"
            >
              <span className="flex items-center gap-2 text-[0.78rem] text-foreground">
                <Eraser className="h-3.5 w-3.5 text-accent" />
                Supprimer les vieux meubles ou le désordre de la photo
              </span>
              <Switch
                id={`removal-${itemId}`}
                checked={config.itemRemovalEnabled}
                onCheckedChange={(v) =>
                  patch({
                    itemRemovalEnabled: v,
                    ...(v ? {} : { itemsToRemove: undefined }),
                  })
                }
                disabled={!editable}
              />
            </label>

            <Collapsible open={config.itemRemovalEnabled}>
              <div className="space-y-1 rounded-md border border-border/30 bg-background/40 p-3">
                <Label
                  htmlFor={`remove-${itemId}`}
                  className="text-[0.7rem]"
                >
                  Que faut-il supprimer ?
                </Label>
                <Textarea
                  id={`remove-${itemId}`}
                  value={config.itemsToRemove ?? ""}
                  onChange={(e) => patch({ itemsToRemove: e.target.value })}
                  disabled={!editable}
                  placeholder="Vieux canapé, cartons dans le coin, cadres au mur…"
                  rows={2}
                  className="resize-none text-[0.78rem]"
                />
              </div>
            </Collapsible>

            <div className="space-y-1">
              <Label htmlFor={`keep-${itemId}`} className="text-[0.7rem]">
                Que faut-il conserver ?
              </Label>
              <Textarea
                id={`keep-${itemId}`}
                value={config.itemsToKeep ?? ""}
                onChange={(e) => patch({ itemsToKeep: e.target.value })}
                disabled={!editable}
                placeholder="Placard encastré, cheminée, boiseries existantes…"
                rows={2}
                className="resize-none text-[0.78rem]"
              />
            </div>
          </div>

          {/* 2.3 References & target audience */}
          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Références et exigences particulières
            </p>

            <div className="space-y-1.5">
              <Label className="text-[0.7rem]">Références de style</Label>
              {renderUploadZone(
                refInputRef,
                "Pinterest, magazines, images du mobilier souhaité",
                "image/*",
                "reference",
              )}
              {renderFileList(referenceFiles)}
            </div>

            <div className="space-y-1">
              <Label
                htmlFor={`audience-${itemId}`}
                className="text-[0.7rem]"
              >
                <Users className="h-3 w-3 text-accent/60" />
                Groupe d’acheteurs cible
              </Label>
              <select
                id={`audience-${itemId}`}
                value={config.targetAudience ?? ""}
                onChange={(e) =>
                  patch({
                    targetAudience: (e.target.value || undefined) as
                      | VsTargetAudienceId
                      | undefined,
                  })
                }
                disabled={!editable}
                className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
              >
                <option value="">Sélectionner…</option>
                {VS_TARGET_AUDIENCES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
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
            Options supplémentaires
          </h5>
          <p className="mt-1 text-[0.78rem] leading-relaxed text-muted-foreground">
            {is360
              ? "Plus de hotspots de la même pièce, ou un restyle dans une autre variante de style."
              : "Plus d’angles de la même pièce, ou un restyle dans une autre variante de style."}
          </p>
        </div>

        {/* Extra angles stepper */}
        <div className="space-y-2 rounded-md bg-secondary/30 px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Camera className="h-3.5 w-3.5 text-accent" />
              <div>
                <span className="block text-[0.78rem] font-medium text-foreground">
                  {angleStepperLabel}
                </span>
                <span className="block text-[0.7rem] text-muted-foreground">
                  Vous avez plusieurs photos de la même pièce ? Ajoutez-les à prix réduit.
                </span>
              </div>
            </div>
            <div className="inline-flex items-center rounded-md bg-card/80">
              <button
                type="button"
                disabled={!editable || config.extraAnglesCount <= 0}
                onClick={decExtra}
                aria-label={`Diminuer le nombre de ${angleAddOnLabel}s supplémentaires`}
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
                aria-label={`Augmenter le nombre de ${angleAddOnLabel}s supplémentaires`}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
          <p className="text-[0.7rem] text-muted-foreground">
            +{formatPrice(angleAddOnPriceEur)} par {angleAddOnLabel} supplémentaire
            {config.extraAnglesCount > 0 && (
              <span className="ml-1 font-semibold text-accent">
                · total +{formatPrice(config.extraAnglesCount * angleAddOnPriceEur)}
              </span>
            )}
          </p>

          <Collapsible open={config.extraAnglesCount > 0}>
            <div className="space-y-1.5">
              <Label className="text-[0.7rem]">
                Importer les {angleAddOnLabel}s supplémentaires
              </Label>
              {renderUploadZone(
                extraInputRef,
                is360
                  ? "Panoramas 360 supplémentaires de la même pièce"
                  : "Photos supplémentaires de la même pièce",
                "image/*",
                "extra-angle",
              )}
              {renderFileList(extraFiles)}
            </div>
          </Collapsible>
        </div>

        {/* Restyle toggle */}
        <label
          htmlFor={`restyle-${itemId}`}
          className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-secondary/30 px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <Palette className="h-3.5 w-3.5 text-accent" />
            <div>
              <span className="block text-[0.78rem] font-medium text-foreground">
                Restaging (nouveau style)
              </span>
              <span className="block text-[0.7rem] text-muted-foreground">
                La même photo dans un style complètement différent
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {config.restyleEnabled && (
              <span className="text-[0.72rem] font-semibold text-accent tabular-nums">
                +{formatPrice(restylePriceEur)}
              </span>
            )}
            <Switch
              id={`restyle-${itemId}`}
              checked={config.restyleEnabled}
              onCheckedChange={(v) =>
                patch({
                  restyleEnabled: v,
                  ...(v ? {} : { restyleStyle: undefined }),
                })
              }
              disabled={!editable}
            />
          </div>
        </label>

        <Collapsible open={config.restyleEnabled}>
          <div className="space-y-1 rounded-md border border-border/30 bg-background/40 p-3">
            <Label
              htmlFor={`restyle-style-${itemId}`}
              className="text-[0.7rem]"
            >
              Style de la variante restylée
            </Label>
            <select
              id={`restyle-style-${itemId}`}
              value={config.restyleStyle ?? ""}
              onChange={(e) =>
                patch({
                  restyleStyle: (e.target.value || undefined) as
                    | VsFurnitureStyleId
                    | undefined,
                })
              }
              disabled={!editable}
              className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
            >
              <option value="">Sélectionner…</option>
              {VS_FURNITURE_STYLES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </Collapsible>
      </div>
    </div>
  );
}
