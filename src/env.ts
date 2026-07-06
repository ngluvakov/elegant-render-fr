/**
 * env.ts — boot-time env var presence check (instrumentation.ts).
 *
 * Three levels:
 *  - CORE: nothing works without them, even locally → THROW in
 *    development (fail fast while it's cheap), loud log in production.
 *  - INTEGRATIONS: expected in production, but local dev legitimately
 *    runs without them (mock card instead of PayPal, in-memory rate
 *    limit instead of Upstash) → always log-only, silenced in dev.
 *  - WARN: nice-to-have in production (webhook sync degrades without
 *    them but payments still work) → console.warn in production.
 *
 * Deliberately never throws in production: a stale list would take the
 * deploy down. Runtime call sites keep their own guards (cron-auth
 * fail-closed, PayPal client errors, webhook signature fail-closed).
 */
const CORE_ENV = ["DATABASE_URL", "AUTH_SECRET"] as const;

const INTEGRATION_ENV = [
  "CRON_SECRET",
  "RESEND_API_KEY",
  "PAYPAL_CLIENT_ID",
  "PAYPAL_CLIENT_SECRET",
  "NEXT_PUBLIC_PAYPAL_CLIENT_ID",
  "OPENAI_API_KEY",
  "BITRIX24_WEBHOOK_URL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

// Without PAYPAL_WEBHOOK_ID the webhook route rejects every delivery
// (fail-closed signature verification): eCheck completions and
// dashboard-initiated refunds won't sync until it is configured.
const WARN_ENV = ["PAYPAL_WEBHOOK_ID"] as const;

function missingOf(names: readonly string[]): string[] {
  return names.filter((name) => !process.env[name]?.trim());
}

export function checkServerEnv() {
  const isDev = process.env.NODE_ENV === "development";

  const missingCore = missingOf(CORE_ENV);
  if (missingCore.length > 0) {
    const message = `[env] Missing CORE env vars: ${missingCore.join(", ")}`;
    if (isDev) throw new Error(message);
    console.error(message);
  }

  const missingIntegrations = missingOf(INTEGRATION_ENV);
  if (missingIntegrations.length > 0 && !isDev) {
    console.error(
      `[env] Missing integration env vars (required in production): ${missingIntegrations.join(", ")}`,
    );
  }

  const missingWarn = missingOf(WARN_ENV);
  if (missingWarn.length > 0 && !isDev) {
    console.warn(
      `[env] Missing optional env vars (webhook sync degraded): ${missingWarn.join(", ")}`,
    );
  }
}
