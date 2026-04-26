// Edge runtime Sentry init. Imported by instrumentation.ts when
// NEXT_RUNTIME === "edge". The edge runtime is a stripped-down V8
// isolate that runs middleware (proxy.ts) and edge route handlers; it
// can't use Node-only integrations so this config stays minimal.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  environment:
    process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",

  enableLogs: true,
  sendDefaultPii: true,
});
