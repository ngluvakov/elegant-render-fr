# Platform decisions

Lightweight decision and change log for key characteristics of the Elegant Render International platform at elegantrender.com. Update this file when a change affects conversion flow, pricing, brand/design rules, order lifecycle, auth, payments, CRM sync, architecture, or another behavior worth remembering.

The pre-fork Serbian platform history is preserved as a brief archive in `docs/platform-decisions-rs-archive.md`.

## 2026-08-05 - Global privacy notice and online consumer-withdrawal function

- **Area:** order lifecycle | architecture | legal
- **What changed:** The English legal surface now has a `/legal` index, a processing-activity privacy notice, a runtime-aligned cookie inventory, corrected service-versus-digital-content withdrawal language, and a two-step online withdrawal function. A confirmed notice is timestamped on the server, copied to the operations mailbox, written to the audit log, and acknowledged to the consumer by email with a reference. Refunds, delivery, terms, complaints, and AI-readable legal discovery were aligned with the same consumer-rights model.
- **Why:** EU transparency rules require the privacy notice to connect data, purpose, lawful basis, recipients, transfers, retention, and rights. Since 19 June 2026, the amended Consumer Rights Directive also requires an online withdrawal function for eligible distance contracts concluded through an online interface.
- **Impact on conversion:** No checkout step was added. Consumers receive a separate legal function at `/legal/withdrawal#online-withdrawal`; submission does not automatically cancel, refund, or change an order status and remains subject to an operational review of the statutory effect.
- **Impact on design:** Legal pages keep the existing White Rook typography and card system. The new legal index makes all notices discoverable from one English route.
- **Impact on code:** Added a legal-page Server Action and client review step, plus transactional admin and customer acknowledgement emails. Existing inquiry rate limiting protects the public action until a dedicated limiter is added by the platform track.
- **Impact on docs:** Added the Track A/C and operational handoff with launch blockers and exact stale-link replacements.
- **Related files:** `src/app/(marketing)/legal/**`, `src/lib/email.ts`, `src/lib/llms.ts`, `docs/plan/legal-compliance-handoff.md`
- **References:** GDPR Articles 12-14 and 27; Directive 2011/83/EU Articles 8, 11a, 14, and 16 as amended by Directive (EU) 2023/2673; Directive (EU) 2019/770; Regulation (EU) 2024/3228.

## 2026-07-19 - Accounting document dates use the Belgrade calendar day

- **Area:** order lifecycle | architecture
- **What changed:** Invoice PDFs, proforma PDFs, and proforma due-date email copy now format accounting dates in the `Europe/Belgrade` timezone.
- **Why:** An accounting document must show one stable local calendar date across PDF and email output, including around UTC midnight and daylight-saving transitions.
- **Impact on conversion:** None.
- **Impact on design:** Date presentation is unchanged except where the server's UTC day previously differed from the Belgrade calendar day.
- **Impact on code:** Shared invoice/proforma output now supplies an explicit Belgrade timezone to date formatting. AI-credit expiry dates remain outside this accounting-date decision.
- **Impact on docs:** Added the corresponding QA check.
- **Related files:** `src/lib/invoice-pdf.tsx`, `src/lib/proforma-pdf.tsx`, `src/lib/email.ts`, `TESTING.md`
- **References:** Commit `faf328f`.

## 2026-07-19 - Plutos invoice sync added as a fail-open outbox integration

- **Area:** order lifecycle | payments | architecture
- **What changed:** Issued primary and additional (`OrderCharge`) invoices can now be submitted to Plutos through the existing outbox. The integration is disabled by default and bounded by `PLUTOS_SYNC_FROM`; it uses stable document IDs, reloads invoice data in the worker, validates totals and remote responses, persists sync/SEF state, supports reconciliation, and exposes manual send, retry, and refresh controls to `FINANCE_MANAGE` users. International individuals map to `individual_foreign`, businesses to `company_foreign`, and VAT is derived from the existing immutable invoice snapshot/billing rule.
- **Why:** Prepare elegantrender.com for Plutos and eventual SEF integration without coupling invoicing or payment success to an external service that is still being validated.
- **Impact on conversion:** None. Plutos enqueue and processing are best-effort; failures do not change PayPal capture, local invoice issuance, PDF generation, email, or Bitrix behavior.
- **Impact on design:** Admin order details now show Plutos state and finance-only recovery controls for primary and additional invoices.
- **Impact on code:** Additive nullable database fields and a new outbox event support the sync. The client uses an API-key header, an eight-second timeout, response validation, sanitized errors, existing retry behavior, and exact-cent payload guards. Reconciliation is limited to ten eligible invoices per pass and does not automatically backfill invoices before the configured cutoff.
- **Impact on docs:** Added the Track A implementation handoff and Plutos testing checklist.
- **Related files:** `prisma/schema.prisma`, `src/server/plutos/`, `src/app/portal/admin/orders/[orderId]/`, `src/lib/outbox.ts`, `docs/plan/plutos-com-core-handoff.md`, `TESTING.md`
- **References:** Commit `9750f43`; Plutos `.com` implementation plan and `docs/integracija/Sajt_Plutos_integracija_handoff.md`.

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

## 2026-07-17 - Bitrix reconcile hardened against a missing/empty Deal (STAGE_ID crash)

- **Area:** CRM sync
- **What changed:** `bitrixCall()` no longer returns `body.result` blindly cast `as T`. It now throws typed errors — `BitrixApiError` (preserves `code` = `error` and `description` = `error_description`) on a Bitrix error payload, and `BitrixEmptyResultError` when the transport succeeds but `result` is null/undefined (a Deal that no longer exists). `false`/`0`/`""`/`[]` are still valid results and pass through untouched. A new `isBitrixNotFound(err)` classifies "entity gone" (empty result OR explicit NOT_FOUND). `reconcileAllOrders()` catches per order: a missing Deal is counted (`missing`), written to `BitrixSyncLog`, and reported to Sentry with `orderId`/`orderNumber`/`bitrix24DealId`, then the loop **continues**; unexpected errors are counted (`errors`) and also continue. It now returns a `{ checked, drift, missing, errors, retried }` summary, echoed in the cron's JSON response and the final `[Reconcile] Done…` log line. `handleDealUpdate()` (inbound webhook) catches the same not-found signal and skips gracefully; real errors bubble to the webhook route (Sentry + still 200).
- **Why:** Production `TypeError: Cannot read properties of undefined (reading 'STAGE_ID')` through `Sentry.withMonitor` → `/api/cron/bitrix-reconcile`. Root cause: `crm.deal.get` on a deleted/merged Deal returns an empty result, `bitrixCall` handed back `undefined`, and reconcile read `deal.STAGE_ID` off it. Same class of defect as the PayPal 404 "order not found" fix — an external system reporting "object does not exist" must be an explicitly handled case.
- **Safe repair path (deliberately NOT automated):** When reconcile flags a Deal as missing, it is **left linked** — `bitrix24DealId` is never auto-cleared and no replacement Deal is auto-created, because an ambiguous empty response can be transient and blind recreation would produce duplicate Deals. Repair is manual and confirmed: verify in Bitrix that the Deal is genuinely gone (not merged/moved pipeline), then either restore the Deal ID on the order or clear `bitrix24DealId` so the next reconcile recreates it via `syncNewDeal`. Only act on a persistent, confirmed miss, not a single night's empty response.
- **Impact on conversion:** None.
- **Impact on design:** None.
- **Impact on code:** `src/lib/bitrix24/client.ts` (typed errors + `isBitrixNotFound`), `src/server/bitrix/reconcile.ts` (per-order guard, counts, summary), `src/server/bitrix/inbound.ts` (typed-error catch), `src/app/api/cron/bitrix-reconcile/route.ts` (summary in response). Tests added: `src/lib/bitrix24/client.test.ts`, `src/server/bitrix/reconcile.test.ts`.
- **Impact on docs:** This entry.
- **Related files:** `src/lib/bitrix24/client.ts`, `src/server/bitrix/reconcile.ts`, `src/server/bitrix/inbound.ts`, `src/app/api/cron/bitrix-reconcile/route.ts`
- **References:** Sentry issue "STAGE_ID" on `bitrix-reconcile`; parallels the PayPal 404 not-found fix (commit e2b0d30).

## 2026-07-07 - LIVE launch flip, price sign-off (a), PayPal-only billing

- **Area:** payments | pricing | docs
- **What changed:** Production flipped to live PayPal (PAYPAL_MODE=live, live REST credentials, PAYPAL_WEBHOOK_ID=2WR38591EE735110J). The live webhook registration was FIXED via the PayPal API before the flip - it pointed at the apex domain and a nonexistent path (https://elegantrender.com/api/webhooks/paypal); now https://www.elegantrender.com/api/paypal/webhook with CHECKOUT.ORDER.COMPLETED + PAYMENT.CAPTURE.{COMPLETED,DENIED,REFUNDED}. Price sign-off recorded: option (a) - the catalog EUR list stands (170/250/295...), marketing copy aligned (site.ts FAQ 249->250; glossary anchor updated; docs/pricing/price-signoff.md annotated APPROVED). PayPal-only billing: IMPRINT.bank blanked (proforma PDFs skip empty rows; wire-transfer flow stays dormant). Customer invoicing needs no change - the platform auto-issues the numbered EUR export invoice after every capture (email + portal); PayPal's receipt is supplementary.
- **Why:** Owner decisions 2026-07-07; first real E2E purchase test runs on live.
- **Impact on conversion:** Live payments enabled.
- **Impact on design:** None.
- **Impact on code:** site.ts (price copy + bank), docs only; env on Vercel.
- **Impact on docs:** This entry; glossary + price-signoff updated.
- **Related files:** src/lib/content/site.ts, docs/copy-glossary.md, docs/pricing/price-signoff.md
- **References:** PayPal webhook id 2WR38591EE735110J; owner chat 2026-07-07.

## 2026-07-06 - Homepage restored to .rs layout parity (owner override of the handoff hero)

- **Area:** design | conversion
- **What changed:** The homepage returns to the elegantrender.rs section order 1:1 — interactive QuickOrderHero with the right-side "Quick estimate" panel (service picker, pricing-model picker, live order summary, per-service before/after across the whole SERVICES catalog), search-intent columns, ResultsProof, PlatformPrinciples, ModelFirst, NextIteration and the MarketingServicesShowcase catalog — plus the IsoStrip kept from the international redesign. The four components were recovered from git (e6e10d7), translated to English and restyled to the White Rook tokens; layout/behavior byte-compatible with .rs. The handoff-only static sections (static hero, spec strip, hardcoded virtual-staging before/after, static service cards, closing CTA) were removed.
- **Why:** The design handoff's homepage spec silently replaced the .rs layout, violating the owner's primary requirement ("same structure, new design language only") and reducing the before/after to a single hardcoded virtual-staging pair. Owner override recorded in docs/design-handoff/DEVIATIONS.md; the handoff remains binding for tokens/typography/motion/copy.
- **Impact on conversion:** The catalog-driven hero funnel (service -> variant -> prefilled /pricing configurator) is back on the landing page.
- **Impact on design:** Homepage layout parity with .rs is the binding rule going forward; White Rook tokens throughout.
- **Impact on code:** src/app/(marketing)/page.tsx rebuilt; quick-order-hero/results-proof/next-iteration/marketing-services-showcase recovered + translated + restyled; iso-strip extracted to its own component.
- **Impact on docs:** This entry; docs/design-handoff/DEVIATIONS.md added.
- **Related files:** src/app/(marketing)/page.tsx, src/components/marketing/quick-order-hero.tsx, src/components/marketing/iso-strip.tsx
- **References:** Recovery anchor e6e10d7 (tag s1-paypal-eur); owner decisions 2026-07-06.

## 2026-07-06 - Track C: marketing surface on the White Rook design system, fully English

- **Area:** design | conversion | docs
- **What changed:** Homepage rebuilt to the handoff spec with verbatim final copy (hero "See your space before you decide.", spec strip, intent columns, before/after slider with demo-swipe + cursor tracking per the non-negotiables, model-first dark panel, services cards, process, ISO strip, native-details FAQ, closing CTA). Header (72px blur, Sign in + Start a project, no powered-by badge) and dark footer (White Rook attribution line) rebuilt. site.ts and seo.ts fully English (htmlLang en, en + x-default hreflang, English keywords/JSON-LD); consent banner English; LinkedIn Insight tag deleted; GTM fallback container removed (env-only); manifest EN + #0a0a0a; sitemap legal entries fixed. Marketing pages swept: zero Serbian copy, zero warm-palette var() usages, handoff radii/shadows/eyebrows everywhere in Track C paths. Button accent variant lost its clay glow (green hover/press tokens).
- **Why:** Complete new visual identity per docs/design-handoff (owner decision); English marketing surface for elegantrender.com.
- **Impact on conversion:** New handoff-specified funnel surfaces; homepage prices show handoff-verbatim price points (€169/€249/€294) pending the final price-table sign-off (catalog: €170/€250/€295).
- **Impact on design:** Marketing fully on the international theme; portal restyle sweep still pending (compat alias block remains for portal).
- **Impact on code:** ~50 files under (marketing)/**, components/{marketing,site}/**, site.ts, seo.ts, layout/manifest/sitemap, analytics components.
- **Impact on docs:** This entry.
- **Related files:** src/app/(marketing)/page.tsx, src/components/marketing/before-after-slider.tsx, src/components/site/{site-header,site-footer,consent-banner}.tsx, src/lib/content/site.ts, src/lib/seo.ts
- **References:** docs/design-handoff/README.md; sync point: Track C phase 1 done. Open items: og-image redesign, portal design sweep, cross-domain sr hreflang, DEFAULT_SITE_URL fallback now elegantrender.com.

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
