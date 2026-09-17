# elegantrender.fr — go-live runbook

Exact commands, in order. Each step is safe to repeat. State as of 2026-09-17:
code complete, domain attached (nameservers → Vercel, certificate pending),
non-secret config on Vercel, **no database yet** (`USE_STATIC_PRICING=1`). What
is already set and what is still missing is listed in `DEPLOY-PREVIEW-NOTES.md`;
the accounts to open are in `docs/fr-launch-checklist.md`.

Mirrors `docs/go-live-de.md` in the German clone — same steps, French values.

## 0. Secrets into Vercel (Nikola)

Project `elegant-render-fr`, environment **Production**, type Sensitive:

```
NEXT_PUBLIC_SUPABASE_ANON_KEY   SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL (pooler :6543)     DIRECT_URL (direct :5432)      ← password percent-encoded
TURNSTILE_SECRET_KEY            RESEND_API_KEY (Full access)
PAYPAL_CLIENT_ID  PAYPAL_CLIENT_SECRET  NEXT_PUBLIC_PAYPAL_CLIENT_ID   ← sandbox app first
AUTH_GOOGLE_ID  AUTH_GOOGLE_SECRET
BITRIX24_WEBHOOK_URL  BITRIX24_OUTBOUND_SECRET
OPENAI_API_KEY  GEMINI_API_KEY  CLOUDMERSIVE_API_KEY
UPSTASH_REDIS_REST_URL  UPSTASH_REDIS_REST_TOKEN
CRON_SECRET (openssl rand -hex 32)   SENTRY_AUTH_TOKEN
```

Either paste them in the dashboard or, from this repo:

```bash
printf '%s' '<value>' | npx vercel env add NAME production --sensitive
```

Also in Bitrix24 (portal UI, not code): outbound webhook, event `ONCRMDEALUPDATE`,
handler `https://elegantrender.fr/api/webhooks/bitrix24?secret=<BITRIX24_OUTBOUND_SECRET>`.

Email follows the .de decision of 2026-09-15: **no per-country mailbox and no
Resend domain for .fr**. Mail is sent from the verified `.com` domain
(`EMAIL_FROM=Elegant Render <noreply@elegantrender.com>`) with
`Reply-To: info@elegantrender.com`, and `ADMIN_NOTIFY_EMAIL=info@elegantrender.com`.
Every `info@elegantrender.fr` in the site copy already points at the `.com` box.

## 1. Pull production env locally

```bash
npx vercel env pull .env.local --environment=production --yes
```

`.env.local` is gitignored. Every following step reads it.

## 2. Preflight — read-only, lists everything still wrong

```bash
npm run preflight
```

Checks: env presence, DB connection + pending migrations + RLS + admin account,
storage bucket, Resend domain, PayPal credentials + webhook URL/events, Bitrix
pipeline + all stage ids, Upstash, Turnstile secret, Sentry project. Expect
"migrations not applied" and "bucket missing" on the first run — that is what
steps 3–4 fix.

Three per-site ids are still empty at the top of `scripts/go-live-preflight.ts`
(`SENTRY_PROJECT_ID`, `SUPABASE_PROJECT_REF`, `TURNSTILE_SITE_KEY`) — pin them
once the .fr accounts exist so the script can catch a DSN or key that belongs to
another site.

## 3. Database

```bash
npx prisma migrate deploy          # baseline + RLS migration, idempotent
npm run preflight                  # migrations + RLS should now pass
```

## 4. Storage bucket + superadmin

```bash
npm run preflight -- --fix         # creates private bucket order-files (50 MB/file)
SEED_ADMIN_PASSWORD='<strong password>' npx tsx scripts/seed-admin.ts
```

The seed creates `admin@elegantrender.com` **in the .fr database** — a separate
account from the .com and .de ones even though the email is the same. Store the
password in the team vault.

## 5. Switch the site from preview mode to the database

```bash
npx vercel env rm USE_STATIC_PRICING production --yes
```

Then restore the crons block in `vercel.json` (it is launch-safe — every cron
route is `CRON_SECRET`-gated):

```json
"crons": [
  { "path": "/api/cron/bitrix-reconcile",  "schedule": "0 3 * * *" },
  { "path": "/api/cron/quote-cleanup",     "schedule": "30 3 * * *" },
  { "path": "/api/cron/outbox-processor",  "schedule": "* * * * *" },
  { "path": "/api/cron/invoice-reconcile", "schedule": "15 4 * * *" },
  { "path": "/api/cron/paypal-reconcile",  "schedule": "*/15 * * * *" }
]
```

Commit, push `fr-translation` → Vercel builds with `prisma migrate deploy` in
the build command (no-op after step 3) and the site now reads the database.
`robots.txt` flips from `Disallow: /` to the normal rules and pages drop
`noindex` automatically — both key off `USE_STATIC_PRICING`.

## 6. Sandbox end-to-end (PAYPAL_MODE=sandbox)

1. `/tarifs` → configure an interior render → checkout (`/commande`) → pay with
   a PayPal sandbox buyer.
2. Portal shows the order as paid; confirmation email + invoice PDF arrive
   (sender `noreply@elegantrender.com`, Reply-To `info@elegantrender.com`) —
   check the PDF renders `1 234,56 €` and the accented labels cleanly.
3. Bitrix: deal appears in the "Elegant Render FR" pipeline, stage Paid.
4. Contact form → email to `info@elegantrender.com` + Bitrix lead.
5. `/informations-legales/retractation#online-withdrawal` → consumer
   acknowledgement + admin copy.
6. `curl -H "Authorization: Bearer $CRON_SECRET" https://elegantrender.fr/api/cron/paypal-reconcile` → 200.
7. Sentry receives a test event: `npx tsx scripts/sentry-smoke-test.ts`.

## 7. Legal sign-off

French lawyer returns the 17 points in `docs/fr-legal-review.md` — mentions
légales (LCEN), CGV incl. the *médiateur de la consommation*, politique de
confidentialité (age of digital consent is 15 in France), cookies (CNIL), and
the Art. 27 RGPD representative question (`IMPRINT.euRepresentative` in
`src/lib/content/site.ts` is `null` today). Apply the edits, commit, push.

## 8. Live flip

```bash
printf '%s' 'live'               | npx vercel env add PAYPAL_MODE       production --force --no-sensitive
printf '%s' '<live webhook id>'  | npx vercel env add PAYPAL_WEBHOOK_ID production --force --no-sensitive
# live PAYPAL_CLIENT_ID / SECRET / NEXT_PUBLIC_PAYPAL_CLIENT_ID (same as .com live app)
npx vercel redeploy "$(npx vercel ls 2>/dev/null | grep -oE 'https://elegant-render-[a-z0-9]+-ngluvakovs-projects\.vercel\.app' | head -1)"
npm run preflight                # PayPal section must say LIVE, webhook url + 4 events green
```

Then one real low-value order, then a refund of it from the admin order page
(must return to the original funding source). Only after that: announce.

## 9. After launch

- Search Console: click **Verify** (TXT record is already in Vercel DNS), submit
  `https://elegantrender.fr/sitemap.xml`.
- GA4/GTM: verify consent mode in Tag Assistant preview, then
  `NEXT_PUBLIC_GTM_ENABLED=true` (never grant ad consent globally).
- Plutos: `PLUTOS_SYNC_ENABLED=true` + `PLUTOS_SYNC_FROM=<launch ISO timestamp>`
  once the Plutos ingest endpoint accepts `source: "elegantrender.fr"`.
- `hreflang` alternates between `.com`, `.de` and `.fr` once all three are
  indexable (`buildLanguageAlternates` in `src/lib/seo.ts`).
- `fr-translation` is already the production branch in Vercel — every push
  deploys. Consider moving day-to-day work to branches + PRs from here on.
