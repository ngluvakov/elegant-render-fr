# DESIGN DOCUMENT — Translation, SEO, Legal-EU, Image Renaming, Design-System Application
Target: new repo at `S:\Elegant render english`, cloned from `C:/Users/ngluv/Desktop/Platform`. All source paths below are repo-relative unless absolute.

---

## 0. MASTER SEQUENCE & OWNERSHIP (the collision-free spine)

The three sweeps that touch "everything" (route strings, image paths, design tokens) are done **serially by Claude in Phase 0, before Codex writes a single line**. After Phase 0, ownership is split **by file path, never by concern**, so no file has two owners.

| Phase | Owner | Work | Why this order |
|---|---|---|---|
| **0.1** | Claude | Route folder renames + global route-string sweep (one commit) | 476 occurrences across 148 files — must be atomic; everything downstream references new paths |
| **0.2** | Claude | Image rename via manifest script (one commit) — see §4.4 | Rewrites 244 refs in 11 files incl. `services.ts`, which Codex translates next; renaming first means Codex never touches paths |
| **0.3** | Claude | Config-ID rename sweep: `jutro/podne/prolece/primorski`, `ServiceCategory` union keys, service slugs (one commit) | Fresh DB = safe now (see §2.2); tsc-verified; must precede both translation and design work |
| **0.4** | Claude | `globals.css` token swap + `layout.tsx` font swap (one commit) | After this, "most components restyle themselves" (handoff README); Codex then translates already-restyled files without style churn |
| **1 (parallel)** | **Claude** | `src/lib/content/site.ts`, `src/components/marketing/**`, `src/components/site/**`, `src/app/(marketing)/page.tsx`, homepage rebuild, before/after slider, `seo.ts`/`sitemap.ts`/`robots.ts`/`manifest.ts`/`llms.ts`, consent banner EN, analytics files, all `(marketing)/legal/**` pages, `not-found.tsx` | Design + copy travel together in components Claude rebuilds; site.ts holds handoff-final copy + IMPRINT (legal) + JSON-LD (SEO) — all Claude areas |
| **1 (parallel)** | **Codex** | `src/lib/catalog/services.ts` (copy fields only), `configurator.ts` + all `*-config.ts` (labels/descriptions), `src/lib/email.ts`, `invoice-pdf.tsx`/`proforma-pdf.tsx`, `src/lib/chat/**` (+ `:::predlog`→`:::proposal` incl. `src/components/chat/chat-messages.tsx` parser), `src/components/portal/**` copy + `status-utils.ts`, `src/lib/order/activity-timeline.ts`, `buyer-validation.ts` + server-action strings, `src/app/portal/**` page copy, `src/app/(auth)/**` form copy | Pure copy layers, disjoint from Claude's Phase-1 file set |
| **2 (serial, after Codex portal merge)** | Claude | Portal design grep-sweep (`rounded-2xl/3xl`, warm shadows, `tracking-[0.2em]`, `orbit-glow`/`sidebar-attention-pulse`/`grain-soft` class usages, `SectionKicker` verify), portal dark sidebar verification, page-vs-screenshot diff | These sweeps touch the same portal files Codex translates; sequencing them after avoids the only real overlap |
| **2** | Both | Grep gates (§6) + `tsc --noEmit` + manual screenshot diff | Definition of done |

**Hard boundary list (write in the new repo's CLAUDE.md):** Codex never touches `src/components/marketing/**`, `src/components/site/**`, `src/lib/content/site.ts`, `src/lib/seo.ts`, `src/app/(marketing)/legal/**`, `globals.css`, `layout.tsx`, `sitemap/robots/manifest/llms`. Claude (this workstream) never touches `src/lib/email.ts`, `src/lib/chat/**`, `*-pdf.tsx`, `src/lib/catalog/*` copy fields, `src/components/portal/**` during Phase 1. Payment files (`step-payment`, `paypal.ts`, `billing.ts`, `display-currency.ts`, `posthog-events.ts` currency props, `google-conversions.ts` provider enum) belong to the separate payments workstream — this plan only *names* the EUR values they must emit.

---

## 1. ROUTE RENAMES (Phase 0.1)

### 1.1 Adopted slug table (report-i18n §7, confirmed with two adjustments)
- **Marketing:** `cene`→`pricing` · `poruci`→`checkout` (decision: "checkout" over "order" — the portal already has `orders`, avoids `/order` vs `/portal/orders` confusion) · `poruci/uspeh`→`checkout/success` · `poruci/neuspeh`→`checkout/failure` · `usluge`→`services` · `usluge/vr/konsultacija`→`services/vr/consultation` · `o-nama`→`about` · `kontakt`→`contact` · `cesto-postavljana-pitanja`→`faq` · `pravno`→`legal` (page set in §3) · keep `ai-studio`, `blog`, `portfolio`.
- **Auth:** `prijava`→`login`, `registracija`→`register`, `verifikacija`→`verify-email`, `zaboravljena-lozinka`→`forgot-password`, `nova-lozinka`→`reset-password`, `portal-pristup`→`portal-access`.
- **Portal:** `porudzbine`→`orders`, `nova-porudzbina`→`new-order`, `finansije`→`finance` (decision: one 1:1 token `finansije→finance` everywhere, customer and admin, so the sweep stays mechanical), `profil`→`profile`, `ai-kreacije`→`ai-creations`, `ai-studio/krediti`→`ai-studio/credits`.
- **Admin:** `upiti`→`inquiries`, `vr-upiti`→`vr-inquiries`, `korisnici`→`users`, `finansije/cenovnik`→`finance/pricebook`, `finansije/izvoz`→`finance/export`, `analitika`→`analytics`, `revizije`→`revisions`.
- **API:** `admin/finansije`→`admin/finance`; `nestpay/*`→`paypal/*` is the payments workstream's rename — coordinate only the timing (do it in their Phase 0 equivalent).
- **Service detail slugs** (data, in `services.ts` — renamed in Phase 0.3 with the ID sweep, listed here because they are routes): `unutrasnji-renderi`→`interior-renders`, `render-enterijera`→`interior-render` (verify vs parent — may be a variant page), `360-tura-enterijera`→`interior-360-tour`, `spoljasnji-renderi`→`exterior-renders`, `360-eksterijer`→`exterior-360`, `3d-prikaz-ulice`→`3d-streetscape`, `virtuelno-opremanje`→`virtual-staging`, `virtuelna-renovacija`→`virtual-renovation`, `2d-i-3d-osnove`→`2d-3d-floor-plans`, `2d-osnove`→`2d-floor-plans`, `3d-osnove`→`3d-floor-plans`, `vr-tura`→`vr-tour`, `arhitektonska-animacija`→`architectural-animation`, `uredjenje-pejzaza`→`landscape-design`, `render-u-stvarnoj-fotografiji`→`photomontage`, `situacioni-planovi`→`site-plans`, `dnevni-u-nocni-prikaz`→`day-to-dusk`, `uklanjanje-predmeta`→`item-removal`. Blog slugs in `src/lib/content/blog.ts` get the same treatment.

### 1.2 Every place route strings are referenced (the atomicity checklist)
Verified by grep — 476 occurrences / 148 files. The sweep = folder `git mv` + ordered find-replace of the longest tokens first (`cesto-postavljana-pitanja` before `cene`), then targeted review of:
1. `src/proxy.ts` — `/prijava` redirect target + matcher (matcher is `/portal/:path*`, unchanged).
2. `src/lib/auth.ts` — Auth.js `pages` config (3 hits: signIn etc.).
3. `src/app/robots.ts` — `PRIVATE_PATHS` (7 Serbian paths → `/checkout`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/portal-access`, keep `/portal`, `/api`, `/monitoring`).
4. `src/app/sitemap.ts` — 17 route hits + 16 image hits.
5. `next.config.ts` `redirects()` — **delete all 13 permanent + 3 temporary Serbian redirects** (fresh domain, nothing to preserve). Keep headers/Sentry wrap.
6. `src/lib/content/site.ts` — `NAV_MAIN`/`NAV_LEGAL` (15 hits) — also fix the pre-existing bug: `NAV_LEGAL` links `/pravno/privatnost`, `/pravno/uslovi`, `/pravno/povracaj-sredstava` which have no folders; the new `NAV_LEGAL` must match the real §3 page set exactly.
7. `callbackUrl` usages: `(auth)/prijava/sign-in-form.tsx`, `registracija/sign-up-form.tsx`, `components/auth/google-sign-in-button.tsx`, `components/site/site-header.tsx`, `components/portal/portal-sidebar.tsx` (12 hits), `portal-topbar.tsx`.
8. `revalidatePath()` calls in `src/server/actions/*` — biggest: `item-config.ts` (21), `order.ts` (8), `profile.ts` (6), `finance.ts` (5), `admin.ts` (5), `admin-charges.ts` (4), `ai-studio.ts` (4).
9. Link-emitting content: `src/lib/email.ts` (9), `src/lib/chat/system-prompt.ts` (16), `guide-tips.ts` (8), `src/lib/llms.ts` (15), `src/lib/catalog/customer-groups.ts` (8), `configurator-href.ts` (4), `calculate.ts` (3), `components/chat/chat-messages.tsx` deep-links to `/cene` (2), `upsell-helpers.ts`, `src/lib/content/blog.ts` (10).
10. Bitrix comment links: `src/server/bitrix/sync-deal.ts`, `sync-project-inquiry.ts` (portal links).
11. `src/app/globals.css` (1 hit — a route-scoped selector; verify), `not-found.tsx`, `consent-banner.tsx` (links `/pravno/kolacici` → `/legal/cookies`).

**Verification gate:** `grep -rE "prijava|poruci|usluge|pravno|cene\b|o-nama|kontakt|porudzbine|finansije|upiti|korisnici|analitika|revizije|cenovnik|izvoz|krediti|profil" src/` returns zero route-string hits (Serbian *copy* still matches at this point — restrict the gate to quoted `/`-prefixed strings), plus `tsc --noEmit`.

---

## 2. COPY TRANSLATION STRATEGY

### 2.1 Layer order (Codex, Phase 1 — dependency-driven)
1. **`src/lib/catalog/services.ts`** — copy fields only (`name/tagline/description/highlight/materials/priceLabel/unitLabel/included/addOns/note/decomposition`, `buildServiceImageAlt`/`buildServiceImageCaption` at ~L2779/2806). Slugs/paths already done in Phase 0.
2. **`configurator.ts` + 14 `*-config.ts`** — `label/sectionLabel/description/includes/disclaimers/consumes[].reason`. IDs already English (Phase 0.3).
3. **`src/lib/email.ts`** — all ~15 templates; `FROM`/`ADMIN_NOTIFY` → `noreply@`/`info@elegantrender.com`; the two Nestpay bank-receipt emails are **rewritten by the payments workstream** (PayPal confirmation), Codex translates the other 13.
4. **PDFs** — `invoice-pdf.tsx` (promote the existing English `company_foreign` STRINGS table to the base; keep buyer-type branching for the payments/VAT workstream), `proforma-pdf.tsx`, `invoice-data.ts` labels. Locale `sr-Latn-RS`→`en-GB` everywhere (`toLocaleDateString`, `Intl.NumberFormat`).
5. **Chatbot** — `src/lib/chat/system-prompt.ts`: translate `BASE_SYSTEM_INSTRUCTIONS`, flip "Odgovaraj UVEK na srpskom" → always English, re-write embedded price examples in EUR; **rename `:::predlog`→`:::proposal`** (keys `primary/related/note` are already English) in the prompt AND the parser in `src/components/chat/chat-messages.tsx` (the only parser file); `guide-context.ts`, `guide-tips.ts`, the three `*-guide-context.tsx` providers.
6. **Portal/admin** — `src/components/portal/*` (48 files), `src/app/portal/**` page copy, `status-utils.ts` (`STATUS_LABELS/STATUS_STEPS/STATUS_GUIDANCE` — enum keys unchanged).
7. **Validation & server messages** — `buyer-validation.ts` (coordinate: the payments workstream re-models PIB/MB→EU VAT; Codex translates whatever field set lands), inline errors in `src/server/actions/*`.
8. **`src/lib/order/activity-timeline.ts`** + Bitrix human strings (`[Tim]/[Klijent]` prefixes, "Stavke:/Napomena:" in `sync-deal.ts`, kind labels in `sync-file.ts`, "Status ažuriran iz Bitrix24" in `inbound.ts`) — translate strings only, logic untouched.
9. **Meta:** `TESTING.md`, CI comments, `.claude/agents/*` prompts (infra workstream may own; list here for completeness).

### 2.2 Config-ID decision: **RENAME NOW** (Phase 0.3, Claude)
`TIMES_OF_DAY` {jutro→morning, podne→midday, popodne→afternoon, vece→evening, noc→night}, `SEASONS` {prolece→spring, leto→summer, jesen→autumn, zima→winter}, `ROOM_STYLES` `primorski`→`coastal` (+ rename `public/styles/primorski.webp`→`coastal.webp` in the image manifest), `ServiceCategory` union {eksterijer→exterior, enterijer→interior, planovi→plans, animacije→animations, transformacija→transformation}. Rationale: they land in `OrderItem.configJson`; a fresh Supabase DB means zero data migration — this is the only moment renaming is free. TS unions make the sweep compiler-verified; also update `scripts/verify-*.ts` assertions and any chat-prompt examples referencing them. IDs become permanent English enum-like values; **never translate labels via IDs again**.

### 2.3 Tone / terminology glossary (put in `docs/copy-glossary.md`, both agents follow it)
From Brand Guidelines §08 + handoff copy: sentence case everywhere (headings, buttons, nav); numerals stay numeric ("€169", "3–5 working days", "4K"); no exclamation marks, no sales-speak ("a price — not a sales call" register). Canonical terms: **render** (n., deliverable), **architectural visualization** (category), **virtual staging**, **virtual renovation**, **day-to-dusk**, **photomontage** (render in a real photo), **floor plan** (2D/3D), **site plan**, **360° virtual tour**, **item removal**, **revision round**, **first drafts**, **estimate** (not "quote" in UI copy — matches handoff CTA "Get your estimate"), **working days**. Homepage/hero/model-first/services/process/FAQ/CTA/footer copy is **final in the handoff README + `Homepage.dc.html` — use verbatim, do not re-translate**.

---

## 3. LEGAL EU SET (Claude, Phase 1)

New tree `src/app/(marketing)/legal/`. Decision table (source = 6 `pravno/` pages):

| New page | Source | Treatment | Substantive changes |
|---|---|---|---|
| `legal/imprint` | `impressum/page.tsx` | **Rewrite** | Keep White Rook DOO identity (PIB/MB/APR); drop "Zakon o el. trgovini čl. 7" framing → generic EU e-commerce info duties; **supervisory bodies**: keep Serbian APR/Poverenik as home-country regulators, drop "Ministarstvo trgovine" consumer framing; **EU representative (GDPR art. 27): currently `euRepresentative: null` / "u toku" — BLOCKER-FLAG for owner**: an EU-targeting Serbian controller must appoint one before launch; render "EU representative: [pending appointment]" only as pre-launch placeholder |
| `legal/terms` | `uslovi-koriscenja` `#uslovi` (14 sections) | **Rewrite** | Governing law = Serbian law **plus** explicit Rome I art. 6 carve-out (EU consumers keep non-derogable local protections); replace ZZPP citations with Consumer Rights Directive 2011/83/EU; §4 payment terms → PayPal + EUR/local-currency display; **remove the EU ODR platform link — the ODR platform was discontinued in July 2025** — replace with ADR wording (willingness/non-obligation to participate in ADR per Directive 2013/11/EU) |
| `legal/privacy` | `#privatnost` anchor | **Rewrite as standalone page** | GDPR stays, **all ZZPL citations out**; controller in a third country (Serbia has no adequacy decision) → add international-transfer section (SCCs with processors; recommend choosing an **EU region for the new Supabase project** to shrink this); processor list refresh (add PayPal, drop Nestpay/Banca Intesa, drop LinkedIn if tag removed per §5); art. 27 rep cross-reference; named EU lead-DPA logic doesn't apply (no establishment) — data subjects may complain to any member-state DPA |
| `legal/cookies` | `kolacici/page.tsx` | **Straight translation + vendor edit** | Update vendor tables: keep PostHog/GA4/GTM/Sentry, add PayPal SDK cookies, remove LinkedIn Insight row (tag removed), remove any Nestpay rows; keep consent-banner tie-in (`er-consent` mechanism is GDPR-fine as-is) |
| `legal/refunds` | `#povracaj` anchor | **Rewrite** | Replace Banca Intesa Merchant Center/RSD-clearing text entirely: refunds issued **through PayPal to the original funding source, in the original transaction currency**; buyer's issuer/PayPal does any FX; typical timelines (PayPal balance instant–1 day, cards 3–5 business days up to statement cycle); partial refunds for partially delivered work; who bears FX/fee variance |
| `legal/withdrawal` | new (currently inside terms §8) | **New standalone page** | 14-day right of withdrawal (CRD), the **art. 16(m) digital-content waiver** (checkout `waiveWithdrawal` checkbox already exists — keep, link it here), and the **model withdrawal form (CRD Annex I(B))** which the current site lacks |
| `legal/complaints` | `reklamacije/page.tsx` | **Rewrite (keep the page)** | Drop ZZPP čl. 55–58 / 8-day statutory framing; keep a voluntary complaints procedure (response ≤ 14 days), escalation = ADR bodies / consumer's local authority; keeps parity with footer nav and trust value |
| `legal/delivery` | `dostava/page.tsx` | **Straight translation** | Digital delivery only; bank-neutral already |
| `legal/certificates` | `sertifikati/page.tsx` | **Straight translation** | TÜV/ISO content portable; keep `public/legal/tuv-rheinland-certified.*` |

Also: `IMPRINT` in `site.ts` — replace `IMPRINT.bank` (Banca Intesa IBAN/SWIFT) with White Rook's EUR account details (proforma PDFs consume it — coordinate with payments workstream on wire-transfer availability); footer imprint line loses the "Zakon o el. trgovini čl. 7" citation but keeps company · address · reg. numbers.

---

## 4. SEO PLAN (Claude, Phase 1)

### 4.1 `src/lib/seo.ts`
- `SEO`: `htmlLang: "en"`, `locale: "en_US"` (og:locale), drop `alternateLanguage: "sr-Latn-RS"`.
- `buildLanguageAlternates(path)` → `{ "en": canonical(.com), "x-default": canonical(.com), "sr": "https://elegantrender.rs" + srPathFor(path) }` — **cross-domain hreflang decision: add the `sr` link now with a small EN→SR path map (only for pages that exist on .rs), and flag for the owner that elegantrender.rs must add the reciprocal `en` link or Google ignores the pair (non-reciprocal is harmless, not harmful)**.
- `DISCOVERY_KEYWORDS` → English set (architectural visualization studio, 3D rendering services, virtual staging, real estate renders Europe, photorealistic interior renders, 360 virtual tour, floor plan rendering, day-to-dusk photo editing…).
- JSON-LD: `buildServiceJsonLd`/`buildOfferCatalogJsonLd` `priceCurrency: "EUR"` (4 hardcoded spots ~L399/409/457/473), offer-catalog description in English ("Base prices in EUR…" — VAT wording per payments-workstream decision), `areaServed` → `[{Country: per-EU list or "EU"}, "Worldwide"]`; in `site.ts` `buildOrganizationJsonLd`: `currenciesAccepted: "EUR"`, `priceRange: "€€"`, `areaServed: ["EU","GB","US","Worldwide"]`, `availableLanguage: "en"`, keep `hasCredential` ISO block.
- New `DEFAULT_OG_IMAGE`: produce a White-Rook-styled 1200×630 `public/og-image.jpg` (white canvas, Inter Tight headline, green accent) — flag as an asset-production task.

### 4.2 Route-metadata files
- `sitemap.ts`: English routes (incl. new `legal/*` set — fix the stale `/pravno/privatnost` entries bug), renamed image paths, `SERVICES` slugs auto-follow.
- `robots.ts`: PRIVATE_PATHS per §1.2; keep the AI_BOTS allow-list.
- `manifest.ts`: English name/description; `theme_color` `#b88363` → `#0a0a0a` (dark surface — matches header/footer identity; green as theme_color would violate the "no large green fills" rule); regenerate `icon-192/512` if the logo padding changes.
- `llms.txt`/`llms-full.txt` via `src/lib/llms.ts`: full English rewrite (services, EUR prices, new URLs).
- `layout.tsx`: `<html lang="en">`, drop `latin-ext` font subsets, `metadataBase` = `https://elegantrender.com` (via `NEXT_PUBLIC_SITE_URL`; change `DEFAULT_SITE_URL` fallback in `site.ts`), `GOOGLE_SITE_VERIFICATION` new env value.

### 4.3 GTM / GA4 / consent / Ads readiness
- New GTM container + GA4 property (env: `NEXT_PUBLIC_GTM_CONTAINER_ID`, `NEXT_PUBLIC_GTM_ENABLED=true`, GA4 stays disabled-direct per existing pattern); **change the hardcoded fallback `GTM-5X2MCQ87` in `google-tag-manager-post-launch.tsx`**.
- `src/lib/analytics/google-data-layer.ts`: `GoogleConversionCurrency = "EUR"` (all `er_begin_checkout`/`er_purchase`/`er_generate_lead` events); `src/server/analytics/google-conversions.ts`: currency EUR + `PurchaseConversionSource` gets `paypal_capture` (payments workstream owns the enum change; Claude owns the currency constant — agree the file is edited once, by payments, with the EUR value specified here).
- **Remove `LinkedInInsightTag`** (`src/components/analytics/linkedin-insight-tag.tsx` + mount in `layout.tsx`) — partner ID 9178042 is the .rs property's.
- Consent banner `src/components/site/consent-banner.tsx`: English copy (Cookies & privacy / Accept all / Necessary only / rows Necessary·Analytics·Marketing·Session recording), link → `/legal/cookies`. Mechanism (`er-consent`, Consent Mode v2) unchanged — already GDPR-correct.
- Google Ads readiness: port `docs/google-ads-gtm-conversions.md` runbook with EUR values; conversions map to the same `er_purchase`/`er_generate_lead` dataLayer events; Search Console + Bing new properties (env `GOOGLE_SEARCH_CONSOLE_URL` etc.).
- PostHog `*_rsd` event props → `*_eur`: **owned by payments workstream** (`posthog-events.ts` is currency-coupled); noted here so nobody assumes it's the SEO sweep.

### 4.4 Image rename — manifest-driven (Phase 0.2, Claude)
215 files in `public/artwork/` + 7 in `public/styles/`; 244 code refs in 11 files (`sitemap.ts`, `content/blog.ts`, `catalog/services.ts` (147), `customer-groups.ts`, `portfolio-gallery.ts`, `marketing/services-showcase.tsx`, `results-proof.tsx`, `configurator/service-tablica.tsx`, `ai-studio/page.tsx`, `usluge/page.tsx`, `cene/page.tsx`).
1. **Manifest** `docs/seo/artwork-rename-map.json`: `{ "old": "artwork/cene-card-enterijer.webp", "new": "artwork/pricing-card-interior-renders.webp" }` entries. Naming grammar: `{page|purpose}-{service-en}-{variant}.webp` — e.g. `detail-dan-u-noc-after.webp`→`detail-day-to-dusk-after.webp`, `expert-virtuelno-opremanje-naslovna-before.webp`→`expert-virtual-staging-hero-before.webp`, `arhitektonska-animacija-demo.mp4`→`architectural-animation-demo.mp4`, `problem-uredjenje-pejzaza-*.webp`→`problem-landscape-design-*.webp`, `360-eksterijer-panorama-vr.jpg`→`exterior-360-panorama-vr.jpg`, `blog-3d-vizuelizacija-duplex.webp`→`blog-3d-visualization-duplex.webp`, `styles/primorski.webp`→`styles/coastal.webp`. Already-English files (`listing-*`, `ai-tool-*`, `elegant-render-*`, `tablica-*`→rename `tablica`→`service-table`, portfolio `360-NN`) get entries only where Serbian tokens appear.
2. **Script** `scripts/rename-artwork.mjs`: reads manifest → `git mv` each file → literal string-replace of old→new across `src/**` and `docs/**` → **verify pass**: (a) re-grep for every old name = 0 hits; (b) extract every `/artwork/|/styles/` string from `src/**` and assert the file exists on disk. Run once, single commit, never again (manifest kept as the audit record).
3. Deletions in the same commit: `public/branding/payments/*` (10 card logos), Next scaffold SVGs (`file/globe/next/vercel/window.svg`). Additions: handoff `assets/er-logo-black.png`, `er-logo-white.png`, `wr-logo-horizontal-{black,white}.png`, `wr-icon-{black,white}.png` → `public/branding/`. `powered-by-whiterook.webp` becomes unused (header badge removed) — delete; footer uses `wr-logo-horizontal-white.png`.

### 4.5 SEO launch checklist (deliverable)
1. `<html lang="en">`; hreflang `en` + `x-default` (+ cross-domain `sr`, reciprocity flagged) on every indexable page. 2. All Serbian slugs gone from routes, sitemap, robots, NAV; no legacy redirects. 3. JSON-LD: Organization (EUR, areaServed, availableLanguage), Service/OfferCatalog (priceCurrency EUR), FAQ, HowTo, Breadcrumb re-validated in Rich Results Test. 4. New og-image; per-page OG/Twitter English. 5. Sitemap images = renamed files; zero broken `/artwork/` refs (script gate). 6. `manifest.ts` EN + new theme color. 7. `llms.txt`/`llms-full.txt` EN. 8. New GTM/GA4 IDs, Consent Mode v2 verified, EUR in all dataLayer events, LinkedIn removed. 9. Search Console + Bing verified, sitemap submitted. 10. English image alt/caption builders (`buildServiceImageAlt`) — Codex translates, Claude spot-checks. 11. 404 page EN. 12. `next.config.ts` remote patterns still valid (CloudFront host kept). 13. Lighthouse SEO pass on home/pricing/service-detail/legal.

---

## 5. DESIGN-SYSTEM APPLICATION (Claude)

- **Phase 0.4:** replace `src/app/globals.css` with `globals-international.css` (keep filename); `layout.tsx` fonts: Cormorant Garamond/Manrope → **Inter Tight** (400/500/600) for `--font-heading` + `--font-sans`, add **JetBrains Mono** (400/500) as `--font-mono` wired into `@theme`. Note for payments/PDF owner: `pdf-fonts.ts`/`outputFileTracingIncludes` (Noto Sans latin-ext) can drop latin-ext but PDFs keep their own font stack — out of scope here.
- **Phase 1:** homepage rebuild per `Homepage.dc.html` — section order preserved: sticky blur header (powered-by badge removed) → hero (`detail-interior-static.webp`, protection gradient, final copy) → spec strip → 3 intent columns (links `/pricing?group=…#configurator` via `configurator-href.ts` helpers) → **before/after slider** (new `src/components/marketing/before-after-slider.tsx`: range-input-driven clip, demo swipe on viewport entry 50→100→0→50, cursor tracking, touch=scroll-driven, reduced-motion=static 50 — per handoff CLAUDE.md non-negotiables; reusable to replace `before-after-showcase.tsx` and `detail-*-{before,after}` usages) → model-first (dark panel + 2×2 cards) → services cards → process → ISO strip → FAQ (`<details>`) → closing CTA → dark footer with `wr-logo-horizontal-white.png` attribution. Copy verbatim from handoff.
- Rebuild/restyle `src/components/site/site-header.tsx` + `site-footer.tsx` (remove `PaymentTrustBadges` strip — component deleted by payments workstream; footer legal column ↔ §3 set).
- **Phase 2 grep-sweeps** (after Codex's portal merge): `rounded-2xl|rounded-3xl` in `marketing/*` + `portal/*` (verify 4–8px), `shadow-[0_20px_55px|shadow-[0_30px_70px` → rest none/hover hairline, `sidebar-attention-pulse|orbit-glow|grain-soft` class usages removed, `tracking-[0.2em]|tracking-[0.28em]` → `font-mono tracking-[0.08em]`, `SectionKicker` verify. Portal sidebar dark (`--sidebar: #0a0a0a`, green active) — tokens already in the new CSS; verify `portal-sidebar.tsx` doesn't hardcode light colors. Final: diff every page against `screenshots/` (visual ground truth per handoff).

---

## 6. FINAL GATES
- Grep-zero gates: Serbian route tokens in quoted paths; old artwork filenames; `RSD|dinar|PDV` outside payments-owned files; `sr-Latn|sr-RS` locales; `predlog`; `linkedin|9178042`; `GTM-5X2MCQ87`; `elegantrender.rs` (except hreflang `sr` links); `pravno`.
- `tsc --noEmit`, `npm test`, `scripts/verify-pricing.ts` (EUR variant, payments-owned).
- Owner-decision flags raised by this plan: **(1)** EU representative (GDPR art. 27) must be appointed pre-launch; **(2)** reciprocal hreflang on elegantrender.rs; **(3)** EUR bank account for `IMPRINT.bank`/proforma; **(4)** new og-image asset production; **(5)** ODR link removed (platform discontinued 2025) — confirm ADR stance in terms.

### Critical Files for Implementation
- `C:/Users/ngluv/Desktop/Platform/src/lib/content/site.ts` — content spine: NAV, IMPRINT, FAQ, JSON-LD, homepage constants
- `C:/Users/ngluv/Desktop/Platform/src/lib/seo.ts` — hreflang/metadata/JSON-LD factory for the whole EN rework
- `C:/Users/ngluv/Desktop/Platform/src/lib/catalog/services.ts` — service slugs, 147 image refs, all service copy + alt-text builders
- `C:/Users/ngluv/Desktop/Platform/src/app/(marketing)/pravno/uslovi-koriscenja/page.tsx` — source of the terms/privacy/refunds rewrites
- `C:/Users/ngluv/AppData/Local/Temp/claude/s--Elegant-render-english/1faffc5d-6b7b-458d-b15c-5e6d71d0f519/scratchpad/rebrand/design_handoff_international_rebrand/globals-international.css` — production drop-in token layer (Phase 0.4)
