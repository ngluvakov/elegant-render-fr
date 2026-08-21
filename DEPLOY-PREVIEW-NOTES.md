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
