# elegantrender.fr — launch checklist

Country clone of the English `elegantrender.com` build. Same product, same
stack, same EUR pricing and PayPal checkout — only the language and the
geo-targeting change. Sibling clone: **elegantrender.de**.

Full dependency and subscription map: `docs/fr-de-rollout.md` in the `.com`
repo. This file tracks what is done here and what is still open.

---

## Done

- [x] Repo cloned from `elegantrender.com` `main` (`aeba8bc`), local only — no
      git remote, exactly like the DE clone. Branch: **`fr-translation`**.
- [x] Preview mode: `USE_STATIC_PRICING=1` short-circuits the pricing catalogue
      so the site renders without a database; `vercel.json` skips
      `prisma migrate deploy` while that flag is set; crons removed.
      See `DEPLOY-PREVIEW-NOTES.md`.
- [x] Vercel project **`elegant-render-fr`** created under
      `ngluvakovs-projects` and linked (`.vercel/project.json`).
- [x] Preview env vars set on Production + Preview (site URL, auth, dummy DB
      and Supabase values, `USE_STATIC_PRICING=1`).
- [x] Translation guide: `docs/fr-translation-guide.md`.

## Translation status

Run `git log --oneline main..fr-translation` for the authoritative list.

## Before go-live

### Content
- [ ] Full French proofread by a native speaker — especially the homepage,
      the services catalogue and the checkout flow.
- [ ] **Legal review by a French lawyer** — the legal pages are faithful
      translations of the English text, *not* French legal drafting. Every
      `TODO(legal-review)` comment in `src/app/(marketing)/legal/**` marks a
      point where French law (mentions légales, Code de la consommation,
      RGPD/CNIL, médiateur de la consommation) likely requires something
      different or additional. Do not launch before this is cleared.
- [ ] Check the German long-word/French long-sentence layout pass on mobile.

### Infrastructure
- [ ] New Supabase project — real `DATABASE_URL` (pooled), `DIRECT_URL`
      (direct, 5432), `NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `prisma migrate deploy` against the new database
- [ ] Remove `USE_STATIC_PRICING` (or set it to `0`)
- [ ] Restore the `crons` block in `vercel.json` (see `DEPLOY-PREVIEW-NOTES.md`)
- [ ] Attach the domain **elegantrender.fr**; set real `NEXT_PUBLIC_SITE_URL`
      and `AUTH_URL`; rotate `AUTH_SECRET`
- [ ] Upstash Redis (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)

### Payments, email, auth
- [ ] PayPal: webhook for the new domain → `PAYPAL_WEBHOOK_ID`
- [ ] Resend: verify the sending domain (DNS) → `RESEND_API_KEY`,
      `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL`
- [ ] Google OAuth: add the `elegantrender.fr` redirect URIs
- [ ] Cloudflare Turnstile: add the hostname (keys live in the
      *Whiterook.kovacica* Cloudflare account) → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`,
      `TURNSTILE_SECRET_KEY`
- [ ] `CLOUDMERSIVE_API_KEY`, `CRON_SECRET`

### CRM, AI, analytics
- [ ] Bitrix24 webhook + pipeline/stage IDs (shared portal)
- [ ] OpenAI / Gemini keys (shared)
- [ ] New Sentry project + DSN; PostHog project; GA4 property + GTM container

### SEO
- [ ] `hreflang` alternates between `.com`, `.de` and `.fr`
- [ ] Submit the sitemap in Search Console for the new property
- [ ] Verify the TÜV Rheinland Certipedia link resolves with `?locale=fr`
