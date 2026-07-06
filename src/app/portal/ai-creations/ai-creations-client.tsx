"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Download,
  ImageIcon,
  Loader2,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/portal/empty-state";
import { cn } from "@/lib/utils";
import {
  AI_EDIT_TYPES,
  formatCreditsFromUnits,
  getAiEditType,
  getAiEngineLabelForGeneration,
  type AiEditType,
} from "@/lib/ai-studio/catalog";
import type {
  AiGenerationStatusValue,
  AiStudioGenerationListResult,
  SignedAiGeneration,
} from "@/server/actions/ai-studio";

type Props = {
  initialState: AiStudioGenerationListResult;
};

const PAGE_SIZE = 24;

const STATUS_LABELS: Record<AiGenerationStatusValue | "all", string> = {
  all: "All statuses",
  queued: "Queued",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

export function AiCreationsClient({ initialState }: Props) {
  const [items, setItems] = useState<SignedAiGeneration[]>(
    initialState.generations ?? [],
  );
  const [nextCursor, setNextCursor] = useState(initialState.nextCursor ?? null);
  const [statusFilter, setStatusFilter] =
    useState<AiGenerationStatusValue | "all">("all");
  const [editTypeFilter, setEditTypeFilter] = useState<AiEditType | "all">("all");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState(initialState.error ?? "");
  const firstFilterRender = useRef(true);

  const hasFilters = statusFilter !== "all" || editTypeFilter !== "all";
  const completedCount = useMemo(
    () => items.filter((item) => item.status === "completed").length,
    [items],
  );

  const loadPage = async ({
    cursor,
    reset,
    signal,
  }: {
    cursor?: string | null;
    reset?: boolean;
    signal?: AbortSignal;
  } = {}) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      status: statusFilter,
      editType: editTypeFilter,
    });
    if (cursor) params.set("cursor", cursor);

    try {
      const response = await fetch(`/api/ai-studio/generations?${params}`, {
        cache: "no-store",
        signal,
      });
      const data = (await response.json()) as AiStudioGenerationListResult;
      if (data.error) {
        setError(data.error);
        return;
      }
      setItems((prev) =>
        reset ? data.generations ?? [] : [...prev, ...(data.generations ?? [])],
      );
      setNextCursor(data.nextCursor ?? null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("AI creations are currently unavailable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (firstFilterRender.current) {
      firstFilterRender.current = false;
      return;
    }
    const controller = new AbortController();
    void loadPage({ reset: true, signal: controller.signal });
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, editTypeFilter]);

  const handleDelete = async (generation: SignedAiGeneration) => {
    if (generation.status === "queued" || generation.status === "processing") {
      setError("The generation is still running. Wait for it to finish before deleting it.");
      return;
    }
    const confirmed = window.confirm(
      "Permanently delete this AI creation and its files? This action cannot be undone.",
    );
    if (!confirmed) return;

    const previous = items;
    setDeletingId(generation.id);
    setItems((prev) => prev.filter((item) => item.id !== generation.id));
    setError("");

    try {
      const response = await fetch(
        `/api/ai-studio/generations/${generation.id}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok || data.error) {
        setItems(previous);
        setError(data.error ?? "Delete failed.");
      }
    } catch {
      setItems(previous);
      setError("Delete failed. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Portal
          </p>
          <h1 className="mt-1 font-heading text-3xl text-foreground md:text-4xl">
            AI creations
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Review all AI generations, download results, and reuse a completed
            image in AI Studio.
          </p>
        </div>
        <Link
          href="/portal/ai-studio"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-[0_14px_34px_-12px_rgba(159,106,75,0.45)] transition-colors hover:bg-accent/90"
        >
          <Sparkles className="h-4 w-4" />
          New generation
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatPill label="In list" value={items.length} />
        <StatPill label="Completed" value={completedCount} />
        <StatPill label="Status" value={hasFilters ? "Filter" : "All"} />
      </div>

      <div className="flex flex-wrap gap-3 rounded-2xl border border-border/40 bg-card/60 p-3">
        <label className="min-w-[180px] flex-1 text-xs font-semibold text-muted-foreground">
          Status
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as AiGenerationStatusValue | "all")
            }
            className="mt-1 h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm font-medium text-foreground outline-none focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[220px] flex-1 text-xs font-semibold text-muted-foreground">
          Edit type
          <select
            value={editTypeFilter}
            onChange={(event) =>
              setEditTypeFilter(event.target.value as AiEditType | "all")
            }
            className="mt-1 h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm font-medium text-foreground outline-none focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="all">All obrade</option>
            {AI_EDIT_TYPES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {items.length === 0 && !loading ? (
        <EmptyState
          icon={Wand2}
          heading={hasFilters ? "No creations match the selected filter" : "No AI creations yet"}
          description={
            hasFilters
              ? "Change the filters or start a new generation."
              : "When you start an AI generation, the result will appear here."
          }
          action={{ label: "Open AI Studio", href: "/portal/ai-studio" }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <AiCreationCard
              key={item.id}
              item={item}
              deleting={deletingId === item.id}
              onDelete={() => void handleDelete(item)}
            />
          ))}
        </div>
      )}

      <div className="flex justify-center">
        {nextCursor ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadPage({ cursor: nextCursor })}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load more"
            )}
          </Button>
        ) : loading ? (
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </p>
        ) : null}
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 px-4 py-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-heading text-2xl text-foreground">{value}</p>
    </div>
  );
}

function AiCreationCard({
  item,
  deleting,
  onDelete,
}: {
  item: SignedAiGeneration;
  deleting: boolean;
  onDelete: () => void;
}) {
  const edit = getAiEditType(item.editType);
  const completed = item.status === "completed";
  const canUse = completed && item.resultUrl && item.resultStoragePath && !item.filesExpired;
  const canDelete = item.status === "completed" || item.status === "failed";

  return (
    <article className="overflow-hidden rounded-2xl border border-border/40 bg-card/60 shadow-[0_4px_16px_rgba(28,26,25,0.03)]">
      <div className="relative aspect-[4/3] bg-secondary/50">
        {item.resultUrl && !item.filesExpired ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.resultUrl}
            alt={edit.label}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            {item.status === "failed" ? (
              <AlertTriangle className="h-7 w-7 text-destructive" />
            ) : item.status === "queued" || item.status === "processing" ? (
              <Loader2 className="h-7 w-7 animate-spin text-accent" />
            ) : (
              <ImageIcon className="h-7 w-7" />
            )}
            <span className="text-sm">
              {item.filesExpired ? "File expired" : STATUS_LABELS[item.status]}
            </span>
          </div>
        )}
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm",
            item.status === "completed"
              ? "bg-[color:var(--color-sage)]/90 text-white"
              : item.status === "failed"
                ? "bg-destructive/90 text-white"
                : "bg-accent/90 text-accent-foreground",
          )}
        >
          {STATUS_LABELS[item.status]}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h2 className="truncate text-sm font-semibold text-foreground">
            {edit.label}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {new Date(item.createdAt).toLocaleDateString("en-GB")} ·{" "}
            {getAiEngineLabelForGeneration(item.provider, item.model)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatCreditsFromUnits(item.unitsCharged)}
          </p>
        </div>

        {item.resultFileName && (
          <p className="truncate font-mono text-[0.68rem] text-muted-foreground">
            {item.resultFileName}
          </p>
        )}

        {item.errorMessage && (
          <p className="line-clamp-2 text-xs text-destructive">
            {item.errorMessage}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {canUse && (
            <Link
              href={`/portal/ai-studio?sourceGeneration=${item.id}`}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border/40 bg-card/60 px-3 text-[0.8rem] font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-card/80"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Use
            </Link>
          )}
          {item.downloadUrl && !item.filesExpired && (
            <a
              href={item.downloadUrl}
              download
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border/40 bg-card/60 px-3 text-[0.8rem] font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-card/80"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
          )}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={!canDelete || deleting}
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Delete
          </Button>
        </div>
      </div>
    </article>
  );
}
