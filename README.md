# Elegant Render Platform

B2C architectural visualization service — a sub-brand of **White Rook DOO**. Clients order renders, virtual staging, renovations, floor plans, animations, and 360 tours through an interactive pricing configurator, pay online, and track their projects through a dedicated client portal.

**Live:** https://elegant-render-platform.vercel.app
**Domain:** elegantrender.rs (pending DNS setup)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript + React 19 |
| Styling | Tailwind CSS 4 + shadcn/ui (base-ui) |
| Database | PostgreSQL on Supabase (via Prisma 7) |
| Auth | Auth.js v5 (NextAuth) — email/password + Google OAuth |
| File Storage | Supabase Storage (private bucket `order-files`) |
| Payments | PayPal REST API v2 (sandbox) + mock card provider |
| CRM Sync | Bitrix24 REST API (two-way deal/comment/file sync) |
| Email | Nodemailer via DirectAdmin SMTP (noreply@elegantrender.rs) |
| Hosting | Vercel |

---

## Project Structure

```
Platform/
├── prisma/
│   └── schema.prisma              # Database schema (User, Order, OrderItem, OrderFile, etc.)
│
├── scripts/
│   ├── seed-admin.ts              # Creates admin user account
│   └── bitrix-setup.ts            # Creates Bitrix24 "Elegant Render" pipeline + stages
│
├── src/
│   ├── app/                       # Next.js App Router pages
│   │   ├── layout.tsx             # Root layout (fonts, base styles — NO header/footer)
│   │   ├── not-found.tsx          # Global 404 page
│   │   ├── manifest.ts            # PWA web manifest
│   │   ├── sitemap.ts             # Auto-generated sitemap
│   │   ├── robots.ts              # Robots.txt (noindex until launch)
│   │   │
│   │   ├── (marketing)/           # Route group: public pages WITH header/footer
│   │   │   ├── layout.tsx         # Wraps children with SiteHeader + SiteFooter
│   │   │   ├── page.tsx           # Home page (hero, principles, FAQ)
│   │   │   ├── cene/              # Interactive pricing configurator
│   │   │   ├── usluge/            # Services index + [slug] detail pages
│   │   │   ├── portfolio/         # Portfolio (placeholder until real images)
│   │   │   ├── o-nama/            # About page
│   │   │   ├── kontakt/           # Contact form
│   │   │   ├── pravno/            # Legal pages (privacy, terms, cookies)
│   │   │   └── poruci/            # Multi-step checkout wizard
│   │   │       ├── page.tsx       # Server component shell
│   │   │       ├── checkout-wizard.tsx  # Client component: 4-step wizard
│   │   │       ├── checkout-context.tsx # Checkout state management
│   │   │       ├── paypal-buttons.tsx   # PayPal JS SDK integration
│   │   │       └── steps/         # Step 1: details, 2: upload, 3: review, 4: payment
│   │   │
│   │   ├── (auth)/                # Route group: auth pages (NO header/footer)
│   │   │   ├── prijava/           # Sign in (email + Google)
│   │   │   ├── registracija/      # Sign up
│   │   │   ├── zaboravljena-lozinka/  # Forgot password
│   │   │   ├── nova-lozinka/      # Reset password (from email link)
│   │   │   └── verifikacija/      # Email verification
│   │   │
│   │   ├── portal/                # Client portal (sidebar layout, auth-guarded)
│   │   │   ├── layout.tsx         # Auth guard + sidebar layout shell
│   │   │   ├── page.tsx           # Dashboard (stats, active projects, activity)
│   │   │   ├── porudzbine/        # Orders list + [orderId] detail
│   │   │   ├── profil/            # User profile editor
│   │   │   ├── sign-out-button.tsx
│   │   │   └── admin/             # Admin panel (admin-only, all orders)
│   │   │       ├── layout.tsx     # Admin guard (isAdmin check)
│   │   │       ├── page.tsx       # Admin dashboard (stats, filters, all orders)
│   │   │       └── porudzbine/[orderId]/  # Admin order detail + team tools
│   │   │
│   │   └── api/                   # API routes
│   │       ├── auth/[...nextauth]/ # Auth.js route handler
│   │       ├── checkout/upload-url/ # Signed upload URL generation
│   │       ├── portal/download/    # Signed download URL for deliverables
│   │       ├── webhooks/bitrix24/  # Bitrix24 inbound webhook
│   │       └── cron/bitrix-reconcile/ # Nightly Bitrix24 sync reconciliation
│   │
│   ├── components/
│   │   ├── auth/                  # SessionProvider, GoogleSignInButton
│   │   ├── brand/                 # BrandLogo, SectionKicker
│   │   ├── configurator/          # Pricing configurator (6 components)
│   │   │   ├── pricing-configurator.tsx  # Root shell
│   │   │   ├── quote-context.tsx  # React Context + useReducer for quote state
│   │   │   ├── service-adder.tsx  # Category tabs + product cards
│   │   │   ├── quote-item.tsx     # Expandable product card with add-on steppers
│   │   │   ├── quote-summary.tsx  # Sticky sidebar with total + "Naruči" button
│   │   │   └── addon-stepper.tsx  # +/- quantity control
│   │   ├── marketing/             # Home page sections (hero, FAQ, principles, etc.)
│   │   ├── portal/                # Portal components (17 components)
│   │   │   ├── portal-layout-shell.tsx  # Sidebar + topbar + mobile drawer
│   │   │   ├── portal-sidebar.tsx # Navigation (different for admin vs client)
│   │   │   ├── portal-topbar.tsx  # Section title + breadcrumb + mobile menu
│   │   │   ├── status-tracker.tsx # Horizontal timeline (7 steps)
│   │   │   ├── comment-thread.tsx # Message list with 30s polling
│   │   │   ├── message-composer.tsx # New message input
│   │   │   ├── deliverables-card.tsx  # Final files download panel
│   │   │   ├── revision-upload-card.tsx # Client revision file upload
│   │   │   ├── pending-payment-card.tsx # Pay unpaid orders from portal
│   │   │   ├── rework-request-card.tsx  # Request revision (in_review only)
│   │   │   ├── order-detail-hero.tsx    # Order title, status, amount
│   │   │   ├── order-overview-card.tsx  # Dashboard project cards
│   │   │   ├── order-summary-card.tsx   # Right panel: items + files summary
│   │   │   ├── orders-filter-bar.tsx    # Search + status filter
│   │   │   ├── summary-stat-card.tsx    # Dashboard stat widget
│   │   │   ├── activity-feed.tsx        # Recent events
│   │   │   ├── empty-state.tsx          # Reusable empty state
│   │   │   ├── status-utils.ts          # Status labels + badge colors + step definitions
│   │   │   └── paypal-portal-buttons.tsx # PayPal SDK for portal payments
│   │   ├── site/                  # SiteHeader, SiteFooter
│   │   └── ui/                    # shadcn/ui primitives (button, card, input, etc.)
│   │
│   ├── lib/                       # Pure utilities and API clients
│   │   ├── auth.ts                # Auth.js v5 config (providers, callbacks, JWT)
│   │   ├── db.ts                  # Prisma client singleton
│   │   ├── email.ts               # Nodemailer: verification, reset, confirmation emails
│   │   ├── supabase.ts            # Supabase admin client (service role)
│   │   ├── utils.ts               # cn() Tailwind class merger
│   │   ├── content/site.ts        # Site-wide content constants (name, tagline, nav, FAQ)
│   │   ├── catalog/
│   │   │   ├── services.ts        # Display-oriented service catalog (for marketing pages)
│   │   │   ├── configurator.ts    # Machine-readable catalog (for pricing configurator)
│   │   │   └── calculate.ts       # Pure price calculation engine
│   │   ├── order/
│   │   │   ├── status-machine.ts  # Order status transitions + Bitrix24 sync hook
│   │   │   └── generate-number.ts # ER-YYYYMMDD-XXXX order number generator
│   │   ├── payment/
│   │   │   ├── types.ts           # PaymentResult types
│   │   │   ├── paypal.ts          # PayPal REST API v2 (create + capture orders)
│   │   │   └── mock-card.ts       # Simulated card payment (dev only)
│   │   └── bitrix24/
│   │       ├── client.ts          # REST client (rate-limited, retried, logged)
│   │       ├── types.ts           # Bitrix24 API response types
│   │       └── stage-map.ts       # OrderStatus ↔ Bitrix24 Deal stage mapping
│   │
│   ├── server/                    # Server-only code
│   │   ├── actions/               # Next.js Server Actions (called from forms/buttons)
│   │   │   ├── auth.ts            # Sign up, sign in, forgot/reset password, verify email
│   │   │   ├── sign-out.ts        # Sign out action
│   │   │   ├── profile.ts         # Update user profile
│   │   │   ├── checkout.ts        # Guest user creation during checkout
│   │   │   ├── order.ts           # Create order + confirm file upload → Bitrix24 sync
│   │   │   ├── payment.ts         # PayPal create/capture + mock card → email + status
│   │   │   ├── comment.ts         # Create/list order comments → Bitrix24 sync
│   │   │   ├── rework.ts          # Client rework request → status transition
│   │   │   └── admin.ts           # Admin: team comments, status, deliverables → Bitrix24
│   │   └── bitrix/                # Bitrix24 sync orchestration
│   │       ├── sync-deal.ts       # Create Deal from Order
│   │       ├── sync-contact.ts    # Create/find Contact from User
│   │       ├── sync-status.ts     # Push status change to Deal stage
│   │       ├── sync-comment.ts    # Push comment to Deal timeline
│   │       ├── sync-file.ts       # Push file link to Deal timeline
│   │       ├── inbound.ts         # Handle Bitrix24 → App events
│   │       └── reconcile.ts       # Nightly drift detection + retry
│   │
│   ├── generated/prisma/          # Auto-generated Prisma client (gitignored)
│   └── proxy.ts                   # Next.js 16 proxy (replaces middleware.ts)
│
├── docs/
│   ├── brand-book.md              # Full brand book
│   ├── plan-v1.md                 # Original v1 build plan (6 phases)
│   └── pricing/                   # Pricing reference docs
│
├── public/branding/               # Logo assets
├── prisma.config.ts               # Prisma 7 config (reads .env.local)
├── vercel.json                    # Vercel cron config
├── TESTING.md                     # 80+ test scenarios
├── CLAUDE.md                      # Claude Code instructions
└── .env.example                   # All required env vars documented
```

---

## Key Data Flows

### Order Lifecycle
```
/cene (configurator) → "Naruči" → sessionStorage
  → /poruci (checkout wizard)
    → Step 1: Guest details or auto-skip if logged in
    → Step 2: File upload to Supabase Storage
    → Step 3: Review (server-side price re-verification)
    → Step 4: Payment (PayPal or mock card)
      → createOrder() → prisma.order.create + syncNewDeal() → Bitrix24
      → payment capture → transitionOrder(paid) → syncDealStatus()
      → sendOrderConfirmationEmail()
  → /portal (track order)
```

### Bitrix24 Sync
```
App → Bitrix24:
  createOrder()     → syncNewDeal()       → crm.deal.add
  transitionOrder() → syncDealStatus()    → crm.deal.update
  createComment()   → syncCommentToDeal() → crm.timeline.comment.add
  uploadFile()      → syncFileToDeal()    → crm.timeline.comment.add (link)

Bitrix24 → App:
  Deal stage change → POST /api/webhooks/bitrix24 → handleDealUpdate()
    → transitionOrder(source: "bitrix24") — skips outbound sync to prevent loops

Nightly: GET /api/cron/bitrix-reconcile → reconcileAllOrders()
```

### Order Status Machine
```
draft → awaiting_payment → paid → in_progress → in_review
  → revision_requested → in_progress (loop for revisions)
  → delivered → closed

Terminal: cancelled, refunded
```

---

## Development

```bash
npm install
npx prisma generate
npm run dev          # http://localhost:3000
```

### Environment Variables
Copy `.env.example` to `.env.local` and fill in all values.

### Database
```bash
npm run db:migrate         # Create + apply a migration locally (interactive)
npm run db:migrate:status  # Verify schema vs migration history
npm run db:migrate:deploy  # Apply pending migrations (CI / production)
npx prisma generate        # Regenerate client after schema changes
```

**Do not use `prisma db push`.** The project transitioned to migrations workflow on `00000000000000_init`. Mixing `db push` with `migrate` creates drift the deploy can't reconcile.

`npm run build` runs `prisma generate && prisma migrate deploy && next build` so Vercel applies pending migrations on every deploy automatically.

### Scripts
```bash
npx tsx scripts/seed-admin.ts     # Create admin user
npx tsx scripts/bitrix-setup.ts   # Create Bitrix24 pipeline + stages
```

---

## Key Accounts

| Account | Email | Purpose |
|---|---|---|
| Admin | admin@elegantrender.rs | Platform admin — manages all orders |
| SMTP | noreply@elegantrender.rs | Transactional emails |

---

## Brand System

| Token | Value | Usage |
|---|---|---|
| coal | `#1C1A19` | Text, headings |
| ivory | `#F6F1EA` | Background |
| clay | `#B88363` | Accent, CTAs |
| sage | `#8F9A8A` | Secondary, positive states |
| sand | `#DCCFC2` | Cards, muted surfaces |
| Heading font | Cormorant Garamond | Serif, editorial feel |
| Body font | Manrope | Sans-serif, clean UI |

---

## Documentation

- [`docs/brand-book.md`](./docs/brand-book.md) — Brand positioning, tone, visual identity
- [`docs/plan-v1.md`](./docs/plan-v1.md) — v1 build plan (stack, phases, architecture)
- [`docs/pricing/pillar-1-extracted.md`](./docs/pricing/pillar-1-extracted.md) — Structured pricing rules
- [`TESTING.md`](./TESTING.md) — 80+ test scenarios for all platform flows
- [`.env.example`](./.env.example) — All required environment variables
