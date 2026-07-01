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
  Pricing sourced from the RSD catalog derived from docs/pricing/pillar-1-extracted.md.
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
  /** Whole-dinar amount, used for comparisons and starting-from displays. */
  basePrice: number;
  /** Human price label — may include unit suffix (e.g. "1.758 RSD/sec"). */
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
  /** Optional price breakdown shown right under the price headline (e.g.
   *  "Render eksterijera 29.300 RSD + Fotomontaža 5.860 RSD"). Renders as a muted
   *  annotation, currency-aware via formatPublicPriceText. */
  decomposition?: string;
  /** Override the category used to build the configurator deep-link. Set on
   *  cross-sell cards whose product lives in a different category than the
   *  host service (e.g. a "transformacija" reno card on an "eksterijer" page),
   *  so the deep-link resolves the correct configurator group. */
  configuratorCategory?: ServiceCategory;
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
  /** Optional content-specific alt text for the detail-page before/after
   *  reveal halves. When set, these override the generic
   *  buildServiceImageAlt(..., "before"/"after") strings so the alt can
   *  describe the actual scene for stronger image SEO. */
  detailBeforeAlt?: string;
  detailAfterAlt?: string;
  detailEmbedSrc?: string;
  /** When set, the mid-page "Demo" section renders a looping <video> of the
   *  animation instead of the 360 iframe. Takes precedence over
   *  detailEmbedSrc in that section. */
  detailVideoSrc?: string;
  /** Optional poster frame for detailVideoSrc. */
  detailVideoPoster?: string;
  /** Listing-page card image (4:3, 1200×900). Used by services-showcase
   *  on /usluge — distinct from home (3:2 thumbnail) and detail (16:9
   *  hero) so each surface has its own visual identity. */
  listingAsset?: string;
  /** Plain-language line that shows next to "od X RSD" everywhere a price
   *  is displayed (picker, services grid, hero chip). Anchors the price
   *  to the quantity it covers so customers don't read 19.924 RSD as "one
   *  render" when it's actually "whole floor + unlimited renders". */
  priceContext?: string;
  /** Optional list of target customer segments shown as "Idealno za:"
   *  chips on the service detail page. Set only on investor-grade
   *  services where segmentation actually clarifies the value prop. */
  forSegments?: readonly string[];
  /** Why this service is priced the way it is (customer-value framing). */
  philosophy: string;
  variants: PricingVariant[];
  /** Extra pricing cards rendered after `variants` on the detail page only —
   *  cross-sell options whose product lives in another service/category (e.g.
   *  the cheaper "virtuelna renovacija iz fotografije" on the landscape page).
   *  Display-only: NOT consumed by the home quick-order hero or the quote. */
  crossSellVariants?: PricingVariant[];
  /** Optional heading/body shown above the pricing cards. Use to frame a
   *  multi-option choice (e.g. "Dva načina…"). Falls back to the generic
   *  pricing header when unset. */
  pricingLead?: { heading: string; body: string };
  /** Optional scannable two-method comparison shown above the pricing cards.
   *  `a` is this page's primary method (highlighted), `b` the cross-sell. */
  comparison?: {
    aLabel: string;
    bLabel: string;
    rows: { label: string; a: string; b: string }[];
  };
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
  /** When set, the problem section renders an interactive equirectangular
   *  360° viewer (Pannellum) of this image — drag to look around. Takes
   *  precedence over problemEmbedSrc and problemAsset. */
  problemPanoramaSrc?: string;

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
      "Pokažite kupcima ili klijentima kako će izgledati svaka prostorija budućeg doma — još pre nego što počnu radovi. Jedna porudžbina pokriva ceo sprat — 10 statičkih rendera enterijera + tlocrt sprata. Prodajte stan iz prospekta, dogovorite klijenta na izboru materijala, ili predstavite enterijer pre nego što ga izgradite.",
    highlight:
      "Za stanove u izgradnji, kuće pred renoviranje i investitorske jedinice — jedna investicija pokriva ceo sprat, ne pojedinačnu sobu.",
    materials:
      "Pošaljite nam osnovu (2D ili PDF), reference stila i spisak prostorija. Što jasniji ulaz, brže šaljemo prve nacrte — standardno 3–5 radnih dana.",
    asset: "/artwork/expert-unutrasnji-renderi.webp",
    detailAsset: "/artwork/detail-unutrasnji-renderi.webp",
    philosophy:
      "Najveći deo posla je izrada 3D modela — gradimo ga jednom i naplaćujemo jednom. Nakon toga svaki novi ugao, promena nameštaja ili doba dana kreće od 1.172 RSD, ne od pune cene rendera. Tako planirate marketing budžet u sezoni pre-prodaje bez neprijatnih iznenađenja.",
    priceContext:
      "Ceo sprat — 10 statičkih rendera enterijera + tlocrt sprata.",
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
        priceLabel: "19.924 RSD",
        unitLabel: "ceo sprat — 10 statičkih rendera",
        description:
          "Najjača kombinacija za prospekt i prezentaciju investitorskih jedinica — jedna investicija pokriva ceo sprat: 10 statičkih rendera + tlocrt.",
        included:
          "Kompletna izgradnja 3D modela za jedan sprat. Uključuje 10 statičkih rendera enterijera i tlocrt sprata. Svaki sledeći sprat: 14.064 RSD (30% jeftiniji).",
        addOns: [
          "11. i svaka sledeća opremljena soba: 3.282 RSD",
          "Dodatni ugao kamere u postojećoj sobi: 1.172 RSD",
          "Dodatni sprat: 14.064 RSD (30% popust)",
        ],
      },
      {
        id: "interior-360",
        title: "Interaktivna 360 tura — po spratu",
        basePrice: 295,
        priceLabel: "34.574 RSD",
        unitLabel: "ceo sprat u 360 turi",
        description:
          "Kupac obilazi prostor mišem kao u igri — savršeno za online prezentaciju nekretnine i remote pre-prodaju.",
        included:
          "Do 10 interaktivnih soba u 360 turi (klijent ulazi i obilazi prostor) + 10 dodatnih statičkih uglova kamere + tlocrt sprata.",
        addOns: [
          "11. i svaka sledeća interaktivna soba: 5.274 RSD",
          "Dodatna interaktivna tačka u postojećoj sobi: 3.164 RSD",
          "Dodatni statički ugao kamere: 1.172 RSD",
          "Dodatni sprat (360 tura): 24.026 RSD (30% popust)",
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
      "Fotorealistični prikaz svake prostorije budućeg stana ili kuće — sa tačnim materijalima, rasporedom nameštaja i prirodnim svetlom. 19.924 RSD pokriva ceo sprat — 10 statičkih rendera enterijera + tlocrt sprata. Prodajte off-plan jedinicu kupcu koji vidi tačno šta dobija.",
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
      "Najveći deo posla je izrada 3D modela sprata — gradimo ga jednom i naplaćujemo jednom. Posle toga svaki novi ugao iste sobe je 1.172 RSD, dodatna soba na istom spratu 3.282 RSD, drugi sprat 14.064 RSD (30% jeftinije). Tako planirate marketing budžet u sezoni pre-prodaje bez iznenađenja.",
    priceContext:
      "19.924 RSD — ceo sprat: 10 statičkih rendera enterijera + tlocrt sprata.",
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
        body: "19.924 RSD obuhvata 10 statičkih rendera enterijera + tlocrt sprata. Po renderu to izlazi 1.992 RSD — kategorijski jeftinije od pojedinačnog naručivanja.",
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
        q: "Šta tačno dobijam za 19.924 RSD?",
        a: "Kompletan 3D model jednog sprata sa 10 statičkih rendera enterijera i tlocrtom sprata. Svaki sledeći sprat: 14.064 RSD (30% jeftinije). 11. soba na istom spratu: 3.282 RSD.",
      },
      {
        q: "Razlika u odnosu na pojedinačnu sobu kod konkurencije?",
        a: "Standardno tržište naplaćuje po sobi. Mi naplaćujemo po spratu — 19.924 RSD za 10 statičkih rendera. Po renderu to izlazi 1.992 RSD. Logika je da je model već izgrađen kad pređemo iz sobe u sobu — naplata jednom umesto deset puta.",
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
        priceLabel: "19.924 RSD",
        unitLabel: "ceo sprat — 10 statičkih rendera",
        description:
          "Jedna porudžbina pokriva ceo sprat: 10 statičkih rendera + tlocrt. Svaki sledeći sprat 30% jeftiniji.",
        included:
          "Kompletna izgradnja 3D modela za jedan sprat. Uključuje 10 statičkih rendera enterijera i tlocrt sprata. Svaki sledeći sprat: 14.064 RSD (30% jeftiniji).",
        addOns: [
          "11. i svaka sledeća opremljena soba: 3.282 RSD",
          "Dodatni ugao kamere u postojećoj sobi: 1.172 RSD",
          "Dodatni sprat: 14.064 RSD (30% popust)",
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
      "Interaktivna 360 tura kroz ceo sprat. Klijent otvara link u pretraživaču ili VR uređaju, prelazi iz sobe u sobu, sam istražuje raspored i materijale. 34.574 RSD pokriva do 10 interaktivnih soba + 10 dodatnih statičkih uglova kamere + tlocrt sprata.",
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
      "Najveći deo posla je izrada 3D modela sprata — gradimo ga jednom i naplaćujemo jednom. Posle toga svaka dodatna interaktivna tačka u istoj sobi je 3.164 RSD, dodatna soba 5.274 RSD, dodatni statički ugao 1.172 RSD, drugi sprat 24.026 RSD (30% jeftinije). Tako kompletan obilazak ulazi u realan investitorski budžet.",
    priceContext:
      "34.574 RSD — ceo sprat u 360 turi sa do 10 interaktivnih soba + 10 statičkih uglova + tlocrt.",
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
        body: "34.574 RSD obuhvata do 10 interaktivnih soba i 10 statičkih uglova. Po sobi to izlazi ispod 3.516 RSD — manje od pojedinačnog 360 rendera kod konkurencije.",
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
        q: "Šta tačno dobijam za 34.574 RSD?",
        a: "Kompletan 3D model jednog sprata sa do 10 interaktivnih soba u 360 turi, dodatnih 10 statičkih uglova kamere i tlocrt sprata. 11. i svaka sledeća interaktivna soba: 5.274 RSD. Dodatna interaktivna tačka: 3.164 RSD. Dodatni statički ugao: 1.172 RSD. Sledeći sprat: 24.026 RSD (30% popust).",
      },
      {
        q: "Razlika u odnosu na statički render enterijera (19.924 RSD)?",
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
        priceLabel: "34.574 RSD",
        unitLabel: "ceo sprat u 360 turi",
        description:
          "Kupac obilazi prostor mišem kao u igri — savršeno za online prezentaciju nekretnine i remote pre-prodaju.",
        included:
          "Do 10 interaktivnih soba u 360 turi (klijent ulazi i obilazi prostor) + 10 dodatnih statičkih uglova kamere + tlocrt sprata.",
        addOns: [
          "11. i svaka sledeća interaktivna soba: 5.274 RSD",
          "Dodatna interaktivna tačka u postojećoj sobi: 3.164 RSD",
          "Dodatni statički ugao kamere: 1.172 RSD",
          "Dodatni sprat (360 tura): 24.026 RSD (30% popust)",
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
      "Realistični prikazi fasada, kuća i poslovnih objekata — za prospekt, dozvolu, oglas ili klijentsku prezentaciju. Cena pokriva izradu kompletnog 3D modela objekta i prvi render. Pošto je model već izgrađen, svaki sledeći ugao kamere koji koristi istu stranu zgrade košta samo 5.626 RSD — 80% jeftinije.",
    highlight:
      "Najpogodnije za investitore koji rade pre-prodaju, arhitekte koji predstavljaju projekat klijentu i kuće u izgradnji koje treba reklamirati.",
    materials:
      "Pošaljite nam arhitektonske crteže (osnove, preseke, fasade) i specifikaciju materijala. Što precizniji ulaz, brže nacrti — standardno 3–5 radnih dana.",
    asset: "/artwork/expert-spoljasnji-renderi.webp",
    detailAsset: "/artwork/detail-spoljasnji-renderi.webp",
    philosophy:
      "Najveći trošak je izrada 3D modela zgrade — gradimo ga jednom, a svaki sledeći ugao iz iste strane modela je 5.626 RSD (80% jeftiniji). Doplata postoji samo ako kadar zahteva geometriju neviđene strane objekta. Tako pakovanje od 4-5 rendera ulazi u realan investicioni budžet, a ne traži novu porudžbinu po svakom kadru.",
    priceContext:
      "Pun 3D model objekta + prvi render. Sledeći ugao iste strane: 5.626 RSD (80% jeftiniji).",
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
        q: "Da li je 29.300 RSD cena za jednu sliku?",
        a: "29.300 RSD pokriva izgradnju kompletnog 3D modela Vaše zgrade i prvi finalni render. Pošto je model već napravljen, svaki sledeći ugao iste strane objekta košta samo 5.626 RSD — 80% jeftiniji. Na primer, četiri ugla istog objekta su 46.177 RSD ukupno (29.300 RSD + 3 × 5.626 RSD).",
      },
      {
        q: "Šta treba da dostavim da biste počeli?",
        a: "Arhitektonske nacrte (osnove, preseci, fasade) u PDF ili DWG formatu. Opciono ali korisno: referentne fotografije stila, specifikacija materijala fasade i fotografija lokacije za kontekst okoline.",
      },
      {
        q: "Da li radite i porodične kuće, ili samo velike projekte?",
        a: "Radimo projekte svih veličina — od porodičnih kuća do stambenih kompleksa i poslovnih objekata. Cena modela i prvog ugla je ista: 29.300 RSD.",
      },
    ],
    variants: [
      {
        id: "exterior-static",
        title: "Klasični prikaz fasade",
        basePrice: 250,
        priceLabel: "29.300 RSD",
        unitLabel: "3D model + prvi render",
        description:
          "Ulazna tačka za prospekt: pun 3D model zgrade i prvi finalni render. Svaki sledeći ugao 80% jeftiniji.",
        included:
          "Izgradnja punog 3D modela objekta, postavljanje scene, osvetljenja, materijala i 1 finalni render (ugao kamere). Sledeći ugao iste strane: samo 5.626 RSD.",
        addOns: [
          "Dodatni ugao kamere iste strane objekta: 5.626 RSD (80% popust)",
          "Doplata za neviđenu stranu objekta: +25% jednom po modelu",
        ],
        note: "Doplata za neviđenu stranu naplaćuje se jednom; nakon nje svi naredni uglovi ulaze u standardnu dodatnu cenu.",
      },
      {
        id: "exterior-360",
        title: "Interaktivna 360 panorama",
        basePrice: 335,
        priceLabel: "39.262 RSD",
        unitLabel: "3D model + prva 360 panorama",
        description:
          "Klijent se okreće oko zgrade mišem ili VR uređajem. Idealno za remote prezentacije i online prospekt.",
        included:
          "Pun 3D model objekta + prva interaktivna 360 panorama spremna za VR uređaje (Meta Quest itd.).",
        addOns: [
          "Dodatna interaktivna tačka, ista strana modela: 5.626 RSD",
          "Dodatna tačka koja zahteva neviđenu stranu: 7.032 RSD",
          "Za 5+ dodatnih tačaka: 6.212 RSD po tački (popust na količinu)",
        ],
      },
      {
        id: "exterior-aerial",
        title: "3D prikaz ulice (streetscape)",
        basePrice: 420,
        priceLabel: "49.224 RSD",
        unitLabel: "objekat + okruženje, ulična ili vazdušna perspektiva",
        description:
          "Objekat sa susednim kućama modelovan u 3D — ulična perspektiva ili pogled iz vazduha. Za kontekst ulice, parcele i investitorske prezentacije.",
        included: "Pun 3D model objekta + okruženje + prvi prikaz (ulična ili vazdušna perspektiva).",
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
      "https://kuula.co/share/collection/7Tm7X?logo=1&info=0&fs=1&vr=1&sd=1&autorotate=0.04&autop=30&thumbs=1",
    philosophy:
      "Najveći trošak je izgradnja 3D modela. Cena 39.262 RSD pokriva pun model i prvu interaktivnu 360 panoramu. Svaka sledeća tačka iz iste strane modela: 5.626 RSD (80% jeftinije). Tačka koja zahteva neviđenu stranu: 7.032 RSD jednokratno. Za 5+ tačaka popust pada na 6.212 RSD po tački — kompletan obilazak objekta ulazi u realan investitorski budžet.",
    priceContext:
      "39.262 RSD — pun 3D model + prva 360 panorama spremna za VR. Sledeća tačka iste strane: 5.626 RSD.",
    forSegments: [
      "Investitori (off-plan pre-prodaja)",
      "Agencije nekretnina (remote demo)",
      "Arhitekte (klijentske prezentacije)",
    ],
    problemHeading: "Nacrti ne otvaraju vrata. Šetnja kroz objekat — otvara.",
    problemAsset: "/artwork/expert-360-eksterijer-problem.webp",
    problemPanoramaSrc: "/artwork/360-eksterijer-panorama-vr.jpg",
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
        body: "Pun 3D model i interaktivna panorama za 39.262 RSD. Fizička maketa istog objekta košta višestruko više i ne može da se menja kad arhitekta promeni materijal.",
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
        q: "Šta tačno uključuje cena od 39.262 RSD?",
        a: "Pun 3D model objekta i prva interaktivna 360 panorama spremna za VR. Svaka dodatna tačka gledanja iz iste strane modela: 5.626 RSD. Tačka koja zahteva neviđenu stranu: 7.032 RSD (jednokratno). Za 5+ dodatnih tačaka: 6.212 RSD po tački.",
      },
      {
        q: "Razlika u odnosu na klasični render?",
        a: "Klasični spoljašnji render (29.300 RSD) je jedna slika iz jednog ugla. 360 panorama (39.262 RSD) je interaktivan prikaz kroz koji klijent sam prolazi — 360° pogled iz tačke, sa mogućnošću dodavanja više tačaka po objektu.",
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
        priceLabel: "39.262 RSD",
        unitLabel: "3D model + prva 360 panorama",
        description:
          "Klijent se okreće oko zgrade mišem ili VR uređajem. Idealno za remote prezentacije i online prospekt.",
        included:
          "Pun 3D model objekta + prva interaktivna 360 panorama spremna za VR uređaje (Meta Quest itd.).",
        addOns: [
          "Dodatna interaktivna tačka, ista strana modela: 5.626 RSD",
          "Dodatna tačka koja zahteva neviđenu stranu: 7.032 RSD",
          "Za 5+ dodatnih tačaka: 6.212 RSD po tački (popust na količinu)",
        ],
      },
    ],
  },
  {
    slug: "3d-prikaz-ulice",
    code: "exterior-aerial-dedicated",
    name: "3D prikaz ulice (streetscape)",
    shortName: "3D prikaz ulice",
    category: "eksterijer",
    icon: "camera",
    tagline: "Vaš objekat na ulici, iz svakog ugla koji Vam treba.",
    description:
      "3D prikaz ulice (streetscape) (49.224 RSD) modeluje celo okruženje — susedne kuće, ulicu i parcelu — i prikazuje Vaš objekat primarno iz ulične perspektive, a po potrebi i iz vazduha. Pravi izbor kada lokacija još ne postoji, teško je dostupna ili trebate slobodan izbor ugla. Za lokacije koje postoje i mogu se fotografisati postoji jeftiniji metod — render u stvarnoj fotografiji od 35.160 RSD.",
    highlight:
      "Prava prezentacija lokacije i konteksta — za urbanističku dozvolu, board prezentacije i investitorske ponude.",
    materials:
      "Pošaljite arhitektonske nacrte (PDF/DWG), situacioni plan sa katastarskom podlogom, opciono fotografije lokacije. Prvi nacrt 3–5 radnih dana.",
    asset: "/artwork/listing-streetscape.webp",
    listingAsset: "/artwork/listing-streetscape.webp",
    detailAsset: "/artwork/detail-streetscape.webp",
    detailBeforeAsset: "/artwork/problem-streetscape-ulica-before.webp",
    detailAfterAsset: "/artwork/problem-streetscape-ulica-after.webp",
    detailBeforeAlt:
      "2D situacioni plan niza objekata uz ulicu — raspored kuća, parkinga, zelenila i sadržaja",
    detailAfterAlt:
      "3D prikaz ulice — niz modernih objekata sa drvoredom, parkingom i uličnim kontekstom",
    philosophy:
      "Cena od 49.224 RSD pokriva izgradnju punog 3D modela objekta i modelovanog okruženja, sa dva ugla uključena. Pošto je model već izgrađen, svaki sledeći ugao košta 5.626 RSD — 80% jeftinije. Neviđena ili zadnja strana objekta dodaje se jednom (+25%, 12.306 RSD). Nema naknadnih iznenađenja — sve je javno u cenovniku.",
    priceContext:
      "49.224 RSD — pun 3D model objekta + okruženja + prvi prikaz. Sledeći ugao: 5.626 RSD.",
    forSegments: [
      "Developeri (masterplani)",
      "Investitori (parcele i kompleksi)",
      "Arhitekte (regulatorne prezentacije)",
    ],
    problemHeading: "Lokacija ne postoji. Kupac ne može da čeka da se sagradi.",
    problemBody:
      "Investitor prodaje stanove u izgradnji. Lokacija je prazan plac ili tek započeta gradnja. Fotografija okruženja ne postoji, dron nema šta da snimi, a kupac traži vizuelni dokaz da će zgrada zaista biti na toj ulici, između tih suseda, na toj parceli. Bez toga — kupac odlazi kod nekog ko ima sliku.",
    problemResolution:
      "3D prikaz ulice gradi celo okruženje iz nacrta i katastarskih podataka. Susedne kuće, ulica, zelenilo i objekat — sve na istoj slici. Kupac vidi buduću ulicu pre nego što je asfaltirana.",
    benefits: [
      {
        icon: "context",
        title: "Slobodan izbor ugla",
        body: "Okruženje je u 3D — možete tražiti uličnu perspektivu, pogled iz dvorišta, vazdušni ugao ili svaki drugi. Nema ograničenja fotografije.",
      },
      {
        icon: "speed",
        title: "Bez čekanja na pristup lokaciji",
        body: "Gradimo iz nacrta i katastarskih podataka. Nema potrebe za fotografisanjem, dronom ili obilaskom lokacije — radi se odmah čim dostavite crteže.",
      },
      {
        icon: "value",
        title: "Kompletna prezentacija u jednoj porudžbini",
        body: "Ulična perspektiva za prospekt, vazdušni ugao za board prezentaciju, zadnja strana za regulatorni materijal — sve iz istog modela. Svaki sledeći ugao 5.626 RSD.",
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
        src: "/artwork/portfolio-streetscape-01.webp",
        alt: "3D prikaz ulice — niz savremenih kuća u nizu, ulična perspektiva sa susedima — Elegant Render",
      },
      {
        src: "/artwork/portfolio-streetscape-02.webp",
        alt: "3D prikaz ulice — ugaona stambena zgrada sa lokalom u prizemlju u urbanom okruženju — Elegant Render",
      },
      {
        src: "/artwork/portfolio-streetscape-03.webp",
        alt: "3D prikaz ulice — poslovni objekat sa lokalima na bulevaru, ulična perspektiva — Elegant Render",
      },
      {
        src: "/artwork/portfolio-streetscape-04.webp",
        alt: "3D prikaz ulice — klasična vila u nizu susednih objekata — Elegant Render",
      },
    ],
    faqs: [
      {
        q: "Šta tačno dobijam za 49.224 RSD?",
        a: "Pun 3D model Vašeg objekta i modelovanog okruženja (susedne kuće, ulica, parcela), primarno iz ulične perspektive — sa 2 ugla uključena. Svaki sledeći ugao: 5.626 RSD. Neviđena/zadnja strana objekta: +25% (12.306 RSD), jednokratno. Tri runde revizije su uključene.",
      },
      {
        q: "Da li je okruženje tačno ili aproksimacija?",
        a: "Okruženje je modelovana aproksimacija — susedne kuće se grade na osnovu katastarskih podataka i referentnih fotografija, ali nisu piksel-tačna kopija stvarnog stanja. Ako Vam je potrebno piksel-realno okruženje (npr. za urbanističku komisiju koja traži stvarni kontekst), razmotrite render u stvarnoj fotografiji lokacije (35.160 RSD).",
      },
      {
        q: "Razlika u odnosu na render u stvarnoj fotografiji (35.160 RSD)?",
        a: "Render u fotografiji lokacije koristi stvarnu fotografiju kao pozadinu — okruženje je piksel-realno, ali ste vezani za ugao snimljene fotografije. 3D prikaz ulice modeluje celo okruženje u 3D — možete birati bilo koji ugao, ali okruženje je aproksimacija. Ako lokacija postoji i može se fotografisati, render u fotografiji je jeftiniji i verodostojniji. Ako lokacija ne postoji ili trebate više uglova, 3D prikaz ulice je jedina opcija.",
      },
      {
        q: "Šta dostavljam da biste počeli?",
        a: "Arhitektonske nacrte (osnove, preseke, fasade) u PDF ili DWG formatu i situacioni plan sa katastarskom podlogom. Po želji: specifikacija materijala fasade i fotografije lokacije ili okruženja za referencu.",
      },
      {
        q: "Da li usluga uključuje aerial (ptičju perspektivu) ili samo uličnu?",
        a: "Primarni format je ulična perspektiva (eye-level) — objekat na ulici, kao što ga vidi prolaznik. Aerial pogled (iz vazduha) je dostupan kao dodatni ugao iz istog modela za 5.626 RSD. Oba izlaze iz istog modelovanog okruženja.",
      },
      {
        q: "Koliko traje izrada?",
        a: "Prve nacrte šaljemo za 3–5 radnih dana od potvrde ponude i prijema nacrta. Tri runde revizije su uključene — bez doplate.",
      },
    ],
    pricingLead: {
      heading: "Dva metoda, isti cilj — jedan pravi izbor za Vašu lokaciju.",
      body: "3D prikaz ulice (49.224 RSD) je pravi izbor kada lokacija ne postoji ili zahtevate slobodan izbor ugla kamere — okruženje se modeluje u 3D. Render u stvarnoj fotografiji (35.160 RSD) je pravi izbor kada lokacija postoji i može se fotografisati — okruženje je piksel-realno jer dolazi iz stvarne fotografije. Odaberite prema tome šta imate u rukama.",
    },
    comparison: {
      aLabel: "3D prikaz ulice — 49.224 RSD",
      bLabel: "Render u fotografiji — 35.160 RSD",
      rows: [
        { label: "Ulazni materijal", a: "Arhitektonski nacrti", b: "Stvarna fotografija lokacije" },
        { label: "Okruženje", a: "Modelovano u 3D (aproksimacija)", b: "Piksel-realno (prava fotografija)" },
        { label: "Izbor ugla", a: "Bilo koji ugao (ulica ili iz vazduha)", b: "Vezan za ugao fotografije" },
        { label: "Kada izabrati", a: "Lokacija ne postoji ili treba više uglova", b: "Lokacija postoji i može se fotografisati" },
      ],
    },
    variants: [
      {
        id: "exterior-aerial",
        title: "3D prikaz ulice (streetscape)",
        basePrice: 420,
        priceLabel: "49.224 RSD",
        unitLabel: "pun 3D model objekta + okruženja, ulična perspektiva",
        description:
          "Celo okruženje se modeluje u 3D — susedne kuće, ulica, parcela. Primarni prikaz je ulična perspektiva; aerial i drugi uglovi dostupni kao doplate iz istog modela.",
        included:
          "Pun 3D model objekta i okruženja, 2 ugla uključena (primarno ulična perspektiva). Tri runde revizije uključene.",
        addOns: [
          "Dodatni ugao (ulični ili aerial): 5.626 RSD (80% jeftinije)",
          "Neviđena/zadnja strana objekta: +25% (12.306 RSD jednokratno)",
        ],
        note: "Doplata za zadnju stranu naplaćuje se jednom po modelu — nakon toga svi uglovi ulaze u standardnu dopunu.",
      },
    ],
    crossSellVariants: [
      {
        id: "photomontage-main",
        title: "Render u stvarnoj fotografiji lokacije",
        basePrice: 300,
        priceLabel: "35.160 RSD",
        unitLabel: "3D model + uklapanje u fotografiju lokacije",
        description:
          "Kada lokacija postoji i može se fotografisati — 3D model se uklapa u stvarnu fotografiju. Piksel-realno okruženje, niža cena.",
        included:
          "Kompletan 3D model objekta, uklapanje u jednu fotografiju lokacije, usklađeno svetlo i senke. Jedan finalni render.",
        addOns: [
          "Dodatni ugao iz iste fotografije: 6.446 RSD (82% jeftinije)",
          "Druga fotografija iste lokacije: 9.962 RSD",
          "Neviđena strana objekta: +25% jednokratno",
        ],
        note: "Render eksterijera 29.300 RSD + Fotomontaža +5.860 RSD. Pravi izbor kada lokacija postoji i može se fotografisati — maksimalna verodostojnost za komisije i javne rasprave.",
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
    asset: "/artwork/expert-virtuelno-opremanje-naslovna-after.webp",
    beforeAsset: "/artwork/expert-virtuelno-opremanje-naslovna-before.webp",
    afterAsset: "/artwork/expert-virtuelno-opremanje-naslovna-after.webp",
    detailAsset: "/artwork/detail-virtuelno-opremanje.webp",
    detailBeforeAsset: "/artwork/problem-virtuelno-opremanje-dnevni-boravak-before.webp",
    detailAfterAsset: "/artwork/problem-virtuelno-opremanje-dnevni-boravak-after.webp",
    detailBeforeAlt:
      "Prazan dnevni boravak pre virtuelnog opremanja — gola soba sa parketom i velikim prozorima",
    detailAfterAlt:
      "Isti dnevni boravak posle virtuelnog opremanja — sofa, fotelja, stočić, tepih i umetnička slika",
    philosophy:
      "Prva slika pokriva izbor nameštaja, stila i osvetljenja. Kad je stil definisan, svaki dodatni ugao iste sobe je 33% jeftiniji, druga soba 17% jeftinija, a od 10+ slika cena pada na 1.524 RSD/sliku. Tako celokupna nekretnina dobija kompletan oglasni paket za delić cene fizičkog opremanja.",
    priceContext:
      "2.110 RSD prva slika · 1.758 RSD druga soba · od 1.524 RSD/sliku za pakovanje 10+ slika.",
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
        body: "Pravi nameštaj za prezentaciju stana košta hiljade evra i traje danima. Virtuelno 2.110 RSD po slici, 1.524 RSD za pakovanje 10+ slika.",
      },
      {
        icon: "trust",
        title: "Stil koji odgovara kupcu",
        body: "Birate iz nekoliko pravaca — moderni minimalist, warm Scandinavian, klasičan. Promena stila iste sobe: 1.406 RSD.",
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
        q: "Šta tačno dobijam za 2.110 RSD?",
        a: "Fotorealistično opremanje jedne prazne prostorije na osnovu Vaše fotografije — uključen izbor nameštaja, postavljanje i usklađivanje osvetljenja. Dodatni ugao iste sobe: 1.406 RSD (33% popust). Druga soba iste nekretnine: 1.758 RSD (17% popust). Pakovanje 10+ slika: 1.524 RSD po slici (28% popust).",
      },
      {
        q: "Da li deluje stvarno?",
        a: "Naša verzija je fotorealistična — kupac obično ne primeti razliku između naše opremljene slike i fotografije stvarno opremljenog stana. Transparentno označavamo da je upotrebljen virtual staging, ali to ne smanjuje efikasnost oglasa.",
      },
      {
        q: "Mogu li da promenim stil ako mi se ne dopadne?",
        a: "Da. Promena stila opremanja iste sobe: 1.406 RSD. Pre toga su uključene tri runde revizije bez doplate — u njima menjamo nameštaj, materijale i osvetljenje dok rezultat ne bude tačan.",
      },
      {
        q: "Koliko traje izrada?",
        a: "Prve nacrte šaljemo za 3–5 radnih dana od potvrde ponude. Pakovanja 10+ slika idu fazno — prve slike za nedelju dana, ostatak po dogovoru sa Vama.",
      },
      {
        q: "Da li radite za agencije sa puno listinga?",
        a: "Da. Pakovanje 10+ slika je 1.524 RSD po slici (28% popust). Stalni agenti mogu da dogovore prioritet izrade i konzistentnu stilsku liniju kroz sve listinge.",
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
        priceLabel: "2.110 RSD",
        unitLabel: "prva opremljena slika",
        description:
          "Brz upgrade oglasa: prazna soba postaje atraktivna scena za 2.110 RSD. Svaka sledeća soba 17% jeftinija.",
        included:
          "Fotorealistično opremanje jedne prazne prostorije na osnovu Vaše fotografije. Uključuje izbor nameštaja, postavljanje i usklađivanje osvetljenja.",
        addOns: [
          "Dodatni ugao iste sobe: 1.406 RSD (33% popust)",
          "Druga soba iste nekretnine: 1.758 RSD (17% popust)",
          "Pakovanje 10+ slika: 1.524 RSD po slici (28% popust)",
          "Promena stila opremanja iste sobe: 1.406 RSD",
        ],
      },
      {
        id: "staging-360",
        title: "Interaktivno 360 opremanje",
        basePrice: 34,
        priceLabel: "3.985 RSD",
        unitLabel: "prva opremljena 360 panorama",
        description:
          "Kupac obilazi opremljenu sobu mišem — savršeno za online oglas ili remote prikaz potencijalnom kupcu.",
        included:
          "Kompletno opremanje prve prostorije u 360 panorami koja se pregledava na sajtu ili VR uređaju.",
        addOns: [
          "Dodatna interaktivna tačka iste sobe: 2.813 RSD (30% popust)",
          "Druga soba iste nekretnine: 3.282 RSD (18% popust)",
          "Pakovanje 6+ tačaka: 2.813 RSD po tački",
          "Promena stila opremanja iste sobe: 2.578 RSD",
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
    detailBeforeAsset: "/artwork/problem-virtuelna-renovacija-kuhinja-before.webp",
    detailAfterAsset: "/artwork/problem-virtuelna-renovacija-kuhinja-after.webp",
    detailBeforeAlt:
      "Zastarela kuhinja sa starim drvenim ormarićima i pločicama pre virtuelne renovacije",
    detailAfterAlt:
      "Ista kuhinja posle virtuelne renovacije — moderni svetli ormarići, mermerni zid, beli pult i nova tehnika",
    philosophy:
      "Prva slika pokriva kompletan dizajn renovacije i izbor materijala. Kad je vizuelni pravac postavljen, svaki dodatni ugao iste prostorije je 10% jeftiniji, a od 4. ugla 20% jeftiniji. Druga soba iste nekretnine: 15% popust. Tako kompletna nekretnina ulazi u realan budžet pre nego što krenu zidari.",
    priceContext:
      "7.735 RSD prvi prikaz · od 6.212 RSD dodatni ugao · 6.563 RSD druga soba (15% popust).",
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
        body: "7.735 RSD prvi prikaz. Dodatni ugao iste sobe 6.915 RSD (10% popust), od 4. ugla 6.212 RSD (20% popust). Druga soba 15% jeftinija. Kompletna nekretnina ulazi u realan budžet.",
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
        q: "Šta tačno dobijam za 7.735 RSD?",
        a: "Kompletna vizuelna transformacija jedne prostorije na osnovu Vaše fotografije — uključuje promenu podova, zidova, fiksiranih elemenata i nameštaja. Dodatni ugao iste sobe: 6.915 RSD (10% popust). 4. i svaki sledeći ugao: 6.212 RSD (20% popust). Druga soba: 6.563 RSD (15% popust).",
      },
      {
        q: "Razlika u odnosu na virtuelno opremanje (2.110 RSD)?",
        a: "Virtuelno opremanje (2.110 RSD) menja samo nameštaj — zidovi, podovi i fiksirani elementi ostaju isti. Virtuelna renovacija (7.735 RSD) menja sve — pločice, podove, ormare, kuhinju. Različite namene.",
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
        priceLabel: "7.735 RSD",
        unitLabel: "prvi prikaz renovirane sobe",
        description:
          "Prvi prikaz pokriva kompletan dizajn — izbor podova, zidova, fiksiranih elemenata i nameštaja. Dodatni uglovi 10–20% jeftiniji.",
        included:
          "Kompletna vizuelna transformacija jedne prostorije na osnovu Vaše fotografije. Uključuje promenu podova, zidova, fiksiranih elemenata i nameštaja.",
        addOns: [
          "Dodatni ugao iste sobe: 6.915 RSD (10% popust)",
          "4. i svaki sledeći ugao iste sobe: 6.212 RSD (20% popust)",
          "Druga soba iste nekretnine: 6.563 RSD (15% popust)",
          "6. i svaka sledeća soba iste nekretnine: 5.860 RSD (24% popust)",
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
      "2.344 RSD jedan nivo (2D čist plan) / 3.399 RSD jedan nivo (3D plan). Dodatni nivo: 1.172 RSD–15.",
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
        body: "2.344 RSD za 2D, 3.399 RSD za 3D — jedan dan rada, dobijate fajl za oglas, prospekt i prezentaciju.",
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
        q: "Šta tačno dobijam za 2.344 RSD / 3.399 RSD?",
        a: "2.344 RSD daje jedan nivo u čistom 2D vektorskom prikazu sa rasporedom prostorija, oznakama i dimenzijama. 3.399 RSD daje 3D verziju istog nivoa — prostorni prikaz koji kupac razume bez znanja arhitekture. Identičan sprat (dupliranje): 703 RSD (2D) / 1.172 RSD (3D).",
      },
      {
        q: "2D ili 3D — šta da biram?",
        a: "Za agencijski listing: 3D, jer kupac razume na prvi pogled. Za regulatornu proceduru ili tehničku dokumentaciju: 2D, jer prati tehnički standard. Za dupleks na oglasu: oba (svaki sprat ima drugačiju namenu).",
      },
      {
        q: "Da li se može dodati nameštaj?",
        a: "Da. Verzija sa nameštajem: 703 RSD (2D) ili 938 RSD (3D). Varijanta dizajna (isti raspored, drugi nameštaj): 703 RSD.",
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
        priceLabel: "2.344 RSD",
        unitLabel: "jedan sprat (2D plan)",
        description:
          "Brz ulaz za oglas — jasan tehnički tlocrt sa rasporedom i merama. Identičan sprat: 703 RSD.",
        included:
          "Jedan nivo u čistom 2D vektorskom prikazu. Uključuje raspored prostorija, oznake i dimenzije.",
        addOns: [
          "Dva nivoa (dupleks): 3.750 RSD",
          "Svaki dodatni nivo: 1.172 RSD",
          "Identičan sprat (dupliranje): 703 RSD (70% popust)",
          "Verzija sa nameštajem: 703 RSD",
          "Promena boje / stila plana: 469 RSD",
        ],
        note: "2D osnove isporučujemo kroz White Rook partnersku mrežu.",
      },
      {
        id: "floorplan-3d",
        title: "3D tlocrt (prostorni prikaz)",
        basePrice: 29,
        priceLabel: "3.399 RSD",
        unitLabel: "jedan sprat (3D plan)",
        description:
          "Kupac razume raspored na prvi pogled — bez čitanja simbola. Idealno za listing fotografiju.",
        included:
          "Jedan nivo u atraktivnom 3D prikazu sa rasporedom prostorija, oznakama i dimenzijama.",
        addOns: [
          "Dva nivoa (dupleks): 5.391 RSD",
          "Svaki dodatni nivo: 1.758 RSD",
          "Identičan sprat (dupliranje): 1.172 RSD (66% popust)",
          "Dodavanje nameštaja: 938 RSD",
          "Varijanta dizajna (isti raspored, drugi nameštaj): 703 RSD",
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
      "Pregledan vektorski 2D tlocrt sa rasporedom prostorija, oznakama na srpskom i dimenzijama u metrima. Standardni format za oglas nekretnine, regulatornu proceduru i klijentsku prezentaciju. 2.344 RSD pokriva jedan nivo; identičan sprat (dupliranje sa promenom oznaka) košta samo 703 RSD — 70% jeftinije.",
    highlight:
      "Najjeftiniji ulaz u profesionalan tlocrt za listing — bez 3D budžeta, sa formatom koji prati dokumentaciju i ugovor.",
    materials:
      "Pošaljite tehničke crteže (PDF/DWG), skice sa merama ili postojeću PDF osnovu. Prvi nacrt 1–3 radna dana.",
    asset: "/artwork/listing-floorplan-2d.webp",
    listingAsset: "/artwork/listing-floorplan-2d.webp",
    detailAsset: "/artwork/listing-floorplan-2d.webp",
    philosophy:
      "2D plan je format koji prati dokumentaciju, oglas i ugovor. Cena pokriva jedan nivo u čistom vektorskom prikazu sa oznakama i dimenzijama. Identičan sprat (dupliranje sa promenom oznaka) košta samo 703 RSD — 70% jeftinije. Tako zgrada sa više tipova stanova dobija celokupnu listing seriju za delić cene CAD studija. Isporuka kroz White Rook partnersku mrežu obezbeđuje konzistentan kvalitet i kratak rok.",
    priceContext:
      "2.344 RSD — jedan nivo (čist 2D vektorski plan). Identičan sprat (dupliranje): 703 RSD.",
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
        body: "2.344 RSD, prvi nacrt za 1–3 radna dana. Najniža ulazna cena za profesionalan tlocrt koji se direktno koristi u oglasu.",
      },
      {
        icon: "value",
        title: "Trećina cene po dodatnom spratu",
        body: "Identičan sprat (dupliranje sa promenom oznaka): samo 703 RSD — 70% popust. Zgrada sa 5 tipova stanova dobija celu seriju za 5.157 RSD.",
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
        q: "Šta tačno dobijam za 2.344 RSD?",
        a: "Jedan nivo u čistom 2D vektorskom prikazu sa rasporedom prostorija, oznakama na srpskom i dimenzijama u metrima. Identičan sprat (dupliranje sa promenom oznaka): 703 RSD (70% popust). Verzija sa nameštajem: +703 RSD. Promena boje/stila: +469 RSD.",
      },
      {
        q: "Razlika u odnosu na CAD eksport iz mog projekta?",
        a: "CAD eksport prati tehnički standard projekta — debele linije, oznake u milimetrima, scale bars. Naš 2D plan je marketinški format: kolorisan, sa nameštajem ili bez, dimenzije čitljive laiku. Različita namena, ne alternative.",
      },
      {
        q: "Kada birati 2D umesto 3D?",
        a: "Za regulatornu proceduru, ugovor, tehničku dokumentaciju ili kad oglas prati tehnički standard branše. Za agencijski oglas i laičku prezentaciju 3D verzija (3.399 RSD) daje bolji efekat — kupac brže razume raspored.",
      },
      {
        q: "Da li radite više spratova zgrade?",
        a: "Da. Dva nivoa (dupleks): 3.750 RSD. Svaki dodatni nivo: 1.172 RSD. Identičan sprat (dupliranje sa promenom oznaka): samo 703 RSD — 70% popust.",
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
        priceLabel: "2.344 RSD",
        unitLabel: "jedan sprat (2D plan)",
        description:
          "Brz ulaz za oglas — jasan tehnički tlocrt sa rasporedom i merama. Identičan sprat: 703 RSD.",
        included:
          "Jedan nivo u čistom 2D vektorskom prikazu. Uključuje raspored prostorija, oznake i dimenzije.",
        addOns: [
          "Dva nivoa (dupleks): 3.750 RSD",
          "Svaki dodatni nivo: 1.172 RSD",
          "Identičan sprat (dupliranje): 703 RSD (70% popust)",
          "Verzija sa nameštajem: 703 RSD",
          "Promena boje / stila plana: 469 RSD",
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
      "Atraktivan 3D prostorni prikaz tlocrta sa nameštajem, oznakama i bojama. Najjači format za agencijski oglas — kupac vidi raspored i namene bez čitanja tehničkih simbola. 3.399 RSD pokriva jedan nivo; identičan sprat (dupliranje sa promenom oznaka) košta samo 1.172 RSD — 66% jeftinije.",
    highlight:
      "Pravi izbor za listing fotografiju i prospekt — kupac na prvi pogled razume šta dobija.",
    materials:
      "Pošaljite tehničke crteže (PDF/DWG), skice sa merama ili postojeću PDF osnovu. Prvi nacrt 1–3 radna dana.",
    asset: "/artwork/listing-3d-osnove.webp",
    listingAsset: "/artwork/listing-3d-osnove.webp",
    detailAsset: "/artwork/detail-3d-osnove.webp",
    detailBeforeAsset: "/artwork/problem-3d-osnove-before.webp",
    detailAfterAsset: "/artwork/problem-3d-osnove-after.webp",
    detailBeforeAlt:
      "2D tehnički tlocrt stana pre 3D obrade — linije, oznake i raspored prostorija",
    detailAfterAlt:
      "3D prostorni tlocrt istog stana posle obrade — nameštaj, materijali i boje iz ptičje perspektive",
    philosophy:
      "3D prostorni prikaz je marketinški format — kupac vidi raspored sa nameštajem i bojom, bez čitanja oznaka. Cena 3.399 RSD pokriva jedan nivo. Identičan sprat (dupliranje sa promenom oznaka) košta samo 1.172 RSD — 66% jeftinije. Tako dupleks i zgrada sa više tipova stanova ulaze u realan listing budžet — bez ponovnog modelovanja po nivou.",
    priceContext:
      "3.399 RSD — jedan nivo (3D prostorni prikaz). Identičan sprat (dupliranje): 1.172 RSD.",
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
        body: "3.399 RSD, prvi nacrt 1–3 radna dana. Direktno upotrebljivo u oglasima, prospektima i prezentacijama.",
      },
      {
        icon: "value",
        title: "Više tipova stanova jeftinije",
        body: "Identičan sprat (dupliranje): samo 1.172 RSD — 66% popust. Zgrada sa 4 tipa stana dobija kompletnu listing seriju za 6.915 RSD.",
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
        src: "/artwork/portfolio-3d-osnove-jednosoban-stan.webp",
        alt: "3D osnova jednosobnog stana — dnevni boravak, trpezarija, kuhinja, spavaća soba i kupatilo iz ptičje perspektive",
      },
      {
        src: "/artwork/portfolio-3d-osnove-jednosoban-otvoreni-koncept.webp",
        alt: "3D osnova jednosobnog stana otvorenog koncepta — povezan dnevni boravak, kuhinja i trpezarija sa spavaćom sobom i kupatilom",
      },
      {
        src: "/artwork/portfolio-3d-osnove-dupleks-dva-nivoa.webp",
        alt: "3D osnova dupleksa na dva nivoa — prizemlje sa dnevnim boravkom i kuhinjom i gornji nivo sa spavaćom sobom",
      },
      {
        src: "/artwork/portfolio-3d-osnove-kuca-sa-garazom.webp",
        alt: "3D osnova porodične kuće sa garažom — tri spavaće sobe, dnevni boravak, trpezarija, kuhinja i garaža za dva automobila",
      },
    ],
    faqs: [
      {
        q: "Šta tačno dobijam za 3.399 RSD?",
        a: "Jedan nivo u atraktivnom 3D prostornom prikazu sa rasporedom prostorija, oznakama, nameštajem i materijalima. Identičan sprat (dupliranje sa promenom oznaka): 1.172 RSD (66% popust). Dodavanje nameštaja: +938 RSD. Varijanta dizajna (isti raspored, drugi nameštaj): +703 RSD.",
      },
      {
        q: "Razlika u odnosu na render enterijera?",
        a: "Render enterijera (19.924 RSD za sprat) prikazuje sobu iz nivoa očiju — kao da stojite unutra. 3D osnova je ptičja perspektiva celog sprata sa skinutim krovom — vidite raspored, ne sobu. Različita namena, često se naručuju zajedno za prospekt.",
      },
      {
        q: "Kada birati 3D umesto 2D?",
        a: "Za agencijski oglas, prospekt i klijentske prezentacije gde kupac nije arhitekta — 3D pobeđuje. Za regulatornu proceduru, ugovor ili tehnički prilog 2D verzija (2.344 RSD) prati standard branše.",
      },
      {
        q: "Da li mogu da naručim sa nameštajem ili bez?",
        a: "Oba. Bez nameštaja je standardna opcija. Sa nameštajem: +938 RSD. Varijanta dizajna (isti raspored, drugi nameštaj — korisno za A/B testove kupaca): +703 RSD.",
      },
      {
        q: "Da li radite više spratova zgrade?",
        a: "Da. Dva nivoa (dupleks): 5.391 RSD. Svaki dodatni nivo: 1.758 RSD. Identičan sprat (dupliranje sa promenom oznaka): samo 1.172 RSD — 66% popust.",
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
        priceLabel: "3.399 RSD",
        unitLabel: "jedan sprat (3D plan)",
        description:
          "Kupac razume raspored na prvi pogled — bez čitanja simbola. Idealno za listing fotografiju.",
        included:
          "Jedan nivo u atraktivnom 3D prikazu sa rasporedom prostorija, oznakama i dimenzijama.",
        addOns: [
          "Dva nivoa (dupleks): 5.391 RSD",
          "Svaki dodatni nivo: 1.758 RSD",
          "Identičan sprat (dupliranje): 1.172 RSD (66% popust)",
          "Dodavanje nameštaja: 938 RSD",
          "Varijanta dizajna (isti raspored, drugi nameštaj): 703 RSD",
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
      "Sami 360 paketi (Eksterijer 39.262 RSD, Enterijer 34.574 RSD) već uključuju jednu ili više interaktivnih tačaka i embed kod. VR tura postaje korisna kada povezujete više panorama iz različitih projekata ili dodajete navigaciju po tlocrtu — tada je sklapanje i hosting zaseban posao.",
    priceContext:
      "2.344 RSD — sklapanje + hosting + embed kod. Navigacija po tlocrtu: 1.758 RSD. Branding ture: 4.102 RSD.",
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
        body: "2.344 RSD osnovno sklapanje. Navigacija po tlocrtu: 1.758 RSD. Branding ture sa Vašim logoom: 4.102 RSD.",
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
        a: "Ne. VR tura je dodatak na već izrađene panorame. Ako prvo treba da izradimo panorame, naručite 360 eksterijer (39.262 RSD) ili 360 turu enterijera (34.574 RSD) — ti paketi već uključuju jednu interaktivnu tačku i embed kod za pojedinačnu panoramu.",
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
        priceLabel: "2.344 RSD",
        unitLabel: "sklapanje i hosting interaktivne ture",
        description:
          "Kada već postoji set 360 panorama, ovaj korak ih spaja u jedinstvenu interaktivnu turu na sajtu.",
        included:
          "Sklapanje virtuelne 360 ture iz postojećih panorama, hosting i deljenje preko linka ili embed-a na sajtu.",
        addOns: [
          "Interaktivna navigacija po tlocrtu: 1.758 RSD",
          "Tura sa Vašim brendom (logo, boje): 4.102 RSD",
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
      "Arhitektonska animacija pretvara Vaš 3D model u 30-sekundni film u kojem kamera leti kroz objekat, otkrivajući prostor scenom po scenom. Marketinški alat za prospekt, investitorske prezentacije i kampanje na društvenim mrežama. Minimum 15 sekundi (26.370 RSD).",
    highlight:
      "Za investitore koji žele dramatičnu prezentaciju kompleksa i agencije koje žele da listing bude više od galerije slika.",
    materials:
      "Pošaljite osnove, fasade i, ako postoji, već izrađen 3D model. Definišite željenu putanju kamere i ključne momente.",
    asset: PORTFOLIO_ASSET,
    detailVideoSrc: "/artwork/arhitektonska-animacija-demo.mp4",
    detailVideoPoster: "/artwork/arhitektonska-animacija-demo-poster.webp",
    philosophy:
      "Najveći trošak je izgradnja 3D modela. Animacija od nule: 1.758 RSD/sek. Iz postojećeg modela: 1.172 RSD/sek (33% jeftinije). Aktivan projekat (model još uvek u radu): 938 RSD/sek (47% jeftinije). Duže animacije dobijaju automatski popust: preko 60 sek −20%, preko 2 minuta −25%.",
    priceContext:
      "1.758 RSD/sek od nule · 1.172 RSD/sek iz postojećeg modela · minimum 15 sek (26.370 RSD).",
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
        body: "Ako smo Vam već izradili spoljašnji ili unutrašnji render, model je tu — animacija je 1.172 RSD/sek umesto 1.758 RSD/sek (33% popust). Aktivan projekat: 938 RSD/sek (47% popust).",
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
        q: "Šta tačno dobijam za 26.370 RSD?",
        a: "15 sekundi animacije iz novog 3D modela. Cena po sekundi: 1.758 RSD. Ako već imamo Vaš model: 1.172 RSD/sek (17.580 RSD za 15 sek). Aktivan projekat (model u izradi): 938 RSD/sek (14.064 RSD za 15 sek).",
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
        priceLabel: "1.758 RSD/sek",
        unitLabel: "po sekundi (minimum 15 sek = 26.370 RSD)",
        description:
          "Marketinški film u kome kamera leti kroz objekat. Minimum 15 sekundi. Ako već imamo Vaš model: 33% popust.",
        included:
          "Kompletna izgradnja 3D modela + dizajn putanje kamere + renderovanje animacije (minimum 15 sek).",
        addOns: [
          "Ako već imamo Vaš 3D model: 1.172 RSD/sek (33% popust)",
          "Aktivan projekat renderovanja: 938 RSD/sek (47% popust)",
          "Dodatna putanja kamere kroz isti model: 586 RSD/sek",
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
    tagline:
      "3D pejzaž iz plana ili nova slika Vašeg dvorišta — bez čekanja da biljke porastu.",
    description:
      "Dve opcije — jedan rezultat: vidite uređen spoljni prostor pre nego što počnu radovi ili pre nego što potrošite na sadnju. Pejzažni render (3D) iz plana kreće od 25.784 RSD. Virtuelna renovacija iz fotografije postojećeg dvorišta kreće od 7.735 RSD.",
    highlight:
      "Prikladno za pejzažne arhitekte koji predstavljaju projekat klijentu i investitore za zajedničke prostore u kompleksima.",
    materials:
      "Pošaljite nam situacioni plan, visinske kote i specifikaciju biljaka i materijala.",
    asset: "/artwork/expert-prikazi-dvorista-after.webp",
    beforeAsset: "/artwork/expert-prikazi-dvorista-before.webp",
    afterAsset: "/artwork/expert-prikazi-dvorista-after.webp",
    detailAsset: "/artwork/detail-prikazi-dvorista.webp",
    detailBeforeAsset: "/artwork/problem-uredjenje-pejzaza-before.webp",
    detailAfterAsset: "/artwork/problem-uredjenje-pejzaza-after.webp",
    detailBeforeAlt:
      "Moderna porodična kuća sa neuređenom, golom parcelom pre uređenja pejzaža",
    detailAfterAlt:
      "Moderna porodična kuća sa uređenim dvorištem — negovan travnjak, sadnice i popločana staza posle uređenja pejzaža",
    philosophy:
      "Cena pejzažnog rendera (25.784 RSD) pokriva modelovanje terena, vegetaciju u zrelom stanju i prvi prikaz. Svaki sledeći ugao iste lokacije je 5.274 RSD — 80% jeftiniji, jer je teren već izgrađen. Virtuelna renovacija (7.735 RSD) radi drugačije: nema 3D modela — postavljamo nove materijale i biljke direktno na Vašu fotografiju. Brže, povoljnije, ali vezano za ugao koji ste snimili. Doplate za renovaciju: drugi ugao 6.915 RSD, 4. i svaki sledeći 6.212 RSD, drugo dvorište 6.563 RSD. Sve cene su u RSD sa PDV-om uračunatim.",
    priceContext:
      "25.784 RSD — kompletan teren + vegetacija + prvi prikaz. Sledeći ugao: 5.274 RSD (80% jeftiniji).",
    forSegments: [
      "Pejzažne arhitekte (klijentske prezentacije)",
      "Investitori (zajednički prostori u kompleksima)",
      "Vlasnici parcela pred uređenje",
    ],
    problemHeading: "Gola parcela ne pokazuje vrednost. Uređen pejzaž — pokazuje.",
    problemBody:
      "Klijent gleda crtež pejzaža sa simbolima i ne vidi kako će dvorište zaista izgledati. Bez vizuelnog pejzaža, prodavac ne može da odbrani cenu uređenja, investitor ne dobija odobrenje, kupac parcele ne vidi potencijal.",
    problemResolution:
      "Pejzažni render (25.784 RSD) gradi kompletan 3D model terena i vegetacije iz plana — svaki sledeći ugao iste lokacije je 5.274 RSD. Virtuelna renovacija (7.735 RSD) preuređuje Vaše postojeće dvorište direktno na fotografiji — bez 3D modela, brže i povoljnije.",
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
        body: "25.784 RSD pokriva kompletan teren i prvi prikaz. Svaki sledeći ugao iste lokacije: 5.274 RSD (80% jeftiniji).",
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
        q: "Zašto je virtuelna renovacija jeftinija od 3D rendera?",
        a: "Pejzažni render (25.784 RSD) gradi kompletan 3D model terena i vegetacije iz osnove — to je dugotrajan proces koji omogućava slobodan izbor ugla kamere i prikaz iz vazduha. Virtuelna renovacija (7.735 RSD) ne gradi 3D model — nove materijale i biljke postavljamo direktno na Vašu fotografiju. Brži je i povoljniji postupak, ali je vezan za ugao i perspektivu snimljene fotografije. Ako prostora još nema ili trebate više uglova, 3D render je jedina opcija.",
      },
      {
        q: "Šta tačno dobijam za 25.784 RSD?",
        a: "Kompletno modelovanje terena, postavljanje vegetacije i staza i prvi finalni render. Svaki sledeći ugao iste lokacije: 5.274 RSD (80% popust). Doplata za neviđenu stranu terena: +25% jednom po modelu. Pogled iz vazduha na celu lokaciju: 44.536 RSD.",
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
        a: "Da. Zajednički prostori u stambenim kompleksima su jednako uobičajen scenario. Razlika je samo u veličini terena — cena ostaje 25.784 RSD za prvi prikaz, dodatni uglovi 5.274 RSD.",
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
    pricingLead: {
      heading: "Kako odabrati pravu opciju?",
      body: "Prostora još nema — gradite iz plana, trebaju Vam različiti uglovi ili pogled iz vazduha? Izaberite Pejzažni render (3D). Dvorište već postoji — želite da vidite kako će izgledati posle uređenja, brzo i bez 3D modela? Izaberite Virtuelnu renovaciju.",
    },
    variants: [
      {
        id: "landscape-main",
        title: "Pejzažni render (3D)",
        basePrice: 220,
        priceLabel: "25.784 RSD",
        unitLabel: "teren + vegetacija + prvi prikaz",
        description:
          "Kompletan 3D model terena i vegetacije iz plana. Pravi izbor kada prostor još ne postoji — gradnja, projektovanje ili prezentacija investitoru. Svaki sledeći ugao iste lokacije 80% jeftiniji.",
        included:
          "Kompletno modelovanje terena, postavljanje vegetacije u zrelom stanju, staza i materijala, i 1 finalni render. Tri runde revizije uključene.",
        addOns: [
          "Sledeći ugao iste lokacije: 5.274 RSD (80% jeftiniji)",
          "Doplata za neviđenu stranu terena: +25% jednom po modelu",
          "Pogled iz vazduha na celu lokaciju: 44.536 RSD",
        ],
        note: "Počinjete od situacionog plana, visinskih kota i specifikacije biljaka. Prve nacrte šaljemo za 3–5 radnih dana od potvrde ponude.",
      },
    ],
    crossSellVariants: [
      {
        id: "landscape-reno",
        title: "Virtuelna renovacija iz fotografije",
        basePrice: 66,
        priceLabel: "7.735 RSD",
        unitLabel: "prvi prikaz renoviranog dvorišta",
        description:
          "Pošaljite fotografiju postojećeg dvorišta — mi preuređujemo prostor direktno na slici, bez 3D modela. Brže i povoljnije od pejzažnog rendera. Pravi izbor kada imate fotografiju i samo želite videti kako bi izgledalo uređeno.",
        included:
          "Kompletna vizuelna transformacija dvorišta na osnovu Vaše fotografije — novi pod, vegetacija, staze, fiksirani elementi i nameštaj terasa.",
        addOns: [
          "Drugi ugao iste lokacije: 6.915 RSD (10% jeftiniji)",
          "4. i svaki sledeći ugao: 6.212 RSD (20% jeftiniji)",
          "Drugo dvorište iste nekretnine: 6.563 RSD (15% jeftiniji)",
        ],
        note: "Počinjete od fotografije postojećeg stanja i referenci za nove materijale i biljke. Ova opcija je vezana za ugao fotografije — za slobodan izbor kamere koristite Pejzažni render (3D).",
        configuratorCategory: "transformacija",
      },
    ],
  },
  {
    slug: "render-u-stvarnoj-fotografiji",
    code: "photomontage",
    name: "Render u stvarnoj fotografiji lokacije",
    shortName: "Render u fotografiji",
    category: "eksterijer",
    icon: "camera",
    tagline:
      "Render eksterijera u fotografiji Vaše lokacije — za 5.860 RSD više od standardnog rendera.",
    description:
      "Ovo je standardni render eksterijera (29.300 RSD) sa uključenom opcijom Fotomontaža (+5.860 RSD = ukupno 35.160 RSD). Tih 5.860 RSD znači da 3D model objekta ne smeštamo u sintetičko okruženje — već ga uklapamo direktno u fotografiju lokacije koju Vi dostavite, sa usklađenim svetlom, senkama i perspektivom. Rezultat izgleda kao da je zgrada već tu. Idealno za urbanističku komisiju, javnu raspravu i investitorske prezentacije gde komisija mora videti Vaš objekat u stvarnom kontekstu ulice. Render eksterijera možete naručiti i bez ove opcije — samo 29.300 RSD, sa sintetičkim okruženjem. Drugi metod (3D prikaz ulice, 49.224 RSD) modeluje celo okruženje u 3D — pravi izbor kada lokacija nije dostupna za fotografisanje ili trebate slobodan izbor ugla.",
    highlight:
      "Za projekte u kojima realističnost i autentičnost lokacije presudno menjaju doživljaj projekta — dozvole, javne rasprave, investitorske prezentacije.",
    materials:
      "Pošaljite nam fotografiju lokacije visoke rezolucije i 3D model ili arhitektonske crteže objekta.",
    asset: "/artwork/expert-fotomontaza-after.webp",
    beforeAsset: "/artwork/expert-fotomontaza-before.webp",
    afterAsset: "/artwork/expert-fotomontaza-after.webp",
    detailAsset: "/artwork/detail-fotomontaza.webp",
    detailBeforeAsset: "/artwork/problem-fotomontaza-ulica-before.webp",
    detailAfterAsset: "/artwork/problem-fotomontaza-ulica-after.webp",
    detailBeforeAlt:
      "Prazna parcela u ulici između postojećih zgrada — stvarna fotografija lokacije pre montaže objekta",
    detailAfterAlt:
      "Isti ulični kadar sa uklopljenim 3D renderom novog objekta — render u stvarnoj fotografiji lokacije",
    philosophy:
      "Cena se sastoji od dva dela. Render eksterijera (29.300 RSD) pokriva izgradnju kompletnog 3D modela Vašeg objekta i prvi finalni render. To je isti model, isti posao — bez obzira da li iza njega stoji sintetičko okruženje ili fotografija lokacije. Fotomontaža (+5.860 RSD) je opcija koja menja samo pozadinu: umesto modelovanog okruženja, 3D model se uklapa u stvarnu fotografiju — usklađujemo perspektivu, svetlo i senke sa momentom snimanja. Taj doplatak je opravdan jer analiza fotografije i usklađivanje perspektive zahtevaju poseban rad koji standardni render nema. Render eksterijera je dostupan i samostalno za 29.300 RSD — kada Vam sintetičko okruženje odgovara. Ako trebate više uglova: sledeći ugao iz iste fotografije je 6.446 RSD (82% jeftinije), druga fotografija iste lokacije 9.962 RSD, neviđena strana objekta +25% jednom po modelu.",
    priceContext:
      "35.160 RSD — uklapanje + prvi prikaz. Sledeći ugao iste fotografije: 6.446 RSD (82% jeftiniji).",
    forSegments: [
      "Investitori (urbanistička dozvola, javna rasprava)",
      "Arhitekte (klijentske prezentacije)",
      "Studija za masterplan i razvojne projekte",
    ],
    problemHeading: "Komisija ne zamišlja. Komisija vidi fotografiju.",
    problemBody:
      "Arhitektonski nacrt kaže koliko je zgrada visoka i gde stoji. Ne kaže kako izgleda u dvorištu između susednih kuća, u popodnevnom svetlu, sa zelenilom koje već postoji na toj ulici. Urbanistička komisija ili kupac parcele traže upravo to — i bez toga donose odluku na osnovu pretpostavke.",
    problemResolution:
      "Fotografišete lokaciju, šaljete nam nacrte — mi uklapamo 3D model u Vašu fotografiju. Perspektiva, senke i osvetljenje su usklađeni sa stvarnim trenutkom snimanja. Komisija vidi tačno šta će stajati na tom mestu.",
    benefits: [
      {
        icon: "trust",
        title: "Piksel-realno okruženje",
        body: "Susedne kuće, drveće, ograda, senke — sve je stvarno jer dolazi iz Vaše fotografije. Niko ne može da tvrdi da je okruženje 'ulepšano' ili izmišljeno.",
      },
      {
        icon: "context",
        title: "Idealno za regulatorne procedure",
        body: "Urbanistička komisija i javna rasprava traže prikaz u stvarnom kontekstu. Render u fotografiji lokacije ispunjava taj uslov direktno — bez dodatnih objašnjenja.",
      },
      {
        icon: "value",
        title: "Ekonomično za više uglova",
        body: "Prva fotografija je 35.160 RSD — svaki sledeći ugao iz iste fotografije je 6.446 RSD (82% jeftinije). Tri kadra iste lokacije ukupno izlaze 48.052 RSD.",
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
        q: "Od čega se sastoji cena od 35.160 RSD? Mogu li naručiti samo render eksterijera?",
        a: "35.160 RSD su dva zasebna dela: render eksterijera (29.300 RSD) + opcija Fotomontaža (+5.860 RSD). Render eksterijera uključuje izgradnju kompletnog 3D modela objekta i jedan finalni render — to je osnova. Fotomontaža (+5.860 RSD) znači da taj 3D model umesto u sintetičko okruženje uklapamo u stvarnu fotografiju lokacije koju Vi dostavite, sa usklađenim svetlom, senkama i perspektivom. Ako Vam sintetičko okruženje odgovara (npr. za prodajni prospekt bez regulatorne svrhe), možete naručiti samo render eksterijera za 29.300 RSD — opcija Fotomontaža nije obavezna.",
      },
      {
        q: "Šta tačno dobijam za 35.160 RSD?",
        a: "Kompletan 3D model Vašeg objekta i jedan finalni render — 3D model uklapa se u fotografiju lokacije koju Vi dostavite, sa usklađenim svetlom, senkama i perspektivom. Uključene su tri runde revizije.",
      },
      {
        q: "Ko snima fotografiju lokacije?",
        a: "Vi — ili neko koga angažujete. Dovoljan je i telefon sa dobrom kamerom, pod uslovom da je fotografija oštra i snimljena iz visine oka (ne iz auto-sedišta). Šaljemo Vam kratko uputstvo za snimanje kad potvrdite porudžbinu.",
      },
      {
        q: "Razlika u odnosu na 3D prikaz ulice (49.224 RSD)?",
        a: "Render u fotografiji koristi stvarnu fotografiju lokacije kao pozadinu — okruženje je piksel-realno, ali ste vezani za ugao snimljene fotografije. 3D prikaz ulice modeluje celo okruženje u 3D — možete birati bilo koji ugao, ali okruženje je aproksimacija, ne stvarna fotografija. Ako lokacija postoji i može se fotografisati, render u fotografiji daje verodostojniji rezultat za manje novca.",
      },
      {
        q: "Da li ova usluga važi i za kuće, ne samo zgrade?",
        a: "Da. Metod ne zavisi od tipa objekta — važi za porodične kuće, stambene zgrade, poslovne objekte i svaki drugi tip čije nacrte možete dostaviti.",
      },
      {
        q: "Šta ako lokacija nije fotografisana iz pravog ugla?",
        a: "Pre početka rada proveravamo fotografiju i javljamo se ako ugao ne funkcioniše za predviđeni kadar. U tom slučaju možete dostaviti novu fotografiju ili preći na 3D prikaz ulice — koji ne zavisi od fotografije.",
      },
      {
        q: "Koliko traje izrada?",
        a: "Prve nacrte šaljemo za 3–5 radnih dana od potvrde ponude i prijema nacrta i fotografije. Tri runde revizije su uključene — bez doplate.",
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
    pricingLead: {
      heading: "Dva metoda, isti cilj — jedan pravi izbor za Vašu lokaciju.",
      body: "Render u stvarnoj fotografiji (35.160 RSD) je pravi izbor kada lokacija postoji i može se fotografisati — daje maksimalnu verodostojnost jer koristi stvarno okruženje. 3D prikaz ulice (49.224 RSD) je pravi izbor kada lokacija još ne postoji, teško je dostupna ili trebate više uglova bez ograničenja fotografije. Odaberite prema tome šta imate u rukama.",
    },
    comparison: {
      aLabel: "Render u fotografiji — 35.160 RSD",
      bLabel: "3D prikaz ulice — 49.224 RSD",
      rows: [
        { label: "Ulazni materijal", a: "Stvarna fotografija lokacije", b: "Arhitektonski nacrti" },
        { label: "Okruženje", a: "Piksel-realno (prava fotografija)", b: "Modelovano u 3D (aproksimacija)" },
        { label: "Izbor ugla", a: "Vezan za ugao fotografije", b: "Bilo koji ugao (ulica ili iz vazduha)" },
        { label: "Kada izabrati", a: "Lokacija postoji i može se fotografisati", b: "Lokacija ne postoji ili treba više uglova" },
      ],
    },
    variants: [
      {
        id: "photomontage-main",
        title: "Render u stvarnoj fotografiji lokacije",
        basePrice: 300,
        priceLabel: "35.160 RSD",
        unitLabel: "render eksterijera 29.300 RSD + Fotomontaža +5.860 RSD",
        decomposition: "Render eksterijera 29.300 RSD + Fotomontaža 5.860 RSD",
        description:
          "3D model objekta se uklapa u fotografiju lokacije koju Vi dostavite — usklađeno svetlo, senke i perspektiva. Maksimalna verodostojnost za komisije, javne rasprave i prezentacije kupcu.",
        included:
          "Kompletan 3D model objekta (isto što i standardni render eksterijera), postavljanje scene i osvetljenja usklađenih sa fotografijom lokacije, jedno uklapanje u jednu fotografiju koju Vi dostavite — jedan finalni render. Tri runde revizije uključene. Fotomontaža opcija je pre-uključena u konfiguratoru — korpa prikazuje stavku po stavku: render eksterijera 29.300 RSD + Fotomontaža 5.860 RSD = 35.160 RSD.",
        addOns: [
          "Dodatni ugao iz iste fotografije: 6.446 RSD (82% jeftinije)",
          "Druga fotografija iste lokacije (drugi ugao snimanja): 9.962 RSD",
          "Neviđena strana objekta: +25% jednokratno",
        ],
        note: "Cena: render eksterijera 29.300 RSD + Fotomontaža +5.860 RSD = 35.160 RSD. Render eksterijera možete naručiti i bez Fotomontaže — samo 29.300 RSD sa sintetičkim okruženjem. Fotomontaža opcija dodaje uklapanje u stvarnu fotografiju lokacije.",
      },
    ],
    crossSellVariants: [
      {
        id: "exterior-aerial",
        title: "3D prikaz ulice (streetscape)",
        basePrice: 420,
        priceLabel: "49.224 RSD",
        unitLabel: "pun 3D model objekta + okruženja",
        description:
          "Kada lokacija ne postoji ili trebate više uglova bez ograničenja fotografije — celo okruženje se modeluje u 3D, primarno iz ulične perspektive.",
        included:
          "Pun 3D model objekta i okruženja (susedne kuće, ulica, parcela), ulična perspektiva i 2 ugla uključena.",
        addOns: [
          "Dodatni ugao: 5.626 RSD (80% jeftinije)",
          "Neviđena/zadnja strana objekta: +25% (12.306 RSD jednokratno)",
        ],
        note: "Pravi izbor kada lokacija još nije dostupna za fotografisanje ili trebate slobodan izbor ugla kamere.",
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
    detailBeforeAsset: "/artwork/problem-3d-situacioni-plan-before.webp",
    detailAfterAsset: "/artwork/problem-3d-situacioni-after.webp",
    detailBeforeAlt:
      "2D situacioni plan stambenog kompleksa — raspored objekata, parkinga, zelenila i sadržaja",
    detailAfterAlt:
      "3D situacioni prikaz stambenog kompleksa iz vazduha — objekti, parking i uređenje parcele",
    philosophy:
      "Cena pokriva izradu kompletnog terena, postavljanje objekata, puteva i pejzaža. Pošto je scena izgrađena, svaki sledeći ugao košta 7.618 RSD (81% jeftinije), sezonska varijanta (zima/leto) 9.962 RSD, a prikaz po fazama izgradnje 11.134 RSD. Tako investitor ima vizuelni materijal za sve faze kampanje — fazu pre prodaje, fazu otvaranja prvog objekta itd. — iz jednog modela.",
    priceContext:
      "41.020 RSD — cela parcela: teren + objekti + pejzaž + prvi prikaz iz vazduha.",
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
        body: "41.020 RSD pokriva kompletan teren. Dodatni ugao 7.618 RSD, sezonska varijanta 9.962 RSD, prikaz po fazama izgradnje 11.134 RSD — bez ponovnog modelovanja.",
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
        q: "Šta tačno dobijam za 41.020 RSD?",
        a: "Modelovanje cele parcele (teren, objekti, putevi, parking, vegetacija, pejzaž) i prvi finalni prikaz iz vazduha. Dodatni ugao iste parcele: 7.618 RSD (81% popust). Sezonska varijanta (zima/leto): 9.962 RSD. Prikaz po fazama izgradnje: 11.134 RSD.",
      },
      {
        q: "Razlika u odnosu na 3D prikaz ulice (49.224 RSD)?",
        a: "3D prikaz ulice (49.224 RSD) je fokusiran na jedan objekat sa okruženjem (susedne kuće, ulica). Situacioni plan (41.020 RSD) prikazuje celu parcelu sa svim objektima i razvojem — masterplan nivo, iz vazduha. Prvi je za pojedinačan objekat u kontekstu ulice, drugi za ceo kompleks odozgo.",
      },
      {
        q: "Da li se može koristiti za urbanističku dozvolu?",
        a: "Da. Situacioni plan je standardni prilog u urbanističkim procedurama. 3D prikaz povećava razumljivost pred komisijom u odnosu na klasičan tehnički crtež.",
      },
      {
        q: "Mogu li da naručim faze izgradnje?",
        a: "Da. Prikaz po fazama izgradnje (11.134 RSD) prikazuje istu parcelu u različitim fazama razvoja — pre, prva faza završena, druga faza u nazaku itd. Investitorska kampanja dobija vizuelni materijal za svaku fazu.",
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
        priceLabel: "41.020 RSD",
        unitLabel: "kompletna parcela + prvi prikaz iz vazduha",
        description:
          "Pun teren, svi objekti, putevi i pejzaž — investitorski materijal. Sledeći ugao iste parcele: 7.618 RSD.",
        included:
          "Modelovanje cele parcele: teren, objekti, putevi, parking, vegetacija i pejzaž. Uključuje 1 finalni prikaz iz vazduha.",
        addOns: [
          "Dodatni ugao iste parcele: 7.618 RSD (81% popust)",
          "Sezonska varijanta (zima/leto): 9.962 RSD",
          "Prikaz po fazama izgradnje (vidljivost po fazi): 11.134 RSD",
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
      "Zamena neba, korekcija osvetljenja i topla atmosfera prozora — dnevna fotografija eksterijera postaje atraktivan večernji oglas. Za 10+ slika cena pada na 938 RSD/slika (20% popust).",
    highlight:
      "Za agente nekretnina i investitore kada ista scena treba i u dnevnoj i u večernjoj verziji za marketing kampanju.",
    materials: "Pošaljite nam dnevne fotografije eksterijera visoke rezolucije.",
    asset: "/artwork/expert-dan-u-noc-after.webp",
    beforeAsset: "/artwork/expert-dan-u-noc-before.webp",
    afterAsset: "/artwork/expert-dan-u-noc-after.webp",
    detailAsset: "/artwork/detail-dan-u-noc.webp",
    detailBeforeAsset: "/artwork/problem-dan-u-noc-fasada-before.webp",
    detailAfterAsset: "/artwork/problem-dan-u-noc-fasada-after.webp",
    detailBeforeAlt:
      "Moderna kuća sa fasadom snimljena u suton pre prelaza u noćni prikaz",
    detailAfterAlt:
      "Ista moderna kuća u noćnom prikazu — osvetljena fasada, topli enterijer i okolno osvetljenje pod zvezdanim nebom",
    outsourced: true,
    philosophy:
      "Brza post-produkcija sa jasnom cenom po slici. Pakovanje 10+ slika: 938 RSD/slika (20% popust). Hitna isporuka u roku od 24h: +50%.",
    priceContext: "1.172 RSD po slici · 938 RSD po slici za pakovanje 10+.",
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
        title: "1.172 RSD po slici, 938 RSD za pakovanje",
        body: "Jedna slika 1.172 RSD, pakovanje 10+ slika pada na 938 RSD po slici (20% popust). Kompletna kampanja stana ili kuće za delić cene novog snimanja.",
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
        body: "Dobijate finalne slike spremne za listing i kampanje. Po želji uz uklanjanje neželjenih senki za 586 RSD po slici.",
      },
    ],
    faqs: [
      {
        q: "Šta tačno dobijam za 1.172 RSD?",
        a: "Transformacija jedne dnevne fotografije eksterijera u dramatičan večernji prikaz — uključuje zamenu neba i podešavanje osvetljenja. Uklanjanje neželjenih senki: 586 RSD po slici. Pakovanje 10+ slika: 938 RSD po slici (20% popust). Hitna isporuka u 24h: +50%.",
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
        a: "Da. Pakovanje 10+ slika je 938 RSD po slici (20% popust). Stalni agenti mogu da dogovore prioritet izrade i konzistentnu light-grading liniju kroz sve listinge.",
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
        priceLabel: "1.172 RSD",
        unitLabel: "po slici",
        description:
          "Zamena neba, lighting i kolor grejding za jednu sliku. Pakovanje 10+: 938 RSD/sliku.",
        included:
          "Transformacija jedne dnevne fotografije eksterijera u dramatičan večernji prikaz. Uključuje zamenu neba i podešavanje osvetljenja.",
        addOns: [
          "Uklanjanje neželjenih senki: 586 RSD",
          "Pakovanje 10+ slika: 938 RSD po slici (20% popust)",
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
    detailBeforeAsset: "/artwork/problem-uklanjanje-predmeta-soba-before.webp",
    detailAfterAsset: "/artwork/problem-uklanjanje-predmeta-soba-after.webp",
    detailBeforeAlt:
      "Soba sa lusterom, stolicama i predmetima pre digitalnog uklanjanja predmeta",
    detailAfterAlt:
      "Ista soba posle uklanjanja predmeta — ispražnjen prostor bez nameštaja i dekoracije",
    outsourced: true,
    philosophy:
      "Jednostavno uklanjanje (sitnice, lične stvari): 1.406 RSD. Kompleksno (veliki objekat sa rekonstrukcijom pozadine): 2.930 RSD. Pakovanje 10+ slika: 1.172 RSD jednostavno / 2.344 RSD kompleksno po slici.",
    priceContext:
      "1.406 RSD jednostavno / 2.930 RSD kompleksno · pakovanje 10+: 1.172 RSD / 2.344 RSD.",
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
        body: "Sitnice i lične stvari: 1.406 RSD. Veliki objekat sa rekonstrukcijom pozadine: 2.930 RSD. Pakovanje 10+ slika spušta na 1.172 RSD / 2.344 RSD po slici.",
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
        body: "Šaljemo cenu (jednostavno 1.406 RSD ili kompleksno 2.930 RSD) i rok najkasnije narednog radnog dana.",
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
        q: "Šta tačno dobijam za 1.406 RSD?",
        a: "Digitalno uklanjanje sitnica i ličnih stvari sa jedne fotografije. Kompleksno uklanjanje (veliki objekat sa rekonstrukcijom pozadine): 2.930 RSD. Dodatna slika — jednostavno: 938 RSD (33% popust). Dodatna slika — kompleksno: 2.110 RSD (28% popust). Pakovanje 10+: 1.172 RSD / 2.344 RSD po slici.",
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
        priceLabel: "1.406 RSD",
        unitLabel: "po slici (jednostavno)",
        description:
          "1.406 RSD jednostavno (sitnice, lične stvari) / 2.930 RSD kompleksno (veliki objekti). Pakovanje 10+: popust na količinu.",
        included:
          "Digitalno uklanjanje predmeta, nereda ili ličnih stvari sa jedne fotografije, uz rekonstrukciju pozadine.",
        addOns: [
          "Kompleksno uklanjanje (rekonstrukcija pozadine): 2.930 RSD",
          "Dodatna slika — jednostavno: 938 RSD (33% popust)",
          "Dodatna slika — kompleksno: 2.110 RSD (28% popust)",
          "Pakovanje 10+ slika: 1.172 RSD jednostavno / 2.344 RSD kompleksno",
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

export type ServiceImageRole =
  | "hero"
  | "listing"
  | "detail"
  | "problem"
  | "before"
  | "after"
  | "portfolio"
  | "og";

function firstSentence(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  const match = normalized.match(/^(.+?[.!?])(?:\s|$)/);
  return match?.[1] ?? normalized;
}

export function buildServiceImageAlt(
  service: Service,
  role: ServiceImageRole = "detail",
): string {
  const category = CATEGORY_LABELS[service.category].toLowerCase();

  switch (role) {
    case "before":
      return `${service.name} - ulazni kadar pre vizuelne obrade`;
    case "after":
      return `${service.name} - finalni vizual posle obrade`;
    case "problem":
      return `${service.name} - primer problema i rešenja za ${category}`;
    case "listing":
      return `${service.name} - primer usluge iz kategorije ${category}`;
    case "portfolio":
      return `${service.name} - portfolio primer realizovanog vizuala`;
    case "hero":
      return `${service.name} - ${service.tagline}`;
    case "og":
      return `${service.name} - Elegant Render ${category}`;
    case "detail":
    default:
      return `${service.name} - primer arhitektonske vizuelizacije Elegant Render`;
  }
}

export function buildServiceImageCaption(
  service: Service,
  role: ServiceImageRole = "detail",
): string {
  return `${buildServiceImageAlt(service, role)}. ${firstSentence(
    service.description,
  )}`;
}
