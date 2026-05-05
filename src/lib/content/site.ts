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

/**
 * Pravni identitet pravnog lica — koristi se na /pravno/impressum, u
 * footer-u i u JSON-LD Organization schema-u. Vrednosti dolaze iz APR
 * registra (https://pretraga.apr.gov.rs). Telefon i ime zakonskog
 * zastupnika su opcioni — Zakon o elektronskoj trgovini čl. 7 zahteva
 * naziv, sedište, registarski podaci i "podatak koji omogućava brzo i
 * direktno uspostavljanje veze" — email zadovoljava poslednji uslov.
 */
export const IMPRINT = {
  // Title case for display. APR registers in all-caps as a typesetting
  // convention; capitalization is not part of the legal identity. Use
  // shortName ("White Rook DOO") on customer-facing surfaces and reserve
  // legalName for legal pages where the formal registered identity is
  // surfaced (impressum, privacy controller block, terms provider block).
  legalName:
    "Društvo za grafički dizajn, proizvodnju, trgovinu i usluge, White Rook DOO Kovačica",
  shortName: "White Rook DOO",
  street: "JNA 25",
  postalCode: "26210",
  city: "Kovačica",
  country: "Srbija",
  taxId: "110339214", // PIB
  registryNumber: "21339393", // matični broj
  activityCode: "7410", // Specijalizovane dizajnerske delatnosti
  foundedAt: "2017-11-22",
  size: "Malo preduzeće",
  email: "kontakt@elegantrender.rs",
  privacyEmail: "kontakt@elegantrender.rs",
  euRepresentative: null as null | {
    name: string;
    address: string;
    email: string;
  },
} as const;

export function formatAddress(): string {
  return `${IMPRINT.street}, ${IMPRINT.postalCode} ${IMPRINT.city}, ${IMPRINT.country}`;
}

export const TRUST_SIGNALS = [
  "Bez paketa van cenovnika — svaka cena je iz zvaničnog cenovnika.",
  "Logika cene je vidljiva već iznad prevoja, bez skrivenih pravila.",
  "Tri runde revizija uključene u svaki projekat po našem standardu.",
  "Sertifikovano TÜV Rheinland — ISO 9001:2015, ISO/IEC 27001:2022, ISO 50001:2018.",
] as const;

export type IsoCertification = {
  id: "iso-9001" | "iso-27001" | "iso-50001";
  code: string;
  domain: string;
  description: string;
  certNumber?: string;
  verifyUrl?: string;
};

export const CERTIFIER = {
  name: "TÜV Rheinland",
  fullName: "TÜV Rheinland — nemačko sertifikaciono telo",
  description:
    "TÜV Rheinland je jedno od najstarijih i najuglednijih svetskih sertifikacionih tela, sa sedištem u Kelnu i prisustvom u preko 50 zemalja. Sertifikati koje izdaje smatraju se referencom u industriji i podrazumevaju redovne nezavisne audit-e — ne jednokratnu izjavu, već kontinuirano održavan sistem.",
  // Combined Testmark badge issued for all three standards under a single ID.
  // Source: hi-res CMYK PNG/PDF from TÜV's certification package, converted
  // to sRGB WebP for web (1600px wide, ~65KB).
  badgeAsset: {
    src: "/legal/tuv-rheinland-certified.webp",
    pdfSrc: "/legal/tuv-rheinland-certified.pdf",
    width: 1600,
    height: 590,
    alt: "TÜV Rheinland CERTIFIED — ISO 9001:2015, ISO/IEC 27001:2022, ISO 50001:2018, ID 9000025319",
  },
} as const;

const TUV_RHEINLAND_CERT_ID = "9000025319";
// Certipedia is TÜV Rheinland's public certificate registry. The URL on
// the badge QR code resolves here for all three standards (combined cert).
const TUV_RHEINLAND_VERIFY_URL = `https://www.certipedia.com/quality_marks/${TUV_RHEINLAND_CERT_ID}?locale=en`;

export const ISO_CERTIFICATIONS: IsoCertification[] = [
  {
    id: "iso-9001",
    code: "ISO 9001:2015",
    domain: "Upravljanje kvalitetom",
    description:
      "Standard koji definiše zahteve za sistem upravljanja kvalitetom procesa i isporuke usluga. Naš tok rada — od preuzimanja materijala, preko revizija, do isporuke finalnih rendera — usklađen je sa ovim standardom, što znači predvidiv kvalitet i dosledan rezultat na svakom projektu.",
    certNumber: TUV_RHEINLAND_CERT_ID,
    verifyUrl: TUV_RHEINLAND_VERIFY_URL,
  },
  {
    id: "iso-27001",
    code: "ISO/IEC 27001:2022",
    domain: "Informaciona bezbednost",
    description:
      "Standard za upravljanje informacionom bezbednošću. Vaše datoteke (osnove prostora, fotografije i lični podaci u portalu) tretiramo po sertifikovanim procedurama: kontrolisani pristup, šifrovanje u tranzitu, definisana retencija i procesi za reagovanje na incidente. Ovaj standard je i osnov naše GDPR usklađenosti.",
    certNumber: TUV_RHEINLAND_CERT_ID,
    verifyUrl: TUV_RHEINLAND_VERIFY_URL,
  },
  {
    id: "iso-50001",
    code: "ISO 50001:2018",
    domain: "Energetski menadžment",
    description:
      "Standard za sistemsko upravljanje energetskom efikasnošću. Naš render kapacitet i interna infrastruktura prate i optimizuju potrošnju energije, što smanjuje ekološki otisak digitalne arhitektonske produkcije.",
    certNumber: TUV_RHEINLAND_CERT_ID,
    verifyUrl: TUV_RHEINLAND_VERIFY_URL,
  },
];

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
  { href: "/pravno/impressum", label: "Impressum" },
  { href: "/pravno/privatnost", label: "Politika privatnosti" },
  { href: "/pravno/uslovi", label: "Uslovi korišćenja" },
  { href: "/pravno/kolacici", label: "Politika kolačića" },
  { href: "/pravno/sertifikati", label: "Sertifikati i standardi" },
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

export const SERVICES_PAGE_FAQS = [
  {
    question: "Kako da znam koja usluga mi je potrebna?",
    answer:
      "Dovoljno je da pošaljete fotografije, plan ili kratko objašnjenje cilja. Na osnovu toga predlažemo najlogičniju uslugu i okvir cene.",
  },
  {
    question: "Da li su cene konačne?",
    answer:
      "Na stranici su prikazane početne cene. Konačna cena zavisi od obima, broja kadrova, nivoa detalja i ulaznih materijala.",
  },
  {
    question: "Koliko korekcija je uključeno?",
    answer:
      "Tri kruga korekcija su uključena u osnovnu cenu svake usluge, osim ako se radi o promeni obima projekta.",
  },
  {
    question: "Da li radite samo za Srbiju?",
    answer:
      "Elegant Render je primarno fokusiran na Srbiju i region, ali je struktura usluge spremna i za druga tržišta.",
  },
] as const;

export const AI_STUDIO_FAQS = [
  {
    question: "Da li AI Studio pravi 3D render?",
    answer:
      "Ne. AI Studio obrađuje postojeće fotografije. Ako prostor ne postoji ili treba potpuno kontrolisan arhitektonski prikaz, bolji izbor je klasičan render.",
  },
  {
    question: "Kada treba koristiti masku?",
    answer:
      "Masku koristite kada želite da se izmena desi samo na delu slike: veći predmet, određeni zid, deo poda ili zona prostorije.",
  },
  {
    question: "Koja je razlika između staginga, renovacije i redesign-a?",
    answer:
      "Staging dodaje opremu u prazan prostor. Renovacija menja materijale i elemente prostora. Redesign menja stil i atmosferu postojeće sobe.",
  },
  {
    question: "Da li rezultat mogu ponovo da obradim?",
    answer:
      "Da. Rezultat može da postane nova ulazna slika za malu korekciju ili nastavak dorade.",
  },
] as const;

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "ProfessionalService", "LocalBusiness"],
    "@id": `${SITE.url}/#organization`,
    name: SITE.name,
    alternateName: SITE.longName,
    legalName: IMPRINT.legalName,
    url: SITE.url,
    logo: `${SITE.url}/branding/elegant-render-logo-with-padding.png`,
    image: `${SITE.url}/artwork/elegant-render-hero-interior.webp`,
    description: SITE.description,
    email: SITE.email,
    taxID: IMPRINT.taxId,
    foundingDate: IMPRINT.foundedAt,
    address: {
      "@type": "PostalAddress",
      streetAddress: IMPRINT.street,
      postalCode: IMPRINT.postalCode,
      addressLocality: IMPRINT.city,
      addressCountry: "RS",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: SITE.email,
        availableLanguage: ["sr-Latn", "en"],
      },
    ],
    sameAs: [SITE.instagram],
    areaServed: ["RS", "EU", "Worldwide"],
    currenciesAccepted: "EUR, RSD",
    priceRange: "€€",
    serviceType: [
      "Arhitektonska vizuelizacija",
      "3D renderi",
      "Virtuelno opremanje",
      "AI obrada fotografija nekretnina",
    ],
    parentOrganization: {
      "@type": "Organization",
      name: SITE.parentCompany,
    },
    hasCredential: ISO_CERTIFICATIONS.map((cert) => ({
      "@type": "EducationalOccupationalCredential",
      credentialCategory: `${cert.code} (${cert.domain})`,
      recognizedBy: {
        "@type": "Organization",
        name: CERTIFIER.name,
      },
    })),
  };
}

