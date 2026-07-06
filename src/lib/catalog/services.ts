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
  Pricing sourced from the EUR catalog derived from docs/pricing/pillar-1-extracted.md.
  Do not invent tier names, bundle prices, or math that does not appear in the PDF.
  Some services have multiple variants (e.g. Static vs 360 Interior); others have a single variant.
*/

export type ServiceCategory =
  | "exterior"
  | "interior"
  | "plans"
  | "animations"
  | "transformation";

export type PricingVariant = {
  id: string;
  title: string;
  /** Whole-euro amount, used for comparisons and starting-from displays. */
  basePrice: number;
  /** Human price label — may include unit suffix (e.g. "€15/sec"). */
  priceLabel: string;
  /** Per-unit basis (e.g. "base package per floor", "first shot"). */
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
   *  "Exterior render €250 + Photomontage €50"). Renders as a muted
   *  annotation, currency-aware via formatPublicPriceText. */
  decomposition?: string;
  /** Override the category used to build the configurator deep-link. Set on
   *  cross-sell cards whose product lives in a different category than the
   *  host service (e.g. a "transformation" reno card on an "exterior" page),
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
  /** When set, the portfolio tile becomes a before/after slider: the tile
   *  reveals `beforeSrc` (e.g. the plain/technical plan) over `src` (the
   *  finished, colored one). */
  beforeSrc?: string;
  beforeAlt?: string;
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
  /** When both are set, the home-page "Minimal input" preview renders a
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
   *  on /services — distinct from home (3:2 thumbnail) and detail (16:9
   *  hero) so each surface has its own visual identity. */
  listingAsset?: string;
  /** Plain-language line that shows next to "from €X" everywhere a price
   *  is displayed (picker, services grid, hero chip). Anchors the price
   *  to the quantity it covers so customers don't read €170 as "one
   *  render" when it's actually "whole floor + unlimited renders". */
  priceContext?: string;
  /** Optional list of target customer segments shown as "Ideal for:"
   *  chips on the service detail page. Set only on investor-grade
   *  services where segmentation actually clarifies the value prop. */
  forSegments?: readonly string[];
  /** Why this service is priced the way it is (customer-value framing). */
  philosophy: string;
  variants: PricingVariant[];
  /** Extra pricing cards rendered after `variants` on the detail page only —
   *  cross-sell options whose product lives in another service/category (e.g.
   *  the cheaper "virtual renovation from a photo" on the landscape page).
   *  Display-only: NOT consumed by the home quick-order hero or the quote. */
  crossSellVariants?: PricingVariant[];
  /** Optional heading/body shown above the pricing cards. Use to frame a
   *  multi-option choice (e.g. "Two methods…"). Falls back to the generic
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
   *  the catalog, still has a /services/<slug> page, and still appears in
   *  the sitemap — but the header dropdown skips it. Used for multi-variant
   *  master pages (e.g. interior-renders) where dedicated split services
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
  /** When set, the problem section renders a looping <video> (animation) to
   *  the right of the problem heading — highest-priority problem visual. */
  problemVideoSrc?: string;
  /** Optional poster frame for problemVideoSrc. */
  problemVideoPoster?: string;

  /** Three reason-to-buy cards rendered as a 3-up grid. */
  benefits?: ServiceBenefit[];

  /** Four-step "how we work" timeline. */
  processSteps?: ProcessStep[];

  /** Portfolio gallery (recommended 4 images, 16:9). */
  portfolioImages?: PortfolioImage[];

  /** Service-specific FAQ. Rendered after the generic SERVICES_PAGE_FAQS. */
  faqs?: ServiceFaq[];
};

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  exterior: "Exterior",
  interior: "Interior",
  plans: "Plans",
  animations: "Animations and tours",
  transformation: "Space transformation",
};

export const CATEGORY_DESCRIPTIONS: Record<ServiceCategory, string> = {
  exterior:
    "Views of buildings, their surroundings and outdoor settings — for houses, apartment buildings and larger projects.",
  interior:
    "Visualization of interior spaces by room or by whole floor.",
  plans:
    "Clear 2D and 3D views of room layouts and whole sites.",
  animations:
    "Architectural animations and interactive 360 tours for rich presentations.",
  transformation:
    "Upgrading existing spaces — staging, renovation and photo corrections.",
};

export const CATEGORY_ORDER: ServiceCategory[] = [
  "interior",
  "exterior",
  "plans",
  "animations",
  "transformation",
];

// Cloudfront fallback used only by the 360 tour service for SEO/OG
// meta images — that surface keeps the Kuula iframe in the UI and
// doesn't yet have a custom expert-* lovart shot. Other services
// migrated to local /artwork/expert-*.webp assets.
const PORTFOLIO_ASSET =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663405648099/H5vzEpcfPDUNQp2BAKXnFZ/elegant-render-portfolio-01-HpiHZcQXFq7MF3BnppeqJc.webp";

export const SERVICES: Service[] = [
  {
    slug: "interior-renders",
    code: "interior-rendering",
    name: "Interior renders",
    shortName: "Interior renders",
    category: "interior",
    icon: "home",
    hideFromMenu: true,
    tagline: "Show buyers the home before contractors ever reach the site.",
    description:
      "Show buyers or clients what every room of their future home will look like — before the work starts. One order covers a whole floor — 10 static interior renders + a floor plan. Sell an apartment from the brochure, align with your client on material choices, or present an interior before it is built.",
    highlight:
      "For apartments under construction, houses about to be renovated and developer units — one investment covers the whole floor, not a single room.",
    materials:
      "Send us the floor plan (2D or PDF), style references and a list of rooms. The clearer the input, the faster we send first drafts — typically 3-5 working days.",
    asset: "/artwork/expert-interior-renders.webp",
    detailAsset: "/artwork/detail-interior-renders.webp",
    philosophy:
      "Most of the work is building the 3D model — we build it once and charge for it once. After that, every new angle, furniture change or time of day starts from €10, not from the full render price. That lets you plan your marketing budget for the pre-sale season without unpleasant surprises.",
    priceContext:
      "Whole floor — 10 static interior renders + a floor plan.",
    forSegments: [
      "Developers (multi-unit)",
      "Interior architects",
      "Private clients planning a renovation",
    ],
    featured: true,
    variants: [
      {
        id: "interior-static",
        title: "Static renders — per floor",
        basePrice: 170,
        priceLabel: "€170",
        unitLabel: "whole floor — 10 static renders",
        description:
          "The strongest combination for brochures and presenting developer units — one investment covers the whole floor: 10 static renders + a floor plan.",
        included:
          "Complete 3D model built for one floor. Includes 10 static interior renders and a floor plan. Each additional floor: €120 (30% cheaper).",
        addOns: [
          "11th and each additional furnished room: €28",
          "Additional camera angle in an existing room: €10",
          "Additional floor: €120 (30% discount)",
        ],
      },
      {
        id: "interior-360",
        title: "Interactive 360 tour — per floor",
        basePrice: 295,
        priceLabel: "€295",
        unitLabel: "whole floor as a 360 tour",
        description:
          "Buyers walk through the space with their mouse, like in a game — perfect for online property presentations and remote pre-sales.",
        included:
          "Up to 10 interactive rooms in a 360 tour (the client enters and walks through the space) + 10 additional static camera angles + a floor plan.",
        addOns: [
          "11th and each additional interactive room: €45",
          "Additional interactive point in an existing room: €27",
          "Additional static camera angle: €10",
          "Additional floor (360 tour): €205 (30% discount)",
        ],
      },
    ],
  },
  {
    slug: "interior-render",
    code: "interior-static-dedicated",
    name: "Interior render",
    shortName: "Interior render",
    category: "interior",
    icon: "home",
    tagline: "Show buyers the home before the work starts.",
    description:
      "A photorealistic view of every room in a future apartment or house — with accurate materials, furniture layout and natural light. €170 covers a whole floor — 10 static interior renders + a floor plan. Sell an off-plan unit to a buyer who sees exactly what they are getting.",
    highlight:
      "The right choice for off-plan brochures, client presentations of material options and marketing before sales open.",
    materials:
      "Send the floor plan (2D or PDF), style references and a list of rooms. First draft in 3-5 working days.",
    asset: "/artwork/expert-interior-renders.webp",
    listingAsset: "/artwork/listing-interior-static.webp",
    detailAsset: "/artwork/detail-interior-static.webp",
    problemAsset: "/artwork/problem-interior-static-after.webp",
    detailBeforeAsset: "/artwork/problem-interior-static-before.webp",
    detailAfterAsset: "/artwork/problem-interior-static-after.webp",
    philosophy:
      "Most of the work is building the 3D model of the floor — we build it once and charge for it once. After that, every new angle of the same room is €10, an additional room on the same floor €28, a second floor €120 (30% cheaper). That lets you plan your marketing budget for the pre-sale season without surprises.",
    priceContext:
      "€170 — whole floor: 10 static interior renders + a floor plan.",
    forSegments: [
      "Developers (multi-unit pre-sales)",
      "Interior architects (client presentations)",
      "Private clients planning a renovation",
    ],
    problemHeading: "Buyers don't buy a floor plan. They buy a home they can see themselves in.",
    problemBody:
      "The developer shows an apartment drawing, the buyer counts square meters and walks away. Lines and labels say nothing about the materials, light and atmosphere of a room. The decision gets postponed until the space can be seen in person — and by then construction is often already finished.",
    problemResolution:
      "An interior render turns the floor plan into a recognizable space — with accurate materials, furniture choices and natural light. The buyer opens the brochure, recognizes the room they will live in and makes a decision.",
    benefits: [
      {
        icon: "speed",
        title: "Sales before construction",
        body: "Off-plan units move faster when the buyer sees the actual room — with real materials, not a drawing. The difference in sales speed pays for the investment within the first few units.",
      },
      {
        icon: "trust",
        title: "Material choices without misunderstandings",
        body: "The client chooses between options using renders — seeing the floor, walls and furniture together instead of imagining them. Handover disputes shrink.",
      },
      {
        icon: "value",
        title: "One package covers the whole floor",
        body: "€170 covers 10 static interior renders + a floor plan. That works out to €17 per render — categorically cheaper than ordering one by one.",
      },
    ],
    processSteps: [
      {
        title: "Send the floor plan",
        body: "A PDF or DWG floor plan, style references and a list of rooms. Optional: material specification, inspiration photos.",
      },
      {
        title: "Estimate confirmation",
        body: "We send the price and timeline within one working day, with no hidden items.",
      },
      {
        title: "Production and drafts",
        body: "The team builds the 3D model of the floor and sets materials, furniture and lighting. First drafts in 3-5 working days.",
      },
      {
        title: "Delivery and revisions",
        body: "You receive final high-resolution visuals. Three revision rounds are included in the price — no extra charge.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-interior-static-01.webp",
        alt: "Living room with a kitchen island — Elegant Render",
      },
      {
        src: "/artwork/portfolio-interior-static-02.webp",
        alt: "Kitchen with pendant lights and a stone countertop — Elegant Render",
      },
      {
        src: "/artwork/portfolio-interior-static-03.webp",
        alt: "Main bedroom with indirect lighting and a warm palette — Elegant Render",
      },
      {
        src: "/artwork/portfolio-interior-static-04.webp",
        alt: "Bathroom with natural light and marble finishes — Elegant Render",
      },
    ],
    faqs: [
      {
        q: "What exactly do I get for €170?",
        a: "A complete 3D model of one floor with 10 static interior renders and a floor plan. Each additional floor: €120 (30% cheaper). 11th room on the same floor: €28.",
      },
      {
        q: "How is this different from per-room pricing elsewhere?",
        a: "The market standard is to charge per room. We charge per floor — €170 for 10 static renders. That works out to €17 per render. The logic: the model is already built when we move from room to room — so we charge once instead of ten times.",
      },
      {
        q: "Can I change materials or furniture later?",
        a: "Three revision rounds are included in the price. After the first delivery we change floors, walls, furniture or lighting until the result is right. An additional design option (different furniture on the same layout) is available as an add-on.",
      },
      {
        q: "How long does it take?",
        a: "We send first drafts in 3-5 working days from estimate confirmation and receipt of the plans. Final delivery depends on the number of revisions — all three rounds are included.",
      },
      {
        q: "What do I need to send to get started?",
        a: "The floor plan (PDF or DWG) with the room layout, a list of rooms to render and style references. Optional: material specification (floors, facades, doors), inspiration photos, mood examples.",
      },
      {
        q: "Do you render a single room separately?",
        a: "The standard package is per floor because the 3D model is the biggest part of the work. A single room is available by special arrangement, but per room it is not more economical than the package — we recommend at least a whole floor.",
      },
    ],
    variants: [
      {
        id: "interior-static",
        title: "Static renders — per floor",
        basePrice: 170,
        priceLabel: "€170",
        unitLabel: "whole floor — 10 static renders",
        description:
          "One order covers a whole floor: 10 static renders + a floor plan. Each additional floor 30% cheaper.",
        included:
          "Complete 3D model built for one floor. Includes 10 static interior renders and a floor plan. Each additional floor: €120 (30% cheaper).",
        addOns: [
          "11th and each additional furnished room: €28",
          "Additional camera angle in an existing room: €10",
          "Additional floor: €120 (30% discount)",
        ],
      },
    ],
  },
  {
    slug: "interior-360-tour",
    code: "interior-360-tour-dedicated",
    name: "Interior 360 tour",
    shortName: "Interior 360 tour",
    category: "interior",
    icon: "home",
    tagline: "Buyers tour the apartment from their armchair — before it is built.",
    description:
      "An interactive 360 tour through a whole floor. The client opens a link in a browser or VR headset, moves from room to room and explores the layout and materials on their own. €295 covers up to 10 interactive rooms + 10 additional static camera angles + a floor plan.",
    highlight:
      "A presentation for remote buyers and decisions without an in-person viewing — developers use it for off-plan sales, agencies for remote purchases.",
    materials:
      "Send the floor plan (2D or PDF), style references and a list of rooms for the interactive tour. First draft in 3-5 working days.",
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
      "Most of the work is building the 3D model of the floor — we build it once and charge for it once. After that, each additional interactive point in the same room is €27, an additional room €45, an additional static angle €10, a second floor €205 (30% cheaper). That puts a complete walkthrough within a realistic developer budget.",
    priceContext:
      "€295 — a whole floor as a 360 tour with up to 10 interactive rooms + 10 static angles + a floor plan.",
    forSegments: [
      "Developers (off-plan pre-sales)",
      "Real estate agencies (remote demos)",
      "Interior architects (client presentations)",
    ],
    problemHeading: "A floor plan locks the layout into two dimensions. A tour opens it up.",
    problemBody:
      "A static image gives one angle from one room. The buyer can't feel the relationships between rooms — the sightline from the kitchen to the living room, the passage from the hallway to the bedroom. They ask for another image — and another — and postpone the decision.",
    problemResolution:
      "A 360 tour connects all the rooms into a single walkthrough. Buyers enter the apartment themselves, move from room to room with a mouse or a VR headset, examine the layout and materials on their own — and make the decision from their armchair.",
    benefits: [
      {
        icon: "trust",
        title: "An apartment in the browser",
        body: "The buyer opens a link on a phone, computer or VR headset — no installation, no account. They step into the space instantly.",
      },
      {
        icon: "speed",
        title: "Sales without viewings",
        body: "A buyer living abroad sees the whole unit at a time that suits them. The developer doesn't wait for the buyer to visit the site.",
      },
      {
        icon: "value",
        title: "One package covers the whole floor",
        body: "€295 covers up to 10 interactive rooms and 10 static angles. Per room that comes to under €30 — less than a single 360 render elsewhere.",
      },
    ],
    processSteps: [
      {
        title: "Send the floor plan",
        body: "A PDF or DWG floor plan, style references, a list of rooms for the tour and, if you like, the placement of interactive points.",
      },
      {
        title: "Estimate confirmation",
        body: "We send the price and timeline within one working day, with no hidden items.",
      },
      {
        title: "Production and tour",
        body: "The team builds the 3D model and sets materials, lighting and interactive points. We send the first draft of the tour in 3-5 working days.",
      },
      {
        title: "Link and embed code delivery",
        body: "You receive a shareable link and an embed code for your site. Three revision rounds are included in the price — no extra charge.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-interior-360-01.webp",
        alt: "Frame from a 360 tour — open-concept living room and kitchen, transition between rooms",
      },
      {
        src: "/artwork/portfolio-interior-360-02.webp",
        alt: "Frame from a 360 tour — main bedroom with indirect lighting",
      },
      {
        src: "/artwork/portfolio-interior-360-03.webp",
        alt: "Frame from a 360 tour — entrance area and view through the apartment",
      },
      {
        src: "/artwork/portfolio-interior-360-04.webp",
        alt: "Frame from a 360 tour — terrace and transition to the interior",
      },
    ],
    faqs: [
      {
        q: "How does the client open the tour?",
        a: "We send a link and an embed code. The client opens it in a browser — no installation, no account. It works on phones, computers and Meta Quest VR headsets (VR mode is built into the tour).",
      },
      {
        q: "What exactly do I get for €295?",
        a: "A complete 3D model of one floor with up to 10 interactive rooms in a 360 tour, 10 additional static camera angles and a floor plan. 11th and each additional interactive room: €45. Additional interactive point: €27. Additional static angle: €10. Next floor: €205 (30% discount).",
      },
      {
        q: "How is it different from the static interior render (€170)?",
        a: "A static render gives fixed camera angles — the buyer sees an image from one position. A 360 tour connects all the rooms into a walkthrough — buyers enter the space themselves, rotate the view and move between points. Different purposes, not alternatives.",
      },
      {
        q: "Does it work in a VR headset?",
        a: "Yes. The tour is VR-ready as standard — Meta Quest and compatible headsets open it straight from the browser, with no extra app.",
      },
      {
        q: "How long does it take?",
        a: "We send the first draft of the tour in 3-5 working days from estimate confirmation and receipt of the plans. Three revision rounds are included — no extra charge.",
      },
      {
        q: "What do I need to send to get started?",
        a: "The floor plan (PDF or DWG) with the room layout, a list of rooms for the interactive tour and style references. Optional: material specification (floors, facades, doors), inspiration photos.",
      },
    ],
    variants: [
      {
        id: "interior-360",
        title: "Interactive 360 tour — per floor",
        basePrice: 295,
        priceLabel: "€295",
        unitLabel: "whole floor as a 360 tour",
        description:
          "Buyers walk through the space with their mouse, like in a game — perfect for online property presentations and remote pre-sales.",
        included:
          "Up to 10 interactive rooms in a 360 tour (the client enters and walks through the space) + 10 additional static camera angles + a floor plan.",
        addOns: [
          "11th and each additional interactive room: €45",
          "Additional interactive point in an existing room: €27",
          "Additional static camera angle: €10",
          "Additional floor (360 tour): €205 (30% discount)",
        ],
      },
    ],
  },
  {
    slug: "exterior-renders",
    code: "exterior-rendering",
    name: "Exterior renders",
    shortName: "Exterior renders",
    category: "exterior",
    icon: "grid",
    hideFromMenu: true,
    tagline: "Sell the building before the work starts.",
    description:
      "Realistic views of facades, houses and commercial buildings — for brochures, permits, listings or client presentations. The price covers building a complete 3D model of the building and the first render. Since the model is already built, each additional camera angle using the same side of the building costs only €48 — 80% cheaper.",
    highlight:
      "Best suited to developers running pre-sales, architects presenting a project to a client and houses under construction that need marketing.",
    materials:
      "Send us the architectural drawings (plans, sections, elevations) and a material specification. The more precise the input, the faster the drafts — typically 3-5 working days.",
    asset: "/artwork/expert-exterior-renders.webp",
    detailAsset: "/artwork/detail-exterior-renders.webp",
    philosophy:
      "The biggest cost is building the 3D model of the building — we build it once, and each additional angle from the same side of the model is €48 (80% cheaper). A surcharge applies only when a shot requires the geometry of a previously unseen side of the building. That puts a package of 4-5 renders within a realistic investment budget instead of requiring a new order for every shot.",
    priceContext:
      "A full 3D model of the building + the first render. Next angle of the same side: €48 (80% cheaper).",
    forSegments: [
      "Developers (unit pre-sales)",
      "Architects (client presentations)",
      "Building owners (marketing before construction)",
    ],
    featured: true,
    problemHeading: "Buyers don't buy drawings. They buy a home.",
    problemBody:
      "Most developers lose weeks trying to explain to buyers what a building will look like based on technical drawings or rough sketches. Buyers struggle to imagine the space, materials and surroundings — so they postpone the decision.",
    problemResolution:
      "Exterior renders translate architectural drawings into reality. We show accurate materials, correct lighting and a realistic setting, based on your DWG/PDF drawings — which means you sell properties quickly and with full confidence.",
    benefits: [
      {
        title: "Sales before construction",
        body: "Let buyers see exactly what they are buying. Off-plan units move faster when the image inspires confidence.",
        icon: "speed",
      },
      {
        title: "Cheaper than a physical model",
        body: "A physical scale model costs many times more and cannot be changed. A render can be adjusted, and you can use it across every channel.",
        icon: "value",
      },
      {
        title: "A professional presentation",
        body: "The building looks finished and placed in a real context — vegetation, lighting, accurate facade materials.",
        icon: "trust",
      },
    ],
    processSteps: [
      {
        title: "Send your materials",
        body: "Send the architectural drawings (PDF/DWG) and, if you like, style references and a material specification.",
      },
      {
        title: "You receive an estimate",
        body: "We send a precise estimate no later than the next working day, with no hidden items.",
      },
      {
        title: "We build the model",
        body: "The team sets up the 3D model, lighting and vegetation. You follow the progress; no intervention needed.",
      },
      {
        title: "Delivery and revisions",
        body: "You receive the final visuals. Three revision rounds are included in the price — no extra charge.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/listing-exterior-static.webp",
        alt: "Exterior render — classic facade view",
      },
      {
        src: "/artwork/elegant-render-feature-exterior.webp",
        alt: "Exterior render — modern family house, street perspective",
      },
      {
        src: "/artwork/elegant-render-services-triptych-1.webp",
        alt: "Exterior render — facade in daylight",
      },
      {
        src: "/artwork/expert-exterior-renders.webp",
        alt: "Exterior render — portfolio example",
      },
    ],
    faqs: [
      {
        q: "How long do exterior renders take?",
        a: "We usually send first drafts in 3-5 working days from estimate confirmation and receipt of all materials. Final delivery depends on the number of revisions — three rounds are included in the price.",
      },
      {
        q: "What if I don't like a detail?",
        a: "Every order includes three revision rounds at no extra charge. We adjust materials, colors, lighting and camera angles until the result is right.",
      },
      {
        q: "Can't I just use AI tools instead?",
        a: "AI tools are good for inspiration, but they cannot produce a precise view of your specific building from DWG/PDF drawings. Our renders are technically accurate — every window, material and proportion matches the real structure, which is critical when you are selling property.",
      },
      {
        q: "Is €250 the price for one image?",
        a: "€250 covers building a complete 3D model of your building and the first final render. Since the model is already built, each additional angle of the same side of the building costs only €48 — 80% cheaper. For example, four angles of the same building come to €394 in total (€250 + 3 × €48).",
      },
      {
        q: "What do I need to send to get started?",
        a: "Architectural drawings (plans, sections, elevations) in PDF or DWG format. Optional but useful: style reference photos, a facade material specification and a photo of the site for context.",
      },
      {
        q: "Do you also render family houses, or only large projects?",
        a: "We work on projects of every size — from family houses to residential complexes and commercial buildings. The price of the model and the first angle is the same: €250.",
      },
    ],
    variants: [
      {
        id: "exterior-static",
        title: "Classic facade render",
        basePrice: 250,
        priceLabel: "€250",
        unitLabel: "3D model + first render",
        description:
          "The entry point for a brochure: a full 3D model of the building and the first final render. Each additional angle 80% cheaper.",
        included:
          "Building a full 3D model of the building, setting up the scene, lighting and materials, and 1 final render (camera angle). Next angle of the same side: only €48.",
        addOns: [
          "Additional camera angle of the same side of the building: €48 (80% discount)",
          "Surcharge for an unseen side of the building: +25% once per model",
        ],
        note: "The surcharge for an unseen side is charged once; after that, all further angles are charged at the standard add-on price.",
      },
      {
        id: "exterior-360",
        title: "Interactive 360 panorama",
        basePrice: 335,
        priceLabel: "€335",
        unitLabel: "3D model + first 360 panorama",
        description:
          "The client turns around the building with a mouse or a VR headset. Ideal for remote presentations and online brochures.",
        included:
          "A full 3D model of the building + the first interactive 360 panorama ready for VR headsets (Meta Quest etc.).",
        addOns: [
          "Additional interactive point, same side of the model: €48",
          "Additional point requiring an unseen side: €60",
          "For 5+ additional points: €53 per point (volume discount)",
        ],
      },
      {
        id: "exterior-aerial",
        title: "3D streetscape",
        basePrice: 420,
        priceLabel: "€420",
        unitLabel: "building + surroundings, street-level or aerial perspective",
        description:
          "The building with neighboring houses modeled in 3D — street-level perspective or aerial view. For street context, plots and investor presentations.",
        included: "A full 3D model of the building + surroundings + the first view (street-level or aerial perspective).",
        addOns: ["Surcharge for showing the rear side of the building: +25% once"],
      },
    ],
  },
  {
    slug: "exterior-360",
    code: "exterior-360-tour",
    name: "Exterior 360",
    shortName: "Exterior 360",
    category: "exterior",
    icon: "images",
    tagline: "Clients walk around your building like in a game — before it is built.",
    description:
      "An interactive 360 panorama around your building. The buyer opens a link in a browser, rotates the view from every angle with the mouse, switches between points — and uses VR mode on Meta Quest headsets. Ideal for off-plan pre-sales, remote demos and online brochures.",
    highlight:
      "The right presentation for a remote buyer — when a static render doesn't convey the space. Developers selling off-plan to buyers abroad and agencies doing remote viewings.",
    materials:
      "Send the architectural drawings (PDF/DWG), style references and the placement of the viewing points you want. First draft in 3-5 working days.",
    asset: "/artwork/listing-exterior-360.webp",
    detailAsset: "/artwork/detail-exterior-360.webp",
    detailEmbedSrc:
      "https://kuula.co/share/collection/7Tm7X?logo=1&info=0&fs=1&vr=1&sd=1&autorotate=0.04&autop=30&thumbs=1",
    philosophy:
      "The biggest cost is building the 3D model. The €335 price covers a full model and the first interactive 360 panorama. Each subsequent point from the same side of the model: €48 (80% cheaper). A point requiring an unseen side: €60 one-off. For 5+ points the price drops to €53 per point — a complete walkaround of the building fits a realistic developer budget.",
    priceContext:
      "€335 — a full 3D model + the first VR-ready 360 panorama. Next point on the same side: €48.",
    forSegments: [
      "Developers (off-plan pre-sales)",
      "Real estate agencies (remote demos)",
      "Architects (client presentations)",
    ],
    problemHeading: "Drawings don't open doors. A walk around the building does.",
    problemAsset: "/artwork/expert-exterior-360-problem.webp",
    problemPanoramaSrc: "/artwork/exterior-360-panorama-vr.jpg",
    problemBody:
      "The developer shows the facade, the buyer nods and leaves to think it over. A static image doesn't convey the space from every angle, doesn't show the materials in the light, doesn't let the buyer explore on their own. The decision is postponed.",
    problemResolution:
      "An interactive 360 panorama turns the facade into a space the client moves through with a mouse or a VR headset. Buyers explore the building from every angle, with the same materials and surroundings they will see in person — and make a decision.",
    benefits: [
      {
        icon: "trust",
        title: "Confidence through experience",
        body: "The buyer steps into the space with a mouse and examines materials, dimensions and lighting on their own. Nobody has to explain the perspective to them.",
      },
      {
        icon: "speed",
        title: "Remote presentations",
        body: "You send a link, the buyer opens the panorama on a phone or a VR headset — no installation, no account.",
      },
      {
        icon: "value",
        title: "Cheaper than a physical model",
        body: "A full 3D model and an interactive panorama for €335. A physical scale model of the same building costs many times more and cannot be changed when the architect changes a material.",
      },
    ],
    processSteps: [
      {
        title: "Send your materials",
        body: "Send the architectural drawings (PDF/DWG) and, if you like, style references and the placement of the viewing points you want.",
      },
      {
        title: "You receive an estimate",
        body: "We send a precise estimate no later than the next working day, with no hidden items.",
      },
      {
        title: "We build the panorama",
        body: "The team builds the 3D model, sets lighting and materials, and renders the 360 panorama. You follow the progress.",
      },
      {
        title: "Link and embed code delivery",
        body: "You receive a shareable link and an embed code for your site. Three revision rounds are included in the price — no extra charge.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-exterior-360-01.webp",
        alt: "Frame from a 360 panorama of a residential building — street perspective",
      },
      {
        src: "/artwork/portfolio-exterior-360-02.webp",
        alt: "Frame from a 360 panorama of a family house — daytime scene",
      },
      {
        src: "/artwork/portfolio-exterior-360-03.webp",
        alt: "Frame from a 360 panorama of a commercial building — entrance facade",
      },
      {
        src: "/artwork/portfolio-exterior-360-04.webp",
        alt: "Frame from a 360 panorama of a residential complex — surrounding buildings and access area",
      },
    ],
    faqs: [
      {
        q: "How does the client open the panorama?",
        a: "We send a link and an embed code. The client opens it in a browser — no installation, no account. It works on phones, computers and Meta Quest VR headsets (VR mode is built into the panorama).",
      },
      {
        q: "What exactly does the €335 price include?",
        a: "A full 3D model of the building and the first interactive, VR-ready 360 panorama. Each additional viewing point from the same side of the model: €48. A point requiring an unseen side: €60 (one-off). For 5+ additional points: €53 per point.",
      },
      {
        q: "How is it different from a classic render?",
        a: "A classic exterior render (€250) is one image from one angle. A 360 panorama (€335) is an interactive view the client moves through on their own — a 360° view from a point, with the option of adding more points per building.",
      },
      {
        q: "Does it work in a VR headset?",
        a: "Yes. The panorama is VR-ready as standard — Meta Quest and compatible headsets open it straight from the browser, with no extra app.",
      },
      {
        q: "How long does it take?",
        a: "We send the first draft of the panorama in 3-5 working days from estimate confirmation and receipt of the architectural drawings. Three revision rounds are included.",
      },
      {
        q: "What do I need to send to get started?",
        a: "Architectural drawings (plans, sections, elevations) in PDF or DWG format. Optional: a facade material specification, photos of the location for context.",
      },
    ],
    variants: [
      {
        id: "exterior-360",
        title: "Interactive 360 panorama",
        basePrice: 335,
        priceLabel: "€335",
        unitLabel: "3D model + first 360 panorama",
        description:
          "The client turns around the building with a mouse or a VR headset. Ideal for remote presentations and online brochures.",
        included:
          "A full 3D model of the building + the first interactive 360 panorama ready for VR headsets (Meta Quest etc.).",
        addOns: [
          "Additional interactive point, same side of the model: €48",
          "Additional point requiring an unseen side: €60",
          "For 5+ additional points: €53 per point (volume discount)",
        ],
      },
    ],
  },
  {
    slug: "3d-streetscape",
    code: "exterior-aerial-dedicated",
    name: "3D streetscape",
    shortName: "3D streetscape",
    category: "exterior",
    icon: "camera",
    tagline: "Your building on its street, from every angle you need.",
    description:
      "A 3D streetscape (€420) models the whole setting — neighboring houses, the street and the plot — and shows your building primarily from a street-level perspective, with aerial views when needed. The right choice when the location doesn't exist yet, is hard to access, or you need a free choice of angle. For locations that exist and can be photographed there is a cheaper method — a render in a real photo from €300.",
    highlight:
      "The right presentation of location and context — for planning permission, board presentations and investor offers.",
    materials:
      "Send the architectural drawings (PDF/DWG), a site plan with the cadastral base, and optionally photos of the location. First draft in 3-5 working days.",
    asset: "/artwork/listing-streetscape.webp",
    listingAsset: "/artwork/listing-streetscape.webp",
    detailAsset: "/artwork/detail-streetscape.webp",
    detailBeforeAsset: "/artwork/problem-streetscape-street-before.webp",
    detailAfterAsset: "/artwork/problem-streetscape-street-after.webp",
    detailBeforeAlt:
      "2D site plan of a row of buildings along a street — layout of houses, parking, greenery and amenities",
    detailAfterAlt:
      "3D streetscape — a row of modern buildings with a tree line, parking and street context",
    philosophy:
      "The €420 price covers building a full 3D model of the building and its modeled surroundings, with two angles included. Since the model is already built, each additional angle costs €48 — 80% cheaper. An unseen or rear side of the building is added once (+25%, €105). No surprises later — everything is public in the price list.",
    priceContext:
      "€420 — a full 3D model of the building + surroundings + the first view. Next angle: €48.",
    forSegments: [
      "Developers (master plans)",
      "Investors (plots and complexes)",
      "Architects (regulatory presentations)",
    ],
    problemHeading: "The location doesn't exist yet. The buyer can't wait for it to be built.",
    problemBody:
      "A developer is selling apartments under construction. The location is an empty plot or construction has barely started. There is no photo of the surroundings, a drone has nothing to film, and the buyer wants visual proof that the building really will stand on that street, between those neighbors, on that plot. Without it — the buyer goes to someone who has a picture.",
    problemResolution:
      "A 3D streetscape builds the whole setting from drawings and cadastral data. Neighboring houses, the street, greenery and the building — all in one image. The buyer sees the future street before it is paved.",
    benefits: [
      {
        icon: "context",
        title: "A free choice of angle",
        body: "The surroundings are in 3D — you can ask for a street-level perspective, a view from the courtyard, an aerial angle or anything else. No photography constraints.",
      },
      {
        icon: "speed",
        title: "No waiting for site access",
        body: "We build from drawings and cadastral data. No photography, drone or site visit needed — work starts as soon as you send the drawings.",
      },
      {
        icon: "value",
        title: "A complete presentation in one order",
        body: "A street-level perspective for the brochure, an aerial angle for the board presentation, the rear side for regulatory materials — all from the same model. Each additional angle €48.",
      },
    ],
    processSteps: [
      {
        title: "Send the drawings",
        body: "PDF or DWG plans, elevations and a site plan with the cadastral base. Optional: material specification, photos of the location.",
      },
      {
        title: "Estimate confirmation",
        body: "We send the price and timeline within one working day. Paying the deposit starts production.",
      },
      {
        title: "Production and drafts",
        body: "We send first drafts in 3-5 working days. 3 revision rounds are included — no extra charge.",
      },
      {
        title: "Final files",
        body: "High resolution, PNG and TIFF, with an invoice. Ready to use for print, presentations and the web.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-streetscape-01.webp",
        alt: "3D streetscape — row of contemporary terraced houses, street perspective with neighbors — Elegant Render",
      },
      {
        src: "/artwork/portfolio-streetscape-02.webp",
        alt: "3D streetscape — corner residential building with ground-floor retail in an urban setting — Elegant Render",
      },
      {
        src: "/artwork/portfolio-streetscape-03.webp",
        alt: "3D streetscape — commercial building with retail units on a boulevard, street perspective — Elegant Render",
      },
      {
        src: "/artwork/portfolio-streetscape-04.webp",
        alt: "3D streetscape — classic villa in a row of neighboring buildings — Elegant Render",
      },
    ],
    faqs: [
      {
        q: "What exactly do I get for €420?",
        a: "A full 3D model of your building and its modeled surroundings (neighboring houses, the street, the plot), primarily from a street-level perspective — with 2 angles included. Each additional angle: €48. Unseen/rear side of the building: +25% (€105), one-off. Three revision rounds are included.",
      },
      {
        q: "Are the surroundings accurate or an approximation?",
        a: "The surroundings are a modeled approximation — neighboring houses are built from cadastral data and reference photos, but they are not a pixel-perfect copy of the real state. If you need pixel-real surroundings (e.g. for a planning committee that requires the real context), consider the render in a real photo of the location (€300).",
      },
      {
        q: "How is it different from the render in a real photo (€300)?",
        a: "The render in a photo uses a real photograph of the location as the background — the surroundings are pixel-real, but you are tied to the angle of the photo. The 3D streetscape models the whole setting in 3D — you can choose any angle, but the surroundings are an approximation. If the location exists and can be photographed, the render in a photo is cheaper and more credible. If the location doesn't exist or you need several angles, the 3D streetscape is the only option.",
      },
      {
        q: "What do I need to send to get started?",
        a: "Architectural drawings (plans, sections, elevations) in PDF or DWG format and a site plan with the cadastral base. Optional: a facade material specification and photos of the location or surroundings for reference.",
      },
      {
        q: "Does the service include an aerial (bird's-eye) view or only street level?",
        a: "The primary format is the street-level (eye-level) perspective — the building on its street, as a passer-by sees it. An aerial view is available as an additional angle from the same model for €48. Both come from the same modeled setting.",
      },
      {
        q: "How long does it take?",
        a: "We send first drafts in 3-5 working days from estimate confirmation and receipt of the drawings. Three revision rounds are included — no extra charge.",
      },
    ],
    pricingLead: {
      heading: "Two methods, one goal — one right choice for your location.",
      body: "A 3D streetscape (€420) is the right choice when the location doesn't exist yet or you need a free choice of camera angle — the surroundings are modeled in 3D. A render in a real photo (€300) is the right choice when the location exists and can be photographed — the surroundings are pixel-real because they come from an actual photograph. Choose based on what you have in hand.",
    },
    comparison: {
      aLabel: "3D streetscape — €420",
      bLabel: "Render in a photo — €300",
      rows: [
        { label: "Input material", a: "Architectural drawings", b: "A real photo of the location" },
        { label: "Surroundings", a: "Modeled in 3D (approximation)", b: "Pixel-real (actual photograph)" },
        { label: "Choice of angle", a: "Any angle (street or aerial)", b: "Tied to the photo's angle" },
        { label: "When to choose it", a: "The location doesn't exist or you need several angles", b: "The location exists and can be photographed" },
      ],
    },
    variants: [
      {
        id: "exterior-aerial",
        title: "3D streetscape",
        basePrice: 420,
        priceLabel: "€420",
        unitLabel: "full 3D model of the building + surroundings, street perspective",
        description:
          "The whole setting is modeled in 3D — neighboring houses, the street, the plot. The primary view is a street-level perspective; aerial and other angles are available as add-ons from the same model.",
        included:
          "A full 3D model of the building and surroundings, 2 angles included (primarily street-level perspective). Three revision rounds included.",
        addOns: [
          "Additional angle (street or aerial): €48 (80% cheaper)",
          "Unseen/rear side of the building: +25% (€105 one-off)",
        ],
        note: "The rear-side surcharge is charged once per model — after that, all angles are charged at the standard add-on price.",
      },
    ],
    crossSellVariants: [
      {
        id: "photomontage-main",
        title: "Render in a real photo of the location",
        basePrice: 300,
        priceLabel: "€300",
        unitLabel: "3D model + blending into a photo of the location",
        description:
          "When the location exists and can be photographed — the 3D model is blended into an actual photograph. Pixel-real surroundings, lower price.",
        included:
          "A complete 3D model of the building, blending into one photo of the location, matched light and shadows. One final render.",
        addOns: [
          "Additional angle from the same photo: €55 (82% cheaper)",
          "A second photo of the same location: €85",
          "Unseen side of the building: +25% one-off",
        ],
        note: "Exterior render €250 + photomontage +€50. The right choice when the location exists and can be photographed — maximum credibility for committees and public consultations.",
      },
    ],
  },
  {
    slug: "virtual-staging",
    code: "virtual-staging",
    name: "Virtual staging",
    shortName: "Virtual staging",
    category: "transformation",
    icon: "sparkles",
    tagline: "Empty rooms sell slowly — staged rooms sell faster.",
    description:
      "We turn a photo of an empty or poorly furnished space into a staged scene that sells. Ideal for real estate agents and owners — staging a photo costs 100× less than physically furnishing the apartment, and significantly increases clicks on the listing. A second room from the same property: 17% cheaper. A 10-image package: 28% cheaper per image.",
    highlight:
      "A practical way to make an empty property feel move-in ready and increase calls from the listing.",
    materials:
      "Send us high-resolution photos of the empty rooms and the furniture style you want.",
    asset: "/artwork/expert-virtual-staging-hero-after.webp",
    beforeAsset: "/artwork/expert-virtual-staging-hero-before.webp",
    afterAsset: "/artwork/expert-virtual-staging-hero-after.webp",
    detailAsset: "/artwork/detail-virtual-staging.webp",
    detailBeforeAsset: "/artwork/problem-virtual-staging-living-room-before.webp",
    detailAfterAsset: "/artwork/problem-virtual-staging-living-room-after.webp",
    detailBeforeAlt:
      "Empty living room before virtual staging — bare room with parquet flooring and large windows",
    detailAfterAlt:
      "The same living room after virtual staging — sofa, armchair, coffee table, rug and wall art",
    philosophy:
      "The first image covers the choice of furniture, style and lighting. Once the style is set, each additional angle of the same room is 33% cheaper, a second room 17% cheaper, and from 10+ images the price drops to €13/image. The whole property gets a complete listing package for a fraction of the cost of physical staging.",
    priceContext:
      "€18 first image · €15 second room · from €13/image for 10+ image packages.",
    forSegments: [
      "Real estate agencies",
      "Owners of empty units",
      "Real estate photographers (post-production)",
    ],
    featured: true,
    problemHeading: "An empty room feels cold. A staged one sells.",
    problemBody:
      "A buyer opens the listing, sees an empty apartment and moves on. Without furniture there is no sense of scale; without style there is no emotional response. Most agents know this — but physically staging an apartment costs thousands of euros and takes days.",
    problemResolution:
      "Virtual staging turns a photo of an empty room into an attractive scene in a single day — and into an extra click on the listing. Furniture, a rug, a lamp, a plant — everything in a style that suits the property.",
    benefits: [
      {
        icon: "speed",
        title: "Fast results",
        body: "Send the image today, receive the staged view within a few working days. No waiting for furniture delivery, no photographer appointments to organize.",
      },
      {
        icon: "value",
        title: "100× cheaper than physical staging",
        body: "Real furniture for presenting an apartment costs thousands of euros and takes days. Virtually it is €18 per image, €13 for 10+ image packages.",
      },
      {
        icon: "trust",
        title: "A style that suits the buyer",
        body: "Choose from several directions — modern minimalist, warm Scandinavian, classic. Restyling the same room: €12.",
      },
    ],
    processSteps: [
      {
        title: "Send the photos",
        body: "High-resolution photos of the empty rooms and 1-2 references for the furniture style you want.",
      },
      {
        title: "Estimate confirmation",
        body: "We send the price and timeline no later than the next working day, with no hidden items.",
      },
      {
        title: "Staging",
        body: "We place furniture, materials and lighting into your photos. First drafts in 3-5 working days.",
      },
      {
        title: "Delivery and revisions",
        body: "You receive finished images ready for the listing. Three revision rounds are included in the price — no extra charge.",
      },
    ],
    faqs: [
      {
        q: "What exactly do I get for €18?",
        a: "Photorealistic staging of one empty room based on your photo — furniture selection, placement and lighting matching included. Additional angle of the same room: €12 (33% discount). Second room of the same property: €15 (17% discount). 10+ image package: €13 per image (28% discount).",
      },
      {
        q: "Does it look real?",
        a: "Our staging is photorealistic — buyers usually can't tell the difference between our staged image and a photo of a genuinely furnished apartment. We transparently label that virtual staging was used, but that doesn't reduce the listing's effectiveness.",
      },
      {
        q: "Can I change the style if I don't like it?",
        a: "Yes. Restyling the same room: €12. Before that, three revision rounds are included at no extra charge — in them we change furniture, materials and lighting until the result is right.",
      },
      {
        q: "How long does it take?",
        a: "We send first drafts in 3-5 working days from estimate confirmation. 10+ image packages are delivered in stages — the first images within a week, the rest as agreed with you.",
      },
      {
        q: "Do you work with agencies with many listings?",
        a: "Yes. The 10+ image package is €13 per image (28% discount). Regular agents can arrange production priority and a consistent style line across all listings.",
      },
      {
        q: "What do I need to send to get started?",
        a: "Photos of the empty rooms in good resolution (at least 1920px on the longer side, not an angled phone snapshot) and 1-2 furniture style references.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-virtual-staging-01.webp",
        alt: "Virtual staging — modern living room with minimalist furniture",
      },
      {
        src: "/artwork/portfolio-virtual-staging-02.webp",
        alt: "Virtual staging — bedroom with warm materials",
      },
      {
        src: "/artwork/portfolio-virtual-staging-03.webp",
        alt: "Virtual staging — kitchen with a dining area and natural light",
      },
      {
        src: "/artwork/portfolio-virtual-staging-04.webp",
        alt: "Virtual staging — home office with shelving and natural light",
      },
    ],
    variants: [
      {
        id: "staging-static",
        title: "Classic photo staging",
        basePrice: 18,
        priceLabel: "€18",
        unitLabel: "first staged image",
        description:
          "A fast listing upgrade: an empty room becomes an attractive scene for €18. Each additional room 17% cheaper.",
        included:
          "Photorealistic staging of one empty room based on your photo. Includes furniture selection, placement and lighting matching.",
        addOns: [
          "Additional angle of the same room: €12 (33% discount)",
          "Second room of the same property: €15 (17% discount)",
          "10+ image package: €13 per image (28% discount)",
          "Restyling the same room: €12",
        ],
      },
      {
        id: "staging-360",
        title: "Interactive 360 staging",
        basePrice: 34,
        priceLabel: "€34",
        unitLabel: "first staged 360 panorama",
        description:
          "Buyers walk through the staged room with their mouse — perfect for online listings or remote presentations to a potential buyer.",
        included:
          "Complete staging of the first room as a 360 panorama viewable on your site or a VR headset.",
        addOns: [
          "Additional interactive point in the same room: €24 (30% discount)",
          "Second room of the same property: €28 (18% discount)",
          "6+ point package: €24 per point",
          "Restyling the same room: €22",
        ],
      },
    ],
  },
  {
    slug: "virtual-renovation",
    code: "virtual-renovation",
    name: "Virtual renovation",
    shortName: "Virtual renovation",
    category: "transformation",
    icon: "refresh",
    tagline: "See the renovated space before you spend on the work.",
    description:
      "Before you spend thousands of euros on floors, a kitchen or a bathroom, see what the space will look like. You avoid expensive material mistakes and speed up agreements with contractors. The first image covers the complete design; each additional angle of the same room is 10% cheaper (and from the 4th angle 20% cheaper).",
    highlight:
      "For owners planning a renovation, agents selling properties due for refurbishment and interior architects presenting concrete options to a client.",
    materials:
      "Send us photos of the current state and references for the new materials (floors, walls, furniture).",
    asset: "/artwork/expert-virtual-renovation-after.webp",
    beforeAsset: "/artwork/expert-virtual-renovation-before.webp",
    afterAsset: "/artwork/expert-virtual-renovation-after.webp",
    detailAsset: "/artwork/detail-virtual-renovation.webp",
    detailBeforeAsset: "/artwork/problem-virtual-renovation-kitchen-before.webp",
    detailAfterAsset: "/artwork/problem-virtual-renovation-kitchen-after.webp",
    detailBeforeAlt:
      "Dated kitchen with old wooden cabinets and tiles before virtual renovation",
    detailAfterAlt:
      "The same kitchen after virtual renovation — modern light cabinets, a marble wall, a white counter and new appliances",
    philosophy:
      "The first image covers the complete renovation design and material selection. Once the visual direction is set, each additional angle of the same room is 10% cheaper, and from the 4th angle 20% cheaper. Second room of the same property: 15% discount. A whole property fits a realistic budget before the builders arrive.",
    priceContext:
      "€66 first view · from €53 additional angle · €56 second room (15% discount).",
    forSegments: [
      "Property owners planning a renovation",
      "Interior architects",
      "Real estate agencies",
    ],
    featured: true,
    problemHeading: "Renovation is expensive. A material mistake — even more so.",
    problemBody:
      "The owner picks tiles from a catalog, floors from a sample, kitchen units from a showroom — and only sees them all together after the work is done. By then it is too late to fix. Contractors make changes with a follow-up bill.",
    problemResolution:
      "Virtual renovation shows the room's final look before you buy materials and before the builders arrive. You see everything together, try options and decide without risk.",
    benefits: [
      {
        icon: "value",
        title: "Fewer mistakes, lower costs",
        body: "An expensive material change after the work is done means new contractor costs. A render prevents them — you see the final look before you spend on builders.",
      },
      {
        icon: "speed",
        title: "Faster agreement with contractors",
        body: "A contractor knows exactly what they are building when they have renders — fewer questions, a shorter timeline, fewer mid-project changes.",
      },
      {
        icon: "trust",
        title: "Several options for little money",
        body: "€66 first view. Additional angle of the same room €59 (10% discount), from the 4th angle €53 (20% discount). Second room 15% cheaper. A whole property fits a realistic budget.",
      },
    ],
    processSteps: [
      {
        title: "Send your materials",
        body: "Photos of the room's current state and references for the new floors, walls and furniture. The clearer the input, the faster the drafts.",
      },
      {
        title: "Estimate confirmation",
        body: "We send the price and timeline no later than the next working day, with no hidden items.",
      },
      {
        title: "Renovation render",
        body: "We place the new materials, fixed elements, furniture and lighting. First drafts in 3-5 working days.",
      },
      {
        title: "Delivery and revisions",
        body: "You receive the final images. Three revision rounds are included in the price — we change materials, colors and layout until it is right.",
      },
    ],
    faqs: [
      {
        q: "What exactly do I get for €66?",
        a: "A complete visual transformation of one room based on your photo — including new floors, walls, fixed elements and furniture. Additional angle of the same room: €59 (10% discount). 4th and each subsequent angle: €53 (20% discount). Second room: €56 (15% discount).",
      },
      {
        q: "How is it different from virtual staging (€18)?",
        a: "Virtual staging (€18) changes only the furniture — walls, floors and fixed elements stay the same. Virtual renovation (€66) changes everything — tiles, floors, cabinets, the kitchen. Different purposes.",
      },
      {
        q: "How much do I actually save?",
        a: "An expensive material mistake discovered after the work usually costs 5-10× more than a single render. If we prevent one wrong choice of tiles or flooring, the render pays for itself.",
      },
      {
        q: "Can I try different options?",
        a: "Yes. Across three revision rounds we change materials and layout until it is right. An additional option on the same layout (different materials) counts as a new first view.",
      },
      {
        q: "How long does it take?",
        a: "We send first drafts in 3-5 working days from estimate confirmation and receipt of the photos and references. Final delivery depends on the number of revisions.",
      },
      {
        q: "What do I need to send to get started?",
        a: "Photos of the current state in good resolution, a layout plan (a floor plan if you have one) and references for the materials you want (floors, walls, cabinets, furniture).",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-virtual-renovation-01.webp",
        alt: "Virtual renovation — modern kitchen with an island and a stone countertop",
      },
      {
        src: "/artwork/portfolio-virtual-renovation-02.webp",
        alt: "Virtual renovation — bathroom with a glass shower and stone finishes",
      },
      {
        src: "/artwork/portfolio-virtual-renovation-03.webp",
        alt: "Virtual renovation — living room with new floors and warm materials",
      },
      {
        src: "/artwork/portfolio-virtual-renovation-04.webp",
        alt: "Virtual renovation — workspace with shelving and natural light",
      },
    ],
    variants: [
      {
        id: "renovation-main",
        title: "Visual renovation of a room",
        basePrice: 66,
        priceLabel: "€66",
        unitLabel: "first view of the renovated room",
        description:
          "The first view covers the complete design — the choice of floors, walls, fixed elements and furniture. Additional angles 10-20% cheaper.",
        included:
          "A complete visual transformation of one room based on your photo. Includes new floors, walls, fixed elements and furniture.",
        addOns: [
          "Additional angle of the same room: €59 (10% discount)",
          "4th and each subsequent angle of the same room: €53 (20% discount)",
          "Second room of the same property: €56 (15% discount)",
          "6th and each subsequent room of the same property: €50 (24% discount)",
        ],
      },
    ],
  },
  {
    slug: "2d-3d-floor-plans",
    code: "floor-plans",
    name: "2D and 3D floor plans",
    shortName: "2D and 3D floor plans",
    category: "plans",
    icon: "file-image",
    hideFromMenu: true,
    tagline: "A view of the space buyers understand at first glance.",
    description:
      "Clear 2D or 3D floor plans — for listings, sales, permits or interior planning. 2D gives a clean technical view; 3D gives a more attractive spatial view that buyers understand without an architecture background. The price covers one level (floor); duplicating an identical floor costs just a third of the price.",
    highlight:
      "Suited to real estate agencies that want listings to look professional and developers presenting the unit types in a building.",
    materials:
      "Send us technical drawings, dimensioned sketches or existing PDF plans.",
    asset: "/artwork/expert-floor-plans.webp",
    detailAsset: "/artwork/detail-floor-plans.webp",
    detailBeforeAsset: "/artwork/problem-floor-plans-before.webp",
    detailAfterAsset: "/artwork/problem-floor-plans-after.webp",
    philosophy:
      "The price covers producing the plan for one level. Each additional level of the same building is 50-66% cheaper because the style template is already set. An identical floor (duplicated with label changes) costs just a third of the base price. The whole building gets clear floor plans for a fraction of the price of a CAD studio.",
    priceContext:
      "€20 one level (clean 2D plan) / €29 one level (3D plan). Additional level: €10-15.",
    forSegments: [
      "Real estate agencies (listing materials)",
      "Developers (unit types in a building)",
      "Owners (interior planning)",
    ],
    featured: true,
    problemHeading: "A technical drawing scares buyers. A clear floor plan attracts them.",
    problemBody:
      "An agent lists an apartment with a CAD floor plan — heavy lines, dimension labels, scale bars. The buyer opens it, closes it, doesn't ask. The plan speaks a language a layperson doesn't understand — and the listing loses a call it would otherwise get.",
    problemResolution:
      "A clear 2D or 3D floor plan shows the room layout with colors, readable labels and furniture in the right places. Buyers understand what they are buying at first glance — the listing becomes a conversation.",
    benefits: [
      {
        icon: "trust",
        title: "Buyers understand at first glance",
        body: "With no technical background, buyers see the layout, dimensions and purpose of each room. The listing filters out casual calls.",
      },
      {
        icon: "speed",
        title: "Fast listing material",
        body: "€20 for 2D, €29 for 3D — a day's work, and you get a file for the listing, brochure and presentation.",
      },
      {
        icon: "value",
        title: "More levels of the same building for less",
        body: "An identical floor (duplicated with label changes): a third of the price. Each additional level of the same building: 50-66% cheaper.",
      },
    ],
    processSteps: [
      {
        title: "Send the floor plans",
        body: "Technical drawings, dimensioned sketches or existing PDF plans (PDF/DWG/sketch).",
      },
      {
        title: "Estimate confirmation",
        body: "We send the price and timeline no later than the next working day, with no hidden items.",
      },
      {
        title: "Plan production",
        body: "The team draws the 2D or 3D version with labels and dimensions. First draft in 1-3 working days.",
      },
      {
        title: "Delivery and revisions",
        body: "You receive the final plan in your preferred format. Three revision rounds are included in the price.",
      },
    ],
    faqs: [
      {
        q: "What exactly do I get for €20 / €29?",
        a: "€20 gives one level as a clean 2D vector plan with the room layout, labels and dimensions. €29 gives a 3D version of the same level — a spatial view buyers understand without an architecture background. An identical floor (duplicate): €6 (2D) / €10 (3D).",
      },
      {
        q: "2D or 3D — which should I choose?",
        a: "For an agency listing: 3D, because buyers understand it at first glance. For regulatory procedures or technical documentation: 2D, because it follows the technical standard. For a duplex listing: both (each floor serves a different purpose).",
      },
      {
        q: "Can furniture be added?",
        a: "Yes. A furnished version: €6 (2D) or €8 (3D). A design option (same layout, different furniture): €6.",
      },
      {
        q: "How long does it take?",
        a: "We send first drafts in 1-3 working days from estimate confirmation and receipt of the technical drawings. Three revision rounds are included.",
      },
      {
        q: "What do I need to send to get started?",
        a: "Technical drawings, dimensioned sketches or existing PDF plans. The clearer the input (CAD), the faster the production.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-floor-plans-01.webp",
        alt: "3D floor plan — family house with the room layout and furniture",
      },
      {
        src: "/artwork/portfolio-floor-plans-02.webp",
        alt: "3D floor plan — apartment with a compact layout",
      },
      {
        src: "/artwork/portfolio-floor-plans-03.webp",
        alt: "2D floor plan — clean technical plan with labels and dimensions",
      },
      {
        src: "/artwork/portfolio-floor-plans-04.webp",
        alt: "3D floor plan — duplex with the layout of both floors",
      },
    ],
    variants: [
      {
        id: "floorplan-2d",
        title: "2D floor plan (clean technical plan)",
        basePrice: 20,
        priceLabel: "€20",
        unitLabel: "one floor (2D plan)",
        description:
          "A fast entry point for a listing — a clear technical floor plan with the layout and dimensions. Identical floor: €6.",
        included:
          "One level as a clean 2D vector plan. Includes the room layout, labels and dimensions.",
        addOns: [
          "Two levels (duplex): €32",
          "Each additional level: €10",
          "Identical floor (duplicate): €6 (70% discount)",
          "Furnished version: €6",
          "Color / plan style change: €4",
        ],
        note: "2D floor plans are delivered through the White Rook partner network.",
      },
      {
        id: "floorplan-3d",
        title: "3D floor plan (spatial view)",
        basePrice: 29,
        priceLabel: "€29",
        unitLabel: "one floor (3D plan)",
        description:
          "Buyers understand the layout at first glance — no symbol reading. Ideal as the listing photo.",
        included:
          "One level as an attractive 3D view with the room layout, labels and dimensions.",
        addOns: [
          "Two levels (duplex): €46",
          "Each additional level: €15",
          "Identical floor (duplicate): €10 (66% discount)",
          "Adding furniture: €8",
          "Design option (same layout, different furniture): €6",
        ],
      },
    ],
  },
  {
    slug: "2d-floor-plans",
    code: "floor-plan-2d-dedicated",
    name: "2D floor plans",
    shortName: "2D floor plans",
    category: "plans",
    icon: "file-image",
    tagline: "A clean 2D floor plan — fast material for listings and documentation.",
    description:
      "A clear vector 2D floor plan with the room layout, room labels and dimensions in meters. The standard format for property listings, regulatory procedures and client presentations. €20 covers one level; an identical floor (duplicated with label changes) costs only €6 — 70% cheaper.",
    highlight:
      "The cheapest entry into a professional floor plan for a listing — no 3D budget, in a format that matches documentation and contracts.",
    materials:
      "Send technical drawings (PDF/DWG), dimensioned sketches or an existing PDF plan. First draft in 1-3 working days.",
    asset: "/artwork/listing-floorplan-2d.webp",
    listingAsset: "/artwork/listing-floorplan-2d.webp",
    detailAsset: "/artwork/detail-2d-floor-plans-2c.webp",
    detailBeforeAsset: "/artwork/problem-2d-floor-plans-black-white.webp",
    detailAfterAsset: "/artwork/problem-2d-floor-plans-color.webp",
    detailBeforeAlt:
      "Clean black-and-white 2D floor plan of a one-bedroom apartment with room names and dimensions in meters",
    detailAfterAlt:
      "Colored 2D floor plan of the same apartment with furniture — living room, bedroom, kitchen and bathroom",
    philosophy:
      "A 2D plan is the format that follows documentation, listings and contracts. The price covers one level as a clean vector plan with labels and dimensions. An identical floor (duplicated with label changes) costs only €6 — 70% cheaper. A building with several unit types gets its full listing series for a fraction of the price of a CAD studio. Delivery through the White Rook partner network ensures consistent quality and a short turnaround.",
    priceContext:
      "€20 — one level (clean 2D vector plan). Identical floor (duplicate): €6.",
    forSegments: [
      "Real estate agencies (listing materials)",
      "Developers (unit types in a building)",
      "Architects (documentation and annexes)",
    ],
    problemHeading: "A CAD export doesn't sell. A clear 2D plan does.",
    problemBody:
      "An agent lists an apartment with a raw CAD export — heavy lines, millimeter labels, scale bars and technical symbols for windows and doors. The buyer opens it, sees a drawing they don't understand and closes the listing. Technical documentation is not the same as marketing material.",
    problemResolution:
      "A clear 2D plan keeps the precision of CAD — accurate dimensions, layout, room descriptions — but in a format a layperson understands: colored, with room names, dimensions in meters and an optional furniture layer. The same floor plan, two audiences.",
    benefits: [
      {
        icon: "speed",
        title: "The fastest entry into a listing",
        body: "€20, first draft in 1-3 working days. The lowest entry price for a professional floor plan you can use directly in a listing.",
      },
      {
        icon: "value",
        title: "A third of the price per additional floor",
        body: "An identical floor (duplicated with label changes): only €6 — a 70% discount. A building with 5 unit types gets the whole series for €44.",
      },
      {
        icon: "trust",
        title: "A standard that follows documentation",
        body: "The 2D floor plan is the format contracts, banks and regulatory procedures expect. Use the same file in a brochure and in a court annex.",
      },
    ],
    processSteps: [
      {
        title: "Send the technical plan",
        body: "PDF, DWG, a dimensioned sketch or a photo of the existing plan. The clearer the input (CAD), the faster the production.",
      },
      {
        title: "Estimate confirmation",
        body: "We send the price and timeline no later than the next working day, with no hidden items.",
      },
      {
        title: "2D plan production",
        body: "The team draws a clean vector plan with labels, dimensions and optional furniture. First draft in 1-3 working days.",
      },
      {
        title: "Delivery and revisions",
        body: "You receive the final PDF and vector file. Three revision rounds are included in the price — no extra charge.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-2d-floor-plans-apartment-01-r2.webp",
        alt: "Colored 2D floor plan of a ground floor — living room, dining room and kitchen, Elegant Render",
        beforeSrc: "/artwork/portfolio-2d-floor-plans-apartment-01-before-r2.webp",
        beforeAlt: "Black-and-white technical 2D floor plan of the ground floor before coloring, Elegant Render",
      },
      {
        src: "/artwork/portfolio-2d-floor-plans-apartment-02-r2.webp",
        alt: "Colored 2D floor plan of a floor with a garage — bedroom, bathroom and garage, Elegant Render",
        beforeSrc: "/artwork/portfolio-2d-floor-plans-apartment-02-before-r2.webp",
        beforeAlt: "Black-and-white technical 2D floor plan of the floor with a garage before coloring, Elegant Render",
      },
      {
        src: "/artwork/portfolio-2d-floor-plans-apartment-03-r2.webp",
        alt: "Colored 2D floor plan of a level with a double garage — bedroom, bathroom and two parking spaces, Elegant Render",
        beforeSrc: "/artwork/portfolio-2d-floor-plans-apartment-03-before-r2.webp",
        beforeAlt: "Black-and-white technical 2D floor plan of the level with a double garage before coloring, Elegant Render",
      },
      {
        src: "/artwork/portfolio-2d-floor-plans-apartment-04-r2.webp",
        alt: "Colored 2D floor plan of an apartment — bedroom, bathroom, kitchen and living room, Elegant Render",
        beforeSrc: "/artwork/portfolio-2d-floor-plans-apartment-04-before-r2.webp",
        beforeAlt: "Black-and-white technical 2D floor plan of the apartment before coloring, Elegant Render",
      },
    ],
    faqs: [
      {
        q: "What exactly do I get for €20?",
        a: "One level as a clean 2D vector plan with the room layout, room labels and dimensions in meters. An identical floor (duplicated with label changes): €6 (70% discount). Furnished version: +€6. Color/style change: +€4.",
      },
      {
        q: "How is it different from a CAD export from my project?",
        a: "A CAD export follows the project's technical standard — heavy lines, millimeter labels, scale bars. Our 2D plan is a marketing format: colored, with or without furniture, with dimensions a layperson can read. Different purposes, not alternatives.",
      },
      {
        q: "When should I choose 2D over 3D?",
        a: "For regulatory procedures, contracts, technical documentation, or when the listing follows the industry's technical standard. For agency listings and lay presentations the 3D version (€29) performs better — buyers grasp the layout faster.",
      },
      {
        q: "Do you do multiple floors of a building?",
        a: "Yes. Two levels (duplex): €32. Each additional level: €10. An identical floor (duplicated with label changes): only €6 — 70% discount.",
      },
      {
        q: "How long does it take?",
        a: "We send first drafts in 1-3 working days from estimate confirmation and receipt of the technical drawings. Three revision rounds are included.",
      },
      {
        q: "What do I need to send to get started?",
        a: "Technical drawings (PDF/DWG), dimensioned sketches or a photo of the existing plan. The clearer the input (CAD), the faster the production.",
      },
    ],
    variants: [
      {
        id: "floorplan-2d",
        title: "2D floor plan (clean technical plan)",
        basePrice: 20,
        priceLabel: "€20",
        unitLabel: "one floor (2D plan)",
        description:
          "A fast entry point for a listing — a clear technical floor plan with the layout and dimensions. Identical floor: €6.",
        included:
          "One level as a clean 2D vector plan. Includes the room layout, labels and dimensions.",
        addOns: [
          "Two levels (duplex): €32",
          "Each additional level: €10",
          "Identical floor (duplicate): €6 (70% discount)",
          "Furnished version: €6",
          "Color / plan style change: €4",
        ],
        note: "2D floor plans are delivered through the White Rook partner network.",
      },
    ],
  },
  {
    slug: "3d-floor-plans",
    code: "floor-plan-3d-dedicated",
    name: "3D floor plans",
    shortName: "3D floor plans",
    category: "plans",
    icon: "layers",
    tagline: "A spatial 3D floor plan buyers understand at first glance.",
    description:
      "An attractive 3D spatial view of the floor plan with furniture, labels and colors. The strongest format for agency listings — buyers see the layout and each room's purpose without reading technical symbols. €29 covers one level; an identical floor (duplicated with label changes) costs only €10 — 66% cheaper.",
    highlight:
      "The right choice for the listing photo and brochure — buyers understand what they are getting at first glance.",
    materials:
      "Send technical drawings (PDF/DWG), dimensioned sketches or an existing PDF plan. First draft in 1-3 working days.",
    asset: "/artwork/listing-3d-floor-plans.webp",
    listingAsset: "/artwork/listing-3d-floor-plans.webp",
    detailAsset: "/artwork/detail-3d-floor-plans.webp",
    detailBeforeAsset: "/artwork/problem-3d-floor-plans-before.webp",
    detailAfterAsset: "/artwork/problem-3d-floor-plans-after.webp",
    detailBeforeAlt:
      "2D technical floor plan of an apartment before 3D treatment — lines, labels and the room layout",
    detailAfterAlt:
      "3D spatial floor plan of the same apartment after treatment — furniture, materials and colors from a bird's-eye perspective",
    philosophy:
      "The 3D spatial view is a marketing format — buyers see the layout with furniture and color, without reading labels. The €29 price covers one level. An identical floor (duplicated with label changes) costs only €10 — 66% cheaper. Duplexes and buildings with several unit types fit a realistic listing budget — without remodeling each level.",
    priceContext:
      "€29 — one level (3D spatial view). Identical floor (duplicate): €10.",
    forSegments: [
      "Real estate agencies (listing photo)",
      "Developers (unit types in a building)",
      "Owners (listing and sale)",
    ],
    problemHeading: "A technical floor plan scares buyers. A 3D view attracts them.",
    problemBody:
      "A buyer opens a listing with a 2D technical floor plan — lines, labels, symbols for windows and doors. They have to spend a minute just working out where the kitchen is. The next listing has a 3D view with furniture — and the buyer clicks to call.",
    problemResolution:
      "The 3D spatial view shows the layout from a bird's-eye perspective with furniture in the right places, floor materials and wall colors. Buyers see a home, not a diagram — and the decision starts from first contact.",
    benefits: [
      {
        icon: "trust",
        title: "Buyers understand without technical background",
        body: "No symbol reading — buyers see the rooms, furniture and flow. The listing attracts serious calls; casual ones drop off.",
      },
      {
        icon: "speed",
        title: "Fast listing material",
        body: "€29, first draft in 1-3 working days. Directly usable in listings, brochures and presentations.",
      },
      {
        icon: "value",
        title: "Several unit types for less",
        body: "An identical floor (duplicate): only €10 — a 66% discount. A building with 4 unit types gets a complete listing series for €59.",
      },
    ],
    processSteps: [
      {
        title: "Send the technical plan",
        body: "PDF, DWG, a dimensioned sketch or a photo of the existing plan. The clearer the input (CAD), the faster the production.",
      },
      {
        title: "Estimate confirmation",
        body: "We send the price and timeline no later than the next working day, with no hidden items.",
      },
      {
        title: "3D plan production",
        body: "The team models the space in 3D and places furniture, materials and lighting. First draft in 1-3 working days.",
      },
      {
        title: "Delivery and revisions",
        body: "You receive the final high-resolution image. Three revision rounds are included in the price — no extra charge.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-3d-floor-plans-one-bedroom-apartment.webp",
        alt: "3D floor plan of a one-bedroom apartment — living room, dining room, kitchen, bedroom and bathroom from a bird's-eye perspective",
      },
      {
        src: "/artwork/portfolio-3d-floor-plans-one-bedroom-open-concept.webp",
        alt: "3D floor plan of an open-concept one-bedroom apartment — connected living room, kitchen and dining room with a bedroom and bathroom",
      },
      {
        src: "/artwork/portfolio-3d-floor-plans-duplex-two-levels.webp",
        alt: "3D floor plan of a two-level duplex — ground floor with the living room and kitchen and an upper level with the bedroom",
      },
      {
        src: "/artwork/portfolio-3d-floor-plans-house-with-garage.webp",
        alt: "3D floor plan of a family house with a garage — three bedrooms, living room, dining room, kitchen and a two-car garage",
      },
    ],
    faqs: [
      {
        q: "What exactly do I get for €29?",
        a: "One level as an attractive 3D spatial view with the room layout, labels, furniture and materials. An identical floor (duplicated with label changes): €10 (66% discount). Adding furniture: +€8. Design option (same layout, different furniture): +€6.",
      },
      {
        q: "How is it different from an interior render?",
        a: "An interior render (€170 per floor) shows a room at eye level — as if you were standing inside. A 3D floor plan is a bird's-eye view of the whole floor with the roof removed — you see the layout, not the room. Different purposes; they are often ordered together for a brochure.",
      },
      {
        q: "When should I choose 3D over 2D?",
        a: "For agency listings, brochures and client presentations where the buyer is not an architect — 3D wins. For regulatory procedures, contracts or technical annexes the 2D version (€20) follows the industry standard.",
      },
      {
        q: "Can I order it with or without furniture?",
        a: "Both. Without furniture is the standard option. With furniture: +€8. A design option (same layout, different furniture — useful for buyer A/B tests): +€6.",
      },
      {
        q: "Do you do multiple floors of a building?",
        a: "Yes. Two levels (duplex): €46. Each additional level: €15. An identical floor (duplicated with label changes): only €10 — 66% discount.",
      },
      {
        q: "How long does it take?",
        a: "We send first drafts in 1-3 working days from estimate confirmation and receipt of the technical drawings. Three revision rounds are included.",
      },
    ],
    variants: [
      {
        id: "floorplan-3d",
        title: "3D floor plan (spatial view)",
        basePrice: 29,
        priceLabel: "€29",
        unitLabel: "one floor (3D plan)",
        description:
          "Buyers understand the layout at first glance — no symbol reading. Ideal as the listing photo.",
        included:
          "One level as an attractive 3D view with the room layout, labels and dimensions.",
        addOns: [
          "Two levels (duplex): €46",
          "Each additional level: €15",
          "Identical floor (duplicate): €10 (66% discount)",
          "Adding furniture: €8",
          "Design option (same layout, different furniture): €6",
        ],
      },
    ],
  },
  {
    slug: "vr-tour",
    code: "vr-tour-assembly",
    name: "VR tour",
    shortName: "VR tour",
    category: "animations",
    icon: "images",
    tagline: "Join your panoramas into a single tour buyers explore from an armchair.",
    description:
      "We join 360 panoramas you have already ordered (exterior, interior, staging) into a single VR tour with interactive navigation, hosting and an embed code for your site. Buyers open a link in a browser or a VR headset, move between points and explore the space on their own.",
    highlight:
      "A natural add-on to 360 panoramas you have already ordered — low price, fast delivery, ready for VR headsets.",
    materials:
      "Send the 360 panoramas you already have (from us or another source) and the navigation layout between points. We set up hosting in 1-2 working days.",
    asset: PORTFOLIO_ASSET,
    detailAsset: "/artwork/detail-interior-360.webp",
    embedSrc:
      "https://kuula.co/share/collection/7k7GQ?logo=1&info=0&fs=1&vr=1&sd=1&autorotate=0.04&autop=30&thumbs=1",
    detailEmbedSrc:
      "https://kuula.co/share/collection/7kLnB?logo=1&info=0&fs=1&vr=1&sd=1&autorotate=0.04&autop=30&thumbs=1",
    philosophy:
      "The 360 packages themselves (exterior €335, interior €295) already include one or more interactive points and an embed code. A VR tour becomes useful when you are connecting several panoramas from different projects or adding floor-plan navigation — then the assembly and hosting are a separate job.",
    priceContext:
      "€20 — assembly + hosting + embed code. Floor-plan navigation: €15. Tour branding: €35.",
    forSegments: [
      "Developers (complete project presentations)",
      "Real estate agencies (several apartments in one tour)",
      "Architects (client presentations with several rooms)",
    ],
    featured: true,
    problemEmbedSrc:
      "https://kuula.co/share/collection/714Xg?logo=0&info=0&fs=1&vr=1&sd=1&initload=0&thumbs=1",
    problemHeading: "Beautiful panoramas, poorly connected — buyers get lost.",
    problemBody:
      "You have 5 interior and 3 exterior 360 panoramas, but you send them as separate links. The buyer opens one, sees a room, has to click back to the email and open the next. They lose attention before touring half the apartment.",
    problemResolution:
      "A VR tour joins all your panoramas into a single walkthrough with interactive hotspots and floor-plan navigation. The buyer opens one link and tours the whole project — without losing context.",
    benefits: [
      {
        icon: "trust",
        title: "One link, the whole project",
        body: "All panoramas in one continuous walkthrough. Buyers see how the rooms connect, not fragments.",
      },
      {
        icon: "speed",
        title: "Fast delivery",
        body: "We assemble it in 1-2 working days. Hosting and the embed code are delivered the same day we finalize the structure.",
      },
      {
        icon: "value",
        title: "An affordable add-on to panoramas you already ordered",
        body: "€20 basic assembly. Floor-plan navigation: €15. Tour branding with your logo: €35.",
      },
    ],
    processSteps: [
      {
        title: "Send the panoramas",
        body: "The 360 panoramas you already have (links or files) and the navigation layout between points.",
      },
      {
        title: "Estimate confirmation",
        body: "We send the price and timeline no later than the next working day.",
      },
      {
        title: "Assembly and hosting",
        body: "We join the panoramas, add hotspot navigation and put the tour on our host. First draft in 1-2 working days.",
      },
      {
        title: "Link and embed code delivery",
        body: "You receive a shareable link and an embed code for your site. Three revision rounds for navigation and layout are included.",
      },
    ],
    faqs: [
      {
        q: "Does the VR tour include producing the panoramas?",
        a: "No. The VR tour is an add-on to panoramas that already exist. If we need to produce the panoramas first, order the exterior 360 (€335) or the interior 360 tour (€295) — those packages already include one interactive point and an embed code for the individual panorama.",
      },
      {
        q: "What if my panoramas aren't from you?",
        a: "Not a problem. We assemble any 360 panoramas in standard formats (equirectangular or stitched cube maps). Hosting is ours; the link is shareable and embed-friendly.",
      },
      {
        q: "Does it work in a VR headset?",
        a: "Yes. The tour is VR-ready as standard — Meta Quest and compatible headsets open it straight from the browser, with no extra app.",
      },
      {
        q: "How long does it take?",
        a: "1-2 working days from estimate confirmation and receipt of the panoramas.",
      },
      {
        q: "What do I need to send?",
        a: "The panoramas you already have (links or files), the navigation layout between points and, optionally, brand assets (logo, colors).",
      },
    ],
    variants: [
      {
        id: "tour-assembly",
        title: "VR tour — assembly and hosting",
        basePrice: 20,
        priceLabel: "€20",
        unitLabel: "assembly and hosting of the interactive tour",
        description:
          "When a set of 360 panoramas already exists, this step joins them into a single interactive tour on your site.",
        included:
          "Assembly of a virtual 360 tour from existing panoramas, hosting and sharing via a link or an embed on your site.",
        addOns: [
          "Interactive floor-plan navigation: €15",
          "A tour with your brand (logo, colors): €35",
        ],
        note: "This is an add-on to already produced 360 panoramas, not the price of producing the 360 content itself.",
      },
    ],
  },
  {
    slug: "architectural-animation",
    code: "architectural-animation",
    name: "Architectural animation",
    shortName: "Architectural animation",
    category: "animations",
    icon: "layers",
    tagline: "A marketing film where the camera flies through the building.",
    description:
      "An architectural animation turns your 3D model into a 30-second film where the camera flies through the building, revealing the space scene by scene. A marketing tool for brochures, investor presentations and social media campaigns. Minimum 15 seconds (€225).",
    highlight:
      "For developers who want a dramatic presentation of a complex and agencies that want the listing to be more than an image gallery.",
    materials:
      "Send the floor plans, elevations and, if you have one, an existing 3D model. Define the camera path and key moments you want.",
    asset: PORTFOLIO_ASSET,
    detailAsset: "/artwork/detail-exterior-aerial.webp",
    problemVideoSrc: "/artwork/architectural-animation-demo.mp4",
    problemVideoPoster: "/artwork/architectural-animation-demo-poster.webp",
    philosophy:
      "The biggest cost is building the 3D model. Animation from scratch: €15/sec. From an existing model: €10/sec (33% cheaper). An active project (model still in progress): €8/sec (47% cheaper). Longer animations get an automatic discount: over 60 sec −20%, over 2 minutes −25%.",
    priceContext:
      "€15/sec from scratch · €10/sec from an existing model · minimum 15 sec (€225).",
    forSegments: [
      "Developers (marketing campaigns)",
      "Real estate agencies (premium listings)",
      "Development projects (master plan presentations)",
    ],
    featured: true,
    problemHeading: "A static image doesn't move people. A film does.",
    problemBody:
      "A brochure with 10 images gets limited attention. The client scrolls, closes, doesn't remember. A social media campaign needs motion, not static frames.",
    problemResolution:
      "An architectural animation gives you 30 seconds of space the camera flies through, revealing the interior, exterior and context in a single narrative. The listing gets film-trailer quality.",
    benefits: [
      {
        icon: "speed",
        title: "Moves clients to the serious stage faster",
        body: "A client who sees the animation understands the project in 30 seconds. Consultations start with questions about details, not about the basic footprint.",
      },
      {
        icon: "value",
        title: "Lower price from an existing model",
        body: "If we have already produced your exterior or interior render, the model is there — the animation is €10/sec instead of €15/sec (33% discount). An active project: €8/sec (47% discount).",
      },
      {
        icon: "trust",
        title: "Material for every channel",
        body: "One animation becomes a YouTube video, an Instagram reel, a brochure embed and a meeting presentation. Multi-channel from a single investment.",
      },
    ],
    processSteps: [
      {
        title: "Send your materials",
        body: "Floor plans, elevations, an existing 3D model (if you have one) and a description of the camera path you want.",
      },
      {
        title: "Estimate confirmation",
        body: "We send the per-second price and the total budget within one working day.",
      },
      {
        title: "Animation",
        body: "We set the camera, materials and lighting, and render all the frames. First draft in 5-7 working days (depending on length).",
      },
      {
        title: "Delivery",
        body: "You receive the final film (MP4, 4K resolution). Three revision rounds for the camera path are included.",
      },
    ],
    faqs: [
      {
        q: "What exactly do I get for €225?",
        a: "15 seconds of animation from a new 3D model. Price per second: €15. If we already have your model: €10/sec (€150 for 15 sec). An active project (model in progress): €8/sec (€120 for 15 sec).",
      },
      {
        q: "How is it different from a video walkthrough?",
        a: "A video walkthrough films an existing space. An architectural animation builds a space that doesn't exist yet from drawings — you can film a building that hasn't been built, with accurate facade materials and surroundings.",
      },
      {
        q: "How fast do I get the animation?",
        a: "The standard timeline is 5-7 working days for 15-30 seconds. Longer animations are delivered in stages by agreement. Three revision rounds for the camera path are included.",
      },
      {
        q: "Can I change the camera path after the first draft?",
        a: "Yes. Across three revision rounds we change the path, speed, transitions and key moments. Materials, lighting and geometry are locked after the first revision.",
      },
      {
        q: "What do I need to send?",
        a: "Architectural drawings (PDF/DWG), an existing 3D model if you have one (FBX, OBJ, SKP), a description of the camera path and key moments. Optional: music or a sound brief.",
      },
    ],
    variants: [
      {
        id: "animation-from-scratch",
        title: "Architectural animation (from scratch)",
        basePrice: 15,
        priceLabel: "€15/sec",
        unitLabel: "per second (minimum 15 sec = €225)",
        description:
          "A marketing film where the camera flies through the building. Minimum 15 seconds. If we already have your model: 33% discount.",
        included:
          "Complete 3D model build + camera path design + animation rendering (minimum 15 sec).",
        addOns: [
          "If we already have your 3D model: €10/sec (33% discount)",
          "Active render project: €8/sec (47% discount)",
          "Additional camera path through the same model: €5/sec",
          "Night lighting version: +30%",
          "Seasonal variant (winter/summer): +40%",
          "Length discount: 31-60s −10%, 61-120s −20%, 120s+ −25%",
        ],
      },
    ],
  },
  {
    slug: "landscape-design",
    code: "landscape-rendering",
    name: "Landscape design",
    shortName: "Landscape design",
    category: "exterior",
    icon: "tree",
    tagline:
      "A 3D landscape from your plan, or a new image of your yard — without waiting for plants to grow.",
    description:
      "Two options — one result: see the finished outdoor space before the work starts or before you spend on planting. A landscape render (3D) from a plan starts at €220. A virtual renovation from a photo of your existing yard starts at €66.",
    highlight:
      "Suited to landscape architects presenting a project to a client and developers designing shared spaces in complexes.",
    materials:
      "Send us the site plan, elevation data and a specification of plants and materials.",
    asset: "/artwork/expert-landscape-design-after.webp",
    beforeAsset: "/artwork/expert-landscape-design-before.webp",
    afterAsset: "/artwork/expert-landscape-design-after.webp",
    detailAsset: "/artwork/detail-landscape-design.webp",
    detailBeforeAsset: "/artwork/problem-landscape-design-before.webp",
    detailAfterAsset: "/artwork/problem-landscape-design-after.webp",
    detailBeforeAlt:
      "Modern family house with a bare, unlandscaped plot before landscape design",
    detailAfterAlt:
      "Modern family house with a finished yard — a well-kept lawn, young plants and a paved path after landscape design",
    philosophy:
      "The landscape render price (€220) covers terrain modeling, vegetation in its mature state and the first view. Each additional angle of the same location is €45 — 80% cheaper, because the terrain is already built. Virtual renovation (€66) works differently: there is no 3D model — we place new materials and plants directly onto your photo. Faster and cheaper, but tied to the angle you photographed. Renovation add-ons: second angle €59, 4th and each subsequent €53, second yard €56. All prices are in EUR.",
    priceContext:
      "€220 — complete terrain + vegetation + the first view. Next angle: €45 (80% cheaper).",
    forSegments: [
      "Landscape architects (client presentations)",
      "Developers (shared spaces in complexes)",
      "Plot owners planning landscaping",
    ],
    problemHeading: "A bare plot doesn't show value. A finished landscape does.",
    problemBody:
      "The client looks at a landscape drawing full of symbols and can't see what the yard will actually look like. Without a visual, the designer can't defend the price of the landscaping, the developer doesn't get approval, and the plot buyer doesn't see the potential.",
    problemResolution:
      "A landscape render (€220) builds a complete 3D model of the terrain and vegetation from your plan — each additional angle of the same location is €45. A virtual renovation (€66) redesigns your existing yard directly on the photo — no 3D model, faster and cheaper.",
    benefits: [
      {
        icon: "trust",
        title: "The client sees the final result",
        body: "A landscape architect presents the project with a visualization that replaces dozens of explanations. The client signs faster.",
      },
      {
        icon: "context",
        title: "Proof of value for developers",
        body: "Shared spaces in a complex sell units. A render makes them tangible for the sales team, the fund and buyers.",
      },
      {
        icon: "value",
        title: "Several angles from one modeled terrain",
        body: "€220 covers the complete terrain and the first view. Each additional angle of the same location: €45 (80% cheaper).",
      },
    ],
    processSteps: [
      {
        title: "Send the plan",
        body: "The site plan, elevation data and a specification of plants and materials (stone, paving, water features).",
      },
      {
        title: "Estimate confirmation",
        body: "We send the price and timeline no later than the next working day, with no hidden items.",
      },
      {
        title: "Modeling and rendering",
        body: "The team models the terrain and places vegetation, paths and materials. We send first drafts in 3-5 working days.",
      },
      {
        title: "Delivery and revisions",
        body: "You receive the final visuals. Three revision rounds are included in the price — no extra charge.",
      },
    ],
    faqs: [
      {
        q: "Why is virtual renovation cheaper than the 3D render?",
        a: "A landscape render (€220) builds a complete 3D model of the terrain and vegetation from the plan — a longer process that allows a free choice of camera angle and aerial views. A virtual renovation (€66) doesn't build a 3D model — we place new materials and plants directly onto your photo. It is faster and cheaper, but tied to the angle and perspective of the photo. If the space doesn't exist yet or you need several angles, the 3D render is the only option.",
      },
      {
        q: "What exactly do I get for €220?",
        a: "Complete terrain modeling, vegetation and path placement, and the first final render. Each additional angle of the same location: €45 (80% discount). Surcharge for an unseen side of the terrain: +25% once per model. An aerial view of the whole location: €380.",
      },
      {
        q: "How is it different from a classic exterior render?",
        a: "An exterior render shows the building's facade and its surroundings. A landscape render focuses on the landscaping — paved paths, plants in their mature state, accent stone, water features. Different purposes.",
      },
      {
        q: "How detailed is the vegetation?",
        a: "Vegetation is shown at realistic maturity — not as if planted yesterday, but as it will look in 2-3 years. You choose deciduous/evergreen, accent trees and ornamental plants from our catalog or from references.",
      },
      {
        q: "Do you also work on residential complexes, not just private yards?",
        a: "Yes. Shared spaces in residential complexes are an equally common scenario. The only difference is the size of the terrain — the price stays €220 for the first view, additional angles €45.",
      },
      {
        q: "How long does it take?",
        a: "We send first drafts in 3-5 working days from estimate confirmation and receipt of the site plan. Three revision rounds are included.",
      },
      {
        q: "What do I need to send to get started?",
        a: "The site plan in PDF or DWG format, terrain elevation data and a specification or references for plants and materials (stone, paving, water features).",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-landscape-design-01.webp",
        alt: "Landscape design — private yard of a family house with a terrace and lawn",
      },
      {
        src: "/artwork/portfolio-landscape-design-02.webp",
        alt: "Landscape design — shared space of a residential complex with walking paths",
      },
      {
        src: "/artwork/portfolio-landscape-design-03.webp",
        alt: "Landscape design — villa yard with a pool and terrace",
      },
      {
        src: "/artwork/portfolio-landscape-design-04.webp",
        alt: "Landscape design — public space with a paved path and mature planting",
      },
    ],
    pricingLead: {
      heading: "How do you choose the right option?",
      body: "The space doesn't exist yet — you are building from a plan and need different angles or an aerial view? Choose the landscape render (3D). The yard already exists — you want to see how it will look after landscaping, quickly and without a 3D model? Choose the virtual renovation.",
    },
    variants: [
      {
        id: "landscape-main",
        title: "Landscape render (3D)",
        basePrice: 220,
        priceLabel: "€220",
        unitLabel: "terrain + vegetation + first view",
        description:
          "A complete 3D model of the terrain and vegetation from your plan. The right choice when the space doesn't exist yet — construction, design or an investor presentation. Each additional angle of the same location 80% cheaper.",
        included:
          "Complete terrain modeling, vegetation placed in its mature state, paths and materials, and 1 final render. Three revision rounds included.",
        addOns: [
          "Next angle of the same location: €45 (80% cheaper)",
          "Surcharge for an unseen side of the terrain: +25% once per model",
          "Aerial view of the whole location: €380",
        ],
        note: "You start from a site plan, elevation data and a plant specification. We send first drafts in 3-5 working days from estimate confirmation.",
      },
    ],
    crossSellVariants: [
      {
        id: "landscape-reno",
        title: "Virtual renovation from a photo",
        basePrice: 66,
        priceLabel: "€66",
        unitLabel: "first view of the renovated yard",
        description:
          "Send a photo of your existing yard — we redesign the space directly on the image, with no 3D model. Faster and cheaper than a landscape render. The right choice when you have a photo and just want to see how it would look landscaped.",
        included:
          "A complete visual transformation of the yard based on your photo — new surfaces, vegetation, paths, fixed elements and terrace furniture.",
        addOns: [
          "Second angle of the same location: €59 (10% cheaper)",
          "4th and each subsequent angle: €53 (20% cheaper)",
          "A second yard of the same property: €56 (15% cheaper)",
        ],
        note: "You start from a photo of the current state and references for the new materials and plants. This option is tied to the photo's angle — for a free choice of camera use the landscape render (3D).",
        configuratorCategory: "transformation",
      },
    ],
  },
  {
    slug: "photomontage",
    code: "photomontage",
    name: "Render in a real photo of the location",
    shortName: "Render in a photo",
    category: "exterior",
    icon: "camera",
    tagline:
      "An exterior render in a photo of your location — for €50 more than the standard render.",
    description:
      "This is the standard exterior render (€250) with the photomontage option included (+€50 = €300 total). That €50 means we don't place the 3D model of the building into synthetic surroundings — we blend it directly into a photo of the location you provide, with matched light, shadows and perspective. The result looks like the building is already there. Ideal for planning committees, public consultations and investor presentations where the committee has to see your building in the real context of the street. You can also order the exterior render without this option — just €250, with synthetic surroundings. The other method (3D streetscape, €420) models the whole setting in 3D — the right choice when the location can't be photographed or you need a free choice of angle.",
    highlight:
      "For projects where realism and the authenticity of the location decisively change how the project is perceived — permits, public consultations, investor presentations.",
    materials:
      "Send us a high-resolution photo of the location and a 3D model or the architectural drawings of the building.",
    asset: "/artwork/expert-photomontage-after.webp",
    beforeAsset: "/artwork/expert-photomontage-before.webp",
    afterAsset: "/artwork/expert-photomontage-after.webp",
    detailAsset: "/artwork/detail-photomontage.webp",
    detailBeforeAsset: "/artwork/problem-photomontage-street-before.webp",
    detailAfterAsset: "/artwork/problem-photomontage-street-after.webp",
    detailBeforeAlt:
      "Empty plot on a street between existing buildings — a real photo of the location before the building is blended in",
    detailAfterAlt:
      "The same street shot with the 3D render of the new building blended in — a render in a real photo of the location",
    philosophy:
      "The price has two parts. The exterior render (€250) covers building a complete 3D model of your building and the first final render. It is the same model and the same work — whether it stands in synthetic surroundings or in a photo of the location. The photomontage (+€50) is an option that changes only the background: instead of modeled surroundings, the 3D model is blended into an actual photograph — we match the perspective, light and shadows to the moment the photo was taken. The surcharge is justified because analyzing the photo and matching the perspective take extra work the standard render doesn't include. The exterior render is also available on its own for €250 — when synthetic surroundings suit you. If you need more angles: the next angle from the same photo is €55 (82% cheaper), a second photo of the same location €85, an unseen side of the building +25% once per model.",
    priceContext:
      "€300 — blending + the first view. Next angle from the same photo: €55 (82% cheaper).",
    forSegments: [
      "Developers (planning permission, public consultations)",
      "Architects (client presentations)",
      "Master plan and development studios",
    ],
    problemHeading: "The committee doesn't imagine. The committee sees a photograph.",
    problemBody:
      "An architectural drawing says how tall the building is and where it stands. It doesn't say how it looks in the yard between the neighboring houses, in afternoon light, with the greenery already on that street. A planning committee or a plot buyer wants exactly that — and without it they decide based on assumption.",
    problemResolution:
      "You photograph the location and send us the drawings — we blend the 3D model into your photo. The perspective, shadows and lighting are matched to the actual moment the photo was taken. The committee sees exactly what will stand on that spot.",
    benefits: [
      {
        icon: "trust",
        title: "Pixel-real surroundings",
        body: "The neighboring houses, trees, fence, shadows — all real, because they come from your photo. Nobody can claim the surroundings are 'beautified' or invented.",
      },
      {
        icon: "context",
        title: "Ideal for regulatory procedures",
        body: "Planning committees and public consultations require a view in the real context. A render in a photo of the location meets that requirement directly — no extra explanations.",
      },
      {
        icon: "value",
        title: "Economical for several angles",
        body: "The first photo is €300 — each additional angle from the same photo is €55 (82% cheaper). Three shots of the same location come to €410 in total.",
      },
    ],
    processSteps: [
      {
        title: "Send your materials",
        body: "A high-resolution photo of the location and a 3D model or the architectural drawings of the building.",
      },
      {
        title: "Estimate confirmation",
        body: "We send the price and timeline no later than the next working day, with no hidden items.",
      },
      {
        title: "Analysis and blending",
        body: "We analyze the photo's perspective, light and shadows, then blend in the 3D model of the building. First draft in 3-5 working days.",
      },
      {
        title: "Delivery and revisions",
        body: "You receive a photorealistic view ready for permits, presentations and marketing. Three revision rounds included.",
      },
    ],
    faqs: [
      {
        q: "What makes up the €300 price? Can I order just the exterior render?",
        a: "€300 is two separate parts: the exterior render (€250) + the photomontage option (+€50). The exterior render includes building a complete 3D model of the building and one final render — that is the base. The photomontage (+€50) means we blend that 3D model into a real photo of the location you provide instead of synthetic surroundings, with matched light, shadows and perspective. If synthetic surroundings suit you (e.g. for a sales brochure with no regulatory purpose), you can order just the exterior render for €250 — the photomontage option is not mandatory.",
      },
      {
        q: "What exactly do I get for €300?",
        a: "A complete 3D model of your building and one final render — the 3D model is blended into a photo of the location you provide, with matched light, shadows and perspective. Three revision rounds are included.",
      },
      {
        q: "Who takes the photo of the location?",
        a: "You do — or someone you hire. A phone with a good camera is enough, as long as the photo is sharp and taken at eye level (not from a car seat). We send you short shooting instructions when you confirm the order.",
      },
      {
        q: "How is it different from the 3D streetscape (€420)?",
        a: "The render in a photo uses a real photograph of the location as the background — the surroundings are pixel-real, but you are tied to the photo's angle. The 3D streetscape models the whole setting in 3D — you can choose any angle, but the surroundings are an approximation, not a real photo. If the location exists and can be photographed, the render in a photo gives a more credible result for less money.",
      },
      {
        q: "Does this work for houses too, not just larger buildings?",
        a: "Yes. The method doesn't depend on the building type — it works for family houses, residential buildings, commercial buildings and any other type whose drawings you can provide.",
      },
      {
        q: "What if the location wasn't photographed from the right angle?",
        a: "Before starting we check the photo and let you know if the angle doesn't work for the planned shot. In that case you can provide a new photo or switch to the 3D streetscape — which doesn't depend on a photograph.",
      },
      {
        q: "How long does it take?",
        a: "We send first drafts in 3-5 working days from estimate confirmation and receipt of the drawings and the photo. Three revision rounds are included — no extra charge.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-photomontage-01.webp",
        alt: "Photomontage — family house blended into a real street photo",
      },
      {
        src: "/artwork/portfolio-photomontage-02.webp",
        alt: "Photomontage — residential building in an urban context",
      },
      {
        src: "/artwork/portfolio-photomontage-03.webp",
        alt: "Photomontage — commercial building blended into a photo of the location",
      },
      {
        src: "/artwork/portfolio-photomontage-04.webp",
        alt: "Photomontage — villa blended into a natural setting",
      },
    ],
    pricingLead: {
      heading: "Two methods, one goal — one right choice for your location.",
      body: "A render in a real photo (€300) is the right choice when the location exists and can be photographed — it gives maximum credibility because it uses the real surroundings. A 3D streetscape (€420) is the right choice when the location doesn't exist yet, is hard to access, or you need several angles without photography constraints. Choose based on what you have in hand.",
    },
    comparison: {
      aLabel: "Render in a photo — €300",
      bLabel: "3D streetscape — €420",
      rows: [
        { label: "Input material", a: "A real photo of the location", b: "Architectural drawings" },
        { label: "Surroundings", a: "Pixel-real (actual photograph)", b: "Modeled in 3D (approximation)" },
        { label: "Choice of angle", a: "Tied to the photo's angle", b: "Any angle (street or aerial)" },
        { label: "When to choose it", a: "The location exists and can be photographed", b: "The location doesn't exist or you need several angles" },
      ],
    },
    variants: [
      {
        id: "photomontage-main",
        title: "Render in a real photo of the location",
        basePrice: 300,
        priceLabel: "€300",
        unitLabel: "exterior render €250 + photomontage +€50",
        decomposition: "Exterior render €250 + photomontage €50",
        description:
          "The 3D model of the building is blended into a photo of the location you provide — matched light, shadows and perspective. Maximum credibility for committees, public consultations and buyer presentations.",
        included:
          "A complete 3D model of the building (the same as the standard exterior render), scene and lighting set to match the photo of the location, one blend into one photo you provide — one final render. Three revision rounds included. The photomontage option is pre-selected in the configurator — the cart shows it line by line: exterior render €250 + photomontage €50 = €300.",
        addOns: [
          "Additional angle from the same photo: €55 (82% cheaper)",
          "A second photo of the same location (a different shooting angle): €85",
          "Unseen side of the building: +25% one-off",
        ],
        note: "Price: exterior render €250 + photomontage +€50 = €300. You can also order the exterior render without the photomontage — just €250 with synthetic surroundings. The photomontage option adds blending into a real photo of the location.",
      },
    ],
    crossSellVariants: [
      {
        id: "exterior-aerial",
        title: "3D streetscape",
        basePrice: 420,
        priceLabel: "€420",
        unitLabel: "full 3D model of the building + surroundings",
        description:
          "When the location doesn't exist or you need several angles without photography constraints — the whole setting is modeled in 3D, primarily from a street-level perspective.",
        included:
          "A full 3D model of the building and surroundings (neighboring houses, the street, the plot), street-level perspective and 2 angles included.",
        addOns: [
          "Additional angle: €48 (80% cheaper)",
          "Unseen/rear side of the building: +25% (€105 one-off)",
        ],
        note: "The right choice when the location isn't available to photograph yet or you need a free choice of camera angle.",
      },
    ],
  },
  {
    slug: "site-plans",
    code: "3d-site-plans",
    name: "Site plans",
    shortName: "Site plans",
    category: "plans",
    icon: "layers",
    tagline: "The whole plot from the air — an investor offer in a single image.",
    description:
      "A complete aerial view of the plot: terrain, all buildings, roads, parking, vegetation and landscaping. Investor material for offers, planning permission and selling larger complexes. Next angle of the same plot: 81% cheaper. Construction phases and seasonal variants are ordered from the same scene.",
    highlight:
      "For master plans, residential complexes, business zones and development projects where you are selling the location, not just a building.",
    materials:
      "Send us CAD drawings of the whole plot, building positions and the landscaping plan.",
    asset: "/artwork/expert-3d-site-plan.webp",
    detailAsset: "/artwork/detail-3d-site-plan.webp",
    detailBeforeAsset: "/artwork/problem-3d-site-plan-plan-before.webp",
    detailAfterAsset: "/artwork/problem-3d-site-plan-after.webp",
    detailBeforeAlt:
      "2D site plan of a residential complex — layout of buildings, parking, greenery and amenities",
    detailAfterAlt:
      "3D aerial site plan of the residential complex — buildings, parking and plot landscaping",
    philosophy:
      "The price covers building the complete terrain and placing the buildings, roads and landscape. Once the scene is built, each additional angle costs €65 (81% cheaper), a seasonal variant (winter/summer) €85, and a construction-phase view €95. The developer gets visual material for every stage of the campaign — the pre-sale phase, the opening of the first building and so on — from a single model.",
    priceContext:
      "€350 — the whole plot: terrain + buildings + landscape + the first aerial view.",
    forSegments: [
      "Investors and developers",
      "Urban planners and master plan studios",
      "Architects (investor presentations)",
    ],
    problemHeading: "A 2D site plan looks like a map. A 3D one shows the project.",
    problemBody:
      "A fund, partner or regulator opens the site plan and sees lines. It isn't clear where the entrance is, how the site is accessed, what is shared space and what is private. The conversation stalls at 'can I see a render'.",
    problemResolution:
      "A 3D site plan shows the same plot with all its buildings, access routes, vegetation and context — the developer answers the question before it is asked. The material serves the regulatory procedure and the sales campaign at the same time.",
    benefits: [
      {
        icon: "context",
        title: "The whole plot in a single image",
        body: "The developer answers the fund with one visual instead of a folder of drawings. A competitive advantage in investor offers.",
      },
      {
        icon: "trust",
        title: "Material for permits and marketing",
        body: "The same model serves both regulatory procedures and sales campaigns — no remodeling.",
      },
      {
        icon: "value",
        title: "More visuals from the same scene",
        body: "€350 covers the complete terrain. Additional angle €65, seasonal variant €85, construction-phase view €95 — no remodeling.",
      },
    ],
    processSteps: [
      {
        title: "Send the CAD plan",
        body: "CAD drawings of the whole plot, building positions and typologies, the landscaping plan and the surrounding context (PDF/DWG).",
      },
      {
        title: "Estimate confirmation",
        body: "We send the price and timeline no later than the next working day, with no hidden items.",
      },
      {
        title: "Scene modeling",
        body: "The team models the terrain, buildings, roads, parking and landscape. We send first drafts in 3-5 working days.",
      },
      {
        title: "Delivery and revisions",
        body: "You receive the final aerial view. Three revision rounds are included in the price — no extra charge.",
      },
    ],
    faqs: [
      {
        q: "What exactly do I get for €350?",
        a: "Modeling of the whole plot (terrain, buildings, roads, parking, vegetation, landscape) and the first final aerial view. Additional angle of the same plot: €65 (81% discount). Seasonal variant (winter/summer): €85. Construction-phase view: €95.",
      },
      {
        q: "How is it different from the 3D streetscape (€420)?",
        a: "The 3D streetscape (€420) focuses on a single building with its surroundings (neighboring houses, the street). The site plan (€350) shows the whole plot with all its buildings and development — master plan level, from the air. The first is for an individual building in its street context, the second for a whole complex from above.",
      },
      {
        q: "Can it be used for planning permission?",
        a: "Yes. A site plan is a standard annex in planning procedures. The 3D view is far easier for a committee to understand than a classic technical drawing.",
      },
      {
        q: "Can I order construction phases?",
        a: "Yes. The construction-phase view (€95) shows the same plot at different stages of development — before construction, first phase complete, second phase underway and so on. The investor campaign gets visual material for every phase.",
      },
      {
        q: "How long does it take?",
        a: "We send first drafts in 3-5 working days from estimate confirmation and receipt of the CAD plan. Three revision rounds are included.",
      },
      {
        q: "What do I need to send to get started?",
        a: "CAD drawings of the whole plot (DWG), building positions and typologies, the landscaping plan and the surrounding context. Optional: facade material and landscape references.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-3d-site-plan-01.webp",
        alt: "3D site plan — residential complex with 3 buildings, a shared space and parking zones",
      },
      {
        src: "/artwork/portfolio-3d-site-plan-02.webp",
        alt: "3D site plan — mixed-use development with residential and commercial buildings",
      },
      {
        src: "/artwork/portfolio-3d-site-plan-03.webp",
        alt: "3D site plan — plots with family houses and individual yards",
      },
      {
        src: "/artwork/portfolio-3d-site-plan-04.webp",
        alt: "3D site plan — first construction phase visible, later phases hinted as context",
      },
    ],
    variants: [
      {
        id: "site-plan-main",
        title: "3D site plan",
        basePrice: 350,
        priceLabel: "€350",
        unitLabel: "complete plot + the first aerial view",
        description:
          "Full terrain, all buildings, roads and landscape — investor material. Next angle of the same plot: €65.",
        included:
          "Modeling of the whole plot: terrain, buildings, roads, parking, vegetation and landscape. Includes 1 final aerial view.",
        addOns: [
          "Additional angle of the same plot: €65 (81% discount)",
          "Seasonal variant (winter/summer): €85",
          "Construction-phase view (visibility per phase): €95",
        ],
      },
    ],
  },
  {
    slug: "day-to-dusk",
    code: "day-to-dusk",
    name: "Day-to-dusk",
    shortName: "Day-to-dusk",
    category: "transformation",
    icon: "sun",
    tagline: "A daytime shot gets a warm evening feel.",
    description:
      "Sky replacement, lighting correction and a warm glow in the windows — a daytime exterior photo becomes an attractive evening listing. For 10+ images the price drops to €8/image (20% discount).",
    highlight:
      "For real estate agents and developers when the same scene is needed in both a daytime and an evening version for a marketing campaign.",
    materials: "Send us high-resolution daytime exterior photos.",
    asset: "/artwork/expert-day-to-dusk-after.webp",
    beforeAsset: "/artwork/expert-day-to-dusk-before.webp",
    afterAsset: "/artwork/expert-day-to-dusk-after.webp",
    detailAsset: "/artwork/detail-day-to-dusk.webp",
    detailBeforeAsset: "/artwork/problem-day-to-dusk-facade-before.webp",
    detailAfterAsset: "/artwork/problem-day-to-dusk-facade-after.webp",
    detailBeforeAlt:
      "Modern house facade photographed in daylight before the day-to-dusk conversion",
    detailAfterAlt:
      "The same modern house in the evening view — a lit facade, warm interiors and ambient lighting under a starry sky",
    outsourced: true,
    philosophy:
      "Fast post-production with a clear per-image price. 10+ image package: €8/image (20% discount). Rush delivery within 24h: +50%.",
    priceContext: "€10 per image · €8 per image for 10+ packages.",
    forSegments: [
      "Real estate agencies (dramatic listing photos)",
      "Developers (campaigns with day/evening variants)",
      "Real estate photographers (post-production)",
    ],
    problemHeading: "A daytime photo doesn't sell. A warm evening one does.",
    problemBody:
      "An agent shoots the building in the middle of the day with flat light and a blue sky — a functional image, but without emotion. Those photos look like hundreds of other listings. The client scrolls on.",
    problemResolution:
      "Replacing the sky and adding warm window lighting and facade accents turns a daytime image into a dramatic evening view. The listing gets emotional pull without a reshoot or an evening appointment.",
    benefits: [
      {
        icon: "speed",
        title: "No reshoot",
        body: "You send the daytime photo you already have. No waiting for a dusk slot, no photographer fees per outing.",
      },
      {
        icon: "value",
        title: "€10 per image, €8 in packages",
        body: "One image €10; 10+ image packages drop to €8 per image (20% discount). A complete apartment or house campaign for a fraction of the cost of a new shoot.",
      },
      {
        icon: "trust",
        title: "A listing that stands out",
        body: "A dramatic dusk look in a real estate gallery sets the listing apart from the rest and increases clicks.",
      },
    ],
    processSteps: [
      {
        title: "Send the photos",
        body: "High-resolution daytime exterior photos (DSLR/mirrorless ideally, not an angled phone snapshot).",
      },
      {
        title: "Estimate confirmation",
        body: "We send the price and timeline no later than the next working day. Rush 24h delivery is available for +50%.",
      },
      {
        title: "Transformation",
        body: "The team replaces the sky, color-grades the lighting and adds accent lights to windows and the facade. Standard timeline 3-5 working days.",
      },
      {
        title: "Delivery",
        body: "You receive final images ready for listings and campaigns. Optional removal of unwanted shadows for €5 per image.",
      },
    ],
    faqs: [
      {
        q: "What exactly do I get for €10?",
        a: "Transformation of one daytime exterior photo into a dramatic evening view — including sky replacement and lighting adjustment. Unwanted shadow removal: €5 per image. 10+ image package: €8 per image (20% discount). Rush 24h delivery: +50%.",
      },
      {
        q: "Does it look real or like a filter?",
        a: "Our version is photorealistic — window lighting, facade lamps and glass reflections follow the building's real geometry. It is not an Instagram filter; every light source is placed carefully for each photo.",
      },
      {
        q: "Can I get both the daytime and the evening version of the same photo?",
        a: "Yes. The original daytime version stays untouched; we deliver the evening one in addition. Agency packages often include both sets — daytime for the listing, evening for social media and marketing campaigns.",
      },
      {
        q: "How long does it take?",
        a: "The standard timeline is 3-5 working days per image. Rush 24h delivery is available for +50%. 10+ image packages are delivered in stages by agreement.",
      },
      {
        q: "Do you work with agencies with many listings?",
        a: "Yes. The 10+ image package is €8 per image (20% discount). Regular agents can arrange production priority and a consistent light-grading line across all listings.",
      },
      {
        q: "What do I need to send to get started?",
        a: "Daytime exterior photos in good resolution (DSLR or mirrorless, at least 3000px on the longer side). We don't recommend angled phone photos.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-day-to-dusk-01.webp",
        alt: "Day-to-dusk — family house with lit windows and facade lighting",
      },
      {
        src: "/artwork/portfolio-day-to-dusk-02.webp",
        alt: "Day-to-dusk — residential building with lit terraces in evening mode",
      },
      {
        src: "/artwork/portfolio-day-to-dusk-03.webp",
        alt: "Day-to-dusk — villa with a lit pool and terrace",
      },
      {
        src: "/artwork/portfolio-day-to-dusk-04.webp",
        alt: "Day-to-dusk — commercial building with facade lighting and a lit entrance",
      },
    ],
    variants: [
      {
        id: "day-to-dusk-main",
        title: "Day-to-dusk",
        basePrice: 10,
        priceLabel: "€10",
        unitLabel: "per image",
        description:
          "Sky replacement, lighting and color grading for one image. 10+ package: €8/image.",
        included:
          "Transformation of one daytime exterior photo into a dramatic evening view. Includes sky replacement and lighting adjustment.",
        addOns: [
          "Unwanted shadow removal: €5",
          "10+ image package: €8 per image (20% discount)",
          "Rush delivery within 24h: +50%",
        ],
      },
    ],
  },
  {
    slug: "item-removal",
    code: "item-removal",
    name: "Item removal",
    shortName: "Item removal",
    category: "transformation",
    icon: "eraser",
    tagline: "A clean photo sells faster than a cluttered one.",
    description:
      "Digital removal of unwanted items from a photo: personal belongings, vehicles, cables, clutter, or larger objects with background reconstruction. A fast listing upgrade without physically clearing the space. 10+ image package: volume discount.",
    highlight:
      "For real estate agents and photographers when a space has to be shown clean and physical tidying isn't cost-effective or feasible.",
    materials:
      "Send us the photos and clearly mark the items you want removed.",
    asset: "/artwork/expert-uklanjanje-elemenata-after.webp",
    beforeAsset: "/artwork/expert-uklanjanje-elemenata-before.webp",
    afterAsset: "/artwork/expert-uklanjanje-elemenata-after.webp",
    detailAsset: "/artwork/detail-uklanjanje-elemenata.webp",
    detailBeforeAsset: "/artwork/problem-item-removal-room-before.webp",
    detailAfterAsset: "/artwork/problem-item-removal-room-after.webp",
    detailBeforeAlt:
      "Room with a chandelier, chairs and belongings before digital item removal",
    detailAfterAlt:
      "The same room after item removal — an emptied space without furniture or decoration",
    outsourced: true,
    philosophy:
      "Simple removal (small items, personal belongings): €12. Complex (a large object with background reconstruction): €25. 10+ image package: €10 simple / €20 complex per image.",
    priceContext:
      "€12 simple / €25 complex · 10+ package: €10 / €20.",
    forSegments: [
      "Real estate agencies (clean listing photos)",
      "Photographers (post-production of empty units)",
      "Developers (clutter-free marketing materials)",
    ],
    problemHeading: "Clutter in a photo steals attention. A clean frame keeps it.",
    problemBody:
      "The client doesn't tidy the apartment before the photo shoot. Personal belongings, cables, boxes, vehicles parked in front of the facade — it all ends up in the listing and pulls the buyer's attention away from the space. Physical tidying isn't cost-effective, and the photographer has no time to wait.",
    problemResolution:
      "We digitally remove clutter and unwanted objects from the photo, reconstructing the background where needed. The listing looks clean without a single hour of physical work on site.",
    benefits: [
      {
        icon: "speed",
        title: "No physical tidying",
        body: "The photographer shoots what they find, you send the image — we remove the clutter. No waiting for someone to empty the apartment, no extra appointment to organize.",
      },
      {
        icon: "value",
        title: "Two tiers by complexity",
        body: "Small items and personal belongings: €12. A large object with background reconstruction: €25. 10+ image packages drop to €10 / €20 per image.",
      },
      {
        icon: "trust",
        title: "A background that looks real",
        body: "For complex removal we reconstruct the background (wall, tiles, parquet) so the result looks like the item was never there.",
      },
    ],
    processSteps: [
      {
        title: "Send the photos",
        body: "Photos with the items you want removed clearly marked (a comment in the email or a screenshot with markings).",
      },
      {
        title: "Estimate confirmation",
        body: "We send the price (simple €12 or complex €25) and the timeline no later than the next working day.",
      },
      {
        title: "Removal",
        body: "The team removes the marked items and reconstructs the background where needed. Standard timeline 3-5 working days.",
      },
      {
        title: "Delivery",
        body: "You receive final images ready for the listing. Three revision rounds are included.",
      },
    ],
    faqs: [
      {
        q: "What exactly do I get for €12?",
        a: "Digital removal of small items and personal belongings from one photo. Complex removal (a large object with background reconstruction): €25. Additional image — simple: €8 (33% discount). Additional image — complex: €18 (28% discount). 10+ package: €10 / €20 per image.",
      },
      {
        q: "How do I know if my case is simple or complex?",
        a: "Simple: personal belongings, magazines, cables, mugs — items where the background (wall, table, floor) stays visible and is easy to patch. Complex: large appliances, parked vehicles, kitchen units — where the background is reconstructed from scratch. Send the photo and we confirm the tier in the estimate.",
      },
      {
        q: "Does the background reconstruction look real?",
        a: "Yes. We combine context from the same photo (light, perspective) with material reconstruction (tiles, parquet, wall) so the result carries no removal 'stamps'. Three revision rounds are included if any detail isn't right.",
      },
      {
        q: "How long does it take?",
        a: "The standard timeline is 3-5 working days per image. 10+ image packages are delivered in stages by agreement — the first images earlier, the rest on schedule.",
      },
      {
        q: "What do I need to send to get started?",
        a: "Photos in good resolution and clear marking of the items you want removed (a comment in the email, a screenshot with markings, or a list in text).",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-uklanjanje-elemenata-01.webp",
        alt: "Item removal — living room tidied for the listing photo",
      },
      {
        src: "/artwork/portfolio-uklanjanje-elemenata-02.webp",
        alt: "Item removal — kitchen with a reconstructed background after appliance removal",
      },
      {
        src: "/artwork/portfolio-uklanjanje-elemenata-03.webp",
        alt: "Item removal — bathroom with empty shelves ready for the photo",
      },
      {
        src: "/artwork/portfolio-uklanjanje-elemenata-04.webp",
        alt: "Item removal — exterior facade without the parked vehicle and visible cables",
      },
    ],
    variants: [
      {
        id: "item-removal-main",
        title: "Item removal",
        basePrice: 12,
        priceLabel: "€12",
        unitLabel: "per image (simple)",
        description:
          "€12 simple (small items, personal belongings) / €25 complex (large objects). 10+ package: volume discount.",
        included:
          "Digital removal of items, clutter or personal belongings from one photo, with background reconstruction.",
        addOns: [
          "Complex removal (background reconstruction): €25",
          "Additional image — simple: €8 (33% discount)",
          "Additional image — complex: €18 (28% discount)",
          "10+ image package: €10 simple / €20 complex",
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
      return `${service.name} - source image before visual editing`;
    case "after":
      return `${service.name} - final visual after editing`;
    case "problem":
      return `${service.name} - problem and solution example for ${category}`;
    case "listing":
      return `${service.name} - service example from the ${category} category`;
    case "portfolio":
      return `${service.name} - portfolio example of a delivered visual`;
    case "hero":
      return `${service.name} - ${service.tagline}`;
    case "og":
      return `${service.name} - Elegant Render ${category}`;
    case "detail":
    default:
      return `${service.name} - architectural visualization example by Elegant Render`;
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
