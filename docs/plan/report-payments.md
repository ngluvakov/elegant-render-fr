I have a complete picture. Here is my report.

---

# Checkout Flow & Payment Integration — Exhaustive Report

All paths relative to repo root `C:/Users/ngluv/Desktop/Platform`. This codebase **already had PayPal + EUR and removed them** on 2026-06-17 (commit `b4d0740 "Make pricing RSD-only and remove PayPal"`, migration `prisma/migrations/20260617120000_rsd_only_no_paypal`). The multi-currency/provider scaffolding was neutered but left structurally intact — this is the single most important fact for the clone: **the seam PayPal must plug into is documented, and the prior PayPal implementation is recoverable verbatim from git.**

## 1. Checkout flow — `src/app/(marketing)/poruci/`

Entry: `page.tsx` (server component) loads session, pricing catalog, buyer country, renders `CheckoutWizard`. `checkout-wizard.tsx` (`WizardInner`) drives a 4-step wizard via `checkout-context.tsx` (`CheckoutProvider`/`useCheckout`, holds all wizard state). Steps array: `Podaci`(0) / `Fajlovi`(1) / `Pregled`(2) / `Plaćanje`(3). Logged-in users start at step 1; if no service items, upload step is skipped.

**Step 0 — `steps/step-details.tsx`**: collects **name + email only**. Calls `ensureCheckoutUser(name, email)` (`server/actions/checkout.ts`) → finds/creates passwordless guest user, sends password-setup email. Minimal; keep as-is.

**Step 1 — `steps/step-upload.tsx`**: drag-drop source files (100 MB total cap). Gets signed URL from `POST /api/checkout/upload-url`, uploads to Supabase, confirms via `confirmFileUpload()` (`server/actions/order.ts`) which runs a synchronous AV scan (`enforceCleanScan`). Plus optional `customerNote`. Payment-agnostic.

**Step 2 — `steps/step-review.tsx`**: line items + **"Podaci za račun" (billing/buyer-identity block)** + **14-day withdrawal-waiver checkbox** (`waiveWithdrawal`, required — EU CRD art.16(m) / Serbian consumer law art.28). Buyer fields collected (via `BuyerInfoState`): `buyerType` (individual / company_rs / company_foreign), country, and for companies: `companyName`, `companyAddress`, `companyTaxId` (PIB 9-digit for RS / VAT-ID for foreign), `companyMb` (8-digit, RS only). Foreign VAT verified live via `company-vat-verifier.tsx` (VIES). Validated by `validateBuyerInfo()` in `src/lib/buyer-validation.ts`. On submit calls `createOrder(userId, quoteItems, note, withdrawalWaivedAt, buyerInfo)` (`server/actions/order.ts`) → creates `Order` in `draft`, syncs Bitrix deal (`syncNewDeal`), then advances to step 3. **These buyer/invoice fields are Serbian-tax-driven (SEF/ESIR/PIB/MB), not bank-payment-driven** — for EU/PayPal they need rework but are NOT Nestpay-coupled.

**Step 3 — `steps/step-payment.tsx`**: **the file PayPal replacement centers on.** Method selector currently shows only one tile ("Platna kartica" = Nestpay). Requires: **terms checkbox** (`acceptedTerms`) + **Cloudflare Turnstile token** + optional installment selector. Calls `initiateNestpayPayment({orderId, turnstileToken, taksit})`; on success sets `redirect` state and renders `NestpayRedirectForm` (`nestpay-redirect-form.tsx` — hidden auto-submitting POST form to bank HPP). Also has a dev-only `card_mock` path (gated on `NEXT_PUBLIC_NESTPAY_MODE=test`) calling `mockCardPaymentAction`. Renders `PaymentTrustBadges` (Banca Intesa badge bar). **Bank-compliance-only UI here to drop/replace for PayPal**: Turnstile gate, the "preusmeravanje na Banca Intesa" copy, installment selector (`taksit`), the trust-badge strip.

**Success/failure pages**:
- In-wizard success: `SuccessScreen` inside `checkout-wizard.tsx` (shown when `paymentComplete`, set by the mock path only — Nestpay redirects away).
- `poruci/uspeh/page.tsx` — Nestpay approved landing; looks up order by `oid`, requires `paymentStatus==="completed"`, renders `NestpayReceipt` (bank's 7 EPM-2.7 transaction params) + fires purchase dataLayer event.
- `poruci/neuspeh/page.tsx` — decline/error landing; same receipt, failure copy, retry CTA.
Both read `getNestpayReceiptData()` from `src/lib/nestpay/receipt-data.ts`; receipt component `src/components/marketing/nestpay-receipt.tsx`.

## 2. Nestpay integration — `src/lib/nestpay/**` (10 files)

| File | Key exports | Notes |
|---|---|---|
| `config.ts` | `getNestpayConfig()`, `__setNestpayConfigForTests` | Reads env (`NESTPAY_CLIENT_ID`, `STORE_KEY`, `BASE_URL`, `QUERY_URL`, `QUERY_USERNAME/PASSWORD`, `TRAN_TYPE`, `OID_PREFIX`); throws if missing |
| `hash.ts` | `buildRequestHashVer2`, `buildRequestHashPlaintext`, `buildHashWithParams`, `verifyResponseHash` | SHA-512/base64 HASH ver2. Positional plaintext `clientid\|oid\|amount\|okUrl\|failUrl\|trantype\|\|rnd\|\|\|\|currency\|StoreKey`. Response verifier tries 5 plaintext variants, constant-time compare |
| `oid.ts` | `mintOid(orderNumber, prefix)`, `mintRnd()` | Per-attempt unique bank order id `<prefix><orderNumber>-<rnd6>`; bank rejects duplicate oid on retry |
| `client.ts` | `buildHostedPaymentForm(input)` → `{url, fields}` | **Hardcodes `currency=941` (RSD), `storetype=3d_pay_hosting`**. okUrl=failUrl=`/api/nestpay/return`. Amount formatted as decimal RSD |
| `response.ts` | `parseNestpayReturn`, `isApprovedResponse`, `parseNestpayTrxDate` | Approved = `Response==="Approved"` && `ProcReturnCode==="00"` && `mdStatus∈{1,2,3,4}` |
| `status-query.ts` | `queryOrderStatus(oid)` | CC5 XML API for reconciliation (recovery when return POST lost) |
| `installments.ts` | `NESTPAY_INSTALLMENT_OPTIONS`, `nestpayTaksitField`, `normalizeNestpayInstallmentCount` | `TAKSIT` field; Serbian-bank-specific, drop for PayPal |
| `receipt-data.ts` | `getNestpayReceiptData(orderId)` | Builds receipt from Order's nestpay* fields |
| `url.ts` | `getNestpayPublicBaseUrl(env)` | Public base URL for return round-trip |
| `index.ts` | barrel re-export | — |

**Server actions** — `src/server/actions/nestpay.ts`:
- `initiateNestpayPayment({orderId, turnstileToken, taksit})` — auth check, rate-limit (`nestpayInitiate`), **Turnstile verify**, mints oid, persists `paymentProvider="nestpay"` + `paymentId=oid` + `paymentStatus="pending"` + nestpayCharged* snapshot via conditional `updateMany`, transitions `draft→awaiting_payment`, returns `buildHostedPaymentForm(...)`.
- `initiateNestpayChargePayment({chargeId,...})` — same for `OrderCharge` (post-order add-on charges).

**Callback/webhook route** — `src/app/api/nestpay/return/route.ts` (`POST`, nodejs runtime, force-dynamic): parses form POST → `verifyResponseHash` (hash mismatch = HTTP 400, Sentry, no writes) → looks up `Order` (or `OrderCharge`) by `paymentId=oid` + `paymentProvider="nestpay"` → persists forensic snapshot → if approved, atomic `updateMany` flips `paymentStatus→completed`, `transitionOrder(→paid)`, `finishSuccessfulPayment()`, 303→`/poruci/uspeh?oid=`; else `finishFailedPayment()`, 303→`/poruci/neuspeh?oid=`.

**Reconciler** — `src/server/finance/reconcile-nestpay.ts` (`reconcileNestpayPending`), driven by cron `src/app/api/cron/nestpay-reconcile/route.ts` (every 5 min, `CRON_SECRET` bearer). Queries bank status for pending orders (2 min–24 h old), confirms/declines.

## 3. Cloudflare Turnstile — **separable from Nestpay**

- Server verify: `src/lib/turnstile.ts` (`verifyTurnstile(token, ip)`), keys helper `src/lib/turnstile-keys.ts`. Widget: `src/components/ui/turnstile-widget.tsx`. Env: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.
- **Only wired into checkout via `step-payment.tsx` (gates the Nestpay button) and consumed inside `initiateNestpayPayment`/`initiateNestpayChargePayment`.** No other coupling. If `TURNSTILE_SECRET_KEY` unset, `verifyTurnstile` short-circuits `ok:true`. Fully removable/optional for PayPal (PayPal SDK has its own fraud layer); portal cards already pass `turnstileToken: null`.

## 4. Prisma schema — `prisma/schema.prisma` (payment models)

**Enums**: `OrderStatus` (draft, awaiting_payment, paid, in_progress, in_review, revision_requested, delivered, closed, cancelled, refunded); `PaymentStatus` (pending, completed, failed, refunded); `PaymentProvider` (**card_mock, wire_transfer, nestpay** — `paypal` was removed here); `PaymentMethod` (online_payment, wire_transfer); `BillingCurrency` (**RSD only** — `EUR` was removed); `BuyerType` (individual, company_rs, company_foreign).

**`Order`** payment fields: `paymentStatus`, `paymentProvider`, `paymentId` (holds the oid), `paymentMethod`, plus a **Nestpay forensic block** to genericize/replace: `nestpayTransId`, `nestpayAuthCode`, `nestpayProcReturnCode`, `nestpayMdStatus`, `nestpayHostRefNum`, `nestpayExtraTrxDate`, `nestpayResponseRaw` (Json), `nestpayResponseHash`, `nestpayLastQueryAt`, `nestpayChargedAmountCents`, `nestpayChargedCurrency`, `nestpayChargeRate`, `nestpayInstallmentCount`. Billing snapshot: `billingCurrency`, `billingVatRate`, `billingRsdRate`, `billingTotalCents`, `totalRsd`, `totalCents`. Invoice: `invoiceNumber/IssuedAt/PdfPath`; proforma equivalents. Indexes `@@index([paymentId, paymentProvider])`, `@@index([paymentStatus])` + partial index `orders_nestpay_pending_idx`.

**`OrderCharge`** mirrors the exact same nestpay* + billing + payment fields (add-on charges use the identical payment path). `OrderItem`, `OrderFile`, `OrderStatusEvent`, `OrderComment` are payment-agnostic.

**What changes for PayPal**: `paypal` back into `PaymentProvider`; `EUR` (and PayPal-supported currencies) into `BillingCurrency`; the `nestpay*` columns → a provider-neutral set (bank AuthCode/ProcReturnCode/mdStatus/HostRefNum have no PayPal analog; PayPal needs **capture ID + PayPal order ID + captured currency/amount + capture status**). Note prior EUR schema used columns `billingEurToRsdRate`, `totalEur`, `basePriceEur`, `priceEur`, `perSecondEur` (renamed back to `*Rsd` in the rsd_only migration — reversible reference).

## 5. Order lifecycle & post-payment hooks

FSM in `src/lib/order/status-transitions.ts` (`VALID_TRANSITIONS`, `canTransition`) + `src/lib/order/status-machine.ts` (`transitionOrder(orderId, toStatus, actorId, note, source)` — persists `OrderStatusEvent`, **syncs Bitrix stage via `syncDealStatus`** unless source is bitrix24). Path: `draft → awaiting_payment → paid → …`.

**Shared payment hooks** — `src/server/actions/payment.ts`:
- `finishSuccessfulPayment(orderId, {enqueueEmail})` — applies AI credits (`applyPurchasedAiCreditsForOrder`), auto-closes AI-only orders, **issues invoice (`issueInvoice`)**, enqueues outbox email (`payment_success_email` for nestpay, else `order_confirmation_email`). **This is the provider-neutral success seam — call it from a PayPal capture handler.**
- `finishFailedPayment(orderId, details)` — flips `paymentStatus=failed`, enqueues `payment_failure_email`.
- `mockCardPaymentAction(orderId)` — dev capture path.
Charge equivalents in `src/server/actions/charge-payment.ts` (`finishSuccessfulChargePayment`, `finishFailedChargePayment`, `mockCardChargePaymentAction`).

**Bitrix sync survives untouched**: `src/server/bitrix/**` (`sync-deal.ts`, `sync-status.ts`, `sync-file.ts`, `sync-contact.ts`, `sync-comment.ts`, `inbound.ts`, `reconcile.ts`). Triggered from `createOrder` (`syncNewDeal`) and every `transitionOrder`. **Payment provider is invisible to Bitrix** — swapping PayPal for Nestpay does not touch CRM sync. Cron `src/app/api/cron/bitrix-reconcile/route.ts`; inbound webhook `src/app/api/webhooks/bitrix24/route.ts`.

Emails via transactional outbox `src/lib/outbox.ts` (handlers `payment_success_email`, `payment_failure_email` at ~L403–442, currently pull Nestpay receipt data) + processor cron `src/app/api/cron/outbox-processor/route.ts`.

## 6. Invoice/PDF & currency formatting

- `src/lib/invoice-pdf.tsx` (`renderInvoicePdf`, `@react-pdf/renderer`, 3 layouts by buyerType) + `src/lib/proforma-pdf.tsx` + `src/lib/pdf-fonts.ts`. `formatMoney()` **hardcodes `" RSD"` and `sr-Latn-RS` locale**.
- `src/lib/invoice-data.ts` — `paymentMethodLabel(provider, isExport)` maps `nestpay→"Platna kartica (Banca Intesa)"` etc. (add a `paypal` label); `invoiceCurrencyForBuyer`/`isExportInvoice`/`invoiceVatRateForBuyer` all **stubbed to RSD/20% no-ops** (`void buyer`). Issuance orchestrator: `src/server/actions/issue-invoice.ts` (`issueInvoice`); charge variant `issue-charge-invoice.ts`. Invoice numbering `src/lib/invoice-number.ts`; listing `src/lib/invoice-list.ts`; reconcile cron `src/app/api/cron/invoice-reconcile/route.ts`.
- **Currency utilities (all neutered EUR→RSD stubs, signatures preserved — expand these for EUR)**: `src/lib/catalog/display-currency.ts` (`DisplayCurrency="rsd"` only, `formatPublicPrice`, `formatPublicRsdAmount`, `getPublicPricingTerms`, `PUBLIC_SERBIA_VAT_RATE`; integer-major-unit RSD, `maximumFractionDigits:0`) and `src/lib/billing.ts` (`BillingCurrency="RSD"`, `buildBillingSnapshot`, `billingCentsFromRsdCents` = identity, `formatBillingMoney` hardcodes RSD, `isExportBillingCurrency`→false). Also `src/lib/catalog/public-currency-server.ts`, `src/components/site/public-currency-provider.tsx`, `src/components/portal/order-currency-context.tsx`. **RSD assumption: prices stored as integer RSD (no minor units); EUR will need 2-decimal cents throughout.**

## The exact PayPal seam (recovered from git — pre-removal `b4d0740^`)

The removal commit touched **144 files**; 4 were PayPal-specific and deleted:
- `src/lib/payment/paypal.ts` — REST v2 client: `createPayPalOrder`/`createPayPalOrderCents(amountCents)` (intent CAPTURE, `currency_code:"EUR"`), `capturePayPalOrder(paypalOrderId)` → `{capturedAmount, capturedAmountCents, status}`, internal `getAccessToken()` OAuth2. Env: `PAYPAL_MODE`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`.
- `src/app/(marketing)/poruci/paypal-buttons.tsx` — client `PayPalButtons` (loads `paypal.com/sdk/js?client-id=…&currency=EUR`, `createOrder`/`onApprove` → server actions).
- `src/components/portal/paypal-portal-buttons.tsx` and `paypal-charge-buttons.tsx` — portal (unpaid order) + add-on charge equivalents.

Server actions in `src/server/actions/payment.ts` (pre-removal) were `createPayPalOrderAction(orderId)` and `capturePayPalOrderAction(orderId, paypalOrderId)`, with idempotency guards reusing an existing PayPal order id (see also commit `dff3c4d`). These sat **beside `mockCardPaymentAction` and called the same `finishSuccessfulPayment`/`transitionOrder` hooks that survive today.** `src/lib/payment/types.ts` still exists (`PaymentResult`, `CreatePaymentResult`).

**Where a PayPal provider plugs in (clean seams, unchanged by removal):**
1. `finishSuccessfulPayment(orderId)` / `finishFailedPayment(orderId, details)` in `server/actions/payment.ts` — provider-neutral post-capture hooks (invoice + email + credits). PayPal capture action calls these exactly as Nestpay's return route does.
2. `transitionOrder(orderId, "paid"/"awaiting_payment", …)` — status + Bitrix sync, provider-agnostic.
3. `step-payment.tsx` method selector — add a PayPal tile alongside/replacing the Nestpay tile (the tile array already exists).
4. `PaymentProvider` enum + `Order`/`OrderCharge` payment columns — add `paypal` + capture-id columns.
5. Portal reuse points: `src/components/portal/pending-payment-card.tsx` and `charge-payment-card.tsx` (both import `initiateNestpayPayment`/`initiateNestpayChargePayment` + `NestpayRedirectForm`).

**Complete payment-coupled file inventory**: `src/lib/nestpay/**` (10), `src/server/actions/{nestpay,payment,charge-payment}.ts`, `src/app/api/nestpay/return/route.ts`, `src/server/finance/reconcile-nestpay.ts`, `src/app/api/cron/{nestpay-reconcile,invoice-reconcile,outbox-processor}/route.ts`, `src/app/(marketing)/poruci/{steps/step-payment.tsx, nestpay-redirect-form.tsx, uspeh/page.tsx, neuspeh/page.tsx}`, `src/components/portal/{pending-payment-card,charge-payment-card}.tsx`, `src/components/marketing/{payment-trust-badges,nestpay-receipt}.tsx`, `src/components/site/site-footer.tsx` (badges), `src/lib/turnstile.ts` + widget, `src/lib/payment/{mock-card,types}.ts`, invoice stack (`invoice-pdf.tsx`, `invoice-data.ts`, `issue-invoice.ts`, `issue-charge-invoice.ts`), currency stubs (`display-currency.ts`, `billing.ts`), `src/lib/outbox.ts` (payment email handlers), `prisma/schema.prisma`. Env template: `.env.example` L32–53 (`NESTPAY_*`, `NEXT_PUBLIC_TURNSTILE_*`).

**Checkout fields/steps that exist ONLY for bank/Serbian compliance** (droppable/replaceable for PayPal-EU): Cloudflare Turnstile gate; installment (`taksit`) selector; the "Banca Intesa redirect" splash + trust badges; the 7-parameter EPM-2.7 receipt on uspeh/neuspeh; Serbian PIB (9-digit) / matični broj (8-digit) fields and SEF/ESIR invoice notes in `step-review.tsx` + `invoice-pdf.tsx`. The **14-day withdrawal waiver** (`waiveWithdrawal`, `withdrawalWaivedAt`) is EU-required and should be **kept** (it's already framed against EU CRD art.16(m)).
