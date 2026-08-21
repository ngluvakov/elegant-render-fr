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
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-lg rounded-[4px] border border-border bg-card/95 p-4 shadow-[0_8px_24px_rgba(17,17,17,0.12)] backdrop-blur-md sm:inset-x-auto sm:right-5 sm:bottom-5 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent/12 text-foreground sm:h-9 sm:w-9">
          <Cookie className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="consent-banner-title" className="text-base font-medium text-foreground">
            Cookies &amp; confidentialité
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-sm">
            Nous utilisons des cookies nécessaires au fonctionnement du site.
            Les statistiques, la mesure marketing et l’enregistrement de
            session ne sont activés qu’avec votre consentement, pour nous
            aider à améliorer l’expérience.{" "}
            <Link
              href="/legal/cookies"
              className="text-foreground underline-offset-4 hover:underline"
            >
              En savoir plus sur les cookies
            </Link>
            .
          </p>
        </div>
        {view === "details" && (
          <button
            type="button"
            onClick={closeAndClear}
            aria-label="Fermer"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {view === "details" && (
        <div className="mt-5 space-y-3 border-t border-border/50 pt-4">
          <ConsentRow
            label="Nécessaires"
            description="Session, connexion, enregistrement de votre choix en matière de cookies. Toujours actifs."
            checked
            disabled
          />
          <ConsentRow
            label="Statistiques"
            description="Statistiques d’utilisation anonymes (PostHog, Google Analytics 4 / Tag Manager) et rapports d’erreurs (Sentry)."
            checked={analytics}
            onChange={setAnalytics}
          />
          <ConsentRow
            label="Marketing"
            description="Mesure des campagnes, des conversions et des audiences pour nos outils marketing."
            checked={marketing}
            onChange={setMarketing}
          />
          <ConsentRow
            label="Enregistrement de session"
            description="Enregistrements anonymes de l’utilisation du site — pour repérer où les acheteurs rencontrent des difficultés."
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
              className="inline-flex min-h-11 items-center justify-center rounded-[4px] bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-[#00c77e] active:bg-[#00b372] sm:flex-none"
            >
              Tout accepter
            </button>
            <button
              type="button"
              onClick={handleNecessaryOnly}
              className="inline-flex min-h-11 items-center justify-center rounded-[4px] border border-[#111111] bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-secondary sm:flex-none"
            >
              Tout refuser
            </button>
            <button
              type="button"
              onClick={() => setForceOpen(true)}
              className="col-span-2 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground sm:col-span-1 sm:text-sm"
            >
              <Settings className="h-3.5 w-3.5" />
              Paramètres
            </button>
          </>
        )}
        {view === "details" && (
          <>
            <button
              type="button"
              onClick={handleSavePrefs}
              className="inline-flex min-h-11 items-center justify-center rounded-[4px] bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-[#00c77e] active:bg-[#00b372] sm:flex-none"
            >
              Enregistrer mes choix
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="inline-flex min-h-11 items-center justify-center rounded-[4px] border border-[#111111] bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-secondary sm:flex-none"
            >
              Tout accepter
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
