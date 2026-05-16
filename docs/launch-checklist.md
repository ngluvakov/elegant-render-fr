# Launch checklist — placeholders to fill in pre-launch

Konsolidovana lista svake „REPLACE before launch" / „TBD" / „u toku"
tačke razasute po kodu. Štampaj, popunjavaj kako podaci stižu, brisaj
checked-off stavke nakon što budu live.

Postojeći dokumenti za detalje:
- [`docs/payments-implementation-plan.md`](payments-implementation-plan.md) — pune faze A-F payment integracije
- [`docs/ga4-post-launch.md`](ga4-post-launch.md) — Google Analytics 4 setup
- [`docs/gtm-post-launch.md`](gtm-post-launch.md) — Google Tag Manager setup
- [`docs/compliance/`](compliance/) — pravne reference

---

## 1. Bankovni račun (Banca Intesa) — za predračun PDF

**Gde u kodu:** [`src/lib/content/site.ts`](../src/lib/content/site.ts) → `IMPRINT.bank`

```ts
bank: {
  name: "Banca Intesa AD Beograd",  // potvrdi tačan zvanični naziv
  iban: "RS35 1600 0000 0000 0000 00", // ←  REPLACE
  swift: "DBDBRSBG",                   // ←  REPLACE ako se razlikuje
  accountNumber: "160-0000000000-00",  // ←  REPLACE (RSD domaći račun)
}
```

**Treba:**
- [ ] Tačan naziv banke (Banca Intesa AD Beograd vs druga varijanta)
- [ ] IBAN format `RS__ ____ ____ ____ ____ __`
- [ ] SWIFT/BIC (8 ili 11 karaktera)
- [ ] Domaći broj računa za RSD uplate (`___-___________-__`)

**Izvor:** Ugovor sa Banca Intesa / poslovni račun portal.

**Kad nije popunjeno:** predračun PDF (`/api/portal/proforma/[orderId]`) pokazuje placeholder vrednosti — kupci ne mogu da plate jer je IBAN izmišljen.

---

## 2. EU GDPR predstavnik (čl. 27 GDPR)

**Gde u kodu:** [`src/lib/content/site.ts`](../src/lib/content/site.ts) → `IMPRINT.euRepresentative`

```ts
euRepresentative: null as null | { name: string; address: string; email: string },
// ↑ replace null sa { name, address, email } objektom kad imenujemo predstavnika
```

**Treba:**
- [ ] Provider odabran (preporuka: **Prighter** ~€100/god, ili EuRep, Privacy Policies)
- [ ] Ugovor potpisan
- [ ] Naziv pravnog lica predstavnika
- [ ] Adresa u nekoj EU zemlji
- [ ] Email kontakt

**Izvor:** Provider direktno (samostalna registracija).

**Kad nije popunjeno:** stranice [`/pravno/impressum`](../src/app/(marketing)/pravno/impressum/page.tsx) i [`/pravno/privatnost`](../src/app/(marketing)/pravno/privatnost/page.tsx) glase „postupak imenovanja predstavnika u EU je u toku" — pravno tolerisano kratko vreme, ali tehnički neusklađeno za EU rezidente koji žele formalni kontakt.

---

## 3. Banca Intesa EFT-POS Web (Faza B)

**Gde u kodu:** ne postoji — Faza B nije implementirana, čeka kredencijale.

**Treba (env vars za Vercel):**
```env
INTESA_MERCHANT_ID=
INTESA_TERMINAL_ID=
INTESA_HMAC_KEY=
INTESA_GATEWAY_URL=https://...        # produkcioni
INTESA_TEST_GATEWAY_URL=https://...   # sandbox
INTESA_CALLBACK_URL=https://elegantrender.rs/api/payments/intesa/callback
```

**Treba dodatno:**
- [ ] Merchant ugovor potpisan
- [ ] Lista IP adresa za webhook callback whitelist
- [ ] Format response/callback dokumentacija od banke
- [ ] Test kredencijali za sandbox

**Izvor:** Banca Intesa POS odeljenje, posle potpisivanja ugovora.

**Kad nije popunjeno:** kupci mogu samo PayPal-om. PayPal flow radi end-to-end (sa konačnim računom), pa nije launch blocker — ali Intesa proširuje payment opcije.

**Detalji implementacije:** Faza B u [`docs/payments-implementation-plan.md`](payments-implementation-plan.md#faza-c--banca-intesa-eft-pos-web-integracija).

---

## 4. SEF e-faktura posrednik (Faza D)

**Gde u kodu:** ne postoji — Faza D nije implementirana, čeka odluku o posredniku.

**Odluka:**
- [ ] **Moj-eRačun** (preporuka — najveći u Srbiji, REST API), ili
- [ ] **e-Solutions**, ili
- [ ] direktna SEF integracija (UBL 2.1 XML + certifikat — više setup-a, bez recurring fee-a)

**Treba (env vars):**
```env
SEF_PROVIDER=moj-eracun     # ili e-solutions
SEF_API_KEY=
SEF_WEBHOOK_SECRET=
```

**Treba dodatno:**
- [ ] Nalog na SEF-u (`efaktura.mfin.gov.rs`) za White Rook DOO
- [ ] Pretplata kod posrednika (~30-50 EUR/mesec)
- [ ] Test PIB za sandbox potvrdu

**Izvor:** Direktno kod posrednika.

**Kad nije popunjeno:** B2B-RS fakture (`buyerType=company_rs`) izlaze samo kao PDF — pravna obaveza je da idu kroz SEF. Manuelno gurnuće kroz SEF web interfejs je rešenje za prelazni period.

**Detalji:** Faza D u [`docs/payments-implementation-plan.md`](payments-implementation-plan.md#faza-d--sef-e-faktura-za-b2b-rs).

---

## 5. ESIR fiskalizacija (Faza E)

**Gde u kodu:** ne postoji — Faza E nije implementirana, čeka odluku o provider-u.

**Odluka:**
- [ ] **Tehnocom** (popularan, REST API), ili
- [ ] **Iglu**, ili
- [ ] **BIT**, ili
- [ ] **Datalab**

**Treba (env vars):**
```env
ESIR_PROVIDER=tehnocom
ESIR_API_KEY=
ESIR_PAC=                  # Personal authorization code od Poreske uprave
ESIR_REGISTRATION_ID=
```

**Treba dodatno:**
- [ ] LPFR ili VPFR sertifikat (lokalni ili cloud procesor fiskalnih računa)
- [ ] PAC kod od Poreske uprave Srbije
- [ ] Pretplata (~50 EUR/mesec)

**Izvor:** Provider + Poreska uprava Republike Srbije.

**Kad nije popunjeno:** B2C-RS porudžbine (`buyerType=individual` + Srbija) izlaze samo kao PDF — Zakon o fiskalizaciji obavezuje fiskalni račun sa QR kodom za maloprodaju u Srbiji. Bez ovoga, B2C-RS prodaja je u pravnom riziku.

**Detalji:** Faza E u [`docs/payments-implementation-plan.md`](payments-implementation-plan.md#faza-e--fiskalizacija-b2c-rs-preko-esir-a).

---

## 6. Cloudmersive antivirus (Vercel Production)

**Gde u kodu:** [`src/lib/file-scan.ts`](../src/lib/file-scan.ts) — koristi `process.env.CLOUDMERSIVE_API_KEY`.

**Status:** lokalno postavljeno u `.env.local`. Production Vercel još nije.

**Treba:**
- [ ] Vercel → Project Settings → Environment Variables → Production + Preview
- [ ] `CLOUDMERSIVE_API_KEY=<key iz .env.local>`
- [ ] Sledeći deploy

**Kad nije popunjeno:** svaki upload (checkout, inquiry, AI Studio) vraća „scan unavailable" i fajl se odbija. Klijenti ne mogu da poruče bez fajla.

---

## 7. Pravni pregled draftova

**Gde u kodu:** sve tri stranice imaju vidljiv „radna verzija" callout:
- [`src/app/(marketing)/pravno/privatnost/page.tsx`](../src/app/(marketing)/pravno/privatnost/page.tsx)
- [`src/app/(marketing)/pravno/uslovi/page.tsx`](../src/app/(marketing)/pravno/uslovi/page.tsx)
- [`src/app/(marketing)/pravno/kolacici/page.tsx`](../src/app/(marketing)/pravno/kolacici/page.tsx)

**Treba:**
- [ ] Advokat pregleda Politiku privatnosti
- [ ] Advokat pregleda Uslove korišćenja
- [ ] Advokat pregleda Politiku kolačića
- [ ] Ukloniti „radna verzija" callout boxove iz svake strane (clay-tinted blok na vrhu)
- [ ] Update `LAST_UPDATED` datum u svakoj strani na datum advokatske verifikacije

**Kad nije popunjeno:** stranice se javno čitaju sa „pre javne upotrebe biće predat na pravni pregled" disclajmer-om — vidljivo svakom kupcu i regulatoru.

---

## 8. Direktor / telefon (Impressum) — opciono

**Gde u kodu:** [`src/lib/content/site.ts`](../src/lib/content/site.ts) → `IMPRINT`

Trenutno se ne prikazuju na [`/pravno/impressum`](../src/app/(marketing)/pravno/impressum/page.tsx). Zakon o elektronskoj trgovini čl. 7 ne traži ime direktora ni telefon (email zadovoljava „brzi i direktni kontakt").

**Opciono dodati:**
- [ ] Ime zakonskog zastupnika (direktora)
- [ ] Telefon kompanije (ako postoji javni broj)

Ako se doda, proširi `IMPRINT` const + render u impressum page.

---

## 9. GA4 (Google Analytics 4)

Već dokumentovano u [`docs/ga4-post-launch.md`](ga4-post-launch.md).

**Brzi presek:**
- [x] Kreiran GA4 property za produkcionu domenu
- [x] `NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-5090C2WQVB`
- [ ] `NEXT_PUBLIC_GA4_ENABLED=false` (Vercel, jer GA4 ide kroz GTM)
- [ ] `GOOGLE_ANALYTICS_DASHBOARD_URL=https://analytics.google.com/...`

---

## 10. GTM (Google Tag Manager)

Već dokumentovano u [`docs/gtm-post-launch.md`](gtm-post-launch.md).

**Brzi presek:**
- [x] Kreiran GTM Web container za produkcionu domenu
- [x] `NEXT_PUBLIC_GTM_CONTAINER_ID=GTM-5X2MCQ87`
- [ ] `NEXT_PUBLIC_GTM_ENABLED=true` (Vercel)
- [ ] `GOOGLE_TAG_MANAGER_DASHBOARD_URL=https://tagmanager.google.com/...`
- [x] GA4 ide kroz GTM; direct GA4 tag ostaje isključen da nema duplih pageview-ova

---

## 11. Google Search Console

**Status:** sajt već ima `robots.txt` i `sitemap.xml`. Domen koristi third-party
nameservere (`ns739.adriahost.com`, `ns740.adriahost.com`), pa DNS verifikacija
ide kroz Adriahost panel, ne kroz Vercel.

**Treba:**
- [ ] Kreirati Search Console property za `https://elegantrender.rs/`
- [ ] Preporučeno: DNS TXT verifikacija na Adriahost-u
- [ ] Alternativa: HTML tag verifikacija preko `GOOGLE_SITE_VERIFICATION`
- [ ] `GOOGLE_SEARCH_CONSOLE_URL=https://search.google.com/search-console?resource_id=https%3A%2F%2Felegantrender.rs%2F`
- [ ] Submit sitemap: `https://elegantrender.rs/sitemap.xml`

---

## 12. Sentry projekat za produkciju

**Gde u kodu:** [`src/instrumentation-client.ts`](../src/instrumentation-client.ts) — koristi `NEXT_PUBLIC_SENTRY_DSN`.

**Status:** dev DSN postavljen lokalno. Production trebaobi imati zaseban projekat.

**Treba:**
- [ ] Sentry → New Project → Next.js → Production
- [ ] DSN u Vercel env: `NEXT_PUBLIC_SENTRY_DSN=<production-dsn>`
- [ ] (opciono) `SENTRY_AUTH_TOKEN` za source map upload tokom build-a

---

## 13. Resend domen verifikacija

**Gde u kodu:** [`src/lib/email.ts`](../src/lib/email.ts) — `from = "..."` adresa.

**Treba:**
- [ ] Verifikovati `elegantrender.rs` domen u Resend dashboard-u
- [ ] DKIM + SPF zapis u DNS
- [ ] Update `from` u email.ts na produkcionu adresu (`noreply@elegantrender.rs` ili sl.)

**Kad nije popunjeno:** email-ovi (potvrde porudžbine, faktura PDF-ovi, predračun PDF-ovi, AI credit grants) se ne šalju ili landiraju u Spam.

---

## Quick reference — sve env vars na jednom mestu

```env
# Stage 1 — neophodno za launch (90% funkcionalnosti)
CLOUDMERSIVE_API_KEY=
NEXT_PUBLIC_SENTRY_DSN=
RESEND_API_KEY=
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
AUTH_SECRET=
AUTH_URL=

# Stage 2 — kad odluke padnu
INTESA_MERCHANT_ID=
INTESA_TERMINAL_ID=
INTESA_HMAC_KEY=
INTESA_GATEWAY_URL=
INTESA_CALLBACK_URL=

SEF_PROVIDER=
SEF_API_KEY=
SEF_WEBHOOK_SECRET=

ESIR_PROVIDER=
ESIR_API_KEY=
ESIR_PAC=
ESIR_REGISTRATION_ID=

# Marketing
NEXT_PUBLIC_GA4_ENABLED=false
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-5090C2WQVB
GOOGLE_ANALYTICS_DASHBOARD_URL=
NEXT_PUBLIC_GTM_ENABLED=true
NEXT_PUBLIC_GTM_CONTAINER_ID=GTM-5X2MCQ87
GOOGLE_TAG_MANAGER_DASHBOARD_URL=
GOOGLE_SEARCH_CONSOLE_URL=https://search.google.com/search-console?resource_id=https%3A%2F%2Felegantrender.rs%2F
GOOGLE_SITE_VERIFICATION=
```
