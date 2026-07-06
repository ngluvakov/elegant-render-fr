# Platform decisions

Lightweight decision and change log for key characteristics of the Elegant Render International platform at elegantrender.com. Update this file when a change affects conversion flow, pricing, brand/design rules, order lifecycle, auth, payments, CRM sync, architecture, or another behavior worth remembering.

The pre-fork Serbian platform history is preserved as a brief archive in `docs/platform-decisions-rs-archive.md`.

## Template

```md
## YYYY-MM-DD - Short decision title

- **Area:** conversion | design | pricing | order lifecycle | auth | payments | CRM sync | architecture | docs | other
- **What changed:** Short description of the actual change.
- **Why:** Reason, goal, or problem the change solves.
- **Impact on conversion:** None / short description.
- **Impact on design:** None / short description.
- **Impact on code:** None / short description.
- **Impact on docs:** None / which documents were updated.
- **Related files:** `path/to/file.ts`, `path/to/doc.md`
- **References:** PR, commit, issue, or chat context if available.
```

## 2026-07-06 - EN/EUR/PayPal fork from the Serbian platform

- **Area:** architecture | payments | pricing | design | docs
- **What changed:** This repository became the international elegantrender.com fork: English routes and copy, EUR accounting, PayPal checkout, buyer-local display pricing, post-payment file upload, EU legal pages, and the White Rook international design system.
- **Why:** White Rook DOO is expanding Elegant Render to an international audience while keeping the proven portal, order, and CRM foundation.
- **Impact on conversion:** Checkout moves toward a shorter details to PayPal flow, with source-file upload after payment.
- **Impact on design:** The public site follows the international White Rook handoff: white canvas, black text, one green accent, Inter Tight, JetBrains Mono, compact radii, and restrained motion.
- **Impact on code:** Parallel ownership is enforced by `AGENTS.md`. Main must pass typecheck at all sync points.
- **Impact on docs:** `docs/plan/**`, `docs/copy-glossary.md`, `docs/brand-book.md`, and this log describe the fork.
- **Related files:** `AGENTS.md`, `docs/plan/00-master-plan.md`, `docs/copy-glossary.md`, `docs/design-handoff/README.md`
- **References:** Fork base `543e302`; current launch plan in the task handoff.