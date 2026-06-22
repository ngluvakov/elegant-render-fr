# NestPay — prelazak na produkciju (Banca Intesa pilot)

> **Cilj:** prebaciti kartično plaćanje sa NestPay **test** gateway-a
> (`testsecurepay.eway2pay.com`) na **produkcioni** (`bib.eway2pay.com`),
> uraditi pilot transakciju sa bankom, pa preći na zvaničnu produkciju.
>
> **Tip transakcije:** **SMS (Auth)** — trenutno zaduženje (sredstva se odmah skidaju sa kartice).
>
> **Ključno:** integracija je env-driven. Nema promene koda. Sve se radi u
> **Merchant Center-u** + **Vercel env-u** + **odgovorom banci**.

---

## 🔐 Pravilo o tajnama (pročitaj prvo)

**Nijedan kredencijal se ne upisuje ni u jedan fajl u repo-u** (ovaj dokument se commit-uje).
Tajne idu **samo u password manager** (login za MC, Store Key) i **u Vercel env** (Store Key,
API kredencijali, Turnstile secret). Push na `main` = produkcioni deploy, a tajna u git istoriji
ostaje trajno.

Tajne (NIKAD u tracked fajl): **Merchant Center User Name + Password**, **Store Key**,
**API role username/password**, **Turnstile secret**.
Nije tajna (sme u repo/env): **Merchant ID `13IN004509`** (= `NESTPAY_CLIENT_ID`), URL-ovi.

---

## ⚠️ Pre svega — zamka sa parametrima iz mejla

Onboarding mejl banke daje tri parametra. **Vrednosti drži u password manager-u**, ne ovde:

| Parametar | Vrednost | Šta je to |
|---|---|---|
| Merchant ID | `13IN004509` | ide u env `NESTPAY_CLIENT_ID` (nije tajna) |
| User Name | *(iz mejla → password manager)* | **samo login za Merchant Center** |
| Password | *(iz mejla → password manager)* | **samo login za MC** (menja se pri prvoj prijavi) |

**User Name / Password iz mejla NISU Store Key i NISU API kredencijali.** To su samo podaci za
prijavu na portal banke. Pravi **Store Key** (tajna za hash) i **API role** (za reconcile) vade
se / kreiraju **unutar** produkcionog Merchant Center-a (koraci ispod). Ako u `NESTPAY_STORE_KEY`
ostane test ključ → hash ne valja → **banka odbija svako plaćanje.**

---

## Korak 1 — Produkcioni Merchant Center

Portal: **https://bib.eway2pay.com/bib/report/user.login**

- [ ] Prijavi se sa `Merchant ID = 13IN004509` + User/Password iz mejla (password manager).
- [ ] **Prva prijava** te tera da postaviš **novu lozinku** + **e-mail za reset lozinke**
      (opcija „Zaboravljena lozinka"). Sačuvaj novu lozinku **u password manager** (NE u repo).
      Tretiraj početnu lozinku iz mejla kao kompromitovanu — promeni je odmah.
- [ ] **Store Key:** otvori `Administration → Store Key`, kopiraj (ili postavi novi) ključ.
      → ova vrednost ide u env `NESTPAY_STORE_KEY` (vidi Korak 2). Drži je u password manager-u.
- [ ] **API role:** kreiraj API korisnika u produkciji (banka traži poseban API role za
      API zahteve — PDF §5.5). Njegov username/password idu u
      `NESTPAY_QUERY_USERNAME` / `NESTPAY_QUERY_PASSWORD`.
      → koristi ih **reconcile cron** (Order Status Query, oporavak za zatvoren tab / izgubljen
      POST). **Pažnja:** pogrešni/nepostojeći API kredencijali su **tihi** — obična uspešna
      transakcija ih ne koristi, pa pilot izgleda ispravno čak i ako ne rade. Verifikacija je u
      Koraku 5.
- [ ] **Registracija domena u MC (ako MC ima to polje):** registruj/štikliraj store URL
      `https://elegantrender.rs` kao dozvoljen callback domen (anti-open-redirect).
      **NAPOMENA:** stvarne `okUrl`/`failUrl` se **ne čitaju iz MC** — integracija ih sama
      generiše iz env `AUTH_URL` i šalje kao potpisana HPP polja. Zato je presudna env vrednost
      `AUTH_URL` (Korak 2), a MC unos je samo dozvola domena. Ciljani return URL je
      `https://elegantrender.rs/api/nestpay/return`.

> Test ↔ produkcija imaju **odvojene** Merchant ID / User / Password / Store Key.
> Ništa iz test okruženja ne važi na produkciji.

---

## Korak 2 — Vercel Production env

Vercel → projekat → **Settings → Environment Variables**, scope **Production**.
Postavi/izmeni sledeće, pa **Redeploy**:

| Env var | Vrednost |
|---|---|
| `NEXT_PUBLIC_NESTPAY_MODE` | `live` |
| `NESTPAY_CLIENT_ID` | `13IN004509` |
| `NESTPAY_BASE_URL` | `https://bib.eway2pay.com/fim/est3Dgate` |
| `NESTPAY_QUERY_URL` | `https://bib.eway2pay.com/fim/api` |
| `NESTPAY_STORE_KEY` | *(iz Koraka 1 — Store Key; tajna)* |
| `NESTPAY_QUERY_USERNAME` | *(iz Koraka 1 — API role)* |
| `NESTPAY_QUERY_PASSWORD` | *(iz Koraka 1 — API role; tajna)* |
| `NESTPAY_TRAN_TYPE` | `Auth` (SMS — ostaje, ne menjati) |
| `NESTPAY_OID_PREFIX` | `ER-` (ostaje) |
| `AUTH_URL` | `https://elegantrender.rs` ⚠️ **BEZ kose crte na kraju** |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | *(pravi Cloudflare Turnstile site key)* |
| `TURNSTILE_SECRET_KEY` | *(pravi Cloudflare Turnstile secret; tajna)* |

- [ ] Sve gore postavljeno na **Production** scope.
- [ ] ⚠️ **`AUTH_URL` bez trailing slash-a:** `https://elegantrender.rs` (NE `.../`). Mejl banke
      navodi URL prodavnice **sa** kosom crtom — ne kopiraj je. Kod spaja `/api/nestpay/return`
      na ovu vrednost; trailing slash daje duplu kosu crtu (`...rs//api/nestpay/return`) koja ulazi
      u hash i return path → uzrok „hash/redirect ne valja".
- [ ] ⚠️ **`NESTPAY_HASH_DEBUG` mora biti UNSET** (nikad `1`) na Production scope-u — i sad i pri
      rollback-u. (U `live` modu je debug endpoint ugašen; ali rollback na `test` mod ga ponovo
      pali i tada bi curilo: StoreKey hash/fingerprint/dužina, clientId i bankina polja. Dijagnostiku
      radi lokalno — vidi Korak 5.)
- [ ] `NEXT_PUBLIC_NESTPAY_INSTALLMENTS_ENABLED` ostaje `false` (osim ako ugovor eksplicitno
      uključuje plaćanje na rate).
- [ ] Potvrdi da je `CRON_SECRET` postavljen u Production (postojeća platform tajna koju koriste i
      drugi cron-ovi; gejtuje pozivaoca cron-a, nema veze sa NestPay API-jem).
- [ ] **Redeploy** produkcije (da `NEXT_PUBLIC_*` varijable uđu u build).

> ⚠️ **Čim uradiš Redeploy, produkciono kartično plaćanje je ŽIVO za sve posetioce** (mock kartica
> se gasi, dugme „Plati karticom" vodi na `bib.eway2pay.com`) — i pre nego što banka potvrdi pilot.
> Da realni kupci ne bi platili pre pilota, **uradi Redeploy tačno pred dogovoreni pilot termin
> (posle 14h)**, ne sat/sate unapred. Ako nešto pođe loše → Rollback (dole).

> Napomena: `NEXT_PUBLIC_*` varijable se „peku" u build, pa je redeploy obavezan.
> Tajne se unose **samo** u Vercel / password manager — nikad u `.env.example`, kod ili commit.

---

## Korak 3 — Sanity provera posle deploya (pre pilota)

- [ ] **Provera da nema tajni u repo-u** (pre commit-a/push-a): pokreni
      `git grep -i '<MC-lozinka>'` i `git grep -i '<MC-user>'` (zameni stvarnim vrednostima iz
      password manager-a) → oba moraju da vrate **prazno**. Isto i za Store Key.
- [ ] Otvori `https://elegantrender.rs/poruci` i dođi do koraka plaćanja —
      **mock kartica više ne sme da postoji** (automatski se gasi u `live` modu).
- [ ] Turnstile captcha se učitava bez greške (znači pravi ključevi rade).
- [ ] Klik na „Plaćam karticom" redirektuje na **`bib.eway2pay.com`** HPP stranicu
      (NE `testsecurepay`). *Na ovom mestu ne unositi karticu dok ne dogovoriš pilot sa bankom.*
- [ ] **Provera return URL-a u HPP formi:** u DevTools → Network/Elements pogledaj skrivenu formu
      pre redirecta — polja `okUrl` i `failUrl` MORAJU biti `https://elegantrender.rs/api/nestpay/return`,
      **ne** `http://localhost:3000/...`. (Ako `AUTH_URL` nedostaje/pogrešan je, kod tiho pada na
      `localhost`, hash i return path ne odgovaraju, a ostatak provere i dalje prolazi.)

---

## Korak 4 — Javi se banci (posle 14h)

Pošalji mejl (po potrebi na `ecomm_podrska@BancaIntesa.rs`). Nacrt:

> **Predmet:** Elegant Render (13IN004509) — spremni za pilot test (produkcija)
>
> Poštovani,
>
> Zamenili smo testne parametre produkcionim i prodajno mesto je spremno za pilot test.
> Molimo vas da zakažemo pilot proveru danas posle 14h.
>
> Tip transakcije koji ćemo koristiti: **SMS (Sale – SingleMessage – Auth)** — automatska naplata.
>
> Obradu transakcija (postauth, void, refund) kroz Merchant Center prezentovaćemo nadležnim
> osobama u kompaniji.
>
> Hvala i pozdrav,
> [ime / kontakt]

- [ ] Mejl poslat, pilot termin dogovoren.

---

## Korak 5 — Pilot test (sa bankom)

> ⚠️ **SMS (Auth) = trenutna, automatska naplata.** Odobrenje ODMAH: (a) naplaćuje karticu,
> (b) izdaje **pravu fakturu** u produkcioni redni broj, (c) šalje **payment_success_email** kupcu.
> Refund kroz MC vraća **samo novac** — ne poništava fakturu, mejl ni status narudžbine. Nema
> void-prozora kao kod DMS-a.

- [ ] **Pilot radi kao interna test-narudžbina:** sopstveni nalog, **sopstvena kartica**, najmanji
      mogući iznos. **Ne** raditi pilot na narudžbini realnog kupca.
- [ ] Redirect ide na `bib.eway2pay.com` HPP (produkcija).
- [ ] Posle plaćanja vraća se na `/api/nestpay/return`, **hash se verifikuje**,
      narudžbina pređe u status `paid` / `paymentStatus=completed`, a uspeh stranica prikaže
      7 transakcionih parametara.
- [ ] **Faktura** stvarno generisana (proveri `invoiceNumber` na narudžbini).
- [ ] **payment_success_email** stvarno isporučen (outbox ispražnjen — proveri inbox internog naloga).
- [ ] Transakcija je vidljiva u produkcionom Merchant Center-u.
- [ ] **Posle pilota — cleanup:** refund kroz MC **i** storniraj/knjiži pilot fakturu po računovodstvu
      (refund ne poništava fakturu/mejl/status).

**Posebna verifikacija API role-a** (obična uspešna transakcija ga NE testira):
- [ ] Namerno **prekini** jednu transakciju — zatvori tab posle 3DS izazova, pre nego što te banka
      vrati na `/api/nestpay/return`. Tako nastaje narudžbina sa `paymentStatus=pending`.
- [ ] Sačekaj 2–10 min da **reconcile cron** pokupi taj oid i pošalje **Order Status Query**.
      U Sentry monitoru/logu proveri da `queryOrderStatus` **uspe** (HTTP 200, XML parsiran), tj.
      da NEMA auth greške. Tek tada su `NESTPAY_QUERY_USERNAME/PASSWORD` (API role) potvrđeni.
      (Zelen cron sam po sebi ne dokazuje API role — bez pending narudžbine reconciler ne zove banku.)

**Ako hash padne na pilotu** (najčešći uzrok = pogrešan Store Key):
uzmi `HASH` i `HASHPARAMSVAL` iz odgovora/loga banke i pokreni **lokalno**. Store Key je
produkciona tajna — **ne** ostavljaj ga u shell istoriji:

```bash
# Prosledi Store Key preko env varijable (ne kao goli argument koji ostaje u ~/.bash_history):
STOREKEY='<prod-store-key>' npx tsx -e 'process.argv.splice(2,0,process.env.STOREKEY)' \
  scripts/nestpay-storekey-probe.ts "<HASH>" "<HASHPARAMSVAL>"
unset STOREKEY
```

Ako neka varijanta da „MATCH" → ključ je ispravan; ako nijedna → ponovo prekopiraj
Store Key iz Merchant Center → Administration → Store Key.

---

## Korak 6 — Posle uspešnog pilota (zvanični go-live)

- [ ] Banka potvrdi prelazak na produkciju.
- [ ] Prvih par dana prati (Sentry + baza), za prve **realne** narudžbine:
  - hash greške i `nestpay-reconcile` cron (`area:payment`, stage `finish-success`/`finish-failure`);
  - svaka plaćena narudžbina → `status=paid` i `paymentStatus=completed`;
  - **faktura** izdata (invoiceNumber) i **payment_success_email** isporučen;
  - na odbijenoj kartici → **payment_failure_email** poslat;
  - transakcije u produkcionom Merchant Center-u.
- [ ] Nemoj koristiti **test kartice** na produkciji (PDF §6).

---

## Obrada transakcija kroz Merchant Center (za prezentaciju nadležnima)

Banka traži da se nadležnim osobama prezentuje kako se rade ove operacije kroz portal
(`bib.eway2pay.com`). Kratko:

- **Refund (povraćaj):** za već naplaćenu (settled) transakciju — vrati sredstva kupcu.
  (Refund ne poništava fakturu/mejl/status u našem sistemu — to se radi posebno.)
- **Void (storno):** poništenje transakcije pre settlementa (istog dana).
- **Postauth (completion):** naplata rezervisanih sredstava — relevantno **samo za DMS**.
  Mi koristimo **SMS**, pa je naplata automatska i postauth se po pravilu ne koristi.

> Kod **SMS** modela sredstva se naplaćuju odmah, pa je u praksi najvažniji **refund**.

---

## Rollback (ako pilot ne uspe)

- [ ] Vrati Vercel Production env na test vrednosti (`NEXT_PUBLIC_NESTPAY_MODE=test`,
      test URL-ovi/ključevi) i redeploy — checkout se vraća na test gateway.
- [ ] ⚠️ Pre/tokom rollback-a potvrdi da **`NESTPAY_HASH_DEBUG` NIJE postavljen** na Production
      (rollback na `test` mod bi inače ponovo upalio debug endpoint koji curi StoreKey i bankina polja).
- [ ] Dijagnostikuj (verovatno Store Key — vidi probe iznad), pa ponovi Korake 2–5.

---

## (Opciono) preporučeno ojačanje koda — van ovog runbook-a

Da trailing-slash u `AUTH_URL` ne može da napravi problem ni greškom, može se u
[`src/lib/nestpay/url.ts`](../../src/lib/nestpay/url.ts) skinuti završna kosa crta
(`env.AUTH_URL.replace(/\/$/, "")`). Ovo je promena koda (van čistog cutover-a) — odluka stack
owner-a; doc-upozorenje iznad je dovoljno ako se promena ne radi.

---

## Reference

- Banca Intesa onboarding mejl (produkcioni parametri, pilot posle 14h).
- „Nexi – NestPay connectivity scenario for 3D Pay Hosting merchants v3.0" (PDF):
  - HPP (produkcija): `https://bib.eway2pay.com/fim/est3Dgate`
  - API (produkcija): `https://bib.eway2pay.com/fim/api`
  - Merchant Center (produkcija): `https://bib.eway2pay.com/bib/report/user.login`
- Kod: [`src/lib/nestpay/config.ts`](../../src/lib/nestpay/config.ts) (env mapiranje),
  [`src/lib/nestpay/url.ts`](../../src/lib/nestpay/url.ts) (AUTH_URL return),
  [`src/app/api/nestpay/return/route.ts`](../../src/app/api/nestpay/return/route.ts) (hash verifikacija),
  [`src/server/finance/reconcile-nestpay.ts`](../../src/server/finance/reconcile-nestpay.ts) (Order Status Query),
  [`scripts/nestpay-storekey-probe.ts`](../../scripts/nestpay-storekey-probe.ts) (dijagnostika ključa).
- Decision log: [`docs/platform-decisions.md`](../platform-decisions.md) (entry 2026-06-22).
