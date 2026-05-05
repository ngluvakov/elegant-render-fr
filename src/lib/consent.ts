/**
 * consent.ts — Client-side cookie/tracking consent storage.
 *
 * Stores the user's choice in localStorage. Two custom events tie the
 * pieces together:
 *   - "er-consent-change"   fires when the saved value is updated;
 *                           instrumentation-client listens to (de)init
 *                           Sentry and PostHog.
 *   - "er-open-consent"     dispatched by the footer "Cookie settings"
 *                           link to re-open the banner after a decision.
 *
 * `necessary` is locked to true — it covers strictly-required
 * functionality (auth session, CSRF, consent state itself). The user
 * cannot opt out of it.
 */

export const CONSENT_VERSION = 1 as const;
export const CONSENT_STORAGE_KEY = "er-consent";
export const CONSENT_CHANGE_EVENT = "er-consent-change";
export const CONSENT_OPEN_EVENT = "er-open-consent";

export type ConsentPrefs = {
  version: typeof CONSENT_VERSION;
  necessary: true;
  analytics: boolean;
  recording: boolean;
  decidedAt: string;
};

export function readConsent(): ConsentPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentPrefs>;
    if (parsed?.version !== CONSENT_VERSION) return null;
    return {
      version: CONSENT_VERSION,
      necessary: true,
      analytics: Boolean(parsed.analytics),
      recording: Boolean(parsed.recording),
      decidedAt: typeof parsed.decidedAt === "string" ? parsed.decidedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeConsent(prefs: Omit<ConsentPrefs, "version" | "necessary" | "decidedAt">): ConsentPrefs {
  const next: ConsentPrefs = {
    version: CONSENT_VERSION,
    necessary: true,
    analytics: prefs.analytics,
    recording: prefs.recording,
    decidedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: next }));
  }
  return next;
}

export function acceptAll(): ConsentPrefs {
  return writeConsent({ analytics: true, recording: true });
}

export function acceptNecessary(): ConsentPrefs {
  return writeConsent({ analytics: false, recording: false });
}

/** Re-open the banner from anywhere (e.g. footer link). */
export function openConsentBanner(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CONSENT_OPEN_EVENT));
}
