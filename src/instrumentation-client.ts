// Client (browser) Sentry init. Loaded automatically by Next.js as the
// client-side instrumentation hook. The DSN is split between client
// (NEXT_PUBLIC_SENTRY_DSN — exposed to the browser bundle) and server
// (SENTRY_DSN — server-only) so that public surface and server surface
// can point at separate Sentry projects later if needed.

import * as Sentry from "@sentry/nextjs";

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
