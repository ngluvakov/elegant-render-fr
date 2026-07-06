# Elegant Render International master plan

## Scope

Build elegantrender.com as the English international fork of the existing Elegant Render platform. The fork keeps the proven portal, admin, order lifecycle, CRM sync, and file workflow while moving the public product to English routes, EUR accounting, buyer-local display pricing, PayPal checkout, EU legal pages, and the White Rook international design system.

## Locked decisions

| Area | Decision |
| --- | --- |
| Domain | `elegantrender.com` |
| Seller | White Rook DOO, Serbia |
| Brand | Elegant Render as the product brand, White Rook as company attribution |
| Language | English-first public and portal experience |
| Accounting currency | EUR |
| Buyer display | Local display currency where supported, with EUR as invoice basis |
| Payment provider | PayPal |
| Checkout | Details to PayPal; source-file upload after payment |
| Legal | EU-facing legal set under `/legal/*` |
| CRM | Existing Bitrix24 foundation with a new English pipeline |
| Design | White Rook international handoff in `docs/design-handoff/**` |

## Parallel tracks

| Track | Owner | Work |
| --- | --- | --- |
| A - Money and platform core | Claude Code | Payment provider migration, EUR schema, currency display, checkout, invoices, CRM money fields, analytics, scripts, platform config. |
| B - Portal/auth/comms translation | Codex | Portal, auth, chat, configurator labels, emails after S1, and `TESTING.md`. |
| C - Marketing redesign and brand | Claude Code | Public marketing pages, site components, assets, SEO helpers, layout, sitemap, robots, manifest. |
| D - SEO/legal/docs | Codex | Legal pages, `llms.ts`, blog content, docs, and tracked Claude prompts or commands. |

Path ownership in `AGENTS.md` is binding.

## Sync points

| Sync | Gate |
| --- | --- |
| S0 | Phase 1 bootstrap is pushed and tagged. |
| S1 | Legacy payment removal, PayPal restore, and EUR schema are on main. |
| S2 | EUR catalog constants are finished and catalog copy can hand over. |
| S3 | Integration freeze: typecheck, tests, sandbox checkout, CRM, upload, and deploy gate. |
| S4 | Launch gate: live PayPal webhook, CRM outbound webhook, DNS, Search Console, and GTM flips. |

## Phase 1 bootstrap

- Clone with history and create the international repository.
- Remove obsolete local-payment docs/scripts and unused payment branding assets.
- Re-baseline Prisma for the new database.
- Copy the agent and command scaffolding outside git as needed.
- Update package identity, env examples, and platform configuration.
- Rename public routes to English in one atomic pass.
- Rename config IDs only while the database is empty.
- Rename public artwork for English SEO.
- Apply the international design tokens and fonts.
- Commit the ownership table into `AGENTS.md`.

## Track A design summary

- Restore and harden PayPal Orders API support.
- Use idempotency keys for order creation and capture.
- Verify PayPal webhooks and dedupe events.
- Support capture-on-return, webhook completion, and reconciliation.
- Store charged amount, charged currency, FX snapshot, PayPal order ID, and capture ID.
- Keep invoices and accounting in EUR.
- Emit analytics and CRM values from server-confirmed order state.

## Track B design summary

- Translate portal, auth, chat, configurator labels, and email copy.
- Preserve IDs, slugs, enum values, object keys, route constants, commands, and env vars.
- Keep parser and prompt changes in lockstep when chat proposal syntax changes.
- Do not edit email templates until S1.
- Do not edit catalog copy until S2.

## Track C design summary

- Implement public pages from the design handoff.
- Keep homepage copy from `docs/design-handoff/README.md` canonical.
- Update legal navigation, sitemap routes, footer labels, and public SEO helpers after Track D adds legal pages.
- Use real or generated bitmap images for website visual assets.

## Track D legal specification

- `legal/imprint`: White Rook DOO seller details, EU representative placeholder, company and contact information.
- `legal/terms`: Serbian law, Rome I article 6 consumer carve-out, Consumer Rights Directive wording, alternative dispute resolution wording, no discontinued EU platform link.
- `legal/privacy`: GDPR-only standalone page, Serbia third-country controller, standard contractual clauses and transfer safeguards, EU representative placeholder.
- `legal/cookies`: English page with current vendor table, including PayPal.
- `legal/refunds`: PayPal-specific refunds to original funding source and currency, realistic timelines.
- `legal/withdrawal`: 14-day right, article 16(m) waiver for digital content/service start, and model withdrawal form.
- `legal/complaints`: Voluntary complaint procedure with target response timing.
- `legal/delivery`: Delivery scope, file handoff, revision and upload expectations.
- `legal/certificates`: English certificate and standard overview.

## Verification

Run on every package branch before PR:

```powershell
npx tsc --noEmit
npm run lint
```

Recommended launch greps:

```powershell
rg -n "sr-Latn|sr-RS|dinar|legacy local currency token" src docs
rg -n "legacy card gateway token|legacy bot challenge token" src docs
rg -n "elegantrender.rs" src docs
```

Use exact sensitive-token scans from the current launch brief when preparing the final integration gate.

## Launch risks

- EU representative must be appointed before public launch.
- Tax classification for EU consumer services needs written advisor confirmation.
- PayPal live webhook must be verified before live traffic.
- CRM pipeline IDs and stage mapping must be production-confirmed.
- Search Console, Bing, GTM, and GA4 must be flipped only after deploy verification.