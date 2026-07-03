/**
 * env.ts — provera prisustva env varova pri boot-u (instrumentation.ts).
 *
 * Namerno NE baca grešku u produkciji: pogrešna lista obaveznih varova
 * bi srušila deploy. Umesto toga: u developmentu THROW (fail-fast dok
 * je jeftino), u produkciji glasan log koji Sentry pokupi. Runtime
 * mesta i dalje drže svoje guard-ove (cron-auth fail-closed itd.).
 */
import { z } from "zod";

const requiredServerEnv = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  CRON_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  NESTPAY_CLIENT_ID: z.string().min(1),
  NESTPAY_STORE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  BITRIX24_WEBHOOK_URL: z.string().min(1),
  TURNSTILE_SECRET_KEY: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().min(1),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
});

export function checkServerEnv() {
  const parsed = requiredServerEnv.safeParse(process.env);
  if (parsed.success) return;

  const missing = parsed.error.issues.map((issue) => issue.path.join("."));
  const message = `[env] Nedostaju env varovi: ${missing.join(", ")}`;

  if (process.env.NODE_ENV === "development") {
    throw new Error(message);
  }
  // Produkcija/preview: vidljivo, ali bez rušenja boot-a.
  console.error(message);
}
