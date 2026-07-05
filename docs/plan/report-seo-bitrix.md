I now have a comprehensive picture. Here is my exhaustive report.

---

# REPORT: SEO, Analytics, Consent, Images, Legal, Bitrix24

Repo root: `C:/Users/ngluv/Desktop/Platform`. All paths below are relative to it. Note: the app is `sr-Latn` throughout; routes are Serbian slugs under a `(marketing)` route group and a `portal` group.

---

## 1. SEO

### Core SEO library — `src/lib/seo.ts` (the heart of it, 517 lines)
- `SEO` const: `htmlLang: "sr-Latn"`, `alternateLanguage: "sr-Latn-RS"`, `locale: "sr_RS"`, `keywords` = `DISCOVERY_KEYWORDS` (11 Serbian phrases incl. "renderi Srbija"). **All Serbia/Serbian-specific.**
- `DEFAULT_OG_IMAGE = "/og-image.jpg"` (static file, `public/og-image.jpg`, 84KB, 1200×630).
- `createPublicMetadata({title, description, path, image, imageAlt, keywords, twitterDescription, noIndex})` — the single factory every page uses. Produces `Metadata` with canonical, `languages` alternates, robots, OpenGraph, Twitter card. Social title/description trimming via `trimForMeta`, `formatSocialTitle`.
- `canonicalUrl` / `absoluteUrl` / `normalizeCanonicalPath` / `normalizePath` — URL builders keyed off `SITE.url`.
- `buildLanguageAlternates(path)` — returns hreflang map `{ "sr-Latn-RS": canonical, "sr-RS": canonical, "x-default": canonical }`. **Only Serbian hreflang — no `en`. For the EN clone this becomes `en`/`x-default`.**
- `INDEXABLE_ROBOTS` / `NO_INDEX_ROBOTS` constants.
- JSON-LD builders (schema.org): `buildWebSiteJsonLd`, `buildWebPageJsonLd`, `buildBreadcrumbJsonLd`, `buildFaqJsonLd`, `buildServiceJsonLd`, `buildServicesItemListJsonLd`, `buildOfferCatalogJsonLd`, `buildOrderingHowToJsonLd`, `buildHomeJsonLd`. `buildSeoImageObject` for `ImageObject`.
- **RSD-specific:** `buildServiceJsonLd` and `buildOfferCatalogJsonLd` hardcode `priceCurrency: "RSD"` in Offer/UnitPriceSpecification (lines ~399, 409, 457, 473); `buildOfferCatalogJsonLd` description says "Osnovne cene ... su u RSD, bruto sa PDV-om". Uses `product.basePriceRsd`.
- `areaServed` in `buildServiceJsonLd`: Country "Serbia" + "Regional markets" + "Worldwide".

### Organization JSON-LD — `src/lib/content/site.ts` → `buildOrganizationJsonLd()`
- `@type: ["Organization","ProfessionalService","LocalBusiness"]`. Contains `legalName` (White Rook DOO), `taxID`/`vatID` = PIB `110339214`, `address` (addressCountry `RS`, addressRegion `RS`), `currenciesAccepted: "RSD"`, `priceRange: "RSD"`, `areaServed: ["RS","EU","Worldwide"]`, `hasCredential` (3 ISO certs via TÜV). **RSD + Serbia-specific.**

### Root metadata — `src/app/layout.tsx`
- `export const metadata` — title template `%s · Elegant Render`, `metadataBase: new URL(SITE.url)`, canonical `SITE.url`, `languages: buildLanguageAlternates("/")`, OpenGraph/Twitter with `og-image.jpg`, `INDEXABLE_ROBOTS`, `verification.google` gated on `GOOGLE_SITE_VERIFICATION` env. `<html lang={SEO.htmlLang}>` (= `sr-Latn`).
- Fonts: `Cormorant_Garamond` + `Manrope` via `next/font/google`, subsets `["latin","latin-ext"]` (latin-ext needed for Serbian diacritics — can drop for EN).

### Route SEO files (Next.js metadata routes)
- `src/app/sitemap.ts` — static routes (all Serbian slugs: `/usluge`, `/cene`, `/ai-studio`, `/kontakt`, `/blog`, `/o-nama`, `/cesto-postavljana-pitanja`, `/usluge/vr/konsultacija`, `/pravno/*`, `/llms.txt`, `/llms-full.txt`) + dynamic `SERVICES` (`/usluge/{slug}`) + blog posts. Each entry carries `alternates.languages` (hreflang) and `images[]` (hardcoded `/artwork/*.webp` paths). **NB: sitemap still references OLD legal slugs `/pravno/privatnost`, `/pravno/uslovi` which now 307-redirect (see next.config).**
- `src/app/robots.ts` — `PRIVATE_PATHS` (Serbian: `/poruci`, `/prijava`, `/registracija`, `/zaboravljena-lozinka`, `/nova-lozinka`, `/verifikacija`, `/portal-pristup`, `/portal`, `/api`, `/monitoring`), `PUBLIC_ALLOW`, and a large `AI_BOTS` allow-list (GPTBot, ClaudeBot, PerplexityBot, etc.). Sitemap + host from `SITE.url`.
- `src/app/manifest.ts` — PWA manifest, Serbian `description`, `theme_color: "#b88363"`, icons from `/branding/icon-192.png` & `icon-512.png`, `/favicon.ico`.
- `src/app/favicon.ico` — only icon; **no dynamic `opengraph-image.tsx`/`icon.tsx`/`apple-icon` routes exist.** OG is the single static `public/og-image.jpg`.

### Per-page metadata & JSON-LD injection (17 pages)
`generateMetadata`/`metadata` + `dangerouslySetInnerHTML` JSON-LD found in: `src/app/(marketing)/page.tsx` (home), `usluge/page.tsx`, `usluge/[slug]/page.tsx`, `cene/page.tsx`, `ai-studio/page.tsx`, `portfolio/page.tsx`, `blog/page.tsx`, `blog/[slug]/page.tsx`, `kontakt/page.tsx`, `cesto-postavljana-pitanja/page.tsx`, `o-nama/page.tsx`, `usluge/vr/konsultacija/page.tsx`, and all `pravno/*` pages. Image alt/caption for structured data: `buildServiceImageAlt` / `buildServiceImageCaption` in `src/lib/catalog/services.ts` (lines 2779, 2806) — Serbian alt strings.

### `next.config.ts` (SEO-relevant)
- `images.remotePatterns`: allows `d2xsxph8kpxj0f.cloudfront.net` (portfolio/AI CDN images).
- `outputFileTracingIncludes`: bundles `@fontsource/noto-sans` latin-ext woff files (used by PDF generation for Serbian glyphs).
- `async redirects()` — **13 permanent 301s** for old Serbian service slugs (e.g. `/usluge/fotomontaza` → `/usluge/render-u-stvarnoj-fotografiji`) + **3 temporary 307s** consolidating legal pages: `/pravno/uslovi` → `/pravno/uslovi-koriscenja#uslovi`, `/pravno/privatnost` → `#privatnost`, `/pravno/povracaj-sredstava` → `#povracaj`. All slugs are Serbian.
- `async headers()` — security baseline (HSTS, X-Frame-Options SAMEORIGIN, Referrer-Policy, `Permissions-Policy: camera=(), microphone=(), geolocation=()`). **Explicit comment: no CSP until "posle NestPay retesta banke"; do NOT add `payment` to Permissions-Policy — Nestpay/bank-certification-specific and irrelevant for PayPal.**
- Wrapped in `withSentryConfig` (org `white-rook`, `tunnelRoute: "/monitoring"`, `automaticVercelMonitors`).
- `llms.txt` / `llms-full.txt` generated via `src/lib/llms.ts` (AI-readable site profile, Serbian).

---

## 2. Analytics stack

Everything is **consent-gated** and only loads post-decision. Central consent module:

### Consent storage — `src/lib/consent.ts`
- localStorage key `er-consent`, `CONSENT_VERSION = 2`. Type `ConsentPrefs { necessary:true, analytics, marketing, recording, decidedAt }`.
- `readConsent`, `writeConsent`, `acceptAll`, `acceptNecessary`, `openConsentBanner`.
- Custom events: `er-consent-change` (dispatched on write; listeners re-init tracking) and `er-open-consent` (footer "Cookie settings" reopens banner). **This is the gate for every analytics vendor.** GDPR-aligned, reusable as-is for EN/EU.

### Consent banner UI — `src/components/site/consent-banner.tsx`
- `<ConsentBanner />` mounted in `src/app/layout.tsx`. `useSyncExternalStore` + SSR sentinel for hydration safety. Serbian copy ("Kolačići i privatnost", "Prihvati sve", "Samo neophodne", 4 rows: Neophodni/Analitika/Marketing/Snimanje sesija). Links to `/pravno/kolacici`. Reopened via `ConsentSettingsLink` in footer.

### Client instrumentation — `src/instrumentation-client.ts`
- Gates **Sentry** (errors/tracing/replay) and **PostHog** (posthog-js) behind `prefs.analytics`; session replay behind `prefs.recording`. `startSentry`, `startPostHog`, `applyConsent`. Subscribes to `er-consent-change`. On revoke → `posthog.opt_out_capturing()`, Sentry sample rates 0. PostHog init: `api_host` from `NEXT_PUBLIC_POSTHOG_HOST` (default `https://us.i.posthog.com`), `person_profiles: "identified_only"`, `capture_pageview: "history_change"`.
- `onRouterTransitionStart` exported for Next router transition tracing.

### Server instrumentation — `src/instrumentation.ts`
- `register()` loads `sentry.server.config`/`sentry.edge.config` + `checkServerEnv()`. `onRequestError = Sentry.captureRequestError`. Config files at repo root: `sentry.server.config.ts`, `sentry.edge.config.ts`, `next.config.ts` (build plugin), `.env.sentry-build-plugin`.

### PostHog server — `src/lib/posthog.ts`
- posthog-node, `getClient()` (batching disabled: flushAt=1, flushInterval=0 for serverless), `captureServerEvent`, `identifyServerUser`. No-op without `NEXT_PUBLIC_POSTHOG_KEY`. distinctId convention `user:<id>` / `anon:<id>`.
- Event schema (client+server): `src/lib/posthog-events.ts` — typed `EventMap`, `track()`. **Currency props suffixed `_rsd`** (e.g. `total_rsd`, `price_rsd`), providers `"card_mock" | "nestpay"`. **RSD/Nestpay-specific naming throughout — needs EUR/PayPal rename.**
- Client bridges: `src/components/posthog-session-bridge.tsx` (mounted in marketing layout), `src/components/posthog-identify-bridge.tsx`.

### Google Tag Manager — `src/components/analytics/google-tag-manager-post-launch.tsx`
- `GoogleTagManagerPostLaunch` mounted in root layout. Enabled by `NEXT_PUBLIC_GTM_ENABLED === "true"`; container `NEXT_PUBLIC_GTM_CONTAINER_ID` (default fallback `GTM-5X2MCQ87`). Implements **Google Consent Mode v2**: `ensureGoogleDataLayer` sets `gtag('consent','default', {all denied})`; `updateGoogleConsent(analytics, marketing)` maps consent → `analytics_storage`/`ad_storage`/`ad_user_data`/`ad_personalization`. Pushes `er_analytics_consent_granted/denied` + `virtual_page_view` on pathname change. Loads GTM only when enabled AND (analytics OR marketing) consent.

### GA4 direct tag — `src/components/analytics/google-analytics-post-launch.tsx`
- `GoogleAnalyticsPostLaunch`, gated by `NEXT_PUBLIC_GA4_ENABLED` + `NEXT_PUBLIC_GA4_MEASUREMENT_ID` (validated `/^G-[A-Z0-9]+$/`). `send_page_view:false` + manual `page_view`, `anonymize_ip:true`, `ga-disable-<id>` toggle. **`.env.example` note: GA4 fires from inside GTM container, so direct tag kept disabled (avoid duplicate pageviews).**

### LinkedIn Insight Tag — `src/components/analytics/linkedin-insight-tag.tsx`
- `LinkedInInsightTag`, gated on `prefs.marketing`. **Hardcoded `LINKEDIN_PARTNER_ID = "9178042"`** (client's real partner ID — replace/remove for EN). Loads `snap.licdn.com/li.lms-analytics/insight.min.js`. No noscript pixel (consent lives in localStorage).

### Vercel Analytics / Speed Insights — `src/app/layout.tsx`
- `<Analytics />` (`@vercel/analytics/next`) + `<SpeedInsights />` (`@vercel/speed-insights/next`) mounted unconditionally in body (not consent-gated). Also in body: `ConsentBanner`, `GoogleAnalyticsPostLaunch`, `GoogleTagManagerPostLaunch`, `LinkedInInsightTag`.

### dataLayer ecommerce events (GTM/GA4 conversion tracking)
- Types + builders (client): `src/lib/analytics/google-data-layer.ts` — `GoogleLeadDataLayerEvent` (`er_generate_lead`), `GoogleCommerceDataLayerEvent` (`er_begin_checkout`), `GooglePurchaseDataLayerEvent` (`er_purchase`), `buildBeginCheckoutDataLayerEvent`, `centsToDataLayerValue`. **`GoogleConversionCurrency = "RSD"` hardcoded; all events set `currency:"RSD"`, `transaction_currency:"RSD"`.**
- Push helper (client): `src/lib/analytics/google-data-layer-client.ts` — `pushGoogleDataLayerEvent()`, **requires marketing consent** (`hasMarketingConsent` via `readConsent`), dedupes via sessionStorage (`er:data-layer:` keys; purchase keyed by `transaction_id`).
- Server purchase builder: `src/server/analytics/google-conversions.ts` — `buildPurchaseDataLayerEvent(orderId, conversionSource)`. `PurchaseConversionSource` = `"mock_card_success" | "mock_card_replay" | "mock_card_race" | "nestpay_success_page"` (**mock-card + Nestpay-specific — becomes PayPal**). Sets `currency:"RSD"`, uses `billingTotalCents ?? totalCents ?? totalRsd*100`, `payment_provider: order.paymentProvider`.
- **Where pushed:**
  - `er_begin_checkout` — `src/components/configurator/quote-summary.tsx:60-67`.
  - `er_purchase` — built server-side in `src/server/actions/payment.ts:31-33` and `src/app/(marketing)/poruci/uspeh/page.tsx:45` (success page), pushed client-side in `src/app/(marketing)/poruci/steps/step-payment.tsx:118` and via `src/components/analytics/data-layer-event.tsx` (generic mount-and-push component).
  - `er_generate_lead` — `src/app/(marketing)/usluge/vr/konsultacija/inquiry-form.tsx:109` and `src/components/inquiry/project-inquiry-form.tsx:239`.

### Analytics env vars (`.env.example`)
`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_GA4_ENABLED=false`, `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_GTM_ENABLED=false`, `NEXT_PUBLIC_GTM_CONTAINER_ID`, `GOOGLE_SITE_VERIFICATION`, `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN`, `POSTHOG_DASHBOARD_URL`, `SENTRY_DASHBOARD_URL`. LinkedIn partner ID is hardcoded (not env).

---

## 3. Images

### `public/` inventory (360 files total)
- Extensions: **306 `.webp`, 21 `.jpg`, 14 `.png`, 11 `.mp4`, 5 `.svg`, 1 `.pdf`, 1 `.css`, 1 `.js`.**
- Top level: `og-image.jpg`, plus Next.js scaffold SVGs (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` — removable).
- **`public/artwork/`** (215 files) — main marketing imagery. **Serbian/English-mixed slug filenames** that appear in code and matter for SEO renaming:
  - `ai-tool-*-{before,after,object}.webp` (18 files, e.g. `ai-tool-virtual_staging-before.webp`, `ai-tool-day_to_dusk-after.webp`).
  - `cene-card-*.webp` + `cene-card-animacija.mp4` (pricing cards, Serbian: enterijer/eksterijer/planovi/opremanje-renovacija).
  - `detail-*.webp` (service detail heroes, mixed slugs: `detail-dan-u-noc-{before,after}.webp`, `detail-fotomontaza-*.webp`, `detail-3d-situacioni.webp`, `detail-interior-360.webp`).
  - `elegant-render-*` (hero/services/triptych, e.g. `elegant-render-hero-interior.webp`, `elegant-render-services-triptych-{1..4}.webp`, `elegant-render-services-before-after-grid.webp`) — referenced in `sitemap.ts`.
  - `blog-*.webp`, `360-eksterijer-panorama-vr.jpg`.
  - Videos in artwork root: `arhitektonska-animacija-demo.mp4` (+ `.webp` poster), `cene-card-animacija.mp4`, `listing-animation.mp4`.
  - `public/artwork/portfolio/` (95 files) — `360-NN.webp` + `360-NN-full.jpg` pairs, portfolio grid images.
  - `public/artwork/_tablica-originals/` (18 files) — `tablica-*.webp` source images for the service table.
- **`public/branding/`** (5): `elegant-render-logo-with-padding.png` (referenced in Organization JSON-LD logo), `icon-192.png`, `icon-512.png` (manifest), `white-rook-symbol.png`, `powered-by-whiterook.webp`.
- **`public/branding/payments/`** (10) — **CARD-SCHEME LOGOS, Serbia/Banca-Intesa-specific, all to be REMOVED/replaced by PayPal marks:** `visa.png`, `mastercard.png`, `maestro.png`, `dinacard.png`, `amex.png`, `banca-intesa.png`, `visa-secure.png`, `mastercard-id-check.png`, `dinacard-secure.png`, `amex-safekey.png`.
- **`public/legal/`** (2): `tuv-rheinland-certified.webp` + `.pdf` (ISO certification badge — real cert, likely keep).
- **`public/styles/`** (7): design-style thumbnails (`scandinavian.webp`, `mid-century.webp`, `primorski.webp`, etc.).
- **`public/vendor/pannellum/`** (2): `pannellum.js` + `.css` — 360° panorama viewer library (self-hosted).

### next/image usage & CDN
- `next/image` (`<Image>`) used widely; remote host allow-list is only `d2xsxph8kpxj0f.cloudfront.net` (`next.config.ts`). Cloudfront URL hardcoded in `src/lib/catalog/services.ts:255` (a portfolio image) — the CDN serves portfolio/AI-generated imagery.
- Image filenames are hardcoded in: `src/app/sitemap.ts` (many `/artwork/*`), `src/lib/catalog/services.ts` (service `listingAsset`/`detailAsset`/`beforeAsset`/`afterAsset` fields), `src/lib/content/site.ts` (`badgeAsset`, logo), `src/lib/portfolio-gallery.ts`, AI-studio catalog, and `CERTIFIER.badgeAsset`. **Renaming assets for EN SEO requires coordinated edits across these.**

### Supabase storage (user uploads) vs static assets
- Static assets → `public/` + Cloudfront. **User uploads → Supabase Storage**, bucket **`order-files`** (`UPLOADS_BUCKET = "order-files"` in `src/lib/file-scan.ts:37`).
- `src/lib/supabase.ts` → `getSupabaseAdmin()` (service-role, bypasses RLS). Env: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Used by `api/checkout/upload-url`, `api/portal/download`, `api/inquiries/upload-url`, `api/ai-studio/*`, and outbox (downloads invoice/proforma PDFs). Order files/AI-studio references are downloaded and portal links posted to Bitrix timeline (§5).

---

## 4. Legal pages (`src/app/(marketing)/pravno/`)

Directory has **6 pages** (one consolidated + five standalone). `NAV_LEGAL` in `src/lib/content/site.ts` lists 8 entries but 3 point at redirect stubs (`/pravno/privatnost`, `/pravno/uslovi`, `/pravno/povracaj-sredstava` → 307 to anchors on the consolidated page per `next.config.ts`).

1. **`uslovi-koriscenja/page.tsx`** (845 lines) — **the consolidated master doc**, three `<section>` anchors:
   - `#uslovi` "Opšti uslovi korišćenja" (Terms) — 14 `LegalSection`s. **§1 Pružalac usluga** (White Rook DOO identity), §4 Cene i plaćanje, **§8 Pravo na odustanak** cites *Zakon o zaštiti potrošača Srbije čl. 28* + *EU Directive 2011/83 čl. 16(m)* (digital-services withdrawal waiver), §9 Reklamacije (8-day rule), §14 Nadležnost — Serbian courts + mandatory EU consumer rules + EU ODR platform link.
   - `#privatnost` "Politika privatnosti" (Privacy) — 10 sections, **dual ZZPL (Serbian data-protection law) + GDPR** citations throughout; §4 Obrađivači/prenos (processors incl. Supabase, Resend, PostHog, Sentry, Bitrix, etc.), §7 "Predstavnik u EU (čl. 27 GDPR)" — *EU representative appointment "in progress"*.
   - `#povracaj` "Politika povraćaja sredstava" (Refunds) — **§2 Način povraćaja: "Plaćanje karticom (Banca Intesa Nestpay) → povraćaj se inicira kroz Merchant Center Banca Intesa AD Beograd"; §3 clearing in RSD by Banca Intesa AD Beograd, issuer FX on refund. ALL card/Nestpay/Banca-Intesa/RSD-specific — rewrite for PayPal refunds/EUR.**
   - `LegalSection` helper component at bottom.
2. **`kolacici/page.tsx`** (381 lines) — Cookie policy. Cookie tables by category; names the vendors: PostHog, GA4/GTM, Sentry, LinkedIn Insight. GDPR/ePrivacy-oriented; ties to consent banner. Largely portable (drop DinaCard/Nestpay-related if any).
3. **`impressum/page.tsx`** (168 lines) — Legal imprint per *Zakon o elektronskoj trgovini čl. 7*. Registration data (APR registry link via `registryNumber`), "Predstavnik u EU (čl. 27 GDPR) — u toku". **"Nadzorni organi": Ministarstvo trgovine (e-commerce) + Poverenik (poverenik.rs, Serbian DPA). Serbia-specific supervisory bodies — swap for EU/host-country equivalents.**
4. **`reklamacije/page.tsx`** (135 lines) — Complaints policy. Cites *Zakon o zaštiti potrošača čl. 55–58, čl. 56 st. 8* (8-day written response), §2 mentions card-paid transactions, escalation to "Ministarstvu nadležnom za zaštitu potrošača Republike Srbije". **Serbian consumer-law-specific.**
5. **`dostava/page.tsx`** (125 lines) — "Dostava digitalnih isporuka" (digital delivery — no physical goods). Bank-neutral; portable.
6. **`sertifikati/page.tsx`** (159 lines) — ISO certificates page (TÜV Rheinland ISO 9001/27001/50001), uses `CERTIFIER`/`ISO_CERTIFICATIONS` from site.ts. Portable.

### Footer/header compliance elements (Banca Intesa)
- **`src/components/site/site-footer.tsx`** — mounts:
  - **`<PaymentTrustBadges />`** in a "Sigurno plaćanje" strip. Comment explicitly: *"Banca Intesa EPM standards (poglavlje 2.2) require these brand badges on the checkout footer."* **Bank-mandated — to be removed for the EN/PayPal build.**
  - Certificates strip (TÜV badge + ISO codes) → `/pravno/sertifikati`.
  - Imprint line (*Zakon o elektronskoj trgovini čl. 7*): `IMPRINT.shortName · address · MB · PIB` on every page. **Serbia-specific.**
  - `NAV_LEGAL` link column, `ConsentSettingsLink` (reopens banner), copyright.
- **`src/components/marketing/payment-trust-badges.tsx`** — `PaymentTrustBadges` renders 3 groups per **"Banca Intesa EPM v3.5 §2.2"**: acceptance marks (Visa/Mastercard/Maestro/DinaCard/Amex), center **Banca Intesa** issuer logo (links `bancaintesa.rs`), 3D-Secure programme marks (Visa Secure / Mastercard ID Check / DinaCard Secure / Amex SafeKey, each linking to Serbian scheme pages). **Entire component is Banca-Intesa/NestPay-certification-specific — replace with PayPal acceptance marks or delete.**
- Also relevant: `src/components/marketing/nestpay-receipt.tsx` (Nestpay receipt UI, referenced by success/failure pages).

### Company/bank legal data — `src/lib/content/site.ts` → `IMPRINT`
- `legalName`, `shortName` "White Rook DOO", street `JNA 25`, `26210 Kovačica, Srbija`, PIB `110339214`, MB `21339393`, activity code `7410`, `euRepresentative: null`. **`IMPRINT.bank`** = Banca Intesa AD Beograd, placeholder IBAN, SWIFT `DBDBRSBG`, domestic RSD account — lands on proforma PDFs. **Serbia/RSD/bank-specific.**

---

## 5. Bitrix24 integration (SURVIVES the migration)

### Client — `src/lib/bitrix24/client.ts`
- `bitrixCall<T>(method, params, meta?)` — inbound-webhook REST client. `WEBHOOK_URL = process.env.BITRIX24_WEBHOOK_URL`. Rate-limited to 2 req/s (500ms), retries on 429/503 (3×, linear backoff). Logs every call to `prisma.bitrixSyncLog` (entityType/entityId/direction/method/bitrixId/success/error). Throws on `body.error`.

### Stage mapping — `src/lib/bitrix24/stage-map.ts`
- `ORDER_STATUS_TO_STAGE` maps 10 `OrderStatus` values → env vars: `BITRIX24_STAGE_DRAFT`, `_AWAITING_PAYMENT`, `_PAID`, `_IN_PROGRESS`, `_IN_REVIEW`, `_REVISION_REQUESTED`, `_DELIVERED`, `_CLOSED`, `_CANCELLED`, `_REFUNDED`. `orderStatusToStage()` / `stageToOrderStatus()` (bidirectional).

### Types — `src/lib/bitrix24/types.ts`
- `BitrixDeal`, `BitrixContact`, `BitrixTimelineComment`.

### Sync modules — `src/server/bitrix/`
- **`sync-contact.ts`** → `syncContact(userId)` — `crm.contact.add`, caches `user.bitrixContactId`. Called by sync-deal.
- **`sync-deal.ts`** → `syncNewDeal(orderId)` — ensures contact, `crm.deal.add` with `CATEGORY_ID = BITRIX24_PIPELINE_ID`, stage, `OPPORTUNITY = premiumTotalRsd ?? totalRsd`, **`CURRENCY_ID: "RSD"`** (hardcoded — change to EUR), COMMENTS with portal link + line items (`totalRsd.toLocaleString("sr-Latn-RS") ... RSD`). Stores `order.bitrix24DealId`. Skips if no service items or already synced.
- **`sync-status.ts`** → `syncDealStatus(orderId, status)` — `crm.deal.update` STAGE_ID. **Triggered from `src/lib/order/status-machine.ts:52`** on every transition (fire-and-forget `.catch`), skipped when transition source is `"bitrix24"` (echo-loop guard).
- **`sync-comment.ts`** → `syncCommentToDeal(commentId)` — `crm.timeline.comment.add`, `[Tim]`/`[Klijent]` prefix (Serbian), caches `bitrix24CommentId`.
- **`sync-file.ts`** → `syncFileToDeal(fileId)` — timeline comment with portal download link (`AUTH_URL/api/portal/download?...`), Serbian kind labels (Isporuka/Revizija/Materijal), caches `bitrix24FileId`.
- **`sync-project-inquiry.ts`** → `syncProjectInquiryLead(inquiryId)` — `crm.lead.add` (`SOURCE_ID:"WEB"`, `STATUS_ID:"NEW"`), Serbian COMMENTS block (Izvor/Budžet/Rok/Fajlovi/Snapshot ponude), persists `bitrixLeadId`/`bitrixSyncError`. Best-effort; failures stored for admin retry.
- **`inbound.ts`** → `handleDealUpdate(dealId)` — fetches deal, `stageToOrderStatus`, calls `transitionOrder(..., source="bitrix24")` to avoid echo. Serbian note "Status ažuriran iz Bitrix24".
- **`reconcile.ts`** → `reconcileAllOrders()` — nightly: detects stage drift (logs to BitrixSyncLog, direction `"reconciliation"`) + retries unsynced paid+ orders via `syncNewDeal`.

### Trigger points (all fire-and-forget `.catch`, NOT via outbox)
- `syncNewDeal` — `src/server/actions/order.ts:249` (order creation); retried in `reconcile.ts:74`.
- `syncFileToDeal` — `src/server/actions/order.ts:470`, `src/server/actions/admin.ts:119`.
- `syncCommentToDeal` — `src/server/actions/comment.ts:45`, `src/server/actions/admin.ts:48`.
- `syncDealStatus` — `src/lib/order/status-machine.ts:52`.
- `syncProjectInquiryLead` — `src/server/actions/project-inquiry.ts:267` (submit), `:350` (admin retry).
- `handleDealUpdate` — inbound webhook route (below).
- `reconcileAllOrders` — cron route (below).

### Inbound webhook — `src/app/api/webhooks/bitrix24/route.ts`
- `POST` handler. **Auth via query-string `?secret=` compared to `BITRIX24_OUTBOUND_SECRET`** using `timingSafeEquals` (Bitrix outbound webhooks can't send custom headers — noted in Serbian comment). Handles `ONCRMDEALUPDATE`/`onCrmDealUpdate` → `handleDealUpdate`. Always returns 200 (prevents Bitrix retry storms); errors → Sentry.

### CRON auth — `src/lib/cron-auth.ts`
- `timingSafeEquals(a,b)`, `isAuthorizedCronRequest(request)` — fail-closed: requires `process.env.CRON_SECRET`, checks `Authorization: Bearer ${CRON_SECRET}`. **Comment notes `api/cron/nestpay-reconcile` deliberately does NOT use this (payment zone frozen for bank retest).**

### Bitrix reconcile cron — `src/app/api/cron/bitrix-reconcile/route.ts`
- `GET`, guarded by `isAuthorizedCronRequest`, wrapped in `Sentry.withMonitor("bitrix-reconcile")`. Schedule `0 3 * * *`.

### Prisma fields backing Bitrix (`prisma/schema.prisma`)
- `User.bitrixContactId @unique` (l.24), `Order.bitrix24DealId @unique` (l.228), `OrderFile.bitrix24FileId` (l.401), `OrderComment.bitrix24CommentId @unique` (l.444), `ProjectInquiry.bitrixLeadId @unique` (l.755) + `bitrixSyncError`/`bitrixSyncedAt`. Model `BitrixSyncLog` (`src/generated/prisma/models/BitrixSyncLog.ts`).

### Bitrix env vars (`.env.example` lines 56–69)
`BITRIX24_WEBHOOK_URL`, `BITRIX24_OUTBOUND_SECRET`, `BITRIX24_PIPELINE_ID=3`, `BITRIX24_STAGE_*` (10 stages, format `C3:NEW` etc.), `CRON_SECRET`. **Bitrix survives unchanged except: `CURRENCY_ID:"RSD"` in sync-deal → EUR, and Serbian comment/label strings → English.**

---

## 6. Deployment & routing config

- **`vercel.json`** — 5 crons: `/api/cron/bitrix-reconcile` (`0 3 * * *`), `/api/cron/quote-cleanup` (`30 3 * * *`), `/api/cron/outbox-processor` (`* * * * *`, every minute), `/api/cron/invoice-reconcile` (`15 4 * * *`), **`/api/cron/nestpay-reconcile` (`*/5 * * * *`)** — the last is Nestpay-specific; PayPal will need its own reconcile cron or removal. All cron route files exist under `src/app/api/cron/`.
- **`src/proxy.ts`** — Next.js 16 "proxy" (middleware replacement). `proxy(request)` protects `/portal/*`: checks Auth.js session cookie (`authjs.session-token` / `__Secure-authjs.session-token`), redirects unauth to **`/prijava`** (Serbian login route) with `callbackUrl`. `config.matcher = ["/portal/:path*"]`. **Serbian route names.**
- **`.github/workflows/`**:
  - `ci.yml` — on push(main)/PR/dispatch: `npm ci` (postinstall `prisma generate`) → `tsc --noEmit` → `npm run lint` (non-blocking) → `npm test` → **`scripts/nestpay-hash-test.ts`** (NestPay hash sanity — Nestpay-specific, replace with PayPal check). No `next build` in CI (Vercel does it).
  - `verify-pricing.yml` — pricing verification workflow.
- Sentry monitoring wired via `withSentryConfig` + `Sentry.withMonitor` in cron routes; `tunnelRoute: "/monitoring"`.

---

## Migration flags summary (Serbia/RSD/bank-specific in my areas)

- **Currency `RSD` hardcoded** in: `seo.ts` (Offer/OfferCatalog JSON-LD), `site.ts` Organization (`currenciesAccepted`/`priceRange`), `google-data-layer.ts` + `google-conversions.ts` (`GoogleConversionCurrency="RSD"`, all dataLayer events), `posthog-events.ts` (`*_rsd` props), `sync-deal.ts` (`CURRENCY_ID:"RSD"`), `outbox.ts` `formatOutboxMoney` (`sr-Latn-RS ... RSD`). → EUR + PayPal-supported display currency.
- **Bank/card-scheme surfaces to remove/replace with PayPal:** `payment-trust-badges.tsx`, `public/branding/payments/*` (10 logos), footer "Sigurno plaćanje" strip, refund policy §2–3 (Banca Intesa Nestpay/Merchant Center/RSD clearing), `IMPRINT.bank` (Banca Intesa account), `nestpay-receipt.tsx`, `nestpay-reconcile` cron, `nestpay-hash-test.ts` CI step, provider enums `"card_mock"|"nestpay"` in posthog-events + google-conversions.
- **Serbian consumer-law / DPA specifics to adapt for EU:** impressum "Nadzorni organi" (Ministarstvo trgovine + Poverenik), reklamacije (ZZPP čl. 55–58, 8-day rule), Zakon o elektronskoj trgovini čl. 7 imprint, ZZPL citations in privacy (keep GDPR, add host-country DPA), `euRepresentative: null` / "u toku" (must be appointed for EU-facing business), EU ODR link (kept).
- **hreflang/locale:** `SEO.htmlLang="sr-Latn"`, `locale="sr_RS"`, `buildLanguageAlternates` (only `sr-*`), `<html lang>`, `latin-ext` font subsets, Serbian keywords, `llms.txt` content → all → English/EU.
- **Serbian slugs everywhere** (routes, redirects, robots PRIVATE_PATHS, proxy `/prijava`, image filenames, `NAV_MAIN`/`NAV_LEGAL`) — full translation pass.
- **Hardcoded prod domain/emails:** `DEFAULT_SITE_URL="https://elegantrender.rs"` (`site.ts`), `noreply@`/`info@elegantrender.rs` (`email.ts`, error pages), Cloudfront host (`next.config.ts` + `services.ts:255`), LinkedIn partner ID `9178042`, GTM fallback `GTM-5X2MCQ87`. `NEXT_PUBLIC_SITE_URL` env overrides site URL.
- **Bitrix24 = KEEP** (only `CURRENCY_ID` + Serbian strings change). Inbound webhook auth is query-string secret; stage IDs are env-driven so a fresh Bitrix pipeline just needs new env values.
