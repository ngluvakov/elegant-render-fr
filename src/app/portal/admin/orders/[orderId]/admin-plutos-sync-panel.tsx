"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  PlutosActionResult,
  PlutosSyncSnapshot,
  PlutosTarget,
} from "@/server/plutos/types";

export type { PlutosSyncSnapshot } from "@/server/plutos/types";

export type PlutosSyncAction = (
  target: PlutosTarget,
  targetId: string,
) => Promise<PlutosActionResult>;

type Props = {
  target: PlutosTarget;
  targetId: string;
  sync: PlutosSyncSnapshot;
  requestAction?: PlutosSyncAction;
  refreshAction?: PlutosSyncAction;
  compact?: boolean;
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function AdminPlutosSyncPanel({
  target,
  targetId,
  sync,
  requestAction,
  refreshAction,
  compact = false,
}: Props) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<
    "request" | "refresh" | null
  >(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const runAction = (
    kind: "request" | "refresh",
    action: PlutosSyncAction,
  ) => {
    setPendingAction(kind);
    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await action(target, targetId);
        if (!result.ok) {
          setFeedback(humanReason(result.reason));
          return;
        }
        router.refresh();
      } catch {
        setFeedback("The request could not be completed. Try again.");
      } finally {
        setPendingAction(null);
      }
    });
  };

  const state = syncState(sync);
  const canRefresh = Boolean(
    sync.invoiceId || sync.syncedAt || sync.queueStatus === "succeeded",
  );
  const requestLabel =
    sync.queueStatus === "failed" || sync.lastError
      ? "Retry sync"
      : "Send to Plutos";

  return (
    <div
      className={
        compact
          ? "mt-3 border-t border-border/40 pt-3"
          : "rounded-lg border border-border/40 bg-card/60 p-5"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold text-foreground">Plutos</p>
            <Badge className={state.tone}>{state.label}</Badge>
            {sync.status && (
              <span className="text-[0.72rem] text-muted-foreground">
                Document: {humanStatus(sync.status)}
              </span>
            )}
          </div>
          <p className="mt-1 text-[0.72rem] text-muted-foreground">
            {statusDetail(sync)}
          </p>
          {sync.number && (
            <p className="mt-1 font-mono text-[0.7rem] text-muted-foreground">
              Plutos number: {sync.number}
            </p>
          )}
          {sync.sefStatus && (
            <p className="mt-1 text-[0.7rem] text-muted-foreground">
              SEF: {humanStatus(sync.sefStatus)}
            </p>
          )}
        </div>

        {(requestAction || (refreshAction && canRefresh)) && (
          <div className="flex flex-wrap items-center gap-2">
            {requestAction && !canRefresh && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pendingAction !== null}
                onClick={() => runAction("request", requestAction)}
              >
                <Send className="h-3.5 w-3.5" />
                {pendingAction === "request" ? "Sending..." : requestLabel}
              </Button>
            )}
            {refreshAction && canRefresh && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pendingAction !== null}
                onClick={() => runAction("refresh", refreshAction)}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    pendingAction === "refresh" ? "animate-spin" : ""
                  }`}
                />
                {pendingAction === "refresh"
                  ? "Refreshing..."
                  : "Refresh status"}
              </Button>
            )}
          </div>
        )}
      </div>

      {(feedback ||
        (sync.lastError &&
          sync.queueStatus !== "pending" &&
          sync.queueStatus !== "running")) && (
        <p
          aria-live="polite"
          className="mt-2 break-words text-[0.72rem] text-destructive"
        >
          {feedback ?? sync.lastError}
        </p>
      )}
    </div>
  );
}

function syncState(sync: PlutosSyncSnapshot): {
  label: string;
  tone: string;
} {
  if (sync.queueStatus === "pending" || sync.queueStatus === "running") {
    return {
      label: sync.queueStatus === "running" ? "Syncing" : "Queued",
      tone: "bg-accent/15 text-accent",
    };
  }
  if (sync.queueStatus === "failed" || sync.lastError) {
    return {
      label: "Sync failed",
      tone: "bg-destructive/15 text-destructive",
    };
  }
  if (sync.syncedAt || sync.invoiceId) {
    return {
      label: "Synced",
      tone: "bg-accent/15 text-foreground",
    };
  }
  return {
    label: "Not sent",
    tone: "bg-muted text-muted-foreground",
  };
}

function statusDetail(sync: PlutosSyncSnapshot): string {
  if (sync.syncedAt) {
    return `Last synced ${formatDate(sync.syncedAt)}.`;
  }
  if (sync.lastAttemptAt) {
    return `Last attempt ${formatDate(sync.lastAttemptAt)}.`;
  }
  if (sync.queueStatus === "pending") {
    return "The invoice is waiting in the outbox.";
  }
  if (sync.queueStatus === "running") {
    return "The outbox processor is sending the invoice.";
  }
  return "This invoice has not been sent to the accounting system.";
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function humanStatus(value: string): string {
  return value
    .trim()
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function humanReason(reason: string): string {
  if (reason === "not_admin") return "You do not have permission.";
  if (reason === "integration_disabled")
    return "Plutos sync is currently disabled.";
  if (reason === "order_not_found") return "Order was not found.";
  if (reason === "charge_not_found") return "Additional charge was not found.";
  if (reason === "invoice_not_issued")
    return "The invoice must be issued before it can be sent.";
  if (reason === "before_sync_cutoff")
    return "This invoice is earlier than the configured sync start date.";
  if (reason === "invalid_config")
    return "Plutos configuration is incomplete.";
  return `Plutos sync failed: ${reason}`;
}
