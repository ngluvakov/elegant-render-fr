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
        setError(body.error ?? `Greška pri preuzimanju (HTTP ${res.status}).`);
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
      setError(err instanceof Error ? err.message : "Greška pri preuzimanju.");
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
    <section className="mt-12 space-y-5 rounded-2xl border border-border/60 bg-card/80 p-6 md:p-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Privatnost</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Vaša prava po članu 20. i članu 17. GDPR-a — preuzimanje kopije
          podataka i zahtev za brisanje naloga.
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
              Preuzmite kopiju svojih podataka
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              JSON fajl sa profilom, porudžbinama, komentarima, AI generisanjima
              i transakcijama kredita. Binarni sadržaji fajlova se preuzimaju
              odvojeno iz portala.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={exportPending}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {exportPending ? "Pripremam…" : "Preuzmi (.json)"}
          </button>
        </div>
      </div>

      {/* Deletion — pending banner OR action button */}
      {deletionRequestedAt ? (
        <div className="rounded-xl border border-[color:var(--color-clay-deep)]/30 bg-[color:var(--color-clay)]/10 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[color:var(--color-clay-deep)]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                Zahtev za brisanje naloga je u obradi
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Zahtev je registrovan{" "}
                <strong className="text-foreground">
                  {new Date(deletionRequestedAt).toLocaleDateString("sr-Latn-RS", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </strong>
                . Tim će obraditi zahtev u roku od 30 dana — anonimizujemo
                lične podatke uz zadržavanje računovodstvenih zapisa o
                porudžbinama (po Zakonu o računovodstvu, čuvanje 10 godina).
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={pending}
                  className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary disabled:opacity-50"
                >
                  {pending ? "Obrađujem…" : "Otkaži zahtev"}
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
                Zatražite brisanje naloga
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Anonimizujemo vaše lične podatke u roku od 30 dana. Računi i
                porudžbine zadržavaju se po Zakonu o računovodstvu (10 godina),
                ali bez identifikacionih podataka.
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
                  {pending ? "Obrađujem…" : "Potvrdi"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={pending}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  Otkaži
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="inline-flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Obriši nalog
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
