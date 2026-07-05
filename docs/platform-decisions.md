# Platform Decisions

Lightweight decision/change log for the key characteristics of the Elegant
Render International platform (elegantrender.com). Update it whenever a change
affects the conversion flow, pricing, brand/design rules, order lifecycle,
auth, payments, CRM sync, architecture or other behavior worth remembering
over time. Small copy/styling/refactor changes that don't alter platform
behavior don't need an entry.

The pre-fork (Serbian platform) decision history is preserved in
`docs/platform-decisions-rs-archive.md`.

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
- **References:** PR, commit, issue or chat context if available.
```

## 2026-07-06 - EN/EUR/PayPal fork from elegant-render-platform @ 641d34c

- **Area:** architecture | payments | pricing | design | docs
- **What changed:** New repo `elegant-render-com` cloned (with full git history) from the Serbian platform at commit `641d34c` to build elegantrender.com: full English translation, PayPal replacing the Nestpay card gateway, EUR canonical pricing with automatic buyer-currency display (marketable x9 rounding), 2-step checkout with post-payment file upload, EU-adapted legal pages, and the White Rook international design system. Bitrix24 CRM survives on the same portal with a new EN pipeline. Phase 1 bootstrap performed: Nestpay docs/scripts stripped; Prisma migrations squashed to a fresh `00000000000000_init` (empty new Supabase DB); all route slugs renamed Serbian→English in one atomic sweep (182 files; legacy redirects deleted — fresh domain); config IDs (times of day, seasons, room styles, categories, service/blog slugs) renamed to permanent English values while the DB is empty; 164 public/ assets renamed for English SEO via `scripts/rename-artwork.mjs` (audit: `docs/seo/artwork-rename-map.json`); card-scheme logos and the bank-mandated PaymentTrustBadges strip removed; design tokens swapped to `globals-international.css` with Inter Tight + JetBrains Mono (temporary compat aliases cover ~330 retired warm-palette var() usages until the Track C sweep).
- **Why:** International expansion of White Rook DOO. The prior PayPal+EUR implementation (removed on the .rs site by `b4d0740`, 2026-06-17) is recoverable from git history, making this fork largely a recovery+translation project. Full context and owner-confirmed decisions: `docs/plan/00-master-plan.md`.
- **Impact on conversion:** Checkout will shrink from 4 steps to 2 (details → PayPal); file upload moves post-payment.
- **Impact on design:** Complete new visual identity (white canvas, #111 ink, one green #00D98A, Inter Tight/JetBrains Mono, 4px radius) per `docs/design-handoff/`.
- **Impact on code:** Repo-wide; see Phase 1 commits on main. Parallel-work path ownership is embedded in `AGENTS.md` and binding for all agents.
- **Impact on docs:** `CLAUDE.md`/`AGENTS.md` rewritten for the fork; plan + exploration + design docs in `docs/plan/`; `docs/copy-glossary.md` added; Serbian decision log archived.
- **Related files:** `AGENTS.md`, `CLAUDE.md`, `docs/plan/00-master-plan.md`, `docs/seo/artwork-rename-map.json`, `scripts/rename-artwork.mjs`, `prisma/migrations/00000000000000_init/`, `src/app/globals.css`, `src/app/layout.tsx`
- **References:** Fork base commit `641d34c`; PayPal recovery anchor `b4d0740^`; Phase 1 commits `a31cfdc`…`bca81f3`.
