/**
 * PrivacyActions — GDPR Art. 17 (erasure) + Art. 20 (portability)
 * controls in the user's profile.
 *
 * Export downloads a JSON snapshot via the /api/account/export route.
 * Deletion is request-based: clicking sets User.deletionRequestedAt,
 * fires an admin email, and switches the UI into "pending" mode where
 * the user can cancel before admin processes it.
 */
"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Download, Trash2 } from "lucide-react";
import {
  cancelAccountDeletion,
  requestAccountDeletion,
} from "@/server/actions/profile";

export function PrivacyActions({
  deletionRequestedAt,
}: {
  deletionRequestedAt: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportPending, setExportPending] = useState(false);

  const handleExport = async () => {
    setExportPending(true);
    try {
      const res = await fetch("/api/account/export");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Download failed (HTTP ${res.status}).`);
        return;
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") ?? "";
      const filenameMatch = /filename="?([^"]+)"?/.exec(cd);
      const filename = filenameMatch?.[1] ?? "elegant-render-data.json";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setExportPending(false);
    }
  };

  const handleRequest = () => {
    setError(null);
    startTransition(async () => {
      const result = await requestAccountDeletion();
      if (result.error) setError(result.error);
      setConfirming(false);
    });
  };

  const handleCancel = () => {
    setError(null);
    startTransition(async () => {
      const result = await cancelAccountDeletion();
      if (result.error) setError(result.error);
    });
  };

  return (
    <section className="mt-12 space-y-5 rounded-lg border border-border/60 bg-card/80 p-6 md:p-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Privacy</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your rights under GDPR Articles 20 and 17: download a copy of your
          data or request account deletion.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Export — always available */}
      <div className="rounded-xl border border-border/40 bg-background/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-medium text-foreground">
              Download a copy of your data
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              A JSON file with your profile, orders, comments, AI generations,
              and credit transactions. Binary file contents are downloaded
              separately from the portal.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={exportPending}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {exportPending ? "Preparing..." : "Download (.json)"}
          </button>
        </div>
      </div>

      {/* Deletion — pending banner OR action button */}
      {deletionRequestedAt ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                Account deletion request is in progress
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                The request was registered on{" "}
                <strong className="text-foreground">
                  {new Date(deletionRequestedAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </strong>
                . The team will process it within 30 days. We anonymize
                personal data while retaining accounting records for orders
                as legally required.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={pending}
                  className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary disabled:opacity-50"
                >
                  {pending ? "Processing..." : "Cancel request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border/40 bg-background/60 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-medium text-foreground">
                Request account deletion
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                We anonymize your personal data within 30 days. Invoices and
                orders are retained for accounting compliance, but without
                identifying personal data.
              </p>
            </div>
            {confirming ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRequest}
                  disabled={pending}
                  className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {pending ? "Processing..." : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={pending}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="inline-flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete account
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
