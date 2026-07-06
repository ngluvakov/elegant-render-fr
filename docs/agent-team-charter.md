# Agent team charter

This repository is worked on by Claude Code and Codex in parallel. The split is by file path, not by topic. A pull request that edits another track's path should be rejected even when the intent is related to the task.

## Operating model

- Main must always pass `npx tsc --noEmit`.
- Claude Code is the integrator and may commit directly to `main` at sync points.
- Codex works on `codex/<package>` branches, one package per pull request.
- Use the smallest team that can complete the task. Do not delegate just because a task is broad.
- When a change affects conversion flow, pricing, brand/design rules, order lifecycle, auth, payments, CRM sync, or architecture, update `docs/platform-decisions.md`.

## Track ownership

| Track | Owner | Write paths |
| --- | --- | --- |
| A - Money and platform core | Claude Code | Prisma, payment, currency, billing, buyer validation, invoices, server actions, API routes, checkout, payment components, analytics, platform config, scripts, CI, env examples |
| B - Portal/auth/comms translation | Codex | Portal app routes, auth routes, portal components except payment cards, chat, configurator labels, chat library, email after S1, `TESTING.md` |
| C - Marketing redesign and brand | Claude Code | Marketing app routes except checkout, marketing/site components, site content, public assets, root layout, sitemap, robots, manifest, SEO helpers |
| D - SEO/legal/docs | Codex | Legal pages, `src/lib/llms.ts`, blog content, `docs/**`, translated Claude agents and commands when they are tracked |

## Sync points

| Sync | Meaning |
| --- | --- |
| S0 | Phase 1 bootstrap is pushed and tagged. |
| S1 | Legacy card gateway removal, PayPal restore, and EUR schema are on main. |
| S2 | EUR catalog constants are finished and catalog copy can hand over. |
| S3 | Integration freeze with typecheck, tests, sandbox checkout, and deploy gate. |
| S4 | Launch gate with live PayPal webhook, CRM webhook, DNS, and GTM flips. |

## Translation rules

- Translate human-visible labels, messages, headings, emails, prompts, and prose.
- Do not translate IDs, slugs, enum values, object keys, route constants, env vars, commands, or code identifiers.
- Follow `docs/copy-glossary.md`.
- Use sentence case, calm wording, and no exclamation marks.
- Use `render`, `virtual staging`, `day-to-dusk`, `photomontage`, and `estimate` in user-facing copy.

## Escalation

If a required edit is outside your track, write a note in the relevant plan or pull request body instead of editing the file. For example, Track D may request legal navigation, sitemap, or footer updates from Track C but must not apply them directly.