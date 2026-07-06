# Handover — EUR/PayPal + translation WIP on `codex/track-b-portal-auth-copy`

**Audience:** the Codex session currently working in this checkout (and its successors).
**Written:** 2026-07-06 by Claude Code after a read-only state assessment. Claude has made
NO edits to `src/`, `prisma/`, or any production path — the only side effect of the
assessment was one `npx prisma generate` run (gitignored output, regenerated the client
from the new EUR/PayPal `schema.prisma`, which you want anyway).

Facts below were captured while the tree was being actively edited, so file-level details
may already be stale. Trust the checklists' *intent*; re-verify with the gate commands.

## 1. Where this work sits in the master plan

- `docs/plan/00-master-plan.md` is the source of truth. Tag `phase-1-done` (S0) exists.
- This working tree contains, uncommitted: **S1** (Nestpay excision + PayPal restore +
  EUR/PayPal schema + migration `prisma/migrations/20260706040000_eur_paypal_fork/`),
  most of **S2** (EUR catalog: `priceRsd`→`priceEur`, integer EUR), plus Track B
  translation (auth/portal copy) — ~200 modified, ~21 deleted, ~9 untracked files.
- Nothing of this is on `main` (main = `543e302`). No PR is open.

## 2. Verified as already done (as of the assessment)

- `src/lib/payment/paypal.ts`, `src/lib/currency/` (config / convert / fx-rates + `convert.test.ts`),
  `src/app/api/paypal/webhook/`, `src/app/api/cron/paypal-reconcile/`,
  `src/server/finance/reconcile-paypal.ts`, `src/components/payments/paypal-buttons.tsx`
  (unified component; caller injects create/capture actions; handles eCheck `processing`).
- `src/server/actions/payment.ts` already exports `createPayPalOrderAction` and
  `capturePayPalOrderAction` alongside the provider-neutral
  `finishSuccessfulPayment` / `finishFailedPayment`.
- `src/lib/posthog-events.ts` provider unions already read `"card_mock" | "paypal"`.
- `prisma/schema.prisma` has `PaymentProvider.paypal`, `BillingCurrency.EUR`, `*Eur`
  fields, `paypal*` forensic block. `src/env.ts` is already clean of NESTPAY/TURNSTILE.
- Nestpay excision in progress: `src/lib/nestpay/`, `turnstile-widget.tsx`,
  `turnstile-keys.ts` observed deleted mid-assessment; new `checkout-wizard.tsx`,
  `steps/step-details.tsx`, rewritten `step-payment.tsx`, `paypal-receipt.tsx`,
  `order-file-upload.tsx` observed appearing.

## 3. Remaining defects from the last full `npx tsc --noEmit` (2026-07-06, pre-your-latest-edits)

Re-run tsc; whatever of this list survives is yours to finish:

- [ ] `src/app/api/paypal/webhook/route.ts:23` — imports `@/lib/prisma`; this repo's
      client lives at **`@/lib/db`** (`import { prisma } from "@/lib/db"`).
- [ ] `src/app/(marketing)/checkout/checkout-context.tsx` — `"eur"` vs `ChargeCurrency`
      (`"EUR"`, upper-case ISO). Same class of bug in `scripts/verify-pricing.ts:313`.
- [ ] `checkout/success/page.tsx` + `failure/page.tsx` — still query provider
      `"nestpay"` and use `"nestpay_success_page"` as `PurchaseConversionSource`.
- [ ] `src/components/portal/pending-payment-card.tsx` and `charge-payment-card.tsx` —
      still import the removed `formatRsd` from `@/lib/catalog/calculate`; the portal
      order page already passes new props (`totalEur`, `billingCurrency`,
      `billingTotalCents`). Rewire to `PayPalButtons` + `createPayPalOrderAction` /
      `capturePayPalOrderAction`. **Note:** these two cards are the Track A payment
      cards — flag them explicitly in the PR description for Claude's review.
- [ ] Delete remaining dead Nestpay surface if still present:
      `src/app/api/nestpay/`, `src/app/api/cron/nestpay-reconcile/`,
      `src/server/actions/nestpay.ts`, `src/server/finance/reconcile-nestpay.ts`,
      `src/app/(marketing)/checkout/nestpay-redirect-form.tsx`,
      `src/components/marketing/nestpay-receipt.tsx`, `src/lib/cron-auth.ts` nestpay refs.
- [ ] `src/lib/email.ts` — still carries the `Nestpay*` email types/templates. Excise the
      Nestpay-specific ones (replace with PayPal equivalents where the flow needs them).
      The full 13-template English rewrite is the separate Track B package that unblocks
      once this lands (sync point S1).
- [ ] Chat lockstep rule: if `src/lib/chat/system-prompt.ts` gets the language flip, the
      `:::predlog` → `:::proposal` rename must change **in the same commit** as the
      parser in `src/components/chat/chat-messages.tsx` (and the
      `sessionStorage("er-chat-proposal")` key stays as-is — already English).

## 4. Gates — run all before committing (main must always pass tsc)

```bash
npx prisma generate
npx tsc --noEmit
npx vitest run
npx tsx scripts/verify-pricing.ts        # needs .env.local (DIRECT_URL)
# grep-zero sweeps (expect 0 hits in src/ outside comments):
grep -rniE "nestpay|turnstile|taksit" src/ --include="*.ts" --include="*.tsx"
grep -rnE "priceRsd|totalRsd|formatRsd|\"RSD\"" src/ --include="*.ts" --include="*.tsx"
```

## 5. Landing discipline

- Commit on this branch (`codex/track-b-portal-auth-copy`), push, open **one PR to
  `main`**. Prefer logically separated commits if feasible (excision+PayPal / EUR catalog
  / translation), but a green tree beats a pretty history.
- This branch crosses track boundaries: it touches money paths
  (`prisma/**`, `src/lib/{payment,currency,billing}/**`, `src/server/**`,
  `checkout/**`, the two portal payment cards) that per `AGENTS.md` are Track A
  (Claude-reviewed). That's acknowledged and accepted by the owner for this WIP —
  **but call these paths out in the PR body** so Claude's merge review focuses there.
- Do NOT push `main` directly — `git push origin main` is a production deploy and the
  new migration would run against the production DB. Claude merges after review.

## 6. Parallel packages for OTHER Codex sessions (do not do these in this checkout)

Branch each from `main`, one PR per package:

1. **`codex/track-d-legal` — EU legal set** (gpt-5 reasoning high). All of
   `src/app/(marketing)/legal/**` is Serbian. Spec in `00-master-plan.md` §Legal set:
   imprint (EU-rep art. 27 placeholder), terms (Rome I art. 6, CRD 2011/83, ADR wording,
   **no ODR link** — platform discontinued July 2025), privacy (GDPR-only + SCC section),
   cookies (+PayPal, −Nestpay/LinkedIn vendors), refunds (PayPal-specific), **new**
   withdrawal page (CRD 14-day + art. 16(m) waiver + model form), complaints, delivery,
   certificates. Follow `docs/copy-glossary.md`.
   ⚠ This checkout's session touched `legal/terms/page.tsx` — coordinate to avoid
   double work: legal belongs to the D package, not to this branch.
2. **`codex/track-d-docs`** — `docs/**` port to English, `src/lib/llms.ts` EN rewrite
   (a 4-line `basePriceRsd`→`basePriceEur` fix exists on this WIP branch — rebase or
   accept trivial conflict), `src/lib/content/blog.ts`, `.claude/agents/**` +
   `.claude/commands/**` translation.
3. **`TESTING.md`** full EN rewrite — single file, can ride with package 2.

Gated until this branch merges: `email.ts` 13-template rewrite (S1), catalog
label/description copy in `src/lib/catalog/configurator.ts` (S2 handoff).
