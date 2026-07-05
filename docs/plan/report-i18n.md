I now have a comprehensive picture. Here is my report.

---

# TRANSLATION SURFACE + PRICING/CURRENCY REPORT
## Elegant Render (C:/Users/ngluv/Desktop/Platform) → English/EUR/PayPal clone

## ★ HEADLINE FINDING: This app already WAS EUR + PayPal, and was deliberately collapsed to RSD-only.

The single most important discovery for the whole clone plan: migration `prisma/migrations/20260617120000_rsd_only_no_paypal/migration.sql` reverses an earlier EUR+PayPal architecture. It renames DB columns `totalEur→totalRsd`, `basePriceEur→basePriceRsd`, `priceEur→priceRsd`, `perSecondEur→perSecondRsd`, `billingEurToRsdRate→billingRsdRate`, multiplies every amount by **117.2** (the EUR→RSD rate used), nulls out `paymentProvider='paypal'`, and shrinks the `PaymentProvider` and `BillingCurrency` enums. **The English/EUR/PayPal target is largely a REVERSAL of this migration.** The currency-abstraction seams are still present throughout the code as stubbed identity functions — they were multi-currency and got hard-wired to RSD. Rebuilding EUR display + PayPal means re-expanding these exact seams, not inventing new ones. There is also `docs/pricing/WhiteRook_Pricing_Pillar1_EUR.pdf` (original EUR price list) and `docs/pricing/pillar-1-extracted.md` (the pricing source of truth). Note: `docs/platform-decisions.md`, `docs/launch-checklist.md`, `docs/plan-v1.md` still reference the PayPal/EUR history.

---

## 1. ROUTE STRUCTURE MAP (Serbian folder → what it renders → English suggestion)

Root: `src/app/`. Three route groups: `(auth)`, `(marketing)`, and the un-grouped `portal/` + `api/`.

### `(marketing)` — public pages (`src/app/(marketing)/`)
| Serbian segment | Renders | Suggested EN |
|---|---|---|
| `page.tsx` (root `/`) | Homepage (hero, services showcase, model-first, principles, FAQ) | `/` |
| `cene/` | **Pricing configurator** — the `/cene` QuoteContext cart (core commerce surface) | `/pricing` |
| `poruci/` | **Checkout** wizard (`poruci/page.tsx` + `steps/`) | `/order` or `/checkout` |
| `poruci/steps/` | `step-details.tsx`, `step-upload.tsx`, `step-review.tsx`, `step-payment.tsx` | `steps/` |
| `poruci/uspeh/` | Payment success | `success/` |
| `poruci/neuspeh/` | Payment failure | `failure/` |
| `usluge/` + `usluge/[slug]/` | Services listing + detail | `services/` |
| `usluge/vr/konsultacija/` | VR consultation intake form | `services/vr/consultation/` |
| `ai-studio/` | AI Studio landing | `ai-studio/` (keep) |
| `o-nama/` | About | `about/` |
| `kontakt/` | Contact / quick inquiry | `contact/` |
| `cesto-postavljana-pitanja/` | FAQ | `faq/` |
| `portfolio/` | Portfolio (feature-flagged via `SITE_FEATURES.portfolio`) | `portfolio/` |
| `blog/` + `blog/[slug]/` | Blog | `blog/` |
| `pravno/` | **Legal hub.** Folders present: `impressum`, `uslovi-koriscenja`, `kolacici`, `reklamacije`, `dostava`, `sertifikati` | `legal/` |

**Legal route mismatch worth flagging:** `NAV_LEGAL` in `src/lib/content/site.ts` links to `/pravno/privatnost`, `/pravno/uslovi`, `/pravno/povracaj-sredstava` which have **no matching folders** (only `uslovi-koriscenja` exists). Suggested EN legal set: `imprint`, `terms`, `privacy`, `cookies`, `complaints`, `refunds`, `delivery`, `certificates`. EU adaptation will add/replace: GDPR privacy, EU Consumer Rights Directive 14-day withdrawal, PayPal-specific refund policy.

### `(auth)` — `src/app/(auth)/`
`prijava`(login), `registracija`(register), `verifikacija`(verify-email), `zaboravljena-lozinka`(forgot-password), `nova-lozinka`(new-password), `portal-pristup`(portal-access magic link).

### `portal/` — logged-in customer + admin (`src/app/portal/`)
Customer: `page.tsx`(dashboard), `porudzbine/` + `porudzbine/[orderId]/`(orders), `nova-porudzbina/`(new-order), `finansije/`(finances/invoices), `profil/`(profile), `ai-studio/` + `ai-studio/krediti/`(credits), `ai-kreacije/`(ai-creations).

Admin (`portal/admin/`): `page.tsx`, `porudzbine/[orderId]/`(orders), `upiti/`(inquiries), `vr-upiti/`(vr-inquiries), `korisnici/[userId]/`(users), `finansije/` + `finansije/cenovnik/`(pricebook) + `finansije/izvoz/`(export), `analitika/`(analytics), `chat-feedback/`, `outbox/`, `revizije/`(revisions), `ai-studio/`.

### `api/` (`src/app/api/`)
Serbian segments: `porudzbine` doesn't appear here, but `checkout`, `nestpay/return`, `webhooks/bitrix24`, `cron/{bitrix-reconcile,invoice-reconcile,nestpay-reconcile,outbox-processor,quote-cleanup}`, `portal/{charge-invoice,download,invoice,proforma}`, `admin/{finansije,inquiries,proforma-preview,ai-studio}`, `ai-studio/*`, `inquiries`, `account/export`, `chat`. **The `nestpay/` route tree is the card-payment integration that PayPal replaces.**

---

## 2. TRANSLATION SURFACE MAP — where UI copy lives

**There is NO i18n/dictionary layer.** All copy is hardcoded Serbian (sr-Latn), inline in components/server files. Locale is hardwired as `"sr-Latn-RS"` / `"sr-RS"` in `toLocaleString`/`toLocaleDateString` calls and `Intl.NumberFormat`. Quantified: **592 occurrences of `RSD|dinar|PDV` across 70 files.** The one partial exception is the invoice PDF (see §3), which already has an English `company_foreign` string table. Categories:

**A. Central content constants — `src/lib/content/site.ts`** (biggest single copy file). Exports `SITE` (name, tagline, description), `IMPRINT` (legal identity, address, bank: Banca Intesa IBAN/SWIFT — must change for EU), `TRUST_SIGNALS`, `PLATFORM_PRINCIPLES`, `ORDERING_STEPS` (contains RSD price examples like "29.300 RSD"), `FAQ_ITEMS`, `SERVICES_PAGE_FAQS`, `AI_STUDIO_FAQS`, `NAV_MAIN`, `NAV_LEGAL`, `ISO_CERTIFICATIONS`, `CERTIFIER`, JSON-LD (`currenciesAccepted: "RSD"`, `areaServed: ["RS","EU","Worldwide"]`).

**B. Service catalog — `src/lib/catalog/services.ts`** (marketing-facing, `SERVICES[]`, ~massive, 259 RSD hits alone). Human copy: `name`, `tagline`, `description`, `highlight`, `materials`, `priceLabel`, `unitLabel`, per-variant `included`/`addOns[]`/`note`/`decomposition`, plus `ServiceBenefit`/`ProcessStep`/`ServiceFaq` arrays. `ServiceCategory` union uses Serbian keys: `eksterijer|enterijer|planovi|animacije|transformacija`.

**C. Configurator catalog — `src/lib/catalog/configurator.ts`** — `CONFIGURATOR_CATEGORIES[]` with Serbian `label`, `sectionLabel`, `description`, `includes[]`, `disclaimers[]`, and per-addon `label`/`description`, plus `consumes[].reason` discount explanations. Sibling config files each carry Serbian labels: `interior-config.ts` (`ROOM_STYLES`, `TIMES_OF_DAY`={jutro,podne,popodne,vece,noc}, `SEASONS`={prolece,leto,jesen,zima} — these IDs are Serbian and used as enum-like values), `tour360-config.ts`, `exterior-config.ts`, `landscape-config.ts`, `siteplan-config.ts`, `floorplan-config.ts`, `floorplan-2d-config.ts`, `staging-config.ts`, `renovation-config.ts`, `dtd-config.ts`, `item-removal-config.ts`, `animation-config.ts`, `vr-config.ts`, `services.ts`.

**D. Emails — `src/lib/email.ts`** (Resend). ~15 fully-Serbian HTML templates: verification, password reset, portal access, order confirmation, invoice/proforma issued, inquiry converted, AI-credits expiry/granted, free-revision, additional-charge requested/paid, VR inquiry admin/customer, VR project ready, and the Nestpay `sendPaymentSuccessEmail`/`sendPaymentFailureEmail` (built around Serbian bank-receipt blocks per "EPM standard 2.7" — these are **card-specific and must be rewritten for PayPal**). `FROM = "Elegant Render <noreply@elegantrender.rs>"`, `ADMIN_NOTIFY_EMAIL = info@elegantrender.rs`.

**E. PDF templates — `src/lib/invoice-pdf.tsx`, `src/lib/proforma-pdf.tsx`** (+ `invoice-data.ts`, `proforma-data-builder.ts`, `pdf-fonts.ts`). `invoice-pdf.tsx` has a `STRINGS` table keyed by buyer type: `individual` & `company_rs` are Serbian ("RAČUN", "PDV (20%)", "Ukupno za uplatu"); **`company_foreign` is already English** ("INVOICE", "VAT", "Total due", `en-GB` date locale). Serbian legal VAT footnotes at lines ~432/439 ("PDV obračunat po stopi 20%…", "…Zakonom o PDV-u"). This existing EN path is a useful template for the clone.

**F. Chatbot prompts — `src/lib/chat/system-prompt.ts`** (see §4) + `guide-context.ts`, `guide-tips.ts`, `feedback.ts`. Fully Serbian system prompt.

**G. Portal/admin UI** — hardcoded Serbian throughout `src/components/portal/*` (48 files) and `src/app/portal/**`. Order status labels + customer guidance in **`src/components/portal/status-utils.ts`** (`STATUS_LABELS`, `STATUS_STEPS`, `STATUS_GUIDANCE` — all Serbian, keyed by enum). Config-section components (one per product) carry Serbian field labels.

**H. Marketing components** — `src/components/marketing/*` (~20 files: `quick-order-hero`, `services-grid`, `model-first`, `platform-principles`, `faq-cards`, `final-cta`, `results-proof`, `nestpay-receipt`, `payment-trust-badges`, etc.) all Serbian inline.

**I. Validation/error strings** — `src/lib/buyer-validation.ts` returns single Serbian error strings ("PIB mora imati tačno 9 cifara.", "Naziv firme je obavezan.", VAT-ID messages). Server actions and `step-payment.tsx` have inline Serbian errors ("Porudžbina nije kreirana…", "Greška mreže…", Turnstile config messages).

**J. SEO/content** — `src/lib/seo.ts`, `src/lib/llms.ts` (+ `app/llms.txt`, `llms-full.txt` routes), `src/lib/content/blog.ts`, `sitemap`/`robots`.

---

## 3. PRICING DATA FLOW & CURRENCY ABSTRACTION (your core area)

### Storage model
- **All prices are RSD integers with PDV (VAT) included** ("gross"). Fields named `*Rsd` (integer whole dinars) and `*Cents` (RSD×100). Confirmed in `configurator.ts` header: *"Public list amounts are stored in RSD gross amounts with PDV included."*
- Catalog constants: `basePriceRsd`, `priceRsd`, `perSecondRsd`, plus interior/tour360 constants (`INT_STATIC_FIRST_FLOOR_RSD=19924`, etc. in `interior-config.ts`, mirrored in `tour360-config.ts`, `tour-assembly.ts`).
- DB (`prisma/schema.prisma`): `Order.totalRsd/totalCents/premiumTotalRsd`, `OrderItem.basePriceRsd/basePriceCents/totalRsd/totalCents/originalTotalRsd`, `OrderCharge`, and the admin `PricingProduct.basePriceRsd`/`PricingAddOn.priceRsd`/`PricingDurationRule.perSecondRsd` (versioned pricebook).

### Calculation engine — `src/lib/catalog/calculate.ts`
Pure functions: `calculateQuote()` (per-item breakdown + Pass-2 cross-service "model-first" discounts via `resolveDiscount()`/`buildAssetInventory()`), `priceItems()` (orchestrator routing `int-static`→`priceInteriorItem`/`calcInteriorTotal` and `int-360`→`priceTour360Item`/`calcTour360Total`). This is the **single source of truth shared by `/cene`'s `QuoteContext` and the server's `repriceOrder`** (`src/server/order/reprice.ts`). Output shape `LineItemBreakdown` carries both `*Rsd` and `*Cents`. `formatRsd()`/`formatDiscountedPrice()` at bottom emit `"… RSD"` badges (`−${pct}%`).

### THE CURRENCY DISPLAY SEAM — `src/lib/catalog/display-currency.ts` (single most important file for EUR work)
This is the central, already-abstracted formatting layer, currently pinned to RSD:
- `type DisplayCurrency = "rsd"` (was a union; collapse point).
- `PUBLIC_RSD_RATE = 1`, `PUBLIC_SERBIA_VAT_RATE` (env `NEXT_PUBLIC_SERBIA_VAT_RATE`, default 0.2).
- `getDisplayCurrencyForCountry(countryCode)` — **currently ignores country and always returns "rsd"** (this is exactly where "automatic PayPal-supported local currency by geo" plugs in).
- `formatPublicPrice(amountRsd, currency, settings)`, `formatPublicPriceFromCents`, `formatPublicRsdAmount` (uses `Intl.NumberFormat("sr-RS")`), `formatPublicDiscountedPrice`, and `formatPublicPriceText()` (regex-rewrites `"RSD 12345"` inside free text — used to make the **chatbot prompt** currency-aware).
- `getPublicPricingTerms()` / `publicPriceNote()` — the Serbian "Sve cene su u RSD, PDV uračunat" legal note (injected into chat prompt and pricing page).
- Server companion `src/lib/catalog/public-currency-server.ts`: `getPublicCountryCode()` reads `x-vercel-ip-country` header, `getPublicDisplayCurrency()`. **Geo detection already exists** — it's the input for local-currency display.

### The billing/VAT seam — `src/lib/billing.ts`
`type BillingCurrency = "RSD"`. All conversion functions are **stubbed identities**: `billingCurrencyForCountry()`→"RSD", `displayCurrencyForBillingCurrency()`→"rsd", `isExportBillingCurrency()`→false, `billingCentsFromRsdCents()`→identity (was EUR→RSD), `buildBillingSnapshot()` hardcodes `billingCurrency:"RSD", billingRsdRate:1`. VAT: `serbiaVatRate` split out of gross. `SERBIA_COUNTRY_CODE="RS"`, `buyerTypeForBilling()` maps company+country→`company_rs`/`company_foreign`. These are the seams for EU VAT (reverse-charge, OSS, VAT-exempt export invoices).

### Pricing settings resolver — `src/lib/pricing/catalog.ts` + `src/server/pricing/catalog.ts`
`ResolvedPricingCatalog`/`PricingSettings` (carries `rsdRate`, `serbiaVatRate`, special-pricing constants, AI-credit tiers). `getStaticPricingCatalog()` (hardcoded from `CONFIGURATOR_CATEGORIES`) vs the DB-backed versioned pricebook (`PricingBook` published by finance admin at `/portal/admin/finansije/cenovnik`). AI credits: `src/lib/ai-studio/catalog.ts` (`centsToRsd`, `formatCents`, tier pricing).

### Price → order flow
`/cene` QuoteContext (`components/configurator/quote-context.tsx`) → `priceItems()` → checkout server action `src/server/actions/checkout.ts` creates `Order`/`OrderItem` with RSD snapshots → server re-verifies via `repriceOrder` (`src/server/order/reprice.ts`) → payment (`src/server/actions/nestpay.ts` / `payment.ts`) → `finishSuccessfulPayment` issues invoice → emails + Bitrix + PDF. **Portal display** goes through `components/portal/order-currency-context.tsx` (`OrderCurrencyProvider`/`useOrderCurrency`) which wraps the same `display-currency.ts` formatters — one more consumer of the seam.

### Every place currency is FORMATTED/displayed (inventory)
`display-currency.ts` (canonical), `calculate.ts` `formatRsd`, `email.ts` `formatEmailRsd/formatEmailMoney`, `billing.ts` `formatBillingMoney`, `invoice-pdf.tsx` & `proforma-pdf.tsx` (`toLocaleString("sr-Latn-RS")` + "RSD"), `chat/system-prompt.ts` `formatRsdAmount`, `bitrix/sync-deal.ts` (`CURRENCY_ID:"RSD"`, `OPPORTUNITY`), `nestpay/*` (charge amount/currency), portal config-section components (each shows RSD add-on prices), `pricing-workbench.tsx` (admin). VAT is expressed as "PDV (20%)" and gross-inclusive everywhere.

`docs/pricing/pillar-1-extracted.md` is the canonical price table; `docs/pricing/WhiteRook_Pricing_Pillar1_EUR.pdf` holds the original EUR figures.

---

## 4. THE OPENAI CHATBOT — `src/lib/chat/system-prompt.ts`

- Model GPT-4o-mini (`api/chat/route.ts`). `buildSystemPrompt()` assembles: `BASE_SYSTEM_INSTRUCTIONS` (large Serbian block — *"Odgovaraj UVEK na srpskom (latinica)"*, conversation rules, upsell guidance) + live UI context + full platform knowledge (services, pricing catalog rendered from `CONFIGURATOR_CATEGORIES`, AI Studio, FAQ). **Whole prompt is Serbian and must be translated + the "always answer in Serbian" rule flipped to English.**
- **`:::predlog` proposal block:** the model appends a fenced block `:::predlog / primary: ID:QTY / related: ID:QTY,… / note: … / :::`. The chat UI parser lives in **`src/components/chat/chat-messages.tsx`** (only file matching the pattern) — it turns the block into "Add to configurator" action buttons deep-linking to `/cene`. **The literal token `predlog` and the field keys are Serbian-facing**; renaming to e.g. `:::proposal` requires changing both the prompt authoring AND the `chat-messages.tsx` parser. Examples inside the prompt embed RSD prices ("2.110 RSD", "26.370 RSD").
- Currency-awareness is already wired: the prompt is post-processed through `formatPublicPriceText(prompt, displayCurrency, pricingSettings)` and the price-note line is swapped via `publicPriceNote(displayCurrency)` — so once `display-currency.ts` speaks EUR, the chatbot's prices follow automatically.
- Chat guide-context providers: `components/chat/{ai-studio,order,pricing}-guide-context.tsx` push live cart/page state (Serbian labels) into the prompt. Feedback stored via `ChatFeedback` model.

---

## 5. BACKEND / CRM-VISIBLE STRINGS

- **Bitrix24 (must survive):** `src/lib/bitrix24/{client,stage-map,types}.ts`, `src/server/bitrix/{sync-deal,sync-contact,sync-comment,sync-status,sync-file,sync-project-inquiry,reconcile,inbound}.ts`. **`sync-deal.ts` writes Serbian deal content:** `TITLE: "${orderNumber} — ${productLabel}"` (fallback `"Porudžbina"`), `CURRENCY_ID:"RSD"` (Bitrix deal currency — change to EUR), `OPPORTUNITY: premiumTotalRsd ?? totalRsd`, `COMMENTS` with `"Stavke:\n…"` + `"Napomena:"`, line items formatted `"… RSD"`. `stage-map.ts` maps `OrderStatus`↔Bitrix stage IDs (from env `BITRIX24_STAGE_*`) — status keys stay as enum (English already). `scripts/bitrix-setup.ts` provisions the pipeline.
- **Order status machine:** `src/lib/order/status-transitions.ts`, `status-machine.ts`, `activity-timeline.ts` (Serbian activity strings). Enum values themselves are English (`draft`, `awaiting_payment`, `in_progress`, …). Human labels in `components/portal/status-utils.ts` (§2G).
- **Server actions** (`src/server/actions/*`, ~35 files) — Serbian success/error messages, e.g. `checkout.ts`, `order.ts`, `nestpay.ts`, `payment.ts`, `quote.ts`, `project-inquiry.ts`, `vr-inquiry.ts`, `issue-invoice.ts`, `issue-proforma.ts`, `admin-charges.ts`. Validation: `buyer-validation.ts` (§2I), plus zod-style checks inline.
- **Outbox** (`src/lib/outbox.ts`, `OutboxEventType` enum) drives all transactional emails (English enum keys, Serbian payloads/templates).

---

## 6. DATABASE — Serbian enum values / seed data

- **Prisma enums are mostly English** (`OrderStatus`, `PaymentStatus`, `BuyerType`={individual,company_rs,company_foreign}, `PaymentProvider`={card_mock,wire_transfer,**nestpay**}, `PaymentMethod`={online_payment,wire_transfer}, `BillingCurrency`={**RSD**}, `AiEditType`, `OutboxEventType`, etc.). **For the clone:** `PaymentProvider` needs `paypal` re-added (it was removed by the RSD-only migration); `BillingCurrency` needs `EUR` (± local currencies).
- **Serbian VALUES that are data, not enums:** interior config IDs in `interior-config.ts` — `TIMES_OF_DAY` ids {`jutro,podne,popodne,vece,noc`}, `SEASONS` ids {`prolece,leto,jesen,zima`}, `ROOM_STYLES` id `primorski` + Serbian labels/descriptions. These are stored in `OrderItem.configJson`, so renaming ids is a data-migration concern.
- **Seed/scripts** (`scripts/`): `seed-admin.ts`, `seed-client.ts`, `seed-test-users.ts`, `create-bojan-account.ts`, `grant-test-credits.ts`, `verify-pricing.ts`/`verify-interior-pricing.ts`/`verify-tour360-pricing.ts` (contain RSD assertions; `verify-pricing.ts` still references EUR), `rename-int-static.ts`, `migrate-anim-products.ts`. `prisma/migrations/00000000000000_init` and several others still contain `EUR`/`paypal` column history.
- **`IMPRINT.bank`** in `site.ts` (Banca Intesa RSD IBAN/SWIFT) lands on proforma PDFs — must be replaced for EU/PayPal.

---

## 7. RECOMMENDATION-READY INVENTORY — Serbian route names → English

**Marketing:** `cene`→`pricing`, `poruci`→`order`(or `checkout`), `poruci/uspeh`→`order/success`, `poruci/neuspeh`→`order/failure`, `usluge`→`services`, `usluge/vr/konsultacija`→`services/vr/consultation`, `o-nama`→`about`, `kontakt`→`contact`, `cesto-postavljana-pitanja`→`faq`, `portfolio`→`portfolio`, `blog`→`blog`, `pravno`→`legal`, `pravno/impressum`→`legal/imprint`, `pravno/uslovi-koriscenja`→`legal/terms`, `pravno/kolacici`→`legal/cookies`, `pravno/reklamacije`→`legal/complaints`, `pravno/dostava`→`legal/delivery`, `pravno/sertifikati`→`legal/certificates` (+ EU-new: `legal/privacy`, `legal/refunds`, `legal/withdrawal`).

**Auth:** `prijava`→`login`, `registracija`→`register`, `verifikacija`→`verify`, `zaboravljena-lozinka`→`forgot-password`, `nova-lozinka`→`reset-password`, `portal-pristup`→`portal-access`.

**Portal:** `porudzbine`→`orders`, `nova-porudzbina`→`new-order`, `finansije`→`finances`(or `billing`), `profil`→`profile`, `ai-kreacije`→`ai-creations`, `ai-studio/krediti`→`ai-studio/credits`.

**Admin:** `upiti`→`inquiries`, `vr-upiti`→`vr-inquiries`, `korisnici`→`users`, `finansije/cenovnik`→`finances/pricebook`, `finansije/izvoz`→`finances/export`, `analitika`→`analytics`, `revizije`→`revisions`, `porudzbine`→`orders`.

**API:** replace `nestpay/*` with `paypal/*`; keep `webhooks/bitrix24`, `cron/*` (rename `nestpay-reconcile`→`paypal-reconcile`), `portal/*`, `admin/*`.

---

## 8. WORK-ITEM SUMMARY FOR YOUR AREA (translation + EUR)

1. **Reverse the RSD-only migration** conceptually: re-add `paypal` to `PaymentProvider`, add `EUR` (+ local) to `BillingCurrency`, restore `*Eur`/rate columns or repurpose the `*Rsd` fields as `*Eur`. Store prices as EUR integers/cents; original EUR figures in `docs/pricing/WhiteRook_Pricing_Pillar1_EUR.pdf`.
2. **Re-expand `src/lib/catalog/display-currency.ts`**: widen `DisplayCurrency`, make `getDisplayCurrencyForCountry()` return PayPal-supported local currencies by geo (`public-currency-server.ts` already reads IP country), implement real conversion in `formatPublicPrice`/`formatPublicPriceText`/`formatPublicDiscountedPrice`. Every price display cascades from here (chat, portal, /cene, checkout).
3. **Re-expand `src/lib/billing.ts`**: implement EU VAT (reverse-charge/export/OSS) in the currently-stubbed `billingCurrencyForCountry`/`isExportBillingCurrency`/`billingCentsFromRsdCents`/`buildBillingSnapshot`; change VAT rate handling from Serbia 20% to EU rules.
4. **Translate the copy layers**: `content/site.ts`, `catalog/services.ts`, `catalog/configurator.ts` + all `*-config.ts`, `email.ts` (rewrite Nestpay receipt emails as PayPal), `invoice-pdf.tsx`/`proforma-pdf.tsx` (the English `company_foreign` table is a starting template), `chat/system-prompt.ts` (+ flip language rule, rename `:::predlog`→`:::proposal` in both prompt and `chat-messages.tsx`), `status-utils.ts`, all `components/portal/*` + `components/marketing/*`, `buyer-validation.ts`.
5. **Bitrix**: change `CURRENCY_ID:"RSD"`→EUR in `sync-deal.ts`, translate deal `TITLE`/`COMMENTS`; keep all sync logic + `stage-map` env wiring intact.
6. **Replace `src/app/api/nestpay/*` + `src/lib/nestpay/*` + `src/server/actions/nestpay.ts` + `step-payment.tsx`** with a PayPal integration; shorten checkout `steps/` to PayPal's minimum; drop installments UI.
7. Change locale constants from `sr-Latn-RS`/`sr-RS` to `en`/`en-GB`, update `IMPRINT` (bank, EU representative), and JSON-LD (`currenciesAccepted`, `availableLanguage`).
