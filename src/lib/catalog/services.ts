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

export type BenefitIcon = "speed" | "trust" | "value" | "context";

export type ServiceBenefit = {
  title: string;
  body: string;
  icon?: BenefitIcon;
};

export type ProcessStep = {
  title: string;
  body: string;
};

export type ServiceFaq = {
  q: string;
  a: string;
};

export type PortfolioImage = {
  src: string;
  alt: string;
};

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
  /** Listing-page card image (4:3, 1200×900). Used by services-showcase
   *  on /usluge — distinct from home (3:2 thumbnail) and detail (16:9
   *  hero) so each surface has its own visual identity. */
  listingAsset?: string;
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

  /* ------------------------------------------------------------------ *
   * Landing-style sections — all optional. When unset, the section is
   * skipped on the detail page (graceful degradation). Populate per
   * service as we roll the new template across the catalog.
   * ------------------------------------------------------------------ */

  /** Problem/agitation block — short narrative on what goes wrong without this service. */
  problemHeading?: string;
  problemBody?: string;
  problemResolution?: string;
  /** Optional visual for the problem section (4:3). When unset, ProblemVisual
   *  falls back to BeforeAfterReveal → first portfolio image → detailAsset. */
  problemAsset?: string;

  /** Three reason-to-buy cards rendered as a 3-up grid. */
  benefits?: ServiceBenefit[];

  /** Four-step "kako radimo" timeline. */
  processSteps?: ProcessStep[];

  /** Portfolio gallery (recommended 4 images, 16:9). */
  portfolioImages?: PortfolioImage[];

  /** Service-specific FAQ. Rendered after the generic SERVICES_PAGE_FAQS. */
  faqs?: ServiceFaq[];
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
    detailAsset: "/artwork/detail-unutrasnji-renderi.webp",
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
    detailAsset: "/artwork/detail-spoljasnji-renderi.webp",
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
    problemHeading: "Kupci ne kupuju nacrte. Kupuju dom.",
    problemBody:
      "Većina investitora gubi nedelje pokušavajući da objasni kupcima kako će objekat izgledati na osnovu tehničkih crteža ili grubih skica. Kupcima je teško da zamisle prostor, materijale i okolinu — i zato odlažu odluku.",
    problemResolution:
      "Spoljašnji renderi prevode arhitektonske nacrte u stvarnost. Prikazujemo tačne materijale, pravilno osvetljenje i realno okruženje, na osnovu Vaših DWG/PDF crteža — što znači da prodajete nekretnine brzo i sa potpunim poverenjem.",
    benefits: [
      {
        title: "Prodaja pre gradnje",
        body: "Omogućite kupcima da vide tačno šta kupuju. Off-plan jedinice idu brže kada slika ulijeva poverenje.",
        icon: "speed",
      },
      {
        title: "Ušteda u odnosu na maketu",
        body: "Fizička maketa košta višestruko više i ne može da se menja. Render prilagođavamo, koristite ga na svim kanalima.",
        icon: "value",
      },
      {
        title: "Profesionalna prezentacija",
        body: "Objekat izgleda završeno i postavljeno u realan kontekst — vegetacija, osvetljenje, tačni materijali fasade.",
        icon: "trust",
      },
    ],
    processSteps: [
      {
        title: "Pošaljite materijal",
        body: "Dostavite arhitektonske nacrte (PDF/DWG) i, po želji, reference stila i specifikaciju materijala.",
      },
      {
        title: "Dobijate ponudu",
        body: "Preciznu ponudu šaljemo najkasnije narednog radnog dana, bez skrivenih stavki.",
      },
      {
        title: "Mi gradimo model",
        body: "Tim postavlja 3D model, osvetljenje i vegetaciju. Vi pratite napredak; intervencija nije potrebna.",
      },
      {
        title: "Isporuka i revizije",
        body: "Dobijate finalne vizuale. Tri runde revizije su uključene u cenu — bez doplate.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/listing-exterior-static.webp",
        alt: "Spoljašnji render — klasični prikaz fasade",
      },
      {
        src: "/artwork/listing-exterior-aerial.webp",
        alt: "Spoljašnji render — prikaz iz vazduha",
      },
      {
        src: "/artwork/listing-exterior-360.webp",
        alt: "Spoljašnji render — 360 panorama",
      },
      {
        src: "/artwork/expert-spoljasnji-renderi.webp",
        alt: "Spoljašnji render — primer iz portfolija",
      },
    ],
    faqs: [
      {
        q: "Koliko traje izrada spoljašnjih rendera?",
        a: "Prve nacrte šaljemo najčešće za 3–5 radnih dana od potvrde ponude i prijema svih materijala. Završna isporuka zavisi od broja revizija — tri runde su uključene u cenu.",
      },
      {
        q: "Šta ako mi se ne svidi neki detalj?",
        a: "Svaka porudžbina uključuje tri kruga revizije bez doplate. Prilagođavamo materijale, boje, osvetljenje i uglove kamere dok rezultat ne bude tačan.",
      },
      {
        q: "Da li mogu da koristim AI alate umesto ovoga?",
        a: "AI alati su dobri za inspiraciju, ali ne mogu da naprave precizan prikaz Vašeg specifičnog objekta na osnovu DWG/PDF nacrta. Naši renderi su tehnički tačni — svaki prozor, materijal i proporcija odgovaraju realnoj građevini, što je presudno kada prodajete nekretninu.",
      },
      {
        q: "Da li je €250 cena za jednu sliku?",
        a: "€250 pokriva izgradnju kompletnog 3D modela Vaše zgrade i prvi finalni render. Pošto je model već napravljen, svaki sledeći ugao iste strane objekta košta samo €48 — 80% jeftiniji. Na primer, četiri ugla istog objekta su €394 ukupno (€250 + 3 × €48).",
      },
      {
        q: "Šta treba da dostavim da biste počeli?",
        a: "Arhitektonske nacrte (osnove, preseci, fasade) u PDF ili DWG formatu. Opciono ali korisno: referentne fotografije stila, specifikacija materijala fasade i fotografija lokacije za kontekst okoline.",
      },
      {
        q: "Da li radite i porodične kuće, ili samo velike projekte?",
        a: "Radimo projekte svih veličina — od porodičnih kuća do stambenih kompleksa i poslovnih objekata. Cena modela i prvog ugla je ista: €250.",
      },
    ],
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
    slug: "360-eksterijer",
    code: "exterior-360-tour",
    name: "360° eksterijer",
    shortName: "360 eksterijer",
    category: "eksterijer",
    icon: "images",
    tagline: "Klijent obilazi vašu zgradu kao u igri — pre nego što je sagrađena.",
    description:
      "Interaktivna 360 panorama oko vašeg objekta. Kupac otvara link u pretraživaču, miša rotira pogled iz svih uglova, prebacuje između tačaka — i u VR režimu na Meta Quest uređajima. Idealno za off-plan pre-prodaju jedinica, remote demo i online prospekt.",
    highlight:
      "Najjača prezentacija kada je kupac udaljen i tradicionalni render ne ubeđuje. Investitori za pre-prodaju iz dijaspore i agencije za remote pokazivanje.",
    materials:
      "Pošaljite arhitektonske nacrte (PDF/DWG), reference stila i raspored željenih tačaka gledanja. Prvi nacrt 3–5 radnih dana.",
    asset: "/artwork/listing-exterior-360.webp",
    detailAsset: "/artwork/detail-360-eksterijer.webp",
    detailEmbedSrc:
      "https://kuula.co/share/collection/7kLnB?logo=1&info=0&fs=1&vr=1&sd=1&autorotate=0.04&autop=30&thumbs=1",
    philosophy:
      "Najveći trošak je izgradnja 3D modela. Cena €335 pokriva pun model i prvu interaktivnu 360 panoramu. Svaka sledeća tačka iz iste strane modela: €48 (80% jeftinije). Tačka koja zahteva neviđenu stranu: €60 jednokratno. Za 5+ tačaka popust pada na €53 po tački — kompletan obilazak objekta ulazi u realan investitorski budžet.",
    priceContext:
      "€335 — pun 3D model + prva 360 panorama spremna za VR. Sledeća tačka iste strane: €48.",
    forSegments: [
      "Investitori (off-plan pre-prodaja)",
      "Agencije nekretnina (remote demo)",
      "Arhitekte (klijentske prezentacije)",
    ],
    problemHeading: "Nacrti ne otvaraju vrata. Šetnja kroz objekat — otvara.",
    problemAsset: "/artwork/expert-360-eksterijer-problem.webp",
    problemBody:
      "Investitor pokazuje fasadu, kupac klimne glavom i odlazi „da razmisli\". Statična slika ne daje osećaj prostora iz svih uglova, ne pokazuje materijale u različitim svetlima, ne dozvoljava kupcu da sam istraži. Odluka se odlaže — ili gubi.",
    problemResolution:
      "Interaktivna 360 panorama pretvara fasadu u prostor kroz koji klijent prolazi mišem ili VR uređajem. Kupac sam istražuje objekat iz svih uglova, sa istim materijalima i okolinom koje će videti uživo — i donosi odluku.",
    benefits: [
      {
        icon: "trust",
        title: "Poverenje kroz iskustvo",
        body: "Kupac ulazi u prostor mišem i sam ispituje materijale, dimenzije i osvetljenje. Niko ne mora da mu objašnjava perspektivu.",
      },
      {
        icon: "speed",
        title: "Prezentacija na daljinu",
        body: "Pošaljete link, kupac otvara panoramu sa telefona ili VR headset-a, bez instalacije i bez naloga.",
      },
      {
        icon: "value",
        title: "Niža cena od fizičke makete",
        body: "Pun 3D model i interaktivna panorama za €335. Fizička maketa istog objekta košta višestruko više i ne može da se menja kad arhitekta promeni materijal.",
      },
    ],
    processSteps: [
      {
        title: "Pošaljite materijal",
        body: "Dostavite arhitektonske nacrte (PDF/DWG) i, po želji, reference stila i raspored željenih tačaka gledanja.",
      },
      {
        title: "Dobijate ponudu",
        body: "Preciznu ponudu šaljemo najkasnije narednog radnog dana, bez skrivenih stavki.",
      },
      {
        title: "Mi gradimo panoramu",
        body: "Tim gradi 3D model, postavlja osvetljenje i materijale, renderuje 360 panoramu. Vi pratite napredak.",
      },
      {
        title: "Isporuka linka i embed koda",
        body: "Dobijate link za deljenje i embed kod za sajt. Tri runde revizije su uključene u cenu — bez doplate.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-360-eksterijer-01.webp",
        alt: "Frame iz 360 panorame stambene zgrade — ulična perspektiva",
      },
      {
        src: "/artwork/portfolio-360-eksterijer-02.webp",
        alt: "Frame iz 360 panorame porodične kuće — dnevna scena",
      },
      {
        src: "/artwork/portfolio-360-eksterijer-03.webp",
        alt: "Frame iz 360 panorame poslovnog objekta — ulazna fasada",
      },
      {
        src: "/artwork/portfolio-360-eksterijer-04.webp",
        alt: "Frame iz 360 panorame masterplana — kontekst okruženja",
      },
    ],
    faqs: [
      {
        q: "Kako klijent otvara panoramu?",
        a: "Šaljemo link i embed kod. Klijent otvara kroz pretraživač — bez instalacije i bez naloga. Radi na telefonu, računaru i Meta Quest VR uređaju (VR mod je ugrađen u panoramu).",
      },
      {
        q: "Šta tačno uključuje cena od €335?",
        a: "Pun 3D model objekta i prva interaktivna 360 panorama spremna za VR. Svaka dodatna tačka gledanja iz iste strane modela: €48. Tačka koja zahteva neviđenu stranu: €60 (jednokratno). Za 5+ dodatnih tačaka: €53 po tački.",
      },
      {
        q: "Razlika u odnosu na klasični render?",
        a: "Klasični spoljašnji render (€250) je jedna slika iz jednog ugla. 360 panorama (€335) je interaktivan prikaz kroz koji klijent sam prolazi — 360° pogled iz tačke, sa mogućnošću dodavanja više tačaka po objektu.",
      },
      {
        q: "Da li radi u VR headset-u?",
        a: "Da. Panorama je standardno VR-ready — Meta Quest i kompatibilni uređaji otvaraju je direktno iz pretraživača, bez dodatne aplikacije.",
      },
      {
        q: "Koliko traje izrada?",
        a: "Prvi nacrt panorame šaljemo za 3–5 radnih dana od potvrde ponude i prijema arhitektonskih nacrta. Tri runde revizije su uključene.",
      },
      {
        q: "Šta dostavljam da biste počeli?",
        a: "Arhitektonske nacrte (osnove, preseci, fasade) u PDF ili DWG formatu. Po želji: specifikacija materijala fasade, fotografije lokacije za kontekst okoline.",
      },
    ],
    variants: [
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
    ],
  },
  {
    slug: "prikazi-iz-vazduha",
    code: "exterior-aerial-dedicated",
    name: "Prikazi iz vazduha",
    shortName: "Prikazi iz vazduha",
    category: "eksterijer",
    icon: "camera",
    tagline: "Tlocrt ne govori gde ste. Prikaz iz vazduha — govori.",
    description:
      "Aerial prikaz objekta u kontekstu — parcela, ulazni koridori, susedna izgradnja, zelenilo. Idealno za urbanističku dozvolu, javnu raspravu, prezentacije fondu ili odboru, i marketing parcele. €420 pokriva kompletan 3D model objekta i okruženja sa prvim prikazom; svaki sledeći ugao iz iste strane modela je €48.",
    highlight:
      "Najjača prezentacija lokacije i konteksta — za urbanističku dozvolu, board prezentacije i investitorske ponude.",
    materials:
      "Pošaljite arhitektonske nacrte (PDF/DWG), situacioni plan sa katastarskom podlogom, opciono fotografije lokacije. Prvi nacrt 3–5 radnih dana.",
    asset: "/artwork/listing-exterior-aerial.webp",
    listingAsset: "/artwork/listing-exterior-aerial.webp",
    philosophy:
      "Najveći trošak je izgradnja modela parcele i okruženja. Cena €420 pokriva pun 3D model objekta i konteksta, sa prvim prikazom iz vazduha. Svaki sledeći ugao iz iste strane modela je €48 (80% jeftinije). Doplata za prikaz zadnje strane (+25%): €105, jednokratno. Tako kompletna prezentacija lokacije ulazi u realan budžet — bez ponovnog modelovanja po slici.",
    priceContext:
      "€420 — pun 3D model objekta + okruženje + prvi prikaz iz vazduha. Sledeći ugao: €48.",
    forSegments: [
      "Developeri (masterplani)",
      "Investitori (parcele i kompleksi)",
      "Arhitekte (regulatorne prezentacije)",
    ],
    problemHeading: "Tlocrt ne govori gde ste. Prikaz iz vazduha — govori.",
    problemBody:
      "Investitor dolazi na prezentaciju sa fasciklom nacrta. Regulatorno telo, fond ili partner gleda u oznake ulica i katastarskih parcela koje ne može da poveže sa stvarnim prostorom. Odluka se odlaže.",
    problemResolution:
      "Prikaz iz vazduha stavlja Vaš objekat na mapu okruženja — vidljivi su parcela, ulazni koridori, zelenilo i susedna izgradnja, na jednoj slici koja objašnjava lokaciju bolje od svakog tlocrta.",
    benefits: [
      {
        icon: "trust",
        title: "Vizuelizacija za javnu raspravu",
        body: "Urbanistička komisija i regulatorno telo dobijaju prikaz koji smešta objekat u kontekst parcele i okruženja — u formatu koji procedura prihvata.",
      },
      {
        icon: "context",
        title: "Pregled koji board razume",
        body: "Fond, partner ili banka ne čita DWG. Prikaz iz vazduha daje celokupan obuhvat lokacije na jednoj slici — bez objašnjavanja šta koja linija znači.",
      },
      {
        icon: "value",
        title: "Prospekt koji prodaje lokaciju",
        body: "Kupac parcele ili stana u kompleksu odmah vidi okruženje, pristupne puteve i susednu izgradnju. Ne mora da zamišlja — vidi.",
      },
    ],
    processSteps: [
      {
        title: "Pošaljite nacrte",
        body: "PDF ili DWG osnove, fasade i situacioni plan sa katastarskom podlogom. Opciono: specifikacija materijala, fotografije lokacije.",
      },
      {
        title: "Potvrda ponude",
        body: "Šaljemo cenu i rok u roku od jednog radnog dana. Plaćanje avansne rate otključava izradu.",
      },
      {
        title: "Izrada i nacrte",
        body: "Prve nacrte šaljemo za 3–5 radnih dana. Uključene su 3 runde revizije — bez doplate.",
      },
      {
        title: "Finalni fajlovi",
        body: "Visoka rezolucija, PNG i TIFF, uz fakturu. Odmah upotrebljivo za štampu, prezentacije i web.",
      },
    ],
    faqs: [
      {
        q: "Šta tačno dobijam za €420?",
        a: "Pun 3D model objekta i okruženja, sa prvim prikazom iz vazduha. Paket uključuje 2 ugla. Svaki dodatni ugao: €48. Doplata za prikaz zadnje strane (+25%): €105, jednokratno.",
      },
      {
        q: "Razlika od klasičnog rendera eksterijera?",
        a: "Klasični render eksterijera (€250) je ugao sa tla — fasada u prvom planu, okruženje sugerisano. Aerial (€420) daje ptičju perspektivu: vidi se cela parcela, ulazni koridori i susedna izgradnja. Različita namena — nisu alternative.",
      },
      {
        q: "Razlika od fotografije dronom?",
        a: "Fotografija dronom snima ono što postoji na terenu. Aerial render gradi se iz DWG/PDF nacrta — može se napraviti pre nego što je kamen postavljen, sa tačnim materijalima fasade i oblikovanim okruženjem.",
      },
      {
        q: "Šta dostavljam da biste počeli?",
        a: "Arhitektonske nacrte u PDF ili DWG formatu (osnove, fasade, situacioni plan sa katastarskom podlogom). Po želji: specifikacija materijala fasade i fotografije lokacije za kontekst.",
      },
      {
        q: "Koliko traje izrada?",
        a: "Prve nacrte šaljemo za 3–5 radnih dana od potvrde ponude i prijema nacrta. Tri runde revizije su uključene — bez doplate.",
      },
      {
        q: "Da li se može koristiti u regulatornoj proceduri?",
        a: "Prikaz je arhitektonska vizuelizacija — ne zamenjuje tehnički elaborat, ali se standardno koristi kao prilog u materijalima za javnu raspravu i investitorske prezentacije.",
      },
    ],
    variants: [
      {
        id: "exterior-aerial",
        title: "Prikaz iz vazduha",
        basePrice: 420,
        priceLabel: "€420",
        unitLabel: "prikaz objekta + okruženja iz vazduha",
        description:
          "Za masterplane, parcele i investitorske prezentacije gde se vidi širi kontekst objekta, parking, prilazi.",
        included:
          "Pun 3D model objekta + okruženje + prvi prikaz iz vazduha.",
        addOns: [
          "Dodatni ugao iz vazduha: €48 (80% popust)",
          "Doplata za prikaz zadnje strane (+25%): €105 jednokratno",
        ],
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
    detailBeforeAsset: "/artwork/detail-virtuelno-opremanje-before.webp",
    detailAfterAsset: "/artwork/detail-virtuelno-opremanje-after.webp",
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
    detailBeforeAsset: "/artwork/detail-virtuelna-renovacija-before.webp",
    detailAfterAsset: "/artwork/detail-virtuelna-renovacija-after.webp",
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
    detailAsset: "/artwork/detail-osnove.webp",
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
      "https://kuula.co/share/collection/7k7GQ?logo=1&info=0&fs=1&vr=1&sd=1&autorotate=0.04&autop=30&thumbs=1",
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
    detailBeforeAsset: "/artwork/detail-prikazi-dvorista-before.webp",
    detailAfterAsset: "/artwork/detail-prikazi-dvorista-after.webp",
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
    detailBeforeAsset: "/artwork/detail-fotomontaza-before.webp",
    detailAfterAsset: "/artwork/detail-fotomontaza-after.webp",
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
    detailAsset: "/artwork/detail-3d-situacioni.webp",
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
    detailBeforeAsset: "/artwork/detail-dan-u-noc-before.webp",
    detailAfterAsset: "/artwork/detail-dan-u-noc-after.webp",
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
    detailBeforeAsset: "/artwork/detail-uklanjanje-elemenata-before.webp",
    detailAfterAsset: "/artwork/detail-uklanjanje-elemenata-after.webp",
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
