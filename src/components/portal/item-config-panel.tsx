/**
 * ItemConfigPanel — Expandable per-item configuration with simple/advanced modes.
 * Simple: description + file upload. Advanced: detailed config, references, technical docs.
 * For int-static product it also shows the InteriorConfigSection (rooms + cameras).
 *
 * Used on: /portal/porudzbine/[orderId] (order detail, draft orders).
 */
"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  FileUp,
  Pencil,
  Settings2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Collapsible } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { formatDiscountedPrice } from "@/lib/catalog/calculate";
import {
  confirmItemFileUpload,
  deleteOrderItem,
  updateItemConfig,
} from "@/server/actions/item-config";
import { InteriorConfigSection } from "./interior-config-section";
import { Tour360ConfigSection } from "./tour360-config-section";
import { LandscapeConfigSection } from "./landscape-config-section";
import { FloorplanConfigSection } from "./floorplan-config-section";
import { Floorplan2dConfigSection } from "./floorplan-2d-config-section";
import { SiteplanConfigSection } from "./siteplan-config-section";
import { StagingConfigSection } from "./staging-config-section";
import type { InteriorFloor } from "@/lib/catalog/interior-config";
import {
  defaultTourAssembly,
  type Tour360Config,
  type Tour360Floor,
  type TourAssembly,
} from "@/lib/catalog/tour360-config";
import { readLandscapeConfig } from "@/lib/catalog/landscape-config";
import { readFloorplanConfig } from "@/lib/catalog/floorplan-config";
import { readFloorplan2dConfig } from "@/lib/catalog/floorplan-2d-config";
import { readSiteplanConfig } from "@/lib/catalog/siteplan-config";
import { readStagingConfig } from "@/lib/catalog/staging-config";

type ItemFile = {
  id: string;
  fileName: string;
  fileSize: number;
  kind: string;
  floorId: string | null;
};

type ItemData = {
  id: string;
  orderId: string;
  productId: string;
  productLabel: string;
  categoryLabel: string;
  totalEur: number;
  originalTotalEur: number | null;
  discountPct: number | null;
  discountReason: string | null;
  clientNote: string | null;
  configJson: Record<string, unknown> | null;
  files: ItemFile[];
};

export function ItemConfigPanel({
  item,
  canDelete,
}: {
  item: ItemData;
  canDelete: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [note, setNote] = useState(item.clientNote ?? "");
  const [styleDesc, setStyleDesc] = useState(
    (item.configJson?.styleDescription as string) ?? "",
  );
  const [roomDetails, setRoomDetails] = useState(
    (item.configJson?.roomDetails as string) ?? "",
  );
  const [techNotes, setTechNotes] = useState(
    (item.configJson?.technicalNotes as string) ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletePending, startDelete] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const isInterior = item.productId === "int-static";
  const isTour360 = item.productId === "int-360";
  const isLandscape = item.productId === "land-static";
  const isFloorplan = item.productId === "fp3d-single";
  const isFloorplan2d = item.productId === "fp2d-single";
  const isSiteplan = item.productId === "sp-first";
  const isStaging =
    item.productId === "vs-static" || item.productId === "vs-360";
  const interiorFloors =
    (item.configJson?.floors as InteriorFloor[] | undefined) ?? null;
  const tour360Config: Tour360Config | null = isTour360
    ? {
        floors:
          (item.configJson?.floors as Tour360Floor[] | undefined) ?? [],
        tourAssembly:
          (item.configJson?.tourAssembly as TourAssembly | undefined) ??
          defaultTourAssembly(),
      }
    : null;
  const landscapeConfig = isLandscape
    ? readLandscapeConfig(item.configJson)
    : null;
  const floorplanConfig = isFloorplan
    ? readFloorplanConfig(item.configJson)
    : null;
  const floorplan2dConfig = isFloorplan2d
    ? readFloorplan2dConfig(item.configJson)
    : null;
  const siteplanConfig = isSiteplan
    ? readSiteplanConfig(item.configJson)
    : null;
  const stagingConfig = isStaging
    ? readStagingConfig(item.configJson)
    : null;

  const handleSave = async () => {
    setSaving(true);
    await updateItemConfig(item.id, {
      clientNote: note || undefined,
      configJson: advanced
        ? { styleDescription: styleDesc, roomDetails, technicalNotes: techNotes }
        : undefined,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  };

  const handleDeleteItem = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startDelete(async () => {
      const res = await deleteOrderItem(item.id);
      if (res.error) {
        alert(res.error);
        setConfirmDelete(false);
        return;
      }
      router.refresh();
    });
  };

  const uploadFile = useCallback(
    async (file: File, kind: string) => {
      setUploading((prev) => [...prev, file.name]);
      try {
        const urlRes = await fetch("/api/checkout/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: item.orderId,
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
          item.orderId,
          item.id,
          file.name,
          file.size,
          file.type,
          storagePath,
          kind,
        );
        router.refresh();
      } catch {}
      setUploading((prev) => prev.filter((n) => n !== file.name));
    },
    [item.orderId, item.id, router],
  );

  const formatSize = (b: number) =>
    b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  // Universal "minimum for project kickoff" rule: needs a description OR at least one file.
  // For int-static, check across floors (per-floor description/files).
  const isConfigured = isInterior
    ? (interiorFloors ?? []).some(
        (f) =>
          (f.description?.trim().length ?? 0) > 0 ||
          item.files.some((file) => file.floorId === f.id),
      )
    : !!item.clientNote?.trim() || item.files.length > 0;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card/80 transition-all hover:shadow-[0_4px_16px_rgba(28,26,25,0.03)]",
        isConfigured
          ? "border-border/40"
          : "border-[color:var(--color-ember)]/60 bg-gradient-to-br from-[color:var(--color-ember)]/[0.08] to-[color:var(--color-ember)]/[0.02] shadow-[0_4px_16px_-8px_rgba(200,154,60,0.25)]",
      )}
    >
      {/* Header — always visible */}
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-5 text-left transition-colors hover:bg-foreground/[0.015]"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                {item.productLabel}
              </h3>
              {isConfigured ? (
                <span className="inline-flex items-center gap-1 rounded bg-[color:var(--color-sage)]/15 px-1.5 py-0.5 text-[0.62rem] font-semibold text-[color:var(--color-sage-deep)]">
                  <span className="h-1 w-1 rounded-full bg-[color:var(--color-sage-deep)]" />
                  Podešeno
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded bg-[color:var(--color-ember)]/20 px-2 py-0.5 text-[0.72rem] font-bold uppercase tracking-wider text-[color:var(--color-ember-deep)]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--color-ember)]/70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--color-ember-deep)]" />
                  </span>
                  Potrebni podaci
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {item.categoryLabel} ·{" "}
              {(() => {
                const { primary, struck } = formatDiscountedPrice(
                  item.totalEur,
                  item.originalTotalEur ?? item.totalEur,
                  item.discountPct ?? 0,
                );
                return struck ? (
                  <>
                    <span className="text-muted-foreground/60 line-through">
                      {struck}
                    </span>{" "}
                    <span className="font-semibold text-foreground">
                      {primary}
                    </span>
                  </>
                ) : (
                  <>{primary}</>
                );
              })()}
            </p>
            {item.discountReason && (
              <p className="mt-0.5 text-[0.68rem] text-[color:var(--color-sage-deep)]">
                {item.discountReason}
              </p>
            )}
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-300",
              expanded && "rotate-180",
            )}
          />
        </button>

        {canDelete && (
          <div className="flex items-center gap-2 pr-5">
            {!confirmDelete ? (
              <button
                type="button"
                aria-label="Ukloni stavku"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConfirmDelete(true);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground/50 transition-all hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            ) : (
              <div className="inline-flex items-center gap-0.5 rounded-md bg-destructive/10 p-0.5 text-destructive animate-in fade-in slide-in-from-right-1 duration-150">
                <span className="px-1.5 text-[0.72rem] font-semibold">Ukloniti?</span>
                <button
                  type="button"
                  disabled={deletePending}
                  onClick={handleDeleteItem}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-sm transition-colors hover:bg-destructive hover:text-white disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expanded content */}
      <Collapsible open={expanded}>
        <div className="border-t border-border/30 p-5 space-y-5">
          {isInterior ? (
            <InteriorConfigSection
              itemId={item.id}
              orderId={item.orderId}
              initialFloors={interiorFloors}
              files={item.files}
              editable={canDelete}
            />
          ) : isTour360 ? (
            <Tour360ConfigSection
              itemId={item.id}
              orderId={item.orderId}
              initialConfig={tour360Config}
              files={item.files}
              editable={canDelete}
            />
          ) : isLandscape && landscapeConfig ? (
            <LandscapeConfigSection
              itemId={item.id}
              orderId={item.orderId}
              initialConfig={landscapeConfig}
              files={item.files}
              editable={canDelete}
            />
          ) : isFloorplan && floorplanConfig ? (
            <FloorplanConfigSection
              itemId={item.id}
              orderId={item.orderId}
              initialConfig={floorplanConfig}
              files={item.files}
              editable={canDelete}
            />
          ) : isFloorplan2d && floorplan2dConfig ? (
            <Floorplan2dConfigSection
              itemId={item.id}
              orderId={item.orderId}
              initialConfig={floorplan2dConfig}
              files={item.files}
              editable={canDelete}
            />
          ) : isSiteplan && siteplanConfig ? (
            <SiteplanConfigSection
              itemId={item.id}
              orderId={item.orderId}
              initialConfig={siteplanConfig}
              files={item.files}
              editable={canDelete}
            />
          ) : isStaging && stagingConfig ? (
            <StagingConfigSection
              itemId={item.id}
              orderId={item.orderId}
              productId={item.productId as "vs-static" | "vs-360"}
              initialConfig={stagingConfig}
              files={item.files}
              editable={canDelete}
            />
          ) : (
            <NonInteriorBody
              item={item}
              files={item.files}
              canDelete={canDelete}
            />
          )}
        </div>
      </Collapsible>
    </div>
  );
}

// ─── Non-interior body (simple + advanced, as before) ──────────────────

function NonInteriorBody({
  item,
  files,
  canDelete,
}: {
  item: ItemData;
  files: ItemFile[];
  canDelete: boolean;
}) {
  const [advanced, setAdvanced] = useState(false);
  const [note, setNote] = useState(item.clientNote ?? "");
  const [styleDesc, setStyleDesc] = useState(
    (item.configJson?.styleDescription as string) ?? "",
  );
  const [roomDetails, setRoomDetails] = useState(
    (item.configJson?.roomDetails as string) ?? "",
  );
  const [techNotes, setTechNotes] = useState(
    (item.configJson?.technicalNotes as string) ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSave = async () => {
    setSaving(true);
    await updateItemConfig(item.id, {
      clientNote: note || undefined,
      configJson: advanced
        ? { styleDescription: styleDesc, roomDetails, technicalNotes: techNotes }
        : undefined,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  };

  const uploadFile = useCallback(
    async (file: File, kind: string) => {
      setUploading((prev) => [...prev, file.name]);
      try {
        const urlRes = await fetch("/api/checkout/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: item.orderId,
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
          item.orderId,
          item.id,
          file.name,
          file.size,
          file.type,
          storagePath,
          kind,
        );
        router.refresh();
      } catch {}
      setUploading((prev) => prev.filter((n) => n !== file.name));
    },
    [item.orderId, item.id, router],
  );

  const formatSize = (b: number) =>
    b < 1024 * 1024
      ? `${(b / 1024).toFixed(0)} KB`
      : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <>
      {/* Advanced toggle — at top */}
      <label
        htmlFor={`advanced-${item.id}`}
        className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-secondary/30 px-4 py-3"
      >
        <div className="flex items-center gap-2">
              <Settings2 className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-medium text-foreground">
                Napredno podešavanje
              </span>
              <span className="text-[0.72rem] text-muted-foreground">
                · reference, detalji po sobi, tehničke napomene
              </span>
            </div>
            <Switch
              id={`advanced-${item.id}`}
              checked={advanced}
              onCheckedChange={setAdvanced}
            />
          </label>

          {/* Simple mode: description */}
          <div className="space-y-2">
            <Label htmlFor={`note-${item.id}`} className="text-xs">
              <Pencil className="h-3 w-3 text-accent/60" />
              Opis projekta za ovu stavku
            </Label>
            <Textarea
              id={`note-${item.id}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Opišite šta želite — stil, atmosferu, posebne zahteve…"
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          {/* Simple mode: file upload */}
          <div className="space-y-2">
            <Label className="text-xs">Osnove i fotografije</Label>
            <div
              onClick={() => inputRef.current?.click()}
              className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border/40 px-4 py-4 transition-colors hover:border-accent/40"
            >
              <Upload className="mr-2 h-4 w-4 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground">
                Prevucite ili kliknite — osnove, foto, skice
              </span>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={(e) =>
                  e.target.files &&
                  Array.from(e.target.files).forEach((f) => uploadFile(f, "source"))
                }
                className="hidden"
              />
            </div>
          </div>

          {/* Uploaded files for this item */}
          {(files.length > 0 || uploading.length > 0) && (
            <div className="space-y-1.5">
              {files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2 text-xs"
                >
                  <FileUp className="h-3 w-3 text-muted-foreground" />
                  <span className="flex-1 truncate text-foreground">{f.fileName}</span>
                  <span className="text-muted-foreground">{formatSize(f.fileSize)}</span>
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[0.62rem] text-muted-foreground">
                    {f.kind}
                  </span>
                </div>
              ))}
              {uploading.map((name) => (
                <div
                  key={name}
                  className="flex items-center gap-2 rounded-lg bg-accent/5 px-3 py-2 text-xs"
                >
                  <FileUp className="h-3 w-3 text-accent" />
                  <span className="flex-1 truncate text-foreground">{name}</span>
                  <span className="text-accent">Otpremanje…</span>
                </div>
              ))}
            </div>
          )}

          {/* Advanced mode */}
          <Collapsible open={advanced}>
            <div className="space-y-4 rounded-xl border border-border/30 bg-secondary/20 p-4">
              <div className="space-y-2">
                <Label htmlFor={`style-${item.id}`} className="text-xs">
                  <Pencil className="h-3 w-3 text-accent/60" />
                  Reference stila i atmosfera
                </Label>
                <Textarea
                  id={`style-${item.id}`}
                  value={styleDesc}
                  onChange={(e) => setStyleDesc(e.target.value)}
                  placeholder="Opišite željeni stil — moderna, skandinavska, minimalistička, topla…"
                  rows={2}
                  className="resize-none text-sm"
                />
                <div
                  onClick={() => refInputRef.current?.click()}
                  className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-border/40 px-3 py-3 transition-colors hover:border-accent/40"
                >
                  <Upload className="mr-2 h-3.5 w-3.5 text-muted-foreground/40" />
                  <span className="text-[0.72rem] text-muted-foreground">
                    Upload slika inspiracije (mood board)
                  </span>
                  <input
                    ref={refInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) =>
                      e.target.files &&
                      Array.from(e.target.files).forEach((f) =>
                        uploadFile(f, "reference"),
                      )
                    }
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`rooms-${item.id}`} className="text-xs">
                  <Pencil className="h-3 w-3 text-accent/60" />
                  Detalji po prostoriji
                </Label>
                <Textarea
                  id={`rooms-${item.id}`}
                  value={roomDetails}
                  onChange={(e) => setRoomDetails(e.target.value)}
                  placeholder="Dnevna soba: svetli tonovi, drveni pod&#10;Spavaća: tamni zidovi, tople boje&#10;Kuhinja: moderna, beli elementi"
                  rows={4}
                  className="resize-none text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`tech-${item.id}`} className="text-xs">
                  <Pencil className="h-3 w-3 text-accent/60" />
                  Tehničke napomene
                </Label>
                <Textarea
                  id={`tech-${item.id}`}
                  value={techNotes}
                  onChange={(e) => setTechNotes(e.target.value)}
                  placeholder="Format isporuke, rezolucija, posebni zahtevi…"
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>
            </div>
          </Collapsible>

          {/* Save button */}
          <div className="flex items-center justify-between">
            <p className="text-[0.72rem] text-muted-foreground">
              Fajlovi se čuvaju automatski. Kliknite sačuvaj za opis i podešavanja.
            </p>
            <Button
              variant="accent"
              size="sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saved ? (
                <>
                  <Check className="mr-1 h-3 w-3" /> Sačuvano
                </>
              ) : saving ? (
                "Čuvanje…"
              ) : (
                "Sačuvaj"
              )}
            </Button>
          </div>
    </>
  );
}
