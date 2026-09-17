# elegant-render-fr — Preview deploy notes

This project currently runs in **preview mode** (no database) so the French
translation can be reviewed on Vercel deployments.

## What preview mode does
- `USE_STATIC_PRICING=1` → the marketing site renders from the static pricing
  catalog instead of the database (`src/server/pricing/catalog.ts`).
- `vercel.json` `buildCommand` skips `prisma migrate deploy` whenever
  `USE_STATIC_PRICING=1` (otherwise it runs migrations, so the same command
  works for the real launch).
- Cron jobs are **disabled** (they need a database). Restore them at go-live.

## Before go-live (real database connected)
1. Create a Supabase project; set real `DATABASE_URL` (pooled) and `DIRECT_URL`
   (direct, port 5432), plus `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
2. Remove `USE_STATIC_PRICING` from the Vercel env (or set it to `0`).
3. Restore the crons block in `vercel.json`:
   ```json
   "crons": [
     { "path": "/api/cron/bitrix-reconcile", "schedule": "0 3 * * *" },
     { "path": "/api/cron/quote-cleanup", "schedule": "30 3 * * *" },
     { "path": "/api/cron/outbox-processor", "schedule": "* * * * *" },
     { "path": "/api/cron/invoice-reconcile", "schedule": "15 4 * * *" },
     { "path": "/api/cron/paypal-reconcile", "schedule": "*/15 * * * *" }
   ]
   ```
4. Optionally remove the `buildCommand` override (default `npm run build`
   already runs migrations) — or leave it; it is launch-safe.

## Status 2026-09-17 — what is already on the Vercel project

Vercel project `elegant-render-fr` (production branch **`fr-translation`**,
not `main`). Set (per `docs/fr-launch-checklist.md` / `docs/go-live-fr.md`):
site URL + auth URL, the preview-mode dummy DB/Supabase values,
`USE_STATIC_PRICING=1`, and the non-secret config. Mail follows the
2026-09-15 decision — `EMAIL_FROM=Elegant Render <noreply@elegantrender.com>`,
`EMAIL_REPLY_TO=info@elegantrender.com`, `ADMIN_NOTIFY_EMAIL=info@elegantrender.com`;
no Resend domain, MX or mailbox for `elegantrender.fr`. Keep
`PLUTOS_SYNC_ENABLED=false` and the GA4/GTM switches `false` until launch.
Domain `elegantrender.fr` + `www` are attached (nameservers → Vercel,
certificate pending); www 308-redirects to the apex in `next.config.ts`, so
the PayPal webhook must be registered on `https://elegantrender.fr/api/paypal/webhook`.
`docs/go-live-fr.md` is the authoritative runbook; `npm run preflight` reports
what is still wrong against the pulled env (`npx vercel env ls` shows what is set).

Still missing — per-site accounts to open and secrets Nikola sends separately:

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | new Supabase project for .fr (EU region) — pin its ref in `scripts/go-live-preflight.ts` |
| `DATABASE_URL` (pooler :6543), `DIRECT_URL` (direct :5432) | same — password must be percent-encoded |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare widget with the `elegantrender.fr` hostname (*Whiterook.kovacica* account) |
| `RESEND_API_KEY` | existing .com key (Full access) — sender stays `noreply@elegantrender.com` |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_WEBHOOK_ID` | same app as .com (sandbox first); webhook created on the apex host |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | same as .com, with the `elegantrender.fr` redirect URIs added |
| `BITRIX24_WEBHOOK_URL`, `BITRIX24_OUTBOUND_SECRET`, `BITRIX24_PIPELINE_ID` + `BITRIX24_STAGE_*` | shared portal; new pipeline "Elegant Render FR" |
| `OPENAI_API_KEY`, `GEMINI_API_KEY`, `CLOUDMERSIVE_API_KEY` | same as .com |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | new Upstash database |
| `CRON_SECRET` | any long random string (also used by the crons block) |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` | new Sentry project `elegant-render-fr` in org `white-rook` (slug is pinned in `next.config.ts`); token same as .com |
| `NEXT_PUBLIC_POSTHOG_KEY`, GA4 property, `NEXT_PUBLIC_GTM_CONTAINER_ID`, `GOOGLE_SITE_VERIFICATION` | new PostHog EU project, GA4 property, GTM container, Search Console property |

Launch flip (in this order): secrets above → `prisma migrate deploy` against
the new DB → remove `USE_STATIC_PRICING` → restore the crons block → sandbox
end-to-end order → `PAYPAL_MODE=live` + live `PAYPAL_WEBHOOK_ID` → one
low-value live order + refund.
