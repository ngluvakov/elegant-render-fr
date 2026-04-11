export type ServiceCategory =
  | "eksterijer"
  | "enterijer"
  | "planovi"
  | "animacije"
  | "transformacija";

export type Service = {
  slug: string;
  code: string;
  name: string;
  category: ServiceCategory;
  tagline: string;
  description: string;
  startingFromEur: number;
  unit?: "po kadru" | "po prostoriji" | "po sekundi" | "po slici" | "po projektu";
  outsourced?: boolean;
  highlights: string[];
};

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  eksterijer: "Eksterijer",
  enterijer: "Enterijer",
  planovi: "Planovi",
  animacije: "Animacije i ture",
  transformacija: "Transformacija prostora",
};

export const CATEGORY_DESCRIPTIONS: Record<ServiceCategory, string> = {
  eksterijer:
    "Prikazi objekata, okruženja i spoljnih ambijenata — za kuće, zgrade i veće projekte.",
  enterijer:
    "Vizuelizacija unutrašnjih prostora po prostorijama ili celim spratovima.",
  planovi: "Pregledni 2D i 3D prikazi rasporeda prostora i situacionih celina.",
  animacije:
    "Arhitektonske animacije i interaktivne 360 ture za bogatu prezentaciju.",
  transformacija:
    "Unapređenje postojećeg prostora — opremanje, renovacija i korekcije fotografija.",
};

export const SERVICES: Service[] = [
  {
    slug: "spoljasnji-renderi",
    code: "exterior-rendering",
    name: "Spoljašnji renderi",
    category: "eksterijer",
    tagline: "Za kuće, zgrade, objekte i komplekse.",
    description:
      "Kompletan 3D model objekta sa prvim kadrom koji prikazuje glavni ulaz ili najznačajniji pogled. Dodatni uglovi iz istog modela su znatno povoljniji.",
    startingFromEur: 250,
    unit: "po kadru",
    highlights: [
      "Kompletan 3D model + prvi kadar",
      "Dodatni ugao iz istog modela: €48",
      "Ručno izrađeno osvetljenje i materijali",
    ],
  },
  {
    slug: "unutrasnji-renderi",
    code: "interior-rendering",
    name: "Unutrašnji renderi",
    category: "enterijer",
    tagline: "Vizuelizacija enterijera po prostorijama ili spratovima.",
    description:
      "Osnovni paket pokriva do 10 opremljenih prostorija, neograničen broj kadrova i osnovu sprata. Idealan za stanove, kuće i manje apartmane.",
    startingFromEur: 170,
    unit: "po prostoriji",
    highlights: [
      "Do 10 opremljenih prostorija",
      "Neograničen broj kadrova u sklopu paketa",
      "Dodatna prostorija: €28 · Dodatni sprat: €120",
    ],
  },
  {
    slug: "vazdusni-prikazi",
    code: "aerial-rendering",
    name: "Vazdušni prikazi",
    category: "eksterijer",
    tagline: "Za veće projekte i prikaz okruženja.",
    description:
      "Prikaz iz ptičje perspektive koji obuhvata kompletan objekat i šire okruženje. Pogodno za razvojne projekte, stambene komplekse i parcele sa više objekata.",
    startingFromEur: 420,
    unit: "po kadru",
    highlights: [
      "Model objekta sa širim okruženjem",
      "Idealno za razvojne projekte i parcele",
      "Napomena: prikaz zadnje strane dodaje jednokratno +25%",
    ],
  },
  {
    slug: "prikazi-dvorista",
    code: "landscape-rendering",
    name: "Prikazi dvorišta i okruženja",
    category: "eksterijer",
    tagline: "Za bašte, dvorišta i spoljne ambijente.",
    description:
      "Teren, zelenilo i uređenje spoljašnjeg prostora uz prvi kadar. Dodatni uglovi iz istog modela dolaze po znatno nižoj ceni.",
    startingFromEur: 220,
    unit: "po kadru",
    highlights: [
      "Teren + zelenilo + prvi kadar",
      "Dodatni ugao iz istog modela: €45",
      "Dostupna vazdušna varijanta: €380",
    ],
  },
  {
    slug: "fotomontaza",
    code: "photomontage",
    name: "Fotomontaža",
    category: "eksterijer",
    tagline: "Uklapanje projekta u stvarnu fotografiju.",
    description:
      "Vaš budući objekat pažljivo uklopljen u realnu fotografiju lokacije, sa realnim osvetljenjem i senkama. Savršeno za dozvole, prezentacije i prodaju.",
    startingFromEur: 300,
    unit: "po slici",
    highlights: [
      "3D model + uklapanje + kolor grejding",
      "Dodatni ugao iz iste fotografije: €55",
      "Drugačija fotografija iste lokacije: €85",
    ],
  },
  {
    slug: "3d-osnove",
    code: "3d-floor-plans",
    name: "3D osnove prostora",
    category: "planovi",
    tagline: "Pregled rasporeda u atraktivnom prikazu.",
    description:
      "Moderni prikaz rasporeda sa visine, sa mogućnošću opremanja i stilskih varijanti. Idealno za oglase, kataloge i razumljivu prezentaciju kupcima.",
    startingFromEur: 29,
    unit: "po projektu",
    highlights: [
      "Jedan sprat: €29 · Dva sprata: €46",
      "Verzija sa nameštajem: +€8",
      "Dodatna stilska varijanta: +€6",
    ],
  },
  {
    slug: "2d-osnove",
    code: "2d-floor-plans",
    name: "2D osnove prostora",
    category: "planovi",
    tagline: "Jednostavni planski prikazi.",
    description:
      "Čisti vektorski planovi, pogodni za tehničku dokumentaciju i katalog. Isporučeno kroz našu partnersku mrežu.",
    startingFromEur: 20,
    unit: "po projektu",
    outsourced: true,
    highlights: [
      "Vektorski izlaz",
      "Jedan sprat: €20 · Dva sprata: €32",
      "Dodatne stilske varijante od €4",
    ],
  },
  {
    slug: "3d-situacioni",
    code: "3d-site-plans",
    name: "3D situacioni prikazi",
    category: "planovi",
    tagline: "Širi prikaz parcele i objekata.",
    description:
      "Kompletan situacioni prikaz terena, objekata i uređenja okoline iz ptičje perspektive — idealno za masterplane i razvojne prezentacije.",
    startingFromEur: 350,
    unit: "po kadru",
    highlights: [
      "Teren + objekti + uređenje",
      "Sezonske varijante od €85",
      "Faze izgradnje od €95",
    ],
  },
  {
    slug: "arhitektonske-animacije",
    code: "architectural-animation",
    name: "Arhitektonske animacije",
    category: "animacije",
    tagline: "Video prezentacije prostora i objekata.",
    description:
      "Dinamični video prikaz objekta i ambijenta. Cena se obračunava po sekundi, sa popustima za dužinu i ponovno korišćenje postojećeg modela.",
    startingFromEur: 15,
    unit: "po sekundi",
    highlights: [
      "Minimum 15 sekundi",
      "Postojeći model: 33% popusta",
      "Popust na dužinu do −25% za 2+ minuta",
    ],
  },
  {
    slug: "360-ture",
    code: "360-virtual-tours",
    name: "360 virtuelne ture",
    category: "animacije",
    tagline: "Interaktivni obilazak prostora.",
    description:
      "Web-zasnovana ture sa više tačaka pregleda koje korisnik može da razgleda direktno u pretraživaču. Dostupna i brendirana varijanta.",
    startingFromEur: 20,
    unit: "po projektu",
    highlights: [
      "Asemblaža i hosting ture",
      "Interaktivna navigacija kroz osnovu",
      "Brendirana verzija (logo, boje): €35",
    ],
  },
  {
    slug: "virtuelno-opremanje",
    code: "virtual-staging",
    name: "Virtuelno opremanje",
    category: "transformacija",
    tagline: "Nameštaj i dekor u praznom prostoru.",
    description:
      "Praznu fotografiju prostora pretvaramo u opremljenu scenu koja prodaje. Idealno za oglase nekretnina i prezentacije.",
    startingFromEur: 18,
    unit: "po slici",
    highlights: [
      "Prva opremljena slika: €18",
      "Dodatni ugao iste prostorije: €12",
      "Volume popust nakon 10 slika",
    ],
  },
  {
    slug: "virtuelna-renovacija",
    code: "virtual-renovation",
    name: "Virtuelna renovacija",
    category: "transformacija",
    tagline: "Vizuelni prikaz adaptacije pre radova.",
    description:
      "Pogledajte kako bi izgledala renovirana prostorija pre nego što krenete u radove. Podovi, zidovi, kupatila, kuhinje, mobilijar.",
    startingFromEur: 66,
    unit: "po slici",
    highlights: [
      "Prva renovirana slika: €66",
      "Dodatni ugao iste prostorije: €59",
      "Volume popust za celu nekretninu",
    ],
  },
  {
    slug: "dan-u-noc",
    code: "day-to-dusk",
    name: "Dan u noć",
    category: "transformacija",
    tagline: "Pretvaranje dnevne scene u večernju.",
    description:
      "Zamena neba, korekcija osvetljenja i kolor grejding za atraktivnije oglasne prikaze — isporučeno kroz našu partnersku mrežu.",
    startingFromEur: 10,
    unit: "po slici",
    outsourced: true,
    highlights: [
      "€10 po slici",
      "Volume rate (10+): €8",
      "Hitna isporuka (24h): +50%",
    ],
  },
  {
    slug: "uklanjanje-elemenata",
    code: "item-removal",
    name: "Uklanjanje elemenata",
    category: "transformacija",
    tagline: "Čišćenje prostora za oglas.",
    description:
      "Uklanjanje ličnih stvari, nereda i nepoželjnih elemenata sa fotografije — od sitnih do kompleksnih slučajeva sa rekonstrukcijom pozadine.",
    startingFromEur: 12,
    unit: "po slici",
    highlights: [
      "Jednostavno uklanjanje: €12",
      "Kompleksno: €25",
      "Volume rate: €10 / €20",
    ],
  },
];

export function getServiceBySlug(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

export function getServicesByCategory(category: ServiceCategory): Service[] {
  return SERVICES.filter((s) => s.category === category);
}

export const CATEGORY_ORDER: ServiceCategory[] = [
  "enterijer",
  "eksterijer",
  "planovi",
  "animacije",
  "transformacija",
];
