# Elegant Render Platform

B2C arhitektonska vizuelizacija — sajt i klijentski portal za **Elegant Render**, podbrend kompanije **White Rook DOO**. Kod se nalazi u ovom repozitorijumu; cela strategija, brend sistem i plan razvoja su dokumentovani u `docs/`.

## Dokumentacija

- [`docs/brand-book.md`](./docs/brand-book.md) — brand book (pozicioniranje, ton, vizuelni identitet)
- [`docs/plan-v1.md`](./docs/plan-v1.md) — v1 build plan (stack, faze, arhitektura)
- [`docs/pricing/pillar-1-extracted.md`](./docs/pricing/pillar-1-extracted.md) — strukturirani izvod cenovnika
- [`docs/pricing/WhiteRook_Pricing_Pillar1_EUR.pdf`](./docs/pricing/WhiteRook_Pricing_Pillar1_EUR.pdf) — original PDF cenovnika

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (CSS-first, brand tokens u `src/app/globals.css`)
- **Auth.js v5** (email + password + Google) — planirano
- **Postgres** na Supabase + **Supabase Storage** za upload fajlova — planirano
- **Resend** za transakcione emailove — planirano
- **Banca Intesa** (kartice) + **PayPal** — planirano
- **Bitrix24** duboka dvosmerna sinhronizacija — planirano

## Dev

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

## Repo struktura (v1 target)

```
src/
├── app/                # App Router (marketing pages + /poruci + /portal + /api)
├── components/         # brand/, marketing/, portal/
├── lib/                # pricing/, validation/, supabase/, auth.ts
└── server/             # actions/, bitrix/, payments/
```

## Brand

Dominantne boje: `#1C1A19` (coal), `#F6F1EA` (ivory), `#DCCFC2` (sand), `#B88363` (clay), `#8F9A8A` (sage).
Naslovi: Cormorant Garamond. Telo teksta: Manrope.
Hero slogan: **„Lep prikaz. Jasna cena. Lakša odluka."**

Elegant Render je deo White Rook DOO.
