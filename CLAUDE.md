@AGENTS.md

# Elegant Render International (elegantrender.com)

B2C architectural visualization service (Elegant Render, sub-brand of White Rook DOO, Serbia) for the international/English market. Forked from the Serbian platform (`elegantrender.rs`, repo `elegant-render-platform`) at commit `641d34c`. English routes and copy, **PayPal** payments (no card gateway), **EUR** canonical pricing displayed in the buyer's PayPal-supported currency, Bitrix24 CRM (same portal as .rs, separate EN pipeline).

> Migration status lives in `docs/plan/00-master-plan.md` (master plan, Phase 0
> dependency checklist, track split). Detailed designs: `docs/plan/design-*.md`.
> The visual identity spec is `docs/design-handoff/` (White Rook design system).

## Stack deviations from defaults

- **Prisma 7 client generated to `src/generated/prisma`** — import from `@/generated/prisma/client`, not `@prisma/client`. Uses `PrismaPg` adapter (Supabase).
- **shadcn/ui built on base-ui, not radix.** `Button` etc. import from `@base-ui/react/*`.
- **Next.js 16 renamed `middleware.ts` → `proxy.ts`.** Route protection lives there.
- **Tailwind 4** with CSS variables. Palette: white canvas, `#111111` ink, `#fafafa` section grey, `#0a0a0a` dark surfaces, ONE green accent `#00D98A` (text on green `#06120C`, never white). Fonts: Inter Tight + JetBrains Mono (eyebrows/prices/specs). Radius 4px. See `docs/design-handoff/README.md`.
- **Auth.js v5** (credentials + Google OAuth).

## Scripts and env

Scripts in `scripts/` run with `npx tsx`. DB-touching scripts MUST bootstrap dotenv + PrismaPg explicitly (the runtime client won't work):

```ts
import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg(process.env.DIRECT_URL!);
const prisma = new PrismaClient({ adapter });
```

Use `DIRECT_URL` for scripts/migrations, `DATABASE_URL` (pooled) for runtime.

## Database migrations

Schema lives in `prisma/schema.prisma`. **Always change schema via `prisma migrate dev`, never `db push`.** The two workflows are mutually exclusive — `db push` skips the migration history and creates drift that `migrate deploy` can't reconcile.

The baseline `00000000000000_init` was regenerated offline for this fork (fresh empty Supabase DB); the 36 historical Serbian-era migrations were squashed into it. Production deploys run `prisma migrate deploy` inside `npm run build` on Vercel.

## Pricing and currency

- Canonical prices are **EUR** (source: `docs/pricing/pillar-1-extracted.md`, the original White Rook EUR price list; the design handoff carries final consumer price points).
- Catalog: `src/lib/catalog/configurator.ts`. Calculation: `src/lib/catalog/calculate.ts` — always call `calculateQuote`, never duplicate the math.
- Display/charge currency is chosen per visitor (geo via `x-vercel-ip-country`) from PayPal-supported currencies with **round-UP-then-minus-one marketable rounding** (€169, $189); seams: `src/lib/catalog/display-currency.ts` + `src/lib/billing.ts` (+ `src/lib/currency/` once Track A lands).
- Machine-readable IDs (config IDs, slugs, categories, enum-ish strings) are English and FROZEN. Labels/descriptions are translated separately — never derive labels from IDs.

## Payments (PayPal)

- PayPal Orders API v2 + JS SDK (no npm SDK dependency). Client: `src/lib/payment/paypal.ts`. Env: `PAYPAL_MODE`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_WEBHOOK_ID`.
- Provider-neutral seams every payment path MUST use: `finishSuccessfulPayment` / `finishFailedPayment` (`src/server/actions/payment.ts`) and `transitionOrder` (`src/lib/order/status-machine.ts` — also syncs Bitrix).
- Three completion paths: capture-on-return (primary), signature-verified webhook `api/paypal/webhook`, reconcile cron `api/cron/paypal-reconcile`. Design: `docs/plan/design-payments.md`.
- The pre-fork PayPal implementation is recoverable from git history at `b4d0740^` (`git show "b4d0740^:src/lib/payment/paypal.ts"`).

## Mutation pattern

Server actions in `src/server/actions/` (`"use server"`). After a write:
1. `revalidatePath('/affected/route')` on the server action.
2. `router.refresh()` in the client after the action resolves.

Destructive UI uses inline confirm — no `window.confirm()`. Editable fields autosave with 600ms debounce.

## Order status gates

Structural edits (add/remove items, rename project, edit rooms) only allowed when `status === 'draft'`. `awaiting_payment` and `paid` allow per-item notes/files. Post-delivery states lock everything. FSM: `src/lib/order/status-transitions.ts`.

## Deploy

`git push origin main` triggers Vercel production. Treat every commit on main as a production deploy — type-check and SSR-sanity before pushing.

## Chatbot

OpenAI-backed chat emits service proposals as fenced blocks parsed in `src/components/chat/chat-messages.tsx` (block tag `:::predlog` until the Track B rename to `:::proposal` — prompt and parser must change in lockstep). "Add to configurator" flows through `sessionStorage("er-chat-proposal")` + the `er-chat-proposal` custom event.

## The Elegant Gentlemen (subagent team)

Five on-demand subagents live in `.claude/agents/` and confer via files in `.claude/elegant-gentlemen/`. They are **off-duty by default** — never auto-delegate to them.

| Slug | Gentleman | Remit |
| --- | --- | --- |
| `eg-conversion-ashford` | Mr. Ashford | Conversion & funnel; English CTA copy |
| `eg-design-beaumont` | Mr. Beaumont | Design & brand (White Rook system: white/ink/green, restraint) |
| `eg-stack-carrington` | Mr. Carrington | Stack & code quality (the rules above) |
| `eg-architect-davenport` | Mr. Davenport | UI/UX architect — the only one who writes UI code |
| `eg-deploy-whitfield` | Mr. Whitfield | Pre-deploy gate before `git push origin main` |

**Engage:** `/eg <task>` for the full round-table, the phrase "Elegant Gentlemen, …" as an equivalent trigger, or `@eg-<slug>` for a one-off consult.
**Dismiss:** "Gentlemen, that will be all." Outside an active session they do nothing.

**Write scopes** (enforced socially via each agent's system prompt, not the harness):
- Ashford/Beaumont/Carrington/Whitfield write **only** inside their own study under `.claude/elegant-gentlemen/<name>/`.
- Davenport is the **only** gentleman who writes production code, and only to UI surface: `src/app/**`, `src/components/**`, `src/styles/**`, `tailwind.config.*`. He never touches `prisma/`, `src/server/**`, or `src/lib/catalog/**`.
- Round-table notes live in `.claude/elegant-gentlemen/sessions/<ts>-<topic>/`; each gentleman writes only his own `NN-<slug>.md`. Main Claude (moderator) writes `brief.md`, `decision.md`, and `dismissed.md`.
