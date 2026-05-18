/**
 * ItemRemovalConfigSection — Per-item configurator for ir-simple +
 * ir-complex (Uklanjanje elemenata). One component handles both via a
 * productId prop (drives label, additional add-on ID, per-photo
 * surcharge, and visibility of the "background reconstruction" section
 * which only applies to ir-complex).
 *
 * The "staging upsell" toggle is informational in v1 — it stores
 * intent in configJson; the user adds vs-static separately if they
 * want post-cleanup virtual staging.
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
  Eraser,
  FileUp,
  Hammer,
  Highlighter,
  Image as ImageIcon,
  Minus,
  Pencil,
  Plus,
  Settings2,
  Sofa,
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
  itemRemovalAdditionalPriceEur,
  itemRemovalProductLabel,
  type ItemRemovalConfig,
  type ItemRemovalProductId,
} from "@/lib/catalog/item-removal-config";
import {
  VS_FURNITURE_STYLES,
  type VsFurnitureStyleId,
} from "@/lib/catalog/staging-config";
import {
  confirmItemFileUpload,
  deleteOrderFile,
  updateItemRemovalConfig,
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

type FileKind = "source" | "annotated" | "background-ref";

export function ItemRemovalConfigSection({
  itemId,
  orderId,
  productId,
  initialConfig,
  files,
  editable,
}: {
  itemId: string;
  orderId: string;
  productId: ItemRemovalProductId;
  initialConfig: ItemRemovalConfig;
  files: ItemFile[];
  editable: boolean;
}) {
  const [config, setConfig] = useState<ItemRemovalConfig>(initialConfig);
  const [advanced, setAdvanced] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [, start] = useTransition();
  const [uploading, setUploading] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initRef = useRef(true);
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const annotatedInputRef = useRef<HTMLInputElement>(null);
  const bgRefInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { formatPrice } = useOrderCurrency();

  const isComplex = productId === "ir-complex";
  const additionalPriceEur = itemRemovalAdditionalPriceEur(productId);

  const totalEur = useMemo(() => {
    const calc = calculateQuote([
      {
        instanceId: itemId,
        productId,
        categoryId: "item-removal",
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
        await updateItemRemovalConfig(itemId, config);
        setSavedAt(Date.now());
        router.refresh();
      });
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [config, itemId, editable, router]);

  const patch = (p: Partial<ItemRemovalConfig>) =>
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
  const annotatedFiles = files.filter((f) => f.kind === "annotated");
  const bgRefFiles = files.filter((f) => f.kind === "background-ref");

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
          <Eraser className="h-4 w-4 text-accent" />
          <div>
            <p className="text-xs font-semibold text-foreground">
              {config.imageName || "Slika"}
            </p>
            <p className="text-[0.72rem] text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded bg-accent/15 px-1.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider text-accent">
                {itemRemovalProductLabel(productId)}
              </span>
              <span className="ml-2">
                {config.photoCount} fotografij
                {config.photoCount === 1 ? "a" : "e"}
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
            {formatPrice(totalEur)}
          </p>
        </div>
      </div>

      {/* Image name */}
      <div className="space-y-1">
        <Label
          htmlFor={`name-${itemId}`}
          className="text-[0.72rem] uppercase tracking-wider text-muted-foreground"
        >
          <Pencil className="h-3 w-3 text-accent/60" />
          Naziv prostorije / slike
        </Label>
        <input
          id={`name-${itemId}`}
          type="text"
          value={config.imageName}
          onChange={(e) => patch({ imageName: e.target.value })}
          disabled={!editable}
          maxLength={100}
          className="w-full rounded-md bg-secondary/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50"
        />
      </div>

      {/* Photo count */}
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
            1 uključena, +€{additionalPriceEur} svaka sledeća
          </span>
        </div>
      </div>

      {/* Description — what to remove */}
      <div className="space-y-1">
        <Label htmlFor={`desc-${itemId}`} className="text-xs">
          <Pencil className="h-3 w-3 text-accent/60" />
          Šta treba ukloniti?
        </Label>
        <Textarea
          id={`desc-${itemId}`}
          value={config.description ?? ""}
          onChange={(e) => patch({ description: e.target.value })}
          disabled={!editable}
          placeholder="Kutije u uglu, slike sa zida, stari kauč, žice na zidovima…"
          rows={3}
          className="resize-none text-sm"
        />
      </div>

      {/* Source upload */}
      <div className="space-y-1.5">
        <Label className="text-xs">Originalne fotografije</Label>
        {renderUploadZone(
          sourceInputRef,
          "Prevucite fotografije prostora",
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
            · označavanje, rekonstrukcija, detalji
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
          {/* 2.1 Annotation & retention */}
          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Precizno označavanje
            </p>

            <div className="space-y-1.5">
              <Label className="text-[0.7rem]">
                <Highlighter className="h-3 w-3 text-accent/60" />
                Upload označenih skica
              </Label>
              {renderUploadZone(
                annotatedInputRef,
                "Slike sa zaokruženim elementima koje treba ukloniti",
                "image/*",
                "annotated",
              )}
              {renderFileList(annotatedFiles)}
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
                placeholder="Ugradni plakar, kamin, specifična lampa…"
                rows={2}
                className="resize-none text-[0.78rem]"
              />
            </div>
          </div>

          {/* 2.2 Background reconstruction — only for complex */}
          <Collapsible open={isComplex}>
            <div className="space-y-3 rounded-md border border-border/30 bg-card/60 p-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
                <Hammer className="h-3 w-3 text-accent/60" />
                Rekonstrukcija pozadine
              </p>
              <div className="space-y-1">
                <Label
                  htmlFor={`bg-desc-${itemId}`}
                  className="text-[0.7rem]"
                >
                  Šta se nalazi iza predmeta?
                </Label>
                <Textarea
                  id={`bg-desc-${itemId}`}
                  value={config.backgroundDescription ?? ""}
                  onChange={(e) =>
                    patch({ backgroundDescription: e.target.value })
                  }
                  disabled={!editable}
                  placeholder="Nastavlja se drveni parket i beli zid; iza kauča je prozor; ispod sata je kamen…"
                  rows={2}
                  className="resize-none text-[0.78rem]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[0.7rem]">
                  <ImageIcon className="h-3 w-3 text-accent/60" />
                  Reference za pozadinu
                </Label>
                {renderUploadZone(
                  bgRefInputRef,
                  "Slika iste sobe iz drugog ugla gde se vidi prazan zid / pod",
                  "image/*",
                  "background-ref",
                )}
                {renderFileList(bgRefFiles)}
              </div>
            </div>
          </Collapsible>
        </div>
      </Collapsible>

      {/* Upsell card */}
      <div className="space-y-3 rounded-xl border border-border/40 bg-card/80 p-4">
        <div>
          <h5 className="text-sm font-semibold text-foreground">
            Dodatne opcije
          </h5>
          <p className="mt-1 text-[0.78rem] leading-relaxed text-muted-foreground">
            Nakon čišćenja prostora, možete dodatno naručiti virtuelno
            opremanje — uslugu naručujete posebno (Statički staging).
          </p>
        </div>

        <label
          htmlFor={`stage-up-${itemId}`}
          className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-secondary/30 px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <div>
              <span className="block text-[0.78rem] font-medium text-foreground">
                Želim virtuelno opremanje (Staging)
              </span>
              <span className="block text-[0.7rem] text-muted-foreground">
                Označite intenciju — naručite vs-static stavku posebno
              </span>
            </div>
          </div>
          <Switch
            id={`stage-up-${itemId}`}
            checked={config.stagingUpsellEnabled}
            onCheckedChange={(v) =>
              patch({
                stagingUpsellEnabled: v,
                ...(v ? {} : { stagingUpsellStyle: undefined }),
              })
            }
            disabled={!editable}
          />
        </label>

        <Collapsible open={config.stagingUpsellEnabled}>
          <div className="space-y-1 rounded-md border border-border/30 bg-background/40 p-3">
            <Label
              htmlFor={`stage-style-${itemId}`}
              className="text-[0.7rem]"
            >
              <Sofa className="h-3 w-3 text-accent/60" />
              Stil za staging
            </Label>
            <select
              id={`stage-style-${itemId}`}
              value={config.stagingUpsellStyle ?? ""}
              onChange={(e) =>
                patch({
                  stagingUpsellStyle: (e.target.value || undefined) as
                    | VsFurnitureStyleId
                    | undefined,
                })
              }
              disabled={!editable}
              className="w-full rounded-md bg-card/80 px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-border/40 focus:ring-accent/50 disabled:opacity-60"
            >
              <option value="">— izaberite —</option>
              {VS_FURNITURE_STYLES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[0.62rem] text-muted-foreground">
              Ovaj izbor pamtimo kao informaciju — naručite uslugu
              „Statički staging” (vs-static) posebno iz cenovnika.
            </p>
          </div>
        </Collapsible>
      </div>
    </div>
  );
}
