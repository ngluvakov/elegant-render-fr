/**
 * GenerationDetailModal — In-depth view of a single AI Studio generation.
 *
 * Opens when a customer clicks a history item. Shows side-by-side
 * input + result, the full settings used (edit type, mode, provider,
 * style, prompt, options, color, units, free attempt index), and
 * lets the customer download both files with names tied to the
 * original upload (kuhinja-image.jpg → kuhinja-image__staging__v01__20260428.jpg).
 *
 * Two action buttons:
 *  - "Use result as a new working image" — feeds the result back
 *    into the workspace as the next input.
 *  - "Repeat with the same settings" — prefills controls and the
 *    same input image for a fresh run, using parent linkage so the
 *    customer's free-retry pool applies.
 */
"use client";

import { useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  RefreshCw,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AI_FREE_REGENERATIONS,
  AI_STYLE_OPTIONS,
  formatCreditsFromUnits,
  formatSelectedOptionLabels,
  getAiEngineLabelForGeneration,
  getAiEditType,
  type AiEditType,
  type AiImageProvider,
} from "@/lib/ai-studio/catalog";

export type GenerationDetail = {
  id: string;
  parentGenerationId: string | null;
  editType: AiEditType;
  provider: AiImageProvider;
  model: string;
  prompt: string;
  styleId: string | null;
  selectedOption: string | null;
  colorHex: string | null;
  objectMode: "insert" | "replace";
  maskInverted: boolean;
  hasMask: boolean;
  status: "queued" | "processing" | "completed" | "failed";
  unitsCharged: number;
  freeAttemptIndex: number | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  inputUrl: string | null;
  referenceStoragePath: string | null;
  referenceUrl: string | null;
  referenceImages: ReferenceImageDetail[];
  resultUrl: string | null;
  inputDownloadUrl: string | null;
  referenceDownloadUrl: string | null;
  downloadUrl: string | null;
  rootFileName: string | null;
  inputFileName: string | null;
  referenceFileName: string | null;
  resultFileName: string | null;
  parentResultFileName: string | null;
  filesExpired: boolean;
};

type ReferenceImageDetail = {
  id: string;
  sortOrder: number;
  storagePath: string;
  mimeType: string;
  fileName: string | null;
  url: string | null;
  downloadUrl: string | null;
  isLegacyPreparedReference: boolean;
};

type Props = {
  open: boolean;
  generation: GenerationDetail | null;
  parentResultFileName?: string | null;
  // How many free retries are still available on this generation's paid
  // root chain. >0 → "Repeat" submits as a free retry (subject to
  // editType match on the server). Computed in workspace from history.
  freeRetriesRemaining: number;
  onClose: () => void;
  onUseResultAsInput: (generation: GenerationDetail) => void;
  onRepeatWithSameSettings: (generation: GenerationDetail) => void;
  onDelete: (generation: GenerationDetail) => void;
  deleting?: boolean;
};

const STATUS_LABEL: Record<GenerationDetail["status"], string> = {
  queued: "Queued",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function findStyleLabel(
  editType: AiEditType,
  styleId: string | null,
): string | null {
  if (!styleId || styleId === "none") return null;
  const def = getAiEditType(editType);
  if (!def.supportsStyles) return null;
  return AI_STYLE_OPTIONS.find((s) => s.id === styleId)?.label ?? styleId;
}

export function GenerationDetailModal({
  open,
  generation,
  parentResultFileName,
  freeRetriesRemaining,
  onClose,
  onUseResultAsInput,
  onRepeatWithSameSettings,
  onDelete,
  deleting = false,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !generation) return null;

  const editDef = getAiEditType(generation.editType);
  const optionLabel = formatSelectedOptionLabels(
    generation.editType,
    generation.selectedOption,
  );
  const styleLabel = findStyleLabel(generation.editType, generation.styleId);
  const providerLabel = getAiEngineLabelForGeneration(
    generation.provider,
    generation.model,
  );
  const canDownloadInput = Boolean(generation.inputDownloadUrl) && !generation.filesExpired;
  const canDownloadResult =
    Boolean(generation.downloadUrl) &&
    generation.status === "completed" &&
    !generation.filesExpired;
  const canUseResult = canDownloadResult && Boolean(generation.resultUrl);
  const canDelete = generation.status === "completed" || generation.status === "failed";
  const isDerivative = Boolean(generation.parentGenerationId);
  const referenceImages =
    generation.referenceImages.length > 0
      ? generation.referenceImages
      : generation.referenceUrl
        ? [
            {
              id: "legacy-primary",
              sortOrder: 0,
              storagePath: "",
              mimeType: "image/jpeg",
              fileName: generation.referenceFileName,
              url: generation.referenceUrl,
              downloadUrl: generation.referenceDownloadUrl,
              isLegacyPreparedReference:
                generation.referenceStoragePath?.includes("/prepared-references/") ===
                true,
            },
          ]
        : [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-lg border border-border/40 bg-card/95 shadow-xl backdrop-blur">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border/40 bg-card/95 px-6 py-4 backdrop-blur">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold font-mono uppercase tracking-[0.08em] text-muted-foreground">
              {STATUS_LABEL[generation.status]} · {providerLabel}
            </p>
            <h2 className="mt-1 truncate font-heading text-xl text-foreground md:text-2xl">
              {editDef.label}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDateTime(generation.completedAt ?? generation.createdAt)}
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {generation.filesExpired && (
            <div className="flex items-start gap-2 rounded-xl border border-border/40 bg-muted/40 p-3 text-xs text-muted-foreground">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Files for this generation have expired (they are kept for 30
              days). The text record of the settings was saved.
            </div>
          )}

          <div
            className={
              referenceImages.length > 0
                ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                : "grid gap-4 md:grid-cols-2"
            }
          >
            <ImagePane
              title="Image to edit"
              fileName={generation.inputFileName}
              url={generation.inputUrl}
              downloadUrl={canDownloadInput ? generation.inputDownloadUrl : null}
              emptyHint="Original upload"
              fileExpired={generation.filesExpired}
            />
            {referenceImages.length > 0 && (
              <ReferenceImagesPane
                references={referenceImages}
                fileExpired={generation.filesExpired}
              />
            )}
            <ImagePane
              title="Result"
              fileName={generation.resultFileName}
              url={generation.status === "completed" ? generation.resultUrl : null}
              downloadUrl={canDownloadResult ? generation.downloadUrl : null}
              emptyHint={
                generation.status === "failed"
                  ? generation.errorMessage ?? "The generation failed."
                  : generation.status === "queued"
                    ? "Queued…"
                    : generation.status === "processing"
                      ? "Processing…"
                      : "The result is not available."
              }
              fileExpired={generation.filesExpired}
            />
          </div>

          <div className="rounded-lg border border-border/40 bg-card/60 p-4">
            <h3 className="text-sm font-semibold text-foreground">Settings</h3>
            <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
              <SettingRow label="Edit type" value={editDef.label} />
              <SettingRow
                label="Billing"
                value={
                  generation.unitsCharged === 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[0.7rem] font-semibold text-foreground">
                      Free attempt #{generation.freeAttemptIndex ?? 1}
                    </span>
                  ) : generation.freeAttemptIndex !== null ? (
                    <span className="text-foreground">
                      Additional charge {formatCreditsFromUnits(generation.unitsCharged)}{" "}
                      <span className="text-muted-foreground">
                        · free #{generation.freeAttemptIndex}
                      </span>
                    </span>
                  ) : (
                    formatCreditsFromUnits(generation.unitsCharged)
                  )
                }
              />
              <SettingRow label="Engine" value={`${providerLabel} · ${generation.model}`} />
              {generation.editType === "object_insertion" && (
                <SettingRow
                  label="Furniture/decor"
                  value={
                    generation.objectMode === "replace"
                      ? "Replace existing item"
                      : "Add item"
                  }
                />
              )}
              <SettingRow
                label="Mode"
                value={generation.hasMask ? "Advanced (with mask)" : "Simple"}
              />
              {styleLabel && <SettingRow label="Style" value={styleLabel} />}
              {optionLabel && (
                <SettingRow
                  label={editDef.optionsLabel ?? "Option"}
                  value={optionLabel}
                />
              )}
              {generation.colorHex && (
                <SettingRow
                  label="Color"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="h-3 w-3 rounded border border-border/40"
                        style={{ backgroundColor: generation.colorHex }}
                      />
                      {generation.colorHex}
                    </span>
                  }
                />
              )}
              {isDerivative && parentResultFileName && (
                <SettingRow
                  label="Based on"
                  value={
                    <span className="font-mono text-[0.7rem] text-muted-foreground">
                      {parentResultFileName}
                    </span>
                  }
                />
              )}
              <SettingRow
                label="Free retry"
                value={
                  generation.status !== "completed" ? (
                    <span className="text-muted-foreground">—</span>
                  ) : freeRetriesRemaining > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[0.7rem] font-semibold text-foreground">
                      Available ({freeRetriesRemaining}/{AI_FREE_REGENERATIONS}) · same type
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Used</span>
                  )
                }
              />
            </dl>
            {generation.prompt && (
              <div className="mt-3 rounded-xl border border-border/30 bg-background/60 p-3">
                <p className="text-[0.62rem] font-semibold font-mono uppercase tracking-[0.08em] text-muted-foreground">
                  Prompt
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/85">
                  {generation.prompt}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={freeRetriesRemaining > 0 ? "accent" : "outline"}
              onClick={() => onRepeatWithSameSettings(generation)}
              disabled={!canDownloadInput}
            >
              <RefreshCw className="h-4 w-4" />
              {freeRetriesRemaining > 0
                ? "Repeat (free, same type)"
                : "Repeat (charged)"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onUseResultAsInput(generation)}
              disabled={!canUseResult}
            >
              <Wand2 className="h-4 w-4" />
              Continue from result (new charge)
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => onDelete(generation)}
              disabled={!canDelete || deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete creation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImagePane({
  title,
  fileName,
  url,
  downloadUrl,
  emptyHint,
  fileExpired,
}: {
  title: string;
  fileName: string | null;
  url: string | null;
  downloadUrl: string | null;
  emptyHint: string;
  fileExpired: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-card/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[0.62rem] font-semibold font-mono uppercase tracking-[0.08em] text-muted-foreground">
            {title}
          </p>
          {fileName && (
            <p className="mt-0.5 truncate font-mono text-[0.68rem] text-foreground/70">
              {fileName}
            </p>
          )}
        </div>
        {downloadUrl && (
          <a
            href={downloadUrl}
            download
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-foreground px-3 text-[0.72rem] font-semibold text-background"
          >
            <Download className="h-3 w-3" />
            Download
          </a>
        )}
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-border/30 bg-background/60">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={title}
            className="block aspect-[4/3] h-auto w-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground">
            {fileExpired ? (
              <Clock className="h-6 w-6 text-muted-foreground/40" />
            ) : (
              <CheckCircle2 className="h-6 w-6 text-muted-foreground/30" />
            )}
            <span className="px-4">{emptyHint}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ReferenceImagesPane({
  references,
  fileExpired,
}: {
  references: ReferenceImageDetail[];
  fileExpired: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-card/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[0.62rem] font-semibold font-mono uppercase tracking-[0.08em] text-muted-foreground">
            Furniture/decor / angles
          </p>
          <p className="mt-0.5 text-[0.68rem] text-foreground/70">
            {references.length} image{references.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {references.map((reference, index) => (
          <div
            key={reference.id}
            className="overflow-hidden rounded-xl border border-border/30 bg-background/60"
          >
            {reference.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={reference.url}
                alt={index === 0 ? "Primary item image" : `Item angle ${index + 1}`}
                className="block aspect-square w-full object-contain"
                draggable={false}
              />
            ) : (
              <div className="flex aspect-square flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                {fileExpired ? (
                  <Clock className="h-5 w-5 text-muted-foreground/40" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground/30" />
                )}
              </div>
            )}
            <div className="flex items-center justify-between gap-2 px-2 py-1.5">
              <div className="min-w-0">
                <p className="text-[0.62rem] font-semibold text-foreground">
                  {index === 0 ? "Primary" : `Angle ${index + 1}`}
                </p>
                {reference.isLegacyPreparedReference && (
                  <p className="mt-0.5 text-[0.56rem] font-semibold uppercase tracking-[0.12em] text-amber-600">
                    Old prepared reference
                  </p>
                )}
                {reference.fileName && (
                  <p className="truncate font-mono text-[0.58rem] text-muted-foreground">
                    {reference.fileName}
                  </p>
                )}
              </div>
              {reference.downloadUrl && !fileExpired && (
                <a
                  href={reference.downloadUrl}
                  download
                  className="inline-flex h-7 shrink-0 items-center justify-center rounded-md bg-foreground px-2 text-background"
                  aria-label={`Download item image ${index + 1}`}
                >
                  <Download className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[0.62rem] font-semibold font-mono uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-foreground/90">{value}</dd>
    </div>
  );
}

