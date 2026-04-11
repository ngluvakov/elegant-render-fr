# Elegant Render — IDE handoff za usaglašavanje logotipa i footera

Ovaj dokument je pripremljen da ga direktno uploaduješ u IDE kao jasan zadatak za usaglašavanje **Next.js GitHub repozitorijuma** sa izmenama koje su već potvrđene u Manus prototipu. Fokus ovog handoff-a je striktno na dve stvari: **stvarni Elegant Render logo** i **tamni footer**.

| Stavka | Status |
|---|---|
| GitHub repo | `ngluvakov/elegant-render-platform` |
| Logo asset | Već uploadovan na GitHub |
| Putanja asseta | `public/branding/elegant-render-logo-with-padding.png` |
| Commit | `a7e91fe` |
| Prioritetne izmene | `brand-logo.tsx`, `site-footer.tsx`, indirektno `site-header.tsx` |

Suština izmene je da se trenutni tekstualni ili placeholder logo zameni **stvarnim Elegant Render znakom**, a da footer dobije isti karakter koji već postoji u prototipu: **topao tamni završetak sajta**, jasne kolone, poslovno poverenje i blag CTA koji vraća korisnika u glavni conversion flow.

## 1. Šta je već urađeno na GitHub-u

Logo fajl je već dodat u repozitorijum, tako da IDE ne mora da traži asset izvan projekta. Treba koristiti sledeću javnu putanju iz Next.js aplikacije:

```txt
/branding/elegant-render-logo-with-padding.png
```

| Šta IDE treba da uradi | Očekivani rezultat |
|---|---|
| Zameni trenutni tekstualni `BrandLogo` sa reusable image-based komponentom | Isti logo u headeru i footeru |
| Zadrži postojeće ponašanje linka ka početnoj | Klik na logo vodi na `/` |
| Uvede tamni footer sa toplim charcoal tonom | Footer vizuelno zatvara stranicu i dodaje poverenje |
| Ne menja ostatak IA više nego što je potrebno | Minimalan diff, maksimalna usaglašenost |

## 2. Cilj dizajna

Ovo **nije luksuzni, hladni premium footer**. Elegant Render u ovoj fazi treba da deluje **toplo, jasno, uredno i pristupačno**, sa dovoljno profesionalnosti da uliva poverenje privatnim klijentima, agentima, arhitektama i manjim investitorima. Zato footer treba da koristi **charcoal** osnovu sa blagim toplim akcentima, a logo treba da bude prikazan čitko i dostojanstveno, bez prenaglašene dekoracije.

Praktično pravilo za IDE je sledeće: ako neka odluka deluje „skuplje" ali manje jasno, prednost ima rešenje koje bolje komunicira uslugu i lakše vodi korisnika ka narednom koraku.

## 3. Fajlovi koje treba menjati

| Fajl | Šta menjati |
|---|---|
| `src/components/brand/brand-logo.tsx` | Zameniti tekstualni logo stvarnim image logo prikazom |
| `src/components/site/site-footer.tsx` | Zameniti postojeći svetli/footer-lite blok tamnim footerom iz toplog charcoal pravca |
| `src/components/site/site-header.tsx` | Nije potrebna velika promena; kada se `BrandLogo` zameni, header automatski dobija pravi logo |
| `src/lib/content/site.ts` | Samo ako treba dopuniti footer tekst ili izdvojiti navigation podatke |

## 4. Preporučena implementacija za `brand-logo.tsx`

U nastavku je predlog koda koji je prilagođen postojećoj Next.js strukturi, ali prati isti obrazac koji smo koristili u Manus prototipu: jedna reusable komponenta, veličine po varijantama, podrška za svetlu i tamnu podlogu i isti asset svuda.

```tsx
import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  surface?: "light" | "dark";
  /** When true, renders as a plain span wrapper without the home link. */
  asChild?: boolean;
};

const sizeClasses = {
  sm: "h-11 w-auto",
  md: "h-14 w-auto",
  lg: "h-20 w-auto",
} as const;

const surfaceClasses = {
  light: "drop-shadow-[0_10px_24px_rgba(28,26,25,0.08)]",
  dark: "drop-shadow-[0_16px_34px_rgba(0,0,0,0.28)]",
} as const;

const LOGO_SRC = "/branding/elegant-render-logo-with-padding.png";

export function BrandLogo({
  className,
  size = "md",
  surface = "light",
  asChild,
}: BrandLogoProps) {
  const content = (
    <span className={cn("inline-flex items-center", className)}>
      <img
        src={LOGO_SRC}
        alt="Elegant Render logo"
        className={cn(sizeClasses[size], surfaceClasses[surface])}
        loading="eager"
        decoding="async"
      />
    </span>
  );

  if (asChild) return content;

  return (
    <Link
      href="/"
      className="inline-flex items-center transition-opacity hover:opacity-80"
      aria-label="Elegant Render — početna"
    >
      {content}
    </Link>
  );
}
```

Ovaj pristup je namerno jednostavan. Ne uvodi dodatnu kompleksnost, ne oslanja se na remote asset konfiguraciju i ostaje lako prenosiv između headera, footera i bilo kog budućeg trust bloka.

## 5. Preporučena implementacija za `site-footer.tsx`

Ispod je predlog za Next.js footer koji je najbliži varijanti koju smo već potvrdili u prototipu. Struktura je podeljena na četiri logične celine: **brand**, **usluge**, **kompanija/pravno**, i **CTA**.

```tsx
import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { NAV_LEGAL, NAV_MAIN, SITE } from "@/lib/content/site";

const FOOTER_SERVICES = [
  { href: "/usluge#unutrasnji-renderi", label: "Unutrašnji renderi" },
  { href: "/usluge#spoljasnji-renderi", label: "Spoljašnji renderi" },
  { href: "/usluge#virtuelno-opremanje", label: "Virtuelno opremanje" },
  { href: "/usluge#virtuelna-renovacija", label: "Virtuelna renovacija" },
  { href: "/usluge#osnove-prostora", label: "2D i 3D osnove prostora" },
  { href: "/usluge#360-ture-i-animacije", label: "360 ture i animacije" },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-32 overflow-hidden bg-[#171311] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(184,131,99,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(113,143,120,0.12),transparent_28%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.34),transparent)]" />

      <div className="relative mx-auto w-full max-w-6xl px-6 py-14 md:py-18">
        <div className="grid gap-10 border-b border-white/10 pb-10 lg:grid-cols-[1.25fr_0.75fr_0.75fr_0.95fr]">
          <div className="max-w-md">
            <Link href="/" className="inline-flex items-center gap-4 transition hover:opacity-90">
              <div className="overflow-hidden rounded-[1rem] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] p-2 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
                <BrandLogo size="md" surface="dark" />
              </div>
              <div>
                <p className="text-[0.94rem] font-semibold uppercase tracking-[0.36em] text-white">
                  Elegant Render
                </p>
                <p className="mt-1 text-[0.7rem] uppercase tracking-[0.24em] text-white/50">
                  Brza kupovina arhitekturne vizuelizacije
                </p>
              </div>
            </Link>

            <p className="mt-6 text-sm leading-7 text-white/68">
              Elegant Render je topao i jasan servis za arhitekturnu vizuelizaciju,
              namenjen privatnim klijentima, agentima, arhitektama, dizajnerima i
              manjim investitorima kojima su važni transparentna cena, jednostavan
              proces i vizuelno poverenje.
            </p>
            <p className="mt-4 text-sm leading-7 text-white/52">
              Diskretno podržano iskustvom kompanije White Rook DOO.
            </p>
          </div>

          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-white/45">
              Usluge
            </p>
            <div className="mt-5 grid gap-3 text-sm text-white/72">
              {FOOTER_SERVICES.map((item) => (
                <Link key={item.href} href={item.href} className="transition hover:text-[#ddb195]">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-white/45">
              Kompanija
            </p>
            <div className="mt-5 grid gap-3 text-sm text-white/72">
              {NAV_MAIN.map((item) => (
                <Link key={item.href} href={item.href} className="transition hover:text-[#ddb195]">
                  {item.label}
                </Link>
              ))}
              {NAV_LEGAL.map((item) => (
                <Link key={item.href} href={item.href} className="transition hover:text-[#ddb195]">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.16)] backdrop-blur-sm">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/45">
              Sledeći korak
            </p>
            <h2 className="mt-4 text-2xl leading-tight text-[#f7efe7]">
              Počni od usluge i odmah dobij jasan pravac za cenu i narudžbinu.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/62">
              Ako želiš da kreneš odmah, vrati se na početnu stranicu i izaberi tip
              vizuelizacije koji ti treba.
            </p>
            <Link
              href="/#naruci"
              className="mt-6 inline-flex items-center rounded-full bg-[#b88363] px-5 py-3 text-sm font-medium text-white shadow-[0_18px_40px_rgba(184,131,99,0.28)] transition hover:bg-[#9f6a4b]"
            >
              Otvori kalkulaciju i narudžbinu
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 text-sm text-white/45 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {SITE.name}. Sva prava zadržana.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/pravno/privatnost" className="transition hover:text-[#ddb195]">
              Politika privatnosti
            </Link>
            <Link href="/pravno/uslovi" className="transition hover:text-[#ddb195]">
              Uslovi korišćenja
            </Link>
            <Link href="/kontakt" className="transition hover:text-[#ddb195]">
              Kontakt
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

Ovaj footer nije zamišljen kao generičan blok sa linkovima. Njegova uloga je da zatvori prodajni tok, potvrdi identitet brenda i ostavi korisniku još jednu jasnu sledeću akciju.

## 6. Minimalne dopune koje IDE treba da proveri

| Oblast | Šta proveriti |
|---|---|
| Header | `BrandLogo` i dalje radi kao link ka početnoj i ostaje vizuelno stabilan na mobilnom i desktop prikazu |
| Footer kontrast | Tekst mora ostati čitljiv na `#171311` podlozi |
| Logo na tamnoj podlozi | `surface="dark"` varijanta treba da zadrži dobar vizuelni odmak od pozadine |
| Linkovi | Footer linkovi ne smeju voditi na nepostojeće rute |
| CTA | Ako `/#naruci` trenutno ne postoji u Next.js projektu, privremeno ga preusmeriti na `/usluge` ili `/kontakt` umesto da ostane mrtav link |

## 7. Opciona, ali preporučena dorada

Ako IDE želi da uskladi header i footer dugoročno, preporuka je da iz `src/lib/content/site.ts` izdvoji poseban fajl tipa `src/lib/site-navigation.ts`, tako da i header i footer čitaju linkove iz istog izvora. To nije obavezno za ovaj mali korak, ali smanjuje buduće razilaženje između public navigacije i footer linkova.

Primer minimalne strukture je sledeći:

```ts
export const footerServiceLinks = [
  { label: "Unutrašnji renderi", href: "/usluge#unutrasnji-renderi" },
  { label: "Spoljašnji renderi", href: "/usluge#spoljasnji-renderi" },
  { label: "Virtuelno opremanje", href: "/usluge#virtuelno-opremanje" },
  { label: "Virtuelna renovacija", href: "/usluge#virtuelna-renovacija" },
  { label: "2D i 3D osnove prostora", href: "/usluge#osnove-prostora" },
  { label: "360 ture i animacije", href: "/usluge#360-ture-i-animacije" },
];
```

## 8. Acceptance criteria

IDE zadatak se smatra završenim kada sledeće tačke budu istinite:

| Kriterijum | Očekivani ishod |
|---|---|
| Logo | Stvarni Elegant Render logo je vidljiv u headeru i footeru |
| Asset | Aplikacija koristi lokalni GitHub asset iz `public/branding/` |
| Footer | Footer je taman, topao i strukturiran u više poslovnih kolona |
| Ton | Vizuelni utisak je pristupačan i jasan, ne hladan i distanciran |
| Build | Next.js projekat prolazi bez regresije u header/footer delu |

## 9. Kratka poruka za IDE

Ako želiš ultra-kratak prompt za IDE, koristi ovaj tekst:

> Uskladi GitHub Next.js projekat sa potvrđenim Manus prototipom za logo i footer. Stvarni logo je već uploadovan u `public/branding/elegant-render-logo-with-padding.png`. Zameni trenutni tekstualni `BrandLogo` reusable image komponentom, zadrži link ka početnoj, a `site-footer.tsx` preoblikuj u tamni charcoal footer sa 4 logične celine: brand, usluge, kompanija/pravno i CTA. Ton mora biti topao, jasan i pristupačan, ne luksuzno-distanciran. Koristi kod iz ovog dokumenta kao glavni šablon i prilagodi ga postojećoj Next.js strukturi bez nepotrebnog refaktora.
