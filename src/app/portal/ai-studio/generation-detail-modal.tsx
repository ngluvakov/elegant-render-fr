/**
 * GenerationDetailModal — In-depth view of a single AI Studio generation.
 *
 * Opens when a customer clicks a history item. Shows side-by-side
 * input + result, the full settings used (edit type, mode, provider,
 * style, prompt, options, color, units, free attempt index), and
 * lets the customer download both files with names tied to the
 * original upload (kuhinja-slika.jpg → kuhinja-slika__staging__v01__20260428.jpg).
 *
 * Two action buttons:
 *  - "Koristi rezultat kao novu radnu sliku" — feeds the result back
 *    into the workspace as the next input.
 *  - "Ponovi sa istim podešavanjima" — prefills controls and the
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
  RefreshCw,
  Wand2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AI_IMAGE_PROVIDERS,
  AI_STYLE_OPTIONS,
  formatCreditsFromUnits,
  formatSelectedOptionLabels,
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
};

type Props = {
  open: boolean;
  generation: GenerationDetail | null;
  parentResultFileName?: string | null;
  onClose: () => void;
  onUseResultAsInput: (generation: GenerationDetail) => void;
  onRepeatWithSameSettings: (generation: GenerationDetail) => void;
};

const STATUS_LABEL: Record<GenerationDetail["status"], string> = {
  queued: "U redu za obradu",
  processing: "Obrada u toku",
  completed: "Završeno",
  failed: "Neuspešno",
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("sr-Latn-RS", {
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

function findProviderLabel(provider: AiImageProvider): string {
  return AI_IMAGE_PROVIDERS.find((p) => p.id === provider)?.label ?? provider;
}

export function GenerationDetailModal({
  open,
  generation,
  parentResultFileName,
  onClose,
  onUseResultAsInput,
  onRepeatWithSameSettings,
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
  const providerLabel = findProviderLabel(generation.provider);
  const canDownloadInput = Boolean(generation.inputDownloadUrl) && !generation.filesExpired;
  const canDownloadResult =
    Boolean(generation.downloadUrl) &&
    generation.status === "completed" &&
    !generation.filesExpired;
  const canUseResult = canDownloadResult && Boolean(generation.resultUrl);
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
      <div className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-border/40 bg-card/95 shadow-[0_24px_60px_rgba(28,26,25,0.18)] backdrop-blur">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border/40 bg-card/95 px-6 py-4 backdrop-blur">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {STATUS_LABEL[generation.status]} · {providerLabel}
            </p>
            <h2 className="mt-1 truncate font-heading text-xl text-foreground md:text-2xl">
              {editDef.label}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDateTime(generation.completedAt ?? generation.createdAt)}
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Zatvori">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {generation.filesExpired && (
            <div className="flex items-start gap-2 rounded-xl border border-border/40 bg-muted/40 p-3 text-xs text-muted-foreground">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Fajlovi za ovu obradu su istekli (čuvaju se 30 dana). Tekstualni
              zapis o podešavanjima je sačuvan.
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
              title="Slika za obradu"
              fileName={generation.inputFileName}
              url={generation.inputUrl}
              downloadUrl={canDownloadInput ? generation.inputDownloadUrl : null}
              emptyHint="Originalni upload"
              fileExpired={generation.filesExpired}
            />
            {referenceImages.length > 0 && (
              <ReferenceImagesPane
                references={referenceImages}
                fileExpired={generation.filesExpired}
              />
            )}
            <ImagePane
              title="Rezultat"
              fileName={generation.resultFileName}
              url={generation.status === "completed" ? generation.resultUrl : null}
              downloadUrl={canDownloadResult ? generation.downloadUrl : null}
              emptyHint={
                generation.status === "failed"
                  ? generation.errorMessage ?? "Obrada nije uspela."
                  : generation.status === "queued"
                    ? "U redu za obradu…"
                    : generation.status === "processing"
                      ? "Obrada u toku…"
                      : "Rezultat nije dostupan."
              }
              fileExpired={generation.filesExpired}
            />
          </div>

          <div className="rounded-2xl border border-border/40 bg-card/60 p-4">
            <h3 className="text-sm font-semibold text-foreground">Podešavanja</h3>
            <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
              <SettingRow label="Tip obrade" value={editDef.label} />
              <SettingRow
                label="Naplata"
                value={
                  generation.unitsCharged === 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-sage)]/15 px-2 py-0.5 text-[0.7rem] font-semibold text-[color:var(--color-sage-deep)]">
                      Besplatan pokušaj #{generation.freeAttemptIndex ?? 1}
                    </span>
                  ) : generation.freeAttemptIndex !== null ? (
                    <span className="text-foreground">
                      Doplata {formatCreditsFromUnits(generation.unitsCharged)}{" "}
                      <span className="text-muted-foreground">
                        · besplatan #{generation.freeAttemptIndex}
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
                  label="Objekat"
                  value={
                    generation.objectMode === "replace"
                      ? "Zamena postojećeg komada"
                      : "Dodavanje objekta"
                  }
                />
              )}
              <SettingRow
                label="Mod"
                value={generation.hasMask ? "Advanced (sa maskom)" : "Simple"}
              />
              {styleLabel && <SettingRow label="Stil" value={styleLabel} />}
              {optionLabel && (
                <SettingRow
                  label={editDef.optionsLabel ?? "Opcija"}
                  value={optionLabel}
                />
              )}
              {generation.colorHex && (
                <SettingRow
                  label="Boja"
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
                  label="Bazirano na"
                  value={
                    <span className="font-mono text-[0.7rem] text-muted-foreground">
                      {parentResultFileName}
                    </span>
                  }
                />
              )}
            </dl>
            {generation.prompt && (
              <div className="mt-3 rounded-xl border border-border/30 bg-background/60 p-3">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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
              variant="accent"
              onClick={() => onUseResultAsInput(generation)}
              disabled={!canUseResult}
            >
              <Wand2 className="h-4 w-4" />
              Koristi rezultat kao novu radnu sliku
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onRepeatWithSameSettings(generation)}
              disabled={!canDownloadInput}
            >
              <RefreshCw className="h-4 w-4" />
              Ponovi sa istim podešavanjima
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
    <div className="rounded-2xl border border-border/40 bg-card/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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
            Preuzmi
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
    <div className="rounded-2xl border border-border/40 bg-card/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Objekat / uglovi
          </p>
          <p className="mt-0.5 text-[0.68rem] text-foreground/70">
            {references.length} {references.length === 1 ? "slika" : "slika"}
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
                alt={index === 0 ? "Primarna slika objekta" : `Ugao objekta ${index + 1}`}
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
                  {index === 0 ? "Primarna" : `Ugao ${index + 1}`}
                </p>
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
                  aria-label={`Preuzmi sliku objekta ${index + 1}`}
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
      <dt className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-foreground/90">{value}</dd>
    </div>
  );
}

