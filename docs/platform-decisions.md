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

## 2026-05-24 - Search and AI discovery readiness

- **Oblast promene:** conversion | architecture | docs
- **Šta se promenilo:** Public metadata, sitemap alternates, robots host, schema.org JSON-LD and AI-readable `llms.txt` content are tightened for SEO, GEO and AEO readiness. Portal and checkout surfaces are explicitly noindex, while public service, pricing, FAQ and trust pages expose canonical, answer-friendly, machine-readable context.
- **Zašto:** Search engines and AI answer engines need one canonical source of truth for identity, services, prices, trust signals and crawl boundaries.
- **Uticaj na conversion:** Bolja vidljivost javnih stranica i jasniji machine-readable put ka uslugama, cenama i kontaktu.
- **Uticaj na design:** Nema promene vizuelnog dizajna.
- **Uticaj na code:** Centralizovani metadata helpers sada dodaju self-referencing hreflang, keywords, publisher/creator metadata i bogatiji JSON-LD; sitemap dodaje language alternates; portal layout nameće noindex za sve private rute.
- **Uticaj na docs:** Ažuriran ovaj decision log.
- **Povezani fajlovi:** `src/lib/seo.ts`, `src/lib/llms.ts`, `src/app/layout.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/portal/layout.tsx`, `src/app/(marketing)/usluge/vr/konsultacija/page.tsx`, `src/app/(marketing)/pravno/sertifikati/page.tsx`, `docs/platform-decisions.md`
- **Reference:** User request: "Please make sure that the platform is SEO, GEO and AEO ready."

## 2026-05-20 - LinkedIn Insight Tag sa marketing saglasnošću

- **Oblast promene:** conversion | marketing | legal | docs
- **Šta se promenilo:** Dodat je LinkedIn Insight Tag za partner ID `9178042`, ali se učitava samo kada posetilac uključi novu kategoriju saglasnosti `Marketing`.
- **Zašto:** LinkedIn kampanje treba da mogu da mere posete i konverzije bez mešanja advertising/retargeting svrhe u postojeću analitičku saglasnost.
- **Uticaj na conversion:** Omogućava LinkedIn campaign attribution i publike za buduće kampanje, uz očekivani manji signal jer korisnik mora dati marketing consent.
- **Uticaj na design:** Cookie banner dobija dodatni red za marketing u podešavanjima; nema promene javnog vizuelnog identiteta.
- **Uticaj na code:** Consent schema je podignuta na verziju 2, što traži ponovnu potvrdu izbora kolačića; dodat je consent-gated LinkedIn client tag.
- **Uticaj na docs:** Ažurirani su politika kolačića, politika privatnosti i ovaj decision log.
- **Povezani fajlovi:** `src/lib/consent.ts`, `src/components/site/consent-banner.tsx`, `src/components/analytics/linkedin-insight-tag.tsx`, `src/app/layout.tsx`, `src/app/(marketing)/pravno/kolacici/page.tsx`, `src/app/(marketing)/pravno/privatnost/page.tsx`, `src/app/portal/admin/analitika/page.tsx`, `docs/platform-decisions.md`
- **Reference:** User-provided LinkedIn Insight Tag snippet.

## 2026-05-19 - AI Studio guest-credit funnel and visual proof

- **Oblast promene:** conversion | design | pricing | auth | architecture | docs
- **Šta se promenilo:** `/ai-studio` sada vodi hladne posetioce primarno ka javnoj kupovini AI kredita kroz `/poruci`, dok je otvaranje portala sekundarni put za postojeće korisnike. Protected portal redirect čuva ceo `callbackUrl` sa query stringom, login/registracija/Google vraćaju korisnika na isti `/portal/ai-studio?tool=...` tok, a hero dobija dominantan before/after proof, trust signale i jasniju cenu/PDV komunikaciju.
- **Zašto:** AI Studio je self-serve proizvod; login-wall pre kupovine prekida nameru, a stranica mora odmah da pokaže kvalitet rezultata i objasni šta korisnik dobija za kredit.
- **Uticaj na conversion:** Smanjeno je trenje za nove korisnike: kupovina kredita ide kroz guest checkout, a izbor alata se ne gubi posle auth-a.
- **Uticaj na design:** Hero je pomeren sa “SaaS katalog” osećaja ka premium real-estate before/after dokazu; mobile kartice koriste srpske kratke nazive i chat se ne prikazuje na AI Studio landing strani da ne kolidira sa mobile credit dock-om.
- **Uticaj na code:** Dodati auth callback sanitization, request-scoped memoization za public pricing/currency lookup, javni AI credit checkout button i jasniji tax label za RSD/EUR prikaz.
- **Uticaj na docs:** Usklađen AI Studio service doc sa stvarnim brojem besplatnih ponavljanja.
- **Povezani fajlovi:** `src/app/(marketing)/ai-studio/page.tsx`, `src/components/marketing/ai-studio/credit-buy-dock.tsx`, `src/components/marketing/ai-studio/credit-checkout-button.tsx`, `src/proxy.ts`, `src/server/actions/auth.ts`, `src/app/(auth)/prijava/page.tsx`, `src/app/(auth)/registracija/page.tsx`, `src/lib/auth-redirect.ts`, `src/lib/catalog/public-currency-server.ts`, `src/server/pricing/catalog.ts`, `src/lib/content/site.ts`, `docs/ai-studio-usluge.md`
- **Reference:** Codex agent-team review and user request to apply recommendations.

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
