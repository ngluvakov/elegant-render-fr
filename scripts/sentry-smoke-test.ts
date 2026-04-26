/**
 * One-shot smoke test that initializes Sentry locally and fires both a
 * captureException and an unhandled throw so the project's "Waiting
 * for first error" screen dismisses.
 *
 * Run with:  npx tsx scripts/sentry-smoke-test.ts
 *
 * Reads SENTRY_DSN from .env.local. The script intentionally lives
 * outside the Next.js app so it doesn't get pulled into the build —
 * it's a developer utility, not production code.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;
if (!dsn) {
  console.error(
    "[sentry-smoke-test] SENTRY_DSN is not set in .env.local — aborting.",
  );
  process.exit(1);
}

Sentry.init({
  dsn,
  environment: "smoke-test",
  tracesSampleRate: 1.0,
  // Force everything through immediately; this isn't a long-running
  // process and we want the events to actually arrive at Sentry before
  // node exits.
});

async function main() {
  console.log("[sentry-smoke-test] Sending captureException…");
  Sentry.captureException(
    new Error("Sentry smoke test — captureException path"),
    { tags: { source: "smoke-test", path: "captureException" } },
  );

  console.log("[sentry-smoke-test] Sending captureMessage…");
  Sentry.captureMessage(
    "Sentry smoke test — captureMessage path (info level)",
    { level: "info", tags: { source: "smoke-test", path: "captureMessage" } },
  );

  // Flush to ensure events ship before process exits. 5 second budget
  // is generous; usually completes in <1s.
  console.log("[sentry-smoke-test] Flushing…");
  await Sentry.flush(5000);
  console.log(
    "[sentry-smoke-test] Done. Check https://sentry.io/issues/ — events should appear within ~30s under environment=smoke-test.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
