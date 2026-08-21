# FR & DE Rollout — dependencies, subscriptions & setup checklist

A full map of the dependencies and paid services behind the platform, plus a
per-domain setup checklist for launching Elegant Render on **elegantrender.fr**
and **elegantrender.de**.

> **Key insight — EUR & EU, same as .com.**
> France and Germany share the euro and EU rules with the existing **.com**
> build, so the **pricing catalogue and PayPal reuse as-is** — no currency
> work. The real effort is **translation and country-specific legal pages**,
> not re-plumbing.

Legend for the "For .fr / .de" column:

- **NEW per domain** — a fresh instance/config is needed per site
- **SHARED** — one account serves every domain
- Cost: **Paid** = recurring fee · **Free** = no fee · usage = pay-per-use

---

## 1. External services & subscriptions

| Service | What it does | Cost | For .fr / .de |
|---|---|---|---|
| **Vercel** | Hosting, serverless functions, cron, DNS | Paid · Pro ~$20/mo | **NEW** — project + domain |
| **Supabase** | Postgres database + file storage (uploads) | Paid · Pro ~$25/mo per project | **NEW** — database |
| **Upstash Redis** | Rate limiting | Free / pay-as-you-go | SHARED or new |
| **PayPal** | Card & PayPal checkout | Per-transaction fee | SHARED account · **new webhook** |
| **Resend** | Transactional email | Free to 3k/mo, then paid | **NEW** — verify sending domain (DNS) |
| **Bitrix24** | CRM — lead & deal sync | Paid plan (REST API requires it) | SHARED portal |
| **OpenAI** | Chatbot + AI Studio image generation | Usage-based | SHARED key |
| **Google Gemini** | AI Studio engine option | Usage-based | SHARED key |
| **Cloudmersive** | Antivirus scan of uploaded files | Free tier + paid | SHARED key |
| **Cloudflare Turnstile** | Captcha / anti-spam | Free | **NEW** — add hostname or new widget |
| **Sentry** | Error monitoring | Free / Team | **NEW** — project (same org) |
| **PostHog** | Product analytics | Free tier | **NEW** — project/property |
| **Google Analytics 4 + Tag Manager** | Web analytics & tags | Free | **NEW** — property/container |
| **Google OAuth** | Sign in with Google | Free | SHARED — add redirect URIs |
| **LinkedIn CAPI** | Ad-conversion tracking | Ad spend | SHARED — optional per market |
| **Vercel Analytics + Speed Insights** | Web-vitals | Included in plan | Per project |

---

## 2. Code dependencies (npm — not subscriptions)

The stack the new domains inherit verbatim by cloning the `.com` repo. Nothing
here needs a per-domain account.

- **Framework:** `next 16.2.9`, `react 19`, `typescript`, `tailwind 4`, `zod`
- **Data & auth:** `prisma 7`, `@prisma/adapter-pg`, `@supabase/supabase-js`, `next-auth v5`, `bcryptjs`
- **UI:** `@base-ui/react`, `shadcn`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`
- **AI · images · PDF:** `openai`, `sharp`, `@react-pdf/renderer`, `@fontsource/noto-sans`
- **Infra libs:** `@upstash/ratelimit`, `@upstash/redis`, `@sentry/nextjs`, `resend`
- **Analytics:** `posthog-js`, `posthog-node`, `@vercel/analytics`, `@vercel/speed-insights`
- **Dev:** `eslint`, `eslint-config-next`, `vitest`, `@tailwindcss/postcss`, type packages

---

## 3. Per-domain setup checklist

Repeat this for **elegantrender.fr** and again for **elegantrender.de**.
Content & legal is the bulk of the work.

### Infrastructure

- [ ] New Vercel project + attach the domain
- [ ] New Supabase project (database + storage buckets)
- [ ] Run Prisma migrations against the new DB
- [ ] Set `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SITE_URL`, `AUTH_URL`, `AUTH_SECRET`
- [ ] Upstash Redis URL + token (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)

### Payments & email

- [ ] PayPal: register a webhook for the new domain, set its ID (`PAYPAL_WEBHOOK_ID`)
- [ ] Resend: verify the sending domain (DNS records) + `RESEND_API_KEY`
- [ ] Set `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL` for the country

### Auth & security

- [ ] Google OAuth: add the new redirect URIs (`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`)
- [ ] Turnstile: add hostname (or new widget) → set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`
- [ ] Cloudmersive key (`CLOUDMERSIVE_API_KEY`) + `CRON_SECRET`

### AI & CRM

- [ ] Reuse OpenAI / Gemini keys (`OPENAI_API_KEY`, Gemini key)
- [ ] Bitrix24 webhook + pipeline/stage IDs (`BITRIX24_WEBHOOK_URL`, `BITRIX24_*`)

### Analytics & monitoring

- [ ] New Sentry project + DSN + auth token (`NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_*`)
- [ ] PostHog project key + host (`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`)
- [ ] GA4 measurement ID + GTM container (`NEXT_PUBLIC_GA4_*`, `NEXT_PUBLIC_GTM_*`)

### Content & legal — *the bulk of the work*

- [ ] Translate `src/lib/content/site.ts`, `src/lib/content/blog.ts` (10 posts), the services catalog, the AI Studio catalog, career, and the email templates in `src/lib/email.ts`
- [ ] **Legal review per country** — DE Impressum (§5 TMG) & FR Mentions légales / CGV
- [ ] SEO: `htmlLang` `fr-FR` / `de-DE`, hreflang alternates, translated meta
- [ ] German long-word pass — check headings/buttons don't break (e.g. the hero title)

---

## 4. One decision to make first

How the domains are structured shapes every checklist above. Today `.rs` and
`.com` are separate repos + Vercel projects.

### Recommended — separate project per domain (matches today)

Clone the `.com` repo per country. Clean legal & data separation (own Supabase,
own GDPR scope), independent deploys, simplest SEO. **Cost:** duplicated infra
and translations kept in sync by hand.

### Alternative — one repo, `/fr` & `/de` routes

Single codebase with i18n routing. One deploy, translations side-by-side.
**Cost:** heavier refactor now (every route becomes locale-aware), and a shared
database blurs per-country data/legal boundaries.

---

*Snapshot of the `elegantrender.com` build — dependencies and env var names from
production, no secrets included. Currency stays EUR for both markets.*
