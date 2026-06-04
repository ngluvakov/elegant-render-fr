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
  /** Hide from primary navigation dropdown menu. The service is still in
   *  the catalog, still has a /usluge/<slug> page, and still appears in
   *  the sitemap — but the header dropdown skips it. Used for multi-variant
   *  master pages (e.g. unutrasnji-renderi) where dedicated split services
   *  exist and the master would duplicate them in the dropdown. */
  hideFromMenu?: boolean;

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
  /** When set, the problem section renders an iframe (e.g. Kuula 360 tour)
   *  instead of the before/after slider. Takes precedence over problemAsset. */
  problemEmbedSrc?: string;

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
    hideFromMenu: true,
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
    slug: "render-enterijera",
    code: "interior-static-dedicated",
    name: "Render enterijera",
    shortName: "Render enterijera",
    category: "enterijer",
    icon: "home",
    tagline: "Pokažite kupcima dom još pre nego što počnu radovi.",
    description:
      "Fotorealistični prikaz svake prostorije budućeg stana ili kuće — sa tačnim materijalima, rasporedom nameštaja i prirodnim svetlom. €170 pokriva ceo sprat sa do 10 opremljenih prostorija i neograničen broj uglova kamere iz tih soba. Prodajte off-plan jedinicu kupcu koji vidi tačno šta dobija.",
    highlight:
      "Pravi izbor za prospekt off-plan jedinica, klijentske prezentacije izbora materijala i marketing pred otvaranje prodaje.",
    materials:
      "Pošaljite osnovu (2D ili PDF), reference stila i spisak prostorija. Prvi nacrt 3–5 radnih dana.",
    asset: "/artwork/expert-unutrasnji-renderi.webp",
    listingAsset: "/artwork/listing-interior-static.webp",
    detailAsset: "/artwork/detail-interior-static.webp",
    problemAsset: "/artwork/problem-interior-static-after.webp",
    detailBeforeAsset: "/artwork/problem-interior-static-before.webp",
    detailAfterAsset: "/artwork/problem-interior-static-after.webp",
    philosophy:
      "Najveći deo posla je izrada 3D modela sprata — gradimo ga jednom i naplaćujemo jednom. Posle toga svaki novi ugao iste sobe je €10, dodatna soba na istom spratu €28, drugi sprat €120 (30% jeftinije). Tako planirate marketing budžet u sezoni pre-prodaje bez iznenađenja.",
    priceContext:
      "€170 — ceo sprat sa do 10 opremljenih prostorija + neograničen broj rendera iz tih soba.",
    forSegments: [
      "Investitori (multi-unit pre-prodaja)",
      "Arhitekte enterijera (klijentske prezentacije)",
      "Privatni klijenti pred renoviranje",
    ],
    problemHeading: "Kupac ne kupuje tlocrt. Kupuje dom u kome se vidi.",
    problemBody:
      "Investitor pokazuje nacrt stana, kupac broji metre i odlazi. Linije i oznake ne govore o materijalima, svetlu i atmosferi prostorije. Odluka se odlaže do trenutka kada se prostor može videti uživo — a tada se gradnja često već završila.",
    problemResolution:
      "Render enterijera pretvara osnovu u prepoznatljiv prostor — sa tačnim materijalima, izborom nameštaja i prirodnim svetlom. Kupac otvara prospekt, prepozna sobu u kojoj će živeti i donosi odluku.",
    benefits: [
      {
        icon: "speed",
        title: "Prodaja pre gradnje",
        body: "Off-plan jedinice idu brže kada kupac vidi tačnu sobu — sa stvarnim materijalima, ne crtežom. Razlika u brzini prodaje opravdava investiciju u prvih nekoliko jedinica.",
      },
      {
        icon: "trust",
        title: "Izbor materijala bez nesporazuma",
        body: "Klijent bira između varijanti renderom — vidi pod, zid i nameštaj zajedno, ne zamišlja. Konflikt na primopredaji se smanjuje.",
      },
      {
        icon: "value",
        title: "Jedan paket pokriva ceo sprat",
        body: "€170 obuhvata do 10 prostorija sa neograničenim brojem uglova. Po sobi to izlazi manje od €20 — kategorijski jeftinije od pojedinačnog naručivanja.",
      },
    ],
    processSteps: [
      {
        title: "Pošaljite osnovu",
        body: "PDF ili DWG tlocrt sprata, reference stila i spisak prostorija. Opciono: specifikacija materijala, fotografije inspiracije.",
      },
      {
        title: "Potvrda ponude",
        body: "Šaljemo cenu i rok u roku od jednog radnog dana, bez skrivenih stavki.",
      },
      {
        title: "Izrada i nacrte",
        body: "Tim gradi 3D model sprata, postavlja materijale, nameštaj i osvetljenje. Prve nacrte šaljemo za 3–5 radnih dana.",
      },
      {
        title: "Isporuka i revizije",
        body: "Dobijate finalne vizuale visoke rezolucije. Tri runde revizije su uključene u cenu — bez doplate.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-interior-static-01.webp",
        alt: "Dnevna soba sa kuhinjskim ostrvom — Elegant Render",
      },
      {
        src: "/artwork/portfolio-interior-static-02.webp",
        alt: "Kuhinja sa pendant svetlima i materijalom kamene radne ploče — Elegant Render",
      },
      {
        src: "/artwork/portfolio-interior-static-03.webp",
        alt: "Glavna spavaća soba sa indirektnim svetlom i toplom paletom — Elegant Render",
      },
      {
        src: "/artwork/portfolio-interior-static-04.webp",
        alt: "Kupatilo sa prirodnim svetlom i mermernim materijalom — Elegant Render",
      },
    ],
    faqs: [
      {
        q: "Šta tačno dobijam za €170?",
        a: "Kompletan 3D model jednog sprata sa do 10 opremljenih prostorija i neograničenim brojem uglova kamere iz tih soba. Uključen je i tlocrt sprata. Svaki sledeći sprat: €120 (30% jeftinije). 11. soba na istom spratu: €28.",
      },
      {
        q: "Razlika u odnosu na pojedinačnu sobu kod konkurencije?",
        a: "Standardno tržište naplaćuje po sobi. Mi naplaćujemo po spratu — €170 za do 10 prostorija. Po sobi to izlazi manje od €20. Logika je da je model već izgrađen kad pređemo iz sobe u sobu — naplata jednom umesto deset puta.",
      },
      {
        q: "Mogu li kasnije da menjam materijale ili nameštaj?",
        a: "Tri runde revizije su uključene u cenu. Posle prve isporuke menjamo podove, zidove, nameštaj ili osvetljenje dok rezultat ne bude tačan. Dodatna varijanta dizajna (drugi nameštaj na istom rasporedu) je opciono dostupna.",
      },
      {
        q: "Koliko traje izrada?",
        a: "Prve nacrte šaljemo za 3–5 radnih dana od potvrde ponude i prijema osnova. Završna isporuka zavisi od broja revizija — sve tri runde su uključene.",
      },
      {
        q: "Šta dostavljam da biste počeli?",
        a: "Osnovu (PDF ili DWG) sa rasporedom prostorija, spisak prostorija za render i reference stila. Po želji: specifikacija materijala (podovi, fasade, vrata), fotografije inspiracije, primere atmosfere.",
      },
      {
        q: "Da li radite i jednu sobu odvojeno?",
        a: "Standardni paket je po spratu jer je 3D model najveći deo posla. Pojedinačna soba je dostupna na poseban dogovor, ali po sobi nije ekonomski isplativija od paketa — preporučujemo barem ceo sprat.",
      },
    ],
    variants: [
      {
        id: "interior-static",
        title: "Klasični prikaz — po spratu",
        basePrice: 170,
        priceLabel: "€170",
        unitLabel: "ceo sprat sa do 10 prostorija",
        description:
          "Jedna porudžbina pokriva ceo sprat sa neograničenim brojem uglova. Svaki sledeći sprat 30% jeftiniji.",
        included:
          "Kompletna izgradnja 3D modela za jedan sprat. Uključuje do 10 opremljenih prostorija, neograničen broj uglova kamere iz tih soba i tlocrt sprata. Svaki sledeći sprat: €120 (30% jeftiniji).",
        addOns: [
          "11. i svaka sledeća opremljena soba: €28",
          "Dodatni ugao kamere u postojećoj sobi: €10",
          "Dodatni sprat: €120 (30% popust)",
        ],
      },
    ],
  },
  {
    slug: "360-tura-enterijera",
    code: "interior-360-tour-dedicated",
    name: "360 tura enterijera",
    shortName: "360 tura enterijera",
    category: "enterijer",
    icon: "home",
    tagline: "Kupac obilazi stan iz fotelje — pre nego što je sagrađen.",
    description:
      "Interaktivna 360 tura kroz ceo sprat. Klijent otvara link u pretraživaču ili VR uređaju, prelazi iz sobe u sobu, sam istražuje raspored i materijale. €295 pokriva do 10 interaktivnih soba + 10 dodatnih statičkih uglova kamere + tlocrt sprata.",
    highlight:
      "Prezentacija za udaljenog kupca i odluku bez termina za pokazivanje uživo — investitori za off-plan, agencije za remote kupovinu.",
    materials:
      "Pošaljite osnovu (2D ili PDF), reference stila i spisak prostorija za interaktivnu turu. Prvi nacrt 3–5 radnih dana.",
    asset: "/artwork/listing-interior-static.webp",
    listingAsset: "/artwork/listing-interior-static.webp",
    detailAsset: "/artwork/detail-interior-360.webp",
    detailBeforeAsset: "/artwork/problem-interior-360-before.webp",
    detailAfterAsset: "/artwork/problem-interior-360-after.webp",
    problemEmbedSrc:
      "https://kuula.co/share/collection/71kZD?logo=1&info=0&logosize=40&fs=1&vr=1&sd=1&autorotate=0.04&autop=30&thumbs=2",
    detailEmbedSrc:
      "https://kuula.co/share/collection/71kZD?logo=1&info=0&logosize=40&fs=1&vr=1&sd=1&autorotate=0.04&autop=30&thumbs=2",
    philosophy:
      "Najveći deo posla je izrada 3D modela sprata — gradimo ga jednom i naplaćujemo jednom. Posle toga svaka dodatna interaktivna tačka u istoj sobi je €27, dodatna soba €45, dodatni statički ugao €10, drugi sprat €205 (30% jeftinije). Tako kompletan obilazak ulazi u realan investitorski budžet.",
    priceContext:
      "€295 — ceo sprat u 360 turi sa do 10 interaktivnih soba + 10 statičkih uglova + tlocrt.",
    forSegments: [
      "Investitori (off-plan pre-prodaja)",
      "Agencije nekretnina (remote demo)",
      "Arhitekte enterijera (klijentske prezentacije)",
    ],
    problemHeading: "Tlocrt zatvara raspored u dve dimenzije. Tura ga otvara.",
    problemBody:
      "Statična slika daje jedan ugao iz jedne sobe. Kupac ne može da oseti odnose između prostorija, vidljivost iz kuhinje ka dnevnoj, prolaz iz hodnika ka spavaćoj. Pita za drugu sliku — i još jednu — i odluku odlaže.",
    problemResolution:
      "360 tura povezuje sve sobe u jedinstven prolaz. Kupac sam ulazi u stan, prelazi iz prostorije u prostoriju mišem ili VR uređajem, sam ispituje raspored i materijale — i donosi odluku iz fotelje.",
    benefits: [
      {
        icon: "trust",
        title: "Stan u pretraživaču",
        body: "Kupac otvara link sa telefona, računara ili VR headset-a — bez instalacije i bez naloga. Ulazi u prostor u istom trenutku.",
      },
      {
        icon: "speed",
        title: "Prodaja bez termina",
        body: "Kupac iz dijaspore ili druge zemlje vidi celu jedinicu u vreme koje njemu odgovara. Investitor ne čeka da kupac dođe na lokaciju.",
      },
      {
        icon: "value",
        title: "Jedan paket pokriva ceo sprat",
        body: "€295 obuhvata do 10 interaktivnih soba i 10 statičkih uglova. Po sobi to izlazi ispod €30 — manje od pojedinačnog 360 rendera kod konkurencije.",
      },
    ],
    processSteps: [
      {
        title: "Pošaljite osnovu",
        body: "PDF ili DWG tlocrt sprata, reference stila, spisak prostorija za turu i raspored interaktivnih tačaka po želji.",
      },
      {
        title: "Potvrda ponude",
        body: "Šaljemo cenu i rok u roku od jednog radnog dana, bez skrivenih stavki.",
      },
      {
        title: "Izrada i tura",
        body: "Tim gradi 3D model, postavlja materijale, osvetljenje i interaktivne tačke. Prvi nacrt ture šaljemo za 3–5 radnih dana.",
      },
      {
        title: "Isporuka linka i embed koda",
        body: "Dobijate link za deljenje i embed kod za sajt. Tri runde revizije su uključene u cenu — bez doplate.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-interior-360-01.webp",
        alt: "Frame iz 360 ture — open-concept dnevna i kuhinja, prelaz između prostorija",
      },
      {
        src: "/artwork/portfolio-interior-360-02.webp",
        alt: "Frame iz 360 ture — glavna spavaća soba sa indirektnim svetlom",
      },
      {
        src: "/artwork/portfolio-interior-360-03.webp",
        alt: "Frame iz 360 ture — ulazna zona i pogled kroz stan",
      },
      {
        src: "/artwork/portfolio-interior-360-04.webp",
        alt: "Frame iz 360 ture — terasa i prelaz ka enterijernom prostoru",
      },
    ],
    faqs: [
      {
        q: "Kako klijent otvara turu?",
        a: "Šaljemo link i embed kod. Klijent otvara kroz pretraživač — bez instalacije i bez naloga. Radi na telefonu, računaru i Meta Quest VR uređaju (VR mod je ugrađen u turu).",
      },
      {
        q: "Šta tačno dobijam za €295?",
        a: "Kompletan 3D model jednog sprata sa do 10 interaktivnih soba u 360 turi, dodatnih 10 statičkih uglova kamere i tlocrt sprata. 11. i svaka sledeća interaktivna soba: €45. Dodatna interaktivna tačka: €27. Dodatni statički ugao: €10. Sledeći sprat: €205 (30% popust).",
      },
      {
        q: "Razlika u odnosu na statički render enterijera (€170)?",
        a: "Statički render daje fiksne uglove kamere — kupac vidi sliku iz jedne pozicije. 360 tura povezuje sve sobe u prolaz — kupac sam ulazi u prostor, rotira pogled, prelazi između tačaka. Različita namena, ne alternative.",
      },
      {
        q: "Da li radi u VR headset-u?",
        a: "Da. Tura je standardno VR-ready — Meta Quest i kompatibilni uređaji otvaraju je direktno iz pretraživača, bez dodatne aplikacije.",
      },
      {
        q: "Koliko traje izrada?",
        a: "Prvi nacrt ture šaljemo za 3–5 radnih dana od potvrde ponude i prijema osnova. Tri runde revizije su uključene — bez doplate.",
      },
      {
        q: "Šta dostavljam da biste počeli?",
        a: "Osnovu (PDF ili DWG) sa rasporedom prostorija, spisak prostorija za interaktivnu turu i reference stila. Opciono: specifikacija materijala (podovi, fasade, vrata), fotografije inspiracije.",
      },
    ],
    variants: [
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
    hideFromMenu: true,
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
        src: "/artwork/elegant-render-feature-exterior.webp",
        alt: "Spoljašnji render — moderna porodična kuća, ulična perspektiva",
      },
      {
        src: "/artwork/elegant-render-services-triptych-1.webp",
        alt: "Spoljašnji render — fasada u dnevnom svetlu",
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
          "Ulazna tačka za prospekt: pun 3D model zgrade i prvi finalni render. Svaki sledeći ugao 80% jeftiniji.",
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
    name: "360 eksterijer",
    shortName: "360 eksterijer",
    category: "eksterijer",
    icon: "images",
    tagline: "Klijent obilazi Vašu zgradu kao u igri — pre gradnje.",
    description:
      "Interaktivna 360 panorama oko Vašeg objekta. Kupac otvara link u pretraživaču, mišem rotira pogled iz svih uglova, prebacuje između tačaka — i u VR režimu na Meta Quest uređajima. Idealno za off-plan pre-prodaju jedinica, remote demo i online prospekt.",
    highlight:
      "Prava prezentacija za udaljenog kupca — kada statični render ne daje osećaj prostora. Investitori za pre-prodaju iz dijaspore i agencije za remote pokazivanje.",
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
      "Investitor pokazuje fasadu, kupac klimne glavom i odlazi da razmisli. Statična slika ne daje osećaj prostora iz svih uglova, ne pokazuje materijale u svetlu, ne dozvoljava kupcu da sam istraži. Odluka se odlaže.",
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
        alt: "Frame iz 360 panorame stambenog kompleksa — okolni objekti i pristupna zona",
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
      "Prava prezentacija lokacije i konteksta — za urbanističku dozvolu, board prezentacije i investitorske ponude.",
    materials:
      "Pošaljite arhitektonske nacrte (PDF/DWG), situacioni plan sa katastarskom podlogom, opciono fotografije lokacije. Prvi nacrt 3–5 radnih dana.",
    asset: "/artwork/listing-exterior-aerial.webp",
    listingAsset: "/artwork/listing-exterior-aerial.webp",
    detailAsset: "/artwork/detail-exterior-aerial.webp",
    detailBeforeAsset: "/artwork/problem-aerial-before.webp",
    detailAfterAsset: "/artwork/problem-aerial-after.webp",
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
    portfolioImages: [
      {
        src: "/artwork/portfolio-aerial-01.webp",
        alt: "Stambeni kompleks, ptičja perspektiva — parcela, pristupni putevi i zelenilo — Elegant Render",
      },
      {
        src: "/artwork/portfolio-aerial-02.webp",
        alt: "Individualna vila, ptičja perspektiva — parcela, pristupni putevi i zelenilo — Elegant Render",
      },
      {
        src: "/artwork/portfolio-aerial-03.webp",
        alt: "Mešovita namena, ptičja perspektiva — parcela, pristupni putevi i zelenilo — Elegant Render",
      },
      {
        src: "/artwork/portfolio-aerial-04.webp",
        alt: "Poslovni objekat, ptičja perspektiva — parcela, pristupni putevi i zelenilo — Elegant Render",
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
      "Praktičan način da prazna nekretnina deluje useljivo i poveća broj poziva sa oglasa.",
    materials:
      "Pošaljite nam fotografije praznih prostorija visoke rezolucije i željeni stil nameštaja.",
    asset: "/artwork/expert-virtuelno-opremanje-after.webp",
    beforeAsset: "/artwork/expert-virtuelno-opremanje-before.webp",
    afterAsset: "/artwork/expert-virtuelno-opremanje-after.webp",
    detailAsset: "/artwork/detail-virtuelno-opremanje.webp",
    detailBeforeAsset: "/artwork/problem-virtuelno-opremanje-before.webp",
    detailAfterAsset: "/artwork/problem-virtuelno-opremanje-after.webp",
    philosophy:
      "Prva slika pokriva izbor nameštaja, stila i osvetljenja. Kad je stil definisan, svaki dodatni ugao iste sobe je 33% jeftiniji, druga soba 17% jeftinija, a od 10+ slika cena pada na €13/sliku. Tako celokupna nekretnina dobija kompletan oglasni paket za delić cene fizičkog opremanja.",
    priceContext:
      "€18 prva slika · €15 druga soba · od €13/sliku za pakovanje 10+ slika.",
    forSegments: [
      "Agencije nekretnina",
      "Vlasnici praznih jedinica",
      "Fotografi nekretnina (post-produkcija)",
    ],
    featured: true,
    problemHeading: "Prazna soba deluje hladno. Opremljena prodaje.",
    problemBody:
      "Kupac otvori oglas, vidi prazan stan i nastavi dalje. Bez nameštaja nema osećaja razmere, bez stila nema emocionalne reakcije. Većina agenata zna ovo — ali fizičko opremanje stana košta hiljade evra i traje danima.",
    problemResolution:
      "Virtuelno opremanje pretvara fotografiju prazne sobe u atraktivnu scenu za jedan dan i jedan klik više po oglasu. Nameštaj, ćilim, lampa, biljka — sve u stilu koji odgovara nekretnini.",
    benefits: [
      {
        icon: "speed",
        title: "Brz rezultat",
        body: "Sliku šaljete danas, opremljen prikaz dobijate za nekoliko radnih dana. Ne čekate dostavu nameštaja, ne organizujete fotograf-termin.",
      },
      {
        icon: "value",
        title: "100× jeftinije od fizičkog opremanja",
        body: "Pravi nameštaj za prezentaciju stana košta hiljade evra i traje danima. Virtuelno €18 po slici, €13 za pakovanje 10+ slika.",
      },
      {
        icon: "trust",
        title: "Stil koji odgovara kupcu",
        body: "Birate iz nekoliko pravaca — moderni minimalist, warm Scandinavian, klasičan. Promena stila iste sobe: €12.",
      },
    ],
    processSteps: [
      {
        title: "Pošaljite fotografije",
        body: "Fotografije praznih prostorija visoke rezolucije i 1–2 reference stila nameštaja koji želite.",
      },
      {
        title: "Potvrda ponude",
        body: "Šaljemo cenu i rok najkasnije narednog radnog dana, bez skrivenih stavki.",
      },
      {
        title: "Opremanje",
        body: "Postavljamo nameštaj, materijale i osvetljenje na Vaše fotografije. Prve nacrte šaljemo za 3–5 radnih dana.",
      },
      {
        title: "Isporuka i revizije",
        body: "Dobijate gotove slike spremne za oglas. Tri runde revizije su uključene u cenu — bez doplate.",
      },
    ],
    faqs: [
      {
        q: "Šta tačno dobijam za €18?",
        a: "Fotorealistično opremanje jedne prazne prostorije na osnovu Vaše fotografije — uključen izbor nameštaja, postavljanje i usklađivanje osvetljenja. Dodatni ugao iste sobe: €12 (33% popust). Druga soba iste nekretnine: €15 (17% popust). Pakovanje 10+ slika: €13 po slici (28% popust).",
      },
      {
        q: "Da li deluje stvarno?",
        a: "Naša verzija je fotorealistična — kupac obično ne primeti razliku između naše opremljene slike i fotografije stvarno opremljenog stana. Transparentno označavamo da je upotrebljen virtual staging, ali to ne smanjuje efikasnost oglasa.",
      },
      {
        q: "Mogu li da promenim stil ako mi se ne dopadne?",
        a: "Da. Promena stila opremanja iste sobe: €12. Pre toga su uključene tri runde revizije bez doplate — u njima menjamo nameštaj, materijale i osvetljenje dok rezultat ne bude tačan.",
      },
      {
        q: "Koliko traje izrada?",
        a: "Prve nacrte šaljemo za 3–5 radnih dana od potvrde ponude. Pakovanja 10+ slika idu fazno — prve slike za nedelju dana, ostatak po dogovoru sa Vama.",
      },
      {
        q: "Da li radite za agencije sa puno listinga?",
        a: "Da. Pakovanje 10+ slika je €13 po slici (28% popust). Stalni agenti mogu da dogovore prioritet izrade i konzistentnu stilsku liniju kroz sve listinge.",
      },
      {
        q: "Šta dostavljam da biste počeli?",
        a: "Fotografije praznih prostorija u dobroj rezoluciji (najmanje 1920px na dužoj strani, ne snimak telefonom pod uglom) i 1–2 reference stila nameštaja.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-virtuelno-opremanje-01.webp",
        alt: "Virtuelno opremanje — moderna dnevna soba sa minimalističkim nameštajem",
      },
      {
        src: "/artwork/portfolio-virtuelno-opremanje-02.webp",
        alt: "Virtuelno opremanje — spavaća soba sa toplim materijalima",
      },
      {
        src: "/artwork/portfolio-virtuelno-opremanje-03.webp",
        alt: "Virtuelno opremanje — kuhinja sa trpezarijom i prirodnim svetlom",
      },
      {
        src: "/artwork/portfolio-virtuelno-opremanje-04.webp",
        alt: "Virtuelno opremanje — kućna kancelarija sa policama i prirodnim svetlom",
      },
    ],
    variants: [
      {
        id: "staging-static",
        title: "Klasično opremanje fotografije",
        basePrice: 18,
        priceLabel: "€18",
        unitLabel: "prva opremljena slika",
        description:
          "Brz upgrade oglasa: prazna soba postaje atraktivna scena za €18. Svaka sledeća soba 17% jeftinija.",
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
    detailAsset: "/artwork/detail-virtuelna-renovacija.webp",
    detailBeforeAsset: "/artwork/problem-virtuelna-renovacija-before.webp",
    detailAfterAsset: "/artwork/problem-virtuelna-renovacija-after.webp",
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
    problemHeading: "Renovacija je skupa. Greška u materijalu — još skuplja.",
    problemBody:
      "Vlasnik bira pločice po katalogu, podove po uzorku, kuhinjske elemente po showroom-u — i sve zajedno tek vidi posle radova. Tada je kasno za ispravku. Izvođači prave izmene sa naknadnim računom.",
    problemResolution:
      "Virtuelna renovacija prikazuje finalni izgled prostorije pre nego što kupite materijal i pre nego što stignu majstori. Vidite sve zajedno, isprobate varijante, donosite odluku bez rizika.",
    benefits: [
      {
        icon: "value",
        title: "Manje grešaka, niži troškovi",
        body: "Skupa izmena materijala posle radova proizvodi nove troškove kod izvođača. Render ih sprečava — vidite finalni izgled pre nego što potrošite na zidare.",
      },
      {
        icon: "speed",
        title: "Brži dogovor sa majstorima",
        body: "Majstor zna tačno šta gradi kada ima rendere — manje pitanja, kraći vremenski okvir, manje izmena u toku rada.",
      },
      {
        icon: "trust",
        title: "Više varijanti za malo",
        body: "€66 prvi prikaz. Dodatni ugao iste sobe €59 (10% popust), od 4. ugla €53 (20% popust). Druga soba 15% jeftinija. Kompletna nekretnina ulazi u realan budžet.",
      },
    ],
    processSteps: [
      {
        title: "Pošaljite materijal",
        body: "Fotografije postojećeg stanja sobe i reference za nove podove, zidove i nameštaj. Što jasniji ulaz, brže nacrti.",
      },
      {
        title: "Potvrda ponude",
        body: "Šaljemo cenu i rok najkasnije narednog radnog dana, bez skrivenih stavki.",
      },
      {
        title: "Render renovacije",
        body: "Postavljamo nove materijale, fiksirane elemente, nameštaj i osvetljenje. Prve nacrte šaljemo za 3–5 radnih dana.",
      },
      {
        title: "Isporuka i revizije",
        body: "Dobijate finalne slike. Tri runde revizije su uključene u cenu — menjamo materijale, boje i layout dok ne bude tačno.",
      },
    ],
    faqs: [
      {
        q: "Šta tačno dobijam za €66?",
        a: "Kompletna vizuelna transformacija jedne prostorije na osnovu Vaše fotografije — uključuje promenu podova, zidova, fiksiranih elemenata i nameštaja. Dodatni ugao iste sobe: €59 (10% popust). 4. i svaki sledeći ugao: €53 (20% popust). Druga soba: €56 (15% popust).",
      },
      {
        q: "Razlika u odnosu na virtuelno opremanje (€18)?",
        a: "Virtuelno opremanje (€18) menja samo nameštaj — zidovi, podovi i fiksirani elementi ostaju isti. Virtuelna renovacija (€66) menja sve — pločice, podove, ormare, kuhinju. Različite namene.",
      },
      {
        q: "Koliko stvarno štedim?",
        a: "Skupa greška u izboru materijala posle radova obično košta 5–10× više od jednog rendera. Ako sprečimo jedan pogrešan izbor pločica ili podova, render se vraća kroz uštedu.",
      },
      {
        q: "Mogu li da probam različite varijante?",
        a: "Da. U tri runde revizije menjamo materijale i layout dok ne bude tačno. Dodatna varijanta na istom rasporedu (drugi materijali) računa se kao novi prvi prikaz.",
      },
      {
        q: "Koliko traje izrada?",
        a: "Prve nacrte šaljemo za 3–5 radnih dana od potvrde ponude i prijema fotografija i referenci. Završna isporuka zavisi od broja revizija.",
      },
      {
        q: "Šta dostavljam da biste počeli?",
        a: "Fotografije postojećeg stanja u dobroj rezoluciji, plan rasporeda (osnova ako postoji) i reference materijala koje želite (podovi, zidovi, ormari, nameštaj).",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-virtuelna-renovacija-01.webp",
        alt: "Virtuelna renovacija — moderna kuhinja sa ostrvom i kamenom radnom pločom",
      },
      {
        src: "/artwork/portfolio-virtuelna-renovacija-02.webp",
        alt: "Virtuelna renovacija — kupatilo sa staklenom tuš-kabinom i kamenim materijalima",
      },
      {
        src: "/artwork/portfolio-virtuelna-renovacija-03.webp",
        alt: "Virtuelna renovacija — dnevna soba sa novim podovima i toplim materijalima",
      },
      {
        src: "/artwork/portfolio-virtuelna-renovacija-04.webp",
        alt: "Virtuelna renovacija — radni prostor sa policama i prirodnim svetlom",
      },
    ],
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
    slug: "2d-i-3d-osnove",
    code: "floor-plans",
    name: "2D i 3D osnove",
    shortName: "2D i 3D osnove",
    category: "planovi",
    icon: "file-image",
    hideFromMenu: true,
    tagline: "Pregled prostora koji kupac razume na prvi pogled.",
    description:
      "Pregledni 2D ili 3D tlocrti — za oglas, prodaju, dozvolu ili planiranje uređenja. 2D daje čist tehnički prikaz; 3D daje atraktivniji prostorni prikaz koji kupac razume bez znanja arhitekture. Cena pokriva jedan nivo (sprat); dupliranje istog sprata košta samo trećinu cene.",
    highlight:
      "Prikladno za agencije nekretnina koje žele da oglas izgleda profesionalno i investitore koji predstavljaju tipove stanova u zgradi.",
    materials:
      "Pošaljite nam tehničke crteže, skice sa merama ili postojeće PDF osnove.",
    asset: "/artwork/expert-osnove.webp",
    detailAsset: "/artwork/detail-osnove.webp",
    detailBeforeAsset: "/artwork/problem-osnove-before.webp",
    detailAfterAsset: "/artwork/problem-osnove-after.webp",
    philosophy:
      "Cena pokriva izradu osnove za jedan nivo. Svaki sledeći nivo iste zgrade je 50–66% jeftiniji jer je stilski predložak već postavljen. Identičan sprat (dupliranje sa promenom oznaka) košta samo trećinu osnovne cene. Tako celokupna zgrada dobija pregledne osnove za delić cene CAD studija.",
    priceContext:
      "€20 jedan nivo (2D čist plan) / €29 jedan nivo (3D plan). Dodatni nivo: €10–15.",
    forSegments: [
      "Agencije nekretnina (listing materijali)",
      "Investitori (tipovi stanova u zgradi)",
      "Vlasnici (planiranje uređenja)",
    ],
    featured: true,
    problemHeading: "Tehnički crtež plaši kupca. Pregledna osnova — privlači.",
    problemBody:
      "Agent oglasi stan sa CAD tlocrtom — debele linije, oznake dimenzija, scale bars. Kupac otvori, zatvori, ne pita. Tlocrt govori jezik koji laik ne razume — i listing gubi poziv koji bi inače dobio.",
    problemResolution:
      "Pregledna 2D ili 3D osnova prikazuje raspored prostorija sa bojama, oznakama u srpskom i nameštajem na pravim mestima. Kupac razume šta kupuje na prvi pogled — listing postaje razgovor.",
    benefits: [
      {
        icon: "trust",
        title: "Kupac razume na prvi pogled",
        body: "Bez tehničkog predznanja, kupac vidi raspored, dimenzije i namenu prostorija. Oglas filtrira neozbiljne pozive.",
      },
      {
        icon: "speed",
        title: "Brz materijal za listing",
        body: "€20 za 2D, €29 za 3D — jedan dan rada, dobijate fajl za oglas, prospekt i prezentaciju.",
      },
      {
        icon: "value",
        title: "Više nivoa za istu zgradu jeftinije",
        body: "Identičan sprat (dupliranje sa promenom oznaka): trećina cene. Svaki sledeći nivo iste zgrade: 50–66% jeftiniji.",
      },
    ],
    processSteps: [
      {
        title: "Pošaljite tlocrte",
        body: "Tehničke crteže, skice sa merama ili postojeće PDF osnove (PDF/DWG/skica).",
      },
      {
        title: "Potvrda ponude",
        body: "Šaljemo cenu i rok najkasnije narednog radnog dana, bez skrivenih stavki.",
      },
      {
        title: "Izrada osnove",
        body: "Tim crta 2D ili 3D verziju sa oznakama i dimenzijama. Prvi nacrt 1–3 radna dana.",
      },
      {
        title: "Isporuka i revizije",
        body: "Dobijate finalnu osnovu u željenom formatu. Tri runde revizije su uključene u cenu.",
      },
    ],
    faqs: [
      {
        q: "Šta tačno dobijam za €20 / €29?",
        a: "€20 daje jedan nivo u čistom 2D vektorskom prikazu sa rasporedom prostorija, oznakama i dimenzijama. €29 daje 3D verziju istog nivoa — prostorni prikaz koji kupac razume bez znanja arhitekture. Identičan sprat (dupliranje): €6 (2D) / €10 (3D).",
      },
      {
        q: "2D ili 3D — šta da biram?",
        a: "Za agencijski listing: 3D, jer kupac razume na prvi pogled. Za regulatornu proceduru ili tehničku dokumentaciju: 2D, jer prati tehnički standard. Za dupleks na oglasu: oba (svaki sprat ima drugačiju namenu).",
      },
      {
        q: "Da li se može dodati nameštaj?",
        a: "Da. Verzija sa nameštajem: €6 (2D) ili €8 (3D). Varijanta dizajna (isti raspored, drugi nameštaj): €6.",
      },
      {
        q: "Koliko traje izrada?",
        a: "Prve nacrte šaljemo za 1–3 radna dana od potvrde ponude i prijema tehničkih crteža. Tri runde revizije su uključene.",
      },
      {
        q: "Šta dostavljam da biste počeli?",
        a: "Tehničke crteže, skice sa merama ili postojeće PDF osnove. Što jasniji ulaz (CAD), brže izrada.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-osnove-01.webp",
        alt: "3D osnova — porodična kuća sa rasporedom prostorija i nameštajem",
      },
      {
        src: "/artwork/portfolio-osnove-02.webp",
        alt: "3D osnova — stan u zgradi sa kompaktnim rasporedom",
      },
      {
        src: "/artwork/portfolio-osnove-03.webp",
        alt: "2D osnova — čist tehnički plan sa oznakama i dimenzijama",
      },
      {
        src: "/artwork/portfolio-osnove-04.webp",
        alt: "3D osnova — dupleks sa rasporedom oba sprata",
      },
    ],
    variants: [
      {
        id: "floorplan-2d",
        title: "2D tlocrt (čist tehnički plan)",
        basePrice: 20,
        priceLabel: "€20",
        unitLabel: "jedan sprat (2D plan)",
        description:
          "Brz ulaz za oglas — jasan tehnički tlocrt sa rasporedom i merama. Identičan sprat: €6.",
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
    slug: "2d-osnove",
    code: "floor-plan-2d-dedicated",
    name: "2D osnove",
    shortName: "2D osnove",
    category: "planovi",
    icon: "file-image",
    tagline: "Čist 2D tlocrt — brz materijal za oglas i dokumentaciju.",
    description:
      "Pregledan vektorski 2D tlocrt sa rasporedom prostorija, oznakama na srpskom i dimenzijama u metrima. Standardni format za oglas nekretnine, regulatornu proceduru i klijentsku prezentaciju. €20 pokriva jedan nivo; identičan sprat (dupliranje sa promenom oznaka) košta samo €6 — 70% jeftinije.",
    highlight:
      "Najjeftiniji ulaz u profesionalan tlocrt za listing — bez 3D budžeta, sa formatom koji prati dokumentaciju i ugovor.",
    materials:
      "Pošaljite tehničke crteže (PDF/DWG), skice sa merama ili postojeću PDF osnovu. Prvi nacrt 1–3 radna dana.",
    asset: "/artwork/listing-floorplan-2d.webp",
    listingAsset: "/artwork/listing-floorplan-2d.webp",
    detailAsset: "/artwork/listing-floorplan-2d.webp",
    philosophy:
      "2D plan je format koji prati dokumentaciju, oglas i ugovor. Cena pokriva jedan nivo u čistom vektorskom prikazu sa oznakama i dimenzijama. Identičan sprat (dupliranje sa promenom oznaka) košta samo €6 — 70% jeftinije. Tako zgrada sa više tipova stanova dobija celokupnu listing seriju za delić cene CAD studija. Isporuka kroz White Rook partnersku mrežu obezbeđuje konzistentan kvalitet i kratak rok.",
    priceContext:
      "€20 — jedan nivo (čist 2D vektorski plan). Identičan sprat (dupliranje): €6.",
    forSegments: [
      "Agencije nekretnina (listing materijali)",
      "Investitori (tipovi stanova u zgradi)",
      "Arhitekte (dokumentacija i prilozi)",
    ],
    problemHeading: "CAD eksport ne prodaje. Pregledan 2D plan — prodaje.",
    problemBody:
      "Agent oglasi stan sa direktnim CAD-eksportom — debele linije, oznake u milimetrima, scale bars i tehnički simboli za prozore i vrata. Kupac otvori, vidi crtež koji ne razume i zatvori oglas. Tehnička dokumentacija nije isto što i marketing materijal.",
    problemResolution:
      "Pregledan 2D plan zadržava preciznost CAD-a — tačne dimenzije, raspored, opise prostorija — ali u formatu koji laik razume: kolorisan, sa nazivima soba na srpskom, dimenzijama u metrima i opcijom nameštaja. Isti tlocrt, dva publikuma.",
    benefits: [
      {
        icon: "speed",
        title: "Najbrži ulaz u listing",
        body: "€20, prvi nacrt za 1–3 radna dana. Najniža ulazna cena za profesionalan tlocrt koji se direktno koristi u oglasu.",
      },
      {
        icon: "value",
        title: "Trećina cene po dodatnom spratu",
        body: "Identičan sprat (dupliranje sa promenom oznaka): samo €6 — 70% popust. Zgrada sa 5 tipova stanova dobija celu seriju za €44.",
      },
      {
        icon: "trust",
        title: "Standard koji prati dokumentaciju",
        body: "2D tlocrt je format koji ugovori, banke i regulatorna procedura očekuju. Isti fajl koristite u prospektu i u sudskom prilogu.",
      },
    ],
    processSteps: [
      {
        title: "Pošaljite tehničku osnovu",
        body: "PDF, DWG, skica sa merama ili fotografija postojećeg plana. Što jasniji ulaz (CAD), brže izrada.",
      },
      {
        title: "Potvrda ponude",
        body: "Šaljemo cenu i rok najkasnije narednog radnog dana, bez skrivenih stavki.",
      },
      {
        title: "Izrada 2D plana",
        body: "Tim crta čist vektorski plan sa oznakama, dimenzijama i nameštajem po želji. Prvi nacrt 1–3 radna dana.",
      },
      {
        title: "Isporuka i revizije",
        body: "Dobijate finalan PDF i vektorski fajl. Tri runde revizije su uključene u cenu — bez doplate.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-osnove-03.webp",
        alt: "2D osnova — čist tehnički plan sa oznakama i dimenzijama",
      },
      {
        src: "/artwork/listing-floorplan-2d.webp",
        alt: "2D osnova stana — kolorisan vektorski prikaz za oglas",
      },
    ],
    faqs: [
      {
        q: "Šta tačno dobijam za €20?",
        a: "Jedan nivo u čistom 2D vektorskom prikazu sa rasporedom prostorija, oznakama na srpskom i dimenzijama u metrima. Identičan sprat (dupliranje sa promenom oznaka): €6 (70% popust). Verzija sa nameštajem: +€6. Promena boje/stila: +€4.",
      },
      {
        q: "Razlika u odnosu na CAD eksport iz mog projekta?",
        a: "CAD eksport prati tehnički standard projekta — debele linije, oznake u milimetrima, scale bars. Naš 2D plan je marketinški format: kolorisan, sa nameštajem ili bez, dimenzije čitljive laiku. Različita namena, ne alternative.",
      },
      {
        q: "Kada birati 2D umesto 3D?",
        a: "Za regulatornu proceduru, ugovor, tehničku dokumentaciju ili kad oglas prati tehnički standard branše. Za agencijski oglas i laičku prezentaciju 3D verzija (€29) daje bolji efekat — kupac brže razume raspored.",
      },
      {
        q: "Da li radite više spratova zgrade?",
        a: "Da. Dva nivoa (dupleks): €32. Svaki dodatni nivo: €10. Identičan sprat (dupliranje sa promenom oznaka): samo €6 — 70% popust.",
      },
      {
        q: "Koliko traje izrada?",
        a: "Prve nacrte šaljemo 1–3 radna dana od potvrde ponude i prijema tehničkih crteža. Tri runde revizije su uključene.",
      },
      {
        q: "Šta dostavljam da biste počeli?",
        a: "Tehničke crteže (PDF/DWG), skice sa merama ili fotografiju postojeće osnove. Što jasniji ulaz (CAD), brže izrada.",
      },
    ],
    variants: [
      {
        id: "floorplan-2d",
        title: "2D tlocrt (čist tehnički plan)",
        basePrice: 20,
        priceLabel: "€20",
        unitLabel: "jedan sprat (2D plan)",
        description:
          "Brz ulaz za oglas — jasan tehnički tlocrt sa rasporedom i merama. Identičan sprat: €6.",
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
    ],
  },
  {
    slug: "3d-osnove",
    code: "floor-plan-3d-dedicated",
    name: "3D osnove",
    shortName: "3D osnove",
    category: "planovi",
    icon: "layers",
    tagline: "Prostorni 3D tlocrt koji kupac razume na prvi pogled.",
    description:
      "Atraktivan 3D prostorni prikaz tlocrta sa nameštajem, oznakama i bojama. Najjači format za agencijski oglas — kupac vidi raspored i namene bez čitanja tehničkih simbola. €29 pokriva jedan nivo; identičan sprat (dupliranje sa promenom oznaka) košta samo €10 — 66% jeftinije.",
    highlight:
      "Pravi izbor za listing fotografiju i prospekt — kupac na prvi pogled razume šta dobija.",
    materials:
      "Pošaljite tehničke crteže (PDF/DWG), skice sa merama ili postojeću PDF osnovu. Prvi nacrt 1–3 radna dana.",
    asset: "/artwork/listing-floorplan-3d.webp",
    listingAsset: "/artwork/listing-floorplan-3d.webp",
    detailAsset: "/artwork/detail-osnove.webp",
    detailBeforeAsset: "/artwork/problem-osnove-before.webp",
    detailAfterAsset: "/artwork/problem-osnove-after.webp",
    philosophy:
      "3D prostorni prikaz je marketinški format — kupac vidi raspored sa nameštajem i bojom, bez čitanja oznaka. Cena €29 pokriva jedan nivo. Identičan sprat (dupliranje sa promenom oznaka) košta samo €10 — 66% jeftinije. Tako dupleks i zgrada sa više tipova stanova ulaze u realan listing budžet — bez ponovnog modelovanja po nivou.",
    priceContext:
      "€29 — jedan nivo (3D prostorni prikaz). Identičan sprat (dupliranje): €10.",
    forSegments: [
      "Agencije nekretnina (listing fotografija)",
      "Investitori (tipovi stanova u zgradi)",
      "Vlasnici (oglas i prodaja)",
    ],
    problemHeading: "Tehnički tlocrt plaši kupca. 3D prikaz — privlači.",
    problemBody:
      "Kupac otvori oglas sa 2D tehničkim tlocrtom — linije, oznake, simboli za prozore i vrata. Mora da uloži minut samo da razume gde je kuhinja. Sledeći oglas ima 3D prikaz sa nameštajem — i kupac klikne na poziv.",
    problemResolution:
      "3D prostorni prikaz pokazuje raspored kao ptičju perspektivu sa nameštajem na pravim mestima, materijalima podova i bojama zidova. Kupac vidi dom, ne shemu — i odluka kreće iz prvog kontakta.",
    benefits: [
      {
        icon: "trust",
        title: "Kupac razume bez tehničkog predznanja",
        body: "Bez čitanja simbola — kupac vidi sobe, nameštaj i prolaz. Oglas filtrira ozbiljne pozive, neozbiljni otpadaju.",
      },
      {
        icon: "speed",
        title: "Brz materijal za listing",
        body: "€29, prvi nacrt 1–3 radna dana. Direktno upotrebljivo u oglasima, prospektima i prezentacijama.",
      },
      {
        icon: "value",
        title: "Više tipova stanova jeftinije",
        body: "Identičan sprat (dupliranje): samo €10 — 66% popust. Zgrada sa 4 tipa stana dobija kompletnu listing seriju za €59.",
      },
    ],
    processSteps: [
      {
        title: "Pošaljite tehničku osnovu",
        body: "PDF, DWG, skica sa merama ili fotografija postojećeg plana. Što jasniji ulaz (CAD), brže izrada.",
      },
      {
        title: "Potvrda ponude",
        body: "Šaljemo cenu i rok najkasnije narednog radnog dana, bez skrivenih stavki.",
      },
      {
        title: "Izrada 3D plana",
        body: "Tim modeluje prostor u 3D, postavlja nameštaj, materijale i osvetljenje. Prvi nacrt 1–3 radna dana.",
      },
      {
        title: "Isporuka i revizije",
        body: "Dobijate finalnu sliku visoke rezolucije. Tri runde revizije su uključene u cenu — bez doplate.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-osnove-01.webp",
        alt: "3D osnova — porodična kuća sa rasporedom prostorija i nameštajem",
      },
      {
        src: "/artwork/portfolio-osnove-02.webp",
        alt: "3D osnova — stan u zgradi sa kompaktnim rasporedom",
      },
      {
        src: "/artwork/portfolio-osnove-04.webp",
        alt: "3D osnova — dupleks sa rasporedom oba sprata",
      },
      {
        src: "/artwork/listing-floorplan-3d.webp",
        alt: "3D osnova stana — prostorni prikaz za listing i prospekt",
      },
    ],
    faqs: [
      {
        q: "Šta tačno dobijam za €29?",
        a: "Jedan nivo u atraktivnom 3D prostornom prikazu sa rasporedom prostorija, oznakama, nameštajem i materijalima. Identičan sprat (dupliranje sa promenom oznaka): €10 (66% popust). Dodavanje nameštaja: +€8. Varijanta dizajna (isti raspored, drugi nameštaj): +€6.",
      },
      {
        q: "Razlika u odnosu na render enterijera?",
        a: "Render enterijera (€170 za sprat) prikazuje sobu iz nivoa očiju — kao da stojite unutra. 3D osnova je ptičja perspektiva celog sprata sa skinutim krovom — vidite raspored, ne sobu. Različita namena, često se naručuju zajedno za prospekt.",
      },
      {
        q: "Kada birati 3D umesto 2D?",
        a: "Za agencijski oglas, prospekt i klijentske prezentacije gde kupac nije arhitekta — 3D pobeđuje. Za regulatornu proceduru, ugovor ili tehnički prilog 2D verzija (€20) prati standard branše.",
      },
      {
        q: "Da li mogu da naručim sa nameštajem ili bez?",
        a: "Oba. Bez nameštaja je standardna opcija. Sa nameštajem: +€8. Varijanta dizajna (isti raspored, drugi nameštaj — korisno za A/B testove kupaca): +€6.",
      },
      {
        q: "Da li radite više spratova zgrade?",
        a: "Da. Dva nivoa (dupleks): €46. Svaki dodatni nivo: €15. Identičan sprat (dupliranje sa promenom oznaka): samo €10 — 66% popust.",
      },
      {
        q: "Koliko traje izrada?",
        a: "Prve nacrte šaljemo 1–3 radna dana od potvrde ponude i prijema tehničkih crteža. Tri runde revizije su uključene.",
      },
    ],
    variants: [
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
    slug: "vr-tura",
    code: "vr-tour-assembly",
    name: "VR tura",
    shortName: "VR tura",
    category: "animacije",
    icon: "images",
    tagline: "Spojite panorame u jedinstvenu turu koju kupac obiđe iz fotelje.",
    description:
      "Već naručene 360 panorame (eksterijer, enterijer, opremanje) spajamo u jedinstvenu VR turu sa interaktivnim navigacijama, hosting-om i embed kodom za sajt. Kupac otvara link u pretraživaču ili VR uređaju, prelazi između tačaka, sam istražuje prostor.",
    highlight:
      "Prirodan dodatak na već naručene 360 panorame — niska cena, brza isporuka, spreman za VR uređaje.",
    materials:
      "Pošaljite 360 panorame koje već imate (od nas ili drugog izvora) i raspored za navigaciju između tačaka. Hosting podešavamo za 1–2 radna dana.",
    asset: PORTFOLIO_ASSET,
    embedSrc:
      "https://kuula.co/share/collection/7k7GQ?logo=1&info=0&fs=1&vr=1&sd=1&autorotate=0.04&autop=30&thumbs=1",
    detailEmbedSrc:
      "https://kuula.co/share/collection/7kLnB?logo=1&info=0&fs=1&vr=1&sd=1&autorotate=0.04&autop=30&thumbs=1",
    philosophy:
      "Sami 360 paketi (Eksterijer €335, Enterijer €295) već uključuju jednu ili više interaktivnih tačaka i embed kod. VR tura postaje korisna kada povezujete više panorama iz različitih projekata ili dodajete navigaciju po tlocrtu — tada je sklapanje i hosting zaseban posao.",
    priceContext:
      "€20 — sklapanje + hosting + embed kod. Navigacija po tlocrtu: €15. Branding ture: €35.",
    forSegments: [
      "Investitori (kompletna prezentacija projekta)",
      "Agencije nekretnina (više stanova u istoj turi)",
      "Arhitekte (klijentska prezentacija sa više soba)",
    ],
    featured: true,
    problemHeading: "Lepe panorame, slabo povezane — kupac se gubi.",
    problemBody:
      "Imate 5 360 panorama enterijera i 3 eksterijera, ali ih šaljete kao posebne linkove. Kupac otvori jednu, vidi sobu, mora da klikne nazad na email, otvori sledeću. Gubi pažnju pre nego što obiđe pola stana.",
    problemResolution:
      "VR tura spaja sve Vaše panorame u jedinstven prolaz sa interaktivnim hotspot-ovima i navigacijom po tlocrtu. Kupac otvara jedan link i obilazi ceo projekat — bez gubljenja konteksta.",
    benefits: [
      {
        icon: "trust",
        title: "Jedan link, ceo projekat",
        body: "Sve panorame u jednom kontinualnom prolazu. Kupac vidi vezu između prostorija, ne fragmente.",
      },
      {
        icon: "speed",
        title: "Brza isporuka",
        body: "Sklapamo za 1–2 radna dana. Hosting i embed kod isporučujemo isti dan kada finalizujemo strukturu.",
      },
      {
        icon: "value",
        title: "Pristupačan dodatak na već naručene panorame",
        body: "€20 osnovno sklapanje. Navigacija po tlocrtu: €15. Branding ture sa Vašim logoom: €35.",
      },
    ],
    processSteps: [
      {
        title: "Pošaljite panorame",
        body: "Već izrađene 360 panorame (linkove ili fajlove) i raspored za navigaciju između tačaka.",
      },
      {
        title: "Potvrda ponude",
        body: "Šaljemo cenu i rok najkasnije narednog radnog dana.",
      },
      {
        title: "Sklapanje i hosting",
        body: "Spajamo panorame, dodajemo hotspot navigaciju i postavljamo na host. Prvi nacrt 1–2 radna dana.",
      },
      {
        title: "Isporuka linka i embed koda",
        body: "Dobijate link za deljenje i embed kod za sajt. Tri runde revizije za navigaciju i raspored su uključene.",
      },
    ],
    faqs: [
      {
        q: "Da li VR tura uključuje izradu panorame?",
        a: "Ne. VR tura je dodatak na već izrađene panorame. Ako prvo treba da izradimo panorame, naručite 360 eksterijer (€335) ili 360 turu enterijera (€295) — ti paketi već uključuju jednu interaktivnu tačku i embed kod za pojedinačnu panoramu.",
      },
      {
        q: "Šta ako moje panorame nisu od vas?",
        a: "Nije problem. Sklapamo bilo koje 360 panorame standardnih formata (equirectangular ili stitched cube maps). Hosting je naš; link je deljiv i embed-friendly.",
      },
      {
        q: "Da li radi u VR headset-u?",
        a: "Da. Tura je standardno VR-ready — Meta Quest i kompatibilni uređaji otvaraju je direktno iz pretraživača, bez dodatne aplikacije.",
      },
      {
        q: "Koliko traje izrada?",
        a: "1–2 radna dana od potvrde ponude i prijema panorama.",
      },
      {
        q: "Šta dostavljam?",
        a: "Panorame koje već imate (linkove ili fajlove), raspored navigacije između tačaka i opciono brand asset-e (logo, boje).",
      },
    ],
    variants: [
      {
        id: "tour-assembly",
        title: "VR tura — sklapanje i hosting",
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
    ],
  },
  {
    slug: "arhitektonska-animacija",
    code: "architectural-animation",
    name: "Arhitektonska animacija",
    shortName: "Arhitektonska animacija",
    category: "animacije",
    icon: "layers",
    tagline: "Marketinški film u kome kamera leti kroz objekat.",
    description:
      "Arhitektonska animacija pretvara Vaš 3D model u 30-sekundni film u kojem kamera leti kroz objekat, otkrivajući prostor scenom po scenom. Marketinški alat za prospekt, investitorske prezentacije i kampanje na društvenim mrežama. Minimum 15 sekundi (€225).",
    highlight:
      "Za investitore koji žele dramatičnu prezentaciju kompleksa i agencije koje žele da listing bude više od galerije slika.",
    materials:
      "Pošaljite osnove, fasade i, ako postoji, već izrađen 3D model. Definišite željenu putanju kamere i ključne momente.",
    asset: PORTFOLIO_ASSET,
    philosophy:
      "Najveći trošak je izgradnja 3D modela. Animacija od nule: €15/sek. Iz postojećeg modela: €10/sek (33% jeftinije). Aktivan projekat (model još uvek u radu): €8/sek (47% jeftinije). Duže animacije dobijaju automatski popust: preko 60 sek −20%, preko 2 minuta −25%.",
    priceContext:
      "€15/sek od nule · €10/sek iz postojećeg modela · minimum 15 sek (€225).",
    forSegments: [
      "Investitori (marketing kampanje)",
      "Agencije nekretnina (premium listing)",
      "Razvojni projekti (masterplan prezentacije)",
    ],
    featured: true,
    problemHeading: "Statična slika ne pokreće. Film — pokreće.",
    problemBody:
      "Prospekt sa 10 slika ima ograničenu pažnju. Klijent skroluje, zatvori, ne pamti. Marketing kampanja na društvenim mrežama traži pokret, ne statičke kadrove.",
    problemResolution:
      "Arhitektonska animacija daje 30 sekundi prostora kroz koji kamera leti, otkrivajući enterijer, eksterijer i kontekst u jedinstvenom narativu. Listing dobija kvalitet filmskog trejlera.",
    benefits: [
      {
        icon: "speed",
        title: "Brže prebacuje na ozbiljnu fazu",
        body: "Klijent koji vidi animaciju razume projekat za 30 sekundi. Konsultacije počinju sa pitanjima o detaljima, ne o gabaritu.",
      },
      {
        icon: "value",
        title: "Niža cena iz postojećeg modela",
        body: "Ako smo Vam već izradili spoljašnji ili unutrašnji render, model je tu — animacija je €10/sek umesto €15/sek (33% popust). Aktivan projekat: €8/sek (47% popust).",
      },
      {
        icon: "trust",
        title: "Materijal za sve kanale",
        body: "Jedna animacija postaje YouTube prikaz, Instagram reel, prospekt embed i prezentacija na sastanku. Multi-channel sa jednim ulaganjem.",
      },
    ],
    processSteps: [
      {
        title: "Pošaljite materijal",
        body: "Osnove, fasade, postojeći 3D model (ako postoji) i opis željene putanje kamere.",
      },
      {
        title: "Potvrda ponude",
        body: "Šaljemo cenu po sekundi i ukupan budžet u roku od jednog radnog dana.",
      },
      {
        title: "Animacija",
        body: "Postavljamo kameru, materijale i osvetljenje, renderujemo sve frejmove. Prvi nacrt 5–7 radnih dana (zavisi od dužine).",
      },
      {
        title: "Isporuka",
        body: "Dobijate finalni film (MP4, 4K rezolucija). Tri runde revizije za putanju kamere su uključene.",
      },
    ],
    faqs: [
      {
        q: "Šta tačno dobijam za €225?",
        a: "15 sekundi animacije iz novog 3D modela. Cena po sekundi: €15. Ako već imamo Vaš model: €10/sek (€150 za 15 sek). Aktivan projekat (model u izradi): €8/sek (€120 za 15 sek).",
      },
      {
        q: "Razlika od video walkthrough-a?",
        a: "Video walkthrough snima postojeći prostor. Arhitektonska animacija gradi nepostojeći prostor iz nacrta — možete da snimite objekat koji još nije izgrađen, sa tačnim materijalima fasade i okolinom.",
      },
      {
        q: "Koliko brzo dobijam animaciju?",
        a: "Standardni rok 5–7 radnih dana za 15–30 sekundi. Duže animacije idu fazno po dogovoru. Tri runde revizije za putanju kamere uključene.",
      },
      {
        q: "Mogu li da menjam putanju kamere posle prvog nacrta?",
        a: "Da. U tri runde revizije menjamo putanju, brzinu, prelaze i ključne momente. Materijali, osvetljenje i geometrija fiksiraju se posle prve revizije.",
      },
      {
        q: "Šta dostavljam?",
        a: "Arhitektonske nacrte (PDF/DWG), postojeći 3D model ako postoji (FBX, OBJ, SKP), opis željene putanje i ključnih momenata. Opciono: muzika ili sound brief.",
      },
    ],
    variants: [
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
    slug: "uredjenje-pejzaza",
    code: "landscape-rendering",
    name: "Uređenje pejzaža",
    shortName: "Uređenje pejzaža",
    category: "eksterijer",
    icon: "tree",
    tagline: "Dvorište, bašta ili park — pre nego što biljke porastu.",
    description:
      "Prikaz uređenog spoljnog prostora — dvorišta, bašte, parka ili pristupne staze — pre nego što izvođači stignu na lokaciju. Idealno za prezentaciju klijentu pre potpisivanja ugovora ili reklamu pred otvaranje. Svaki sledeći ugao iste lokacije: 80% jeftiniji.",
    highlight:
      "Prikladno za pejzažne arhitekte koji predstavljaju projekat klijentu i investitore za zajedničke prostore u kompleksima.",
    materials:
      "Pošaljite nam situacioni plan, visinske kote i specifikaciju biljaka i materijala.",
    asset: "/artwork/expert-prikazi-dvorista-after.webp",
    beforeAsset: "/artwork/expert-prikazi-dvorista-before.webp",
    afterAsset: "/artwork/expert-prikazi-dvorista-after.webp",
    detailAsset: "/artwork/detail-prikazi-dvorista.webp",
    detailBeforeAsset: "/artwork/problem-prikazi-dvorista-before.webp",
    detailAfterAsset: "/artwork/problem-prikazi-dvorista-after.webp",
    philosophy:
      "Cena pokriva modelovanje terena, sadnju vegetacije i prvi prikaz. Pošto je teren izgrađen, svaki sledeći ugao iste lokacije je €45 — 80% jeftinije. Doplata postoji samo ako novi ugao zahteva teren koji nije bio u modelu.",
    priceContext:
      "€220 — kompletan teren + vegetacija + prvi prikaz. Sledeći ugao: €45 (80% jeftiniji).",
    forSegments: [
      "Pejzažne arhitekte (klijentske prezentacije)",
      "Investitori (zajednički prostori u kompleksima)",
      "Vlasnici parcela pred uređenje",
    ],
    problemHeading: "Gola parcela ne pokazuje vrednost. Uređen pejzaž — pokazuje.",
    problemBody:
      "Klijent gleda crtež pejzaža sa simbolima i ne vidi kako će dvorište zaista izgledati. Bez vizuelnog pejzaža, prodavac ne može da odbrani cenu uređenja, investitor ne dobija odobrenje, kupac parcele ne vidi potencijal.",
    problemResolution:
      "Pejzažni render pretvara situacioni plan u fotorealističan prikaz uređenog prostora — sa zrelom vegetacijom, popločanim stazama i akcent elementima u pravom kontekstu i svetlu.",
    benefits: [
      {
        icon: "trust",
        title: "Klijent vidi finalni rezultat",
        body: "Pejzažni arhitekta predstavlja projekat sa vizuelizacijom koja zamenjuje desetine objašnjenja. Klijent potpisuje brže.",
      },
      {
        icon: "context",
        title: "Dokaz vrednosti za investitora",
        body: "Zajednički prostori u kompleksu prodaju jedinice. Render ih čini opipljivim pred prodajni tim, fond i kupce.",
      },
      {
        icon: "value",
        title: "Više uglova jednom modelovan teren",
        body: "€220 pokriva kompletan teren i prvi prikaz. Svaki sledeći ugao iste lokacije: €45 (80% jeftiniji).",
      },
    ],
    processSteps: [
      {
        title: "Pošaljite plan",
        body: "Situacioni plan, visinske kote i specifikaciju biljaka i materijala (kamenje, popločavanje, vodeni elementi).",
      },
      {
        title: "Potvrda ponude",
        body: "Šaljemo cenu i rok najkasnije narednog radnog dana, bez skrivenih stavki.",
      },
      {
        title: "Modelovanje i render",
        body: "Tim modeluje teren, postavlja vegetaciju, staze i materijale. Prve nacrte šaljemo za 3–5 radnih dana.",
      },
      {
        title: "Isporuka i revizije",
        body: "Dobijate finalne vizuale. Tri runde revizije su uključene u cenu — bez doplate.",
      },
    ],
    faqs: [
      {
        q: "Šta tačno dobijam za €220?",
        a: "Kompletno modelovanje terena, postavljanje vegetacije i staza i prvi finalni render. Svaki sledeći ugao iste lokacije: €45 (80% popust). Doplata za neviđenu stranu terena: +25% jednom po modelu. Pogled iz vazduha na celu lokaciju: €380.",
      },
      {
        q: "Razlika u odnosu na klasičan render eksterijera?",
        a: "Render eksterijera pokazuje objekat sa fasade i okolinom. Pejzažni render fokus stavlja na uređenje — popločane staze, biljke u zrelom stanju, akcent kamenje, vodene elemente. Različite namene.",
      },
      {
        q: "Koliko detaljno modelujete biljke?",
        a: "Vegetacija je u realnoj zrelosti — ne kao da je sadno juče, već u stanju u kojem će biti za 2–3 godine. Birate listopadno/zimzeleno, akcent stabla i ukrasno bilje iz našeg kataloga ili po referencama.",
      },
      {
        q: "Da li radite i za stambene komplekse, ne samo privatna dvorišta?",
        a: "Da. Zajednički prostori u stambenim kompleksima su jednako uobičajen scenario. Razlika je samo u veličini terena — cena ostaje €220 za prvi prikaz, dodatni uglovi €45.",
      },
      {
        q: "Koliko traje izrada?",
        a: "Prve nacrte šaljemo za 3–5 radnih dana od potvrde ponude i prijema situacionog plana. Tri runde revizije su uključene.",
      },
      {
        q: "Šta dostavljam da biste počeli?",
        a: "Situacioni plan u PDF ili DWG formatu, visinske kote terena i specifikaciju ili reference biljaka i materijala (kamenje, popločavanje, vodeni elementi).",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-prikazi-dvorista-01.webp",
        alt: "Uređenje pejzaža — privatno dvorište porodične kuće sa terasom i travnjakom",
      },
      {
        src: "/artwork/portfolio-prikazi-dvorista-02.webp",
        alt: "Uređenje pejzaža — zajednički prostor stambenog kompleksa sa pešačkim stazama",
      },
      {
        src: "/artwork/portfolio-prikazi-dvorista-03.webp",
        alt: "Uređenje pejzaža — dvorište vile sa bazenom i terasom",
      },
      {
        src: "/artwork/portfolio-prikazi-dvorista-04.webp",
        alt: "Uređenje pejzaža — javni prostor sa popločanom stazom i zrelim sadnicama",
      },
    ],
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
      "Vaš budući objekat pažljivo uklopljen u realnu fotografiju lokacije — sa istim osvetljenjem, senkama i okruženjem kao na originalnoj slici. Verodostojan prikaz za nadležne organe (urbanistička dozvola, javna rasprava), prezentaciju klijentu i marketing pre izgradnje. Sledeći ugao iste fotografije: 82% jeftiniji.",
    highlight:
      "Za projekte u kojima realističnost i autentičnost lokacije presudno menjaju doživljaj projekta — dozvole, javne rasprave, investitorske prezentacije.",
    materials:
      "Pošaljite nam fotografiju lokacije visoke rezolucije i 3D model ili arhitektonske crteže objekta.",
    asset: "/artwork/expert-fotomontaza-after.webp",
    beforeAsset: "/artwork/expert-fotomontaza-before.webp",
    afterAsset: "/artwork/expert-fotomontaza-after.webp",
    detailAsset: "/artwork/detail-fotomontaza.webp",
    detailBeforeAsset: "/artwork/problem-fotomontaza-before.webp",
    detailAfterAsset: "/artwork/problem-fotomontaza-after.webp",
    philosophy:
      "Najveći trošak je analiza fotografije i uklapanje kamere, svetla i senki. Kad je uklapanje urađeno, dodatni ugao iz iste fotografije košta samo €55 (82% jeftiniji), a nova fotografija iste lokacije €85.",
    priceContext:
      "€300 — uklapanje + prvi prikaz. Sledeći ugao iste fotografije: €55 (82% jeftiniji).",
    forSegments: [
      "Investitori (urbanistička dozvola, javna rasprava)",
      "Arhitekte (klijentske prezentacije)",
      "Studija za masterplan i razvojne projekte",
    ],
    problemHeading: "Render ne ubeđuje regulatora. Fotografija — ubeđuje.",
    problemBody:
      "Investitor ide u urbanističku komisiju ili na javnu raspravu sa renderom — i čuje pitanja: kako će izgledati u kontekstu susednih zgrada? Kako se uklapa u ulicu? Render daje umetnički prikaz, ne tehnički dokaz.",
    problemResolution:
      "Fotomontaža uklapa Vaš 3D model u realnu fotografiju lokacije sa istim osvetljenjem, senkama i okruženjem. Komisija dobija dokaz, ne crtež. Investitor dobija dozvolu, ne odlaganje.",
    benefits: [
      {
        icon: "trust",
        title: "Dokaz za regulatorne procedure",
        body: "Urbanistička komisija prihvata fotomontažu kao verodostojan prilog. Javna rasprava ne pita „kako će izgledati“ — vidi.",
      },
      {
        icon: "context",
        title: "Tačan kontekst lokacije",
        body: "Susedne zgrade, ulica, stabla — sve kako stvarno postoji. Bez interpretacije, bez „umetničke slobode“.",
      },
      {
        icon: "value",
        title: "Više uglova iste fotografije za malo",
        body: "€300 pokriva analizu i prvi prikaz. Dodatni ugao iz iste fotografije: €55 (82% popust). Druga fotografija iste lokacije: €85.",
      },
    ],
    processSteps: [
      {
        title: "Pošaljite materijal",
        body: "Fotografiju lokacije visoke rezolucije i 3D model ili arhitektonske crteže objekta.",
      },
      {
        title: "Potvrda ponude",
        body: "Šaljemo cenu i rok najkasnije narednog radnog dana, bez skrivenih stavki.",
      },
      {
        title: "Analiza i uklapanje",
        body: "Analiziramo perspektivu, svetla i senke fotografije, pa uklapamo 3D model objekta. Prvi nacrt 3–5 radnih dana.",
      },
      {
        title: "Isporuka i revizije",
        body: "Dobijate fotorealističan prikaz spreman za dozvole, prezentacije i marketing. Tri runde revizije uključene.",
      },
    ],
    faqs: [
      {
        q: "Šta tačno dobijam za €300?",
        a: "Analiza fotografije lokacije, uklapanje 3D modela objekta i prvi finalni prikaz. Dodatni ugao iz iste fotografije: €55 (82% popust). Druga fotografija iste lokacije: €85 (72% popust). Doplata za neviđenu stranu objekta: +25% jednom.",
      },
      {
        q: "Razlika u odnosu na render eksterijera (€250)?",
        a: "Render eksterijera gradi sve od nule — objekat, okruženje, materijale, svetlo. Fotomontaža (€300) uklapa objekat u stvarnu fotografiju lokacije sa postojećim svetlom i kontekstom. Različite namene.",
      },
      {
        q: "Da li je prihvatljiva za urbanističku komisiju?",
        a: "Da. Fotomontaža je standardno prihvaćeni prilog u materijalima za urbanističku dozvolu, javnu raspravu i investitorske prezentacije. Verodostojnost komisija ceni iznad render kvaliteta.",
      },
      {
        q: "Mogu li da pošaljem fotografiju sa telefona?",
        a: "Tehnički je moguće, ali ne preporučujemo — kvalitet fotografije direktno utiče na kvalitet finalnog prikaza. Idealno: profesionalna fotografija ili DSLR/mirrorless snimak, najmanje 4000px na dužoj strani.",
      },
      {
        q: "Koliko traje izrada?",
        a: "Prve nacrte šaljemo za 3–5 radnih dana od potvrde ponude i prijema fotografije i 3D modela ili crteža. Tri runde revizije su uključene.",
      },
      {
        q: "Šta dostavljam da biste počeli?",
        a: "Fotografiju lokacije u dobroj rezoluciji (DSLR ili mirrorless, najmanje 4000px) i 3D model objekta (FBX, OBJ, SKP) ili arhitektonske crteže (PDF, DWG) iz kojih izgradimo model.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-fotomontaza-01.webp",
        alt: "Fotomontaža — porodična kuća uklopljena u stvarnu uličnu fotografiju",
      },
      {
        src: "/artwork/portfolio-fotomontaza-02.webp",
        alt: "Fotomontaža — stambena zgrada u urbanom kontekstu",
      },
      {
        src: "/artwork/portfolio-fotomontaza-03.webp",
        alt: "Fotomontaža — poslovni objekat uklopljen u fotografiju lokacije",
      },
      {
        src: "/artwork/portfolio-fotomontaza-04.webp",
        alt: "Fotomontaža — vila uklopljena u prirodno okruženje",
      },
    ],
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
    slug: "situacioni-planovi",
    code: "3d-site-plans",
    name: "Situacioni planovi",
    shortName: "Situacioni planovi",
    category: "planovi",
    icon: "layers",
    tagline: "Cela parcela iz vazduha — investitorska ponuda na jednoj slici.",
    description:
      "Kompletan prikaz parcele iz vazduha: teren, sve objekte, puteve, parking, vegetaciju i uređenje. Investitorski materijal za ponudu, urbanističku dozvolu i prodaju većih kompleksa. Sledeći ugao iste parcele: 81% jeftiniji. Faze izgradnje i sezonske varijante naručujete kroz istu scenu.",
    highlight:
      "Za masterplane, stambene komplekse, poslovne zone i razvojne projekte gde se prodaje lokacija, a ne samo objekat.",
    materials:
      "Pošaljite nam CAD crteže cele parcele, pozicije objekata i plan uređenja.",
    asset: "/artwork/expert-3d-situacioni.webp",
    detailAsset: "/artwork/detail-3d-situacioni.webp",
    detailBeforeAsset: "/artwork/problem-3d-situacioni-before.webp",
    detailAfterAsset: "/artwork/problem-3d-situacioni-after.webp",
    philosophy:
      "Cena pokriva izradu kompletnog terena, postavljanje objekata, puteva i pejzaža. Pošto je scena izgrađena, svaki sledeći ugao košta €65 (81% jeftinije), sezonska varijanta (zima/leto) €85, a prikaz po fazama izgradnje €95. Tako investitor ima vizuelni materijal za sve faze kampanje — fazu pre prodaje, fazu otvaranja prvog objekta itd. — iz jednog modela.",
    priceContext:
      "€350 — cela parcela: teren + objekti + pejzaž + prvi prikaz iz vazduha.",
    forSegments: [
      "Investitori i developeri",
      "Urbanisti i studija za masterplan",
      "Arhitekte (investitorske prezentacije)",
    ],
    problemHeading: "2D situacioni plan deluje kao karta. 3D — pokazuje projekat.",
    problemBody:
      "Fond, partner ili regulator otvori situacioni plan i vidi linije. Nije jasno gde je ulaz, kako se prilazi, šta je zajednički prostor a šta privatno. Razgovor staje na „mogu li da vidim render“.",
    problemResolution:
      "3D situacioni prikaz pokazuje istu parcelu sa svim objektima, pristupima, vegetacijom i kontekstom — investitor odgovara na pitanje pre nego što stigne. Materijal je istovremeno za regulatornu proceduru i za prodajnu kampanju.",
    benefits: [
      {
        icon: "context",
        title: "Cela parcela na jednoj slici",
        body: "Investitor odgovara fondu sa jednim vizualom umesto sa fasciklom crteža. Konkurentska prednost kod investitorskih ponuda.",
      },
      {
        icon: "trust",
        title: "Materijal za dozvolu i marketing",
        body: "Isti model služi i regulatornoj proceduri i prodajnim kampanjama — bez ponovnog modelovanja.",
      },
      {
        icon: "value",
        title: "Više vizuala iz iste scene",
        body: "€350 pokriva kompletan teren. Dodatni ugao €65, sezonska varijanta €85, prikaz po fazama izgradnje €95 — bez ponovnog modelovanja.",
      },
    ],
    processSteps: [
      {
        title: "Pošaljite CAD plan",
        body: "CAD crteže cele parcele, pozicije i tipologije objekata, plan uređenja i kontekst okruženja (PDF/DWG).",
      },
      {
        title: "Potvrda ponude",
        body: "Šaljemo cenu i rok najkasnije narednog radnog dana, bez skrivenih stavki.",
      },
      {
        title: "Modelovanje scene",
        body: "Tim modeluje teren, objekte, puteve, parking i pejzaž. Prve nacrte šaljemo za 3–5 radnih dana.",
      },
      {
        title: "Isporuka i revizije",
        body: "Dobijate finalni prikaz iz vazduha. Tri runde revizije su uključene u cenu — bez doplate.",
      },
    ],
    faqs: [
      {
        q: "Šta tačno dobijam za €350?",
        a: "Modelovanje cele parcele (teren, objekti, putevi, parking, vegetacija, pejzaž) i prvi finalni prikaz iz vazduha. Dodatni ugao iste parcele: €65 (81% popust). Sezonska varijanta (zima/leto): €85. Prikaz po fazama izgradnje: €95.",
      },
      {
        q: "Razlika u odnosu na prikaz iz vazduha (€420)?",
        a: "Aerial render (€420) je fokusiran na jedan objekat sa okruženjem. Situacioni plan (€350) prikazuje celu parcelu sa svim objektima i razvojem — masterplan nivo. Aerial je za pojedinačan objekat, situacioni za kompleks.",
      },
      {
        q: "Da li se može koristiti za urbanističku dozvolu?",
        a: "Da. Situacioni plan je standardni prilog u urbanističkim procedurama. 3D prikaz povećava razumljivost pred komisijom u odnosu na klasičan tehnički crtež.",
      },
      {
        q: "Mogu li da naručim faze izgradnje?",
        a: "Da. Prikaz po fazama izgradnje (€95) prikazuje istu parcelu u različitim fazama razvoja — pre, prva faza završena, druga faza u nazaku itd. Investitorska kampanja dobija vizuelni materijal za svaku fazu.",
      },
      {
        q: "Koliko traje izrada?",
        a: "Prve nacrte šaljemo za 3–5 radnih dana od potvrde ponude i prijema CAD plana. Tri runde revizije su uključene.",
      },
      {
        q: "Šta dostavljam da biste počeli?",
        a: "CAD crteže cele parcele (DWG), pozicije i tipologije objekata, plan uređenja i kontekst okruženja. Opciono: reference materijala fasade i pejzaža.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-3d-situacioni-01.webp",
        alt: "3D situacioni plan — stambeni kompleks sa 3 zgrade, zajedničkim prostorom i parking zonama",
      },
      {
        src: "/artwork/portfolio-3d-situacioni-02.webp",
        alt: "3D situacioni plan — mixed-use razvoj sa stambenim i poslovnim objektima",
      },
      {
        src: "/artwork/portfolio-3d-situacioni-03.webp",
        alt: "3D situacioni plan — parcele sa porodičnim kućama i individualnim dvorištima",
      },
      {
        src: "/artwork/portfolio-3d-situacioni-04.webp",
        alt: "3D situacioni plan — prva faza izgradnje vidljiva, kasnije faze nagovešten kontekst",
      },
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
    slug: "dnevni-u-nocni-prikaz",
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
    detailAsset: "/artwork/detail-dan-u-noc.webp",
    detailBeforeAsset: "/artwork/problem-dan-u-noc-before.webp",
    detailAfterAsset: "/artwork/problem-dan-u-noc-after.webp",
    outsourced: true,
    philosophy:
      "Brza post-produkcija sa jasnom cenom po slici. Pakovanje 10+ slika: €8/slika (20% popust). Hitna isporuka u roku od 24h: +50%.",
    priceContext: "€10 po slici · €8 po slici za pakovanje 10+.",
    forSegments: [
      "Agencije nekretnina (dramatic listing photo)",
      "Investitori (kampanje sa dnevno/večernjim varijantama)",
      "Fotografi nekretnina (post-produkcija)",
    ],
    problemHeading: "Dnevna fotografija ne prodaje. Topla večernja — prodaje.",
    problemBody:
      "Agent snimi objekat usred dana sa ravnim svetlom i plavim nebom — funkcionalna slika, ali bez emocije. Iste te fotografije izgledaju kao stotine drugih listinga. Klijent skroluje dalje.",
    problemResolution:
      "Zamena neba, dodavanje toplog osvetljenja prozora i fasadnog akcenta pretvara dnevnu sliku u dramatičan večernji prikaz. Listing dobija emotional pull bez ponovne fotografije ili filmskog termina.",
    benefits: [
      {
        icon: "speed",
        title: "Bez ponovne fotografije",
        body: "Šaljete dnevnu fotografiju koju već imate. Bez čekanja na dusk-termin, bez fotografa-honorara po izlasku.",
      },
      {
        icon: "value",
        title: "€10 po slici, €8 za pakovanje",
        body: "Jedna slika €10, pakovanje 10+ slika pada na €8 po slici (20% popust). Kompletna kampanja stana ili kuće za delić cene novog snimanja.",
      },
      {
        icon: "trust",
        title: "Listing koji se izdvaja",
        body: "Dramatic dusk look u real-estate galeriji izdvaja oglas od ostalih i povećava broj klikova na listing.",
      },
    ],
    processSteps: [
      {
        title: "Pošaljite fotografije",
        body: "Dnevne fotografije eksterijera visoke rezolucije (DSLR/mirrorless idealno, ne snimak telefonom pod uglom).",
      },
      {
        title: "Potvrda ponude",
        body: "Šaljemo cenu i rok najkasnije narednog radnog dana. Hitna isporuka u 24h dostupna uz +50% doplate.",
      },
      {
        title: "Transformacija",
        body: "Tim menja nebo, kolor-grejda osvetljenje i dodaje akcent svetla na prozorima i fasadi. Standardni rok 3–5 radnih dana.",
      },
      {
        title: "Isporuka",
        body: "Dobijate finalne slike spremne za listing i kampanje. Po želji uz uklanjanje neželjenih senki za €5 po slici.",
      },
    ],
    faqs: [
      {
        q: "Šta tačno dobijam za €10?",
        a: "Transformacija jedne dnevne fotografije eksterijera u dramatičan večernji prikaz — uključuje zamenu neba i podešavanje osvetljenja. Uklanjanje neželjenih senki: €5 po slici. Pakovanje 10+ slika: €8 po slici (20% popust). Hitna isporuka u 24h: +50%.",
      },
      {
        q: "Da li deluje stvarno ili kao filter?",
        a: "Naša verzija je fotorealistična — osvetljenje prozora, fasadne lampe i refleksije u staklu se uklapaju u realnu geometriju objekta. Nije Instagram filter; svaki light source se pažljivo postavi po fotografiji.",
      },
      {
        q: "Mogu li da dobijem i dnevnu i večernju verziju iste fotografije?",
        a: "Da. Originalna dnevna verzija ostaje neizmenjena, mi šaljemo dodatnu večernju. Pakovanja agencija često uključuju oba seta — dnevni za listing, večernji za društvene mreže i marketing kampanje.",
      },
      {
        q: "Koliko traje izrada?",
        a: "Standardni rok 3–5 radnih dana po slici. Hitna isporuka u 24h dostupna uz doplatu +50%. Pakovanja 10+ slika idu fazno po dogovoru.",
      },
      {
        q: "Da li radite za agencije sa puno listinga?",
        a: "Da. Pakovanje 10+ slika je €8 po slici (20% popust). Stalni agenti mogu da dogovore prioritet izrade i konzistentnu light-grading liniju kroz sve listinge.",
      },
      {
        q: "Šta dostavljam da biste počeli?",
        a: "Dnevne fotografije eksterijera u dobroj rezoluciji (DSLR ili mirrorless, najmanje 3000px na dužoj strani). Telefonske fotografije pod uglom ne preporučujemo.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-dan-u-noc-01.webp",
        alt: "Dnevni u noćni — porodična kuća sa osvetljenim prozorima i fasadnim svetlom",
      },
      {
        src: "/artwork/portfolio-dan-u-noc-02.webp",
        alt: "Dnevni u noćni — stambena zgrada sa osvetljenim terasama u večernjem režimu",
      },
      {
        src: "/artwork/portfolio-dan-u-noc-03.webp",
        alt: "Dnevni u noćni — vila sa osvetljenim bazenom i terasom",
      },
      {
        src: "/artwork/portfolio-dan-u-noc-04.webp",
        alt: "Dnevni u noćni — poslovni objekat sa fasadnim osvetljenjem i osvetljenim ulazom",
      },
    ],
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
    slug: "uklanjanje-predmeta",
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
    detailAsset: "/artwork/detail-uklanjanje-elemenata.webp",
    detailBeforeAsset: "/artwork/problem-uklanjanje-elemenata-before.webp",
    detailAfterAsset: "/artwork/problem-uklanjanje-elemenata-after.webp",
    outsourced: true,
    philosophy:
      "Jednostavno uklanjanje (sitnice, lične stvari): €12. Kompleksno (veliki objekat sa rekonstrukcijom pozadine): €25. Pakovanje 10+ slika: €10 jednostavno / €20 kompleksno po slici.",
    priceContext:
      "€12 jednostavno / €25 kompleksno · pakovanje 10+: €10 / €20.",
    forSegments: [
      "Agencije nekretnina (čist listing photo)",
      "Fotografi (post-produkcija praznih jedinica)",
      "Investitori (marketing materijali bez nereda)",
    ],
    problemHeading: "Nered na fotografiji odvodi pažnju. Čist kadar — zadržava.",
    problemBody:
      "Klijent ne sređuje stan pre fotograf-termina. Lične stvari, kablovi, kutije, parkirani autobusi pred fasadom — sve to ulazi u listing i odvlači pažnju kupca sa prostora. Fizičko sređivanje nije isplativo, fotograf nema vremena da čeka.",
    problemResolution:
      "Digitalno uklanjamo nered i nepotrebne objekte sa fotografije, sa rekonstrukcijom pozadine gde je potrebno. Listing izgleda čist bez ijednog sata fizičkog rada na lokaciji.",
    benefits: [
      {
        icon: "speed",
        title: "Bez fizičkog sređivanja",
        body: "Fotograf snima šta zatekne, vi šaljete sliku — mi uklanjamo nered. Ne čekate da neko isprazni stan, ne organizujete dodatni termin.",
      },
      {
        icon: "value",
        title: "Dva tier-a po složenosti",
        body: "Sitnice i lične stvari: €12. Veliki objekat sa rekonstrukcijom pozadine: €25. Pakovanje 10+ slika spušta na €10 / €20 po slici.",
      },
      {
        icon: "trust",
        title: "Pozadina koja izgleda stvarno",
        body: "Kod kompleksnog uklanjanja rekonstruišemo pozadinu (zid, pločice, parket) tako da rezultat deluje kao da predmet nikad nije bio tu.",
      },
    ],
    processSteps: [
      {
        title: "Pošaljite fotografije",
        body: "Fotografije sa jasno označenim predmetima koje želite da uklonimo (komentar u email-u ili screenshot sa crtežom).",
      },
      {
        title: "Potvrda ponude",
        body: "Šaljemo cenu (jednostavno €12 ili kompleksno €25) i rok najkasnije narednog radnog dana.",
      },
      {
        title: "Uklanjanje",
        body: "Tim uklanja označene predmete i rekonstruiše pozadinu gde je potrebno. Standardni rok 3–5 radnih dana.",
      },
      {
        title: "Isporuka",
        body: "Dobijate finalne slike spremne za listing. Tri runde revizije su uključene.",
      },
    ],
    faqs: [
      {
        q: "Šta tačno dobijam za €12?",
        a: "Digitalno uklanjanje sitnica i ličnih stvari sa jedne fotografije. Kompleksno uklanjanje (veliki objekat sa rekonstrukcijom pozadine): €25. Dodatna slika — jednostavno: €8 (33% popust). Dodatna slika — kompleksno: €18 (28% popust). Pakovanje 10+: €10 / €20 po slici.",
      },
      {
        q: "Kako da znam da li je moj slučaj jednostavan ili kompleksan?",
        a: "Jednostavno: lične stvari, magazini, kablovi, šolje — predmeti gde pozadina (zid, sto, pod) ostaje vidljiva i lako se zameni. Kompleksno: veliki aparati, parkirana vozila, kuhinjski elementi — gde se pozadina rekonstruiše iz nule. Pošaljite fotografiju i mi potvrdimo tier u ponudi.",
      },
      {
        q: "Da li rekonstrukcija pozadine deluje stvarno?",
        a: "Da. Kombinujemo kontekst iz iste fotografije (svetlo, perspektiva) sa rekonstrukcijom materijala (pločice, parket, zid) tako da rezultat nema 'pečate' uklanjanja. Tri runde revizije su uključene ako neki detalj nije tačan.",
      },
      {
        q: "Koliko traje izrada?",
        a: "Standardni rok 3–5 radnih dana po slici. Pakovanja 10+ slika idu fazno po dogovoru — prve slike pre, ostatak po terminu.",
      },
      {
        q: "Šta dostavljam da biste počeli?",
        a: "Fotografije u dobroj rezoluciji i jasno označavanje predmeta koje želite da uklonimo (komentar u email-u, screenshot sa crtežom, ili lista u tekstu).",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-uklanjanje-elemenata-01.webp",
        alt: "Uklanjanje predmeta — dnevna soba sređena za listing fotografiju",
      },
      {
        src: "/artwork/portfolio-uklanjanje-elemenata-02.webp",
        alt: "Uklanjanje predmeta — kuhinja sa rekonstruisanom pozadinom posle uklanjanja aparata",
      },
      {
        src: "/artwork/portfolio-uklanjanje-elemenata-03.webp",
        alt: "Uklanjanje predmeta — kupatilo sa praznim policama spremno za fotografiju",
      },
      {
        src: "/artwork/portfolio-uklanjanje-elemenata-04.webp",
        alt: "Uklanjanje predmeta — spoljna fasada bez parkiranog vozila i vidljivih kablova",
      },
    ],
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
