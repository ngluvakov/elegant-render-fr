# Elegant Render Platform — v1 Build Plan

> Versioned snapshot of the implementation plan. Canonical working copy lives in `C:\Users\ngluv\.claude\plans\twinkly-twirling-dolphin.md` during active planning sessions; this file is the repo-committed reference.

## 1. Product overview

**Elegant Render** is a B2C architectural visualization service — a sub-brand of **White Rook DOO** — selling:

- Renders (interior, exterior, aerial, landscape)
- 3D / 2D floor plans and site plans
- Architectural animations and 360° virtual tours
- Virtual staging and virtual renovation
- Photomontage, day-to-dusk, item removal

Target market: Serbian and ex-YU private clients, real-estate owners, small architects/designers, agencies.

Core brand promise: **transparent pricing, fast delivery, hand-crafted quality** — with a warm, approachable (not luxury) visual language.

Full brand book: [`docs/brand-book.md`](./brand-book.md).

## 2. What v1 must deliver

1. **Public marketing site** — home, services, pricing, portfolio, about, contact. Serbian Latin, single locale serving all ex-YU countries.
2. **Instant-price order flow** — client picks services, configures, uploads reference files (photos / PDFs, ~100 MB max), and pays online.
3. **Client portal** — signed-in dashboard with live order status, threaded messaging, revision file uploads, and deliverable downloads.
4. **Bitrix24 deep two-way sync** — the team's real workspace is Bitrix24; the app is the client-facing skin over it.

## 3. Stack and infrastructure decisions

| Area | Decision |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript + React 19 |
| Language / locales | Serbian Latin only, single locale, no i18n infra |
| Styling / UI | Tailwind CSS + shadcn/ui |
| Auth | Auth.js (NextAuth v5) — email + password (bcrypt) + Google OAuth |
| Database | Postgres on Supabase (via Prisma or Drizzle) |
| File storage | Supabase Storage, direct-to-storage signed uploads |
| Transactional email | Resend |
| Payments | Banca Intesa (Serbian bank card gateway) + PayPal, both behind an abstract `PaymentProvider` interface |
| Pricing | Hard-coded from White Rook price list in `src/lib/pricing/catalog.ts` (typed TS constants). Migration to DB-editable is a v1.1 task. |
| Admin / CRM | Bitrix24 with deep two-way sync (app is source of truth for user data; Bitrix24 is source of truth for status + team comments) |
| Hosting | Vercel for the Next.js app, Supabase for DB / auth helpers / storage |
| Fiscal invoicing (SEF eFaktura) | **Deferred** from v1; data model must stay pluggable so SEF can be added without schema rewrite. Pending accountant review. |
| Domain | **elegantrender.rs** |
| Timeline | No fixed deadline — phased rollout, ship when ready |

## 4. Architecture

```
Browser
  │
  ▼
┌────────────────────────────────────────────┐
│ Next.js 15 (App Router)                    │
│  - Marketing pages (RSC, mostly static)    │
│  - /poruci checkout flow (RSC + actions)   │
│  - /portal client dashboard (authed)       │
│  - /api/webhooks (Bitrix24, payments)      │
│  - Server Actions for mutations            │
└────────────────────────────────────────────┘
  │          │              │            │
  ▼          ▼              ▼            ▼
Supabase   Resend        Banca Intesa  Bitrix24
Postgres   email         + PayPal      REST API
Storage
Auth
```

### 4.1 Data model

- **`users`** — id, email, password_hash (nullable if Google-only), google_id, display_name, phone, locale, created_at
- **`orders`** — id, user_id, status, total_amount, currency, payment_provider, payment_status, payment_ref, bitrix24_deal_id, created_at, updated_at
- **`order_items`** — id, order_id, service_code, config_json, quantity, unit_price, subtotal
- **`order_files`** — id, order_id, kind (`source` \| `revision` \| `deliverable`), storage_path, filename, mime, size_bytes, uploaded_by_user_id, uploaded_at
- **`order_comments`** — id, order_id, author_type (`client` \| `team`), author_user_id (nullable for team-via-Bitrix), body, created_at
- **`order_status_events`** — id, order_id, from_status, to_status, note, created_by, created_at (audit trail, drives the tracker UI)
- **`bitrix_sync_log`** — id, entity_type, entity_id, direction, payload_hash, error, created_at (debug trail for sync issues)

### 4.2 Order status machine

```
draft → awaiting_payment → paid → in_progress
      → in_review → revision_requested → in_progress
      → delivered → closed

(terminal: cancelled, refunded)
```

Stored as an enum on `orders.status`; every transition logged to `order_status_events`.

## 5. Brand system (from brand book)

Codified as Tailwind theme tokens in `tailwind.config.ts` and CSS variables in `app/globals.css`:

**Colors**

| Token | Hex | Usage |
|---|---|---|
| `--coal` | `#1C1A19` | Logo, headings, body text |
| `--ivory` | `#F6F1EA` | Primary background |
| `--sand` | `#DCCFC2` | Sections, cards, muted backgrounds |
| `--clay` | `#B88363` | Buttons, accent highlights |
| `--sage` | `#8F9A8A` | Secondary accent, icons, tags |
| `--border-warm` | `#B9B0A7` | Delicate lines and frames |

**Typography**

- Headings: **Cormorant Garamond** (serif) via `next/font/google`
- Body / UI: **Manrope** (sans-serif) via `next/font/google`
- Scale: H1 56–72px • H2 36–48px • H3 24–28px • body 16–18px

**Hero slogan (locked):** `Lep prikaz. Jasna cena. Lakša odluka.`

Primitives live in `src/components/brand/` (`Logo`, `BrandButton`, `BrandCard`) to keep the visual system consistent.

## 6. Services catalog and pricing engine

All 14 services from brand book §7 are priced per White Rook's **Model-First Pricing** (Pillar 1) — see `docs/pricing/pillar-1-extracted.md` and the source PDF at `docs/pricing/WhiteRook_Pricing_Pillar1_EUR.pdf`.

Each service entry in `src/lib/pricing/catalog.ts` carries:

- Internal kebab-case code (e.g. `interior-rendering`)
- Serbian display name + category (Exterior / Interior / Plans / Animation / Tours / Staging / Renovation / Post-production)
- Short description
- Config schema (rooms, cameras, floors, seconds, unique layouts, style reference, …)
- Structured pricing: `basePrice`, `additionalItemPrice`, volume tiers, percentage surcharges
- "Outsourced" flag for partner-network items (2D plans, VR, day-to-dusk)
- Representative portfolio thumbnail

The calculator in `src/lib/pricing/calculate.ts` is a pure function that handles the non-trivial rules: tiered per-item pricing, volume thresholds, one-time percentage surcharges (Extended Model +25%), cross-category discounts (Active Rendering Project → 47% off animation), duration multipliers, progressive apartment-layout discounts, and same-room/same-property/volume scope axes for staging and renovation. Unit tests cover each rule.

**All projects include 3 revision rounds** (from the pricing PDF footnote) — this is the baseline for the portal rework flow in Phase 4.

**Team-determined pricing caveats** — some surcharges cannot be self-declared by the client and will be confirmed by the team during review:

| Surcharge | v1 handling |
|---|---|
| Extended Model Surcharge (+25%) | Disclaimer in checkout; applied on team review if the requested angle reveals unseen geometry |
| Active Rendering Project (47% off animation) | Looked up server-side from the logged-in user's open orders |
| Apartment Layout progressive discount | Client declares number of unique layouts in configuration |
| Rush Delivery (+50%) | Client toggle at checkout |

## 7. Implementation phases

Each phase ends with a reviewable checkpoint + user go/no-go on the next.

### Phase 0 — Foundation

- Save brand book to `docs/brand-book.md`
- `npx create-next-app@latest` with TypeScript + Tailwind + App Router + ESLint
- Install Prisma (or Drizzle), Auth.js v5, shadcn/ui, Resend, Zod, `@supabase/supabase-js`
- Configure Tailwind with brand tokens + Google Fonts
- Set up Vercel project + Supabase project + link env vars
- Scaffold `src/` layout (`app/`, `components/`, `lib/`, `server/`)
- First Vercel preview deploy green

### Phase 1 — Marketing site

- Layout, header, footer (with "Elegant Render je deo White Rook DOO" line)
- Home page per brand book §14.2: Hero, value prop, pricing preview, services grid, how-it-works, portfolio snippet, why-us, FAQ, CTA
- `/usluge` services index and `/usluge/[slug]` detail pages
- `/cene` pricing page (reads `catalog.ts`)
- `/o-nama`, `/kontakt` (form creates a Bitrix24 lead), `/portfolio` (static v1)
- Legal stubs: privacy, ToS, cookie banner
- `sitemap.xml`, `robots.txt`, OG metadata
- Lighthouse ≥ 90 (performance, SEO, accessibility)

### Phase 2 — Auth + account

- Auth.js v5: credentials (email+password, bcrypt, email verification via Resend) + Google OAuth
- `users` table, signup/signin/forgot-password/verify-email flows
- Session-protected `/portal` route group
- User profile page (name, phone, password change)

### Phase 3 — Order flow + checkout

- `/poruci` multi-step form:
  1. Choose service
  2. Configure (rooms, angles, revisions…)
  3. Upload source files (photos/PDFs ≤ 100 MB, direct-to-Supabase Storage with signed URLs)
  4. Review + instant price (from `calculatePrice()`)
  5. Payment (Banca Intesa OR PayPal)
- Abstract `PaymentProvider` with `BancaIntesaProvider`, `PayPalProvider`, and `MockProvider` (dev)
- Webhook endpoints: `/api/webhooks/banca-intesa`, `/api/webhooks/paypal` → update `orders.payment_status`, fire confirmation email
- Guest checkout: auto-create account if user isn't logged in, email a password-setup link

### Phase 4 — Client portal

- `/portal` dashboard: list of user's orders with current status
- `/portal/[orderId]` detail page:
  - `StatusTracker` component reading `order_status_events`
  - `CommentThread` (client + team, polling every 10s or Supabase Realtime)
  - Revision file upload → Supabase Storage, `order_files` row with `kind: revision`
  - Deliverables download list
  - Rework request button (posts tagged comment + re-opens revision stage)
- Resend notifications for new team comments, status changes, deliverables ready

### Phase 5 — Bitrix24 deep two-way sync

- Bitrix24 REST adapter in `src/server/bitrix/`
- **App → Bitrix24**
  - New order creates a Deal in a dedicated "Elegant Render" pipeline with custom fields (order id, client, services, amount, source files URL list)
  - Client comments mirror to the Deal timeline
  - Revision files attach to the Deal (link or upload to Bitrix24 Drive)
  - In-app status changes push to Bitrix24
- **Bitrix24 → App**
  - `/api/webhooks/bitrix24` receives deal updates (stage changes, timeline comments, file attachments)
  - Stage changes → `orders.status` transitions + new `order_status_events` rows
  - Team timeline comments → `order_comments` as `author_type: team`
  - Bitrix24-uploaded files → `order_files` with `kind: deliverable`
- `bitrix_sync_log` captures every sync direction for debugging
- Idempotency keys so replays don't double-post
- Nightly Vercel Cron reconciliation comparing app state vs Bitrix24 and flagging drift

### Phase 6 — Launch prep

- Real portfolio imagery
- Real price list populating `catalog.ts`
- Real legal copy (privacy, ToS, cookie — Serbian)
- Real domain on Vercel (DNS + TLS)
- Production env vars (Banca Intesa, PayPal live, Bitrix24 portal, Resend, Supabase service role)
- Error monitoring (Sentry or Vercel Logs)
- Smoke test: full real order with €1 Banca Intesa test + PayPal sandbox
- Supabase point-in-time recovery enabled

## 8. Repo structure (target)

```
Platform/
├── README.md                              # stack + dev setup
├── docs/
│   ├── brand-book.md                      # committed brand book
│   └── plan-v1.md                         # this document
├── prisma/
│   └── schema.prisma                      # data model
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # root layout w/ fonts
│   │   ├── page.tsx                       # home
│   │   ├── usluge/page.tsx                # services index
│   │   ├── usluge/[slug]/page.tsx         # service detail
│   │   ├── cene/page.tsx                  # pricing
│   │   ├── portfolio/page.tsx
│   │   ├── o-nama/page.tsx
│   │   ├── kontakt/page.tsx
│   │   ├── poruci/                        # order flow (multi-step)
│   │   ├── portal/                        # authenticated client portal
│   │   └── api/
│   │       ├── webhooks/banca-intesa/route.ts
│   │       ├── webhooks/paypal/route.ts
│   │       └── webhooks/bitrix24/route.ts
│   ├── components/
│   │   ├── brand/                         # Logo, BrandButton, BrandCard
│   │   ├── marketing/                     # Hero, FeatureGrid, Faq, …
│   │   └── portal/                        # StatusTracker, CommentThread, FileUpload, …
│   ├── lib/
│   │   ├── auth.ts                        # Auth.js config
│   │   ├── pricing/
│   │   │   ├── catalog.ts                 # typed service catalog + prices
│   │   │   └── calculate.ts               # calculatePrice() pure fn
│   │   ├── supabase/                      # typed client + server helpers
│   │   └── validation/                    # Zod schemas
│   └── server/
│       ├── actions/                       # Server Actions
│       ├── bitrix/                        # Bitrix24 REST adapter + sync logic
│       └── payments/
│           ├── provider.ts                # PaymentProvider interface
│           ├── banca-intesa.ts
│           └── paypal.ts
├── tailwind.config.ts                     # brand tokens
└── .env.example                           # all required env vars documented
```

## 9. Open items needed from the user

Collected as each phase approaches; none block Phase 0 except Node/npm (already verified).

- ✅ **Domain name** — `elegantrender.rs` (user-owned; DNS attached at launch)
- ✅ **Price list** — committed at `docs/pricing/WhiteRook_Pricing_Pillar1_EUR.pdf` + extracted structured version at `docs/pricing/pillar-1-extracted.md`
- **Bitrix24 portal URL + webhook / OAuth credentials** — needed at Phase 5
- **Banca Intesa gateway docs / merchant credentials** — needed before Phase 3 payment integration goes real
- **PayPal merchant account + REST app credentials**
- **Portfolio imagery** — 8–12 real renders to seed the portfolio page
- **Legal copy** — privacy, ToS, cookie policy (Serbian) from a local lawyer
- **Accountant decision on SEF eFaktura** — confirms whether Phase 6 needs it
- **Logo files** — vector SVG, monogram, light/dark variants

## 10. Verification — how each phase is "done"

| Phase | Smoke test |
|---|---|
| 0 | `npm run dev` renders a styled "Elegant Render Platform" home; Vercel preview deploys green |
| 1 | All 7 marketing routes return 200; Lighthouse ≥ 90 perf/SEO/a11y; footer shows White Rook line |
| 2 | Signup → verify email → signin → Google signin → signout → password reset all work |
| 3 | End-to-end real order: pick service → configure → upload file → pay via PayPal sandbox / Banca Intesa test → confirmation email → order visible in `/portal` |
| 4 | Can comment, upload revision file, see status change, download deliverable |
| 5 | New order creates Bitrix24 deal ≤ 10s; status change in Bitrix24 appears in portal ≤ 10s; comments and files sync both ways; `bitrix_sync_log` clean |
| 6 | Production on real domain with HTTPS, real portfolio + pricing, end-to-end real order, monitoring dashboards green |

## 11. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Banca Intesa gateway docs / onboarding slow | `PaymentProvider` abstraction lets v1 ship PayPal-only if needed; Banca Intesa added later without touching checkout UI |
| Pricing rules iterate often — hard-coding hurts | Keep `catalog.ts` small and typed; schedule v1.1 migration to DB-backed pricing if iteration gets painful |
| Supabase free-tier storage cap (1 GB) | At ~100 MB/order that's ~10 active orders; upgrade to Pro (8 GB → pay-as-you-go) before launch |
| Bitrix24 sync drift / race conditions | Idempotency keys, `bitrix_sync_log`, nightly reconciliation, monotonic `updated_at` for conflict resolution |
| SEF eFaktura becomes legally required mid-build | Data model keeps invoice separate from payment; add SEF adapter later without schema rewrite |
| GDPR / Serbian data protection | Supabase EU region, privacy/ToS/cookie pages in v1 scope, DPA with Supabase before launch |
| Large-file escape hatch needed later | Upload component accepts pasted Drive/WeTransfer URL as an alternative to direct upload (quick v1.1 add) |
| Broad scope, one-person dev team | Phased rollout + no fixed deadline — ship and validate each phase before moving on |

## 12. Approval and change log

| Version | Date | Note |
|---|---|---|
| 1.0 | 2026-04-11 | Initial plan approved |
