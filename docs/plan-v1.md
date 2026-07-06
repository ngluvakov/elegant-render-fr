# Elegant Render International plan v1

This document is the compact English version of the original launch plan. The active master plan is `docs/plan/00-master-plan.md`.

## Objective

Launch elegantrender.com as an English international version of Elegant Render with EUR accounting, PayPal checkout, White Rook visual identity, EU legal pages, English docs, and a translated portal.

## Work packages

| Package | Owner | Scope |
| --- | --- | --- |
| Bootstrap | Claude Code | Repository identity, routes, config IDs, assets, design tokens, ownership rules. |
| Track A | Claude Code | Payments, currency, checkout, invoices, analytics, CRM money paths. |
| Track B | Codex | Portal, auth, chat, configurator labels, emails after S1, test runbook. |
| Track C | Claude Code | Marketing redesign, public content, site components, SEO helpers, assets. |
| Track D | Codex | Legal, docs, blog, llms, tracked agent prompts and commands. |

## Rules

- Work on one package per branch.
- Keep edits inside the package path ownership.
- Preserve frozen IDs, slugs, object keys, enum values, env vars, commands, and route constants.
- Translate only human-visible prose and labels unless bootstrap explicitly owns a rename.
- Main must pass typecheck.

## Launch sequence

1. Bootstrap and tag S0.
2. Merge payment and EUR schema work at S1.
3. Merge catalog constants and hand off copy at S2.
4. Freeze integration at S3 with tests and sandbox checkout.
5. Launch at S4 after live webhook, DNS, CRM, search, and analytics gates.