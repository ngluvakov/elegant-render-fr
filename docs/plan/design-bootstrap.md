# Design bootstrap plan

## Goal

Create a clean international baseline for elegantrender.com before parallel track work begins. Bootstrap work is serial and belongs to the integrator because it changes repository identity, routes, config IDs, assets, and design tokens across many paths.

## Inputs

- Existing Elegant Render platform history.
- White Rook international design handoff in `docs/design-handoff/**`.
- Route and config rename maps in `docs/plan/design-i18n-seo.md` and `docs/seo/**`.
- Payment and checkout plan in `docs/plan/design-payments.md`.

## Steps

1. Clone with full history into the international repository.
2. Remove obsolete local-payment docs, debug scripts, and card-brand assets.
3. Re-baseline Prisma for a fresh production database.
4. Update project identity, env examples, and Vercel settings.
5. Rename public routes to English in one atomic pass.
6. Rename config IDs while the database is empty.
7. Rename artwork files for English SEO using the checked rename maps.
8. Apply international typography and design tokens.
9. Commit `AGENTS.md` ownership rules.
10. Tag the bootstrap completion point as S0.

## Route rules

- New international routes are English.
- Do not keep legacy redirects on the fresh domain unless there is a confirmed SEO reason.
- Update links, metadata, sitemap, robots, auth callback URLs, `revalidatePath` calls, and email links in the same sweep.
- Treat quoted route strings as a grep-zero gate.

## Config-ID rules

- IDs and enum-like values can be renamed only before production data exists.
- After launch, IDs are frozen and only labels may be translated.
- Keep rename maps in docs so future agents understand why code identifiers are already English.

## Asset rules

- Use `git mv` when renaming tracked artwork.
- Replace references in content, metadata, structured data, and tests.
- Verify every referenced asset exists.
- Remove obsolete payment logos and default scaffold assets.

## Design token rules

- Use the handoff CSS as the source for global tokens.
- Use Inter Tight for interface typography and JetBrains Mono for compact technical text.
- Keep compatibility aliases only as temporary scaffolding until Track C completes the component pass.

## Verification

```powershell
npx tsc --noEmit
npm run lint
rg -n 'old-route-token' src docs
rg -n 'old-artwork-token' src public docs
```

The exact token list belongs to the active launch brief and should be run before merging bootstrap work.