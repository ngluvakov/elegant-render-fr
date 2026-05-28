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

## 2026-05-29 - Banca Intesa Nestpay kartično plaćanje (3D Pay Hosting)

- **Oblast promene:** payments | order lifecycle | conversion | architecture
- **Šta se promenilo:** Implementirana je integracija sa Banca Intesa Nestpay HPP redirect gateway-em (`storetype=3d_pay_hosting`, `hashAlgorithm=ver2`, `currency=941` RSD). Novi `paymentProvider=nestpay` postoji uz PayPal i wire transfer; legacy `card_mock` ostaje samo iza `NEXT_PUBLIC_NESTPAY_MODE=test` za dev. Bank kliring je u dinarima — RS kupci vide RSD bruto sa PDV razbijanjem, strani kupci vide EUR + obaveznu "Izjavu o konverziji" sa snapshotovanim RSD ekvivalentom (`Order.nestpayChargedAmountCents`, `nestpayChargeRate`).
- **Zašto:** Lokalna karta (Visa/MC kroz domaću banku) je najjeftiniji i najpovoljniji način plaćanja za RS klijente; bez nje konverzija na "Plaćam" padaju jer PayPal i wire transfer ne pokrivaju ceo segment. Banca Intesa Nestpay je usaglašen sa Uputstvom za rad EPM v3.5 koje banka traži pre go-live.
- **Uticaj na conversion:** Veća konverzija u step-payment-u (uklanjamo "samo PayPal" friction); single return URL + Status Query reconciler smanjuju "izgubljene transakcije" (zatvoren tab) sa 5+ min do pune recovery.
- **Uticaj na design:** Novi izbor "Kartica (Banca Intesa)" tile na step-payment, obavezni "Saglasan sa Opštim uslovima" checkbox, Cloudflare Turnstile za guest, brand badge strip (Visa/Visa Secure/MC/MC ID Check/Banca Intesa) u footer-u i u step-payment-u. Uspeh/neuspeh strane prikazuju 7 transakcionih parametara po standardu 2.7.
- **Uticaj na code:** `src/lib/nestpay/` (config + ver2 hash + oid + HPP client + CC5 status query + response parser); `src/server/actions/nestpay.ts` (`initiateNestpayPayment`); `src/server/actions/payment.ts` (`finishFailedPayment`, success email routing po provideru); `src/app/api/nestpay/return/route.ts` (jedinstveni okUrl + failUrl handler sa hash verifikacijom); `src/app/api/cron/nestpay-reconcile/route.ts` + `src/server/finance/reconcile-nestpay.ts` (Order Status Query reconciler, `*/5 * * * *`); `src/lib/email.ts` (`sendPaymentSuccessEmail`/`sendPaymentFailureEmail` sa 5 obaveznih blokova); `src/lib/outbox.ts` (handleri za `payment_success_email`, `payment_failure_email`); `src/components/ui/turnstile-widget.tsx`, `src/lib/turnstile.ts`; `src/components/marketing/payment-trust-badges.tsx`; nove pravne strane `pravno/reklamacije`, `pravno/povracaj-sredstava`, `pravno/dostava`.
- **Uticaj na docs:** Ovaj decision log; `.env.example` proširen (NESTPAY_*, TURNSTILE_*).
- **Povezani fajlovi:** vidi listu iznad + `prisma/schema.prisma`, `prisma/migrations/20260529000000_add_nestpay_provider/migration.sql`, `vercel.json`, `src/lib/content/site.ts` (NAV_LEGAL proširenje), `src/components/portal/pending-payment-card.tsx`, `src/app/(marketing)/poruci/steps/step-payment.tsx`, `src/app/(marketing)/poruci/nestpay-redirect-form.tsx`, `src/app/(marketing)/poruci/uspeh/page.tsx`, `src/app/(marketing)/poruci/neuspeh/page.tsx`.
- **Reference:** User request: "Treba da na sajt implementiramo placanje karticama" + "Za strane kupce hocu da se vidi i Eur i konverzija u RSD". Plan: `~/.claude/plans/imam-jedno-takmicenje-izmedju-dreamy-reef.md`.
- **Open items pre go-live:**
  - U Vercel Production env unesi prave kredencijale: `NESTPAY_CLIENT_ID`, `NESTPAY_STORE_KEY`, `NESTPAY_QUERY_USERNAME`, `NESTPAY_QUERY_PASSWORD`, `NESTPAY_BASE_URL=https://bib.eway2pay.com/fim/est3Dgate`, `NESTPAY_QUERY_URL=https://bib.eway2pay.com/fim/api`, `NEXT_PUBLIC_NESTPAY_MODE=live`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.
  - Smesti zvanične SVG logoe u `public/branding/payments/` (visa.svg, visa-secure.svg, mastercard.svg, mastercard-id-check.svg, banca-intesa.svg).
  - Konfiguriši okUrl + failUrl u Merchant Center-u na `https://elegantrender.rs/api/nestpay/return`.
  - Odradi sve test scenarije iz `docs/Placanje karticama/Primeri testnih case-ova.xls` (tab SMS test cases) sa Banca Intesa test karticama i export-uj transakcionu tabelu iz Merchant Center-a. Pošalji na `ecomm_podrska@bancaintesa.rs` zajedno sa screenshot-ima pravnih strana.

## 2026-05-27 - RSD cene sa PDV-om bez dodatnog uvećanja

- **Oblast promene:** pricing | order lifecycle | docs
- **Šta se promenilo:** RSD cene za Srbiju sada se računaju direktnim prevođenjem EUR iznosa po objavljenom kursu. PDV je uračunat u taj RSD bruto iznos i izdvaja se iz njega na checkout-u, predračunima i računima, umesto da se dodaje preko konvertovane cene.
- **Zašto:** Cene za Srbiju i ostale zemlje treba da budu faktički iste, uz lokalno ispravan prikaz PDV-a za srpske račune.
- **Uticaj na conversion:** Smanjuje se percepcija da su cene za Srbiju skuplje zbog dodatnog PDV sloja.
- **Uticaj na design:** Copy u javnom cenovniku, checkout-u, AI Studio i profilu precizira “PDV uračunat”.
- **Uticaj na code:** Centralni public/billing helper-i više ne množe RSD cenu sa `(1 + PDV)`, a breakdown računa osnovicu i PDV iz bruto RSD iznosa.
- **Uticaj na docs:** Ažurirani su uslovi korišćenja, AI-readable pricing tekstovi i ovaj decision log.
- **Povezani fajlovi:** `src/lib/catalog/display-currency.ts`, `src/lib/billing.ts`, `src/app/(marketing)/poruci/steps/step-review.tsx`, `src/app/(marketing)/pravno/uslovi/page.tsx`, `src/lib/llms.ts`, `docs/platform-decisions.md`
- **Reference:** User request: "Hoću da cene u evrima budu prevedene u RSD, ali da u toj ceni bude već uračunat i PDV."

## 2026-05-25 - Superadmin account access update

- **Oblast promene:** auth
- **Šta se promenilo:** Nalog `stevanranca@gmail.com` je osvežen/kreiran kao Super Admin sa svih 13 admin permisija, uključujući finance i admin-access upravljanje. Lozinka je resetovana po zahtevu, ali nije upisana u repo dokumentaciju.
- **Zašto:** Vlasničkom/operativnom korisniku je potreban pun pristup platformi.
- **Uticaj na conversion:** Nema direktnog uticaja.
- **Uticaj na design:** Nema.
- **Uticaj na code:** Nema izmene runtime koda; promena je direktna DB izmena na `users` i prateći `audit_logs` zapis.
- **Uticaj na docs:** Ažuriran ovaj decision log.
- **Povezani fajlovi:** `docs/platform-decisions.md`
- **Reference:** User request: "Dodaj jedan superadmin nalog. stevanranca@gmail.com sifru stavi neku laku"

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
