# Platform Decisions

Ovaj dokument je lightweight decision/change log za ključne karakteristike Elegant Render platforme. Ažurira se kada promena utiče na conversion flow, pricing, brand/design pravila, order lifecycle, auth, payments, CRM sync, architecture ili druga ponašanja koja treba pamtiti kroz vreme.

Ne mora se ažurirati za male copy, styling ili refactor izmene koje ne menjaju ponašanje platforme, korisnički put ili važne tehničke odluke.

## Template

```md
## YYYY-MM-DD - Kratak naziv odluke

- **Oblast promene:** conversion | design | pricing | order lifecycle | auth | payments | CRM sync | architecture | docs | other
- **Šta se promenilo:** Kratak opis stvarne promene.
- **Zašto:** Razlog, cilj ili problem koji promena rešava.
- **Uticaj na conversion:** Nema / kratak opis.
- **Uticaj na design:** Nema / kratak opis.
- **Uticaj na code:** Nema / kratak opis.
- **Uticaj na docs:** Nema / koji dokumenti su ažurirani.
- **Povezani fajlovi:** `path/to/file.ts`, `path/to/doc.md`
- **Reference:** PR, commit, issue ili chat context ako postoji.
```

## 2026-05-19 - Codex on-demand agent team

- **Oblast promene:** docs
- **Šta se promenilo:** Uveden je Codex Agent Team Charter kao dokumentovani on-demand model za rad sa najviše 5 agent uloga.
- **Zašto:** Projekat treba spreman, ali ne always-on, agent sistem koji čuva conversion focus, jednostavan purposeful design, code quality i platform memory.
- **Uticaj na conversion:** Conversion Agent dobija jasnu odgovornost za najkraći put do sale, CTA clarity, pricing comprehension i funnel friction.
- **Uticaj na design:** UX / Design Agent dobija jasnu odgovornost za visual hierarchy, brand fit, responsive behavior, accessibility i purposeful UI.
- **Uticaj na code:** Nema runtime promene; Platform Engineer role upućuje na postojeća project rules za Next.js, Prisma, shadcn/Base UI, Tailwind i server actions.
- **Uticaj na docs:** Dodati `docs/agent-team-charter.md` i ovaj decision log; `AGENTS.md` dobija kratak pointer.
- **Povezani fajlovi:** `docs/agent-team-charter.md`, `docs/platform-decisions.md`, `AGENTS.md`
- **Reference:** User-approved implementation plan from Codex conversation.

## 2026-05-19 - Homepage conversion clarity and mobile-first CTA

- **Oblast promene:** conversion | design | docs
- **Šta se promenilo:** Naslovna strana je fokusirana na Expert usluge, sa AI Studio ponudom kao sekundarnim putem za postojeće slike. Hero CTA vodi direktno u konfigurator sa prefill proizvodom, dodati su proof/result primeri, search-intent kartice sada vode ka relevantnim grupama cena, a završni CTA vodi na izračunavanje budžeta umesto direktne porudžbine.
- **Zašto:** Posetilac treba brzo da razume vrednost: šta dobija, koji servis mu odgovara, koliko okvirno košta i šta je sledeći korak, posebno na mobilnom gde prvi ekran mora biti jednostavan.
- **Uticaj na conversion:** Smanjen je broj konkurentskih odluka u hero sekciji, primarni put sada vodi ka konfiguratoru i automatski dodaje odabranu uslugu kada korisnik dođe sa naslovne.
- **Uticaj na design:** Hero, proof blok, proces i mobilni cookie/chat ponašanje su podešeni da ne pretrpavaju prvi ekran i da vizuelno jasnije pokažu kvalitet rezultata.
- **Uticaj na code:** Dodata je URL prefill logika za konfigurator, novi PostHog event za prefill, popravljeno je ugnježdeno dugme u quote item kartici i GTM `beforeInteractive` script je premešten u `body` po Next.js smernicama.
- **Uticaj na docs:** Ažuriran ovaj decision log.
- **Povezani fajlovi:** `src/components/marketing/quick-order-hero.tsx`, `src/components/marketing/results-proof.tsx`, `src/app/(marketing)/page.tsx`, `src/components/configurator/pricing-configurator.tsx`, `src/components/configurator/quote-item.tsx`, `src/components/site/consent-banner.tsx`, `src/components/chat/chat-widget.tsx`, `src/app/layout.tsx`, `docs/platform-decisions.md`
- **Reference:** User-approved homepage review and mobile conversion improvements from Codex conversation.
