# Platform decisions

Lightweight decision and change log for key characteristics of the Elegant Render International platform at elegantrender.com. Update this file when a change affects conversion flow, pricing, brand/design rules, order lifecycle, auth, payments, CRM sync, architecture, or another behavior worth remembering.

The pre-fork Serbian platform history is preserved as a brief archive in `docs/platform-decisions-rs-archive.md`.

## Template

```md
## YYYY-MM-DD - Short decision title

- **Area:** conversion | design | pricing | order lifecycle | auth | payments | CRM sync | architecture | docs | other
- **What changed:** Short description of the actual change.
- **Why:** Reason, goal, or problem the change solves.
- **Impact on conversion:** None / short description.
- **Impact on design:** None / short description.
- **Impact on code:** None / short description.
- **Impact on docs:** None / which documents were updated.
- **Related files:** `path/to/file.ts`, `path/to/doc.md`
- **References:** PR, commit, issue, or chat context if available.
```

## 2026-07-06 - S1: PayPal live-path complete — EUR platform, Nestpay excised, 2-step checkout

- **Area:** payments | pricing | order lifecycle | conversion | architecture
- **What changed:** The whole money path now runs on PayPal Orders API v2 + JS SDK (no npm SDK): hardened client (`src/lib/payment/paypal.ts` — idempotency headers, zero-decimal currencies, ORDER_ALREADY_CAPTURED race handling, refunds, API-based webhook signature verification), server actions with double idempotency guards and a fail-closed captured-amount/currency check, signature-verified + deduped webhook (`api/paypal/webhook`, PaymentWebhookEvent table), reconcile cron every 15 min (CRON_SECRET-gated; auto-captures APPROVED orders < 3 h), finance-gated full-refund admin action. New currency engine `src/lib/currency/` (21 PayPal presentment currencies, geo via x-vercel-ip-country, manual monthly FX snapshot, round-UP-then-−1 marketable pricing; EUR passes through untouched); charge snapshot (chargedCurrency/AmountMinor/FxRate/AsOf) locked server-side at createOrder — client never supplies amounts; WYSIWYG guarantee display = charge. Catalog restored to its original EUR values from pre-b4d0740 history (€170 interior/floor, €250 exterior, €335 360°, €420 aerial …), verified by all four pricing scripts. Checkout collapsed 4→2 steps (details+consents → PayPal), file upload moved post-payment (SuccessScreen + portal, reusable OrderFileUpload), eCheck PENDING handled as an explicit "processing" state end-to-end. Nestpay + Turnstile fully excised (schema, code, crons, emails, UI). BuyerType remodeled {individual, business}; export invoices EUR/0% VAT with reverse-charge note; payment emails rewritten as English PayPal receipts. Bitrix deals now carry CURRENCY_ID EUR.
- **Why:** Core of the fork per `docs/plan/design-payments.md`: fastest path to sale with the fewest checkout steps PayPal permits, while keeping every legal consent (terms + CRD art. 16(m) waiver) and payment-forensics parity with the old bank flow.
- **Impact on conversion:** Checkout is 2 steps; upload no longer blocks payment.
- **Impact on design:** New checkout/portal payment surfaces in English; Track C restyle still pending.
- **Impact on code:** ~160 files across schema (migration `20260706040000_eur_paypal_fork`, applied to the live Frankfurt DB), server actions, currency engine, checkout, portal, emails, analytics (PurchaseConversionSource → paypal_*), env checks.
- **Impact on docs:** This entry; `.env.example` PayPal section landed earlier (P1.6).
- **Related files:** `src/lib/payment/paypal.ts`, `src/lib/currency/*`, `src/server/actions/{payment,charge-payment,admin-refund}.ts`, `src/app/api/paypal/webhook/route.ts`, `src/server/finance/reconcile-paypal.ts`, `src/app/(marketing)/checkout/**`, `prisma/schema.prisma`
- **References:** Sync point S1 (AGENTS.md); design: `docs/plan/design-payments.md`; recovery anchor `b4d0740^`.

## 2026-07-06 - EN/EUR/PayPal fork from elegant-render-platform @ 641d34c
## 2026-07-06 - EN/EUR/PayPal fork from the Serbian platform

- **Area:** architecture | payments | pricing | design | docs
- **What changed:** This repository became the international elegantrender.com fork: English routes and copy, EUR accounting, PayPal checkout, buyer-local display pricing, post-payment file upload, EU legal pages, and the White Rook international design system.
- **Why:** White Rook DOO is expanding Elegant Render to an international audience while keeping the proven portal, order, and CRM foundation.
- **Impact on conversion:** Checkout moves toward a shorter details to PayPal flow, with source-file upload after payment.
- **Impact on design:** The public site follows the international White Rook handoff: white canvas, black text, one green accent, Inter Tight, JetBrains Mono, compact radii, and restrained motion.
- **Impact on code:** Parallel ownership is enforced by `AGENTS.md`. Main must pass typecheck at all sync points.
- **Impact on docs:** `docs/plan/**`, `docs/copy-glossary.md`, `docs/brand-book.md`, and this log describe the fork.
- **Related files:** `AGENTS.md`, `docs/plan/00-master-plan.md`, `docs/copy-glossary.md`, `docs/design-handoff/README.md`
- **References:** Fork base `543e302`; current launch plan in the task handoff.