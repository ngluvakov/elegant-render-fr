// Server (Node.js runtime) Sentry init. Imported by instrumentation.ts
// when NEXT_RUNTIME === "nodejs". Server-only DSN keeps the value out
// of the client bundle.
//
// OpenAI calls in /api/chat are auto-instrumented by @sentry/node v10+
// when the `openai` package is detected at runtime — no explicit
// integration setup needed. If we add Anthropic or another LLM SDK
// later, those need their own integration enables here.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  environment:
    process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",

  // includeLocalVariables je namerno ISKLJUČEN (default false): sa njim
  // svaki captured exception nosi lokalne varijable svih frejmova — na
  // platnim putanjama to uključuje NestPay `fields` mapu i podatke kupca
  // (GDPR). Kontekst za debug dodavati ciljano kroz Sentry tags/extra,
  // kao što payment putanje već rade.
  enableLogs: true,
  sendDefaultPii: true,
});
