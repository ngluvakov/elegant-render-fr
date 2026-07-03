/**
 * env.ts — provera prisustva env varova pri boot-u (instrumentation.ts).
 *
 * Dva nivoa:
 *  - CORE: bez njih ništa ne radi ni lokalno → u developmentu THROW
 *    (fail-fast dok je jeftino), u produkciji glasan log.
 *  - INTEGRATIONS: očekivani u produkciji, ali lokalni dev legitimno
 *    radi bez njih (mock kartica umesto NestPay-a, in-memory rate
 *    limit umesto Upstash-a, Turnstile isključen) → uvek samo log,
 *    u developmentu utišan.
 *
 * Namerno ne baca u produkciji: pogrešna lista bi srušila deploy.
 * Runtime mesta drže svoje guard-ove (cron-auth fail-closed itd.).
 */
const CORE_ENV = ["DATABASE_URL", "AUTH_SECRET"] as const;

const INTEGRATION_ENV = [
  "CRON_SECRET",
  "RESEND_API_KEY",
  "NESTPAY_CLIENT_ID",
  "NESTPAY_STORE_KEY",
  "OPENAI_API_KEY",
  "BITRIX24_WEBHOOK_URL",
  "TURNSTILE_SECRET_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

function missingOf(names: readonly string[]): string[] {
  return names.filter((name) => !process.env[name]?.trim());
}

export function checkServerEnv() {
  const isDev = process.env.NODE_ENV === "development";

  const missingCore = missingOf(CORE_ENV);
  if (missingCore.length > 0) {
    const message = `[env] Nedostaju CORE env varovi: ${missingCore.join(", ")}`;
    if (isDev) throw new Error(message);
    console.error(message);
  }

  const missingIntegrations = missingOf(INTEGRATION_ENV);
  if (missingIntegrations.length > 0 && !isDev) {
    console.error(
      `[env] Nedostaju integration env varovi (očekivani u produkciji): ${missingIntegrations.join(", ")}`,
    );
  }
}
