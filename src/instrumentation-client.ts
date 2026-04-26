// Client (browser) instrumentation. Loaded automatically by Next.js
// as the client-side instrumentation hook. Initializes both Sentry
// (errors / tracing / session replay) and PostHog (product analytics
// / conversion funnels) here so they boot in the same place and at
// the same lifecycle moment.

import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 100% in dev, 10% in prod — tracing volume scales with traffic so
  // sampling here keeps the Sentry bill predictable.
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Session Replay — record 10% of all sessions, 100% of sessions where
  // an error fires. The "errors-only" tier is the highest-value bucket
  // for debugging since you see what the user did right before the
  // crash.
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Pin Sentry's environment tag to Vercel's deploy environment when
  // available (preview / production / development) so issues can be
  // filtered per-deploy.
  environment:
    process.env.NEXT_PUBLIC_VERCEL_ENV ??
    process.env.NODE_ENV ??
    "development",

  enableLogs: true,

  // Captures user IP, request headers, breadcrumb URLs. We're a B2C
  // checkout flow — context like which page they were on when the
  // error fired is more valuable than the marginal PII risk. Tighten
  // later if compliance requirements change.
  sendDefaultPii: true,

  integrations: [Sentry.replayIntegration()],
});

// App Router navigation transitions — gives Sentry a span for each
// client-side route change so traces span page-to-page navigation.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// ─── PostHog ─────────────────────────────────────────────
//
// Product analytics + conversion funnels. Auto-captures pageviews,
// rage clicks, and dead clicks; identified users are linked to their
// pre-auth distinctId via PostHogIdentifyBridge in the portal layout.
//
// person_profiles: "identified_only" creates a Person record only
// after .identify() is called — anonymous traffic stays anonymous in
// PostHog (lower privacy risk, smaller event ingestion bill).

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    defaults: "2026-01-30",
    person_profiles: "identified_only",
    // Don't autocapture on dev unless you really want to clutter the
    // PostHog UI with localhost noise.
    autocapture: process.env.NODE_ENV === "production",
    capture_pageview: "history_change",
    capture_pageleave: true,
    // Session recordings are PostHog's product (separate from Sentry's
    // error-only replay) — useful for funnel debugging where the user
    // didn't crash but abandoned. 25% sampling keeps the bill under
    // control on the free tier.
    session_recording: {
      sampleRate: process.env.NODE_ENV === "production" ? 0.25 : 0,
    },
  });
}
