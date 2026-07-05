I have everything I need. Here is the design document.

---

# DESIGN: Payments, Currency Engine, Checkout Shortening — elegantrender.com (EN clone)

Source repo: `C:/Users/ngluv/Desktop/Platform`. Target repo: `S:/Elegant render english`. The prior PayPal+EUR implementation is recoverable at `b4d0740^` and is the backbone: **~70% of this workstream is recovered from git history with English strings and hardening, not written new.**

Recovery commands used/available:
- `git -C C:/Users/ngluv/Desktop/Platform show b4d0740^:src/lib/payment/paypal.ts`
- `git -C C:/Users/ngluv/Desktop/Platform show b4d0740^:src/server/actions/payment.ts` (contains `createPayPalOrderAction`/`capturePayPalOrderAction` with double idempotency guards)
- `git -C C:/Users/ngluv/Desktop/Platform show b4d0740^:src/server/actions/charge-payment.ts` (PayPal OrderCharge actions)
- `git -C C:/Users/ngluv/Desktop/Platform show "b4d0740^:src/app/(marketing)/poruci/paypal-buttons.tsx"` (+ `src/components/portal/paypal-portal-buttons.tsx`, `paypal-charge-buttons.tsx`)
- `git -C C:/Users/ngluv/Desktop/Platform show b4d0740^:src/lib/billing.ts` and `...:src/lib/catalog/display-currency.ts` (the EUR versions of both seams)

---

## 1. PayPal integration (Orders API v2 + JS SDK)

### 1.1 What is reused verbatim vs hardened

**Reused verbatim (recovered, translate strings):**
- The server-action skeleton of `createPayPalOrderAction`/`capturePayPalOrderAction` from `b4d0740^:src/server/actions/payment.ts` — including both idempotency guards: (a) pre-flight reuse of an attached un-captured `paymentId`; (b) race-safe `prisma.order.updateMany({ where: { paymentStatus: { not: "completed" } } })` atomic winner. This pattern is proven and identical to what the Nestpay return route uses today.
- `finishSuccessfulPayment` / `finishFailedPayment` in current `src/server/actions/payment.ts` — the provider-neutral seam (credits → auto-close AI-only → `issueInvoice` → outbox email). Only change: drop the `isNestpay` branch; all PayPal orders get `order_confirmation_email` plus a new `payment_success_email` rewritten as a PayPal receipt (PayPal capture ID, amount, currency — replaces the 7-param EPM bank block in `src/lib/outbox.ts` L403–442 and `src/lib/email.ts`).
- The JS-SDK script-injection button component (no new npm dep; do NOT add `@paypal/react-paypal-js`). **Consolidate the 3 recovered near-identical components** (`paypal-buttons.tsx`, `paypal-portal-buttons.tsx`, `paypal-charge-buttons.tsx`) into one `src/components/payments/paypal-buttons.tsx` taking `{ createAction, captureAction, currency, onSuccess, onError }` props.
- `src/server/actions/charge-payment.ts` PayPal charge actions from git (`createPayPalChargeAction`, `capturePayPalChargeAction`, `finishSuccessfulChargePayment` → `issueChargeInvoice`).

**Hardened / written new — `src/lib/payment/paypal.ts` (rewrite based on recovered file):**
- `createPayPalOrderMinor(amountMinor: number, currency: ChargeCurrency, referenceId: string)` — parameterized currency (recovered file hardcodes EUR); formats `value` respecting non-decimal currencies (JPY/HUF/TWD send integer strings, no decimals); sends **`PayPal-Request-Id: order:<orderId>:<attempt>` header** (PayPal-side idempotency, missing in old code); sets `purchase_units[0].reference_id = orderNumber`, `custom_id = order.id`, English `description`, and `application_context: { shipping_preference: "NO_SHIPPING", user_action: "PAY_NOW" }`.
- `capturePayPalOrder(paypalOrderId)` — return the full capture object: `{ captureId, status, amountValue, amountMinor, currencyCode, payerEmail, payerCountryCode, raw }` (old code discarded capture ID — we need it for refunds). Handle capture `status === "PENDING"` (eCheck): persist as `paymentStatus: "pending"` + `paypalCaptureStatus: "PENDING"`, do NOT call `finishSuccessfulPayment`; the webhook/reconciler completes it.
- New `getPayPalOrder(paypalOrderId)` (GET `/v2/checkout/orders/:id`) — reconciler.
- New `refundPayPalCapture(captureId, amountMinor?, currency?)` (POST `/v2/payments/captures/:id/refund`) — admin refunds.
- New `verifyPayPalWebhookSignature(headers, rawBody)` — POST `/v1/notifications/verify-webhook-signature` with `PAYPAL_WEBHOOK_ID`. (API-based verification, not local cert math — simplest correct option.)
- Keep `getAccessToken()` as-is (Basic OAuth2, no caching needed at this volume).

### 1.2 Capture-on-return + webhook safety net + reconcile cron (all three)

- **Primary path:** client `onApprove` → `capturePayPalOrderAction` (server capture, synchronous, in-wizard success). Same for portal + charges.
- **Webhook (new):** `src/app/api/paypal/webhook/route.ts` (POST, nodejs runtime, force-dynamic). Verify signature → dedupe via new `WebhookEvent` table keyed on PayPal event `id` (`create` inside try/catch on unique violation → already processed, 200). Handle: `PAYMENT.CAPTURE.COMPLETED` (look up order/charge by `paymentId` = PayPal order id via `resource.supplementary_data.related_ids.order_id` or `custom_id`; run the same atomic `updateMany` guard → `transitionOrder(→paid)` → `finishSuccessfulPayment`), `PAYMENT.CAPTURE.DENIED`/`PAYMENT.CAPTURE.DECLINED` (→ `finishFailedPayment`), `PAYMENT.CAPTURE.REFUNDED` (→ set `paymentStatus: "refunded"`, `transitionOrder(→refunded)` — covers refunds issued from the PayPal dashboard). Always 200 after verification (else 400) to control retries. Mirrors the structure of `src/app/api/nestpay/return/route.ts`.
- **Reconciler (replaces nestpay-reconcile):** `src/server/finance/reconcile-paypal.ts` → `reconcilePayPalPending()` modeled on `src/server/finance/reconcile-nestpay.ts`: query orders/charges `paymentProvider: "paypal", paymentStatus: "pending"`, updated 15 min–7 days ago (partial index below); `getPayPalOrder()`; if `COMPLETED` with capture → complete via the same guard; if order `status APPROVED` but never captured and < 3 h old → attempt capture server-side; if `VOIDED`/expired → `finishFailedPayment`. Cron route `src/app/api/cron/paypal-reconcile/route.ts` guarded by `isAuthorizedCronRequest` (unlike nestpay-reconcile, which deliberately skipped it — fix that), `vercel.json` schedule `*/15 * * * *`.
- **Admin refund (new):** `refundPayPalPaymentAction(orderId)` in `src/server/actions/admin-refund.ts` — finance-admin gate (`canManageFinance`), calls `refundPayPalCapture(order.paypalCaptureId)` (full refund of charged amount/currency), on success `paymentStatus: "refunded"` + `transitionOrder(orderId, "refunded", actorId, "PayPal refund issued")` (FSM already allows paid→refunded). Button on `portal/admin/orders/[orderId]` detail. Partial refunds: out of scope v1 (owner does those in PayPal dashboard; webhook syncs the status).

### 1.3 Env vars

```
PAYPAL_MODE=sandbox|live
PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET
NEXT_PUBLIC_PAYPAL_CLIENT_ID
PAYPAL_WEBHOOK_ID          # from PayPal app webhook registration (new)
```
Remove all `NESTPAY_*` and `TURNSTILE_*` from `.env.example`; delete `scripts/nestpay-hash-test.ts` CI step (replace with a `scripts/paypal-webhook-verify-test.ts` unit sanity or just drop).

### 1.4 SDK loading detail

Button component builds `https://www.paypal.com/sdk/js?client-id=…&currency=${order.chargedCurrency}&intent=capture&disable-funding=credit,paylater`. Currency comes from the order snapshot (one SDK instance per page — fine, one order per page).

---

## 2. Prisma schema plan (fresh baseline on empty Supabase)

**Migration strategy: no renames, no reversal migration.** New DB is empty → author the edited `prisma/schema.prisma` directly and generate a single fresh baseline `prisma/migrations/00000000000000_init` (repo convention, per CLAUDE.md; keep `.gitattributes` LF rule for migration SQL). All historical migrations are NOT copied.

**Field naming: rename `*Rsd` → `*Eur` in schema and code** (restore pre-b4d0740 names: `totalEur`, `basePriceEur`, `priceEur`, `perSecondEur`, `premiumTotalEur`, `originalTotalEur`). Rationale: recovered PayPal/billing code already uses these names; catalog files get touched by the translation workstream anyway; EUR stays **integer major units + `*Cents` twins** (house rule "integer-EUR" already in agents; pricelist is integer EUR: €169/€249/€294).

**Enums:**
- `PaymentProvider { paypal, wire_transfer, card_mock }` (drop `nestpay`)
- `BillingCurrency { EUR }` — invoice currency is always EUR (charged currency is a separate String field, see below; keeps enum churn out of the DB as currencies are tuned)
- `BuyerType { individual, business }` (drop `company_rs`/`company_foreign` — no Serbian PIB/MB path on this site)
- `OrderStatus`, `PaymentStatus`, `PaymentMethod` unchanged.

**`Order` (and mirrored on `OrderCharge`) — replace the 13 `nestpay*` columns with:**
```prisma
// PayPal forensic block
paypalCaptureId       String?
paypalCaptureStatus   String?    // COMPLETED | PENDING | DECLINED | REFUNDED
paypalPayerEmail      String?
paypalPayerCountry    String?    // ISO-3166-1 alpha-2, backfills buyer country for individuals
paypalResponseRaw     Json?
paypalLastQueryAt     DateTime?
// Charged-amount snapshot (presentment currency)
chargedCurrency       String?    // ISO-4217, e.g. "USD"
chargedAmountMinor    Int?       // minor units; JPY/HUF stored as whole units (minorUnits=0)
chargedFxRate         Decimal?   @db.Decimal(12,6)  // EUR→chargedCurrency rate used
chargedFxAsOf         DateTime?
```
Keep: `paymentStatus`, `paymentProvider`, `paymentId` (holds the PayPal order id, exactly as it held the oid), `paymentMethod`, `billingCurrency @default(EUR)`, `billingVatRate`, `billingTotalCents` (EUR cents), `invoiceNumber/IssuedAt/PdfPath`, proforma fields, `@@index([paymentId, paymentProvider])`. Replace partial index `orders_nestpay_pending_idx` with `orders_paypal_pending_idx` on `(paymentProvider, paymentStatus) WHERE paymentProvider='paypal' AND paymentStatus='pending'` (raw SQL in the init migration, same technique as today). Drop `billingRsdRate`, `nestpayInstallmentCount`.

**New model:**
```prisma
model PaymentWebhookEvent {
  id          String   @id            // PayPal event id
  eventType   String
  resourceId  String?
  payload     Json
  receivedAt  DateTime @default(now())
  processedAt DateTime?
}
```

**PricingProduct/PricingAddOn/PricingDurationRule:** `basePriceRsd`→`basePriceEur` etc.; `PricingSettings`/pricebook: drop `rsdRate`, keep `serbiaVatRate` out — replace with nothing (VAT handled in billing layer). Re-derive catalog constants from `docs/pricing/pillar-1-extracted.md` (the EUR source of truth) — that seeding belongs to the pricing/catalog workstream, but the schema fields land here.

---

## 3. Currency engine

### 3.1 New module `src/lib/currency/` (net-new code, the only substantial new subsystem)

**`src/lib/currency/config.ts`** — the per-currency table, single file the owner can tweak:
```ts
export type ChargeCurrency = "EUR"|"USD"|"GBP"|"CHF"|"SEK"|"NOK"|"DKK"|"PLN"|"CZK"|"HUF"
  |"CAD"|"AUD"|"NZD"|"JPY"|"SGD"|"HKD"|"TWD"|"THB"|"PHP"|"ILS"|"MXN";
export type CurrencyRule = {
  code: ChargeCurrency;
  minorUnits: 0 | 2;                  // JPY, HUF, TWD = 0 (PayPal rejects decimals)
  roundUpIncrement: number;           // in MAJOR units
  ending: "increment" | "nine";       // "nine": round up to increment then −1 (x9 endings)
  locale: string;                     // Intl.NumberFormat locale
};
export const CURRENCY_RULES: Record<ChargeCurrency, CurrencyRule> = { /* table below */ };
```
Default rounding table (owner-tunable; implements "rounded UP to marketable values, 10/100/1000 by magnitude"):
| Currencies | increment | ending | example €169 |
|---|---|---|---|
| EUR | 1 | increment | €169 (base, no conversion) |
| USD, GBP, CHF, CAD, AUD, NZD, SGD | 10 | nine | $190→$189 |
| PLN, ILS | 10 | nine | 729 zł |
| SEK, NOK, DKK, HKD, TWD | 10 | increment | 1 890 kr |
| CZK, MXN, THB, CNY-class | 100 | nine | 4 299 Kč |
| PHP | 100 | increment | 11 100 ₱ |
| HUF, JPY | 1000 | increment | 68 000 Ft / 30 000 ¥ |

Excluded PayPal currencies: BRL, MYR, CNY (in-country-merchant only), RUB (unavailable). **Country→currency:** `chargeCurrencyForCountry(countryCode)`: explicit map (US→USD, GB→GBP, CH/LI→CHF, SE/NO/DK, PL/CZ/HU, JP, CA, AU, NZ, SG, HK, TW, TH, PH, IL, MX, eurozone+RS+ME+BA+rest-of-Europe→EUR); unmapped → region fallback `REGION_FALLBACK` (Americas→USD, Africa/Middle East/Europe→EUR, Asia-Pacific→USD), final default EUR.

**`src/lib/currency/fx-rates.ts`** — FX snapshot lives here as a **manually-maintained constant file**: `export const FX_RATES_EUR: Record<ChargeCurrency, number>` + `export const FX_RATES_AS_OF = "2026-07-01"`. Rationale: marketable round-UP gives a 3–8% buffer, so monthly manual updates are safe; no DB/admin surface needed for v1 (documented risk + future ECB-cron upgrade path). Not in the admin pricebook — keeps the pricebook EUR-only and the two workstreams decoupled.

**`src/lib/currency/convert.ts`** — pure functions, unit-tested (`convert.test.ts`):
- `convertEurCentsToMinor(eurCents, currency): { amountMinor, fxRate }` — convert then apply `roundUpMarketable(amountMajor, rule)` (always ≥ mathematical conversion; property test: `roundUp(x) ≥ x`).
- `formatChargeAmount(amountMinor, currency): string` — Intl per rule.locale.

**`src/lib/currency/convert-quote.ts`** — `convertQuoteToCurrency(breakdown: LineItemBreakdown[], currency)` → converts **each line item** with marketable rounding and sets **total = Σ converted items** (preserves the "sum of items = total" invariant from `calculate.test.ts`; the charged amount is this sum, not an independently rounded total). Discount struck-prices converted the same way; `discountPct` recomputed from converted values.

### 3.2 Re-expansion of the two seams (recovered shapes, new internals)

- **`src/lib/catalog/display-currency.ts`**: `type DisplayCurrency = ChargeCurrency` (retire the lowercase `"rsd"|"eur"` legacy). `getDisplayCurrencyForCountry` → delegates to `chargeCurrencyForCountry`. `formatPublicPrice(amountEur, currency)` → `convertEurCentsToMinor` + `formatChargeAmount`. `formatPublicPriceText` — keep the recovered `€NNN` regex-rewriter (chatbot prices follow automatically). `getPublicPricingTerms`/`publicPriceNote` → single English variant: "Prices shown in {CUR}, converted from our EUR price list; you are charged in {CUR}." `PublicPricingFormatSettings` loses `eurToRsdRate` (rates come from `fx-rates.ts`).
- **`src/lib/billing.ts`**: restore recovered EUR version, then simplify: `BillingCurrency = "EUR"` always; `isExportBillingCurrency` → `true`; `buildBillingSnapshot` sets `billingVatRate: 0` (see §5), records buyer country; add `buildChargeSnapshot(totalEurCents, countryCode)` → `{ chargedCurrency, chargedAmountMinor, chargedFxRate, chargedFxAsOf }`.
- `src/lib/catalog/public-currency-server.ts` (`getPublicCountryCode()` via `x-vercel-ip-country`) — unchanged; it is the geo input.

### 3.3 Where the charge currency/amount is locked

At **order creation** (`createOrder` in `src/server/actions/order.ts`): client passes the `displayCurrency` it showed (from `PublicCurrencyProvider`); server re-validates it against `CURRENCY_RULES` and recomputes `convertQuoteToCurrency(repriceOrder(...))` server-side — client never supplies amounts. Snapshot persisted on `Order` (`chargedCurrency/AmountMinor/FxRate/FxAsOf`). `createPayPalOrderAction` reads only the snapshot. Same in `admin-charges.ts` for `OrderCharge` (charge currency = parent order's `chargedCurrency`). WYSIWYG guarantee: what the configurator displayed = what PayPal charges.

### 3.4 Currency propagation

- **JSON-LD** (`src/lib/seo.ts`, `site.ts`): always canonical **EUR** (`priceCurrency:"EUR"`, `currenciesAccepted:"EUR"`) — pages are statically cached; geo-varying structured data would be wrong/cloaking. (Owned by SEO workstream; this doc fixes the rule.)
- **dataLayer/GA4** (`src/lib/analytics/google-data-layer.ts`, `src/server/analytics/google-conversions.ts`): `currency` = `chargedCurrency`, `value` = charged amount in major units; `PurchaseConversionSource` becomes `"paypal_capture" | "paypal_capture_replay" | "paypal_capture_race" | "paypal_webhook" | "mock_card_*"`. GA4 normalizes cross-currency.
- **PostHog** (`src/lib/posthog-events.ts`): rename `*_rsd` → `*_eur` (canonical) and add `charged_currency`, `charged_amount_minor`; provider union → `"paypal" | "card_mock"`.
- **Bitrix** (`src/server/bitrix/sync-deal.ts`): `CURRENCY_ID: "EUR"`, `OPPORTUNITY: premiumTotalEur ?? totalEur` (canonical EUR keeps the new EN pipeline comparable); append one COMMENTS line "Charged: 189.00 USD (rate 1.09)". Nothing else in Bitrix changes; new pipeline = new `BITRIX24_PIPELINE_ID` + `BITRIX24_STAGE_*` env values (same portal, `scripts/bitrix-setup.ts` re-run).
- **Chatbot**: free via `formatPublicPriceText` post-processing (already wired in `src/lib/chat/system-prompt.ts`).

---

## 4. Checkout shortened to 2 steps (`src/app/(marketing)/order/`)

Current 4 steps (details / upload / review+identity+waiver / payment) → **2 steps; upload moves post-payment.**

### New file structure
```
src/app/(marketing)/order/
  page.tsx                      # loads session, catalog, geo country → CheckoutWizard
  checkout-wizard.tsx           # 2-step wizard + SuccessScreen (now with post-payment upload)
  checkout-context.tsx          # trimmed state (no upload step state pre-payment)
  steps/
    step-details.tsx            # MERGED: identity + summary + invoice toggle + consents
    step-payment.tsx            # PayPal buttons only
  success/page.tsx              # redirect/webhook-completed landing (replaces uspeh)
  failure/page.tsx              # decline landing + retry (replaces neuspeh)
src/components/payments/paypal-buttons.tsx   # unified SDK component (§1.1)
src/components/portal/order-file-upload.tsx  # extracted from old step-upload.tsx dropzone
```

**Step 1 — `step-details.tsx`** (merge of old step 0 + step 2):
- Name + email (guest identity → `ensureCheckoutUser`, unchanged from `server/actions/checkout.ts`).
- Order summary rendered from the quote in the visitor's charge currency (line items + total via `convertQuoteToCurrency`), + note "Total in {CUR}; invoice issued in EUR."
- Collapsed toggle **"I'm buying as a business (get a VAT invoice)"** → `companyName`, `vatId` (optional, VIES-verified via existing `company-vat-verifier.tsx` for EU IDs), `companyAddress`, `country` select. Individuals: no country field shown; country defaults to geo and is backfilled from `paypalPayerCountry` at capture.
- Consent block, two separate required checkboxes (legally distinct, both kept): (1) Terms — "I agree to the Terms of Service" linking `/legal/terms`; (2) **EU CRD art. 16(m) withdrawal waiver** — "I ask you to start work immediately and acknowledge I lose my 14-day right of withdrawal once delivery begins" (reuse `waiveWithdrawal`/`withdrawalWaivedAt` plumbing from `step-review.tsx` verbatim; move `acceptedTerms` here from old step-payment).
- Submit → `createOrder(...)` (unchanged seam: creates draft Order, `syncNewDeal`, now also persists the charge snapshot §3.3) → advance.

**Step 2 — `step-payment.tsx`** (rewrite, small): PayPal buttons + amount recap + PayPal acceptance mark. **Dropped entirely:** Turnstile widget + `verifyTurnstile` calls (Upstash rate-limit on the server actions stays — keep the `nestpayInitiate` limiter renamed `paypalCreate`), installment selector, `NestpayRedirectForm`, `PaymentTrustBadges`, Banca-Intesa copy, dev `card_mock` tile (keep `mockCardPaymentAction` behind `NODE_ENV !== "production"` for tests).

**Upload moves post-payment:** `SuccessScreen` in `checkout-wizard.tsx` renders `<OrderFileUpload orderId>` ("Upload your plans now — or later from your portal") + portal link; the same component mounts on `portal/orders/[orderId]` when a paid service order has no source files. Backend endpoints (`/api/checkout/upload-url`, `confirmFileUpload`, AV scan) are already order-scoped and payment-agnostic — they work post-payment untouched; add an auth check accepting the order's owner. New outbox event `source_files_reminder_email` (24 h after paid, no files) — nice-to-have, can ship later.

**Dropped fields:** PIB/MB (Serbian), `buyerType company_rs`, installments, `customerNote` moves into step 1 as an optional textarea (keep — cheap and valuable).

`success/page.tsx`/`failure/page.tsx`: needed for the reconciler/webhook-completed and portal-initiated flows; look up by `orderId` query param, require `paymentStatus==="completed"`, render PayPal receipt (capture id, amount, currency) + fire the purchase dataLayer event via existing `src/components/analytics/data-layer-event.tsx`. Replaces `NestpayReceipt` with a small `src/components/marketing/paypal-receipt.tsx`.

**Portal reuse:** `src/components/portal/pending-payment-card.tsx` and `charge-payment-card.tsx` swap `initiateNestpayPayment`+`NestpayRedirectForm` for the unified `PayPalButtons` with the payment/charge actions respectively (this is exactly how the pre-removal versions worked — recover and adapt).

---

## 5. VAT / invoicing (export invoices, EUR)

**Model: every invoice is an export invoice in EUR, 0% Serbian VAT.** White Rook DOO (RS) supplying services to foreign recipients → outside the scope of Serbian VAT (export of services). The existing `isExportInvoice` machinery does this already for `company_foreign` — it becomes the only path.

Changes:
- `src/lib/invoice-data.ts`: `isExportInvoice` → always true; `invoiceVatRateForBuyer` → 0; `invoiceCurrencyForBuyer` → "EUR"; `paymentMethodLabel`: `paypal → "PayPal"`, `wire_transfer → "Bank transfer (SWIFT)"`.
- `src/lib/invoice-pdf.tsx`: promote the existing **English `company_foreign` STRINGS table** to the single layout (delete individual/company_rs Serbian tables); `formatMoney` → `€` with `en-GB`, 2 decimals; VAT line reads "VAT 0% — export of services, Art. 24 Serbian VAT Law" (exact article text confirmed with accountant); when buyer has an EU VAT ID add "Reverse charge — VAT to be accounted for by the recipient"; add footer line "Paid via PayPal: {chargedAmountMinor formatted} {chargedCurrency} (FX rate {chargedFxRate}), capture {paypalCaptureId}" so invoice (EUR) and charge (local currency) reconcile on paper. Same treatment in `proforma-pdf.tsx` + `IMPRINT.bank` → White Rook's EUR foreign-currency account (owner supplies IBAN/SWIFT) for wire-transfer proformas.
- `issueInvoice`/`issueChargeInvoice`, numbering, `invoice-reconcile` cron: **unchanged** (provider-neutral already).
- `src/lib/buyer-validation.ts`: re-model to `{ individual, business }`; business requires name+address+country, VAT ID optional (VIES format check when EU-prefixed). Port `buyer-validation.test.ts` accordingly.

**Open tax questions for the owner (flagged, non-blocking — implementation above is the safe default):**
1. **EU non-Union OSS:** if custom renders are classified as "electronically supplied services", B2C sales to EU consumers require non-Union OSS VAT registration and destination-country VAT. Bespoke human-made work generally is NOT ESS (substantial human intervention) → no EU VAT. Needs written confirmation from a tax advisor; schema supports adding `billingVatRate > 0` later without migration.
2. **Serbian fiscalization/SEF:** export service invoices to foreign entities are outside SEF; confirm no ESIR obligation for foreign B2C card-less (PayPal) receipts.
3. **RS visitors on the .com site:** default = allowed, charged EUR, export invoice — but a Serbian buyer legally needs a PDV invoice. Recommend geo-banner redirecting RS traffic to elegantrender.rs; owner to confirm.
4. UK/CH/AU digital-services registrations — same classification question as (1).

---

## Ordered implementation steps

Sequenced so schema lands first (everything compiles against it), and PayPal can proceed in parallel with the currency engine after step 2. **Suggested ownership split: this entire list = ONE agent's territory (Claude Code): `prisma/schema.prisma` payment/billing fields, `src/lib/{payment,currency,billing,catalog/display-currency}.ts`, `src/server/actions/{payment,charge-payment,admin-refund}.ts`, `src/app/api/{paypal,cron/paypal-reconcile}/**`, `src/app/(marketing)/order/**`, invoice stack, `src/components/payments/**`, portal payment cards. Codex should NOT touch these paths (it owns translation/design/SEO/legal surfaces); shared files `order.ts`/`outbox.ts`/`posthog-events.ts`/`sync-deal.ts` get single-purpose, coordinated edits listed below.**

1. **Schema + baseline** — edit `prisma/schema.prisma` per §2 (enums, paypal block, charged snapshot, `*Eur` renames, `PaymentWebhookEvent`), author `prisma/migrations/00000000000000_init` incl. the partial-index raw SQL; `prisma generate`. Delete `src/lib/nestpay/**`, `src/server/actions/nestpay.ts`, `src/app/api/nestpay/**`, `src/server/finance/reconcile-nestpay.ts`, `src/lib/turnstile*.ts`, `turnstile-widget.tsx`, `nestpay-redirect-form.tsx`, `nestpay-receipt.tsx`, `payment-trust-badges.tsx`, `installments` refs, `scripts/nestpay-*.ts`, `public/branding/payments/*` card logos.
2. **Currency engine** — new `src/lib/currency/{config,fx-rates,convert,convert-quote}.ts` + `convert.test.ts`; re-expand `display-currency.ts` and `billing.ts` (recover EUR versions from `b4d0740^`, apply §3.2 simplifications); wire `getPublicCountryCode` → `chargeCurrencyForCountry`.
3. **PayPal lib** — write `src/lib/payment/paypal.ts` per §1.1 (start from recovered file); keep `mock-card.ts`, `types.ts`.
4. **Server actions** — recover `payment.ts` + `charge-payment.ts` from `b4d0740^`, translate, extend with capture-column persistence, PENDING handling, charge-snapshot amount check (`capturedAmountMinor === order.chargedAmountMinor && currency matches`); add `admin-refund.ts`.
5. **Order creation snapshot** — in `src/server/actions/order.ts` `createOrder`: accept `displayCurrency`, validate, persist `buildChargeSnapshot` + `buildBillingSnapshot` (coordinated edit — file otherwise owned by Codex's translation pass).
6. **Checkout restructure** — build `src/app/(marketing)/order/**` per §4 (new wizard, merged step-details, PayPal step, success/failure pages, unified `PayPalButtons`, `OrderFileUpload` extraction, receipt component).
7. **Webhook + reconciler + crons** — `api/paypal/webhook/route.ts`, `reconcile-paypal.ts`, `api/cron/paypal-reconcile/route.ts`; update `vercel.json` (drop nestpay cron, add paypal `*/15 * * * *`).
8. **Portal flows** — rewire `pending-payment-card.tsx`, `charge-payment-card.tsx`; admin refund button on order detail.
9. **Invoicing** — §5 changes to `invoice-data.ts`, `invoice-pdf.tsx`, `proforma-pdf.tsx`, `buyer-validation.ts` (+ test).
10. **Analytics/CRM propagation** — `google-data-layer.ts`, `google-conversions.ts`, `posthog-events.ts`, `outbox.ts` payment emails (PayPal receipt copy), `sync-deal.ts` CURRENCY_ID/comment line.
11. **Env + CI** — `.env.example` PayPal section (§1.3); CI: drop nestpay hash step; port `calculate.test.ts` to `*Eur`; register live webhook (PAYPAL_WEBHOOK_ID) in PayPal dashboard; sandbox end-to-end: create→approve→capture, eCheck PENDING→webhook complete, refund via admin, refund via PayPal dashboard→webhook, reconciler recovery of a killed capture, HUF/JPY zero-decimal order.

## Risk list

1. **FX drift on manual rates** (`fx-rates.ts` constants): mitigated by round-UP margin buffer; stale >5% rate move could underprice — document monthly update ritual; future: ECB cron.
2. **Charged-amount mismatch on capture** — PayPal captures the created order's amount, so mismatch only occurs on stale snapshots; the capture action's amount check makes it fail-closed (funds captured but order not completed → reconciler + Sentry alert path must be tested).
3. **eCheck/PENDING captures** — buyer sees "payment processing" not success; needs explicit UI copy on step-payment and success page; webhook completes days later.
4. **Webhook signature verification depends on `PAYPAL_WEBHOOK_ID`** being set post-registration — fail-closed (400) means dashboard-initiated refunds won't sync until configured; add env check in `checkServerEnv()`.
5. **Sum-of-items invariant across currencies**: per-item marketable rounding inflates totals slightly vs pure conversion (intentional, always UP) — verify `calculate.test.ts` + new `convert.test.ts` cover it so Codex's catalog edits can't regress it.
6. **Post-payment upload**: paid orders may sit file-less → production can't start; reminder email + portal status guidance are the mitigation; owner should confirm acceptance.
7. **RS/EU tax classification** (§5 open questions) — implementation defaults to 0% export; if advisor mandates OSS, `billingVatRate` per-country must be populated (schema ready, UI/invoice logic small add).
8. **Parallel-agent collisions** on shared files (`order.ts`, `outbox.ts`, `site.ts` IMPRINT.bank, `sync-deal.ts`) — must be explicitly sequenced in the orchestrator plan (this workstream edits only the listed functions).
9. **Turnstile removal** — bot-driven order creation now only rate-limited; PayPal's own fraud layer covers payment, but junk draft orders/emails possible → keep Upstash limits on `ensureCheckoutUser` + `createOrder`.

### Critical Files for Implementation
- C:/Users/ngluv/Desktop/Platform/src/server/actions/payment.ts (recover PayPal actions from `b4d0740^`; provider-neutral hooks live here)
- C:/Users/ngluv/Desktop/Platform/src/lib/payment/paypal.ts (at `b4d0740^` — base for the hardened client)
- C:/Users/ngluv/Desktop/Platform/src/lib/catalog/display-currency.ts (+ `src/lib/billing.ts`) — the currency seams to re-expand
- C:/Users/ngluv/Desktop/Platform/prisma/schema.prisma — payment/billing field plan, fresh baseline
- C:/Users/ngluv/Desktop/Platform/src/app/(marketing)/poruci/steps/step-review.tsx (+ `step-payment.tsx`, `checkout-wizard.tsx`) — source of the merged 2-step checkout
