# I18n and SEO design

## Goal

Move the platform to an English-first international site with durable route names, English metadata, renamed artwork, and clean machine-readable identifiers.

## Principles

- Human-visible copy is translated.
- Machine-readable IDs, slugs, enum values, object keys, route constants, env vars, commands, and code identifiers are frozen after bootstrap.
- Public pages use English routes.
- Structured data should describe the international service and EUR accounting model.
- Artwork filenames should support English search intent.

## Public route set

| Area | Route |
| --- | --- |
| Home | `/` |
| Services | `/services` |
| Service detail | `/services/[slug]` |
| Pricing | `/pricing` |
| Checkout | `/checkout` |
| Portfolio | `/portfolio` |
| About | `/about` |
| Contact | `/contact` |
| FAQ | `/faq` |
| Legal | `/legal/*` |
| Portal | `/portal/*` |
| Auth | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` |

## Metadata

Every public route should have:

- English title.
- English description.
- Canonical URL on elegantrender.com.
- OpenGraph title and description.
- Relevant image.
- Locale suitable for English international copy.

## Blog rules

- Keep frozen slugs.
- Translate title, summary, tags, alt text, body, and CTA text.
- Use glossary terms.
- Prefer practical search intent over broad editorial language.

## LLM text rules

`src/lib/llms.ts` should:

- Describe the service in English.
- Use English routes.
- Explain that invoices are issued in EUR.
- Avoid claims tied to superseded local payment or tax flows.
- Pull service structure from the existing catalog without changing catalog IDs.

## Artwork SEO

- Filenames should describe the service and variant in English.
- References must be updated where files are renamed.
- Generated images should show the actual service outcome.
- Do not rely on decorative gradients or abstract placeholders for primary service imagery.

## Legal SEO follow-up

Track D may add legal pages. Track C must then update:

- Legal navigation.
- Footer labels.
- Sitemap entries.
- Any stale links to old legal anchors.

## Verification

```powershell
npx tsc --noEmit
npm run lint
rg -n '/old-route-token' src docs
rg -n 'sr-Latn|sr-RS' src docs
rg -n 'legacy local currency token|legacy payment token' src docs
```