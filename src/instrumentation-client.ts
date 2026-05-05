// Client (browser) instrumentation. Sentry (errors / tracing / replay)
// and PostHog (analytics / session recording) are both gated behind
// the user's cookie consent. We do not initialize either until the
// user grants the "analytics" permission in src/lib/consent.ts —
// without consent, no third-party telemetry network calls are made.
//
// The decision is read from localStorage on load; subsequent changes
// arrive via the er-consent-change CustomEvent dispatched by
// writeConsent() / acceptAll() / acceptNecessary(). When consent is
// revoked we best-effort stop new collection (PostHog opt_out, Sentry
// sample rates 0). Already-captured events stay in the providers'
// systems; users can request deletion via the contact email.

import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import {
  CONSENT_CHANGE_EVENT,
  readConsent,
  type ConsentPrefs,
} from "@/lib/consent";

let sentryStarted = false;
let posthogStarted = false;

function startSentry(prefs: ConsentPrefs) {
  if (sentryStarted) return;
  sentryStarted = true;

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // 100% in dev, 10% in prod — tracing volume scales with traffic so
    // sampling here keeps the Sentry bill predictable.
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

    // Session replay only with the explicit "recording" sub-consent —
    // it captures DOM, which is closer to PII than aggregate metrics.
    replaysSessionSampleRate: prefs.recording ? 0.1 : 0,
    replaysOnErrorSampleRate: prefs.recording ? 1.0 : 0,

    environment:
      process.env.NEXT_PUBLIC_VERCEL_ENV ??
      process.env.NODE_ENV ??
      "development",

    enableLogs: true,

    // PII (IP, headers, cookies, breadcrumb URLs) only flows when the
    // user explicitly accepted analytics tracking.
    sendDefaultPii: prefs.analytics,

    integrations: prefs.recording ? [Sentry.replayIntegration()] : [],
  });
}

function startPostHog(prefs: ConsentPrefs) {
  if (posthogStarted) return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthogStarted = true;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    defaults: "2026-01-30",
    person_profiles: "identified_only",
    autocapture: process.env.NODE_ENV === "production",
    capture_pageview: "history_change",
    capture_pageleave: true,
    session_recording: {
      sampleRate:
        prefs.recording && process.env.NODE_ENV === "production" ? 0.25 : 0,
    },
  });
}

function applyConsent(prefs: ConsentPrefs | null) {
  if (!prefs?.analytics) {
    // Either no decision yet, or the user opted out. Nothing should
    // boot. If providers were already started in this session and the
    // user just revoked, stop new collection best-effort.
    if (posthogStarted) posthog.opt_out_capturing();
    return;
  }

  startSentry(prefs);
  startPostHog(prefs);
  if (posthogStarted) posthog.opt_in_capturing();
}

if (typeof window !== "undefined") {
  applyConsent(readConsent());
  window.addEventListener(CONSENT_CHANGE_EVENT, (event) => {
    const next = (event as CustomEvent<ConsentPrefs>).detail ?? readConsent();
    applyConsent(next);
  });
}

// App Router navigation transitions — exposed even before Sentry boots
// so Next.js's instrumentation hook always has something to call. The
// SDK no-ops if init() hasn't run.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
