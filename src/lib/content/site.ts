export const SITE = {
  name: "Elegant Render",
  longName: "Elegant Render Platform",
  parentCompany: "White Rook DOO",
  tagline: "Lep prikaz. Jasna cena. Lakša odluka.",
  description:
    "Ručno izrađeni renderi, virtuelno opremanje i vizuelne adaptacije prostora za domove, stanove i nekretnine koje želite da prikažete bolje.",
  url: "https://elegantrender.rs",
  email: "kontakt@elegantrender.rs",
  instagram: "https://www.instagram.com/elegantrender",
} as const;

export type NavItem = { href: string; label: string };

export const NAV_MAIN: NavItem[] = [
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

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Izaberite uslugu",
    description:
      "Odaberite tip prikaza koji vam je potreban i definišite obim projekta kroz jednostavan formular.",
  },
  {
    step: "02",
    title: "Pošaljite materijale",
    description:
      "Uploadujte fotografije, crteže ili reference direktno kroz formu porudžbine. Format i veličinu ostavite nama.",
  },
  {
    step: "03",
    title: "Platite unapred poznatu cenu",
    description:
      "Cena se formira po jasnim pravilima — bez nagađanja. Plaćanje je sigurno, karticom ili putem PayPala.",
  },
  {
    step: "04",
    title: "Pratite i preuzmite",
    description:
      "Kroz klijentsku sekciju pratite status, razmenjujete komentare i preuzimate finalne materijale.",
  },
] as const;

export const WHY_US = [
  {
    title: "Jasne i transparentne cene",
    description:
      "Cena se formira po jasnim pravilima. Prva isporuka iz modela je puni iznos, a svaki sledeći prikaz košta manje jer je osnovni rad već urađen.",
  },
  {
    title: "Ručno izrađeni prikazi",
    description:
      "Bez generičkih šablona. Svaka scena se kadar po kadar prilagođava vašem prostoru, svetlu i atmosferi.",
  },
  {
    title: "Podrška White Rook tima",
    description:
      "Elegant Render je deo White Rook DOO — iza svakog projekta stoji iskusan tim sa višegodišnjim portfolijom u arhitektonskoj vizuelizaciji.",
  },
] as const;

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

export const PRICING_HIGHLIGHTS = [
  {
    title: "Unutrašnji render",
    price: 170,
    unit: "od",
    description: "Do 10 opremljenih prostorija, neograničen broj kadrova.",
    href: "/usluge/unutrasnji-renderi",
  },
  {
    title: "Spoljašnji render",
    price: 250,
    unit: "od",
    description: "Kompletan 3D model + prvi kadar.",
    href: "/usluge/spoljasnji-renderi",
  },
  {
    title: "Virtuelno opremanje",
    price: 18,
    unit: "od",
    description: "Prva opremljena slika iz prazne fotografije.",
    href: "/usluge/virtuelno-opremanje",
  },
  {
    title: "Virtuelna renovacija",
    price: 66,
    unit: "od",
    description: "Vizuelni prikaz adaptacije pre radova.",
    href: "/usluge/virtuelna-renovacija",
  },
] as const;
