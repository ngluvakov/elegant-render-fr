/**
 * go-live-preflight.ts — one command that proves every integration behind
 * elegantrender.fr actually works before USE_STATIC_PRICING is dropped.
 *
 * Usage:
 *   npx tsx scripts/go-live-preflight.ts          # report only
 *   npx tsx scripts/go-live-preflight.ts --fix    # also create the private
 *                                                 # `order-files` bucket
 *
 * Reads `.env.local` (pull it with `vercel env pull .env.local
 * --environment=production` first). Every check is independent: a failure
 * prints ✗ with the reason and the script keeps going, so one run gives the
 * complete list of what is still wrong. Exit code 1 when anything failed.
 *
 * Nothing here writes to Bitrix, PayPal, Resend or the database — the only
 * side effect is the bucket creation behind --fix.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import {
  isTurnstileTestingSecretKey,
  isTurnstileTestingSiteKey,
} from "../src/lib/turnstile-keys";

const FIX = process.argv.includes("--fix");
const SITE = "https://elegantrender.fr";
const BUCKET = "order-files";
// Per-site ids that only exist once the .fr accounts are created. Leave empty
// until then — the matching check prints a note instead of failing.
const SENTRY_PROJECT_ID = ""; // numeric id of the elegant-render-fr Sentry project
const SUPABASE_PROJECT_REF = ""; // e.g. "abcdefghijklmnopqrst" from the .fr project URL
const TURNSTILE_SITE_KEY = ""; // the .fr widget site key (or the shared widget with the .fr hostname)
const STAGE_VARS = [
  "BITRIX24_STAGE_DRAFT",
  "BITRIX24_STAGE_AWAITING_PAYMENT",
  "BITRIX24_STAGE_PAID",
  "BITRIX24_STAGE_IN_PROGRESS",
  "BITRIX24_STAGE_IN_REVIEW",
  "BITRIX24_STAGE_REVISION_REQUESTED",
  "BITRIX24_STAGE_DELIVERED",
  "BITRIX24_STAGE_CLOSED",
  "BITRIX24_STAGE_CANCELLED",
  "BITRIX24_STAGE_REFUNDED",
] as const;

let failures = 0;
const env = (name: string) => process.env[name]?.trim() ?? "";
const ok = (msg: string) => console.log(`  ✓ ${msg}`);
const bad = (msg: string) => {
  failures += 1;
  console.log(`  ✗ ${msg}`);
};
const section = (title: string) => console.log(`\n${title}`);

async function checkEnvPresence() {
  section("Environment variables");
  const required = [
    "DATABASE_URL",
    "DIRECT_URL",
    "AUTH_SECRET",
    "AUTH_URL",
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "CRON_SECRET",
    "RESEND_API_KEY",
    "EMAIL_FROM",
    "ADMIN_NOTIFY_EMAIL",
    "PAYPAL_MODE",
    "PAYPAL_CLIENT_ID",
    "PAYPAL_CLIENT_SECRET",
    "NEXT_PUBLIC_PAYPAL_CLIENT_ID",
    "PAYPAL_WEBHOOK_ID",
    "OPENAI_API_KEY",
    "GEMINI_API_KEY",
    "CLOUDMERSIVE_API_KEY",
    "BITRIX24_WEBHOOK_URL",
    "BITRIX24_OUTBOUND_SECRET",
    "BITRIX24_PIPELINE_ID",
    ...STAGE_VARS,
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    "TURNSTILE_SECRET_KEY",
    "AUTH_GOOGLE_ID",
    "AUTH_GOOGLE_SECRET",
    "SENTRY_DSN",
    "NEXT_PUBLIC_SENTRY_DSN",
  ];
  const missing = required.filter((n) => !env(n));
  if (missing.length === 0) ok(`all ${required.length} required variables present`);
  else bad(`missing: ${missing.join(", ")}`);

  if (env("USE_STATIC_PRICING") === "1") {
    bad("USE_STATIC_PRICING=1 is still set — remove it at go-live (static prices, no DB)");
  } else ok("USE_STATIC_PRICING not set — DB-backed pricing active");

  for (const n of ["NEXT_PUBLIC_SITE_URL", "AUTH_URL"]) {
    if (env(n) === SITE) ok(`${n} = ${SITE}`);
    else bad(`${n} is "${env(n) || "(empty)"}" — must be ${SITE}`);
  }
  if (env("EMAIL_FROM").includes("@elegantrender.com")) ok(`EMAIL_FROM sends from the verified .com domain`);
  else bad(`EMAIL_FROM "${env("EMAIL_FROM")}" — decision 2026-09-15: noreply@elegantrender.com`);
  if (env("ADMIN_NOTIFY_EMAIL") === "info@elegantrender.com") ok("ADMIN_NOTIFY_EMAIL = info@elegantrender.com");
  else bad(`ADMIN_NOTIFY_EMAIL "${env("ADMIN_NOTIFY_EMAIL")}" — should be info@elegantrender.com`);
  if (env("AUTH_SECRET").length >= 32) ok("AUTH_SECRET is long enough");
  else bad("AUTH_SECRET shorter than 32 chars — generate one with `openssl rand -base64 32`");
  if (env("NEXT_PUBLIC_GTM_ENABLED") === "true" || env("NEXT_PUBLIC_GA4_ENABLED") === "true") {
    console.log("  ! GTM/GA4 switch is ON — only after consent mode was verified in tag preview");
  }
}

async function checkDatabase() {
  section("Database (DIRECT_URL)");
  const url = env("DIRECT_URL");
  if (!url) return bad("DIRECT_URL missing");
  if (/:[^/@]*[@:/?#&%][^/@]*@/.test(url.replace(/^postgres(ql)?:\/\/[^:]+:/, "x://u:"))) {
    console.log("  ! password looks like it may contain @ : / ? # & % — must be percent-encoded");
  }
  const prisma = new PrismaClient({ adapter: new PrismaPg(url) });
  try {
    await prisma.$queryRaw`SELECT 1`;
    ok("connection works");

    const applied = await prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL`;
    const onDisk = readdirSync(join(process.cwd(), "prisma", "migrations"), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    const pending = onDisk.filter((m) => !applied.some((a) => a.migration_name === m));
    if (pending.length === 0) ok(`all ${onDisk.length} migrations applied`);
    else bad(`${pending.length} migration(s) not applied: ${pending.slice(0, 5).join(", ")}${pending.length > 5 ? "…" : ""} → npx prisma migrate deploy`);

    const rls = await prisma.$queryRaw<{ relname: string; relrowsecurity: boolean }[]>`
      SELECT c.relname, c.relrowsecurity FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname NOT LIKE '\\_prisma%'`;
    const open = rls.filter((r) => !r.relrowsecurity).map((r) => r.relname);
    if (rls.length && open.length === 0) ok(`RLS enabled on all ${rls.length} public tables`);
    else if (rls.length) bad(`RLS off on: ${open.join(", ")} (migration 20260710120000_enable_rls)`);

    const admins = await prisma.user.count({ where: { isAdmin: true } });
    if (admins > 0) ok(`${admins} admin account(s) exist`);
    else bad("no admin account — SEED_ADMIN_PASSWORD=… npx tsx scripts/seed-admin.ts");

    const published = await prisma.pricingBook.count({ where: { status: "published" } });
    console.log(published ? `  ✓ ${published} published pricing book(s)` : "  · no published pricing book — static catalog is used until one is published in /portal/admin/finance/pricebook");
  } catch (err) {
    bad(`database: ${(err as Error).message.split("\n")[0]}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function checkStorage() {
  section("Supabase storage");
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return bad("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
  if (SUPABASE_PROJECT_REF && !url.startsWith(`https://${SUPABASE_PROJECT_REF}.supabase.co`)) {
    console.log(`  ! project URL is ${url} — the .fr project is ${SUPABASE_PROJECT_REF}`);
  } else if (!SUPABASE_PROJECT_REF) {
    console.log("  · SUPABASE_PROJECT_REF not pinned in this script yet — set it once the .fr project exists");
  }
  const supabase = createClient(url, key);
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) return bad(`listBuckets: ${error.message} (service role key wrong?)`);
  const bucket = buckets?.find((b) => b.name === BUCKET);
  if (bucket) {
    if (bucket.public) bad(`bucket "${BUCKET}" is PUBLIC — order files must be private`);
    else ok(`private bucket "${BUCKET}" exists`);
    return;
  }
  if (!FIX) return bad(`bucket "${BUCKET}" missing — rerun with --fix to create it`);
  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: 50 * 1024 * 1024,
  });
  if (createError) bad(`createBucket: ${createError.message}`);
  else ok(`created private bucket "${BUCKET}" (50 MB per file)`);
}

async function checkResend() {
  section("Resend");
  const key = env("RESEND_API_KEY");
  if (!key) return bad("RESEND_API_KEY missing");
  const res = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (res.status === 401) return bad("API key rejected");
  if (res.status === 403) return bad("API key is not Full access — /domains forbidden; create a Full-access key");
  const body = (await res.json()) as { data?: { name: string; status: string }[] };
  const com = body.data?.find((d) => d.name === "elegantrender.com");
  if (!com) return bad("elegantrender.com is not a domain on this Resend key");
  if (com.status === "verified") ok("elegantrender.com verified — noreply@elegantrender.com can send");
  else bad(`elegantrender.com status: ${com.status}`);
}

async function checkPayPal() {
  section(`PayPal (${env("PAYPAL_MODE") === "live" ? "LIVE" : "sandbox"})`);
  const live = env("PAYPAL_MODE") === "live";
  const base = live ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const id = env("PAYPAL_CLIENT_ID");
  const secret = env("PAYPAL_CLIENT_SECRET");
  if (!id || !secret) return bad("client id / secret missing");
  if (env("NEXT_PUBLIC_PAYPAL_CLIENT_ID") !== id) bad("NEXT_PUBLIC_PAYPAL_CLIENT_ID differs from PAYPAL_CLIENT_ID");
  const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!tokenRes.ok) return bad(`oauth token: HTTP ${tokenRes.status} — credentials do not match ${live ? "live" : "sandbox"}`);
  const { access_token } = (await tokenRes.json()) as { access_token: string };
  ok("credentials accepted");

  const hookId = env("PAYPAL_WEBHOOK_ID");
  if (!hookId) return bad("PAYPAL_WEBHOOK_ID missing (webhook route fails closed)");
  const hookRes = await fetch(`${base}/v1/notifications/webhooks/${hookId}`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!hookRes.ok) return bad(`webhook ${hookId} not found in this ${live ? "live" : "sandbox"} app (HTTP ${hookRes.status})`);
  const hook = (await hookRes.json()) as { url: string; event_types: { name: string }[] };
  const expectedUrl = `${SITE}/api/paypal/webhook`;
  if (hook.url === expectedUrl) ok(`webhook url = ${expectedUrl}`);
  else bad(`webhook url is ${hook.url} — must be ${expectedUrl} (PayPal does not follow redirects)`);
  const names = hook.event_types.map((e) => e.name);
  const needed = [
    "CHECKOUT.ORDER.COMPLETED",
    "PAYMENT.CAPTURE.COMPLETED",
    "PAYMENT.CAPTURE.DENIED",
    "PAYMENT.CAPTURE.REFUNDED",
  ];
  const missingEvents = needed.filter((n) => !names.includes(n));
  if (missingEvents.length === 0) ok("webhook subscribed to all 4 events");
  else bad(`webhook missing events: ${missingEvents.join(", ")}`);
}

async function checkBitrix() {
  section("Bitrix24");
  const hook = env("BITRIX24_WEBHOOK_URL");
  const pipeline = env("BITRIX24_PIPELINE_ID");
  if (!hook || !pipeline) return bad("BITRIX24_WEBHOOK_URL / BITRIX24_PIPELINE_ID missing");
  const res = await fetch(`${hook.replace(/\/+$/, "")}/crm.dealcategory.stage.list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: Number(pipeline) }),
  });
  const data = (await res.json()) as { result?: { STATUS_ID: string; NAME: string }[]; error?: string };
  if (data.error || !data.result) return bad(`stage.list for pipeline ${pipeline}: ${data.error ?? "no result"}`);
  ok(`pipeline ${pipeline} reachable (${data.result.length} stages)`);
  const ids = new Set(data.result.map((s) => s.STATUS_ID));
  const wrong = STAGE_VARS.filter((v) => !ids.has(env(v)));
  if (wrong.length === 0) ok("all 10 BITRIX24_STAGE_* ids exist in the pipeline");
  else bad(`stage ids not in pipeline ${pipeline}: ${wrong.map((v) => `${v}=${env(v)}`).join(", ")}`);
  console.log(`  · outbound webhook (Bitrix → site) must target ${SITE}/api/webhooks/bitrix24?secret=<BITRIX24_OUTBOUND_SECRET> — check in the Bitrix portal, not testable from here`);
}

async function checkUpstash() {
  section("Upstash Redis");
  const url = env("UPSTASH_REDIS_REST_URL");
  const token = env("UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) return bad("UPSTASH_REDIS_REST_URL / TOKEN missing (rate limiting silently off)");
  const res = await fetch(`${url.replace(/\/+$/, "")}/ping`, { headers: { Authorization: `Bearer ${token}` } });
  const body = (await res.json().catch(() => ({}))) as { result?: string };
  if (body.result === "PONG") ok("PING → PONG");
  else bad(`ping failed (HTTP ${res.status})`);
}

async function checkTurnstile() {
  section("Cloudflare Turnstile");
  const site = env("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
  const secret = env("TURNSTILE_SECRET_KEY");
  if (!site || !secret) return bad("site key / secret missing (forms fall open: verifyTurnstile returns ok)");
  if (isTurnstileTestingSiteKey(site) || isTurnstileTestingSecretKey(secret)) return bad("testing keys in use");
  if (TURNSTILE_SITE_KEY && site !== TURNSTILE_SITE_KEY) console.log(`  ! site key ${site} is not the .fr widget ${TURNSTILE_SITE_KEY}`);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: "preflight-dummy-token" }),
  });
  const body = (await res.json()) as { "error-codes"?: string[] };
  const codes = body["error-codes"] ?? [];
  if (codes.includes("invalid-input-secret")) bad("secret rejected by Cloudflare — wrong widget?");
  else ok(`secret accepted by siteverify (${codes.join(",") || "ok"})`);
}

function checkSentry() {
  section("Sentry");
  for (const n of ["SENTRY_DSN", "NEXT_PUBLIC_SENTRY_DSN"]) {
    const dsn = env(n);
    if (!SENTRY_PROJECT_ID) {
      if (dsn) console.log(`  · ${n} present — pin SENTRY_PROJECT_ID in this script once the elegant-render-fr project exists`);
      else bad(`${n} missing`);
    } else if (dsn.endsWith(`/${SENTRY_PROJECT_ID}`)) ok(`${n} → project elegant-render-fr`);
    else bad(`${n} does not point at project ${SENTRY_PROJECT_ID} (elegant-render-fr)`);
  }
  if (env("SENTRY_AUTH_TOKEN")) ok("SENTRY_AUTH_TOKEN present (source maps upload)");
  else console.log("  · SENTRY_AUTH_TOKEN missing — stack traces stay minified, not a launch blocker");
}

async function main() {
  console.log(`elegantrender.fr go-live preflight${FIX ? " (--fix)" : ""}`);
  await checkEnvPresence();
  await checkDatabase();
  await checkStorage();
  await checkResend();
  await checkPayPal();
  await checkBitrix();
  await checkUpstash();
  await checkTurnstile();
  checkSentry();
  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
