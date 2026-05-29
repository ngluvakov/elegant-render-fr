# Banca Intesa NestPay integracija - status

**Datum:** 2026-05-29
**Repo:** `ngluvakov/elegant-render-platform`
**Default branch:** `main`
**Custom domain:** `https://elegantrender.rs`
**Test client ID:** `13IN004509`
**Test gateway:** `https://testsecurepay.eway2pay.com/fim/est3Dgate`

Ovaj folder sadrzi radni paket dokumentacije za Banca Intesa NestPay 3D Pay Hosting integraciju.

## Fajlovi u folderu

- `Nestpay_Merchant_Integration_3D_PayHosting.pdf` - NestPay 3D Pay Hosting integration manual.
- `Nexi - NestPay connectivity scenario for 3D Pay Hosting merchants v3.0 - BIB.pdf` - BIB/Nexi connectivity scenario.
- `Uputstvo za rad EPM v3.5.pdf` - standardi za e-commerce prodajno mesto.
- `Primeri testnih case-ova za trgovce sa testnim karticama.xls` - test kartice i test scenariji.
- `izgled tabele sa testnim transakcijama.xls` - primer export-a testnih transakcija iz Merchant Center-a.
- `POST.txt` - primer merchant POST zahteva.
- `STATUS-NESTPAY-INTEGRATION.md` - ovaj status dokument.

## Sta je implementirano

NestPay je implementiran kao HPP redirect flow:

- `storetype=3d_pay_hosting`
- `hashAlgorithm=ver2`
- `currency=941`
- `trantype=Auth`
- `okUrl` i `failUrl` vode na isti return endpoint
- StoreKey se koristi samo za racunanje hash-a i ne salje se u POST formi

Klucni runtime fajlovi:

- `src/lib/nestpay/config.ts`
- `src/lib/nestpay/hash.ts`
- `src/lib/nestpay/client.ts`
- `src/lib/nestpay/oid.ts`
- `src/lib/nestpay/response.ts`
- `src/lib/nestpay/status-query.ts`
- `src/lib/nestpay/url.ts`
- `src/server/actions/nestpay.ts`
- `src/app/api/nestpay/return/route.ts`
- `src/app/api/cron/nestpay-reconcile/route.ts`
- `src/server/finance/reconcile-nestpay.ts`

## Trenutna HASH odluka

Outgoing merchant POST hash je uskladjen sa Banca Intesa onboarding instrukcijom:

```text
clientid|oid|amount|okUrl|failUrl|trantype||rnd||||currency|StoreKey
```

Plaintext se hash-uje sa SHA-512 i enkoduje u base64. Outgoing POST ne salje:

- `StoreKey`
- `CallbackURL`
- `instalment`
- `HASHPARAMS`
- `HASHPARAMSVAL`

Response verifikacija ostaje tolerantna prema bankinom povratnom formatu koji moze da sadrzi `HASH`, `HASHPARAMS` i `HASHPARAMSVAL`.

Ova odluka je zabelezena i u `docs/platform-decisions.md` pod unosom:

```text
2026-05-29 - NestPay request HASH usaglasen sa Banca Intesa HPP formatom
```

## Poslednja tehnicka promena

PR #123 je merge-ovan u `main`:

- Commit: `3305811 fix nestpay request hash`
- Merge commit: `8b9649f`

Promene:

- request hash prebacen na positional BIB format
- outgoing `HASHPARAMS`/`HASHPARAMSVAL` uklonjeni
- return redirect koristi konfigurisani `AUTH_URL`, ne request `Origin`
- novi NestPay pokusaj posle failed attempt-a resetuje `paymentStatus` na `pending`
- prosireni hash sanity testovi

## Verifikacija

Lokalno su prosle sledece provere:

```text
npx tsc --noEmit
npx tsx scripts/nestpay-hash-test.ts
npm run lint
```

Vercel preview za PR #123 je prosao pre merge-a.

## Vercel env koji mora biti postavljen

Test okruzenje:

```text
NEXT_PUBLIC_NESTPAY_MODE=test
NESTPAY_CLIENT_ID=13IN004509
NESTPAY_STORE_KEY=<store key definisan u Merchant Center-u>
NESTPAY_BASE_URL=https://testsecurepay.eway2pay.com/fim/est3Dgate
NESTPAY_QUERY_URL=https://testsecurepay.eway2pay.com/fim/api
NESTPAY_QUERY_USERNAME=<Merchant Center API user>
NESTPAY_QUERY_PASSWORD=<Merchant Center API password>
NESTPAY_TRAN_TYPE=Auth
NESTPAY_OID_PREFIX=ER-
AUTH_URL=https://elegantrender.rs
```

Debug varijable koristiti samo privremeno:

```text
NESTPAY_HASH_DEBUG=1
```

`NESTPAY_HASH_PARAMS` ne treba da bude postavljen za trenutnu implementaciju.

## Otvoreni operativni koraci

1. Proveriti da je `AUTH_URL=https://elegantrender.rs` aktivan u Vercel Production env-u.
2. Proveriti da je `NESTPAY_STORE_KEY` identican StoreKey-u definisanom u test Merchant Center-u.
3. Posle WAF reset-a ili isteka blokade pokrenuti potpuno novu test transakciju sa novim `oid`.
4. Ako transakcija prodje do HPP/card entry koraka, nastaviti testiranje prema XLS test scenarijima.
5. Exportovati test transakcije iz Merchant Center-a i poslati Banca Intesa e-commerce podrsci.

## Banka / support

Kontakt iz onboarding komunikacije:

```text
ecomm_podrska@bancaintesa.rs
```

Za support slati:

- test client ID
- opis okruzenja
- vreme test transakcije
- order ID
- Merchant Center rezultat
- WAF support ID ako se ponovi blokada

Ne slati StoreKey kroz chat, commit ili dokumentaciju.
