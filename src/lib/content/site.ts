/**
 * site.ts — Site-wide content constants (branding, navigation, copy).
 *
 * Exports SITE, NAV_MAIN, NAV_LEGAL, TRUST_SIGNALS, PLATFORM_PRINCIPLES,
 * ORDERING_STEPS, FAQ_ITEMS — all static Serbian-language content.
 *
 * Used by: layout.tsx, site-header, site-footer, marketing pages,
 *          legal pages, robots.ts, sitemap.ts
 */
import { SITE_FEATURES } from "@/lib/site-features";

// Canonical site URL used by absoluteUrl(), robots.ts, sitemap.ts,
// and the JSON-LD Organization schema below. Env-driven with a
// fallback so the production build always resolves a real URL even
// if NEXT_PUBLIC_SITE_URL isn't set. Setting the env var explicitly
// is useful for non-prod environments (preview branches that should
// look at a different host) without touching code.
const DEFAULT_SITE_URL = "https://elegantrender.rs";

function normalizeSiteUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString().replace(/\/$/, "");
  } catch {
    return DEFAULT_SITE_URL;
  }
}

const RESOLVED_SITE_URL = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL,
);

export const SITE = {
  name: "Elegant Render",
  longName: "Elegant Render Platform",
  parentCompany: "White Rook DOO",
  tagline: "Lep prikaz. Jasna cena. Lakša odluka.",
  description:
    "Ručno izrađeni renderi, virtuelno opremanje i vizuelne adaptacije prostora. Izaberite uslugu, odmah vidite osnovnu cenu iz cenovnika i kako se cena formira za dodatne zahteve — bez skrivenih troškova i izmišljenih paketa.",
  url: RESOLVED_SITE_URL,
  email: "kontakt@elegantrender.rs",
  instagram: "https://www.instagram.com/elegantrender",
} as const;

/**
 * Pravni identitet pravnog lica — koristi se na /legal/imprint, u
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
  // Bank account info that lands on predračun (proforma) PDFs as the
  // payment instruction. Currently a placeholder — fill in real
  // values when wire-transfer flow goes live (you can leave any
  // single field empty and the PDF will skip its row).
  bank: {
    name: "Banca Intesa AD Beograd",
    iban: "RS35 1600 0000 0000 0000 00", // REPLACE with real IBAN
    swift: "DBDBRSBG",
    accountNumber: "160-0000000000-00", // domaći račun za RSD uplate
  },
} as const;

export function formatAddress(): string {
  return `${IMPRINT.street}, ${IMPRINT.postalCode} ${IMPRINT.city}, ${IMPRINT.country}`;
}

export const TRUST_SIGNALS = [
  "Bez paketa van cenovnika — svaka cena je direktno iz zvaničnog cenovnika.",
  "Tačno znate šta plaćate i šta dobijate, bez skrivenih troškova i sitnih slova.",
  "Tri runde revizija su uključene u svaki projekat — da finalni rezultat tačno odgovara Vašoj viziji.",
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
    title: "1. Izračunate okvir",
    text: "Izaberete uslugu i tip obračuna. Odmah vidite početnu cenu i šta ona konkretno uključuje.",
  },
  {
    title: "2. Pošaljete materijale",
    text: "Forma traži samo ono što nam treba za start: osnove, fotografije, reference stila i kratak cilj projekta.",
  },
  {
    title: "3. Dobijete prve nacrte",
    text: "Za standardne projekte prve nacrte šaljemo za 3-5 radnih dana, uz jasnu komunikaciju kroz portal.",
  },
  {
    title: "4. Finalizujemo kroz revizije",
    text: "Tri runde revizija su uključene, zatim preuzimate finalne fajlove i dokumentaciju za projekat.",
  },
] as const;

export type NavItem = { href: string; label: string };

export const NAV_MAIN: NavItem[] = [
  { href: "/ai-studio", label: "AI Studio" },
  { href: "/services", label: "Usluge" },
  { href: "/pricing", label: "Cene" },
  ...(SITE_FEATURES.portfolio
    ? [{ href: "/portfolio", label: "Portfolio" }]
    : []),
  { href: "/about", label: "O nama" },
  { href: "/faq", label: "Pitanja" },
  { href: "/contact", label: "Kontakt" },
];

const STRUCTURED_DATA_DESCRIPTION =
  "Profesionalna arhitektonska vizuelizacija — 3D renderi enterijera i eksterijera, virtuelno opremanje i renovacija prostora.";

export const NAV_LEGAL: NavItem[] = [
  { href: "/legal/imprint", label: "Impressum" },
  // Privacy/refunds live as anchors on the consolidated terms page until
  // Track D splits them into standalone /legal/privacy and /legal/refunds.
  { href: "/legal/terms#privatnost", label: "Politika privatnosti" },
  { href: "/legal/terms#uslovi", label: "Uslovi korišćenja" },
  { href: "/legal/cookies", label: "Politika kolačića" },
  { href: "/legal/complaints", label: "Politika reklamacija" },
  { href: "/legal/terms#povracaj", label: "Povraćaj sredstava" },
  { href: "/legal/delivery", label: "Dostava" },
  { href: "/legal/certificates", label: "Sertifikati i standardi" },
];

// 4 konkretna primera uštede iz model-first cene. Strukturno isto kao i
// pre (step + title + description) — ModelFirst komponenta renderuje
// ovu listu, samo se sadržaj pomera sa generičkih koraka na merljive
// dolaska-uštede koje kupac može da računa.
export const ORDERING_STEPS = [
  {
    step: "01",
    title: "Novi ugao gledanja",
    description:
      "Osnovni eksterijer košta 29.300 RSD. Svaki sledeći ugao gledanja iste zgrade je samo 5.626 RSD (ušteda od 81%).",
  },
  {
    step: "02",
    title: "Više spratova",
    description:
      "Prvi sprat enterijera pokriva do 10 soba. Svaki sledeći sprat u istoj zgradi dobija automatski popust od 30%.",
  },
  {
    step: "03",
    title: "Animacije",
    description:
      "Ako već imamo izgrađen model iz Vašeg prethodnog projekta, cena animacije po sekundi je niža za 33%.",
  },
  {
    step: "04",
    title: "Stambene zgrade",
    description:
      "Za investitore: prvi tip stana plaćate po punoj ceni, a svaki sledeći tip stana dobija progresivni popust (do 44%).",
  },
] as const;

/** Alias kept for legacy imports in /contact and other places. */
export const HOW_IT_WORKS = ORDERING_STEPS;

export const FAQ_ITEMS = [
  {
    question: "Koliko traje izrada jednog rendera?",
    answer:
      "Za standardne projekte (npr. enterijer jedne prostorije), prve nacrte šaljemo u roku od 3 do 5 radnih dana. Za veće projekte, tačan rok dobijate odmah uz ponudu, pre početka rada.",
  },
  {
    question: "Da li cena uključuje revizije?",
    answer:
      "Apsolutno. Za razliku od industrijskog standarda (1–2 runde), mi uključujemo čak 3 runde revizija u osnovnu cenu. Želimo da budete 100% zadovoljni rezultatom.",
  },
  {
    question: "Koje materijale treba da Vam pošaljem?",
    answer:
      "Najkorisnije su osnove prostora (2D ili PDF), fotografije postojećeg stanja i reference stila ili atmosfere. Formu porudžbine smo napravili tako da možete da otpremite sve odjednom, bez komplikacija.",
  },
  {
    question: "Da li izdajete fiskalni račun i radite po ugovoru?",
    answer:
      "Da. Elegant Render je deo White Rook DOO i posluje u skladu sa svim zakonskim obavezama u Srbiji. Za svaki projekat izdajemo odgovarajuću dokumentaciju.",
  },
  {
    question: "Šta ako je projekat veći od uobičajenog?",
    answer:
      "Za stambene zgrade i velike investitorske projekte primenjujemo progresivne popuste (npr. popusti na ponovljene tipove stanova). Pošaljite nam upit i dobićete preciznu kalkulaciju.",
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
    question: "Kada koristim dodavanje ili zamenu nameštaja/dekora?",
    answer:
      "Kada imate fotografiju prostora i posebne slike konkretnog komada nameštaja, dekora, rasvete, biljke, umetnosti ili uređaja. Možete dodati više uglova istog modela/boje/materijala, a za zamenu se maskom označava postojeći komad koji menjamo.",
  },
  {
    question: "Da li rezultat mogu ponovo da obradim?",
    answer:
      "Da. Rezultat može da postane nova ulazna slika za malu korekciju ili nastavak dorade. Ako nastavljate isti tip obrade, sistem trenutno omogućava jedno besplatno ponavljanje.",
  },
  {
    question: "Šta ako obrada ne uspe?",
    answer:
      "Ako sistem ne uspe da završi obradu, naplaćeni krediti se vraćaju na AI Studio balans. Ako rezultat nije dovoljno dobar, nastavite doradu iz rezultata i koristite dostupno besplatno ponavljanje za isti tip obrade.",
  },
  {
    question: "Koliko dugo su fajlovi dostupni?",
    answer:
      "AI Studio fajlovi se čuvaju 30 dana. U tom periodu rezultat možete preuzeti iz istorije ili ga koristiti kao novu ulaznu sliku.",
  },
  {
    question: "Da li dobijam račun za kupovinu kredita?",
    answer:
      "Da. Elegant Render je deo White Rook DOO i za kupovinu kredita izdaje odgovarajuću dokumentaciju u skladu sa podacima kupca.",
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
    image: `${SITE.url}/og-image.jpg`,
    description: STRUCTURED_DATA_DESCRIPTION,
    email: SITE.email,
    taxID: IMPRINT.taxId,
    vatID: IMPRINT.taxId,
    foundingDate: IMPRINT.foundedAt,
    address: {
      "@type": "PostalAddress",
      streetAddress: IMPRINT.street,
      postalCode: IMPRINT.postalCode,
      addressLocality: IMPRINT.city,
      addressRegion: "RS",
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
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
        opens: "09:00",
        closes: "17:00",
      },
    ],
    areaServed: ["RS", "EU", "Worldwide"],
    currenciesAccepted: "EUR",
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

