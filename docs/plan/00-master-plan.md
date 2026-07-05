# Elegant Render International — elegantrender.com (EN + PayPal + White Rook design)

## Context

White Rook DOO expands elegantrender.rs (Serbian B2C architectural-visualization platform: Next.js 16, Prisma 7/Supabase, Auth.js v5, Bitrix24 CRM) to the international market. New repo at `s:\Elegant render english` → **elegantrender.com**: full English translation, **PayPal replaces Nestpay** card payments, **EUR pricing** with automatic buyer-currency display, **2-step checkout**, **EU legal pages**, **new White Rook visual identity** (Claude Design handoff), same images renamed for EN SEO, GTM/GA4 SEO stack, Bitrix24 survives (same portal, new pipeline). Work runs in parallel: Claude Code + Codex.

**The decisive finding:** this codebase already WAS EUR+PayPal — removed 2026-06-17 by commit `b4d0740`. The full PayPal implementation is recoverable via `git show b4d0740^:<path>` (verified), the EUR pricelist exists (`docs/pricing/pillar-1-extracted.md`, ex-VAT), and all currency seams survived as stubbed identity functions. This project is ~70% recovery + translation, not greenfield.

## Locked decisions (owner-confirmed)

| Decision | Answer |
|---|---|
| Domain | elegantrender.com |
| Seller | White Rook DOO (Serbia); PayPal Business account exists |
| Bitrix24 | Same portal, NEW pipeline ("Elegant Render EN") |
| Design | Full new identity from handoff: `C:\Users\ngluv\Downloads\Elegant Render international rebrand.zip` (white canvas, `#111` text, green `#00D98A`, Inter Tight + JetBrains Mono, 4px radius; `globals-international.css` is a production drop-in) |
| Checkout | 2 steps (details → PayPal); **file upload moves post-payment** (success screen + portal, 24h reminder email) |
| Price rounding | **Psychological x9**: convert EUR→local, round UP to marketable increment, then −1 (€169, $189, 68 000 Ft) |
| RS visitors | No banner/block — everyone buys in EUR with export invoice |
| Checkout route | `/checkout` (avoids `/order` vs `/portal/orders` confusion) |

## Reference documents (detailed designs — copy into new repo `docs/plan/` at bootstrap)

Scratchpad `C:\Users\ngluv\AppData\Local\Temp\claude\s--Elegant-render-english\1faffc5d-6b7b-458d-b15c-5e6d71d0f519\scratchpad\`:
`report-payments.md`, `report-i18n.md`, `report-seo-bitrix.md`, `report-infra.md` (exploration), `design-payments.md`, `design-bootstrap.md`, `design-i18n-seo.md` (implementation designs), `rebrand/` (extracted design handoff). If scratchpad is gone, re-extract the zip from Downloads; exploration facts are summarized here.

---

# PHASE 0 — Dependency checklist (OWNER, one by one — the urgent list)

**[OWNER]** = browser work by you · **[CLAUDE]** = I do it via CLI · **(reuse)** = same account as .rs project.

### Wave A — independent, do now in any order

1. **[CLAUDE] Secrets** — generate `AUTH_SECRET`, `CRON_SECRET`, `BITRIX24_OUTBOUND_SECRET`.
2. **[CLAUDE] GitHub repo** (reuse account) — private `elegant-render-com` via `gh repo create`.
3. **[OWNER] Supabase project** (reuse org; **EU region — Frankfurt** for GDPR) → `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (pooled :6543 `?pgbouncer=true`), `DIRECT_URL` (:5432). Create **private storage bucket `order-files`** (exact name — hardcoded in `src/lib/file-scan.ts`). *Blocks everything DB.*
4. **[OWNER] PayPal REST apps** — developer.paypal.com: create app under **Sandbox** and **Live** → `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_MODE=sandbox`. Create one sandbox **buyer** test account. (Live webhook comes in Wave C.)
5. **[OWNER] Google Cloud OAuth** — **new GCP project** (consent screen branded for elegantrender.com); redirect URIs `https://elegantrender.com/api/auth/callback/google` + `http://localhost:3000/api/auth/callback/google` → `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`. Start early (review lag).
6. **[OWNER] PostHog** (reuse org) — new project, **EU Cloud** → `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com`.
7. **[OWNER] Sentry** (reuse org `white-rook`) — new `javascript-nextjs` project → `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, org auth token → `SENTRY_AUTH_TOKEN`. Tell me the project slug (for `.mcp.json` + `next.config.ts`).
8. **[OWNER] Upstash Redis** (reuse account) — new database → `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
9. **[OWNER] Reuse keys (5 min)** — `CLOUDMERSIVE_API_KEY` (antivirus, reuse), `OPENAI_API_KEY` (reuse; new project-scoped key for cost split), `GEMINI_API_KEY` (reuse), `AI_STUDIO_*_MODEL` values, `RESEND_API_KEY` (reuse account, new named key).
10. **[OWNER] GTM + GA4** — new GTM web container → `NEXT_PUBLIC_GTM_CONTAINER_ID` (keep `NEXT_PUBLIC_GTM_ENABLED=false` until launch); new GA4 property **currency EUR**, measurement ID wired inside GTM (direct GA4 tag stays disabled).
11. **Turnstile: DROP** — was bank-mandated only; PayPal has its own fraud layer. No account needed. (Upstash rate limits stay.)

### Wave B — needs registrar/DNS access (one sitting)

12. **[OWNER] Domain → Vercel** — recommended: switch nameservers to **Vercel DNS**; add `elegantrender.com` + `www` to the new Vercel project → `AUTH_URL` + `NEXT_PUBLIC_SITE_URL=https://elegantrender.com`.
13. **[OWNER] Resend domain** — verify `elegantrender.com` (SPF/DKIM/DMARC records) → `EMAIL_FROM="Elegant Render <noreply@elegantrender.com>"`, `ADMIN_NOTIFY_EMAIL=info@elegantrender.com`. **`info@` needs a receiving mailbox** — set up registrar/Workspace forwarding now.
14. **[OWNER] Search Console + Bing** — Domain property via DNS TXT; Bing "Import from GSC".

### Wave C — needs first production deploy

15. **[CLAUDE] First deploy gate** — Supabase migrated, envs set, green build on elegantrender.com.
16. **[OWNER→CLAUDE] Bitrix24** — new inbound webhook (scope `crm`) → `BITRIX24_WEBHOOK_URL`; I run adapted `scripts/bitrix-setup.ts` → creates EN pipeline → `BITRIX24_PIPELINE_ID` + 10 `BITRIX24_STAGE_*` values. Then **[OWNER]** outbound webhook on `ONCRMDEALUPDATE` → `https://elegantrender.com/api/webhooks/bitrix24?secret=<BITRIX24_OUTBOUND_SECRET>`.
17. **[OWNER] PayPal live webhook** — Live app → webhook URL `https://elegantrender.com/api/paypal/webhook`, events `PAYMENT.CAPTURE.COMPLETED/DENIED/REFUNDED`, `CHECKOUT.ORDER.APPROVED` → `PAYPAL_WEBHOOK_ID`. Flip `PAYPAL_MODE=live` only after sandbox E2E pass.
18. **[OWNER] Launch flips** — GTM publish + `NEXT_PUBLIC_GTM_ENABLED=true`; submit sitemap in GSC.

---

# PHASE 1 — Bootstrap (SERIAL, Claude only; nothing parallel before S0)

1. **Clone with history**: `git clone "C:/Users/ngluv/Desktop/Platform" "S:/Elegant render english"` (PayPal code + reversal migration live in history; `.env*`/`.claude/` are ignored so nothing leaks). New remote → `elegant-render-com`, push `main` only.
2. **Commit: strip dead weight** — `docs/Placanje karticama/`, `scripts/nestpay-hash-test.ts` + `nestpay-storekey-probe.ts`, ci.yml NestPay step (same commit). *Not* `src/lib/nestpay/**` yet (components import it — Track A excises atomically).
3. **Commit: Prisma re-baseline** — delete all 31 migrations; regenerate single `00000000000000_init` offline via `prisma migrate diff --from-empty --to-schema-datamodel` (+ `migration_lock.toml`); verify `.gitattributes` LF rule survived.
4. **Manual `.claude/` copy** (git-ignored in source): 5 agents, 5 commands (drop `nestpay-debug.md`), fresh minimal `settings.local.json` (git/npm/gh/node core only), empty elegant-gentlemen skeleton. Copy plan/design docs into `docs/plan/`.
5. **Commit: identity** — `package.json` name, `.mcp.json` Sentry slug, new `.env.example` (NESTPAY_*/TURNSTILE_* out; `PAYPAL_CLIENT_ID/SECRET/MODE`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_WEBHOOK_ID` in).
6. **Vercel project** — import repo, load envs, attach domain; `npm install`, `prisma migrate deploy`, `npm run dev` smoke.
7. **Commit: route renames (atomic)** — full Serbian→English slug table (476 occurrences/148 files; longest tokens first): marketing `cene→pricing, poruci→checkout(+success/failure), usluge→services, o-nama→about, kontakt→contact, cesto-postavljana-pitanja→faq, pravno→legal`; auth `prijava→login, registracija→register, verifikacija→verify-email, zaboravljena-lozinka→forgot-password, nova-lozinka→reset-password, portal-pristup→portal-access`; portal `porudzbine→orders, nova-porudzbina→new-order, finansije→finance, profil→profile, ai-kreacije→ai-creations, krediti→credits`; admin `upiti→inquiries, vr-upiti→vr-inquiries, korisnici→users, cenovnik→pricebook, izvoz→export, analitika→analytics, revizije→revisions`. Lockstep updates: `proxy.ts`, `src/lib/auth.ts` pages, `robots.ts` PRIVATE_PATHS, `sitemap.ts`, `next.config.ts` (**delete all 16 legacy Serbian redirects** — fresh domain), `NAV_MAIN/NAV_LEGAL` (also fixes pre-existing dead `/pravno/privatnost|uslovi|povracaj-sredstava` links), callbackUrl usages, `revalidatePath()` calls, link-emitting content (`email.ts`, chat prompt, `llms.ts`, blog), Bitrix portal links. Gate: quoted-route grep = 0 + `tsc --noEmit`.
8. **Commit: config-ID renames** (fresh DB = free now, never again): `TIMES_OF_DAY` jutro→morning…, `SEASONS` prolece→spring…, `ROOM_STYLES` primorski→coastal, `ServiceCategory` {eksterijer→exterior, enterijer→interior, planovi→plans, animacije→animations, transformacija→transformation}, service slugs (`virtuelno-opremanje→virtual-staging`, `dnevni-u-nocni-prikaz→day-to-dusk`, `render-u-stvarnoj-fotografiji→photomontage`, …full table in design-i18n-seo.md §1.1), blog slugs.
9. **Commit: image renames (manifest-driven)** — `docs/seo/artwork-rename-map.json` (old→new for ~222 files with Serbian tokens; grammar `{purpose}-{service-en}-{variant}.webp`) + `scripts/rename-artwork.mjs`: `git mv` + string-replace across 244 refs in 11 files + verify pass (0 old-name hits; every referenced path exists). Same commit: delete `public/branding/payments/*` (10 card logos), Next scaffold SVGs, `powered-by-whiterook.webp`; add handoff logos (`er-logo-*`, `wr-logo-horizontal-*`, `wr-icon-*`) to `public/branding/`.
10. **Commit: design token swap** — handoff `globals-international.css` → `src/app/globals.css`; `layout.tsx` fonts: Cormorant Garamond/Manrope → **Inter Tight** (400/500/600), add **JetBrains Mono** (400/500) as `--font-mono`; remove usages of deleted classes (`sidebar-attention-pulse|orbit-glow|grain-soft`).
11. **Commit ownership table into `AGENTS.md`** (Codex reads its own boundaries). Tag `phase-1-done` = **S0**.

---

# Architecture (Track A core — full detail in design-payments.md)

**PayPal (Orders v2 + JS SDK, no npm dep):** recover from `b4d0740^` and harden. Rewrite `src/lib/payment/paypal.ts`: `createPayPalOrderMinor(amountMinor, currency, referenceId)` (parameterized currency, zero-decimal JPY/HUF handling, `PayPal-Request-Id` idempotency header, `NO_SHIPPING`/`PAY_NOW`), `capturePayPalOrder` (keep capture ID; handle eCheck `PENDING` without completing), new `getPayPalOrder`, `refundPayPalCapture`, `verifyPayPalWebhookSignature` (API-based, `PAYPAL_WEBHOOK_ID`). Recovered server actions `createPayPalOrderAction`/`capturePayPalOrderAction` keep both idempotency guards; success flows into existing provider-neutral `finishSuccessfulPayment`/`finishFailedPayment`/`transitionOrder` seams. One unified `src/components/payments/paypal-buttons.tsx` (checkout + portal + charges). Three completion paths: capture-on-return (primary), **webhook** `api/paypal/webhook` (signature-verified, deduped via new `PaymentWebhookEvent` table; handles COMPLETED/DENIED/REFUNDED incl. dashboard refunds), **reconcile cron** `api/cron/paypal-reconcile` (`*/15 * * * *`, replaces nestpay cron, properly `CRON_SECRET`-gated). Admin full-refund action (finance-gated); partial refunds via PayPal dashboard + webhook sync.

**Schema (fresh baseline, no renames migration):** author directly — `PaymentProvider` {paypal, wire_transfer, card_mock}, `BillingCurrency` EUR, `*Rsd`→`*Eur` field names, nestpay* forensic block → `paypalOrderId/CaptureId/CaptureStatus/PayerEmail/PayerCountry/ResponseRaw/LastQueryAt` + charged snapshot `chargedCurrency/AmountMinor/FxRate/FxAsOf`, partial index `orders_paypal_pending_idx`, new `PaymentWebhookEvent` model. Same on `OrderCharge`.

**Currency engine (`src/lib/currency/` — the only new subsystem):** `config.ts` (21 PayPal currencies, per-currency `minorUnits`, `roundUpIncrement`, `ending: "nine"|"increment"`, locale; country→currency map + region fallback, default EUR), `fx-rates.ts` (manual monthly snapshot constants — round-up margin absorbs drift; documented update ritual), `convert.ts` (pure, unit-tested; **round UP to increment then −1 for x9 endings** per locked decision), `convert-quote.ts` (per-line conversion; total = Σ converted lines, preserving the sum invariant). Re-expand seams: `display-currency.ts` (`getDisplayCurrencyForCountry` → geo via existing `x-vercel-ip-country` reader) and `billing.ts` (EUR-only billing; `buildChargeSnapshot`). Charge currency locked server-side at `createOrder` (client never supplies amounts); PayPal charges exactly what was displayed. Propagation: chatbot (free via `formatPublicPriceText`), JSON-LD always EUR (static pages), dataLayer/GA4 = charged currency, PostHog `*_eur` + charged props, Bitrix `CURRENCY_ID:"EUR"` + "Charged: 189.00 USD (rate 1.09)" comment line.

**Checkout `src/app/(marketing)/checkout/`** — 2 steps: **Step 1 details** (name+email → `ensureCheckoutUser`; order summary in charge currency; collapsed "I'm buying as a business" toggle → company name/address/country + optional VIES-checked VAT ID; optional note; two required checkboxes: Terms + **EU CRD art. 16(m) withdrawal waiver** — kept, existing plumbing) → `createOrder` + charge snapshot. **Step 2 payment** (PayPal buttons + recap; no Turnstile/installments/trust badges/bank copy). Upload → `SuccessScreen` + `portal/orders/[orderId]` via extracted `OrderFileUpload` (endpoints already payment-agnostic); `source_files_reminder_email` outbox event (24h). `success/`+`failure/` pages with PayPal receipt (capture ID, amount, currency) + purchase dataLayer. Dropped: PIB/MB, `company_rs`, Turnstile, taksit.

**VAT/invoices:** every invoice = **export invoice, EUR, 0% Serbian VAT** (existing `isExportInvoice` machinery becomes the only path); promote existing English `company_foreign` STRINGS table in `invoice-pdf.tsx` to sole layout; VAT line "VAT 0% — export of services" (article text confirmed with accountant); reverse-charge note when EU VAT ID present; footer reconciliation line "Paid via PayPal: 189.00 USD (rate …), capture …"; `IMPRINT.bank` → White Rook EUR account (owner supplies IBAN/SWIFT). `buyer-validation.ts` re-modeled {individual, business}. **Open tax flags (non-blocking, safe default implemented):** ESS/OSS classification for EU B2C (bespoke human work → likely not ESS; get written advisor confirmation), SEF/ESIR non-obligation confirmation, UK/CH/AU registrations.

---

# Parallel tracks (after S0) — strict path ownership

| Track | Agent | Exclusive paths | Work |
|---|---|---|---|
| **A — Money & platform core** | **Claude** | `prisma/**` · `src/lib/{payment,currency,billing,buyer-validation,invoice-*,proforma-*,outbox,catalog}/**` · `src/server/**` · `src/app/api/**` · `src/app/(marketing)/checkout/**` · `src/components/payments/**` + portal payment cards · `src/lib/analytics/**`, `posthog-events.ts` · `vercel.json`, `.github/**`, `next.config.ts`, `scripts/**`, `.env.example` | Nestpay excision (atomic), PayPal restore+hardening, schema, currency engine, EUR catalog re-derivation from `pillar-1-extracted.md`, 2-step checkout, invoices, analytics/CRM currency, crons |
| **B — Portal/auth/comms translation** | **Codex** | `src/app/portal/**` · `src/app/(auth)/**` · `src/components/portal/**` (minus 2 payment cards) · `src/components/{chat,configurator}/**`, `src/lib/chat/**` · `src/lib/email.ts` (after S1) · `TESTING.md` | Portal/admin/auth EN translation, `status-utils.ts`, 13 email templates, chatbot prompt (flip language rule, EUR examples, **`:::predlog`→`:::proposal` in prompt AND `chat-messages.tsx` parser**), validation/server-action strings |
| **C — Marketing redesign + brand** | **Claude** (Davenport + frontend-design skill) | `src/app/(marketing)/**` (minus checkout) · `src/components/{marketing,site}/**` · `src/lib/content/site.ts` · `public/**` · `layout/sitemap/robots/manifest` | Homepage per `Homepage.dc.html` (copy verbatim — final), new `before-after-slider.tsx` (demo swipe + cursor tracking per handoff non-negotiables), header/footer rebuild (badge strip out, WR attribution in), consent banner EN, `seo.ts` rework, og-image |
| **D — SEO/legal/docs** | **Codex** | `src/app/(marketing)/legal/**` · `src/lib/{seo→read-only,llms}.ts`, `blog.ts` · `docs/**` · `.claude/agents+commands` (translation) | EU legal set (below), llms.txt EN, docs port, agent-prompt translation. May read but not edit `site.ts` — requests IMPRINT/JSON-LD changes via note file; Claude applies in C |

**Legal set (Track D):** `legal/imprint` (rewrite; EU rep art. 27 placeholder → **owner must appoint pre-launch**), `legal/terms` (rewrite; Serbian law + Rome I art. 6 consumer carve-out; CRD 2011/83; **ODR platform link removed — discontinued July 2025** → ADR wording), `legal/privacy` (standalone; GDPR only, ZZPL out; third-country transfer section + SCCs; EU-region Supabase helps), `legal/cookies` (translate + vendor table update: +PayPal, −Nestpay/LinkedIn), `legal/refunds` (rewrite: PayPal refunds to original funding source/currency, timelines), `legal/withdrawal` (**new**: CRD 14-day right + art. 16(m) waiver + model withdrawal form Annex I(B)), `legal/complaints` (voluntary ≤14-day procedure), `legal/delivery` + `legal/certificates` (straight translation).

**Sync points:** **S0** Phase 1 pushed · **S1** Nestpay excision + PayPal restore + schema landed (unblocks Codex on email.ts etc.) · **S2** EUR catalog constants done → catalog copy handoff to Codex · **S3** integration freeze: Claude rebases/merges all, `tsc` + `vitest` + sandbox E2E, Whitfield gate · **S4** launch gate (live webhook, Bitrix outbound, DNS/GTM flips).

**Branch discipline:** Claude = integrator, direct-to-main (`/ship`); Codex on `codex/<package>` branches, PR per work package, Claude reviews + merges at sync points. PR touching paths outside the author's column = rejected. Main always passes `tsc --noEmit`.

# Model/effort per track (item 13)

| Work | Model | Effort | Why |
|---|---|---|---|
| Phase 1 bootstrap/renames/token swap | Claude **Fable 5** | medium | Repo-wide atomic correctness |
| Track A payments/currency/schema | Claude **Fable 5** | **high** | Real money, idempotency, webhooks, rounding — the place to overspend |
| Track C marketing rebuild | **Fable 5** orchestrating, **Sonnet** subagents for per-component sweeps | medium | Pixel-specified handoff; judgment top, mechanics delegated |
| Claude bulk string sweeps | **Sonnet** subagents + Fable spot-review | low | Glossary-driven translation is Sonnet-safe |
| Codex Track B translation | `gpt-5-codex` | medium | Large but mechanical |
| Codex chat prompt + `:::proposal` parser | `gpt-5-codex` | high | Prompt+parser lockstep, behavioral |
| Codex Track D legal | `gpt-5` reasoning | **high** | Liability, not bugs |
| Codex docs/agents translation | `gpt-5-codex` | low/medium | Low stakes |

Never give Codex: `prisma/**`, `src/lib/{billing,currency,payment}/**`, `catalog/calculate.ts`, `server/actions/payment*`.

# Docs & agent scaffolding (item 14)

- `AGENTS.md`: keep nextjs-rules block; English directives; **embed the ownership table** (self-enforcing split).
- `CLAUDE.md`: port house rules; pricing → "integer EUR cents, displayed in buyer's PayPal currency via display-currency.ts"; payments → PayPal seams; keep Prisma7 path / base-ui / proxy.ts / migrate-dev-never-db-push / mutation pattern / status gates / Elegant Gentlemen table.
- `docs/platform-decisions.md`: fresh, same template; entry #1 = "EN/EUR/PayPal fork from elegant-render-platform @ <hash>". **Every platform-characteristic change gets an entry — the thorough change documentation you asked for.**
- **Elegant Gentlemen translated to English**: Beaumont's bible = new `docs/brand-book.md` rewritten from the White Rook handoff; Carrington's rules swap RSD→EUR-cents, Nestpay→PayPal, Serbian-routes rule dropped; Whitfield greps updated; new `/paypal-debug` command replaces `/nestpay-debug`; keep `/eg`, `/ship`, `/artwork`, `/sentry-triage`, `/test-user`.
- `docs/copy-glossary.md`: terminology (render, virtual staging, day-to-dusk, photomontage, estimate-not-quote, sentence case, no exclamation marks) — both agents follow it.
- CI: `ci.yml` (nestpay step out, PayPal signature unit test in), `verify-pricing.yml` → EUR verifier. `TESTING.md`/`README.md` full EN rewrites.

# Things you missed — added to plan (item 12)

1. **GDPR art. 27 EU representative** — legally required for EU-facing Serbian controller; currently "in progress" on .rs. Appoint before launch (service providers exist, ~€100–300/yr).
2. **`info@elegantrender.com` receiving mailbox** — Resend only sends; set up forwarding/Workspace.
3. **Tax classification (ESS/OSS)** — written advisor confirmation that bespoke renders ≠ electronically supplied services (else non-Union OSS registration needed). Schema is ready either way.
4. **Cross-domain hreflang** — .com pages link `sr` → elegantrender.rs; the .rs site should add reciprocal `en` links (small change on the Serbian repo, flag for later).
5. **New OG image** (1200×630, White Rook style) — asset production task.
6. **EUR bank account details** for proforma/wire-transfer invoices (owner supplies IBAN/SWIFT).
7. **eCheck PENDING captures** — buyer UX copy "payment processing"; webhook completes later.
8. **FX update ritual** — monthly `fx-rates.ts` refresh; documented in runbook (future: ECB cron).
9. **LinkedIn Insight tag removal** (partner ID belongs to .rs) — re-add with own ID if LinkedIn ads planned.
10. **Sitemap/GSC/Bing submission + GTM publish** as explicit launch-day steps; Google Ads conversion runbook ported with EUR values.
11. **Price-point reconciliation**: pillar-1 EUR list (€170/€250/€295) vs design-handoff copy (€169/€249/€294) — x9 psychological locked; catalog uses x9-adjusted pillar-1 values; final price table gets your sign-off before launch.

# Verification

1. **Unit/CI**: port `calculate.test.ts` (EUR), `status-transitions.test.ts`, re-model `buyer-validation.test.ts`; new `convert.test.ts` (round-up-then-minus-one property: result ≥ raw conversion; zero-decimal currencies); `verify-pricing.ts` EUR; `tsc --noEmit` green on every main push.
2. **Sandbox E2E (S3)**: create→approve→capture happy path; eCheck PENDING→webhook completion; admin refund; dashboard refund→webhook sync; reconciler recovery of killed capture; HUF/JPY zero-decimal order; charge-amount mismatch fail-closed; post-payment upload + AV scan; Bitrix deal created in EN pipeline with EUR + stage sync both directions; invoice PDF (EUR, reverse-charge variant); all 13 emails render.
3. **Grep-zero gates**: Serbian route tokens in quoted paths; old artwork filenames; `RSD|dinar|PDV`; `sr-Latn|sr-RS`; `predlog`; `nestpay|NESTPAY|Turnstile`; `9178042`; `GTM-5X2MCQ87`; `elegantrender.rs` (except hreflang sr).
4. **Visual**: diff every page vs handoff `screenshots/` (ground truth); Lighthouse SEO on home/pricing/service/legal; Rich Results Test on JSON-LD.
5. **Launch checklist (S4)**: live PayPal webhook delivering, `PAYPAL_MODE=live` + one real €1-class test order + refund, GTM live with Consent Mode v2 verified, sitemap submitted, EU rep named in imprint.
