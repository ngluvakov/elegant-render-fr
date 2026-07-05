<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Agent team

When the user explicitly asks for an agent/team/delegation/parallel work, first read `docs/agent-team-charter.md` and use the smallest fitting on-demand team.

When a change touches key platform characteristics (conversion flow, pricing, brand/design rules, order lifecycle, auth, payments, CRM sync or architecture), update `docs/platform-decisions.md`.

## Parallel track ownership (BINDING for all agents)

This repo is worked on by Claude Code and Codex IN PARALLEL. Ownership is by
file path, never by concern. **Do not edit paths outside your track's column.
A PR/commit touching another track's paths is rejected without further review.**
`main` must always pass `npx tsc --noEmit`.

| Track | Agent | Exclusive write paths |
| --- | --- | --- |
| **A — Money & platform core** | **Claude Code** | `prisma/**` · `src/lib/payment/**` · `src/lib/currency/**` · `src/lib/catalog/**` (prices & config; copy strings hand off to B at sync point S2) · `src/lib/{billing,buyer-validation,invoice-*,proforma-*,outbox,posthog-events}.*` · `src/lib/analytics/**` · `src/server/**` · `src/app/api/**` · `src/app/(marketing)/checkout/**` · `src/components/payments/**` · `src/components/portal/{pending-payment-card,charge-payment-card}.tsx` · `vercel.json` · `.github/**` · `next.config.ts` · `scripts/**` · `.env.example` |
| **B — Portal/auth/comms translation** | **Codex** | `src/app/portal/**` · `src/app/(auth)/**` · `src/components/portal/**` (except the 2 payment cards above) · `src/components/chat/**` · `src/components/configurator/**` (labels/copy only) · `src/lib/chat/**` · `src/lib/email.ts` (only after Claude lands the PayPal excision — sync point S1) · `TESTING.md` |
| **C — Marketing redesign + brand** | **Claude Code** | `src/app/(marketing)/**` (except `checkout/**`) · `src/components/marketing/**` · `src/components/site/**` · `src/lib/content/site.ts` · `public/**` · `src/app/{layout.tsx,sitemap.ts,robots.ts,manifest.ts}` · `src/lib/seo.ts` |
| **D — SEO/legal/docs** | **Codex** | `src/app/(marketing)/legal/**` · `src/lib/llms.ts` · `src/lib/content/blog.ts` · `docs/**` · `.claude/agents/**`, `.claude/commands/**` (translation only) — may READ `src/lib/content/site.ts` and `src/lib/seo.ts` but never edit them; request IMPRINT/JSON-LD changes via a note file in `docs/plan/` and Claude applies them in Track C |

**Sync points:** S0 = Phase 1 bootstrap pushed (done when tag `phase-1-done`
exists). S1 = Nestpay excision + PayPal restore + EUR schema on main. S2 = EUR
catalog constants finished; catalog copy fields hand over to Track B. S3 =
integration freeze (typecheck, tests, sandbox checkout E2E, deploy gate). S4 =
launch gate (live PayPal webhook, Bitrix outbound webhook, DNS/GTM flips).

**Branch discipline:** Claude Code integrates and may commit to `main`
directly. Codex works on `codex/<package>` branches, one work package per PR;
Claude reviews and merges at sync points.

**Copy rules for Track B/D translation work:** machine-readable IDs, enum
values, slugs and object keys are already English and FROZEN — translate only
human-visible strings (labels, descriptions, headings, messages, emails).
Follow `docs/copy-glossary.md` (sentence case; no exclamation marks; "render",
"virtual staging", "day-to-dusk", "photomontage", "estimate" not "quote";
final homepage copy in `docs/design-handoff/README.md` is verbatim-canonical).
