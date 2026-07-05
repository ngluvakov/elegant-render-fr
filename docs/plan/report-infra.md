Exploration complete. Here is the full meta-infrastructure report.

---

# META-INFRASTRUCTURE REPORT — Elegant Render Platform

Repo root: `C:/Users/ngluv/Desktop/Platform` (paths below are relative to it). **Critical replication caveat: `.claude/` is git-ignored (`.gitignore` line 44 `.claude/`), so the entire agent team, commands, and session history are LOCAL-ONLY and will NOT come across in a `git clone`. They must be copied manually into the new project.**

---

## 1. `.claude/` setup

### 1.1 Permissions

**`.claude/settings.json`** (committed-intent, tiny — 5 allow rules): only VS Code tunnel / winget install helpers. Not project-specific.

**`.claude/settings.local.json`** (the real allowlist, ~66 rules under `permissions.allow`). Notable entries to replicate the workflow: `Bash(git push:*)`, `Bash(git commit:*)`, `Bash(git add:*)`, `Bash(git checkout *)`, `Bash(git cherry-pick *)`, `Bash(git branch *)`, `Bash(git stash *)`, `Bash(npm run:*)`, `Bash(npm install:*)`, `Bash(npx:*)`, `Bash(node:*)`, `Bash(gh pr *)`, `Bash(gh api *)`, GitHub CLI absolute-path variants, `PowerShell(Stop-Process *)`, `Bash(taskkill //f //im node.exe)`. Many one-off entries are historical cruft (unzip of White Rook handoffs, sed image-size rewrites) — the new project needs only the git/npm/gh/node core. **No `deny` list exists.** Note: `git push:*` being pre-approved is what makes `/ship` and Mr. Whitfield’s gate meaningful.

### 1.2 The five "Elegant Gentlemen" subagents — `.claude/agents/*.md`

Each is a Markdown file with YAML frontmatter (`name`, `description`, `tools`, `model: sonnet`) followed by a structured system prompt. The `description` of every one ends with the identical guard: *"Do not auto-delegate. Invoke only via /eg, the phrase 'Elegant Gentlemen', or explicit @-mention."* All five are `model: sonnet`. Common prose sections: a persona intro, a "what you watch/enforce" list, a **write-scope** clause, a **round-table protocol** (Round 1 → `01-<slug>.md`, Round 2 → `02-<slug>.md`), and an **output style** ("A gentleman is brief").

| File | Slug | Tools | Remit / structure highlights |
|---|---|---|---|
| `eg-architect-davenport.md` (4658 B) | `eg-architect-davenport` | Glob, Grep, Read, **Edit, Write**, Bash, WebFetch | **The only gentleman who writes production code.** Write scope: `src/app/**`, `src/components/**`, `src/styles/**`, `tailwind.config.*`, own study `.claude/elegant-gentlemen/davenport/`. Forbidden: `prisma/**`, `src/server/**`, `src/lib/catalog/**`, `src/generated/**`, `proxy.ts`, `docs/**`, other studies. Lists the full house-rules set. May run `npm run dev/build`, `npx tsc --noEmit`, read-only git. Uses `frontend-design` skill. Round-table: writes `01/02-davenport.md`, executes after `decision.md`, drops `davenport/<topic>-rationale.md` or `davenport/handoff-<topic>.md`. |
| `eg-conversion-ashford.md` (3351 B) | `eg-conversion-ashford` | Glob, Grep, Read, Edit, Write, WebFetch (no Bash) | Conversion & funnel; Serbian `sr-Latn-RS` CTA copy. Watches funnel routes (`(marketing)/page.tsx`, `usluge`, `cene`, `poruci`, `portal/nova-porudzbina`, order detail, `kontakt`, FAQ). Writes only under `ashford/audits/<YYYYMMDD>-<area>.md` and `ashford/proposals/<topic>.md`. Defends EUR-integer-excl-VAT + Serbian-vocabulary rules. |
| `eg-design-beaumont.md` (3151 B) | `eg-design-beaumont` | Glob, Grep, Read, Edit, Write (no Bash) | Design & brand critic; bible is `docs/brand-book.md`. Guards sage/clay palette, hierarchy, restraint, base-ui-not-radix imports, tokens-over-hex. Writes only `beaumont/critiques/<YYYYMMDD>-<area>.md` and `beaumont/specs/<topic>.md`. Proposes token changes for Davenport to apply. |
| `eg-stack-carrington.md` (4172 B) | `eg-stack-carrington` | Glob, Grep, Read, Edit, Write, Bash | Stack & code reviewer (read-only on `src/`). Enumerates 14 house rules (Next16 `proxy.ts`, Prisma7 `@/generated/prisma/client`, dotenv+PrismaPg(DIRECT_URL) in scripts, `migrate dev` never `db push`, pooled vs direct URL, base-ui, Tailwind4 CSS vars, mutation pattern, integer-EUR, status gates, no `window.confirm`, 600ms autosave, Serbian routes, `OrderItem.configJson`). Read-only Bash only. Writes `carrington/reviews/…` and `carrington/patches/…`. |
| `eg-deploy-whitfield.md` (3010 B) | `eg-deploy-whitfield` | Glob, Grep, Read, Edit, Write, Bash | Pre-deploy gate before `git push origin main`. Runs `npm run build`, `tsc --noEmit`, `npm run lint`, `prisma migrate status`; greps changed files for `@prisma/client`, `middleware.ts`, `@radix-ui/`, `window.confirm`, float literals in pricing, `db push`, stray console/TODO. Writes `gate.md` in session (or `whitfield/reports/<ts>.md`). Verdict `PASS`/`FAIL` first. Read-only Bash; never commits/pushes/migrates. |

### 1.3 Slash commands — `.claude/commands/*.md`

Six commands, each with frontmatter (`description`, `argument-hint`) + procedural body:

- **`eg.md`** — Convenes the round-table. 7-step orchestration: open session folder `.claude/elegant-gentlemen/sessions/<YYYYMMDD-HHMM>-<slug>/`, write `brief.md`, Round 1 (parallel agents → `01-*.md`), Round 2 (sequential Ashford→Beaumont→Carrington → `02-*.md`), moderator writes `decision.md`, **user must approve before execution**, Davenport builds UI (main Claude does non-UI), Whitfield gate → `gate.md`, adjourn. Dismissal writes `dismissed.md`.
- **`ship.md`** — Type-check + commit + push to main. Pre-flight (`git status/diff/log`, `tsc --noEmit`), gate (stop on tsc fail / non-main branch / no changes), infer commit subject (lowercase scope prefix e.g. `checkout:`), stage by name (never `-A`), HEREDOC commit with `Co-Authored-By: Claude Opus 4.7 (1M context)`, `git push origin main`, never `--force`/`--no-verify`. Has a `cleanup` mode for orphan branches.
- **`artwork.md`** — Unzip artwork from `~/Downloads`, convert PNG/JPG→WebP (ImageMagick/cwebp/squoosh, q85 sRGB stripped), place under `public/images/<slug>/`, update component refs, don’t commit.
- **`nestpay-debug.md`** — Parse a NestPay response, recompute the ver2 SHA-512 hash, diff field-by-field, Turnstile sanity, compliance crosscheck. (Payment-specific; new project uses PayPal so this is replaceable by a `paypal-debug` analog.)
- **`sentry-triage.md`** — Parse a Sentry alert, locate in code, root-cause by error class (Prisma P2025/P2002, null findUnique, role-check drift, status-gate violations), suggest fix without applying.
- **`test-user.md`** — Provision a DB test user via the dotenv+PrismaPg bootstrap: parse email/role/credits/name, inspect `prisma/schema.prisma` for actual field names, generate 12-char password, write `scripts/seed-test-user.ts`, run, report login block. Never `db push`, never commit password.

### 1.4 Skills — `.claude/skills/`

One directory, `integration-nextjs-app-router/`, which is **empty** (placeholder). No functional project-local skills. (The rich skill set is host-provided.)

### 1.5 `elegant-gentlemen/` directory conventions

Per-gentleman "study" folders + a `sessions/` root. Structure:
```
.claude/elegant-gentlemen/
  ashford/{audits,proposals}/
  beaumont/{critiques,specs}/
  carrington/{patches,reviews}/
  davenport/notes/
  whitfield/reports/
  sessions/<YYYYMMDD-HHMM>-<topic-slug>/
      brief.md  01-<slug>.md ... 02-<slug>.md ... decision.md  gate.md  dismissed.md
```
Five real sessions exist as reference exemplars (e.g. `20260529-1706-bi-checkout-compliance/` contains `brief.md`, `01/02-{ashford,beaumont,carrington}.md`, `03-davenport.md`, `decision.md`, `gate.md`). Naming: session slug is date-time + kebab topic; each gentleman writes only his own numbered note; moderator (main Claude) owns `brief.md`/`decision.md`/`dismissed.md`; Whitfield owns `gate.md`. Also present: `.claude/scheduled_tasks.lock` (runtime lock, `{sessionId,pid,acquiredAt}` — not to replicate).

---

## 2. `AGENTS.md`, `README.md`, `TESTING.md`

**`AGENTS.md`** (712 B) — Two parts: (1) a `<!-- BEGIN:nextjs-agent-rules -->` block ("This is NOT the Next.js you know… read `node_modules/next/dist/docs/` before coding"); (2) two Serbian directives: read `docs/agent-team-charter.md` when the user asks for agent/team/parallel work, and update `docs/platform-decisions.md` when a change touches conversion/pricing/brand/order-lifecycle/auth/payments/CRM/architecture. **`CLAUDE.md` begins with `@AGENTS.md` import.**

**`CLAUDE.md`** (6048 B) — The house-rules bible. Sections: stack deviations (Prisma7 client path, base-ui not radix, `proxy.ts`, Tailwind4 vars, Auth.js v5); the dotenv+PrismaPg script bootstrap snippet; migration workflow (`migrate dev` never `db push`, baseline `00000000000000_init`); Serbian domain vocabulary; pricing SoT (`src/lib/catalog/configurator.ts` + `calculate.ts` → `calculateQuote`); mutation pattern (server action → `revalidatePath` → `router.refresh`); order status gates; deploy (push-to-main = prod); chatbot `:::predlog` blocks; and the Elegant Gentlemen table + engage/dismiss triggers + write scopes. **Says pricing is RSD-integer-PDV-included — this is the current live state (post-2026-06-17 RSD-only migration); the new EN project reverts to EUR + PayPal.**

**`README.md`** (15,248 B) — Full project doc: tech-stack table, an extensive ASCII `Project Structure` tree (app routes, components, lib, server/actions, server/bitrix), Key Data Flows (order lifecycle, **Bitrix24 two-way sync map**, order status machine `draft→awaiting_payment→paid→in_progress→in_review→revision_requested⟲→delivered→closed`; terminal `cancelled/refunded`), dev/db commands, key accounts, brand tokens (coal/ivory/clay/sage/sand, Cormorant Garamond + Manrope — note this differs from the sage/clay described in agents), documentation index. Payments row says "Banca Intesa NestPay HPP + dev mock" (to be replaced by PayPal).

**`TESTING.md`** (12,653 B, Serbian) — A 10-section manual QA checklist (~330 checkboxes), NOT automated tests: (1) marketing/nav/SEO, (2) auth incl. Google OAuth, (3) pricing configurator, (4) **checkout flow incl. §4.5 mock card + §4.6 NestPay** `currency=941`/RSD minor-units (the sections to rewrite for PayPal/EUR), (5) client portal + AI Studio, (6) admin, (7) **Bitrix24 sync** outbound/inbound/reconcile (must survive), (8) email, (9) error handling, (10) pre-launch checklist. Serbian throughout — needs full EN translation.

---

## 3. `docs/**` tree & conventions

Top-level docs (Serbian unless noted):
- **`platform-decisions.md`** — the ADR/decision-log (see §3.1).
- **`agent-team-charter.md`** — the Codex on-demand agent-team charter (Lead Orchestrator + 4 roles: Conversion, UX/Design, Platform Engineer, QA/Docs; max 5; activation/pause commands; recommended team compositions; output format Findings/Recommendations/Acceptance/Docs-impact). This is the *conceptual* charter that the concrete Elegant Gentlemen implement.
- **`brand-book.md`** — palette/voice/principles (Beaumont’s bible).
- **`plan-v1.md`** — original 6-phase build plan.
- **`launch-checklist.md`**, **`search-console.md`**, **`ga4-post-launch.md`**, **`gtm-post-launch.md`**, **`google-ads-gtm-conversions.md`** — analytics/SEO runbooks.
- **`ai-studio-usluge.md`** — AI Studio service doc.
- **`pricing/pillar-1-extracted.md`** + **`pricing/WhiteRook_Pricing_Pillar1_EUR.pdf`** — the **canonical EUR pricing source** (Model-First pricing: €250 static exterior, €335 360, €420 aerial, €170 interior base/10 rooms, discount rules 1–4). **This is the EUR source of truth the new project should re-derive its catalog from — the current live site converts these to RSD; the EN project keeps them as EUR.**
- **`lovart-image-briefs-*.md`** (~18 files) — per-service image-generation briefs (naming/aspect conventions used by `/artwork`).
- **`Documents from other LLMs/`** — handoff docs + a page suggestion tsx/css.
- **`Placanje karticama/`** — Nestpay/Banca Intesa integration pack: `STATUS-NESTPAY-INTEGRATION.md`, `NESTPAY-PRELAZAK-NA-PRODUKCIJU.md`, PDFs/DOCX manuals, test-card lists, the full card-brand logo tree, and a `pilot/` folder. **All of this is card-payment-specific and obsolete for the PayPal project** (git-ignores `pilot.zip`/`pilot/`).

### 3.1 Documentation conventions

- **Decision log / ADR = `docs/platform-decisions.md`.** Has an explicit `## Template` block. Each entry: `## YYYY-MM-DD - Title` then bullets **Oblast promene** (area: conversion|design|pricing|order lifecycle|auth|payments|CRM sync|architecture|docs|other), **Šta se promenilo**, **Zašto**, **Uticaj na** conversion/design/code/docs, **Povezani fajlovi**, **Reference**. ~25 entries newest-first. Highly relevant entries for the new project: `2026-06-17 RSD-only + PayPal removal` (documents exactly what to *reverse*: Prisma enum EUR/PayPal values removed, `*Rsd` field renames, PayPal stripped from checkout/portal/server-actions/env), `2026-05-27 RSD+PDV`, and the whole NestPay series `2026-05-29 → 2026-06-22` (what to strip out). **`.env.ai-preview` still carries the old PayPal env var names — see §7.**
- **No CHANGELOG.md, no numbered ADR files.** The single decision log is the convention. AGENTS.md enforces "update `platform-decisions.md` on platform-characteristic changes."
- Runbooks are free-form per-topic `.md` files in `docs/` root.

---

## 4. `scripts/**` (all `npx tsx`, dotenv+PrismaPg bootstrap)

**Seeds / accounts:**
- `seed-admin.ts` — upsert `admin@elegantrender.rs` (bcrypt cost 12, `isAdmin=true`, `canManageFinance=true`, pw `Admin2026!`).
- `seed-client.ts` — upsert `klijent@elegantrender.rs` (pw `Klijent2026!`).
- `seed-test-users.ts` — idempotent trio: user / admin-no-finance / finance-admin.
- `create-bojan-account.ts` — one-off real client + 50 AI credits.
- `grant-finance-admin.ts` — flip `canManageFinance` (+`--revoke`).
- `grant-test-credits.ts` — grant AI credits (balance + txn row + expiry, skips outbox email).

**Bitrix (CRM — must survive):**
- `bitrix-setup.ts` — **creates the "Elegant Render" pipeline + stages in Bitrix24 via `BITRIX24_WEBHOOK_URL`.** This is the CRM bootstrap script the new project must keep/port.

**Pricing verifiers (CI-run, DB-free — the ones to PORT to EUR):**
- `verify-pricing.ts` — exercises cross-service discount engine (Rules 1–4) against spec bundles; run in CI (see §5).
- `verify-interior-pricing.ts` — per-floor interior math.
- `verify-tour360-pricing.ts` + `verify-tour360.ts` — int-360 hotspot/floor/assembly math (latter documents an intentional divergence from the pricebook: flat 10-hotspot quota +3164 RSD each).

**Payment (NestPay — obsolete for PayPal project):**
- `nestpay-hash-test.ts` — **runs in CI** (`ci.yml` "NestPay hash sanity"); validates BIB positional hash template. Replace with a PayPal-webhook-signature test if desired.
- `nestpay-storekey-probe.ts` — brute-check a candidate StoreKey against a bank HASH.

**Auth/Google debugging:** `debug-user-auth.ts`, `check-all-google.ts`, `reassign-google-account.ts`, `unlink-google-account.ts` (all address the Auth.js v5 Google-account-linking gotcha — relevant since the new project keeps Google OAuth).

**Data migrations / maintenance (one-off, project-history specific):** `migrate-anim-products.ts`, `wipe-int-static-floors.ts`, `rename-int-static.ts`, `reset-test-data-keep-users.ts` (guarded by `--yes`/`RESET_TEST_DATA_KEEP_USERS=1`).

**Diagnostics / smoke:** `sentry-smoke-test.ts`, `test-resend.ts`.

**Image pipeline (`.mjs`, sharp-based):** `build-portfolio-images.mjs`, `build-portfolio-videos.mjs`, `compress-tablica-images.mjs`, `optimize-3d-osnove{,-portfolio}.mjs`, `optimize-landscape-before-after.mjs`, `optimize-style-images.ts`.

---

## 5. `.mcp.json` & `.github/**`

**`.mcp.json`** — one MCP server: `Sentry` at `https://mcp.sentry.dev/mcp/white-rook/javascript-nextjs`. (New project should repoint the org/project slug.)

**`.github/workflows/ci.yml`** (`name: ci`) — on push-to-main / PR / dispatch. Node 22, `npm ci` (postinstall runs `prisma generate`). Steps: `npx tsc --noEmit`, `npm run lint` (**`continue-on-error: true`** — non-blocking, TODO to make blocking after clearing ~26 lint debts), `npm test` (vitest), then **`npx tsx scripts/nestpay-hash-test.ts`** (env/DB-free). Comment notes full `next build` is intentionally NOT run here (needs DB + prod env; Vercel runs it). The Serbian comments are worth translating.

**`.github/workflows/verify-pricing.yml`** (`name: verify pricing engine`) — on PRs touching `src/lib/catalog/**`, `scripts/verify-pricing.ts`, or the workflow itself; plus dispatch. Node 20, `npm ci`, `npx tsx scripts/verify-pricing.ts`. **Path-triggered guard on the pricing engine — port this, pointing at the EUR verifier.**

No other workflows, no issue/PR templates, no Dependabot.

---

## 6. Testing setup

**`vitest.config.ts`** — minimal: `environment: "node"`, `include: ["src/**/*.test.ts"]`, alias `@ → src`. **Tests are colocated next to source (`*.test.ts`), not in a `/tests` dir.** `package.json` `"test": "vitest run"`.

**Three unit test files** (Serbian describe strings):
1. **`src/lib/catalog/calculate.test.ts`** — pricing invariants across the whole catalog: integer major-unit prices, cents/major consistency (<1 delta), `discountPct ∈ [0,100]`, `originalTotal ≥ total`, total = sum of items, `priceItems` agrees with `calculateQuote`, cross-service discounts can only lower total. Imports `calculateQuote, priceItems` from `@/lib/catalog/calculate` and `CONFIGURATOR_CATEGORIES`. **This is the payment/pricing test to port to EUR** (it asserts `totalRsd`/integer-ness — will need `totalEur` field renames). Exact business values are covered by `scripts/verify-pricing.ts`, not this file.
2. **`src/lib/order/status-transitions.test.ts`** — `canTransition` / `VALID_TRANSITIONS` from `@/lib/order/status-transitions`: happy path, revision loop, delivered→in_progress admin override, no payment-skipping, refund only from `paid`, terminal states have no exit. **Payment-adjacent — the `awaiting_payment`/`paid` gating must hold under PayPal too.**
3. **`src/lib/buyer-validation.test.ts`** — `validateBuyerInfo`: individual needs country, `company_rs` needs 9-digit PIB + name + address + optional 8-digit MB, `company_foreign` VAT-ID format, RS-company routing. **Serbian-tax-ID specific — for the EU/EN project this must be re-modeled to EU VAT rules** (the task’s "legal pages adapted to EU requirements" touches this).

There is no `next build` / integration / e2e test in CI; TESTING.md is the manual counterpart.

---

## 7. `.env.ai-preview`

Header `# Created by Vercel CLI` — it is a **Vercel-pulled env snapshot for the "ai-preview" deployment target**, not a hand-maintained file. Contains only NAMES (no values emitted here). Notably it **still contains PayPal variable names** — directly relevant because the new project re-introduces PayPal:
- PayPal: `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE`.
- Core app: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_URL`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `EMAIL_FROM`, `RESEND_API_KEY`, `SMTP_HOST/PORT/USER/PASS`.
- AI Studio: `OPENAI_API_KEY`, `GEMINI_API_KEY`, `AI_STUDIO_OPENAI_MODEL`, `AI_STUDIO_GEMINI_MODEL`, `AI_STUDIO_GEMINI_PRO_MODEL`.
- Vercel/Turbo build-env noise (`VERCEL_*`, `TURBO_*`, `NX_DAEMON`) — auto-injected, ignore.

This snapshot predates the RSD-only migration (which removed PayPal), so it is effectively a **template for the payment-provider env the EN project wants**: PayPal + Supabase + Auth + Google + Resend/SMTP + AI keys, and NO NestPay/Turnstile/Bitrix vars.

### Companion: `.env.example` (committed, 8723 B, the authoritative var catalog — NAMES only)

Grouped by `# ─── Section ───` headers. Full name set: Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL`), Auth (`AUTH_SECRET`, `AUTH_URL`), Google OAuth (`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`), **NestPay** (`NEXT_PUBLIC_NESTPAY_MODE`, `NEXT_PUBLIC_NESTPAY_INSTALLMENTS_ENABLED`, `NESTPAY_CLIENT_ID`, `NESTPAY_STORE_KEY`, `NESTPAY_BASE_URL`, `NESTPAY_QUERY_URL`, `NESTPAY_QUERY_USERNAME`, `NESTPAY_QUERY_PASSWORD`, `NESTPAY_TRAN_TYPE`, `NESTPAY_OID_PREFIX`) — **all to be replaced by `PAYPAL_*`**, Turnstile (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` — captcha for card payments, likely droppable with PayPal), **Bitrix24** (`BITRIX24_WEBHOOK_URL`, `BITRIX24_OUTBOUND_SECRET`, `BITRIX24_PIPELINE_ID`, and 11 `BITRIX24_STAGE_*` mapping vars — **must survive**), `CRON_SECRET`, email (`EMAIL_FROM`, `RESEND_API_KEY`, `ADMIN_NOTIFY_EMAIL`), AI (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `AI_STUDIO_*_MODEL`), file scanning (`CLOUDMERSIVE_API_KEY`), rate-limit (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`), analytics (`NEXT_PUBLIC_GA4_*`, `NEXT_PUBLIC_GTM_*`, `NEXT_PUBLIC_POSTHOG_*`, `POSTHOG_DASHBOARD_URL`), Sentry (`SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DASHBOARD_URL`), SEO (`GOOGLE_SITE_VERIFICATION`, `GOOGLE_SEARCH_CONSOLE_URL`, `BING_WEBMASTER_URL`, various `*_DASHBOARD_URL`). The NestPay section has a large explanatory comment block (test-vs-live HPP hosts, StoreKey rotation, TRAN_TYPE Auth=SMS) worth reading before ripping it out.

---

## 8. Scaffolding files needed to replicate

- **`package.json`** scripts: `dev`, `build` (`prisma generate && prisma migrate deploy && next build`), `start`, `lint` (`eslint`), `test` (`vitest run`), `postinstall` (`prisma generate`), `db:migrate` / `db:migrate:deploy` / `db:migrate:status`. Key deps: `next@16.2.9`, `react@19.2.7`, `@base-ui/react`, `@prisma/client@7` + `@prisma/adapter-pg`, `prisma@7`, `next-auth@5.0.0-beta.30`, `@auth/prisma-adapter`, `@supabase/supabase-js`, `resend`, `@sentry/nextjs`, `openai`, `posthog-js/node`, `@upstash/ratelimit`+`redis`, `@react-pdf/renderer`, `zod@4`, `sharp`, `bcryptjs`, `tailwindcss@4`. **No PayPal SDK yet** (`@paypal/*`) — must be added.
- **`vercel.json`** — 5 crons: `bitrix-reconcile` (`0 3 * * *`), `quote-cleanup` (`30 3 * * *`), `outbox-processor` (`* * * * *`), `invoice-reconcile` (`15 4 * * *`), `nestpay-reconcile` (`*/5 * * * *` — swap for a PayPal reconcile or drop). **Bitrix + outbox + quote/invoice crons carry over.**
- **`.gitignore`** — note `.claude/` and `/src/generated/prisma` and `.env*` and `.env.sentry-build-plugin` are ignored; artwork-originals and the Placanje-karticama pilot pack too.
- **`.gitattributes`** — `prisma/migrations/**/*.sql text eol=lf` (Prisma checksums exact bytes; CRLF on Windows would false-flag every migration as modified). **Essential to copy — the decision log documents a real incident this prevents.**
- Also present at root (adjacent config the orchestrator will replicate): `next.config.ts` (security headers, 301 redirects, Sentry wrap), `prisma.config.ts`, `sentry.{server,edge}.config.ts`, `.env.sentry-build-plugin`, `components.json` (shadcn/base-ui), `eslint.config.mjs`, `postcss.config.mjs`, `tsconfig.json`.

---

## 9. Replication checklist for the new EN project (meta-infra only)

1. **Copy `.claude/` manually** (git-ignored): the 5 agent `.md`s, 6 command `.md`s, and the empty `elegant-gentlemen/{ashford,beaumont,carrington,davenport,whitfield,sessions}` skeleton. **Translate agent prompts to English**, and rewrite the house-rules that change: routes become English (drop "Serbian routes are correct"), pricing becomes **integer EUR** (agents already say EUR-integer — keep), replace all NestPay/Banca-Intesa language with PayPal, and revise EU legal/VAT references.
2. **Rebuild `settings.local.json`** with just the git/npm/gh/node/PowerShell core allow rules (drop historical one-offs).
3. **`AGENTS.md` + `CLAUDE.md`** — port structure; flip the pricing statement from RSD-PDV-included to EUR; keep the Prisma7/base-ui/proxy.ts/mutation-pattern/status-gate rules; keep the "update `docs/platform-decisions.md`" convention.
4. **`docs/platform-decisions.md`** — start fresh with the same template; seed a first entry documenting the EN/EUR/PayPal fork. Keep `brand-book.md`, `pricing/` (the EUR pricebook is the SoT), and the analytics runbooks; drop `Placanje karticama/` and NestPay docs.
5. **CI** — keep `ci.yml` (translate comments) but swap the "NestPay hash sanity" step for a PayPal-relevant check or remove; keep `verify-pricing.yml` pointing at an EUR verifier.
6. **`.mcp.json`** — repoint Sentry slug.
7. **Tests** — port `calculate.test.ts` (rename `*Rsd`→`*Eur`), `status-transitions.test.ts` (unchanged conceptually), and **re-model `buyer-validation.test.ts` for EU VAT** instead of Serbian PIB/MB.
8. **Scripts** — keep `bitrix-setup.ts` (CRM survives), the seed/grant/verify-pricing family; drop the two `nestpay-*` scripts (add a `paypal-*` analog if useful); keep Google-account-repair scripts.
9. **Env** — new `.env.example` = the `.env.ai-preview` shape (PayPal + Supabase + Auth + Google + Resend/SMTP + AI + Bitrix + crons), minus all `NESTPAY_*`/`TURNSTILE_*`. Add `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`.
10. Copy `.gitattributes` verbatim; adapt `vercel.json` crons (keep Bitrix/outbox/quote/invoice; replace nestpay-reconcile).

No secret values were read or emitted — only variable names.
