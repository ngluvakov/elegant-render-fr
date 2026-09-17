# elegantrender.fr — translation & localization guide

This repository is a country clone of the English **elegantrender.com** build.
Everything — features, pricing model, currency (EUR), routes, database schema —
stays identical. Only two things change:

1. **Language** — all user-facing copy becomes French.
2. **Geo-targeting** — where `.com` addresses the world, `.fr` addresses France.

Sibling clone: **elegantrender.de** (German). Keep the two structurally in sync;
if a decision here contradicts the DE clone, prefer the DE structure and change
only the language.

---

## 1. Voice

- **Formal address — `vous`, always.** Never `tu`. (Mirrors the DE clone's `Sie`.)
- Calm, precise, concrete. The brand does not shout, does not use exclamation
  marks in body copy, and does not promise more than it delivers.
- Prefer plain French over marketing jargon. If a sentence would sound like a
  literal translation, rewrite it so it reads as if it were written in French.
- Keep sentence length close to the English original — the layouts are tuned to
  it. French runs ~15–20 % longer than English; where that breaks a fixed-width
  heading or button, shorten the copy rather than the layout (see §5).

## 2. French typography (mandatory)

- **Apostrophe:** use the typographic apostrophe `’` (U+2019), never `'`.
  This also avoids escaping problems inside TypeScript strings.
- **Narrow no-break space before double punctuation:** insert ` `
  (narrow NBSP) before `; : ! ?`, e.g. `Prix : 250 €`, `Prêt ?`.
  In `.ts`/`.tsx` string literals write the character itself, not an entity.
- **Quotes:** French guillemets `« … »` with a no-break space inside:
  `« un rendu »`. Do not use `"` for quoting prose.
- **Euro:** amount then symbol with a no-break space — `250 €`, never `€250`.
  (Currency rendering is handled by `Intl`; only fix hand-written strings.)
- Em dashes `—` from the English source stay as they are.

## 3. Geo-targeting

| `.com` (world) | `.fr` (France) |
|---|---|
| "delivered across the world" | « partout en France » |
| "Elegant Render delivers across Europe and beyond" | « Elegant Render livre partout en France et au-delà » |
| `areaServed: ["EU", "GB", "US", "Worldwide"]` | `areaServed: ["FR", "EU", "Worldwide"]` |
| `htmlLang: "en"` / `locale: "en_US"` | `htmlLang: "fr-FR"` / `locale: "fr_FR"` |

Site identity: `https://elegantrender.fr`. Contact address stays `info@elegantrender.com` (no per-country mailbox — decision 2026-09-15).

The operating company does **not** change: White Rook DOO, seat in Serbia. In
the imprint/legal identity block the country name is localized (`Serbie`), the
registered company name, registry numbers and address are not.

## 4. What must NOT be translated

- **Service and blog slugs** — `interior-renders`, `day-to-dusk`, blog post
  slugs. They are frozen machine keys; only the visible label changes. (Same
  rule as the DE clone.)
  Public route *segments*, on the other hand, are French since 2026-09-17
  (`/tarifs`, `/commande`, `/a-propos`, `/carrieres`, `/informations-legales/…`,
  `/connexion`, `/inscription`, …; `/services` and `/contact` are already
  French). The route map and the 301s from the English paths live in
  `next.config.ts` — add a redirect whenever a route is renamed.
- **Code comments** — they are developer-facing and stay in English. Rewrite a
  comment only when it describes copy that no longer matches (e.g. a note about
  how long the headline is).
- Identifiers: variable/type/prop names, object keys, Prisma enum values,
  `sessionStorage` keys, custom-event names, CSS classes, `data-testid`.
- Brand and proper nouns: Elegant Render, White Rook DOO, AI Studio, PayPal,
  TÜV Rheinland, ISO 9001:2015, ISO/IEC 27001:2022, ISO 50001:2018, Bitrix24.
- Numbers, prices, SKUs, file names, image paths.

## 5. Layout safety

French is longer than English. After translating a component:

- Check headings that rely on a fixed `font-size` in `cqw`/`vw` or on
  `whitespace-nowrap` — the hero `h1` is the known case. Prefer a
  `clamp()` + `text-wrap: balance` fix (as the DE clone did) over letting the
  line overflow.
- Buttons and nav items: keep labels short (`Voir les tarifs`, not
  `Consulter la grille tarifaire`).
- Table headers and badges: abbreviate rather than wrap.

## 6. Glossary — use these exact terms

### Navigation & pages

| English | French |
|---|---|
| Services | Services |
| Pricing | Tarifs |
| Portfolio | Portfolio |
| About | À propos |
| Contact | Contact |
| FAQ | FAQ |
| Blog | Blog |
| Career | Carrières |
| AI Studio | AI Studio *(brand — keep)* |
| Legal information | Informations légales |
| Imprint | Mentions légales |
| Terms (of sale) | Conditions générales de vente (CGV) |
| Privacy policy | Politique de confidentialité |
| Cookie policy | Politique relative aux cookies |
| Right of withdrawal | Droit de rétractation |
| Refunds | Remboursements |
| Complaints procedure | Procédure de réclamation |
| Digital delivery | Livraison numérique |
| Certificates and standards | Certificats et normes |

### Services

| English | French |
|---|---|
| Architectural visualization | Visualisation architecturale |
| 3D render / rendering | rendu 3D |
| Interior renders | Rendus d’intérieur |
| Exterior renders | Rendus d’extérieur |
| 360° tour | Visite 360° |
| VR tour | Visite en réalité virtuelle (VR) |
| 3D streetscape | Perspective de rue 3D |
| Virtual staging | Home staging virtuel |
| Virtual renovation | Rénovation virtuelle |
| 2D / 3D floor plans | Plans 2D / Plans 3D |
| Architectural animation | Animation architecturale |
| Landscape design | Aménagement paysager |
| Photomontage | Photomontage |
| Site plans | Plans de masse |
| Day-to-dusk | Jour au crépuscule |
| Item removal | Suppression d’objets |

### Commerce & portal

| English | French |
|---|---|
| Order (noun / verb) | commande / commander |
| Quote, estimate | devis |
| Checkout | paiement |
| Cart | panier |
| Client portal | espace client |
| Sign in / Log out | Se connecter / Se déconnecter |
| Create an account, Register | Créer un compte |
| Draft | brouillon |
| Room | pièce |
| Shot, view | vue |
| Customer | client |
| Revision | révision |
| Invoice | facture |
| Add-on | option |
| Deliverables | livrables |
| Turnaround, delivery time | délai de livraison |
| Upload (verb) | importer |
| Download (verb) | télécharger |
| Brief | brief *(kept — used in French agencies)* |
| Before / after | Avant / après |
| Free, included | inclus |
| VAT | TVA |

---

*Written for the Fable 5 translation passes. Update it whenever a new term is
settled so later passes stay consistent.*
