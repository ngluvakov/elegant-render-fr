# I18n exploration report

## Summary

The international fork needs a full English copy pass across public pages, portal, auth, admin, emails, docs, blog content, LLM text, and tracked agent prompts. Route and config identifiers were planned as bootstrap changes; after bootstrap, labels and prose are the translation surface.

## Translation surface

| Area | Owner | Notes |
| --- | --- | --- |
| Public marketing | Track C | Redesign and copy from the design handoff. |
| Legal | Track D | EU-facing English pages. |
| Docs and blog | Track D | Preserve frozen keys and slugs. |
| Portal and auth | Track B | Translate visible labels and messages. |
| Emails | Track B after S1 | Links and amounts must match PayPal/EUR flow. |
| Chat | Track B | Prompt and parser changes must move together. |
| Catalog copy | Track B after S2 | Prices/config remain Track A. |

## Frozen values

Do not translate:

- IDs.
- Slugs.
- Enum values.
- Object keys.
- Route constants.
- Env vars.
- Commands.
- Code identifiers.

## Copy requirements

- Follow `docs/copy-glossary.md`.
- Use sentence case.
- Avoid exclamation marks.
- Use `estimate` for the public buying flow.
- Use `render`, `virtual staging`, `day-to-dusk`, and `photomontage` consistently.
- Explain EUR accounting plainly.

## Risks

- Imported content can still surface old labels if the owning track has not translated it yet.
- Email templates are blocked until payment schema and routes settle.
- Catalog labels are blocked until pricing constants settle.
- Runtime strings from shared content files must be fixed by the owning track, not by crossing path boundaries.

## Verification

Run token scans on the exact package scope before every PR. Add runtime page checks during integration because imported strings may not appear in the edited file.