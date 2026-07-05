/**
 * ConsentBanner — Bottom-right cookie/tracking consent dialog. Renders only
 * when the user hasn't decided yet (or when "Cookie settings" is reopened
 * from the footer via the er-open-consent event).
 *
 * Consent storage and event wiring lives in src/lib/consent.ts.
 * instrumentation-client.ts subscribes to the er-consent-change event
 * to (de)init Sentry + PostHog. Marketing tags listen separately.
 *
 * Hydration: useSyncExternalStore + a server sentinel snapshot ensures
 * the SSR pass and the client first render both return null from the
 * banner, then a second post-hydration render fills in based on
 * localStorage. No mismatch warning.
 */
"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Cookie, Settings, X } from "lucide-react";
import {
  CONSENT_CHANGE_EVENT,
  CONSENT_OPEN_EVENT,
  acceptAll,
  acceptNecessary,
  readConsent,
  writeConsent,
  type ConsentPrefs,
} from "@/lib/consent";

const SSR_SENTINEL = "__ssr__";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CONSENT_CHANGE_EVENT, callback);
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, callback);
}

function snapshotKey(prefs: ConsentPrefs | null): string {
  return prefs
    ? `${prefs.analytics}|${prefs.marketing}|${prefs.recording}|${prefs.decidedAt}`
    : "";
}

function getSnapshot() {
  return snapshotKey(readConsent());
}

function getServerSnapshot() {
  return SSR_SENTINEL;
}

type View = "hidden" | "summary" | "details";

export function ConsentBanner() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isServerOrFirstRender = snapshot === SSR_SENTINEL;
  const consent = isServerOrFirstRender ? null : readConsent();

  // forceOpen lifts the banner back into view after the user has already
  // decided — fired from the footer "Cookie settings" link.
  const [forceOpen, setForceOpen] = useState(false);

  // Form draft state. Re-syncs whenever the underlying consent snapshot
  // changes OR the user reopens the dialog. setState-during-render
  // pattern below is officially recommended by React for "adjust state
  // when an external value changes".
  // See https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [recording, setRecording] = useState(false);
  const draftKey = `${snapshot}|${forceOpen}`;
  const [lastDraftKey, setLastDraftKey] = useState("");
  if (draftKey !== lastDraftKey) {
    setLastDraftKey(draftKey);
    setAnalytics(consent?.analytics ?? false);
    setMarketing(consent?.marketing ?? false);
    setRecording(consent?.recording ?? false);
  }

  useEffect(() => {
    const onOpen = () => setForceOpen(true);
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, onOpen);
  }, []);

  // First-render-on-client (snapshot === SSR_SENTINEL): render null so
  // hydration is byte-identical to SSR. After hydration completes the
  // second render uses the real snapshot.
  if (isServerOrFirstRender) return null;

  let view: View;
  if (forceOpen) view = "details";
  else if (consent === null) view = "summary";
  else view = "hidden";

  if (view === "hidden") return null;

  const closeAndClear = () => {
    setForceOpen(false);
  };

  const handleAcceptAll = () => {
    acceptAll();
    closeAndClear();
  };

  const handleNecessaryOnly = () => {
    acceptNecessary();
    closeAndClear();
  };

  const handleSavePrefs = () => {
    writeConsent({ analytics, marketing, recording });
    closeAndClear();
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-banner-title"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-lg rounded-2xl border border-border/70 bg-card/95 p-4 shadow-[0_24px_60px_rgba(28,26,25,0.18)] backdrop-blur-md sm:inset-x-auto sm:right-5 sm:bottom-5 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent sm:h-9 sm:w-9">
          <Cookie className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="consent-banner-title" className="text-base font-semibold text-foreground">
            Kolačići i privatnost
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-sm">
            Koristimo neophodne kolačiće za rad sajta. Dodatnu analitiku,
            marketinško merenje i snimanje sesija uključujemo samo uz vašu
            saglasnost, da bismo popravili iskustvo.{" "}
            <Link
              href="/legal/cookies"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Više o kolačićima
            </Link>
            .
          </p>
        </div>
        {view === "details" && (
          <button
            type="button"
            onClick={closeAndClear}
            aria-label="Zatvori"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {view === "details" && (
        <div className="mt-5 space-y-3 border-t border-border/50 pt-4">
          <ConsentRow
            label="Neophodni"
            description="Sesija, prijava, čuvanje izbora kolačića. Uvek aktivni."
            checked
            disabled
          />
          <ConsentRow
            label="Analitika"
            description="Anonimne statistike o korišćenju (PostHog, Google Analytics 4 / Tag Manager) i izveštaji o greškama (Sentry)."
            checked={analytics}
            onChange={setAnalytics}
          />
          <ConsentRow
            label="Marketing"
            description="Merenje LinkedIn kampanja, konverzija i publike preko LinkedIn Insight Tag-a."
            checked={marketing}
            onChange={setMarketing}
          />
          <ConsentRow
            label="Snimanje sesija"
            description="Anonimna snimanja kretanja po sajtu — pomaže nam da nađemo mesta gde se kupci muče."
            checked={recording}
            onChange={setRecording}
          />
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:flex sm:flex-wrap">
        {view === "summary" && (
          <>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--color-clay-deep)] sm:flex-none"
            >
              Prihvati sve
            </button>
            <button
              type="button"
              onClick={handleNecessaryOnly}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary sm:flex-none"
            >
              Samo neophodne
            </button>
            <button
              type="button"
              onClick={() => setForceOpen(true)}
              className="col-span-2 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground sm:col-span-1 sm:text-sm"
            >
              <Settings className="h-3.5 w-3.5" />
              Podešavanja
            </button>
          </>
        )}
        {view === "details" && (
          <>
            <button
              type="button"
              onClick={handleSavePrefs}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--color-clay-deep)] sm:flex-none"
            >
              Sačuvaj izbor
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary sm:flex-none"
            >
              Prihvati sve
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ConsentRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-1 h-4 w-4 flex-shrink-0 cursor-pointer accent-accent disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={label}
      />
    </label>
  );
}
