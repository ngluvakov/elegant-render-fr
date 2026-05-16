/**
 * services.ts — Display-facing service catalog with pricing variants.
 *
 * Exports SERVICES[], type definitions, category labels, and lookup helpers
 * (getServiceBySlug, getFeaturedServices, etc.). Sourced from pillar-1 PDF.
 *
 * Used by: site-header, quick-order-hero, services-grid, usluge/[slug],
 *          sitemap.ts, catalog/configurator
 */

/*
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
  /** When both are set, the home-page "Minimalni ulaz" preview renders a
   *  diagonal before/after reveal (BeforeAfterReveal) instead of a static
   *  image. Useful for transformation services where the value is the diff. */
  beforeAsset?: string;
  afterAsset?: string;
  /** When set, the preview renders an iframe (e.g. Kuula 360 panorama)
   *  instead of a static image. Takes precedence over `asset` but yields
   *  to the before/after pair. */
  embedSrc?: string;
  /** Detail-page hero (16:9, 1920×1080). Separate from the home-page
   *  thumbnails because the detail page is the bottom-of-funnel surface
   *  and carries a larger, more cinematic frame. Same priority chain as
   *  the home picker: detailBeforeAsset+detailAfterAsset → reveal,
   *  detailEmbedSrc → iframe, detailAsset → image. */
  detailAsset?: string;
  detailBeforeAsset?: string;
  detailAfterAsset?: string;
  detailEmbedSrc?: string;
  /** Plain-language line that shows next to "od €X" everywhere a price
   *  is displayed (picker, services grid, hero chip). Anchors the price
   *  to the quantity it covers so customers don't read €170 as "one
   *  render" when it's actually "whole floor + unlimited renders". */
  priceContext?: string;
  /** Optional list of target customer segments shown as "Idealno za:"
   *  chips on the service detail page. Set only on investor-grade
   *  services where segmentation actually clarifies the value prop. */
  forSegments?: readonly string[];
  /** Why this service is priced the way it is (customer-value framing). */
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

// Cloudfront fallback used only by the 360 tour service for SEO/OG
// meta images — that surface keeps the Kuula iframe in the UI and
// doesn't yet have a custom expert-* lovart shot. Other services
// migrated to local /artwork/expert-*.webp assets.
const PORTFOLIO_ASSET =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663405648099/H5vzEpcfPDUNQp2BAKXnFZ/elegant-render-portfolio-01-HpiHZcQXFq7MF3BnppeqJc.webp";

export const SERVICES: Service[] = [
  {
    slug: "unutrasnji-renderi",
    code: "interior-rendering",
    name: "Unutrašnji renderi",
    shortName: "Unutrašnji renderi",
    category: "enterijer",
    icon: "home",
    tagline: "Pokažite kupcima dom još pre nego što izvođači stignu na lokaciju.",
    description:
      "Pokažite kupcima ili klijentima kako će izgledati svaka prostorija budućeg doma — još pre nego što počnu radovi. Jedna porudžbina pokriva ceo sprat sa do 10 opremljenih prostorija i neograničen broj uglova kamere iz tih soba. Prodajte stan iz prospekta, dogovorite klijenta na izboru materijala, ili predstavite enterijer pre nego što ga izgradite.",
    highlight:
      "Za stanove u izgradnji, kuće pred renoviranje i investitorske jedinice — jedna investicija pokriva ceo sprat, ne pojedinačnu sobu.",
    materials:
      "Pošaljite nam osnovu (2D ili PDF), reference stila i spisak prostorija. Što jasniji ulaz, brže šaljemo prve nacrte — standardno 3–5 radnih dana.",
    asset: "/artwork/expert-unutrasnji-renderi.webp",
    philosophy:
      "Najveći deo posla je izrada 3D modela — gradimo ga jednom i naplaćujemo jednom. Nakon toga svaki novi ugao, promena nameštaja ili doba dana kreće od €10, ne od pune cene rendera. Tako planirate marketing budžet u sezoni pre-prodaje bez neprijatnih iznenađenja.",
    priceContext:
      "Ceo sprat sa do 10 opremljenih prostorija + neograničen broj rendera iz tih soba.",
    forSegments: [
      "Investitori (multi-unit)",
      "Arhitekte enterijera",
      "Privatni klijenti pred renoviranje",
    ],
    featured: true,
    variants: [
      {
        id: "interior-static",
        title: "Klasični prikaz — po spratu",
        basePrice: 170,
        priceLabel: "€170",
        unitLabel: "ceo sprat sa do 10 prostorija",
        description:
          "Najjača kombinacija za prospekt i prezentaciju investitorskih jedinica — jedna investicija pokriva ceo sprat sa neograničenim brojem uglova.",
        included:
          "Kompletna izgradnja 3D modela za jedan sprat. Uključuje do 10 opremljenih prostorija, neograničen broj uglova kamere iz tih soba i tlocrt sprata. Svaki sledeći sprat: €120 (30% jeftiniji).",
        addOns: [
          "11. i svaka sledeća opremljena soba: €28",
          "Dodatni ugao kamere u postojećoj sobi: €10",
          "Dodatni sprat: €120 (30% popust)",
        ],
      },
      {
        id: "interior-360",
        title: "Interaktivna 360 tura — po spratu",
        basePrice: 295,
        priceLabel: "€295",
        unitLabel: "ceo sprat u 360 turi",
        description:
          "Kupac obilazi prostor mišem kao u igri — savršeno za online prezentaciju nekretnine i remote pre-prodaju.",
        included:
          "Do 10 interaktivnih soba u 360 turi (klijent ulazi i obilazi prostor) + 10 dodatnih statičkih uglova kamere + tlocrt sprata.",
        addOns: [
          "11. i svaka sledeća interaktivna soba: €45",
          "Dodatna interaktivna tačka u postojećoj sobi: €27",
          "Dodatni statički ugao kamere: €10",
          "Dodatni sprat (360 tura): €205 (30% popust)",
        ],
      },
    ],
  },
  {
    slug: "spoljasnji-renderi",
    code: "exterior-rendering",
    name: "Spoljašnji renderi",
    shortName: "Spoljašnji renderi",
    category: "eksterijer",
    icon: "grid",
    tagline: "Prodajte zgradu pre nego što počnu radovi.",
    description:
      "Realistični prikazi fasada, kuća i poslovnih objekata — za prospekt, dozvolu, oglas ili klijentsku prezentaciju. Cena pokriva izradu kompletnog 3D modela objekta i prvi render. Pošto je model već izgrađen, svaki sledeći ugao kamere koji koristi istu stranu zgrade košta samo €48 — 80% jeftinije.",
    highlight:
      "Najpogodnije za investitore koji rade pre-prodaju, arhitekte koji predstavljaju projekat klijentu i kuće u izgradnji koje treba reklamirati.",
    materials:
      "Pošaljite nam arhitektonske crteže (osnove, preseke, fasade) i specifikaciju materijala. Što precizniji ulaz, brže nacrti — standardno 3–5 radnih dana.",
    asset: "/artwork/expert-spoljasnji-renderi.webp",
    philosophy:
      "Najveći trošak je izrada 3D modela zgrade — gradimo ga jednom, a svaki sledeći ugao iz iste strane modela je €48 (80% jeftiniji). Doplata postoji samo ako kadar zahteva geometriju neviđene strane objekta. Tako pakovanje od 4-5 rendera ulazi u realan investicioni budžet, a ne traži novu porudžbinu po svakom kadru.",
    priceContext:
      "Pun 3D model objekta + prvi render. Sledeći ugao iste strane: €48 (80% jeftiniji).",
    forSegments: [
      "Investitori (pre-prodaja jedinica)",
      "Arhitekte (prezentacije klijentu)",
      "Vlasnici objekta (marketing pred izgradnju)",
    ],
    featured: true,
    variants: [
      {
        id: "exterior-static",
        title: "Klasični prikaz fasade",
        basePrice: 250,
        priceLabel: "€250",
        unitLabel: "3D model + prvi render",
        description:
          "Najbrža ulazna tačka za prospekt: dobijate pun 3D model zgrade i prvi finalni render. Sledeći uglovi 80% jeftiniji.",
        included:
          "Izgradnja punog 3D modela objekta, postavljanje scene, osvetljenja, materijala i 1 finalni render (ugao kamere). Sledeći ugao iste strane: samo €48.",
        addOns: [
          "Dodatni ugao kamere iste strane objekta: €48 (80% popust)",
          "Doplata za neviđenu stranu objekta: +25% jednom po modelu",
        ],
        note: "Doplata za neviđenu stranu naplaćuje se jednom; nakon nje svi naredni uglovi ulaze u standardnu dodatnu cenu.",
      },
      {
        id: "exterior-360",
        title: "Interaktivna 360 panorama",
        basePrice: 335,
        priceLabel: "€335",
        unitLabel: "3D model + prva 360 panorama",
        description:
          "Klijent se okreće oko zgrade mišem ili VR uređajem. Idealno za remote prezentacije i online prospekt.",
        included:
          "Pun 3D model objekta + prva interaktivna 360 panorama spremna za VR uređaje (Meta Quest itd.).",
        addOns: [
          "Dodatna interaktivna tačka, ista strana modela: €48",
          "Dodatna tačka koja zahteva neviđenu stranu: €60",
          "Za 5+ dodatnih tačaka: €53 po tački (popust na količinu)",
        ],
      },
      {
        id: "exterior-aerial",
        title: "Prikaz iz vazduha",
        basePrice: 420,
        priceLabel: "€420",
        unitLabel: "prikaz objekta + okruženja iz vazduha",
        description:
          "Za masterplane, parcele i investitorske prezentacije gde se vidi širi kontekst objekta, parking, prilazi.",
        included: "Pun 3D model objekta + okruženje + prvi prikaz iz vazduha.",
        addOns: ["Doplata za prikaz zadnje strane objekta: +25% jednom"],
      },
    ],
  },
  {
    slug: "virtuelno-opremanje",
    code: "virtual-staging",
    name: "Virtuelno opremanje",
    shortName: "Virtuelno opremanje",
    category: "transformacija",
    icon: "sparkles",
    tagline: "Prazne sobe se sporo prodaju — opremljene prodaju brže.",
    description:
      "Praznu ili slabo uređenu fotografiju prostora pretvaramo u opremljenu scenu koja prodaje. Idealno za agente nekretnina i vlasnike — opremanje fotografije košta 100× manje od pravog opremanja stana, a značajno povećava klikove na oglas. Druga soba iz iste nekretnine: 17% jeftinije. Pakovanje od 10 slika: 28% jeftinije po slici.",
    highlight:
      "Najbrži način da prazna nekretnina deluje useljivo i poveća broj poziva sa oglasa.",
    materials:
      "Pošaljite nam fotografije praznih prostorija visoke rezolucije i željeni stil nameštaja.",
    asset: "/artwork/expert-virtuelno-opremanje-after.webp",
    beforeAsset: "/artwork/expert-virtuelno-opremanje-before.webp",
    afterAsset: "/artwork/expert-virtuelno-opremanje-after.webp",
    philosophy:
      "Prva slika pokriva izbor nameštaja, stila i osvetljenja. Kad je stil definisan, svaki dodatni ugao iste sobe je 33% jeftiniji, druga soba 17% jeftinija, a od 10+ slika cena pada na €13/sliku. Tako celokupna nekretnina dobija kompletan oglasni paket za delić cene fizičkog opremanja.",
    priceContext:
      "€18 prva slika · €15 druga soba · od €13/sliku za pakovanje 10+ slika.",
    featured: true,
    variants: [
      {
        id: "staging-static",
        title: "Klasično opremanje fotografije",
        basePrice: 18,
        priceLabel: "€18",
        unitLabel: "prva opremljena slika",
        description:
          "Najbrži upgrade oglasa: prazna soba postaje atraktivna scena za €18. Svaka sledeća soba 17% jeftinija.",
        included:
          "Fotorealistično opremanje jedne prazne prostorije na osnovu Vaše fotografije. Uključuje izbor nameštaja, postavljanje i usklađivanje osvetljenja.",
        addOns: [
          "Dodatni ugao iste sobe: €12 (33% popust)",
          "Druga soba iste nekretnine: €15 (17% popust)",
          "Pakovanje 10+ slika: €13 po slici (28% popust)",
          "Promena stila opremanja iste sobe: €12",
        ],
      },
      {
        id: "staging-360",
        title: "Interaktivno 360 opremanje",
        basePrice: 34,
        priceLabel: "€34",
        unitLabel: "prva opremljena 360 panorama",
        description:
          "Kupac obilazi opremljenu sobu mišem — savršeno za online oglas ili remote prikaz potencijalnom kupcu.",
        included:
          "Kompletno opremanje prve prostorije u 360 panorami koja se pregledava na sajtu ili VR uređaju.",
        addOns: [
          "Dodatna interaktivna tačka iste sobe: €24 (30% popust)",
          "Druga soba iste nekretnine: €28 (18% popust)",
          "Pakovanje 6+ tačaka: €24 po tački",
          "Promena stila opremanja iste sobe: €22",
        ],
      },
    ],
  },
  {
    slug: "virtuelna-renovacija",
    code: "virtual-renovation",
    name: "Virtuelna renovacija",
    shortName: "Virtuelna renovacija",
    category: "transformacija",
    icon: "refresh",
    tagline: "Vidite renoviran prostor pre nego što potrošite na radove.",
    description:
      "Pre nego što potrošite hiljade evra na podove, kuhinju ili kupatilo, vidite kako će prostor izgledati. Sprečavate skupe greške u izboru materijala i ubrzavate dogovor sa izvođačima. Prva slika pokriva kompletan dizajn; svaki sledeći ugao iste sobe je 10% jeftiniji (a od 4. ugla 20% jeftiniji).",
    highlight:
      "Za vlasnike koji planiraju renovaciju, agente koji prodaju nekretnine pred adaptaciju i arhitekte enterijera koji predstavljaju klijentu konkretne opcije.",
    materials:
      "Pošaljite nam fotografije postojećeg stanja i reference za nove materijale (podove, zidove, nameštaj).",
    asset: "/artwork/expert-virtuelna-renovacija-after.webp",
    beforeAsset: "/artwork/expert-virtuelna-renovacija-before.webp",
    afterAsset: "/artwork/expert-virtuelna-renovacija-after.webp",
    philosophy:
      "Prva slika pokriva kompletan dizajn renovacije i izbor materijala. Kad je vizuelni pravac postavljen, svaki dodatni ugao iste prostorije je 10% jeftiniji, a od 4. ugla 20% jeftiniji. Druga soba iste nekretnine: 15% popust. Tako kompletna nekretnina ulazi u realan budžet pre nego što krenu zidari.",
    priceContext:
      "€66 prvi prikaz · od €53 dodatni ugao · €56 druga soba (15% popust).",
    forSegments: [
      "Vlasnici nekretnina pred renoviranje",
      "Arhitekte enterijera",
      "Agencije za nekretnine",
    ],
    featured: true,
    variants: [
      {
        id: "renovation-main",
        title: "Vizuelna renovacija prostorije",
        basePrice: 66,
        priceLabel: "€66",
        unitLabel: "prvi prikaz renovirane sobe",
        description:
          "Prvi prikaz pokriva kompletan dizajn — izbor podova, zidova, fiksiranih elemenata i nameštaja. Dodatni uglovi 10–20% jeftiniji.",
        included:
          "Kompletna vizuelna transformacija jedne prostorije na osnovu Vaše fotografije. Uključuje promenu podova, zidova, fiksiranih elemenata i nameštaja.",
        addOns: [
          "Dodatni ugao iste sobe: €59 (10% popust)",
          "4. i svaki sledeći ugao iste sobe: €53 (20% popust)",
          "Druga soba iste nekretnine: €56 (15% popust)",
          "6. i svaka sledeća soba iste nekretnine: €50 (24% popust)",
        ],
      },
    ],
  },
  {
    slug: "osnove",
    code: "floor-plans",
    name: "2D i 3D osnove",
    shortName: "2D i 3D osnove",
    category: "planovi",
    icon: "file-image",
    tagline: "Pregled prostora koji kupac razume na prvi pogled.",
    description:
      "Pregledni 2D ili 3D tlocrti — za oglas, prodaju, dozvolu ili planiranje uređenja. 2D daje čist tehnički prikaz; 3D daje atraktivniji prostorni prikaz koji kupac razume bez znanja arhitekture. Cena pokriva jedan nivo (sprat); dupliranje istog sprata košta samo trećinu cene.",
    highlight:
      "Najprikladnije za agencije nekretnina koje žele da oglas izgleda profesionalno i investitore koji predstavljaju tipove stanova u zgradi.",
    materials:
      "Pošaljite nam tehničke crteže, skice sa merama ili postojeće PDF osnove.",
    asset: "/artwork/expert-osnove.webp",
    philosophy:
      "Cena pokriva izradu osnove za jedan nivo. Svaki sledeći nivo iste zgrade je 50–66% jeftiniji jer je stilski predložak već postavljen. Identičan sprat (dupliranje sa promenom oznaka) košta samo trećinu osnovne cene. Tako celokupna zgrada dobija pregledne osnove za delić cene CAD studija.",
    priceContext:
      "€20 jedan nivo (2D čist plan) / €29 jedan nivo (3D plan). Dodatni nivo: €10–15.",
    featured: true,
    variants: [
      {
        id: "floorplan-2d",
        title: "2D tlocrt (čist tehnički plan)",
        basePrice: 20,
        priceLabel: "€20",
        unitLabel: "jedan sprat (2D plan)",
        description:
          "Najjeftiniji ulaz za oglas — jasan tehnički tlocrt sa rasporedom i merama. Identičan sprat: €6.",
        included:
          "Jedan nivo u čistom 2D vektorskom prikazu. Uključuje raspored prostorija, oznake i dimenzije.",
        addOns: [
          "Dva nivoa (dupleks): €32",
          "Svaki dodatni nivo: €10",
          "Identičan sprat (dupliranje): €6 (70% popust)",
          "Verzija sa nameštajem: €6",
          "Promena boje / stila plana: €4",
        ],
        note: "2D osnove isporučujemo kroz White Rook partnersku mrežu.",
      },
      {
        id: "floorplan-3d",
        title: "3D tlocrt (prostorni prikaz)",
        basePrice: 29,
        priceLabel: "€29",
        unitLabel: "jedan sprat (3D plan)",
        description:
          "Kupac razume raspored na prvi pogled — bez čitanja simbola. Idealno za listing fotografiju.",
        included:
          "Jedan nivo u atraktivnom 3D prikazu sa rasporedom prostorija, oznakama i dimenzijama.",
        addOns: [
          "Dva nivoa (dupleks): €46",
          "Svaki dodatni nivo: €15",
          "Identičan sprat (dupliranje): €10 (66% popust)",
          "Dodavanje nameštaja: €8",
          "Varijanta dizajna (isti raspored, drugi nameštaj): €6",
        ],
      },
    ],
  },
  {
    slug: "360-ture-i-animacije",
    code: "tours-and-animation",
    name: "360 ture i animacije",
    shortName: "360 ture i animacije",
    category: "animacije",
    icon: "images",
    tagline: "Pokrenite kupca kroz prostor — pre nego što ga izgradite.",
    description:
      "Dve potpuno različite usluge u jednoj kategoriji. **360 tura**: klijent obilazi prostor mišem ili VR uređajem kao u igri (Meta Quest). **Animacija**: 30-sekundni film u kome kamera leti kroz objekat — moćan marketinški alat za prospekt i prezentaciju investitorima. Ako iz prethodnog projekta već imamo Vaš 3D model, animacija je 33% jeftinija; ako je projekat aktivan, čak 47% jeftinija.",
    highlight:
      "Za pre-prodaju jedinica, online prezentacije investitorima i marketing kampanje gde statična slika nije dovoljna.",
    materials:
      "Pošaljite nam osnove, reference i željenu putanju kamere (za animacije) ili raspored tačaka (za 360 ture).",
    asset: PORTFOLIO_ASSET,
    embedSrc:
      "https://kuula.co/share/collection/7kLnB?logo=1&info=0&fs=1&vr=1&sd=1&autorotate=0.04&autop=30&thumbs=1",
    detailEmbedSrc:
      "https://kuula.co/share/collection/7kLnB?logo=1&info=0&fs=1&vr=1&sd=1&autorotate=0.04&autop=30&thumbs=1",
    philosophy:
      "Najveći trošak je izgradnja 3D modela. Animacija od nule: €15/sek. Iz postojećeg modela: €10/sek (33% jeftinije). Aktivan projekat: €8/sek (47% jeftinije). Duže animacije dobijaju automatski popust: preko 60 sek −20%, preko 2 minuta −25%. Tako duži marketinški filmovi ne znače proporcionalno veći budžet.",
    priceContext:
      "Animacija od €15/sek (min. 15 sek = €225). 360 tura dodatak: od €20 + hosting.",
    forSegments: [
      "Investitori (pre-prodaja jedinica)",
      "Agencije za nekretnine",
      "Razvojni projekti (masterplan prezentacije)",
    ],
    featured: true,
    variants: [
      {
        id: "tour-assembly",
        title: "360 tura — sklapanje i hosting",
        basePrice: 20,
        priceLabel: "€20",
        unitLabel: "sklapanje i hosting interaktivne ture",
        description:
          "Kada već postoji set 360 panorama, ovaj korak ih spaja u jedinstvenu interaktivnu turu na sajtu.",
        included:
          "Sklapanje virtuelne 360 ture iz postojećih panorama, hosting i deljenje preko linka ili embed-a na sajtu.",
        addOns: [
          "Interaktivna navigacija po tlocrtu: €15",
          "Tura sa Vašim brendom (logo, boje): €35",
        ],
        note: "Ovo je dodatak na već izrađene 360 panorame, ne cena za samu izradu 360 sadržaja.",
      },
      {
        id: "animation-from-scratch",
        title: "Arhitektonska animacija (od nule)",
        basePrice: 15,
        priceLabel: "€15/sek",
        unitLabel: "po sekundi (minimum 15 sek = €225)",
        description:
          "Marketinški film u kome kamera leti kroz objekat. Minimum 15 sekundi. Ako već imamo Vaš model: 33% popust.",
        included:
          "Kompletna izgradnja 3D modela + dizajn putanje kamere + renderovanje animacije (minimum 15 sek).",
        addOns: [
          "Ako već imamo Vaš 3D model: €10/sek (33% popust)",
          "Aktivan projekat renderovanja: €8/sek (47% popust)",
          "Dodatna putanja kamere kroz isti model: €5/sek",
          "Verzija sa noćnim osvetljenjem: +30%",
          "Sezonska varijanta (zima/leto): +40%",
          "Popust na dužinu: 31–60s −10%, 61–120s −20%, 120s+ −25%",
        ],
      },
    ],
  },
  {
    slug: "prikazi-dvorista",
    code: "landscape-rendering",
    name: "Uređenje pejzaža",
    shortName: "Uređenje pejzaža",
    category: "eksterijer",
    icon: "tree",
    tagline: "Dvorište, bašta ili park — pre nego što biljke porastu.",
    description:
      "Prikaz uređenog spoljnog prostora — dvorišta, bašte, parka ili pristupne staze — pre nego što izvođači stignu na lokaciju. Idealno za prezentaciju klijentu pre potpisivanja ugovora ili reklamu pred otvaranje. Svaki sledeći ugao iste lokacije: 80% jeftiniji.",
    highlight:
      "Najpogodnije za pejzažne arhitekte koji predstavljaju projekat klijentu i investitore za zajedničke prostore u kompleksima.",
    materials:
      "Pošaljite nam situacioni plan, visinske kote i specifikaciju biljaka i materijala.",
    asset: "/artwork/expert-prikazi-dvorista-after.webp",
    beforeAsset: "/artwork/expert-prikazi-dvorista-before.webp",
    afterAsset: "/artwork/expert-prikazi-dvorista-after.webp",
    philosophy:
      "Cena pokriva modelovanje terena, sadnju vegetacije i prvi prikaz. Pošto je teren izgrađen, svaki sledeći ugao iste lokacije je €45 — 80% jeftinije. Doplata postoji samo ako novi ugao zahteva teren koji nije bio u modelu.",
    priceContext:
      "€220 — kompletan teren + vegetacija + prvi prikaz. Sledeći ugao: €45 (80% jeftiniji).",
    variants: [
      {
        id: "landscape-main",
        title: "Pejzažni render",
        basePrice: 220,
        priceLabel: "€220",
        unitLabel: "teren + vegetacija + prvi prikaz",
        description:
          "Kompletan teren sa vegetacijom i prvi render. Sledeći ugao iste lokacije: €45.",
        included:
          "Kompletno modelovanje terena, postavljanje vegetacije i staza, i 1 finalni render (ugao gledanja).",
        addOns: [
          "Dodatni ugao iste lokacije: €45 (80% popust)",
          "Doplata za neviđenu stranu terena: +25% jednom po modelu",
          "Pogled iz vazduha na celu lokaciju: €380",
        ],
      },
    ],
  },
  {
    slug: "fotomontaza",
    code: "photomontage",
    name: "Fotomontaža",
    shortName: "Fotomontaža",
    category: "eksterijer",
    icon: "camera",
    tagline: "Vaš objekat na stvarnoj fotografiji lokacije.",
    description:
      "Vaš budući objekat pažljivo uklopljen u realnu fotografiju lokacije — sa istim osvetljenjem, senkama i okruženjem kao na originalnoj slici. Najuverljiviji prikaz za nadležne organe (urbanistička dozvola, javna rasprava), prezentaciju klijentu i marketing pre izgradnje. Sledeći ugao iste fotografije: 82% jeftiniji.",
    highlight:
      "Za projekte u kojima realističnost i autentičnost lokacije presudno menjaju doživljaj projekta — dozvole, javne rasprave, investitorske prezentacije.",
    materials:
      "Pošaljite nam fotografiju lokacije visoke rezolucije i 3D model ili arhitektonske crteže objekta.",
    asset: "/artwork/expert-fotomontaza-after.webp",
    beforeAsset: "/artwork/expert-fotomontaza-before.webp",
    afterAsset: "/artwork/expert-fotomontaza-after.webp",
    philosophy:
      "Najveći trošak je analiza fotografije i uklapanje kamere, svetla i senki. Kad je uklapanje urađeno, dodatni ugao iz iste fotografije košta samo €55 (82% jeftiniji), a nova fotografija iste lokacije €85.",
    priceContext:
      "€300 — uklapanje + prvi prikaz. Sledeći ugao iste fotografije: €55 (82% jeftiniji).",
    variants: [
      {
        id: "photomontage-main",
        title: "Fotomontaža objekta",
        basePrice: 300,
        priceLabel: "€300",
        unitLabel: "uklapanje + prvi prikaz",
        description:
          "Pun rad analize i uklapanja za prvu sliku. Sledeći ugao iz iste fotografije: €55.",
        included:
          "Uklapanje 3D modela objekta u Vašu fotografiju stvarne lokacije. Uključuje usklađivanje osvetljenja, senki i kompozicije.",
        addOns: [
          "Dodatni ugao iz iste fotografije: €55 (82% popust)",
          "Druga fotografija iste lokacije: €85 (72% popust)",
          "Doplata za neviđenu stranu objekta: +25% jednom",
        ],
      },
    ],
  },
  {
    slug: "3d-situacioni",
    code: "3d-site-plans",
    name: "Situacioni planovi",
    shortName: "Situacioni planovi",
    category: "planovi",
    icon: "layers",
    tagline: "Cela parcela iz vazduha — investitorska ponuda na jednoj slici.",
    description:
      "Kompletan prikaz parcele iz vazduha: teren, sve objekte, puteve, parking, vegetaciju i uređenje. Najsilniji vizuelni materijal za investitorsku ponudu, urbanističku dozvolu i prodaju većih kompleksa. Sledeći ugao iste parcele: 81% jeftiniji. Faze izgradnje i sezonske varijante naručujete kroz istu scenu.",
    highlight:
      "Za masterplane, stambene komplekse, poslovne zone i razvojne projekte gde se prodaje **lokacija**, a ne samo objekat.",
    materials:
      "Pošaljite nam CAD crteže cele parcele, pozicije objekata i plan uređenja.",
    asset: "/artwork/expert-3d-situacioni.webp",
    philosophy:
      "Cena pokriva izradu kompletnog terena, postavljanje objekata, puteva i pejzaža. Pošto je scena izgrađena, svaki sledeći ugao košta €65 (81% jeftinije), sezonska varijanta (zima/leto) €85, a prikaz po fazama izgradnje €95. Tako investitor ima vizuelni materijal za sve faze kampanje — fazu pre prodaje, fazu otvaranja prvog objekta itd. — iz jednog modela.",
    priceContext:
      "€350 — cela parcela: teren + objekti + pejzaž + prvi prikaz iz vazduha.",
    forSegments: [
      "Investitori i developeri",
      "Urbanisti i studija za masterplan",
      "Arhitekte (investitorske prezentacije)",
    ],
    variants: [
      {
        id: "site-plan-main",
        title: "3D situacioni prikaz",
        basePrice: 350,
        priceLabel: "€350",
        unitLabel: "kompletna parcela + prvi prikaz iz vazduha",
        description:
          "Pun teren, svi objekti, putevi i pejzaž — investitorski materijal. Sledeći ugao iste parcele: €65.",
        included:
          "Modelovanje cele parcele: teren, objekti, putevi, parking, vegetacija i pejzaž. Uključuje 1 finalni prikaz iz vazduha.",
        addOns: [
          "Dodatni ugao iste parcele: €65 (81% popust)",
          "Sezonska varijanta (zima/leto): €85",
          "Prikaz po fazama izgradnje (vidljivost po fazi): €95",
        ],
      },
    ],
  },
  {
    slug: "dan-u-noc",
    code: "day-to-dusk",
    name: "Dnevni u noćni prikaz",
    shortName: "Dnevni u noćni prikaz",
    category: "transformacija",
    icon: "sun",
    tagline: "Dnevni kadar dobija topao večernji utisak.",
    description:
      "Zamena neba, korekcija osvetljenja i topla atmosfera prozora — dnevna fotografija eksterijera postaje atraktivan večernji oglas. Za 10+ slika cena pada na €8/slika (20% popust).",
    highlight:
      "Za agente nekretnina i investitore kada ista scena treba i u dnevnoj i u večernjoj verziji za marketing kampanju.",
    materials: "Pošaljite nam dnevne fotografije eksterijera visoke rezolucije.",
    asset: "/artwork/expert-dan-u-noc-after.webp",
    beforeAsset: "/artwork/expert-dan-u-noc-before.webp",
    afterAsset: "/artwork/expert-dan-u-noc-after.webp",
    outsourced: true,
    philosophy:
      "Brza post-produkcija sa jasnom cenom po slici. Pakovanje 10+ slika: €8/slika (20% popust). Hitna isporuka u roku od 24h: +50%.",
    priceContext: "€10 po slici · €8 po slici za pakovanje 10+.",
    variants: [
      {
        id: "day-to-dusk-main",
        title: "Dnevni u noćni prikaz",
        basePrice: 10,
        priceLabel: "€10",
        unitLabel: "po slici",
        description:
          "Zamena neba, lighting i kolor grejding za jednu sliku. Pakovanje 10+: €8/sliku.",
        included:
          "Transformacija jedne dnevne fotografije eksterijera u dramatičan večernji prikaz. Uključuje zamenu neba i podešavanje osvetljenja.",
        addOns: [
          "Uklanjanje neželjenih senki: €5",
          "Pakovanje 10+ slika: €8 po slici (20% popust)",
          "Hitna isporuka u 24h: +50%",
        ],
      },
    ],
  },
  {
    slug: "uklanjanje-elemenata",
    code: "item-removal",
    name: "Uklanjanje predmeta",
    shortName: "Uklanjanje predmeta",
    category: "transformacija",
    icon: "eraser",
    tagline: "Čista fotografija prodaje brže od fotografije sa neredom.",
    description:
      "Digitalno uklanjanje neželjenih predmeta sa fotografije: lične stvari, vozila, kablovi, nered, ili veći objekti uz rekonstrukciju pozadine. Brz upgrade oglasa bez fizičkog čišćenja prostora. Pakovanje 10+ slika: popust na količinu.",
    highlight:
      "Za agente nekretnina i fotografe kada se prostor mora prikazati čist, a fizičko sređivanje nije isplativo ili izvodljivo.",
    materials:
      "Pošaljite nam fotografije i jasno označite predmete koje želite da uklonimo.",
    asset: "/artwork/expert-uklanjanje-elemenata-after.webp",
    beforeAsset: "/artwork/expert-uklanjanje-elemenata-before.webp",
    afterAsset: "/artwork/expert-uklanjanje-elemenata-after.webp",
    philosophy:
      "Jednostavno uklanjanje (sitnice, lične stvari): €12. Kompleksno (veliki objekat sa rekonstrukcijom pozadine): €25. Pakovanje 10+ slika: €10 jednostavno / €20 kompleksno po slici.",
    priceContext:
      "€12 jednostavno / €25 kompleksno · pakovanje 10+: €10 / €20.",
    variants: [
      {
        id: "item-removal-main",
        title: "Uklanjanje predmeta",
        basePrice: 12,
        priceLabel: "€12",
        unitLabel: "po slici (jednostavno)",
        description:
          "€12 jednostavno (sitnice, lične stvari) / €25 kompleksno (veliki objekti). Pakovanje 10+: popust na količinu.",
        included:
          "Digitalno uklanjanje predmeta, nereda ili ličnih stvari sa jedne fotografije, uz rekonstrukciju pozadine.",
        addOns: [
          "Kompleksno uklanjanje (rekonstrukcija pozadine): €25",
          "Dodatna slika — jednostavno: €8 (33% popust)",
          "Dodatna slika — kompleksno: €18 (28% popust)",
          "Pakovanje 10+ slika: €10 jednostavno / €20 kompleksno",
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
