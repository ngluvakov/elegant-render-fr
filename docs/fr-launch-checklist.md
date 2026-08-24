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

---

## Open decisions surfaced during translation

1. **Plutos accounting source id.** `src/server/plutos/ids.ts` has
   `PLUTOS_SOURCE = "elegantrender.com"`, and it prefixes every external id
   sent to the accounting system (`${PLUTOS_SOURCE}:${target}:${targetId}`).
   Left unchanged because it is a **matched identifier**, not copy — changing
   it decides how `.fr` invoices are keyed in the books. Settle this with the
   accountant before the first real invoice is issued; changing it later
   splits the history.

2. **PDF font subset.** `src/lib/pdf-fonts.ts` registers only the
   `noto-sans-latin-ext-*` files. Verified with fontkit: that subset has **no
   basic Latin, no French accents, no `’ « » €`** — those characters have
   always rendered through react-pdf's built-in Helvetica fallback, which is
   why the English `.com` invoices look fine. Neither the subset nor Helvetica
   has **U+202F** (narrow no-break space), so the PDF templates deliberately
   use U+00A0 instead, and `formatMoney` normalises `1 234,56 €` accordingly.
   Cleaner fix, if the mixed-typeface rendering ever shows: register the
   `noto-sans-latin-*` files as well (they cover everything French needs) and
   keep `latin-ext` as the fallback family for Serbian characters in the
   company address.

3. **Bitrix24 / Plutos payloads stay English.** Deal and lead titles, timeline
   comments, stage names and payload keys were left as-is — they render inside
   the CRM/accounting system, and some back CRM filters. One Serbian leftover
   (`"Kupac"` → `Client`) was fixed in `plutos/source.ts` so the books match
   the PDF; `"Klijent"` in `bitrix/sync-contact.ts` was left alone.

4. **Two euro formats coexist, on purpose.**
   - *Public prices* (`formatPublicPrice`, and `formatPublicPriceText` which
     rewrites `€NNN` tokens inside marketing and chat copy) render French
     style — `250 €` — because `CURRENCY_RULES.EUR.locale` is now `fr-FR`.
   - *Portal and admin surfaces* still render `€250` via `formatCents`
     (`src/lib/ai-studio/catalog.ts`) → `formatEur`
     (`src/lib/catalog/calculate.ts`).

   `formatCents` was **deliberately left alone**: its `€NNN` output is also
   what the chatbot system prompt embeds, and `formatPublicPriceText` matches
   exactly that shape (`/€\s?(\d+…)/`) to convert prices into a non-EUR
   visitor's currency. Flipping it to `250 €` would silently stop that
   conversion and show euros to every visitor.

   To finish the job properly: add a separate French display formatter for the
   portal/admin surfaces (about ten call sites) and keep `formatCents` as the
   token format for the chat/conversion pipeline. Not done here because it is
   a structural change, not a translation, and it touches the pricing path.
