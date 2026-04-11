/*
  Elegant Render service catalog.
  Pricing sourced from docs/pricing/pillar-1-extracted.md (White Rook Model-First Pricing, Pillar 1, EUR).
  Do not invent tier names, bundle prices, or math that does not appear in the PDF.
  Some services have multiple variants (e.g. Static vs 360 Interior); others have a single variant.
*/

export type ServiceCategory =
  | "eksterijer"
  | "enterijer"
  | "planovi"
  | "animacije"
  | "transformacija";

export type PricingVariant = {
  id: string;
  title: string;
  /** Whole-euro amount, used for comparisons and starting-from displays. */
  basePrice: number;
  /** Human price label — may include unit suffix (e.g. "€15/sec"). */
  priceLabel: string;
  /** Per-unit basis (e.g. "osnovni paket po spratu", "prvi kadar"). */
  unitLabel: string;
  /** One-line explanation of the variant. */
  description: string;
  /** What the base price includes. */
  included: string;
  /** Add-on lines, already formatted with prices. */
  addOns: string[];
  /** Optional caveat or rule the customer should see. */
  note?: string;
};

export type ServiceIcon =
  | "home"
  | "grid"
  | "sparkles"
  | "refresh"
  | "file-image"
  | "images"
  | "layers"
  | "tree"
  | "camera"
  | "sun"
  | "eraser";

export type Service = {
  slug: string;
  code: string;
  name: string;
  shortName: string;
  category: ServiceCategory;
  icon: ServiceIcon;
  tagline: string;
  /** Longer paragraph for service detail page. */
  description: string;
  /** Picker-card subtitle, highlighting the main use case. */
  highlight: string;
  /** What the client should send to get started. */
  materials: string;
  /** Optional hero image URL (may be cloudfront, local, or empty). */
  asset?: string;
  /** Why this service is priced the way it is (model-first context). */
  philosophy: string;
  variants: PricingVariant[];
  /** Feature this service in the quick-order picker on the home page. */
  featured?: boolean;
  /** Delivered via White Rook partner network rather than in-house. */
  outsourced?: boolean;
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
  planovi:
    "Pregledni 2D i 3D prikazi rasporeda prostora i situacionih celina.",
  animacije:
    "Arhitektonske animacije i interaktivne 360 ture za bogatu prezentaciju.",
  transformacija:
    "Unapređenje postojećeg prostora — opremanje, renovacija i korekcije fotografija.",
};

export const CATEGORY_ORDER: ServiceCategory[] = [
  "enterijer",
  "eksterijer",
  "planovi",
  "animacije",
  "transformacija",
];

const HERO_ASSET =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663405648099/H5vzEpcfPDUNQp2BAKXnFZ/elegant-render-hero-01-cof6RpY9ycfwrFhhZguZbn.webp";
const SERVICES_ASSET =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663405648099/H5vzEpcfPDUNQp2BAKXnFZ/elegant-render-services-01-LuNQfFVpbhKVCFf7cXAbYJ.webp";
const PROCESS_ASSET =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663405648099/H5vzEpcfPDUNQp2BAKXnFZ/elegant-render-process-01-aUsUQMZT3yMu6WtsnrjA8L.webp";
const PORTFOLIO_ASSET =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663405648099/H5vzEpcfPDUNQp2BAKXnFZ/elegant-render-portfolio-01-HpiHZcQXFq7MF3BnppeqJc.webp";

export const SERVICES: Service[] = [
  {
    slug: "unutrasnji-renderi",
    code: "interior-rendering",
    name: "Unutrašnji renderi",
    shortName: "Enterijer",
    category: "enterijer",
    icon: "home",
    tagline: "Vizuelizacija enterijera po prostorijama ili spratovima.",
    description:
      "Enterijer ide po model-first logici: osnovni paket pokriva kompletnu scenu jednog sprata, a dodatne prostorije i dodatni spratovi se dodaju po transparentnom cenovniku. Pogodno za stanove, kuće i manje apartmane.",
    highlight:
      "Najjasniji javni ulaz za stanove, kuće, apartmane i manje stambene projekte.",
    materials:
      "Pošalji osnovu, reference, stil i spisak prostorija. Ako postoji više spratova, svaki sprat se računa zasebno.",
    asset: HERO_ASSET,
    philosophy:
      "Kod enterijera javna cena ne kreće od broja kadrova, već od osnovnog model-first paketa po spratu. Tako kupac odmah zna da prvi korak pokriva baznu izgradnju scene, a dodatni obim se dodaje jasno i transparentno.",
    featured: true,
    variants: [
      {
        id: "interior-static",
        title: "Static Interior — po spratu",
        basePrice: 170,
        priceLabel: "€170",
        unitLabel: "osnovni paket po spratu",
        description:
          "Najbolja početna tačka kada želite kompletan start za jedan sprat bez izmišljanja paketa.",
        included:
          "Do 10 opremljenih soba, neograničen broj kadrova i floor plan.",
        addOns: [
          "11. i svaka sledeća opremljena soba: €28",
          "Dodatni kadar u postojećoj sobi: €10",
          "Dodatni sprat: €120",
        ],
      },
      {
        id: "interior-360",
        title: "360 Interior — po spratu",
        basePrice: 295,
        priceLabel: "€295",
        unitLabel: "360 paket po spratu",
        description:
          "Za interaktivniji prikaz kada jedan statični set nije dovoljan i želite kombinaciju hotspotova i statika.",
        included: "Do 10 hotspot soba, 10 statičkih kamera i floor plan.",
        addOns: [
          "11. i svaka sledeća hotspot soba: €45",
          "Dodatni hotspot u postojećoj sobi: €27",
          "Dodatna statička kamera: €10",
          "Dodatni sprat (360): €205",
        ],
      },
    ],
  },
  {
    slug: "spoljasnji-renderi",
    code: "exterior-rendering",
    name: "Spoljašnji renderi",
    shortName: "Eksterijer",
    category: "eksterijer",
    icon: "grid",
    tagline: "Za kuće, zgrade, objekte i komplekse.",
    description:
      "Kompletan 3D model objekta sa logikom prvog kadra i povoljnijih dodatnih uglova iz istog modela. Dostupne su statična, 360 i aerial varijante — sve se obračunavaju po istim model-first pravilima.",
    highlight:
      "Za kuće, objekte, fasade i manje investicione prezentacije sa jasnom logikom prvog i dodatnih prikaza.",
    materials:
      "Pošalji osnove, fasade, skice, reference i napiši da li želiš statični, 360 ili aerial prikaz.",
    asset: PORTFOLIO_ASSET,
    philosophy:
      "Kod eksterijera prvi render nosi pun trošak izgradnje modela. Svaki sledeći ugao iz istog modela ide po nižoj ceni, a dodatna doplata postoji samo ako novi kadar traži geometriju koja ranije nije bila modelovana.",
    featured: true,
    variants: [
      {
        id: "exterior-static",
        title: "Static Exterior",
        basePrice: 250,
        priceLabel: "€250",
        unitLabel: "prvi kadar",
        description:
          "Osnovni javni ulaz za jedan kompletan statični eksterijerski prikaz sa prvim uglom kamere.",
        included: "Kompletan 3D model i prvi ugao kamere.",
        addOns: [
          "Dodatna kamera sa iste strane modela: €48",
          "Extended model surcharge: +25% jednom po modelu (kamera sa ranije neviđenom geometrijom)",
        ],
        note: "Kada se extended model surcharge jednom plati, model se smatra dovršenim i naredne kamere ulaze u standardnu dodatnu cenu.",
      },
      {
        id: "exterior-360",
        title: "360 Exterior",
        basePrice: 335,
        priceLabel: "€335",
        unitLabel: "prvi 360 prikaz",
        description:
          "Za projekte gde kupac treba da dobije interaktivniji pregled spoljnog prostora iz jednog modela.",
        included: "Pun model i prvi VR-ready 360 output.",
        addOns: [
          "Dodatni hotspot, ista strana modela: €48",
          "Extended model hotspot: €60",
          "Volume rate nakon 4 dodatna hotspota: €53 po hotspotu",
        ],
      },
      {
        id: "exterior-aerial",
        title: "Aerial Exterior",
        basePrice: 420,
        priceLabel: "€420",
        unitLabel: "aerial prikaz",
        description:
          "Za projekte gde je važan širi kontekst parcele, objekta i okruženja iz ptičje perspektive.",
        included: "Pun model i okruženje za aerial pogled.",
        addOns: ["Aerial extended model — prikaz zadnje strane: +25%"],
      },
    ],
  },
  {
    slug: "virtuelno-opremanje",
    code: "virtual-staging",
    name: "Virtuelno opremanje",
    shortName: "Virtual staging",
    category: "transformacija",
    icon: "sparkles",
    tagline: "Nameštaj i dekor u praznom prostoru.",
    description:
      "Praznu fotografiju prostora pretvaramo u opremljenu scenu koja prodaje. Idealno za oglase nekretnina i brze prezentacije. Dostupne su statična i 360 varijante.",
    highlight:
      "Najbrža ulazna cena za listing upgrade kada već postoji fotografija prostora.",
    materials:
      "Pošalji praznu ili slabo uređenu fotografiju prostora i napiši željeni stil.",
    asset: SERVICES_ASSET,
    philosophy:
      "Virtual staging se ne predstavlja kroz izmišljene bundle pakete, već kroz cenu prve slike i niže cene za dodatne uglove ili dodatne prostorije iste nekretnine.",
    featured: true,
    variants: [
      {
        id: "staging-static",
        title: "Static Staging",
        basePrice: 18,
        priceLabel: "€18",
        unitLabel: "prva slika",
        description:
          "Javni početak za jednu staged fotografiju kada kupcu treba brz i jasan vizuelni upgrade oglasa.",
        included:
          "Analiza sobe, odabir nameštaja, raspored i svetlo za prvu sliku.",
        addOns: [
          "Dodatni ugao iste sobe: €12",
          "Druga soba iste nekretnine: €15",
          "Nakon 10 slika: €13 po slici",
          "Re-staging u drugom stilu: €12",
        ],
      },
      {
        id: "staging-360",
        title: "360 Staging",
        basePrice: 34,
        priceLabel: "€34",
        unitLabel: "prvi 360 hotspot",
        description:
          "Za interaktivniji staging kada prostor treba prikazati u 360 modu, a ne samo kroz statičan kadar.",
        included: "Kompletno 360 opremanje prve prostorije.",
        addOns: [
          "Dodatni hotspot iste sobe: €24",
          "Druga soba iste nekretnine: €28",
          "Nakon 6 hotspotova: €24 po hotspotu",
          "Re-staging u drugom stilu: €22",
        ],
      },
    ],
  },
  {
    slug: "virtuelna-renovacija",
    code: "virtual-renovation",
    name: "Virtuelna renovacija",
    shortName: "Renovacija",
    category: "transformacija",
    icon: "refresh",
    tagline: "Vizuelni prikaz adaptacije pre radova.",
    description:
      "Pogledajte kako bi izgledala renovirana prostorija pre nego što krenete u radove. Podovi, zidovi, kupatila, kuhinje, mobilijar — sve se razume iz postojeće fotografije i vaših referenci.",
    highlight:
      "Za odluku pre realnih radova, sa cenom po prikazu i popustom kada se radi više uglova istog prostora.",
    materials:
      "Pošalji postojeće stanje, fotografije i napiši šta želiš da se promeni u prostoru.",
    asset: PROCESS_ASSET,
    philosophy:
      "Renovacija se javno komunicira kroz cenu prve slike i niže cene za dodatne uglove istog prostora ili za više prostorija iste nekretnine. Kupac vidi da se odluka širi postepeno, a ne kroz nejasan paket.",
    featured: true,
    variants: [
      {
        id: "renovation-main",
        title: "Virtual Renovation",
        basePrice: 66,
        priceLabel: "€66",
        unitLabel: "prvi prikaz",
        description:
          "Javna ulazna cena za prvi renovation prikaz jednog prostora ili ključnog ugla promene.",
        included: "Pun renovation rad na prvom prikazu jednog pogleda.",
        addOns: [
          "Dodatni ugao iste sobe: €59",
          "4. i svaki sledeći ugao iste sobe: €53",
          "Druga soba iste nekretnine: €56",
          "Nakon 5 soba iste nekretnine: €50 po sobi",
        ],
      },
    ],
  },
  {
    slug: "osnove",
    code: "floor-plans",
    name: "2D i 3D osnove prostora",
    shortName: "Osnove",
    category: "planovi",
    icon: "file-image",
    tagline: "Pregledni planski prikazi za oglase, prodaju i planiranje.",
    description:
      "2D i 3D osnove se ne mešaju u jedan paket — svaka ima svoju logiku cena i doplata. 2D daje čist vektorski prikaz, 3D daje atraktivniji prikaz rasporeda za kupce koji žele da brzo razumeju prostor.",
    highlight:
      "Pregledna osnova za oglase, prodaju i planiranje, uz jasno odvojene 2D i 3D cenovne logike.",
    materials:
      "Pošalji skicu, postojeći tlocrt ili što jasnije informacije o rasporedu prostora i nivoima.",
    asset: PROCESS_ASSET,
    philosophy:
      "2D i 3D osnove ne smeju da se mešaju u jedan neodređen paket. Kupac mora odmah da vidi da li kupuje čistu 2D osnovu ili 3D plan sa sopstvenom logikom cena i doplata.",
    featured: true,
    variants: [
      {
        id: "floorplan-2d",
        title: "2D Floor Plan",
        basePrice: 20,
        priceLabel: "€20",
        unitLabel: "single level",
        description:
          "Najniža javna ulazna cena za čistu 2D osnovu jednog nivoa.",
        included: "Jedan nivo u čistom vektorskom prikazu.",
        addOns: [
          "Double level: €32",
          "Svaki dodatni nivo: €10",
          "Duplicate floor: €6",
          "Furnished version: €6",
          "Color/style variant: €4",
        ],
        note: "2D osnove dolaze kroz White Rook partnersku mrežu.",
      },
      {
        id: "floorplan-3d",
        title: "3D Floor Plan",
        basePrice: 29,
        priceLabel: "€29",
        unitLabel: "single level",
        description:
          "Javni početak za 3D osnovu kada raspored treba da bude lakši za razumevanje na prvi pogled.",
        included: "Jedan nivo u 3D floor plan prikazu.",
        addOns: [
          "Double level: €46",
          "Svaki dodatni nivo: €15",
          "Duplicate floor: €10",
          "Furniture overlay: €8",
          "Design variant: €6",
        ],
      },
    ],
  },
  {
    slug: "360-ture-i-animacije",
    code: "tours-and-animation",
    name: "360 ture i animacije",
    shortName: "360 / animacija",
    category: "animacije",
    icon: "images",
    tagline: "Interaktivnost ili kretanje — u odvojenim cenovnim logikama.",
    description:
      "360 ture i animacije imaju dve potpuno različite cenovne logike. Tour assembly je mali dodatak na postojeće 360 izlaze; animacija ima cenu po sekundi sa popustima za postojeće modele i aktivne projekte.",
    highlight:
      "Za projekte kojima treba interaktivnost ili kretanje, ali bez mešanja dve različite logike cene u jedan paket.",
    materials:
      "Pošalji model, osnovu ili opis prostora i napiši da li želiš 360 turu, animaciju ili oba izlaza.",
    asset: PORTFOLIO_ASSET,
    philosophy:
      "360 ture i animacije imaju dve odvojene komercijalne logike. Tour assembly je mali dodatak na postojeće 360 izlaze, dok animacija ima cenu po sekundi. Zato ih interfejs odvaja umesto da ih spaja u lažni bundle.",
    featured: true,
    variants: [
      {
        id: "tour-assembly",
        title: "360 Tour Add-ons",
        basePrice: 20,
        priceLabel: "€20",
        unitLabel: "tour assembly & hosting",
        description:
          "Javni dodatak za web-based turu kada već postoji set 360 hotspotova.",
        included: "Tour assembly i hosting za interaktivni prikaz.",
        addOns: [
          "Interactive floor plan navigation: €15",
          "Branded tour / white-label UI: €35",
        ],
        note: "Ovo nije cena za izradu 360 rendera, već dodatna vrednost na vrhu 360 sadržaja.",
      },
      {
        id: "animation-from-scratch",
        title: "Arhitektonska animacija — from scratch",
        basePrice: 15,
        priceLabel: "€15/sec",
        unitLabel: "po sekundi, min. 15s",
        description:
          "Za novi animirani izlaz kada model mora da se gradi od početka.",
        included: "Full model build i animacija (minimalno 15 sekundi).",
        addOns: [
          "Ako već postoji White Rook model: €10/sec",
          "Ako je aktivan rendering projekat: €8/sec",
          "Additional camera path: €5/sec",
          "Day/Night version: +30%",
          "Seasonal variation: +40%",
          "Popust na dužinu: 31–60s −10%, 61–120s −20%, 120s+ −25%",
        ],
      },
    ],
  },
  {
    slug: "prikazi-dvorista",
    code: "landscape-rendering",
    name: "Prikazi dvorišta i okruženja",
    shortName: "Landscape",
    category: "eksterijer",
    icon: "tree",
    tagline: "Za bašte, dvorišta i spoljne ambijente.",
    description:
      "Teren, zelenilo i uređenje spoljašnjeg prostora uz prvi kadar. Dodatni uglovi iz istog modela dolaze po znatno nižoj ceni. Dostupan je i vazdušni pogled na okruženje.",
    highlight:
      "Pogodno za dvorišta, bašte i spoljne ambijente sa teren-first obračunom.",
    materials:
      "Pošalji osnove parcele, postojeće fotografije i reference atmosfere koju želiš.",
    philosophy:
      "Landscape model nosi početni trošak izgradnje terena i zelenila; svaki dodatni ugao iz istog modela je povoljniji. Extended model surcharge se plaća jednokratno ako se traži teren koji nije bio modelovan.",
    variants: [
      {
        id: "landscape-main",
        title: "Landscape Render",
        basePrice: 220,
        priceLabel: "€220",
        unitLabel: "prvi kadar",
        description: "Teren, vegetacija i prvi kadar iz istog modela.",
        included: "Kompletan teren, vegetacija i prvi kadar kamere.",
        addOns: [
          "Dodatna kamera, postojeći model: €45",
          "Extended model surcharge: +25% jednom po modelu",
          "Aerial landscape view: €380",
        ],
      },
    ],
  },
  {
    slug: "fotomontaza",
    code: "photomontage",
    name: "Fotomontaža",
    shortName: "Photomontage",
    category: "eksterijer",
    icon: "camera",
    tagline: "Uklapanje projekta u stvarnu fotografiju.",
    description:
      "Vaš budući objekat pažljivo uklopljen u realnu fotografiju lokacije, sa realnim osvetljenjem, senkama i kontekstom. Savršeno za dozvole, prezentacije i prodaju.",
    highlight:
      "Za prikaz budućeg objekta na realnoj lokaciji sa realnim osvetljenjem i senkama.",
    materials:
      "Pošalji fotografije lokacije iz više uglova, osnovne crteže objekta i reference stila.",
    philosophy:
      "Fotomontaža zahteva i 3D rad i pažljivo uklapanje na postojeću fotografiju. Prva slika nosi pun trošak analize i uklapanja; dodatni uglovi sa iste fotografije ili nove fotografije se obračunavaju po jasnoj logici.",
    variants: [
      {
        id: "photomontage-main",
        title: "Photomontage",
        basePrice: 300,
        priceLabel: "€300",
        unitLabel: "prva slika",
        description:
          "3D model + uklapanje + kolor grejding za prvu sliku lokacije.",
        included:
          "Kompletan 3D model, photo matching i compositing za prvu sliku.",
        addOns: [
          "Dodatni ugao iste fotografije: €55",
          "Drugačija fotografija iste lokacije: €85",
          "Extended model surcharge: +25% jednom (ako je potrebna nova geometrija)",
        ],
      },
    ],
  },
  {
    slug: "3d-situacioni",
    code: "3d-site-plans",
    name: "3D situacioni prikazi",
    shortName: "Site Plan",
    category: "planovi",
    icon: "layers",
    tagline: "Širi prikaz parcele i objekata.",
    description:
      "Kompletan situacioni prikaz terena, objekata i uređenja okoline iz ptičje perspektive — idealno za masterplane, razvojne prezentacije i investitorske ponude.",
    highlight: "Za masterplanove, razvojne projekte i širi prikaz parcele.",
    materials:
      "Pošalji katastarsku osnovu, planove objekata i referencu stila uređenja.",
    philosophy:
      "Situacioni prikaz gradi ceo teren, objekte i uređenje jednom; sezonske varijante i faze izgradnje se dodaju kroz istu scenu po nižoj ceni.",
    variants: [
      {
        id: "site-plan-main",
        title: "3D Site Plan",
        basePrice: 350,
        priceLabel: "€350",
        unitLabel: "prvi prikaz",
        description:
          "Pun teren, objekti i landscaping za prvi prikaz parcele.",
        included: "Teren + objekti + landscaping za prvi pogled.",
        addOns: [
          "Dodatni ugao, postojeći model: €65",
          "Sezonska varijanta: €85",
          "Faza izgradnje — selektivna vidljivost: €95",
        ],
      },
    ],
  },
  {
    slug: "dan-u-noc",
    code: "day-to-dusk",
    name: "Dan u noć",
    shortName: "Day-to-Dusk",
    category: "transformacija",
    icon: "sun",
    tagline: "Pretvaranje dnevne scene u večernju.",
    description:
      "Zamena neba, korekcija osvetljenja i kolor grejding za atraktivnije oglasne prikaze. Isporučeno kroz našu partnersku mrežu.",
    highlight: "Kada je ista scena potrebna u večernjem ili zlatnom svetlu.",
    materials: "Pošalji dnevnu fotografiju i opis željene atmosfere.",
    outsourced: true,
    philosophy:
      "Day-to-dusk je brz post-production dodatak; volume rate i rush delivery su jedine varijacije. Nema skrivenih paketa.",
    variants: [
      {
        id: "day-to-dusk-main",
        title: "Day-to-Dusk",
        basePrice: 10,
        priceLabel: "€10",
        unitLabel: "po slici",
        description:
          "Sky replacement, lighting i color grading za jednu sliku.",
        included:
          "Zamena neba, korekcija osvetljenja i kolor grejding po slici.",
        addOns: [
          "Shadow removal add-on: €5",
          "Volume rate (10+ slika): €8 po slici",
          "Rush delivery (24h): +50%",
        ],
      },
    ],
  },
  {
    slug: "uklanjanje-elemenata",
    code: "item-removal",
    name: "Uklanjanje elemenata",
    shortName: "Item Removal",
    category: "transformacija",
    icon: "eraser",
    tagline: "Čišćenje prostora za oglas.",
    description:
      "Uklanjanje ličnih stvari, nereda i nepoželjnih elemenata sa fotografije — od sitnih do kompleksnih slučajeva sa rekonstrukcijom pozadine.",
    highlight:
      "Za oglase gde prostor mora da bude čist i bez nepotrebnih detalja.",
    materials:
      "Pošalji fotografiju i jasno označi šta želiš da se ukloni (tekstualno ili skicom).",
    philosophy:
      "Jednostavno i kompleksno uklanjanje imaju različite početne cene. Nakon 10 slika volume rate snižava cenu za obe kategorije.",
    variants: [
      {
        id: "item-removal-main",
        title: "Item Removal",
        basePrice: 12,
        priceLabel: "od €12",
        unitLabel: "po slici",
        description:
          "Simple removal od €12, complex od €25 — bira se prema složenosti.",
        included:
          "Jednostavno uklanjanje sitnih elemenata sa čistom pozadinom.",
        addOns: [
          "Complex removal (rekonstrukcija): €25",
          "Dodatna slika — simple: €8",
          "Dodatna slika — complex: €18",
          "Volume rate 10+ slika: €10 simple / €20 complex",
        ],
      },
    ],
  },
];

export function getServiceBySlug(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

export function getServicesByCategory(category: ServiceCategory): Service[] {
  return SERVICES.filter((s) => s.category === category);
}

export function getFeaturedServices(): Service[] {
  return SERVICES.filter((s) => s.featured);
}

export function getStartingPrice(service: Service): number {
  return Math.min(...service.variants.map((v) => v.basePrice));
}

export function formatStartingPrice(service: Service): string {
  const first = service.variants[0];
  return first.priceLabel;
}
