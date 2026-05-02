/**
 * site.ts — Site-wide content constants (branding, navigation, copy).
 *
 * Exports SITE, NAV_MAIN, NAV_LEGAL, TRUST_SIGNALS, PLATFORM_PRINCIPLES,
 * ORDERING_STEPS, FAQ_ITEMS — all static Serbian-language content.
 *
 * Used by: layout.tsx, site-header, site-footer, marketing pages,
 *          legal pages, robots.ts, sitemap.ts
 */
export const SITE = {
  name: "Elegant Render",
  longName: "Elegant Render Platform",
  parentCompany: "White Rook DOO",
  tagline: "Lep prikaz. Jasna cena. Lakša odluka.",
  description:
    "Ručno izrađeni renderi, virtuelno opremanje i vizuelne adaptacije prostora. Biraš uslugu, odmah vidiš baznu cenu iz cenovnika i kako se cena širi — bez izmišljenih paketa.",
  url: "https://elegantrender.rs",
  email: "kontakt@elegantrender.rs",
  instagram: "https://www.instagram.com/elegantrender",
} as const;

export const TRUST_SIGNALS = [
  "Bez paketa van cenovnika — svaka cena je iz zvaničnog cenovnika.",
  "Logika cene je vidljiva već iznad prevoja, bez skrivenih pravila.",
  "Tri runde revizija uključene u svaki projekat po našem standardu.",
] as const;

export const PLATFORM_PRINCIPLES = [
  {
    title: "Šta kupujem",
    text: "Biraš konkretnu uslugu i odmah vidiš da li cena polazi od prve slike, prvog rendera, sprata, sekunde animacije ili dodatka na postojeći model.",
  },
  {
    title: "Koliko košta",
    text: "Vidiš zvaničnu baznu cenu iz cenovnika, a odmah ispod stoje tačne doplate za dodatni obim umesto izmišljenih paketa.",
  },
  {
    title: "Kako se cena širi",
    text: "Interfejs jasno pokazuje logiku: prvi izlaz pokriva glavni posao, sledeći izlazi iz istog modela su jeftiniji.",
  },
  {
    title: "Šta šaljem",
    text: "Svaka usluga ima jasno naveden minimalni ulaz: osnove, fotografije, reference ili postojeći model.",
  },
] as const;

export type NavItem = { href: string; label: string };

export const NAV_MAIN: NavItem[] = [
  { href: "/ai-studio", label: "AI Studio" },
  { href: "/usluge", label: "Usluge" },
  { href: "/cene", label: "Cene" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/o-nama", label: "O nama" },
  { href: "/kontakt", label: "Kontakt" },
];

export const NAV_LEGAL: NavItem[] = [
  { href: "/pravno/privatnost", label: "Politika privatnosti" },
  { href: "/pravno/uslovi", label: "Uslovi korišćenja" },
  { href: "/pravno/kolacici", label: "Politika kolačića" },
];

export const ORDERING_STEPS = [
  {
    step: "01",
    title: "Izaberi tip usluge",
    description:
      "Prvo biraš da li kupuješ enterijer, eksterijer, staging, renovaciju, osnovu ili 360 / animaciju.",
  },
  {
    step: "02",
    title: "Izaberi tačan obračun",
    description:
      "Zatim biraš zvaničnu cenovnu logiku iz cenovnika: prvi render, prvi hotspot, sprat, sekundu animacije ili tour add-on.",
  },
  {
    step: "03",
    title: "Dodaj obim projekta",
    description:
      "Interfejs prikazuje tačne doplate iz cenovnika za dodatne sobe, kamere, hotspotove, nivoe ili sekunde.",
  },
  {
    step: "04",
    title: "Pošalji materijale",
    description:
      "Šalješ ono što je minimalno potrebno za start, bez dugog pregovaranja pre prve procene.",
  },
] as const;

/** Alias kept for legacy imports in /kontakt and other places. */
export const HOW_IT_WORKS = ORDERING_STEPS;

export const FAQ_ITEMS = [
  {
    question: "Koliko traje izrada jednog rendera?",
    answer:
      "Zavisi od obima. Tipičan enterijer sa jednim kadrom završavamo za 3 do 5 radnih dana. Veliki projekti sa više kadrova se preciziraju unapred, ali rokovi su uvek jasno definisani pre početka rada.",
  },
  {
    question: "Da li cena uključuje revizije?",
    answer:
      "Da. Svaki projekat uključuje tri kruga revizija bez dodatne naknade. Ukoliko su potrebne dodatne revizije, obračunavaju se transparentno po istim pravilima kao i ostatak cenovnika.",
  },
  {
    question: "Koje materijale treba da vam pošaljem?",
    answer:
      "Najkorisnije su osnove prostora (2D ili PDF), fotografije postojećeg stanja i reference stila ili atmosfere. Formu porudžbine smo napravili tako da možete da uploadujete sve odjednom, bez gnjavaže.",
  },
  {
    question: "Da li izdajete fiskalni račun i radite po ugovoru?",
    answer:
      "Da. Elegant Render je deo White Rook DOO i posluje u skladu sa svim zakonskim obavezama u Srbiji. Za svaki projekat izdajemo odgovarajuću dokumentaciju.",
  },
  {
    question: "Šta ako je projekat veći od uobičajenog?",
    answer:
      "Za stambene komplekse, veće investitorske projekte i serije rendera iz istog modela koristimo progresivne popuste. Kontaktirajte nas i pripremićemo ponudu koja odgovara obimu posla.",
  },
] as const;

