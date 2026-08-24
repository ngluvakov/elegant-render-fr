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
  exterior: "Extérieur",
  interior: "Intérieur",
  plans: "Plans",
  animations: "Animations et visites",
  transformation: "Transformation d’espace",
};

export const CATEGORY_DESCRIPTIONS: Record<ServiceCategory, string> = {
  exterior:
    "Vues des bâtiments, de leurs abords et des espaces extérieurs — pour maisons, immeubles résidentiels et projets de plus grande envergure.",
  interior:
    "Visualisation des espaces intérieurs, pièce par pièce ou par niveau entier.",
  plans:
    "Des vues 2D et 3D claires de la disposition des pièces et de parcelles entières.",
  animations:
    "Animations architecturales et visites 360° interactives pour des présentations riches.",
  transformation:
    "Valorisation d’espaces existants — staging, rénovation et corrections photo.",
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
    name: "Rendus d’intérieur",
    shortName: "Rendus d’intérieur",
    category: "interior",
    icon: "home",
    hideFromMenu: true,
    tagline: "Montrez aux acheteurs leur futur logement avant même l’arrivée des artisans sur le chantier.",
    description:
      "Montrez aux acheteurs ou à vos clients l’aspect futur de chaque pièce de leur logement — avant le début des travaux. Une seule commande couvre un niveau entier — 10 rendus d’intérieur statiques + un plan du niveau. Vendez un appartement dès la brochure, validez les choix de matériaux avec votre client ou présentez un intérieur avant sa construction.",
    highlight:
      "Pour les appartements en construction, les maisons à rénover et les lots de promoteurs — un seul investissement couvre le niveau entier, pas une seule pièce.",
    materials:
      "Envoyez-nous le plan du niveau (2D ou PDF), des références de style et la liste des pièces. Plus les éléments sont clairs, plus vite nous envoyons les premières ébauches — en général sous 3 à 5 jours ouvrés.",
    asset: "/artwork/expert-interior-renders.webp",
    detailAsset: "/artwork/detail-interior-renders.webp",
    philosophy:
      "L’essentiel du travail consiste à construire le modèle 3D — nous le construisons une fois et ne le facturons qu’une fois. Ensuite, chaque nouvel angle, changement de mobilier ou moment de la journée démarre dès €10, et non au prix d’un rendu complet. Vous planifiez ainsi votre budget marketing pour la saison de pré-commercialisation sans mauvaises surprises.",
    priceContext:
      "Niveau entier — 10 rendus d’intérieur statiques + un plan du niveau.",
    forSegments: [
      "Promoteurs (programmes multi-lots)",
      "Architectes d’intérieur",
      "Particuliers préparant une rénovation",
    ],
    featured: true,
    variants: [
      {
        id: "interior-static",
        title: "Rendus statiques — par niveau",
        basePrice: 170,
        priceLabel: "€170",
        unitLabel: "niveau entier — 10 rendus statiques",
        description:
          "La combinaison la plus efficace pour les brochures et la présentation de lots de promoteurs — un seul investissement couvre le niveau entier : 10 rendus statiques + un plan du niveau.",
        included:
          "Modèle 3D complet construit pour un niveau. Comprend 10 rendus d’intérieur statiques et un plan du niveau. Chaque niveau supplémentaire : €120 (30 % moins cher).",
        addOns: [
          "11e pièce meublée et chaque pièce suivante : €28",
          "Angle de vue supplémentaire dans une pièce existante : €10",
          "Niveau supplémentaire : €120 (remise de 30 %)",
        ],
      },
      {
        id: "interior-360",
        title: "Visite 360° interactive — par niveau",
        basePrice: 295,
        priceLabel: "€295",
        unitLabel: "niveau entier en visite 360°",
        description:
          "Les acheteurs parcourent l’espace à la souris, comme dans un jeu — parfait pour les présentations immobilières en ligne et la pré-commercialisation à distance.",
        included:
          "Jusqu’à 10 pièces interactives dans une visite 360° (le client entre dans l’espace et le parcourt) + 10 angles de vue statiques supplémentaires + un plan du niveau.",
        addOns: [
          "11e pièce interactive et chaque pièce suivante : €45",
          "Point interactif supplémentaire dans une pièce existante : €27",
          "Angle de vue statique supplémentaire : €10",
          "Niveau supplémentaire (visite 360°) : €205 (remise de 30 %)",
        ],
      },
    ],
  },
  {
    slug: "interior-render",
    code: "interior-static-dedicated",
    name: "Rendus d’intérieur",
    shortName: "Rendus d’intérieur",
    category: "interior",
    icon: "home",
    tagline: "Montrez aux acheteurs leur logement avant le début des travaux.",
    description:
      "Une vue photoréaliste de chaque pièce d’un futur appartement ou d’une future maison — avec des matériaux fidèles, l’agencement du mobilier et la lumière naturelle. €170 couvre un niveau entier — 10 rendus d’intérieur statiques + un plan du niveau. Vendez un lot sur plan à un acheteur qui voit exactement ce qu’il achète.",
    highlight:
      "Le bon choix pour les brochures de vente sur plan, la présentation d’options de matériaux aux clients et le marketing avant l’ouverture des ventes.",
    materials:
      "Envoyez le plan du niveau (2D ou PDF), des références de style et la liste des pièces. Première ébauche sous 3 à 5 jours ouvrés.",
    asset: "/artwork/expert-interior-renders.webp",
    listingAsset: "/artwork/listing-interior-static.webp",
    detailAsset: "/artwork/detail-interior-static.webp",
    problemAsset: "/artwork/problem-interior-static-after.webp",
    detailBeforeAsset: "/artwork/problem-interior-static-before.webp",
    detailAfterAsset: "/artwork/problem-interior-static-after.webp",
    philosophy:
      "L’essentiel du travail consiste à construire le modèle 3D du niveau — nous le construisons une fois et ne le facturons qu’une fois. Ensuite, chaque nouvel angle de la même pièce coûte €10, une pièce supplémentaire sur le même niveau €28, un deuxième niveau €120 (30 % moins cher). Vous planifiez ainsi votre budget marketing pour la saison de pré-commercialisation sans surprises.",
    priceContext:
      "€170 — niveau entier : 10 rendus d’intérieur statiques + un plan du niveau.",
    forSegments: [
      "Promoteurs (pré-commercialisation multi-lots)",
      "Architectes d’intérieur (présentations clients)",
      "Particuliers préparant une rénovation",
    ],
    problemHeading: "Les acheteurs n’achètent pas un plan. Ils achètent un logement où ils se projettent.",
    problemBody:
      "Le promoteur montre le plan d’un appartement, l’acheteur compte les mètres carrés et s’en va. Les traits et les libellés ne disent rien des matériaux, de la lumière ni de l’atmosphère d’une pièce. La décision est repoussée jusqu’à ce que l’espace puisse être vu sur place — et à ce moment-là, la construction est souvent déjà terminée.",
    problemResolution:
      "Un rendu d’intérieur transforme le plan en un espace reconnaissable — avec des matériaux fidèles, un choix de mobilier et la lumière naturelle. L’acheteur ouvre la brochure, reconnaît la pièce où il vivra et prend sa décision.",
    benefits: [
      {
        icon: "speed",
        title: "Des ventes avant la construction",
        body: "Les lots sur plan partent plus vite quand l’acheteur voit la pièce réelle — avec de vrais matériaux, pas un dessin. L’écart de vitesse de vente rembourse l’investissement dès les premiers lots.",
      },
      {
        icon: "trust",
        title: "Des choix de matériaux sans malentendus",
        body: "Le client choisit entre les options à partir des rendus — il voit le sol, les murs et le mobilier ensemble au lieu de les imaginer. Les litiges à la livraison diminuent.",
      },
      {
        icon: "value",
        title: "Un seul forfait couvre le niveau entier",
        body: "€170 couvre 10 rendus d’intérieur statiques + un plan du niveau. Soit €17 par rendu — nettement moins cher qu’une commande à l’unité.",
      },
    ],
    processSteps: [
      {
        title: "Envoyez le plan du niveau",
        body: "Un plan du niveau en PDF ou DWG, des références de style et la liste des pièces. En option : spécification des matériaux, photos d’inspiration.",
      },
      {
        title: "Confirmation du devis",
        body: "Nous envoyons le prix et le délai sous un jour ouvré, sans frais cachés.",
      },
      {
        title: "Production et ébauches",
        body: "L’équipe construit le modèle 3D du niveau et règle les matériaux, le mobilier et l’éclairage. Premières ébauches sous 3 à 5 jours ouvrés.",
      },
      {
        title: "Livraison et révisions",
        body: "Vous recevez les visuels finaux en haute résolution. Trois séries de révisions sont incluses dans le prix — sans supplément.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-interior-static-01.webp",
        alt: "Salon avec îlot de cuisine — Elegant Render",
      },
      {
        src: "/artwork/portfolio-interior-static-02.webp",
        alt: "Cuisine avec suspensions et plan de travail en pierre — Elegant Render",
      },
      {
        src: "/artwork/portfolio-interior-static-03.webp",
        alt: "Chambre principale avec éclairage indirect et palette chaleureuse — Elegant Render",
      },
      {
        src: "/artwork/portfolio-interior-static-04.webp",
        alt: "Salle de bains avec lumière naturelle et finitions en marbre — Elegant Render",
      },
    ],
    faqs: [
      {
        q: "Que comprend exactement le prix de €170 ?",
        a: "Un modèle 3D complet d’un niveau avec 10 rendus d’intérieur statiques et un plan du niveau. Chaque niveau supplémentaire : €120 (30 % moins cher). 11e pièce sur le même niveau : €28.",
      },
      {
        q: "En quoi est-ce différent de la tarification à la pièce pratiquée ailleurs ?",
        a: "Le standard du marché est la facturation à la pièce. Nous facturons au niveau — €170 pour 10 rendus statiques. Soit €17 par rendu. La logique : le modèle est déjà construit quand nous passons d’une pièce à l’autre — nous le facturons donc une fois au lieu de dix.",
      },
      {
        q: "Puis-je changer les matériaux ou le mobilier par la suite ?",
        a: "Trois séries de révisions sont incluses dans le prix. Après la première livraison, nous modifions les sols, les murs, le mobilier ou l’éclairage jusqu’à ce que le résultat soit juste. Une option de design supplémentaire (autre mobilier sur le même agencement) est disponible en option.",
      },
      {
        q: "Quel est le délai de livraison ?",
        a: "Nous envoyons les premières ébauches sous 3 à 5 jours ouvrés après la confirmation du devis et la réception des plans. La livraison finale dépend du nombre de révisions — les trois séries sont incluses.",
      },
      {
        q: "Que dois-je envoyer pour commencer ?",
        a: "Le plan du niveau (PDF ou DWG) avec la disposition des pièces, la liste des pièces à rendre et des références de style. En option : spécification des matériaux (sols, façades, portes), photos d’inspiration, exemples d’ambiance.",
      },
      {
        q: "Réalisez-vous le rendu d’une seule pièce ?",
        a: "Le forfait standard couvre un niveau, car le modèle 3D représente la plus grande partie du travail. Une pièce seule est possible sur demande, mais à la pièce ce n’est pas plus économique que le forfait — nous recommandons au minimum un niveau entier.",
      },
    ],
    variants: [
      {
        id: "interior-static",
        title: "Rendus statiques — par niveau",
        basePrice: 170,
        priceLabel: "€170",
        unitLabel: "niveau entier — 10 rendus statiques",
        description:
          "Une seule commande couvre un niveau entier : 10 rendus statiques + un plan du niveau. Chaque niveau supplémentaire 30 % moins cher.",
        included:
          "Modèle 3D complet construit pour un niveau. Comprend 10 rendus d’intérieur statiques et un plan du niveau. Chaque niveau supplémentaire : €120 (30 % moins cher).",
        addOns: [
          "11e pièce meublée et chaque pièce suivante : €28",
          "Angle de vue supplémentaire dans une pièce existante : €10",
          "Niveau supplémentaire : €120 (remise de 30 %)",
        ],
      },
    ],
  },
  {
    slug: "interior-360-tour",
    code: "interior-360-tour-dedicated",
    name: "Visite 360° (intérieur)",
    shortName: "Visite 360° (intérieur)",
    category: "interior",
    icon: "home",
    tagline: "Les acheteurs visitent l’appartement depuis leur fauteuil — avant sa construction.",
    description:
      "Une visite 360° interactive à travers un niveau entier. Le client ouvre un lien dans son navigateur ou son casque VR, passe de pièce en pièce et explore lui-même l’agencement et les matériaux. €295 couvre jusqu’à 10 pièces interactives + 10 angles de vue statiques supplémentaires + un plan du niveau.",
    highlight:
      "Une présentation pour les acheteurs à distance et des décisions sans visite sur place — les promoteurs l’utilisent pour la vente sur plan, les agences pour les achats à distance.",
    materials:
      "Envoyez le plan du niveau (2D ou PDF), des références de style et la liste des pièces pour la visite interactive. Première ébauche sous 3 à 5 jours ouvrés.",
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
      "L’essentiel du travail consiste à construire le modèle 3D du niveau — nous le construisons une fois et ne le facturons qu’une fois. Ensuite, chaque point interactif supplémentaire dans la même pièce coûte €27, une pièce supplémentaire €45, un angle statique supplémentaire €10, un deuxième niveau €205 (30 % moins cher). Un parcours complet reste ainsi dans un budget promoteur réaliste.",
    priceContext:
      "€295 — un niveau entier en visite 360° avec jusqu’à 10 pièces interactives + 10 angles statiques + un plan du niveau.",
    forSegments: [
      "Promoteurs (pré-commercialisation sur plan)",
      "Agences immobilières (démonstrations à distance)",
      "Architectes d’intérieur (présentations clients)",
    ],
    problemHeading: "Un plan fige l’agencement en deux dimensions. Une visite l’ouvre.",
    problemBody:
      "Une image statique donne un seul angle depuis une seule pièce. L’acheteur ne perçoit pas les relations entre les pièces — la perspective de la cuisine vers le salon, le passage du couloir à la chambre. Il demande une image de plus — puis une autre — et repousse sa décision.",
    problemResolution:
      "Une visite 360° relie toutes les pièces en un parcours unique. Les acheteurs entrent eux-mêmes dans l’appartement, passent de pièce en pièce à la souris ou avec un casque VR, examinent l’agencement et les matériaux — et prennent leur décision depuis leur fauteuil.",
    benefits: [
      {
        icon: "trust",
        title: "Un appartement dans le navigateur",
        body: "L’acheteur ouvre un lien sur son téléphone, son ordinateur ou son casque VR — sans installation, sans compte. Il entre dans l’espace instantanément.",
      },
      {
        icon: "speed",
        title: "Des ventes sans visites",
        body: "Un acheteur qui vit à l’étranger voit le lot entier au moment qui lui convient. Le promoteur n’attend pas que l’acheteur se déplace sur le site.",
      },
      {
        icon: "value",
        title: "Un seul forfait couvre le niveau entier",
        body: "€295 couvre jusqu’à 10 pièces interactives et 10 angles statiques. Soit moins de €30 par pièce — moins qu’un seul rendu 360° ailleurs.",
      },
    ],
    processSteps: [
      {
        title: "Envoyez le plan du niveau",
        body: "Un plan du niveau en PDF ou DWG, des références de style, la liste des pièces pour la visite et, si vous le souhaitez, l’emplacement des points interactifs.",
      },
      {
        title: "Confirmation du devis",
        body: "Nous envoyons le prix et le délai sous un jour ouvré, sans frais cachés.",
      },
      {
        title: "Production et visite",
        body: "L’équipe construit le modèle 3D et règle les matériaux, l’éclairage et les points interactifs. Nous envoyons la première ébauche de la visite sous 3 à 5 jours ouvrés.",
      },
      {
        title: "Livraison du lien et du code d’intégration",
        body: "Vous recevez un lien à partager et un code d’intégration pour votre site. Trois séries de révisions sont incluses dans le prix — sans supplément.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-interior-360-01.webp",
        alt: "Image extraite d’une visite 360° — salon et cuisine ouverte, transition entre les pièces",
      },
      {
        src: "/artwork/portfolio-interior-360-02.webp",
        alt: "Image extraite d’une visite 360° — chambre principale avec éclairage indirect",
      },
      {
        src: "/artwork/portfolio-interior-360-03.webp",
        alt: "Image extraite d’une visite 360° — entrée et perspective à travers l’appartement",
      },
      {
        src: "/artwork/portfolio-interior-360-04.webp",
        alt: "Image extraite d’une visite 360° — terrasse et transition vers l’intérieur",
      },
    ],
    faqs: [
      {
        q: "Comment le client ouvre-t-il la visite ?",
        a: "Nous envoyons un lien et un code d’intégration. Le client l’ouvre dans son navigateur — sans installation, sans compte. Cela fonctionne sur téléphone, ordinateur et casques VR Meta Quest (le mode VR est intégré à la visite).",
      },
      {
        q: "Que comprend exactement le prix de €295 ?",
        a: "Un modèle 3D complet d’un niveau avec jusqu’à 10 pièces interactives dans une visite 360°, 10 angles de vue statiques supplémentaires et un plan du niveau. 11e pièce interactive et chaque pièce suivante : €45. Point interactif supplémentaire : €27. Angle statique supplémentaire : €10. Niveau suivant : €205 (remise de 30 %).",
      },
      {
        q: "Quelle différence avec le rendu d’intérieur statique (€170) ?",
        a: "Un rendu statique donne des angles de vue fixes — l’acheteur voit une image depuis une position. Une visite 360° relie toutes les pièces en un parcours — les acheteurs entrent eux-mêmes dans l’espace, font pivoter la vue et se déplacent entre les points. Des usages différents, pas des alternatives.",
      },
      {
        q: "Cela fonctionne-t-il avec un casque VR ?",
        a: "Oui. La visite est prête pour la VR en standard — les casques Meta Quest et compatibles l’ouvrent directement depuis le navigateur, sans application supplémentaire.",
      },
      {
        q: "Quel est le délai de livraison ?",
        a: "Nous envoyons la première ébauche de la visite sous 3 à 5 jours ouvrés après la confirmation du devis et la réception des plans. Trois séries de révisions sont incluses — sans supplément.",
      },
      {
        q: "Que dois-je envoyer pour commencer ?",
        a: "Le plan du niveau (PDF ou DWG) avec la disposition des pièces, la liste des pièces pour la visite interactive et des références de style. En option : spécification des matériaux (sols, façades, portes), photos d’inspiration.",
      },
    ],
    variants: [
      {
        id: "interior-360",
        title: "Visite 360° interactive — par niveau",
        basePrice: 295,
        priceLabel: "€295",
        unitLabel: "niveau entier en visite 360°",
        description:
          "Les acheteurs parcourent l’espace à la souris, comme dans un jeu — parfait pour les présentations immobilières en ligne et la pré-commercialisation à distance.",
        included:
          "Jusqu’à 10 pièces interactives dans une visite 360° (le client entre dans l’espace et le parcourt) + 10 angles de vue statiques supplémentaires + un plan du niveau.",
        addOns: [
          "11e pièce interactive et chaque pièce suivante : €45",
          "Point interactif supplémentaire dans une pièce existante : €27",
          "Angle de vue statique supplémentaire : €10",
          "Niveau supplémentaire (visite 360°) : €205 (remise de 30 %)",
        ],
      },
    ],
  },
  {
    slug: "exterior-renders",
    code: "exterior-rendering",
    name: "Rendus d’extérieur",
    shortName: "Rendus d’extérieur",
    category: "exterior",
    icon: "grid",
    hideFromMenu: true,
    tagline: "Vendez le bâtiment avant le début des travaux.",
    description:
      "Des vues réalistes de façades, de maisons et de bâtiments commerciaux — pour les brochures, les permis, les annonces ou les présentations clients. Le prix couvre la construction d’un modèle 3D complet du bâtiment et le premier rendu. Le modèle étant déjà construit, chaque angle de vue supplémentaire sur la même face du bâtiment ne coûte que €48 — 80 % moins cher.",
    highlight:
      "Idéal pour les promoteurs en pré-commercialisation, les architectes qui présentent un projet à leur client et les maisons en construction qui ont besoin de marketing.",
    materials:
      "Envoyez-nous les plans d’architecte (plans, coupes, élévations) et une spécification des matériaux. Plus les éléments sont précis, plus vite arrivent les ébauches — en général sous 3 à 5 jours ouvrés.",
    asset: "/artwork/expert-exterior-renders.webp",
    detailAsset: "/artwork/detail-exterior-renders.webp",
    philosophy:
      "Le poste de coût principal est la construction du modèle 3D du bâtiment — nous le construisons une fois, et chaque angle supplémentaire sur la même face du modèle coûte €48 (80 % moins cher). Une majoration ne s’applique que lorsqu’une vue exige la géométrie d’une face du bâtiment encore jamais montrée. Un forfait de 4 à 5 rendus reste ainsi dans un budget d’investissement réaliste, sans nouvelle commande à chaque vue.",
    priceContext:
      "Un modèle 3D complet du bâtiment + le premier rendu. Angle suivant sur la même face : €48 (80 % moins cher).",
    forSegments: [
      "Promoteurs (pré-commercialisation de lots)",
      "Architectes (présentations clients)",
      "Propriétaires de bâtiments (marketing avant la construction)",
    ],
    featured: true,
    problemHeading: "Les acheteurs n’achètent pas des plans. Ils achètent un logement.",
    problemBody:
      "La plupart des promoteurs perdent des semaines à expliquer aux acheteurs à quoi ressemblera un bâtiment à partir de plans techniques ou d’esquisses. Les acheteurs peinent à imaginer l’espace, les matériaux et les abords — alors ils repoussent leur décision.",
    problemResolution:
      "Les rendus d’extérieur traduisent les plans d’architecte en réalité. Nous montrons des matériaux fidèles, un éclairage juste et un cadre réaliste, à partir de vos plans DWG/PDF — vous vendez ainsi vos biens rapidement et en toute confiance.",
    benefits: [
      {
        title: "Des ventes avant la construction",
        body: "Laissez les acheteurs voir exactement ce qu’ils achètent. Les lots sur plan partent plus vite quand l’image inspire confiance.",
        icon: "speed",
      },
      {
        title: "Moins cher qu’une maquette physique",
        body: "Une maquette physique coûte plusieurs fois plus cher et ne peut pas être modifiée. Un rendu s’ajuste, et vous pouvez l’utiliser sur tous vos canaux.",
        icon: "value",
      },
      {
        title: "Une présentation professionnelle",
        body: "Le bâtiment apparaît terminé et placé dans un contexte réel — végétation, éclairage, matériaux de façade fidèles.",
        icon: "trust",
      },
    ],
    processSteps: [
      {
        title: "Envoyez vos éléments",
        body: "Envoyez les plans d’architecte (PDF/DWG) et, si vous le souhaitez, des références de style et une spécification des matériaux.",
      },
      {
        title: "Vous recevez un devis",
        body: "Nous envoyons un devis précis au plus tard le jour ouvré suivant, sans frais cachés.",
      },
      {
        title: "Nous construisons le modèle",
        body: "L’équipe met en place le modèle 3D, l’éclairage et la végétation. Vous suivez l’avancement ; aucune intervention n’est nécessaire.",
      },
      {
        title: "Livraison et révisions",
        body: "Vous recevez les visuels finaux. Trois séries de révisions sont incluses dans le prix — sans supplément.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/listing-exterior-static.webp",
        alt: "Rendu d’extérieur — vue classique de la façade",
      },
      {
        src: "/artwork/elegant-render-feature-exterior.webp",
        alt: "Rendu d’extérieur — maison individuelle moderne, perspective de rue",
      },
      {
        src: "/artwork/elegant-render-services-triptych-1.webp",
        alt: "Rendu d’extérieur — façade en lumière du jour",
      },
      {
        src: "/artwork/expert-exterior-renders.webp",
        alt: "Rendu d’extérieur — exemple de portfolio",
      },
    ],
    faqs: [
      {
        q: "Quel est le délai pour des rendus d’extérieur ?",
        a: "Nous envoyons en général les premières ébauches sous 3 à 5 jours ouvrés après la confirmation du devis et la réception de tous les éléments. La livraison finale dépend du nombre de révisions — trois séries sont incluses dans le prix.",
      },
      {
        q: "Et si un détail ne me plaît pas ?",
        a: "Chaque commande comprend trois séries de révisions sans supplément. Nous ajustons les matériaux, les couleurs, l’éclairage et les angles de vue jusqu’à ce que le résultat soit juste.",
      },
      {
        q: "Ne puis-je pas simplement utiliser des outils d’IA ?",
        a: "Les outils d’IA sont utiles pour l’inspiration, mais ils ne peuvent pas produire une vue précise de votre bâtiment à partir de plans DWG/PDF. Nos rendus sont techniquement exacts — chaque fenêtre, matériau et proportion correspond à la structure réelle, ce qui est décisif quand vous vendez un bien immobilier.",
      },
      {
        q: "€250, est-ce le prix d’une seule image ?",
        a: "€250 couvre la construction d’un modèle 3D complet de votre bâtiment et le premier rendu final. Le modèle étant déjà construit, chaque angle supplémentaire sur la même face du bâtiment ne coûte que €48 — 80 % moins cher. Par exemple, quatre angles du même bâtiment reviennent à €394 au total (€250 + 3 × €48).",
      },
      {
        q: "Que dois-je envoyer pour commencer ?",
        a: "Les plans d’architecte (plans, coupes, élévations) au format PDF ou DWG. En option mais utile : des photos de référence de style, une spécification des matériaux de façade et une photo du terrain pour le contexte.",
      },
      {
        q: "Réalisez-vous aussi des maisons individuelles, ou seulement de grands projets ?",
        a: "Nous travaillons sur des projets de toutes tailles — de la maison individuelle aux ensembles résidentiels et aux bâtiments commerciaux. Le prix du modèle et du premier angle reste le même : €250.",
      },
    ],
    variants: [
      {
        id: "exterior-static",
        title: "Rendu classique de façade",
        basePrice: 250,
        priceLabel: "€250",
        unitLabel: "modèle 3D + premier rendu",
        description:
          "Le point d’entrée pour une brochure : un modèle 3D complet du bâtiment et le premier rendu final. Chaque angle supplémentaire 80 % moins cher.",
        included:
          "Construction d’un modèle 3D complet du bâtiment, mise en place de la scène, de l’éclairage et des matériaux, et 1 rendu final (angle de vue). Angle suivant sur la même face : seulement €48.",
        addOns: [
          "Angle de vue supplémentaire sur la même face du bâtiment : €48 (remise de 80 %)",
          "Majoration pour une face non montrée du bâtiment : +25 % une seule fois par modèle",
        ],
        note: "La majoration pour une face non montrée n’est facturée qu’une seule fois ; ensuite, tous les angles suivants sont facturés au prix standard de l’option.",
      },
      {
        id: "exterior-360",
        title: "Panorama 360° interactif",
        basePrice: 335,
        priceLabel: "€335",
        unitLabel: "modèle 3D + premier panorama 360°",
        description:
          "Le client tourne autour du bâtiment à la souris ou avec un casque VR. Idéal pour les présentations à distance et les brochures en ligne.",
        included:
          "Un modèle 3D complet du bâtiment + le premier panorama 360° interactif prêt pour les casques VR (Meta Quest, etc.).",
        addOns: [
          "Point interactif supplémentaire, même face du modèle : €48",
          "Point supplémentaire exigeant une face non montrée : €60",
          "À partir de 5 points supplémentaires : €53 par point (remise de volume)",
        ],
      },
      {
        id: "exterior-aerial",
        title: "Perspective de rue 3D",
        basePrice: 420,
        priceLabel: "€420",
        unitLabel: "bâtiment + abords, perspective de rue ou vue aérienne",
        description:
          "Le bâtiment avec les maisons voisines modélisées en 3D — perspective au niveau de la rue ou vue aérienne. Pour le contexte de rue, les parcelles et les présentations aux investisseurs.",
        included: "Un modèle 3D complet du bâtiment + les abords + la première vue (perspective de rue ou vue aérienne).",
        addOns: ["Majoration pour montrer la face arrière du bâtiment : +25 % une seule fois"],
      },
    ],
  },
  {
    slug: "exterior-360",
    code: "exterior-360-tour",
    name: "Extérieur 360°",
    shortName: "Extérieur 360°",
    category: "exterior",
    icon: "images",
    tagline: "Vos clients tournent autour de votre bâtiment comme dans un jeu — avant sa construction.",
    description:
      "Un panorama 360° interactif autour de votre bâtiment. L’acheteur ouvre un lien dans son navigateur, fait pivoter la vue sous tous les angles à la souris, passe d’un point à l’autre — et utilise le mode VR sur les casques Meta Quest. Idéal pour la pré-commercialisation sur plan, les démonstrations à distance et les brochures en ligne.",
    highlight:
      "La bonne présentation pour un acheteur à distance — quand un rendu statique ne suffit pas à transmettre l’espace. Pour les promoteurs qui vendent sur plan à des acheteurs à l’étranger et les agences qui organisent des visites à distance.",
    materials:
      "Envoyez les plans d’architecte (PDF/DWG), des références de style et l’emplacement des points de vue souhaités. Première ébauche sous 3 à 5 jours ouvrés.",
    asset: "/artwork/listing-exterior-360.webp",
    detailAsset: "/artwork/detail-exterior-360.webp",
    detailEmbedSrc:
      "https://kuula.co/share/collection/7Tm7X?logo=1&info=0&fs=1&vr=1&sd=1&autorotate=0.04&autop=30&thumbs=1",
    philosophy:
      "Le poste de coût principal est la construction du modèle 3D. Le prix de €335 couvre un modèle complet et le premier panorama 360° interactif. Chaque point suivant sur la même face du modèle : €48 (80 % moins cher). Un point exigeant une face non montrée : €60 une seule fois. À partir de 5 points, le prix descend à €53 par point — un tour complet du bâtiment reste dans un budget promoteur réaliste.",
    priceContext:
      "€335 — un modèle 3D complet + le premier panorama 360° prêt pour la VR. Point suivant sur la même face : €48.",
    forSegments: [
      "Promoteurs (pré-commercialisation sur plan)",
      "Agences immobilières (démonstrations à distance)",
      "Architectes (présentations clients)",
    ],
    problemHeading: "Les plans n’ouvrent pas de portes. Un tour du bâtiment, si.",
    problemAsset: "/artwork/expert-exterior-360-problem.webp",
    problemPanoramaSrc: "/artwork/exterior-360-panorama-vr.jpg",
    problemBody:
      "Le promoteur montre la façade, l’acheteur hoche la tête et part réfléchir. Une image statique ne transmet pas l’espace sous tous les angles, ne montre pas les matériaux dans la lumière, ne laisse pas l’acheteur explorer par lui-même. La décision est repoussée.",
    problemResolution:
      "Un panorama 360° interactif transforme la façade en un espace que le client parcourt à la souris ou avec un casque VR. Les acheteurs explorent le bâtiment sous tous les angles, avec les mêmes matériaux et les mêmes abords qu’ils verront sur place — et prennent leur décision.",
    benefits: [
      {
        icon: "trust",
        title: "La confiance par l’expérience",
        body: "L’acheteur entre dans l’espace à la souris et examine lui-même les matériaux, les dimensions et l’éclairage. Personne n’a besoin de lui expliquer la perspective.",
      },
      {
        icon: "speed",
        title: "Des présentations à distance",
        body: "Vous envoyez un lien, l’acheteur ouvre le panorama sur son téléphone ou son casque VR — sans installation, sans compte.",
      },
      {
        icon: "value",
        title: "Moins cher qu’une maquette physique",
        body: "Un modèle 3D complet et un panorama interactif pour €335. Une maquette physique du même bâtiment coûte plusieurs fois plus cher et ne peut pas être modifiée quand l’architecte change un matériau.",
      },
    ],
    processSteps: [
      {
        title: "Envoyez vos éléments",
        body: "Envoyez les plans d’architecte (PDF/DWG) et, si vous le souhaitez, des références de style et l’emplacement des points de vue souhaités.",
      },
      {
        title: "Vous recevez un devis",
        body: "Nous envoyons un devis précis au plus tard le jour ouvré suivant, sans frais cachés.",
      },
      {
        title: "Nous construisons le panorama",
        body: "L’équipe construit le modèle 3D, règle l’éclairage et les matériaux, puis calcule le panorama 360°. Vous suivez l’avancement.",
      },
      {
        title: "Livraison du lien et du code d’intégration",
        body: "Vous recevez un lien à partager et un code d’intégration pour votre site. Trois séries de révisions sont incluses dans le prix — sans supplément.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-exterior-360-01.webp",
        alt: "Image extraite d’un panorama 360° d’un immeuble résidentiel — perspective de rue",
      },
      {
        src: "/artwork/portfolio-exterior-360-02.webp",
        alt: "Image extraite d’un panorama 360° d’une maison individuelle — scène de jour",
      },
      {
        src: "/artwork/portfolio-exterior-360-03.webp",
        alt: "Image extraite d’un panorama 360° d’un bâtiment commercial — façade d’entrée",
      },
      {
        src: "/artwork/portfolio-exterior-360-04.webp",
        alt: "Image extraite d’un panorama 360° d’un ensemble résidentiel — bâtiments voisins et zone d’accès",
      },
    ],
    faqs: [
      {
        q: "Comment le client ouvre-t-il le panorama ?",
        a: "Nous envoyons un lien et un code d’intégration. Le client l’ouvre dans son navigateur — sans installation, sans compte. Cela fonctionne sur téléphone, ordinateur et casques VR Meta Quest (le mode VR est intégré au panorama).",
      },
      {
        q: "Que comprend exactement le prix de €335 ?",
        a: "Un modèle 3D complet du bâtiment et le premier panorama 360° interactif prêt pour la VR. Chaque point de vue supplémentaire sur la même face du modèle : €48. Un point exigeant une face non montrée : €60 (une seule fois). À partir de 5 points supplémentaires : €53 par point.",
      },
      {
        q: "Quelle différence avec un rendu classique ?",
        a: "Un rendu d’extérieur classique (€250) est une image depuis un seul angle. Un panorama 360° (€335) est une vue interactive que le client parcourt lui-même — une vue à 360° depuis un point, avec la possibilité d’ajouter d’autres points par bâtiment.",
      },
      {
        q: "Cela fonctionne-t-il avec un casque VR ?",
        a: "Oui. Le panorama est prêt pour la VR en standard — les casques Meta Quest et compatibles l’ouvrent directement depuis le navigateur, sans application supplémentaire.",
      },
      {
        q: "Quel est le délai de livraison ?",
        a: "Nous envoyons la première ébauche du panorama sous 3 à 5 jours ouvrés après la confirmation du devis et la réception des plans d’architecte. Trois séries de révisions sont incluses.",
      },
      {
        q: "Que dois-je envoyer pour commencer ?",
        a: "Les plans d’architecte (plans, coupes, élévations) au format PDF ou DWG. En option : une spécification des matériaux de façade, des photos du lieu pour le contexte.",
      },
    ],
    variants: [
      {
        id: "exterior-360",
        title: "Panorama 360° interactif",
        basePrice: 335,
        priceLabel: "€335",
        unitLabel: "modèle 3D + premier panorama 360°",
        description:
          "Le client tourne autour du bâtiment à la souris ou avec un casque VR. Idéal pour les présentations à distance et les brochures en ligne.",
        included:
          "Un modèle 3D complet du bâtiment + le premier panorama 360° interactif prêt pour les casques VR (Meta Quest, etc.).",
        addOns: [
          "Point interactif supplémentaire, même face du modèle : €48",
          "Point supplémentaire exigeant une face non montrée : €60",
          "À partir de 5 points supplémentaires : €53 par point (remise de volume)",
        ],
      },
    ],
  },
  {
    slug: "3d-streetscape",
    code: "exterior-aerial-dedicated",
    name: "Perspective de rue 3D",
    shortName: "Perspective de rue 3D",
    category: "exterior",
    icon: "camera",
    tagline: "Votre bâtiment dans sa rue, sous tous les angles dont vous avez besoin.",
    description:
      "La perspective de rue 3D (€420) modélise tout le cadre — maisons voisines, rue et parcelle — et montre votre bâtiment principalement depuis une perspective au niveau de la rue, avec des vues aériennes si nécessaire. Le bon choix quand le lieu n’existe pas encore, est difficile d’accès ou que vous avez besoin d’un libre choix d’angle. Pour les lieux existants et photographiables, il existe une méthode moins chère — le rendu dans une photo réelle dès €300.",
    highlight:
      "La bonne présentation du lieu et du contexte — pour les permis de construire, les présentations en conseil et les offres aux investisseurs.",
    materials:
      "Envoyez les plans d’architecte (PDF/DWG), un plan de masse avec le fond cadastral et, en option, des photos du lieu. Première ébauche sous 3 à 5 jours ouvrés.",
    asset: "/artwork/listing-streetscape.webp",
    listingAsset: "/artwork/listing-streetscape.webp",
    detailAsset: "/artwork/detail-streetscape.webp",
    detailBeforeAsset: "/artwork/problem-streetscape-street-before.webp",
    detailAfterAsset: "/artwork/problem-streetscape-street-after.webp",
    detailBeforeAlt:
      "Plan de masse 2D d’un alignement de bâtiments le long d’une rue — disposition des maisons, du stationnement, des espaces verts et des équipements",
    detailAfterAlt:
      "Perspective de rue 3D — un alignement de bâtiments modernes avec une rangée d’arbres, du stationnement et le contexte de la rue",
    philosophy:
      "Le prix de €420 couvre la construction d’un modèle 3D complet du bâtiment et de ses abords modélisés, avec deux angles inclus. Le modèle étant déjà construit, chaque angle supplémentaire coûte €48 — 80 % moins cher. Une face non montrée ou arrière du bâtiment s’ajoute une seule fois (+25 %, €105). Pas de surprises ensuite — tout est public dans la grille tarifaire.",
    priceContext:
      "€420 — un modèle 3D complet du bâtiment + les abords + la première vue. Angle suivant : €48.",
    forSegments: [
      "Promoteurs (plans d’ensemble)",
      "Investisseurs (parcelles et ensembles)",
      "Architectes (présentations réglementaires)",
    ],
    problemHeading: "Le lieu n’existe pas encore. L’acheteur ne peut pas attendre qu’il soit construit.",
    problemBody:
      "Un promoteur vend des appartements en construction. Le lieu est une parcelle vide ou un chantier à peine commencé. Il n’existe aucune photo des abords, un drone n’a rien à filmer, et l’acheteur veut une preuve visuelle que le bâtiment se dressera bien dans cette rue, entre ces voisins, sur cette parcelle. Sans cela — l’acheteur va voir quelqu’un qui a une image.",
    problemResolution:
      "La perspective de rue 3D construit tout le cadre à partir des plans et des données cadastrales. Les maisons voisines, la rue, la végétation et le bâtiment — le tout dans une seule image. L’acheteur voit la future rue avant qu’elle ne soit pavée.",
    benefits: [
      {
        icon: "context",
        title: "Un libre choix d’angle",
        body: "Les abords sont en 3D — vous pouvez demander une perspective au niveau de la rue, une vue depuis la cour, un angle aérien ou tout autre point de vue. Aucune contrainte de photographie.",
      },
      {
        icon: "speed",
        title: "Pas d’attente d’accès au site",
        body: "Nous construisons à partir des plans et des données cadastrales. Ni photographie, ni drone, ni visite sur place — le travail commence dès l’envoi des plans.",
      },
      {
        icon: "value",
        title: "Une présentation complète en une seule commande",
        body: "Une perspective de rue pour la brochure, un angle aérien pour la présentation en conseil, la face arrière pour le dossier réglementaire — tout depuis le même modèle. Chaque angle supplémentaire €48.",
      },
    ],
    processSteps: [
      {
        title: "Envoyez les plans",
        body: "Plans, élévations et plan de masse avec le fond cadastral, en PDF ou DWG. En option : spécification des matériaux, photos du lieu.",
      },
      {
        title: "Confirmation du devis",
        body: "Nous envoyons le prix et le délai sous un jour ouvré. Le paiement de l’acompte lance la production.",
      },
      {
        title: "Production et ébauches",
        body: "Nous envoyons les premières ébauches sous 3 à 5 jours ouvrés. 3 séries de révisions sont incluses — sans supplément.",
      },
      {
        title: "Fichiers finaux",
        body: "Haute résolution, PNG et TIFF, avec facture. Prêts pour l’impression, les présentations et le web.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-streetscape-street-01.webp",
        alt: "Perspective de rue 3D — alignement de maisons mitoyennes contemporaines, perspective de rue avec voitures et végétation, Elegant Render",
        beforeSrc: "/artwork/portfolio-streetscape-street-01-before.webp",
        beforeAlt: "Plan 2D technique en noir et blanc du même alignement avec les parcelles, le trottoir et la chaussée",
      },
      {
        src: "/artwork/portfolio-streetscape-street-02.webp",
        alt: "Perspective de rue 3D — bâtiments contemporains alignés sur rue depuis une perspective piétonne, Elegant Render",
        beforeSrc: "/artwork/portfolio-streetscape-street-02-before.webp",
        beforeAlt: "Plan 2D technique en noir et blanc de la même rue avant la vue 3D",
      },
      {
        src: "/artwork/portfolio-streetscape-street-03.webp",
        alt: "Perspective de rue 3D — bâtiments le long de la rue avec espaces verts aménagés, perspective de rue, Elegant Render",
        beforeSrc: "/artwork/portfolio-streetscape-street-03-before.webp",
        beforeAlt: "Plan 2D technique en noir et blanc de la même rue avec la disposition des bâtiments",
      },
      {
        src: "/artwork/portfolio-streetscape-street-04.webp",
        alt: "Perspective de rue 3D — alignement de bâtiments voisins dans leur contexte de rue, Elegant Render",
        beforeSrc: "/artwork/portfolio-streetscape-street-04-before.webp",
        beforeAlt: "Plan 2D technique en noir et blanc du même alignement avec les libellés des bâtiments",
      },
    ],
    faqs: [
      {
        q: "Que comprend exactement le prix de €420 ?",
        a: "Un modèle 3D complet de votre bâtiment et de ses abords modélisés (maisons voisines, rue, parcelle), principalement depuis une perspective au niveau de la rue — avec 2 angles inclus. Chaque angle supplémentaire : €48. Face non montrée/arrière du bâtiment : +25 % (€105), une seule fois. Trois séries de révisions sont incluses.",
      },
      {
        q: "Les abords sont-ils exacts ou approximatifs ?",
        a: "Les abords sont une approximation modélisée — les maisons voisines sont construites à partir des données cadastrales et de photos de référence, mais elles ne sont pas une copie au pixel près de l’état réel. Si vous avez besoin d’abords fidèles au pixel (p. ex. pour une commission d’urbanisme qui exige le contexte réel), envisagez le rendu dans une photo réelle du lieu (€300).",
      },
      {
        q: "Quelle différence avec le rendu dans une photo réelle (€300) ?",
        a: "Le rendu dans une photo utilise une photographie réelle du lieu comme arrière-plan — les abords sont fidèles au pixel, mais vous êtes lié à l’angle de la photo. La perspective de rue 3D modélise tout le cadre en 3D — vous choisissez n’importe quel angle, mais les abords sont une approximation. Si le lieu existe et peut être photographié, le rendu dans une photo est moins cher et plus crédible. Si le lieu n’existe pas ou qu’il vous faut plusieurs angles, la perspective de rue 3D est la seule option.",
      },
      {
        q: "Que dois-je envoyer pour commencer ?",
        a: "Les plans d’architecte (plans, coupes, élévations) au format PDF ou DWG et un plan de masse avec le fond cadastral. En option : une spécification des matériaux de façade et des photos du lieu ou des abords pour référence.",
      },
      {
        q: "La prestation comprend-elle une vue aérienne (à vol d’oiseau) ou seulement le niveau de la rue ?",
        a: "Le format principal est la perspective au niveau de la rue (hauteur d’œil) — le bâtiment dans sa rue, tel qu’un passant le voit. Une vue aérienne est disponible comme angle supplémentaire depuis le même modèle pour €48. Les deux proviennent du même cadre modélisé.",
      },
      {
        q: "Quel est le délai de livraison ?",
        a: "Nous envoyons les premières ébauches sous 3 à 5 jours ouvrés après la confirmation du devis et la réception des plans. Trois séries de révisions sont incluses — sans supplément.",
      },
    ],
    pricingLead: {
      heading: "Deux méthodes, un même objectif — un seul bon choix pour votre lieu.",
      body: "La perspective de rue 3D (€420) est le bon choix quand le lieu n’existe pas encore ou que vous avez besoin d’un libre choix d’angle de vue — les abords sont modélisés en 3D. Le rendu dans une photo réelle (€300) est le bon choix quand le lieu existe et peut être photographié — les abords sont fidèles au pixel car issus d’une photographie réelle. Choisissez selon ce que vous avez en main.",
    },
    comparison: {
      aLabel: "Perspective de rue 3D — €420",
      bLabel: "Rendu dans une photo — €300",
      rows: [
        { label: "Éléments d’entrée", a: "Plans d’architecte", b: "Une photo réelle du lieu" },
        { label: "Abords", a: "Modélisés en 3D (approximation)", b: "Fidèles au pixel (photographie réelle)" },
        { label: "Choix de l’angle", a: "N’importe quel angle (rue ou aérien)", b: "Lié à l’angle de la photo" },
        { label: "Quand le choisir", a: "Le lieu n’existe pas ou il vous faut plusieurs angles", b: "Le lieu existe et peut être photographié" },
      ],
    },
    variants: [
      {
        id: "exterior-aerial",
        title: "Perspective de rue 3D",
        basePrice: 420,
        priceLabel: "€420",
        unitLabel: "modèle 3D complet du bâtiment + abords, perspective de rue",
        description:
          "Tout le cadre est modélisé en 3D — maisons voisines, rue, parcelle. La vue principale est une perspective au niveau de la rue ; les angles aériens et autres sont disponibles en option depuis le même modèle.",
        included:
          "Un modèle 3D complet du bâtiment et des abords, 2 angles inclus (principalement en perspective de rue). Trois séries de révisions incluses.",
        addOns: [
          "Angle supplémentaire (rue ou aérien) : €48 (80 % moins cher)",
          "Face non montrée/arrière du bâtiment : +25 % (€105 une seule fois)",
        ],
        note: "La majoration pour la face arrière n’est facturée qu’une fois par modèle — ensuite, tous les angles sont facturés au prix standard de l’option.",
      },
    ],
    crossSellVariants: [
      {
        id: "photomontage-main",
        title: "Rendu dans une photo réelle du lieu",
        basePrice: 300,
        priceLabel: "€300",
        unitLabel: "modèle 3D + intégration dans une photo du lieu",
        description:
          "Quand le lieu existe et peut être photographié — le modèle 3D est intégré dans une photographie réelle. Abords fidèles au pixel, prix plus bas.",
        included:
          "Un modèle 3D complet du bâtiment, intégration dans une photo du lieu, lumière et ombres accordées. Un rendu final.",
        addOns: [
          "Angle supplémentaire depuis la même photo : €55 (82 % moins cher)",
          "Une deuxième photo du même lieu : €85",
          "Face non montrée du bâtiment : +25 % une seule fois",
        ],
        note: "Rendu d’extérieur €250 + photomontage +€50. Le bon choix quand le lieu existe et peut être photographié — une crédibilité maximale pour les commissions et les concertations publiques.",
      },
    ],
  },
  {
    slug: "virtual-staging",
    code: "virtual-staging",
    name: "Home staging virtuel",
    shortName: "Home staging virtuel",
    category: "transformation",
    icon: "sparkles",
    tagline: "Les pièces vides se vendent lentement — les pièces mises en scène se vendent plus vite.",
    description:
      "Nous transformons la photo d’un espace vide ou mal meublé en une scène qui vend. Idéal pour les agents immobiliers et les propriétaires — le staging d’une photo coûte 100 fois moins cher que meubler physiquement l’appartement, et augmente nettement les clics sur l’annonce. Deuxième pièce du même bien : 17 % moins cher. Forfait de 10 images : 28 % moins cher par image.",
    highlight:
      "Un moyen concret de rendre un bien vide prêt à habiter et d’augmenter les appels générés par l’annonce.",
    materials:
      "Envoyez-nous des photos haute résolution des pièces vides et le style de mobilier souhaité.",
    asset: "/artwork/expert-virtual-staging-hero-after.webp",
    beforeAsset: "/artwork/expert-virtual-staging-hero-before.webp",
    afterAsset: "/artwork/expert-virtual-staging-hero-after.webp",
    detailAsset: "/artwork/detail-virtual-staging.webp",
    detailBeforeAsset: "/artwork/problem-virtual-staging-living-room-before.webp",
    detailAfterAsset: "/artwork/problem-virtual-staging-living-room-after.webp",
    detailBeforeAlt:
      "Salon vide avant home staging virtuel — pièce nue avec parquet et grandes fenêtres",
    detailAfterAlt:
      "Le même salon après home staging virtuel — canapé, fauteuil, table basse, tapis et tableaux",
    philosophy:
      "La première image couvre le choix du mobilier, du style et de l’éclairage. Une fois le style défini, chaque angle supplémentaire de la même pièce est 33 % moins cher, une deuxième pièce 17 % moins cher, et à partir de 10 images le prix descend à €13/image. Le bien entier obtient un dossier d’annonce complet pour une fraction du coût d’un staging physique.",
    priceContext:
      "€18 la première image · €15 la deuxième pièce · dès €13/image pour les forfaits de 10 images et plus.",
    forSegments: [
      "Agences immobilières",
      "Propriétaires de biens vides",
      "Photographes immobiliers (post-production)",
    ],
    featured: true,
    problemHeading: "Une pièce vide paraît froide. Une pièce mise en scène vend.",
    problemBody:
      "Un acheteur ouvre l’annonce, voit un appartement vide et passe au suivant. Sans mobilier, aucune notion d’échelle ; sans style, aucune émotion. La plupart des agents le savent — mais un staging physique coûte des milliers d’euros et prend des jours.",
    problemResolution:
      "Le home staging virtuel transforme la photo d’une pièce vide en une scène attrayante en une journée — et en un clic de plus sur l’annonce. Mobilier, tapis, lampe, plante — le tout dans un style adapté au bien.",
    benefits: [
      {
        icon: "speed",
        title: "Des résultats rapides",
        body: "Envoyez l’image aujourd’hui, recevez la vue mise en scène sous quelques jours ouvrés. Pas d’attente de livraison de meubles, pas de rendez-vous photographe à organiser.",
      },
      {
        icon: "value",
        title: "100 fois moins cher qu’un staging physique",
        body: "Du vrai mobilier pour présenter un appartement coûte des milliers d’euros et prend des jours. En virtuel, c’est €18 par image, €13 pour les forfaits de 10 images et plus.",
      },
      {
        icon: "trust",
        title: "Un style adapté à l’acheteur",
        body: "Choisissez parmi plusieurs directions — minimalisme moderne, scandinave chaleureux, classique. Changement de style de la même pièce : €12.",
      },
    ],
    processSteps: [
      {
        title: "Envoyez les photos",
        body: "Des photos haute résolution des pièces vides et 1 à 2 références pour le style de mobilier souhaité.",
      },
      {
        title: "Confirmation du devis",
        body: "Nous envoyons le prix et le délai au plus tard le jour ouvré suivant, sans frais cachés.",
      },
      {
        title: "Mise en scène",
        body: "Nous plaçons mobilier, matériaux et éclairage dans vos photos. Premières ébauches sous 3 à 5 jours ouvrés.",
      },
      {
        title: "Livraison et révisions",
        body: "Vous recevez des images finalisées prêtes pour l’annonce. Trois séries de révisions sont incluses dans le prix — sans supplément.",
      },
    ],
    faqs: [
      {
        q: "Que comprend exactement le prix de €18 ?",
        a: "La mise en scène photoréaliste d’une pièce vide à partir de votre photo — choix du mobilier, placement et accord de l’éclairage inclus. Angle supplémentaire de la même pièce : €12 (remise de 33 %). Deuxième pièce du même bien : €15 (remise de 17 %). Forfait de 10 images et plus : €13 par image (remise de 28 %).",
      },
      {
        q: "Le résultat semble-t-il réel ?",
        a: "Notre staging est photoréaliste — les acheteurs ne font en général pas la différence entre notre image mise en scène et la photo d’un appartement réellement meublé. Nous indiquons de manière transparente qu’un home staging virtuel a été utilisé, sans que cela réduise l’efficacité de l’annonce.",
      },
      {
        q: "Puis-je changer de style s’il ne me plaît pas ?",
        a: "Oui. Changement de style de la même pièce : €12. Avant cela, trois séries de révisions sont incluses sans supplément — nous y modifions le mobilier, les matériaux et l’éclairage jusqu’à ce que le résultat soit juste.",
      },
      {
        q: "Quel est le délai de livraison ?",
        a: "Nous envoyons les premières ébauches sous 3 à 5 jours ouvrés après la confirmation du devis. Les forfaits de 10 images et plus sont livrés par étapes — les premières images sous une semaine, le reste selon l’accord passé avec vous.",
      },
      {
        q: "Travaillez-vous avec des agences gérant de nombreuses annonces ?",
        a: "Oui. Le forfait de 10 images et plus est à €13 par image (remise de 28 %). Les agents réguliers peuvent convenir d’une priorité de production et d’une ligne de style cohérente sur toutes leurs annonces.",
      },
      {
        q: "Que dois-je envoyer pour commencer ?",
        a: "Des photos des pièces vides en bonne résolution (au moins 1920 px sur le grand côté, pas un cliché de téléphone pris de biais) et 1 à 2 références de style de mobilier.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-virtual-staging-stg-01.webp",
        alt: "Home staging virtuel — chambre avec matériaux chaleureux et mobilier",
        beforeSrc: "/artwork/portfolio-virtual-staging-stg-01-before.webp",
        beforeAlt: "Une pièce vide avant home staging virtuel — sans mobilier ni décoration",
      },
      {
        src: "/artwork/portfolio-virtual-staging-stg-02.webp",
        alt: "Home staging virtuel — pièce stylisée avec mobilier et décoration",
        beforeSrc: "/artwork/portfolio-virtual-staging-stg-02-before.webp",
        beforeAlt: "Une pièce vide avant home staging virtuel — murs nus et sans mobilier",
      },
      {
        src: "/artwork/portfolio-virtual-staging-stg-03.webp",
        alt: "Home staging virtuel — intérieur avec mobilier et lumière naturelle",
        beforeSrc: "/artwork/portfolio-virtual-staging-stg-03-before.webp",
        beforeAlt: "Une pièce vide avant home staging virtuel — sans mobilier",
      },
      {
        src: "/artwork/portfolio-virtual-staging-stg-04.webp",
        alt: "Home staging virtuel — pièce meublée avec mobilier et décoration",
        beforeSrc: "/artwork/portfolio-virtual-staging-stg-04-before.webp",
        beforeAlt: "Une pièce vide avant home staging virtuel — sol et murs nus",
      },
    ],
    variants: [
      {
        id: "staging-static",
        title: "Staging photo classique",
        basePrice: 18,
        priceLabel: "€18",
        unitLabel: "première image mise en scène",
        description:
          "Une montée en gamme rapide de l’annonce : une pièce vide devient une scène attrayante pour €18. Chaque pièce supplémentaire 17 % moins cher.",
        included:
          "Mise en scène photoréaliste d’une pièce vide à partir de votre photo. Comprend le choix du mobilier, le placement et l’accord de l’éclairage.",
        addOns: [
          "Angle supplémentaire de la même pièce : €12 (remise de 33 %)",
          "Deuxième pièce du même bien : €15 (remise de 17 %)",
          "Forfait de 10 images et plus : €13 par image (remise de 28 %)",
          "Changement de style de la même pièce : €12",
        ],
      },
      {
        id: "staging-360",
        title: "Staging 360° interactif",
        basePrice: 34,
        priceLabel: "€34",
        unitLabel: "premier panorama 360° mis en scène",
        description:
          "Les acheteurs parcourent la pièce mise en scène à la souris — parfait pour les annonces en ligne ou les présentations à distance à un acheteur potentiel.",
        included:
          "Mise en scène complète de la première pièce en panorama 360°, consultable sur votre site ou avec un casque VR.",
        addOns: [
          "Point interactif supplémentaire dans la même pièce : €24 (remise de 30 %)",
          "Deuxième pièce du même bien : €28 (remise de 18 %)",
          "Forfait de 6 points et plus : €24 par point",
          "Changement de style de la même pièce : €22",
        ],
      },
    ],
  },
  {
    slug: "virtual-renovation",
    code: "virtual-renovation",
    name: "Rénovation virtuelle",
    shortName: "Rénovation virtuelle",
    category: "transformation",
    icon: "refresh",
    tagline: "Voyez l’espace rénové avant de dépenser pour les travaux.",
    description:
      "Avant de dépenser des milliers d’euros pour des sols, une cuisine ou une salle de bains, voyez à quoi ressemblera l’espace. Vous évitez des erreurs de matériaux coûteuses et accélérez les accords avec les artisans. La première image couvre le design complet ; chaque angle supplémentaire de la même pièce est 10 % moins cher (et dès le 4e angle 20 % moins cher).",
    highlight:
      "Pour les propriétaires qui préparent une rénovation, les agents qui vendent des biens à rafraîchir et les architectes d’intérieur qui présentent des options concrètes à leur client.",
    materials:
      "Envoyez-nous des photos de l’état actuel et des références pour les nouveaux matériaux (sols, murs, mobilier).",
    asset: "/artwork/expert-virtual-renovation-after.webp",
    beforeAsset: "/artwork/expert-virtual-renovation-before.webp",
    afterAsset: "/artwork/expert-virtual-renovation-after.webp",
    detailAsset: "/artwork/detail-virtual-renovation.webp",
    detailBeforeAsset: "/artwork/problem-virtual-renovation-kitchen-before.webp",
    detailAfterAsset: "/artwork/problem-virtual-renovation-kitchen-after.webp",
    detailBeforeAlt:
      "Cuisine datée avec de vieux placards en bois et du carrelage avant rénovation virtuelle",
    detailAfterAlt:
      "La même cuisine après rénovation virtuelle — placards clairs modernes, mur en marbre, plan de travail blanc et nouveaux équipements",
    philosophy:
      "La première image couvre le design complet de la rénovation et le choix des matériaux. Une fois la direction visuelle définie, chaque angle supplémentaire de la même pièce est 10 % moins cher, et dès le 4e angle 20 % moins cher. Deuxième pièce du même bien : remise de 15 %. Un bien entier tient dans un budget réaliste avant l’arrivée des artisans.",
    priceContext:
      "€66 la première vue · dès €53 l’angle supplémentaire · €56 la deuxième pièce (remise de 15 %).",
    forSegments: [
      "Propriétaires préparant une rénovation",
      "Architectes d’intérieur",
      "Agences immobilières",
    ],
    featured: true,
    problemHeading: "Une rénovation coûte cher. Une erreur de matériau — encore plus.",
    problemBody:
      "Le propriétaire choisit le carrelage sur catalogue, le sol sur échantillon, la cuisine en showroom — et ne voit l’ensemble qu’une fois les travaux terminés. Trop tard pour corriger. Les artisans facturent les modifications en supplément.",
    problemResolution:
      "La rénovation virtuelle montre l’aspect final de la pièce avant l’achat des matériaux et avant l’arrivée des artisans. Vous voyez tout ensemble, essayez des options et décidez sans risque.",
    benefits: [
      {
        icon: "value",
        title: "Moins d’erreurs, moins de coûts",
        body: "Un changement de matériau coûteux après les travaux entraîne de nouveaux frais d’artisans. Un rendu les évite — vous voyez l’aspect final avant de dépenser pour les travaux.",
      },
      {
        icon: "speed",
        title: "Un accord plus rapide avec les artisans",
        body: "Un artisan sait exactement ce qu’il construit quand il a des rendus — moins de questions, un calendrier plus court, moins de changements en cours de chantier.",
      },
      {
        icon: "trust",
        title: "Plusieurs options pour peu d’argent",
        body: "€66 la première vue. Angle supplémentaire de la même pièce €59 (remise de 10 %), dès le 4e angle €53 (remise de 20 %). Deuxième pièce 15 % moins cher. Un bien entier tient dans un budget réaliste.",
      },
    ],
    processSteps: [
      {
        title: "Envoyez vos éléments",
        body: "Des photos de l’état actuel de la pièce et des références pour les nouveaux sols, murs et mobilier. Plus les éléments sont clairs, plus vite arrivent les ébauches.",
      },
      {
        title: "Confirmation du devis",
        body: "Nous envoyons le prix et le délai au plus tard le jour ouvré suivant, sans frais cachés.",
      },
      {
        title: "Rendu de rénovation",
        body: "Nous plaçons les nouveaux matériaux, les éléments fixes, le mobilier et l’éclairage. Premières ébauches sous 3 à 5 jours ouvrés.",
      },
      {
        title: "Livraison et révisions",
        body: "Vous recevez les images finales. Trois séries de révisions sont incluses dans le prix — nous modifions matériaux, couleurs et agencement jusqu’à ce que le résultat soit juste.",
      },
    ],
    faqs: [
      {
        q: "Que comprend exactement le prix de €66 ?",
        a: "La transformation visuelle complète d’une pièce à partir de votre photo — y compris nouveaux sols, murs, éléments fixes et mobilier. Angle supplémentaire de la même pièce : €59 (remise de 10 %). 4e angle et suivants : €53 (remise de 20 %). Deuxième pièce : €56 (remise de 15 %).",
      },
      {
        q: "Quelle différence avec le home staging virtuel (€18) ?",
        a: "Le home staging virtuel (€18) ne change que le mobilier — murs, sols et éléments fixes restent identiques. La rénovation virtuelle (€66) change tout — carrelage, sols, placards, cuisine. Des usages différents.",
      },
      {
        q: "Combien est-ce que j’économise réellement ?",
        a: "Une erreur de matériau coûteuse découverte après les travaux coûte en général 5 à 10 fois plus qu’un seul rendu. Si nous évitons un seul mauvais choix de carrelage ou de sol, le rendu est amorti.",
      },
      {
        q: "Puis-je essayer plusieurs options ?",
        a: "Oui. Au fil des trois séries de révisions, nous modifions matériaux et agencement jusqu’à ce que le résultat soit juste. Une option supplémentaire sur le même agencement (autres matériaux) compte comme une nouvelle première vue.",
      },
      {
        q: "Quel est le délai de livraison ?",
        a: "Nous envoyons les premières ébauches sous 3 à 5 jours ouvrés après la confirmation du devis et la réception des photos et des références. La livraison finale dépend du nombre de révisions.",
      },
      {
        q: "Que dois-je envoyer pour commencer ?",
        a: "Des photos de l’état actuel en bonne résolution, un plan d’agencement (un plan du niveau si vous en avez un) et des références pour les matériaux souhaités (sols, murs, placards, mobilier).",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-virtual-renovation-reno-01.webp",
        alt: "Rénovation virtuelle — salle de bains rénovée avec douche vitrée et carrelage",
        beforeSrc: "/artwork/portfolio-virtual-renovation-reno-01-before.webp",
        beforeAlt: "La pièce avant rénovation — travaux inachevés, murs et sol nus",
      },
      {
        src: "/artwork/portfolio-virtual-renovation-reno-02.webp",
        alt: "Rénovation virtuelle — intérieur rénové avec de nouveaux matériaux",
        beforeSrc: "/artwork/portfolio-virtual-renovation-reno-02-before.webp",
        beforeAlt: "La pièce avant rénovation — un intérieur usé avant la transformation",
      },
      {
        src: "/artwork/portfolio-virtual-renovation-reno-03.webp",
        alt: "Rénovation virtuelle — pièce rénovée avec de nouveaux sols et des matériaux chaleureux",
        beforeSrc: "/artwork/portfolio-virtual-renovation-reno-03-before.webp",
        beforeAlt: "La pièce avant rénovation — un espace inachevé avant la transformation",
      },
      {
        src: "/artwork/portfolio-virtual-renovation-reno-04.webp",
        alt: "Rénovation virtuelle — pièce rafraîchie avec de nouveaux matériaux et un nouvel éclairage",
        beforeSrc: "/artwork/portfolio-virtual-renovation-reno-04-before.webp",
        beforeAlt: "La pièce avant rénovation — murs et sol nus avant la transformation",
      },
    ],
    variants: [
      {
        id: "renovation-main",
        title: "Rénovation visuelle d’une pièce",
        basePrice: 66,
        priceLabel: "€66",
        unitLabel: "première vue de la pièce rénovée",
        description:
          "La première vue couvre le design complet — choix des sols, des murs, des éléments fixes et du mobilier. Angles supplémentaires 10 à 20 % moins chers.",
        included:
          "Transformation visuelle complète d’une pièce à partir de votre photo. Comprend nouveaux sols, murs, éléments fixes et mobilier.",
        addOns: [
          "Angle supplémentaire de la même pièce : €59 (remise de 10 %)",
          "4e angle et suivants de la même pièce : €53 (remise de 20 %)",
          "Deuxième pièce du même bien : €56 (remise de 15 %)",
          "6e pièce et suivantes du même bien : €50 (remise de 24 %)",
        ],
      },
    ],
  },
  {
    slug: "2d-3d-floor-plans",
    code: "floor-plans",
    name: "Plans 2D et 3D",
    shortName: "Plans 2D et 3D",
    category: "plans",
    icon: "file-image",
    hideFromMenu: true,
    tagline: "Une vue de l’espace que les acheteurs comprennent au premier coup d’œil.",
    description:
      "Des plans 2D ou 3D clairs — pour les annonces, la vente, les permis ou l’aménagement intérieur. Le 2D donne une vue technique épurée ; le 3D une vue spatiale plus attrayante, compréhensible sans formation d’architecte. Le prix couvre un niveau ; la duplication d’un niveau identique ne coûte qu’un tiers du prix.",
    highlight:
      "Pour les agences immobilières qui veulent des annonces à l’allure professionnelle et les promoteurs qui présentent les typologies de lots d’un immeuble.",
    materials:
      "Envoyez-nous des plans techniques, des croquis cotés ou des plans PDF existants.",
    asset: "/artwork/expert-floor-plans.webp",
    detailAsset: "/artwork/detail-floor-plans.webp",
    detailBeforeAsset: "/artwork/problem-floor-plans-before.webp",
    detailAfterAsset: "/artwork/problem-floor-plans-after.webp",
    philosophy:
      "Le prix couvre la production du plan pour un niveau. Chaque niveau supplémentaire du même bâtiment est 50 à 66 % moins cher, car le gabarit de style est déjà défini. Un niveau identique (dupliqué avec changement des libellés) ne coûte qu’un tiers du prix de base. Le bâtiment entier obtient des plans clairs pour une fraction du prix d’un bureau CAO.",
    priceContext:
      "€20 le niveau (plan 2D épuré) / €29 le niveau (plan 3D). Niveau supplémentaire : €10-15.",
    forSegments: [
      "Agences immobilières (supports d’annonces)",
      "Promoteurs (typologies de lots d’un immeuble)",
      "Propriétaires (aménagement intérieur)",
    ],
    featured: true,
    problemHeading: "Un plan technique fait fuir les acheteurs. Un plan clair les attire.",
    problemBody:
      "Un agent publie un appartement avec un plan CAO — traits épais, cotes, échelles. L’acheteur l’ouvre, le referme, ne pose pas de question. Le plan parle une langue qu’un non-initié ne comprend pas — et l’annonce perd un appel qu’elle aurait autrement reçu.",
    problemResolution:
      "Un plan 2D ou 3D clair montre la disposition des pièces avec des couleurs, des libellés lisibles et le mobilier à sa place. Les acheteurs comprennent au premier coup d’œil ce qu’ils achètent — l’annonce devient une conversation.",
    benefits: [
      {
        icon: "trust",
        title: "Les acheteurs comprennent au premier coup d’œil",
        body: "Sans aucune formation technique, les acheteurs voient la disposition, les dimensions et la fonction de chaque pièce. L’annonce filtre les appels de curiosité.",
      },
      {
        icon: "speed",
        title: "Un support d’annonce rapide",
        body: "€20 pour le 2D, €29 pour le 3D — une journée de travail, et vous obtenez un fichier pour l’annonce, la brochure et la présentation.",
      },
      {
        icon: "value",
        title: "Plus de niveaux du même bâtiment pour moins cher",
        body: "Un niveau identique (dupliqué avec changement des libellés) : un tiers du prix. Chaque niveau supplémentaire du même bâtiment : 50 à 66 % moins cher.",
      },
    ],
    processSteps: [
      {
        title: "Envoyez les plans",
        body: "Plans techniques, croquis cotés ou plans PDF existants (PDF/DWG/croquis).",
      },
      {
        title: "Confirmation du devis",
        body: "Nous envoyons le prix et le délai au plus tard le jour ouvré suivant, sans frais cachés.",
      },
      {
        title: "Production du plan",
        body: "L’équipe dessine la version 2D ou 3D avec libellés et cotes. Première ébauche sous 1 à 3 jours ouvrés.",
      },
      {
        title: "Livraison et révisions",
        body: "Vous recevez le plan final dans le format de votre choix. Trois séries de révisions sont incluses dans le prix.",
      },
    ],
    faqs: [
      {
        q: "Que comprennent exactement les prix de €20 / €29 ?",
        a: "€20 donne un niveau en plan vectoriel 2D épuré avec la disposition des pièces, les libellés et les cotes. €29 donne la version 3D du même niveau — une vue spatiale compréhensible sans formation d’architecte. Niveau identique (dupliqué) : €6 (2D) / €10 (3D).",
      },
      {
        q: "2D ou 3D — que choisir ?",
        a: "Pour une annonce d’agence : le 3D, car les acheteurs le comprennent au premier coup d’œil. Pour les démarches réglementaires ou la documentation technique : le 2D, car il suit le standard technique. Pour l’annonce d’un duplex : les deux (chacun sert un objectif différent).",
      },
      {
        q: "Peut-on ajouter du mobilier ?",
        a: "Oui. Version meublée : €6 (2D) ou €8 (3D). Option de design (même agencement, autre mobilier) : €6.",
      },
      {
        q: "Quel est le délai de livraison ?",
        a: "Nous envoyons les premières ébauches sous 1 à 3 jours ouvrés après la confirmation du devis et la réception des plans techniques. Trois séries de révisions sont incluses.",
      },
      {
        q: "Que dois-je envoyer pour commencer ?",
        a: "Des plans techniques, des croquis cotés ou des plans PDF existants. Plus les éléments sont clairs (CAO), plus la production est rapide.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-floor-plans-01.webp",
        alt: "Plan 3D — maison individuelle avec la disposition des pièces et le mobilier",
      },
      {
        src: "/artwork/portfolio-floor-plans-02.webp",
        alt: "Plan 3D — appartement à l’agencement compact",
      },
      {
        src: "/artwork/portfolio-floor-plans-03.webp",
        alt: "Plan 2D — plan technique épuré avec libellés et cotes",
      },
      {
        src: "/artwork/portfolio-floor-plans-04.webp",
        alt: "Plan 3D — duplex avec la disposition des deux niveaux",
      },
    ],
    variants: [
      {
        id: "floorplan-2d",
        title: "Plan 2D (plan technique épuré)",
        basePrice: 20,
        priceLabel: "€20",
        unitLabel: "un niveau (plan 2D)",
        description:
          "Un point d’entrée rapide pour une annonce — un plan clair avec la disposition et les cotes. Niveau identique : €6.",
        included:
          "Un niveau en plan vectoriel 2D épuré. Comprend la disposition des pièces, les libellés et les cotes.",
        addOns: [
          "Deux niveaux (duplex) : €32",
          "Chaque niveau supplémentaire : €10",
          "Niveau identique (dupliqué) : €6 (remise de 70 %)",
          "Version meublée : €6",
          "Changement de couleur / de style du plan : €4",
        ],
        note: "Les plans 2D sont livrés via le réseau de partenaires White Rook.",
      },
      {
        id: "floorplan-3d",
        title: "Plan 3D (vue spatiale)",
        basePrice: 29,
        priceLabel: "€29",
        unitLabel: "un niveau (plan 3D)",
        description:
          "Les acheteurs comprennent l’agencement au premier coup d’œil — sans lecture de symboles. Idéal comme photo d’annonce.",
        included:
          "Un niveau en vue 3D attrayante avec la disposition des pièces, les libellés et les cotes.",
        addOns: [
          "Deux niveaux (duplex) : €46",
          "Chaque niveau supplémentaire : €15",
          "Niveau identique (dupliqué) : €10 (remise de 66 %)",
          "Ajout de mobilier : €8",
          "Option de design (même agencement, autre mobilier) : €6",
        ],
      },
    ],
  },
  {
    slug: "2d-floor-plans",
    code: "floor-plan-2d-dedicated",
    name: "Plans 2D",
    shortName: "Plans 2D",
    category: "plans",
    icon: "file-image",
    tagline: "Un plan 2D épuré — un support rapide pour les annonces et la documentation.",
    description:
      "Un plan 2D vectoriel clair avec la disposition des pièces, leurs noms et les dimensions en mètres. Le format standard pour les annonces immobilières, les démarches réglementaires et les présentations clients. €20 couvre un niveau ; un niveau identique (dupliqué avec changement des libellés) ne coûte que €6 — 70 % moins cher.",
    highlight:
      "L’entrée la moins chère vers un plan professionnel pour une annonce — sans budget 3D, dans un format conforme à la documentation et aux contrats.",
    materials:
      "Envoyez des plans techniques (PDF/DWG), des croquis cotés ou un plan PDF existant. Première ébauche sous 1 à 3 jours ouvrés.",
    asset: "/artwork/listing-floorplan-2d.webp",
    listingAsset: "/artwork/listing-floorplan-2d.webp",
    detailAsset: "/artwork/detail-2d-floor-plans-2c.webp",
    detailBeforeAsset: "/artwork/problem-2d-floor-plans-black-white.webp",
    detailAfterAsset: "/artwork/problem-2d-floor-plans-color.webp",
    detailBeforeAlt:
      "Plan 2D épuré en noir et blanc d’un appartement deux pièces avec les noms des pièces et les dimensions en mètres",
    detailAfterAlt:
      "Plan 2D en couleurs du même appartement avec mobilier — salon, chambre, cuisine et salle de bains",
    philosophy:
      "Le plan 2D est le format qui accompagne la documentation, les annonces et les contrats. Le prix couvre un niveau en plan vectoriel épuré avec libellés et cotes. Un niveau identique (dupliqué avec changement des libellés) ne coûte que €6 — 70 % moins cher. Un immeuble avec plusieurs typologies de lots obtient sa série d’annonces complète pour une fraction du prix d’un bureau CAO. La livraison via le réseau de partenaires White Rook garantit une qualité constante et un délai court.",
    priceContext:
      "€20 — un niveau (plan vectoriel 2D épuré). Niveau identique (dupliqué) : €6.",
    forSegments: [
      "Agences immobilières (supports d’annonces)",
      "Promoteurs (typologies de lots d’un immeuble)",
      "Architectes (documentation et annexes)",
    ],
    problemHeading: "Un export CAO ne vend pas. Un plan 2D clair, si.",
    problemBody:
      "Un agent publie un appartement avec un export CAO brut — traits épais, cotes en millimètres, échelles et symboles techniques pour les fenêtres et les portes. L’acheteur l’ouvre, voit un dessin qu’il ne comprend pas et referme l’annonce. La documentation technique n’est pas un support marketing.",
    problemResolution:
      "Un plan 2D clair conserve la précision de la CAO — dimensions exactes, disposition, descriptions des pièces — mais dans un format compréhensible par un non-initié : en couleurs, avec les noms des pièces, les dimensions en mètres et une couche de mobilier en option. Le même plan, deux publics.",
    benefits: [
      {
        icon: "speed",
        title: "L’entrée la plus rapide dans une annonce",
        body: "€20, première ébauche sous 1 à 3 jours ouvrés. Le prix d’entrée le plus bas pour un plan professionnel directement utilisable dans une annonce.",
      },
      {
        icon: "value",
        title: "Un tiers du prix par niveau supplémentaire",
        body: "Un niveau identique (dupliqué avec changement des libellés) : seulement €6 — remise de 70 %. Un immeuble avec 5 typologies de lots obtient la série complète pour €44.",
      },
      {
        icon: "trust",
        title: "Un standard conforme à la documentation",
        body: "Le plan 2D est le format attendu par les contrats, les banques et les démarches réglementaires. Utilisez le même fichier dans une brochure et dans une annexe juridique.",
      },
    ],
    processSteps: [
      {
        title: "Envoyez le plan technique",
        body: "PDF, DWG, un croquis coté ou une photo du plan existant. Plus les éléments sont clairs (CAO), plus la production est rapide.",
      },
      {
        title: "Confirmation du devis",
        body: "Nous envoyons le prix et le délai au plus tard le jour ouvré suivant, sans frais cachés.",
      },
      {
        title: "Production du plan 2D",
        body: "L’équipe dessine un plan vectoriel épuré avec libellés, cotes et mobilier en option. Première ébauche sous 1 à 3 jours ouvrés.",
      },
      {
        title: "Livraison et révisions",
        body: "Vous recevez le PDF final et le fichier vectoriel. Trois séries de révisions sont incluses dans le prix — sans supplément.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-2d-floor-plans-apartment-01-r2.webp",
        alt: "Plan 2D en couleurs d’un rez-de-chaussée — salon, salle à manger et cuisine, Elegant Render",
        beforeSrc: "/artwork/portfolio-2d-floor-plans-apartment-01-before-r2.webp",
        beforeAlt: "Plan 2D technique en noir et blanc du rez-de-chaussée avant la mise en couleurs, Elegant Render",
      },
      {
        src: "/artwork/portfolio-2d-floor-plans-apartment-02-r2.webp",
        alt: "Plan 2D en couleurs d’un niveau avec garage — chambre, salle de bains et garage, Elegant Render",
        beforeSrc: "/artwork/portfolio-2d-floor-plans-apartment-02-before-r2.webp",
        beforeAlt: "Plan 2D technique en noir et blanc du niveau avec garage avant la mise en couleurs, Elegant Render",
      },
      {
        src: "/artwork/portfolio-2d-floor-plans-apartment-03-r2.webp",
        alt: "Plan 2D en couleurs d’un niveau avec double garage — chambre, salle de bains et deux places de stationnement, Elegant Render",
        beforeSrc: "/artwork/portfolio-2d-floor-plans-apartment-03-before-r2.webp",
        beforeAlt: "Plan 2D technique en noir et blanc du niveau avec double garage avant la mise en couleurs, Elegant Render",
      },
      {
        src: "/artwork/portfolio-2d-floor-plans-apartment-04-r2.webp",
        alt: "Plan 2D en couleurs d’un appartement — chambre, salle de bains, cuisine et salon, Elegant Render",
        beforeSrc: "/artwork/portfolio-2d-floor-plans-apartment-04-before-r2.webp",
        beforeAlt: "Plan 2D technique en noir et blanc de l’appartement avant la mise en couleurs, Elegant Render",
      },
    ],
    faqs: [
      {
        q: "Que comprend exactement le prix de €20 ?",
        a: "Un niveau en plan vectoriel 2D épuré avec la disposition des pièces, leurs noms et les dimensions en mètres. Niveau identique (dupliqué avec changement des libellés) : €6 (remise de 70 %). Version meublée : +€6. Changement de couleur/style : +€4.",
      },
      {
        q: "Quelle différence avec un export CAO de mon projet ?",
        a: "Un export CAO suit le standard technique du projet — traits épais, cotes en millimètres, échelles. Notre plan 2D est un format marketing : en couleurs, avec ou sans mobilier, avec des dimensions lisibles par un non-initié. Des usages différents, pas des alternatives.",
      },
      {
        q: "Quand choisir le 2D plutôt que le 3D ?",
        a: "Pour les démarches réglementaires, les contrats, la documentation technique, ou quand l’annonce suit le standard technique du secteur. Pour les annonces d’agence et les présentations grand public, la version 3D (€29) fonctionne mieux — les acheteurs saisissent l’agencement plus vite.",
      },
      {
        q: "Réalisez-vous plusieurs niveaux d’un bâtiment ?",
        a: "Oui. Deux niveaux (duplex) : €32. Chaque niveau supplémentaire : €10. Un niveau identique (dupliqué avec changement des libellés) : seulement €6 — remise de 70 %.",
      },
      {
        q: "Quel est le délai de livraison ?",
        a: "Nous envoyons les premières ébauches sous 1 à 3 jours ouvrés après la confirmation du devis et la réception des plans techniques. Trois séries de révisions sont incluses.",
      },
      {
        q: "Que dois-je envoyer pour commencer ?",
        a: "Des plans techniques (PDF/DWG), des croquis cotés ou une photo du plan existant. Plus les éléments sont clairs (CAO), plus la production est rapide.",
      },
    ],
    variants: [
      {
        id: "floorplan-2d",
        title: "Plan 2D (plan technique épuré)",
        basePrice: 20,
        priceLabel: "€20",
        unitLabel: "un niveau (plan 2D)",
        description:
          "Un point d’entrée rapide pour une annonce — un plan clair avec la disposition et les cotes. Niveau identique : €6.",
        included:
          "Un niveau en plan vectoriel 2D épuré. Comprend la disposition des pièces, les libellés et les cotes.",
        addOns: [
          "Deux niveaux (duplex) : €32",
          "Chaque niveau supplémentaire : €10",
          "Niveau identique (dupliqué) : €6 (remise de 70 %)",
          "Version meublée : €6",
          "Changement de couleur / de style du plan : €4",
        ],
        note: "Les plans 2D sont livrés via le réseau de partenaires White Rook.",
      },
    ],
  },
  {
    slug: "3d-floor-plans",
    code: "floor-plan-3d-dedicated",
    name: "Plans 3D",
    shortName: "Plans 3D",
    category: "plans",
    icon: "layers",
    tagline: "Un plan 3D spatial que les acheteurs comprennent au premier coup d’œil.",
    description:
      "Une vue spatiale 3D attrayante du plan avec mobilier, libellés et couleurs. Le format le plus fort pour les annonces d’agence — les acheteurs voient la disposition et la fonction de chaque pièce sans lire de symboles techniques. €29 couvre un niveau ; un niveau identique (dupliqué avec changement des libellés) ne coûte que €10 — 66 % moins cher.",
    highlight:
      "Le bon choix pour la photo d’annonce et la brochure — les acheteurs comprennent au premier coup d’œil ce qu’ils obtiennent.",
    materials:
      "Envoyez des plans techniques (PDF/DWG), des croquis cotés ou un plan PDF existant. Première ébauche sous 1 à 3 jours ouvrés.",
    asset: "/artwork/listing-3d-floor-plans.webp",
    listingAsset: "/artwork/listing-3d-floor-plans.webp",
    detailAsset: "/artwork/detail-3d-floor-plans.webp",
    detailBeforeAsset: "/artwork/problem-3d-floor-plans-before.webp",
    detailAfterAsset: "/artwork/problem-3d-floor-plans-after.webp",
    detailBeforeAlt:
      "Plan technique 2D d’un appartement avant le traitement 3D — traits, libellés et disposition des pièces",
    detailAfterAlt:
      "Plan 3D spatial du même appartement après traitement — mobilier, matériaux et couleurs en vue à vol d’oiseau",
    philosophy:
      "La vue spatiale 3D est un format marketing — les acheteurs voient l’agencement avec mobilier et couleurs, sans lire de libellés. Le prix de €29 couvre un niveau. Un niveau identique (dupliqué avec changement des libellés) ne coûte que €10 — 66 % moins cher. Duplex et immeubles à plusieurs typologies tiennent dans un budget d’annonce réaliste — sans remodéliser chaque niveau.",
    priceContext:
      "€29 — un niveau (vue spatiale 3D). Niveau identique (dupliqué) : €10.",
    forSegments: [
      "Agences immobilières (photo d’annonce)",
      "Promoteurs (typologies de lots d’un immeuble)",
      "Propriétaires (annonce et vente)",
    ],
    problemHeading: "Un plan technique fait fuir les acheteurs. Une vue 3D les attire.",
    problemBody:
      "Un acheteur ouvre une annonce avec un plan technique 2D — traits, libellés, symboles pour les fenêtres et les portes. Il lui faut une minute rien que pour trouver la cuisine. L’annonce suivante montre une vue 3D avec mobilier — et l’acheteur clique pour appeler.",
    problemResolution:
      "La vue spatiale 3D montre l’agencement à vol d’oiseau avec le mobilier à sa place, les matériaux des sols et les couleurs des murs. Les acheteurs voient un logement, pas un schéma — et la décision commence dès le premier contact.",
    benefits: [
      {
        icon: "trust",
        title: "Les acheteurs comprennent sans formation technique",
        body: "Aucune lecture de symboles — les acheteurs voient les pièces, le mobilier et la circulation. L’annonce attire des appels sérieux ; les appels de curiosité disparaissent.",
      },
      {
        icon: "speed",
        title: "Un support d’annonce rapide",
        body: "€29, première ébauche sous 1 à 3 jours ouvrés. Directement utilisable dans les annonces, brochures et présentations.",
      },
      {
        icon: "value",
        title: "Plusieurs typologies pour moins cher",
        body: "Un niveau identique (dupliqué) : seulement €10 — remise de 66 %. Un immeuble avec 4 typologies de lots obtient une série d’annonces complète pour €59.",
      },
    ],
    processSteps: [
      {
        title: "Envoyez le plan technique",
        body: "PDF, DWG, un croquis coté ou une photo du plan existant. Plus les éléments sont clairs (CAO), plus la production est rapide.",
      },
      {
        title: "Confirmation du devis",
        body: "Nous envoyons le prix et le délai au plus tard le jour ouvré suivant, sans frais cachés.",
      },
      {
        title: "Production du plan 3D",
        body: "L’équipe modélise l’espace en 3D et place le mobilier, les matériaux et l’éclairage. Première ébauche sous 1 à 3 jours ouvrés.",
      },
      {
        title: "Livraison et révisions",
        body: "Vous recevez l’image finale en haute résolution. Trois séries de révisions sont incluses dans le prix — sans supplément.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-3d-floor-plans-apartment-01.webp",
        alt: "Plan 3D d’un appartement — vue photoréaliste de l’agencement avec mobilier et matériaux à vol d’oiseau, Elegant Render",
        beforeSrc: "/artwork/portfolio-3d-floor-plans-apartment-01-before.webp",
        beforeAlt: "Plan 2D technique en noir et blanc du même appartement avec cotes et noms des pièces",
      },
      {
        src: "/artwork/portfolio-3d-floor-plans-apartment-02.webp",
        alt: "Plan 3D d’un appartement — vue 3D de l’agencement et du mobilier, vue de dessus, Elegant Render",
        beforeSrc: "/artwork/portfolio-3d-floor-plans-apartment-02-before.webp",
        beforeAlt: "Plan 2D technique en noir et blanc du même appartement avant la vue 3D",
      },
      {
        src: "/artwork/portfolio-3d-floor-plans-apartment-03.webp",
        alt: "Plan 3D d’un appartement — plan 3D photoréaliste avec mobilier et matériaux, Elegant Render",
        beforeSrc: "/artwork/portfolio-3d-floor-plans-apartment-03-before.webp",
        beforeAlt: "Plan 2D technique en noir et blanc du même appartement avec cotes",
      },
      {
        src: "/artwork/portfolio-3d-floor-plans-apartment-04.webp",
        alt: "Plan 3D d’un appartement — vue 3D de la disposition des pièces et du mobilier à vol d’oiseau, Elegant Render",
        beforeSrc: "/artwork/portfolio-3d-floor-plans-apartment-04-before.webp",
        beforeAlt: "Plan 2D technique en noir et blanc du même appartement avec les noms des pièces",
      },
    ],
    faqs: [
      {
        q: "Que comprend exactement le prix de €29 ?",
        a: "Un niveau en vue spatiale 3D attrayante avec la disposition des pièces, les libellés, le mobilier et les matériaux. Niveau identique (dupliqué avec changement des libellés) : €10 (remise de 66 %). Ajout de mobilier : +€8. Option de design (même agencement, autre mobilier) : +€6.",
      },
      {
        q: "Quelle différence avec un rendu d’intérieur ?",
        a: "Un rendu d’intérieur (€170 par niveau) montre une pièce à hauteur d’œil — comme si vous vous teniez à l’intérieur. Un plan 3D est une vue à vol d’oiseau du niveau entier, toit retiré — vous voyez l’agencement, pas la pièce. Des usages différents ; ils sont souvent commandés ensemble pour une brochure.",
      },
      {
        q: "Quand choisir le 3D plutôt que le 2D ?",
        a: "Pour les annonces d’agence, les brochures et les présentations clients où l’acheteur n’est pas architecte — le 3D gagne. Pour les démarches réglementaires, les contrats ou les annexes techniques, la version 2D (€20) suit le standard du secteur.",
      },
      {
        q: "Puis-je le commander avec ou sans mobilier ?",
        a: "Les deux. Sans mobilier est l’option standard. Avec mobilier : +€8. Une option de design (même agencement, autre mobilier — utile pour des tests A/B auprès des acheteurs) : +€6.",
      },
      {
        q: "Réalisez-vous plusieurs niveaux d’un bâtiment ?",
        a: "Oui. Deux niveaux (duplex) : €46. Chaque niveau supplémentaire : €15. Un niveau identique (dupliqué avec changement des libellés) : seulement €10 — remise de 66 %.",
      },
      {
        q: "Quel est le délai de livraison ?",
        a: "Nous envoyons les premières ébauches sous 1 à 3 jours ouvrés après la confirmation du devis et la réception des plans techniques. Trois séries de révisions sont incluses.",
      },
    ],
    variants: [
      {
        id: "floorplan-3d",
        title: "Plan 3D (vue spatiale)",
        basePrice: 29,
        priceLabel: "€29",
        unitLabel: "un niveau (plan 3D)",
        description:
          "Les acheteurs comprennent l’agencement au premier coup d’œil — sans lecture de symboles. Idéal comme photo d’annonce.",
        included:
          "Un niveau en vue 3D attrayante avec la disposition des pièces, les libellés et les cotes.",
        addOns: [
          "Deux niveaux (duplex) : €46",
          "Chaque niveau supplémentaire : €15",
          "Niveau identique (dupliqué) : €10 (remise de 66 %)",
          "Ajout de mobilier : €8",
          "Option de design (même agencement, autre mobilier) : €6",
        ],
      },
    ],
  },
  {
    slug: "vr-tour",
    code: "vr-tour-assembly",
    name: "Visite en réalité virtuelle (VR)",
    shortName: "Visite VR",
    category: "animations",
    icon: "images",
    tagline: "Reliez vos panoramas en une seule visite que les acheteurs explorent depuis leur fauteuil.",
    description:
      "Nous relions les panoramas 360° que vous avez déjà commandés (extérieur, intérieur, staging) en une seule visite VR avec navigation interactive, hébergement et code d’intégration pour votre site. Les acheteurs ouvrent un lien dans leur navigateur ou leur casque VR, se déplacent entre les points et explorent l’espace par eux-mêmes.",
    highlight:
      "Le complément naturel des panoramas 360° déjà commandés — prix bas, livraison rapide, prêt pour les casques VR.",
    materials:
      "Envoyez les panoramas 360° dont vous disposez déjà (de nous ou d’une autre source) et le schéma de navigation entre les points. Nous mettons l’hébergement en place sous 1 à 2 jours ouvrés.",
    asset: PORTFOLIO_ASSET,
    detailAsset: "/artwork/detail-interior-360.webp",
    embedSrc:
      "https://kuula.co/share/collection/7k7GQ?logo=1&info=0&fs=1&vr=1&sd=1&autorotate=0.04&autop=30&thumbs=1",
    detailEmbedSrc:
      "https://kuula.co/share/collection/7kLnB?logo=1&info=0&fs=1&vr=1&sd=1&autorotate=0.04&autop=30&thumbs=1",
    philosophy:
      "Les forfaits 360° eux-mêmes (extérieur €335, intérieur €295) comprennent déjà un ou plusieurs points interactifs et un code d’intégration. Une visite VR devient utile quand vous reliez plusieurs panoramas de projets différents ou ajoutez une navigation par plan — l’assemblage et l’hébergement sont alors une prestation à part.",
    priceContext:
      "€20 — assemblage + hébergement + code d’intégration. Navigation par plan : €15. Visite à votre marque : €35.",
    forSegments: [
      "Promoteurs (présentations complètes de projets)",
      "Agences immobilières (plusieurs appartements dans une même visite)",
      "Architectes (présentations clients avec plusieurs pièces)",
    ],
    featured: true,
    problemEmbedSrc:
      "https://kuula.co/share/collection/714Xg?logo=0&info=0&fs=1&vr=1&sd=1&initload=0&thumbs=1",
    problemHeading: "De beaux panoramas mal reliés — les acheteurs se perdent.",
    problemBody:
      "Vous avez 5 panoramas 360° d’intérieur et 3 d’extérieur, mais vous les envoyez comme des liens séparés. L’acheteur en ouvre un, voit une pièce, doit revenir à l’e-mail et ouvrir le suivant. Il décroche avant d’avoir visité la moitié de l’appartement.",
    problemResolution:
      "Une visite VR relie tous vos panoramas en un seul parcours avec des points interactifs et une navigation par plan. L’acheteur ouvre un seul lien et visite tout le projet — sans perdre le fil.",
    benefits: [
      {
        icon: "trust",
        title: "Un seul lien, tout le projet",
        body: "Tous les panoramas dans un parcours continu. Les acheteurs voient comment les pièces se relient, pas des fragments.",
      },
      {
        icon: "speed",
        title: "Une livraison rapide",
        body: "Nous l’assemblons sous 1 à 2 jours ouvrés. L’hébergement et le code d’intégration sont livrés le jour même où la structure est finalisée.",
      },
      {
        icon: "value",
        title: "Un complément abordable aux panoramas déjà commandés",
        body: "€20 l’assemblage de base. Navigation par plan : €15. Visite à votre marque avec votre logo : €35.",
      },
    ],
    processSteps: [
      {
        title: "Envoyez les panoramas",
        body: "Les panoramas 360° dont vous disposez déjà (liens ou fichiers) et le schéma de navigation entre les points.",
      },
      {
        title: "Confirmation du devis",
        body: "Nous envoyons le prix et le délai au plus tard le jour ouvré suivant.",
      },
      {
        title: "Assemblage et hébergement",
        body: "Nous relions les panoramas, ajoutons la navigation par points interactifs et mettons la visite sur notre hébergement. Première ébauche sous 1 à 2 jours ouvrés.",
      },
      {
        title: "Livraison du lien et du code d’intégration",
        body: "Vous recevez un lien à partager et un code d’intégration pour votre site. Trois séries de révisions pour la navigation et la structure sont incluses.",
      },
    ],
    faqs: [
      {
        q: "La visite VR comprend-elle la production des panoramas ?",
        a: "Non. La visite VR est un complément à des panoramas déjà existants. Si nous devons d’abord produire les panoramas, commandez l’extérieur 360° (€335) ou la visite 360° d’intérieur (€295) — ces forfaits comprennent déjà un point interactif et un code d’intégration pour le panorama individuel.",
      },
      {
        q: "Et si mes panoramas ne viennent pas de chez vous ?",
        a: "Aucun problème. Nous assemblons tous les panoramas 360° aux formats standards (équirectangulaire ou cube maps assemblées). L’hébergement est chez nous ; le lien se partage et s’intègre facilement.",
      },
      {
        q: "Cela fonctionne-t-il avec un casque VR ?",
        a: "Oui. La visite est prête pour la VR en standard — les casques Meta Quest et compatibles l’ouvrent directement depuis le navigateur, sans application supplémentaire.",
      },
      {
        q: "Quel est le délai de livraison ?",
        a: "1 à 2 jours ouvrés après la confirmation du devis et la réception des panoramas.",
      },
      {
        q: "Que dois-je envoyer ?",
        a: "Les panoramas dont vous disposez déjà (liens ou fichiers), le schéma de navigation entre les points et, en option, vos éléments de marque (logo, couleurs).",
      },
    ],
    variants: [
      {
        id: "tour-assembly",
        title: "Visite VR — assemblage et hébergement",
        basePrice: 20,
        priceLabel: "€20",
        unitLabel: "assemblage et hébergement de la visite interactive",
        description:
          "Quand une série de panoramas 360° existe déjà, cette étape les relie en une seule visite interactive sur votre site.",
        included:
          "Assemblage d’une visite virtuelle 360° à partir de panoramas existants, hébergement et partage via un lien ou une intégration sur votre site.",
        addOns: [
          "Navigation interactive par plan : €15",
          "Une visite à votre marque (logo, couleurs) : €35",
        ],
        note: "Il s’agit d’un complément à des panoramas 360° déjà produits, pas du prix de production du contenu 360° lui-même.",
      },
    ],
  },
  {
    slug: "architectural-animation",
    code: "architectural-animation",
    name: "Animation architecturale",
    shortName: "Animation architecturale",
    category: "animations",
    icon: "layers",
    tagline: "Un film marketing où la caméra traverse le bâtiment.",
    description:
      "Une animation architecturale transforme votre modèle 3D en un film de 30 secondes où la caméra traverse le bâtiment, révélant l’espace scène par scène. Un outil marketing pour les brochures, les présentations aux investisseurs et les campagnes sur les réseaux sociaux. Minimum 15 secondes (€225).",
    highlight:
      "Pour les promoteurs qui veulent une présentation spectaculaire d’un ensemble et les agences qui veulent une annonce qui soit plus qu’une galerie d’images.",
    materials:
      "Envoyez les plans, les élévations et, si vous en avez un, un modèle 3D existant. Définissez le parcours de caméra et les moments clés souhaités.",
    asset: PORTFOLIO_ASSET,
    detailAsset: "/artwork/detail-exterior-aerial.webp",
    problemVideoSrc: "/artwork/architectural-animation-demo.mp4",
    problemVideoPoster: "/artwork/architectural-animation-demo-poster.webp",
    philosophy:
      "Le poste de coût principal est la construction du modèle 3D. Animation à partir de zéro : €15/sec. À partir d’un modèle existant : €10/sec (33 % moins cher). Un projet actif (modèle encore en cours) : €8/sec (47 % moins cher). Les animations plus longues bénéficient d’une remise automatique : au-delà de 60 sec −20 %, au-delà de 2 minutes −25 %.",
    priceContext:
      "€15/sec à partir de zéro · €10/sec à partir d’un modèle existant · minimum 15 sec (€225).",
    forSegments: [
      "Promoteurs (campagnes marketing)",
      "Agences immobilières (annonces premium)",
      "Projets d’aménagement (présentations de plans d’ensemble)",
    ],
    featured: true,
    problemHeading: "Une image statique n’émeut personne. Un film, si.",
    problemBody:
      "Une brochure de 10 images retient peu l’attention. Le client fait défiler, referme, oublie. Une campagne sur les réseaux sociaux a besoin de mouvement, pas d’images figées.",
    problemResolution:
      "Une animation architecturale vous donne 30 secondes d’espace que la caméra traverse, révélant l’intérieur, l’extérieur et le contexte en un seul récit. L’annonce prend la qualité d’une bande-annonce de film.",
    benefits: [
      {
        icon: "speed",
        title: "Amène les clients plus vite à l’étape sérieuse",
        body: "Un client qui voit l’animation comprend le projet en 30 secondes. Les échanges commencent par des questions de détail, pas par l’emprise au sol.",
      },
      {
        icon: "value",
        title: "Un prix plus bas à partir d’un modèle existant",
        body: "Si nous avons déjà produit votre rendu d’extérieur ou d’intérieur, le modèle existe — l’animation coûte €10/sec au lieu de €15/sec (remise de 33 %). Un projet actif : €8/sec (remise de 47 %).",
      },
      {
        icon: "trust",
        title: "Un support pour chaque canal",
        body: "Une seule animation devient une vidéo YouTube, un reel Instagram, une intégration dans la brochure et une présentation en réunion. Multicanal à partir d’un seul investissement.",
      },
    ],
    processSteps: [
      {
        title: "Envoyez vos éléments",
        body: "Les plans, les élévations, un modèle 3D existant (si vous en avez un) et une description du parcours de caméra souhaité.",
      },
      {
        title: "Confirmation du devis",
        body: "Nous envoyons le prix par seconde et le budget total sous un jour ouvré.",
      },
      {
        title: "Animation",
        body: "Nous réglons la caméra, les matériaux et l’éclairage, puis calculons toutes les images. Première ébauche sous 5 à 7 jours ouvrés (selon la durée).",
      },
      {
        title: "Livraison",
        body: "Vous recevez le film final (MP4, résolution 4K). Trois séries de révisions du parcours de caméra sont incluses.",
      },
    ],
    faqs: [
      {
        q: "Que comprend exactement le prix de €225 ?",
        a: "15 secondes d’animation à partir d’un nouveau modèle 3D. Prix par seconde : €15. Si nous avons déjà votre modèle : €10/sec (€150 pour 15 sec). Un projet actif (modèle en cours) : €8/sec (€120 pour 15 sec).",
      },
      {
        q: "Quelle différence avec une visite vidéo filmée ?",
        a: "Une visite vidéo filme un espace existant. Une animation architecturale construit à partir des plans un espace qui n’existe pas encore — vous pouvez filmer un bâtiment non construit, avec des matériaux de façade fidèles et les abords.",
      },
      {
        q: "Sous quel délai est livrée l’animation ?",
        a: "Le délai standard est de 5 à 7 jours ouvrés pour 15 à 30 secondes. Les animations plus longues sont livrées par étapes, selon accord. Trois séries de révisions du parcours de caméra sont incluses.",
      },
      {
        q: "Puis-je modifier le parcours de caméra après la première ébauche ?",
        a: "Oui. Au fil des trois séries de révisions, nous modifions le parcours, la vitesse, les transitions et les moments clés. Les matériaux, l’éclairage et la géométrie sont figés après la première révision.",
      },
      {
        q: "Que dois-je envoyer ?",
        a: "Les plans d’architecte (PDF/DWG), un modèle 3D existant si vous en avez un (FBX, OBJ, SKP), une description du parcours de caméra et des moments clés. En option : la musique ou un brief sonore.",
      },
    ],
    variants: [
      {
        id: "animation-from-scratch",
        title: "Animation architecturale (à partir de zéro)",
        basePrice: 15,
        priceLabel: "€15/sec",
        unitLabel: "par seconde (minimum 15 sec = €225)",
        description:
          "Un film marketing où la caméra traverse le bâtiment. Minimum 15 secondes. Si nous avons déjà votre modèle : remise de 33 %.",
        included:
          "Construction complète du modèle 3D + conception du parcours de caméra + rendu de l’animation (minimum 15 sec).",
        addOns: [
          "Si nous avons déjà votre modèle 3D : €10/sec (remise de 33 %)",
          "Projet de rendu actif : €8/sec (remise de 47 %)",
          "Parcours de caméra supplémentaire dans le même modèle : €5/sec",
          "Version en éclairage nocturne : +30 %",
          "Variante saisonnière (hiver/été) : +40 %",
          "Remise de durée : 31-60 s −10 %, 61-120 s −20 %, 120 s et plus −25 %",
        ],
      },
    ],
  },
  {
    slug: "landscape-design",
    code: "landscape-rendering",
    name: "Aménagement paysager",
    shortName: "Aménagement paysager",
    category: "exterior",
    icon: "tree",
    tagline:
      "Un paysage 3D d’après votre plan, ou une nouvelle image de votre jardin — sans attendre que les plantes poussent.",
    description:
      "Deux options — un même résultat : voir l’espace extérieur fini avant le début des travaux ou avant de dépenser pour les plantations. Un rendu paysager (3D) d’après plan dès €220. Une rénovation virtuelle d’après une photo de votre jardin existant dès €66.",
    highlight:
      "Pour les architectes paysagistes qui présentent un projet à leur client et les promoteurs qui conçoivent les espaces partagés d’un ensemble.",
    materials:
      "Envoyez-nous le plan de masse, les données de nivellement et une spécification des plantes et des matériaux.",
    asset: "/artwork/expert-landscape-design-after.webp",
    beforeAsset: "/artwork/expert-landscape-design-before.webp",
    afterAsset: "/artwork/expert-landscape-design-after.webp",
    detailAsset: "/artwork/detail-landscape-design.webp",
    detailBeforeAsset: "/artwork/problem-landscape-design-before.webp",
    detailAfterAsset: "/artwork/problem-landscape-design-after.webp",
    detailBeforeAlt:
      "Maison individuelle moderne avec une parcelle nue, non aménagée, avant l’aménagement paysager",
    detailAfterAlt:
      "Maison individuelle moderne avec un jardin fini — pelouse entretenue, jeunes plantations et allée pavée après l’aménagement paysager",
    philosophy:
      "Le prix du rendu paysager (€220) couvre la modélisation du terrain, la végétation à maturité et la première vue. Chaque angle supplémentaire du même lieu coûte €45 — 80 % moins cher, car le terrain est déjà construit. La rénovation virtuelle (€66) fonctionne autrement : pas de modèle 3D — nous plaçons les nouveaux matériaux et plantes directement sur votre photo. Plus rapide et moins cher, mais lié à l’angle photographié. Options de la rénovation : deuxième angle €59, 4e et suivants €53, deuxième jardin €56. Tous les prix sont en EUR.",
    priceContext:
      "€220 — terrain complet + végétation + la première vue. Angle suivant : €45 (80 % moins cher).",
    forSegments: [
      "Architectes paysagistes (présentations clients)",
      "Promoteurs (espaces partagés d’ensembles)",
      "Propriétaires de parcelles préparant un aménagement",
    ],
    problemHeading: "Une parcelle nue ne montre pas la valeur. Un paysage fini, si.",
    problemBody:
      "Le client regarde un plan paysager couvert de symboles et ne voit pas à quoi ressemblera réellement le jardin. Sans visuel, le concepteur ne peut pas défendre le prix de l’aménagement, le promoteur n’obtient pas de validation, et l’acheteur de la parcelle ne voit pas le potentiel.",
    problemResolution:
      "Le rendu paysager (€220) construit un modèle 3D complet du terrain et de la végétation d’après votre plan — chaque angle supplémentaire du même lieu coûte €45. La rénovation virtuelle (€66) redessine votre jardin existant directement sur la photo — sans modèle 3D, plus rapide et moins cher.",
    benefits: [
      {
        icon: "trust",
        title: "Le client voit le résultat final",
        body: "Un architecte paysagiste présente le projet avec une visualisation qui remplace des dizaines d’explications. Le client signe plus vite.",
      },
      {
        icon: "context",
        title: "Une preuve de valeur pour les promoteurs",
        body: "Les espaces partagés d’un ensemble vendent les lots. Un rendu les rend tangibles pour l’équipe commerciale, le fonds et les acheteurs.",
      },
      {
        icon: "value",
        title: "Plusieurs angles depuis un même terrain modélisé",
        body: "€220 couvre le terrain complet et la première vue. Chaque angle supplémentaire du même lieu : €45 (80 % moins cher).",
      },
    ],
    processSteps: [
      {
        title: "Envoyez le plan",
        body: "Le plan de masse, les données de nivellement et une spécification des plantes et des matériaux (pierre, pavage, points d’eau).",
      },
      {
        title: "Confirmation du devis",
        body: "Nous envoyons le prix et le délai au plus tard le jour ouvré suivant, sans frais cachés.",
      },
      {
        title: "Modélisation et rendu",
        body: "L’équipe modélise le terrain et place la végétation, les allées et les matériaux. Nous envoyons les premières ébauches sous 3 à 5 jours ouvrés.",
      },
      {
        title: "Livraison et révisions",
        body: "Vous recevez les visuels finaux. Trois séries de révisions sont incluses dans le prix — sans supplément.",
      },
    ],
    faqs: [
      {
        q: "Pourquoi la rénovation virtuelle est-elle moins chère que le rendu 3D ?",
        a: "Le rendu paysager (€220) construit un modèle 3D complet du terrain et de la végétation d’après le plan — un processus plus long qui permet un libre choix d’angle de vue et des vues aériennes. La rénovation virtuelle (€66) ne construit pas de modèle 3D — nous plaçons les nouveaux matériaux et plantes directement sur votre photo. C’est plus rapide et moins cher, mais lié à l’angle et à la perspective de la photo. Si l’espace n’existe pas encore ou qu’il vous faut plusieurs angles, le rendu 3D est la seule option.",
      },
      {
        q: "Que comprend exactement le prix de €220 ?",
        a: "La modélisation complète du terrain, le placement de la végétation et des allées, et le premier rendu final. Chaque angle supplémentaire du même lieu : €45 (remise de 80 %). Majoration pour une face non montrée du terrain : +25 % une seule fois par modèle. Vue aérienne de tout le lieu : €380.",
      },
      {
        q: "Quelle différence avec un rendu d’extérieur classique ?",
        a: "Un rendu d’extérieur montre la façade du bâtiment et ses abords. Un rendu paysager se concentre sur l’aménagement — allées pavées, plantes à maturité, pierre d’accent, points d’eau. Des usages différents.",
      },
      {
        q: "Quel est le niveau de détail de la végétation ?",
        a: "La végétation est montrée à une maturité réaliste — pas comme plantée d’hier, mais telle qu’elle sera dans 2 à 3 ans. Vous choisissez feuillus/persistants, arbres d’accent et plantes ornementales dans notre catalogue ou d’après des références.",
      },
      {
        q: "Travaillez-vous aussi sur des ensembles résidentiels, pas seulement des jardins privés ?",
        a: "Oui. Les espaces partagés des ensembles résidentiels sont un scénario tout aussi courant. La seule différence est la taille du terrain — le prix reste €220 pour la première vue, angles supplémentaires €45.",
      },
      {
        q: "Quel est le délai de livraison ?",
        a: "Nous envoyons les premières ébauches sous 3 à 5 jours ouvrés après la confirmation du devis et la réception du plan de masse. Trois séries de révisions sont incluses.",
      },
      {
        q: "Que dois-je envoyer pour commencer ?",
        a: "Le plan de masse au format PDF ou DWG, les données de nivellement du terrain et une spécification ou des références pour les plantes et les matériaux (pierre, pavage, points d’eau).",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-landscape-design-ld-01.webp",
        alt: "Aménagement paysager — jardin privé d’une maison individuelle avec terrasse et pelouse",
        beforeSrc: "/artwork/portfolio-landscape-design-ld-01-before.webp",
        beforeAlt: "Un jardin non aménagé avant le projet — terrain nivelé sans végétation",
      },
      {
        src: "/artwork/portfolio-landscape-design-ld-02.webp",
        alt: "Aménagement paysager — espace partagé d’un ensemble résidentiel avec allées de promenade",
        beforeSrc: "/artwork/portfolio-landscape-design-ld-02-before.webp",
        beforeAlt: "Un espace partagé non aménagé avant le projet — sol nu sans plantations",
      },
      {
        src: "/artwork/portfolio-landscape-design-ld-03.webp",
        alt: "Aménagement paysager — jardin de villa avec piscine et terrasse",
        beforeSrc: "/artwork/portfolio-landscape-design-ld-03-before.webp",
        beforeAlt: "Un jardin de villa non aménagé avant le projet — terrain vide avant les plantations",
      },
      {
        src: "/artwork/portfolio-landscape-design-ld-04.webp",
        alt: "Aménagement paysager — espace public avec allée pavée et plantations à maturité",
        beforeSrc: "/artwork/portfolio-landscape-design-ld-04-before.webp",
        beforeAlt: "Un espace public non aménagé avant le projet — terrain nivelé sans végétation",
      },
    ],
    pricingLead: {
      heading: "Comment choisir la bonne option ?",
      body: "L’espace n’existe pas encore — vous partez d’un plan et avez besoin de différents angles ou d’une vue aérienne ? Choisissez le rendu paysager (3D). Le jardin existe déjà — vous voulez voir rapidement à quoi il ressemblera une fois aménagé, sans modèle 3D ? Choisissez la rénovation virtuelle.",
    },
    variants: [
      {
        id: "landscape-main",
        title: "Rendu paysager (3D)",
        basePrice: 220,
        priceLabel: "€220",
        unitLabel: "terrain + végétation + première vue",
        description:
          "Un modèle 3D complet du terrain et de la végétation d’après votre plan. Le bon choix quand l’espace n’existe pas encore — construction, conception ou présentation aux investisseurs. Chaque angle supplémentaire du même lieu 80 % moins cher.",
        included:
          "Modélisation complète du terrain, végétation placée à maturité, allées et matériaux, et 1 rendu final. Trois séries de révisions incluses.",
        addOns: [
          "Angle suivant du même lieu : €45 (80 % moins cher)",
          "Majoration pour une face non montrée du terrain : +25 % une seule fois par modèle",
          "Vue aérienne de tout le lieu : €380",
        ],
        note: "Vous partez d’un plan de masse, des données de nivellement et d’une spécification des plantes. Nous envoyons les premières ébauches sous 3 à 5 jours ouvrés après la confirmation du devis.",
      },
    ],
    crossSellVariants: [
      {
        id: "landscape-reno",
        title: "Rénovation virtuelle d’après photo",
        basePrice: 66,
        priceLabel: "€66",
        unitLabel: "première vue du jardin rénové",
        description:
          "Envoyez une photo de votre jardin existant — nous redessinons l’espace directement sur l’image, sans modèle 3D. Plus rapide et moins cher qu’un rendu paysager. Le bon choix quand vous avez une photo et voulez simplement voir le résultat aménagé.",
        included:
          "Transformation visuelle complète du jardin à partir de votre photo — nouvelles surfaces, végétation, allées, éléments fixes et mobilier de terrasse.",
        addOns: [
          "Deuxième angle du même lieu : €59 (10 % moins cher)",
          "4e angle et suivants : €53 (20 % moins cher)",
          "Un deuxième jardin du même bien : €56 (15 % moins cher)",
        ],
        note: "Vous partez d’une photo de l’état actuel et de références pour les nouveaux matériaux et plantes. Cette option est liée à l’angle de la photo — pour un libre choix de caméra, utilisez le rendu paysager (3D).",
        configuratorCategory: "transformation",
      },
    ],
  },
  {
    slug: "photomontage",
    code: "photomontage",
    name: "Rendu dans une photo réelle du lieu",
    shortName: "Rendu dans une photo",
    category: "exterior",
    icon: "camera",
    tagline:
      "Un rendu d’extérieur dans une photo de votre lieu — pour €50 de plus que le rendu standard.",
    description:
      "Il s’agit du rendu d’extérieur standard (€250) avec l’option photomontage incluse (+€50 = €300 au total). Ces €50 signifient que nous ne plaçons pas le modèle 3D du bâtiment dans un environnement synthétique — nous l’intégrons directement dans une photo du lieu que vous fournissez, avec lumière, ombres et perspective accordées. Le résultat donne l’impression que le bâtiment est déjà là. Idéal pour les commissions d’urbanisme, les concertations publiques et les présentations aux investisseurs, où la commission doit voir votre bâtiment dans le contexte réel de la rue. Vous pouvez aussi commander le rendu d’extérieur sans cette option — €250 seulement, avec un environnement synthétique. L’autre méthode (perspective de rue 3D, €420) modélise tout le cadre en 3D — le bon choix quand le lieu ne peut pas être photographié ou qu’il vous faut un libre choix d’angle.",
    highlight:
      "Pour les projets où le réalisme et l’authenticité du lieu changent de manière décisive la perception du projet — permis, concertations publiques, présentations aux investisseurs.",
    materials:
      "Envoyez-nous une photo haute résolution du lieu et un modèle 3D ou les plans d’architecte du bâtiment.",
    asset: "/artwork/expert-photomontage-after.webp",
    beforeAsset: "/artwork/expert-photomontage-before.webp",
    afterAsset: "/artwork/expert-photomontage-after.webp",
    detailAsset: "/artwork/detail-photomontage.webp",
    detailBeforeAsset: "/artwork/problem-photomontage-street-before.webp",
    detailAfterAsset: "/artwork/problem-photomontage-street-after.webp",
    detailBeforeAlt:
      "Parcelle vide dans une rue entre des bâtiments existants — photo réelle du lieu avant l’intégration du bâtiment",
    detailAfterAlt:
      "La même vue de rue avec le rendu 3D du nouveau bâtiment intégré — un rendu dans une photo réelle du lieu",
    philosophy:
      "Le prix comporte deux parties. Le rendu d’extérieur (€250) couvre la construction d’un modèle 3D complet de votre bâtiment et le premier rendu final. C’est le même modèle et le même travail — qu’il se dresse dans un environnement synthétique ou dans une photo du lieu. Le photomontage (+€50) est une option qui ne change que l’arrière-plan : au lieu d’abords modélisés, le modèle 3D est intégré dans une photographie réelle — nous accordons la perspective, la lumière et les ombres au moment précis de la prise de vue. La majoration se justifie par l’analyse de la photo et l’accord de la perspective, un travail supplémentaire que le rendu standard ne comprend pas. Le rendu d’extérieur est aussi disponible seul pour €250 — quand un environnement synthétique vous convient. S’il vous faut plus d’angles : l’angle suivant depuis la même photo coûte €55 (82 % moins cher), une deuxième photo du même lieu €85, une face non montrée du bâtiment +25 % une seule fois par modèle.",
    priceContext:
      "€300 — intégration + la première vue. Angle suivant depuis la même photo : €55 (82 % moins cher).",
    forSegments: [
      "Promoteurs (permis de construire, concertations publiques)",
      "Architectes (présentations clients)",
      "Bureaux de plans d’ensemble et d’aménagement",
    ],
    problemHeading: "La commission n’imagine pas. La commission voit une photographie.",
    problemBody:
      "Un plan d’architecte dit la hauteur du bâtiment et son emplacement. Il ne dit pas de quoi il a l’air dans la cour entre les maisons voisines, dans la lumière de l’après-midi, avec la végétation déjà présente dans cette rue. Une commission d’urbanisme ou un acheteur de parcelle veut précisément cela — et sans cela, il décide sur des suppositions.",
    problemResolution:
      "Vous photographiez le lieu et nous envoyez les plans — nous intégrons le modèle 3D dans votre photo. La perspective, les ombres et l’éclairage sont accordés au moment réel de la prise de vue. La commission voit exactement ce qui se dressera à cet endroit.",
    benefits: [
      {
        icon: "trust",
        title: "Des abords fidèles au pixel",
        body: "Les maisons voisines, les arbres, la clôture, les ombres — tout est réel, car tout vient de votre photo. Personne ne peut prétendre que les abords sont « embellis » ou inventés.",
      },
      {
        icon: "context",
        title: "Idéal pour les démarches réglementaires",
        body: "Les commissions d’urbanisme et les concertations publiques exigent une vue dans le contexte réel. Un rendu dans une photo du lieu répond directement à cette exigence — sans explications supplémentaires.",
      },
      {
        icon: "value",
        title: "Économique pour plusieurs angles",
        body: "La première photo coûte €300 — chaque angle supplémentaire depuis la même photo €55 (82 % moins cher). Trois vues du même lieu reviennent à €410 au total.",
      },
    ],
    processSteps: [
      {
        title: "Envoyez vos éléments",
        body: "Une photo haute résolution du lieu et un modèle 3D ou les plans d’architecte du bâtiment.",
      },
      {
        title: "Confirmation du devis",
        body: "Nous envoyons le prix et le délai au plus tard le jour ouvré suivant, sans frais cachés.",
      },
      {
        title: "Analyse et intégration",
        body: "Nous analysons la perspective, la lumière et les ombres de la photo, puis intégrons le modèle 3D du bâtiment. Première ébauche sous 3 à 5 jours ouvrés.",
      },
      {
        title: "Livraison et révisions",
        body: "Vous recevez une vue photoréaliste prête pour les permis, les présentations et le marketing. Trois séries de révisions incluses.",
      },
    ],
    faqs: [
      {
        q: "De quoi se compose le prix de €300 ? Puis-je commander uniquement le rendu d’extérieur ?",
        a: "€300 se compose de deux parties distinctes : le rendu d’extérieur (€250) + l’option photomontage (+€50). Le rendu d’extérieur comprend la construction d’un modèle 3D complet du bâtiment et un rendu final — c’est la base. Le photomontage (+€50) signifie que nous intégrons ce modèle 3D dans une photo réelle du lieu que vous fournissez, au lieu d’un environnement synthétique, avec lumière, ombres et perspective accordées. Si un environnement synthétique vous convient (p. ex. pour une brochure commerciale sans finalité réglementaire), vous pouvez commander uniquement le rendu d’extérieur pour €250 — l’option photomontage n’est pas obligatoire.",
      },
      {
        q: "Que comprend exactement le prix de €300 ?",
        a: "Un modèle 3D complet de votre bâtiment et un rendu final — le modèle 3D est intégré dans une photo du lieu que vous fournissez, avec lumière, ombres et perspective accordées. Trois séries de révisions sont incluses.",
      },
      {
        q: "Qui prend la photo du lieu ?",
        a: "Vous — ou une personne que vous mandatez. Un téléphone avec un bon appareil photo suffit, tant que la photo est nette et prise à hauteur d’œil (pas depuis un siège de voiture). Nous vous envoyons de courtes consignes de prise de vue à la confirmation de la commande.",
      },
      {
        q: "Quelle différence avec la perspective de rue 3D (€420) ?",
        a: "Le rendu dans une photo utilise une photographie réelle du lieu comme arrière-plan — les abords sont fidèles au pixel, mais vous êtes lié à l’angle de la photo. La perspective de rue 3D modélise tout le cadre en 3D — vous choisissez n’importe quel angle, mais les abords sont une approximation, pas une photo réelle. Si le lieu existe et peut être photographié, le rendu dans une photo donne un résultat plus crédible pour moins d’argent.",
      },
      {
        q: "Cela fonctionne-t-il aussi pour les maisons, pas seulement pour les grands bâtiments ?",
        a: "Oui. La méthode ne dépend pas du type de bâtiment — elle fonctionne pour les maisons individuelles, les immeubles résidentiels, les bâtiments commerciaux et tout autre type dont vous pouvez fournir les plans.",
      },
      {
        q: "Et si le lieu n’a pas été photographié sous le bon angle ?",
        a: "Avant de commencer, nous vérifions la photo et vous prévenons si l’angle ne convient pas à la vue prévue. Dans ce cas, vous pouvez fournir une nouvelle photo ou passer à la perspective de rue 3D — qui ne dépend d’aucune photographie.",
      },
      {
        q: "Quel est le délai de livraison ?",
        a: "Nous envoyons les premières ébauches sous 3 à 5 jours ouvrés après la confirmation du devis et la réception des plans et de la photo. Trois séries de révisions sont incluses — sans supplément.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-photomontage-real-01.webp",
        alt: "Photomontage — maison individuelle achevée intégrée dans une photo réelle de la rue, Elegant Render",
        beforeSrc: "/artwork/portfolio-photomontage-real-01-before.webp",
        beforeAlt: "La photo réelle du site avant le montage — un bâtiment en construction derrière une clôture de chantier",
      },
      {
        src: "/artwork/portfolio-photomontage-real-02.webp",
        alt: "Photomontage — immeuble résidentiel achevé intégré dans une photo réelle de la rue, Elegant Render",
        beforeSrc: "/artwork/portfolio-photomontage-real-02-before.webp",
        beforeAlt: "La photo réelle du site avant le montage — un bâtiment en construction dans un alignement de rue",
      },
      {
        src: "/artwork/portfolio-photomontage-real-03.webp",
        alt: "Photomontage — bâtiment achevé intégré dans une photo réelle de la rue, Elegant Render",
        beforeSrc: "/artwork/portfolio-photomontage-real-03-before.webp",
        beforeAlt: "La photo réelle du site avant le montage — un bâtiment en construction",
      },
      {
        src: "/artwork/portfolio-photomontage-real-04.webp",
        alt: "Photomontage — bâtiment achevé intégré dans une photo réelle des abords, Elegant Render",
        beforeSrc: "/artwork/portfolio-photomontage-real-04-before.webp",
        beforeAlt: "La photo réelle du site avant le montage — un bâtiment en construction",
      },
    ],
    pricingLead: {
      heading: "Deux méthodes, un même objectif — un seul bon choix pour votre lieu.",
      body: "Le rendu dans une photo réelle (€300) est le bon choix quand le lieu existe et peut être photographié — il offre une crédibilité maximale car il utilise les abords réels. La perspective de rue 3D (€420) est le bon choix quand le lieu n’existe pas encore, est difficile d’accès ou qu’il vous faut plusieurs angles sans contraintes de photographie. Choisissez selon ce que vous avez en main.",
    },
    comparison: {
      aLabel: "Rendu dans une photo — €300",
      bLabel: "Perspective de rue 3D — €420",
      rows: [
        { label: "Éléments d’entrée", a: "Une photo réelle du lieu", b: "Plans d’architecte" },
        { label: "Abords", a: "Fidèles au pixel (photographie réelle)", b: "Modélisés en 3D (approximation)" },
        { label: "Choix de l’angle", a: "Lié à l’angle de la photo", b: "N’importe quel angle (rue ou aérien)" },
        { label: "Quand le choisir", a: "Le lieu existe et peut être photographié", b: "Le lieu n’existe pas ou il vous faut plusieurs angles" },
      ],
    },
    variants: [
      {
        id: "photomontage-main",
        title: "Rendu dans une photo réelle du lieu",
        basePrice: 300,
        priceLabel: "€300",
        unitLabel: "rendu d’extérieur €250 + photomontage +€50",
        decomposition: "Rendu d’extérieur €250 + photomontage €50",
        description:
          "Le modèle 3D du bâtiment est intégré dans une photo du lieu que vous fournissez — lumière, ombres et perspective accordées. Une crédibilité maximale pour les commissions, les concertations publiques et les présentations aux acheteurs.",
        included:
          "Un modèle 3D complet du bâtiment (le même que pour le rendu d’extérieur standard), scène et éclairage réglés pour correspondre à la photo du lieu, une intégration dans une photo que vous fournissez — un rendu final. Trois séries de révisions incluses. L’option photomontage est présélectionnée dans le configurateur — le panier l’affiche ligne par ligne : rendu d’extérieur €250 + photomontage €50 = €300.",
        addOns: [
          "Angle supplémentaire depuis la même photo : €55 (82 % moins cher)",
          "Une deuxième photo du même lieu (autre angle de prise de vue) : €85",
          "Face non montrée du bâtiment : +25 % une seule fois",
        ],
        note: "Prix : rendu d’extérieur €250 + photomontage +€50 = €300. Vous pouvez aussi commander le rendu d’extérieur sans le photomontage — €250 seulement, avec un environnement synthétique. L’option photomontage ajoute l’intégration dans une photo réelle du lieu.",
      },
    ],
    crossSellVariants: [
      {
        id: "exterior-aerial",
        title: "Perspective de rue 3D",
        basePrice: 420,
        priceLabel: "€420",
        unitLabel: "modèle 3D complet du bâtiment + abords",
        description:
          "Quand le lieu n’existe pas ou qu’il vous faut plusieurs angles sans contraintes de photographie — tout le cadre est modélisé en 3D, principalement en perspective de rue.",
        included:
          "Un modèle 3D complet du bâtiment et des abords (maisons voisines, rue, parcelle), perspective au niveau de la rue et 2 angles inclus.",
        addOns: [
          "Angle supplémentaire : €48 (80 % moins cher)",
          "Face non montrée/arrière du bâtiment : +25 % (€105 une seule fois)",
        ],
        note: "Le bon choix quand le lieu ne peut pas encore être photographié ou qu’il vous faut un libre choix d’angle de vue.",
      },
    ],
  },
  {
    slug: "site-plans",
    code: "3d-site-plans",
    name: "Plans de masse",
    shortName: "Plans de masse",
    category: "plans",
    icon: "layers",
    tagline: "Toute la parcelle vue du ciel — une offre investisseur en une seule image.",
    description:
      "Une vue aérienne complète de la parcelle : terrain, tous les bâtiments, voiries, stationnement, végétation et aménagements. Un support investisseur pour les offres, les permis de construire et la vente de grands ensembles. Angle suivant de la même parcelle : 81 % moins cher. Les phases de construction et les variantes saisonnières se commandent depuis la même scène.",
    highlight:
      "Pour les plans d’ensemble, les ensembles résidentiels, les zones d’activités et les projets d’aménagement où vous vendez le lieu, pas seulement un bâtiment.",
    materials:
      "Envoyez-nous les plans CAO de toute la parcelle, la position des bâtiments et le plan d’aménagement paysager.",
    asset: "/artwork/expert-3d-site-plan.webp",
    detailAsset: "/artwork/detail-3d-site-plan.webp",
    detailBeforeAsset: "/artwork/problem-3d-site-plan-plan-before.webp",
    detailAfterAsset: "/artwork/problem-3d-site-plan-after.webp",
    detailBeforeAlt:
      "Plan de masse 2D d’un ensemble résidentiel — disposition des bâtiments, du stationnement, des espaces verts et des équipements",
    detailAfterAlt:
      "Plan de masse 3D aérien de l’ensemble résidentiel — bâtiments, stationnement et aménagement de la parcelle",
    philosophy:
      "Le prix couvre la construction complète du terrain et le placement des bâtiments, des voiries et du paysage. Une fois la scène construite, chaque angle supplémentaire coûte €65 (81 % moins cher), une variante saisonnière (hiver/été) €85, et une vue par phase de construction €95. Le promoteur obtient un support visuel pour chaque étape de la campagne — la phase de pré-commercialisation, l’ouverture du premier bâtiment, etc. — depuis un seul modèle.",
    priceContext:
      "€350 — toute la parcelle : terrain + bâtiments + paysage + la première vue aérienne.",
    forSegments: [
      "Investisseurs et promoteurs",
      "Urbanistes et bureaux de plans d’ensemble",
      "Architectes (présentations aux investisseurs)",
    ],
    problemHeading: "Un plan de masse 2D ressemble à une carte. Un plan 3D montre le projet.",
    problemBody:
      "Un fonds, un partenaire ou un régulateur ouvre le plan de masse et voit des lignes. On ne sait pas où est l’entrée, comment on accède au site, ce qui est espace partagé et ce qui est privé. La conversation bute sur « puis-je voir un rendu ».",
    problemResolution:
      "Un plan de masse 3D montre la même parcelle avec tous ses bâtiments, les accès, la végétation et le contexte — le promoteur répond à la question avant qu’elle ne soit posée. Le support sert à la fois la démarche réglementaire et la campagne de vente.",
    benefits: [
      {
        icon: "context",
        title: "Toute la parcelle en une seule image",
        body: "Le promoteur répond au fonds avec un seul visuel au lieu d’un classeur de plans. Un avantage concurrentiel dans les offres aux investisseurs.",
      },
      {
        icon: "trust",
        title: "Un support pour les permis et le marketing",
        body: "Le même modèle sert les démarches réglementaires et les campagnes de vente — sans remodélisation.",
      },
      {
        icon: "value",
        title: "Plus de visuels depuis la même scène",
        body: "€350 couvre le terrain complet. Angle supplémentaire €65, variante saisonnière €85, vue par phase de construction €95 — sans remodélisation.",
      },
    ],
    processSteps: [
      {
        title: "Envoyez le plan CAO",
        body: "Les plans CAO de toute la parcelle, la position et la typologie des bâtiments, le plan d’aménagement paysager et le contexte environnant (PDF/DWG).",
      },
      {
        title: "Confirmation du devis",
        body: "Nous envoyons le prix et le délai au plus tard le jour ouvré suivant, sans frais cachés.",
      },
      {
        title: "Modélisation de la scène",
        body: "L’équipe modélise le terrain, les bâtiments, les voiries, le stationnement et le paysage. Nous envoyons les premières ébauches sous 3 à 5 jours ouvrés.",
      },
      {
        title: "Livraison et révisions",
        body: "Vous recevez la vue aérienne finale. Trois séries de révisions sont incluses dans le prix — sans supplément.",
      },
    ],
    faqs: [
      {
        q: "Que comprend exactement le prix de €350 ?",
        a: "La modélisation de toute la parcelle (terrain, bâtiments, voiries, stationnement, végétation, paysage) et la première vue aérienne finale. Angle supplémentaire de la même parcelle : €65 (remise de 81 %). Variante saisonnière (hiver/été) : €85. Vue par phase de construction : €95.",
      },
      {
        q: "Quelle différence avec la perspective de rue 3D (€420) ?",
        a: "La perspective de rue 3D (€420) se concentre sur un seul bâtiment et ses abords (maisons voisines, rue). Le plan de masse (€350) montre toute la parcelle avec tous ses bâtiments et aménagements — au niveau du plan d’ensemble, vu du ciel. Le premier sert un bâtiment individuel dans son contexte de rue, le second un ensemble entier vu d’en haut.",
      },
      {
        q: "Peut-il servir pour un permis de construire ?",
        a: "Oui. Le plan de masse est une annexe standard des procédures d’urbanisme. La vue 3D est bien plus facile à comprendre pour une commission qu’un plan technique classique.",
      },
      {
        q: "Puis-je commander des phases de construction ?",
        a: "Oui. La vue par phase de construction (€95) montre la même parcelle à différents stades d’avancement — avant la construction, première phase achevée, deuxième phase en cours, etc. La campagne investisseur obtient un support visuel pour chaque phase.",
      },
      {
        q: "Quel est le délai de livraison ?",
        a: "Nous envoyons les premières ébauches sous 3 à 5 jours ouvrés après la confirmation du devis et la réception du plan CAO. Trois séries de révisions sont incluses.",
      },
      {
        q: "Que dois-je envoyer pour commencer ?",
        a: "Les plans CAO de toute la parcelle (DWG), la position et la typologie des bâtiments, le plan d’aménagement paysager et le contexte environnant. En option : des références de matériaux de façade et de paysage.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-3d-site-plan-sp-01.webp",
        alt: "Plan de masse 3D — vue aérienne d’un ensemble résidentiel de 3 bâtiments, avec espace partagé et zones de stationnement, Elegant Render",
        beforeSrc: "/artwork/portfolio-3d-site-plan-sp-01-before.webp",
        beforeAlt: "Plan de masse 2D technique en noir et blanc du même ensemble avec libellés et position des bâtiments",
      },
      {
        src: "/artwork/portfolio-3d-site-plan-sp-02.webp",
        alt: "Plan de masse 3D d’un programme résidentiel — vue 3D aérienne des bâtiments, des espaces verts et des voiries, Elegant Render",
        beforeSrc: "/artwork/portfolio-3d-site-plan-sp-02-before.webp",
        beforeAlt: "Plan de masse 2D technique en noir et blanc du même programme avant la vue 3D",
      },
      {
        src: "/artwork/portfolio-3d-site-plan-sp-03.webp",
        alt: "Plan de masse 3D d’un quartier de maisons individuelles — vue 3D aérienne des parcelles, des jardins et des voies d’accès, Elegant Render",
        beforeSrc: "/artwork/portfolio-3d-site-plan-sp-03-before.webp",
        beforeAlt: "Plan de masse 2D technique en noir et blanc du quartier avec la disposition des parcelles et des maisons",
      },
      {
        src: "/artwork/portfolio-3d-site-plan-sp-04.webp",
        alt: "Plan de masse 3D d’un ensemble — vue 3D aérienne photoréaliste des bâtiments et des aménagements, Elegant Render",
        beforeSrc: "/artwork/portfolio-3d-site-plan-sp-04-before.webp",
        beforeAlt: "Plan de masse 2D technique en noir et blanc du même ensemble avec les libellés des bâtiments",
      },
    ],
    variants: [
      {
        id: "site-plan-main",
        title: "Plan de masse 3D",
        basePrice: 350,
        priceLabel: "€350",
        unitLabel: "parcelle complète + la première vue aérienne",
        description:
          "Terrain complet, tous les bâtiments, voiries et paysage — un support investisseur. Angle suivant de la même parcelle : €65.",
        included:
          "Modélisation de toute la parcelle : terrain, bâtiments, voiries, stationnement, végétation et paysage. Comprend 1 vue aérienne finale.",
        addOns: [
          "Angle supplémentaire de la même parcelle : €65 (remise de 81 %)",
          "Variante saisonnière (hiver/été) : €85",
          "Vue par phase de construction (visibilité par phase) : €95",
        ],
      },
    ],
  },
  {
    slug: "day-to-dusk",
    code: "day-to-dusk",
    name: "Jour au crépuscule",
    shortName: "Jour au crépuscule",
    category: "transformation",
    icon: "sun",
    tagline: "Une prise de vue de jour prend une chaleureuse ambiance du soir.",
    description:
      "Remplacement du ciel, correction de la lumière et une lueur chaleureuse aux fenêtres — une photo d’extérieur prise de jour devient une séduisante annonce du soir. À partir de 10 images, le prix descend à €8/image (remise de 20 %).",
    highlight:
      "Pour les agents immobiliers et les promoteurs quand la même scène est nécessaire en version de jour et en version du soir pour une campagne marketing.",
    materials: "Envoyez-nous des photos d’extérieur de jour en haute résolution.",
    asset: "/artwork/expert-day-to-dusk-after.webp",
    beforeAsset: "/artwork/expert-day-to-dusk-before.webp",
    afterAsset: "/artwork/expert-day-to-dusk-after.webp",
    detailAsset: "/artwork/detail-day-to-dusk.webp",
    detailBeforeAsset: "/artwork/problem-day-to-dusk-facade-before.webp",
    detailAfterAsset: "/artwork/problem-day-to-dusk-facade-after.webp",
    detailBeforeAlt:
      "Façade d’une maison moderne photographiée en plein jour avant la conversion jour au crépuscule",
    detailAfterAlt:
      "La même maison moderne en vue du soir — façade éclairée, intérieurs chaleureux et éclairage d’ambiance sous un ciel étoilé",
    outsourced: true,
    philosophy:
      "Une post-production rapide avec un prix clair par image. Forfait de 10 images et plus : €8/image (remise de 20 %). Livraison express sous 24 h : +50 %.",
    priceContext: "€10 par image · €8 par image pour les forfaits de 10 et plus.",
    forSegments: [
      "Agences immobilières (photos d’annonces spectaculaires)",
      "Promoteurs (campagnes avec variantes jour/soir)",
      "Photographes immobiliers (post-production)",
    ],
    problemHeading: "Une photo de jour ne vend pas. Une chaleureuse photo du soir, si.",
    problemBody:
      "Un agent photographie le bâtiment en pleine journée, lumière plate et ciel bleu — une image fonctionnelle, mais sans émotion. Ces photos ressemblent à des centaines d’autres annonces. Le client fait défiler.",
    problemResolution:
      "Remplacer le ciel et ajouter un éclairage chaleureux aux fenêtres et des accents sur la façade transforme une image de jour en une vue du soir spectaculaire. L’annonce gagne une force émotionnelle sans nouvelle séance photo ni rendez-vous au crépuscule.",
    benefits: [
      {
        icon: "speed",
        title: "Pas de nouvelle séance photo",
        body: "Vous envoyez la photo de jour que vous avez déjà. Pas d’attente d’un créneau au crépuscule, pas de frais de photographe par déplacement.",
      },
      {
        icon: "value",
        title: "€10 par image, €8 en forfait",
        body: "Une image €10 ; les forfaits de 10 images et plus descendent à €8 par image (remise de 20 %). Une campagne complète pour un appartement ou une maison pour une fraction du coût d’une nouvelle séance.",
      },
      {
        icon: "trust",
        title: "Une annonce qui se démarque",
        body: "Une ambiance de crépuscule spectaculaire dans une galerie immobilière distingue l’annonce des autres et augmente les clics.",
      },
    ],
    processSteps: [
      {
        title: "Envoyez les photos",
        body: "Des photos d’extérieur de jour en haute résolution (idéalement reflex/hybride, pas un cliché de téléphone pris de biais).",
      },
      {
        title: "Confirmation du devis",
        body: "Nous envoyons le prix et le délai au plus tard le jour ouvré suivant. Une livraison express sous 24 h est disponible pour +50 %.",
      },
      {
        title: "Transformation",
        body: "L’équipe remplace le ciel, étalonne la lumière et ajoute des accents lumineux aux fenêtres et à la façade. Délai standard 3 à 5 jours ouvrés.",
      },
      {
        title: "Livraison",
        body: "Vous recevez des images finales prêtes pour les annonces et les campagnes. Suppression des ombres indésirables en option pour €5 par image.",
      },
    ],
    faqs: [
      {
        q: "Que comprend exactement le prix de €10 ?",
        a: "La transformation d’une photo d’extérieur de jour en une vue du soir spectaculaire — remplacement du ciel et ajustement de la lumière inclus. Suppression des ombres indésirables : €5 par image. Forfait de 10 images et plus : €8 par image (remise de 20 %). Livraison express sous 24 h : +50 %.",
      },
      {
        q: "Le résultat semble-t-il réel ou ressemble-t-il à un filtre ?",
        a: "Notre version est photoréaliste — l’éclairage des fenêtres, les luminaires de façade et les reflets des vitres suivent la géométrie réelle du bâtiment. Ce n’est pas un filtre Instagram ; chaque source de lumière est placée avec soin pour chaque photo.",
      },
      {
        q: "Puis-je obtenir la version de jour et la version du soir de la même photo ?",
        a: "Oui. La version de jour d’origine reste intacte ; nous livrons la version du soir en plus. Les forfaits d’agence comprennent souvent les deux jeux — le jour pour l’annonce, le soir pour les réseaux sociaux et les campagnes marketing.",
      },
      {
        q: "Quel est le délai de livraison ?",
        a: "Le délai standard est de 3 à 5 jours ouvrés par image. Une livraison express sous 24 h est disponible pour +50 %. Les forfaits de 10 images et plus sont livrés par étapes, selon accord.",
      },
      {
        q: "Travaillez-vous avec des agences gérant de nombreuses annonces ?",
        a: "Oui. Le forfait de 10 images et plus est à €8 par image (remise de 20 %). Les agents réguliers peuvent convenir d’une priorité de production et d’un étalonnage lumineux cohérent sur toutes leurs annonces.",
      },
      {
        q: "Que dois-je envoyer pour commencer ?",
        a: "Des photos d’extérieur de jour en bonne résolution (reflex ou hybride, au moins 3000 px sur le grand côté). Nous déconseillons les photos de téléphone prises de biais.",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-day-to-dusk-dn-01.webp",
        alt: "Jour au crépuscule — maison individuelle avec fenêtres éclairées et éclairage de façade au crépuscule",
        beforeSrc: "/artwork/portfolio-day-to-dusk-dn-01-before.webp",
        beforeAlt: "La vue de jour de la même maison — la façade en plein jour sous un ciel dégagé",
      },
      {
        src: "/artwork/portfolio-day-to-dusk-dn-02.webp",
        alt: "Jour au crépuscule — immeuble avec terrasses éclairées et façade en mode du soir",
        beforeSrc: "/artwork/portfolio-day-to-dusk-dn-02-before.webp",
        beforeAlt: "La vue de jour du même immeuble — la façade en plein jour",
      },
      {
        src: "/artwork/portfolio-day-to-dusk-dn-03.webp",
        alt: "Jour au crépuscule — villa avec terrasse éclairée et éclairage de façade au crépuscule",
        beforeSrc: "/artwork/portfolio-day-to-dusk-dn-03-before.webp",
        beforeAlt: "La vue de jour de la même villa — l’extérieur en plein jour",
      },
      {
        src: "/artwork/portfolio-day-to-dusk-dn-04.webp",
        alt: "Jour au crépuscule — immeuble avec éclairage de façade et entrée éclairée de nuit",
        beforeSrc: "/artwork/portfolio-day-to-dusk-dn-04-before.webp",
        beforeAlt: "La vue de jour du même immeuble — la façade en plein jour",
      },
    ],
    variants: [
      {
        id: "day-to-dusk-main",
        title: "Jour au crépuscule",
        basePrice: 10,
        priceLabel: "€10",
        unitLabel: "par image",
        description:
          "Remplacement du ciel, lumière et étalonnage des couleurs pour une image. Forfait 10+ : €8/image.",
        included:
          "Transformation d’une photo d’extérieur de jour en une vue du soir spectaculaire. Comprend le remplacement du ciel et l’ajustement de la lumière.",
        addOns: [
          "Suppression des ombres indésirables : €5",
          "Forfait de 10 images et plus : €8 par image (remise de 20 %)",
          "Livraison express sous 24 h : +50 %",
        ],
      },
    ],
  },
  {
    slug: "item-removal",
    code: "item-removal",
    name: "Suppression d’objets",
    shortName: "Suppression d’objets",
    category: "transformation",
    icon: "eraser",
    tagline: "Une photo nette vend plus vite qu’une photo encombrée.",
    description:
      "Suppression numérique d’éléments indésirables sur une photo : effets personnels, véhicules, câbles, désordre ou objets plus volumineux avec reconstruction de l’arrière-plan. Une montée en gamme rapide de l’annonce sans vider physiquement l’espace. Forfait de 10 images et plus : remise de volume.",
    highlight:
      "Pour les agents immobiliers et les photographes quand un espace doit être montré net et qu’un rangement physique n’est ni rentable ni réalisable.",
    materials:
      "Envoyez-nous les photos et indiquez clairement les éléments à supprimer.",
    asset: "/artwork/expert-uklanjanje-elemenata-after.webp",
    beforeAsset: "/artwork/expert-uklanjanje-elemenata-before.webp",
    afterAsset: "/artwork/expert-uklanjanje-elemenata-after.webp",
    detailAsset: "/artwork/detail-uklanjanje-elemenata.webp",
    detailBeforeAsset: "/artwork/problem-item-removal-room-before.webp",
    detailAfterAsset: "/artwork/problem-item-removal-room-after.webp",
    detailBeforeAlt:
      "Pièce avec lustre, chaises et effets personnels avant la suppression numérique d’objets",
    detailAfterAlt:
      "La même pièce après la suppression d’objets — un espace vidé, sans mobilier ni décoration",
    outsourced: true,
    philosophy:
      "Suppression simple (petits objets, effets personnels) : €12. Complexe (objet volumineux avec reconstruction de l’arrière-plan) : €25. Forfait de 10 images et plus : €10 simple / €20 complexe par image.",
    priceContext:
      "€12 simple / €25 complexe · forfait 10+ : €10 / €20.",
    forSegments: [
      "Agences immobilières (photos d’annonces nettes)",
      "Photographes (post-production de biens vides)",
      "Promoteurs (supports marketing sans encombrement)",
    ],
    problemHeading: "Le désordre sur une photo vole l’attention. Un cadre net la retient.",
    problemBody:
      "Le client ne range pas l’appartement avant la séance photo. Effets personnels, câbles, cartons, véhicules garés devant la façade — tout se retrouve dans l’annonce et détourne l’attention de l’acheteur de l’espace. Le rangement physique n’est pas rentable, et le photographe n’a pas le temps d’attendre.",
    problemResolution:
      "Nous supprimons numériquement le désordre et les objets indésirables de la photo, en reconstruisant l’arrière-plan si nécessaire. L’annonce paraît nette sans une seule heure de travail physique sur place.",
    benefits: [
      {
        icon: "speed",
        title: "Pas de rangement physique",
        body: "Le photographe photographie ce qu’il trouve, vous envoyez l’image — nous supprimons le désordre. Pas d’attente que quelqu’un vide l’appartement, pas de rendez-vous supplémentaire à organiser.",
      },
      {
        icon: "value",
        title: "Deux tarifs selon la complexité",
        body: "Petits objets et effets personnels : €12. Objet volumineux avec reconstruction de l’arrière-plan : €25. Les forfaits de 10 images et plus descendent à €10 / €20 par image.",
      },
      {
        icon: "trust",
        title: "Un arrière-plan qui semble réel",
        body: "Pour les suppressions complexes, nous reconstruisons l’arrière-plan (mur, carrelage, parquet) pour que le résultat donne l’impression que l’objet n’a jamais été là.",
      },
    ],
    processSteps: [
      {
        title: "Envoyez les photos",
        body: "Les photos avec les éléments à supprimer clairement indiqués (un commentaire dans l’e-mail ou une capture d’écran annotée).",
      },
      {
        title: "Confirmation du devis",
        body: "Nous envoyons le prix (simple €12 ou complexe €25) et le délai au plus tard le jour ouvré suivant.",
      },
      {
        title: "Suppression",
        body: "L’équipe supprime les éléments indiqués et reconstruit l’arrière-plan si nécessaire. Délai standard 3 à 5 jours ouvrés.",
      },
      {
        title: "Livraison",
        body: "Vous recevez des images finales prêtes pour l’annonce. Trois séries de révisions sont incluses.",
      },
    ],
    faqs: [
      {
        q: "Que comprend exactement le prix de €12 ?",
        a: "La suppression numérique de petits objets et d’effets personnels sur une photo. Suppression complexe (objet volumineux avec reconstruction de l’arrière-plan) : €25. Image supplémentaire — simple : €8 (remise de 33 %). Image supplémentaire — complexe : €18 (remise de 28 %). Forfait 10+ : €10 / €20 par image.",
      },
      {
        q: "Comment savoir si mon cas est simple ou complexe ?",
        a: "Simple : effets personnels, magazines, câbles, tasses — des objets dont l’arrière-plan (mur, table, sol) reste visible et facile à retoucher. Complexe : gros électroménager, véhicules garés, éléments de cuisine — l’arrière-plan est reconstruit de zéro. Envoyez la photo et nous confirmons le tarif dans le devis.",
      },
      {
        q: "La reconstruction de l’arrière-plan semble-t-elle réelle ?",
        a: "Oui. Nous combinons le contexte de la même photo (lumière, perspective) et la reconstruction des matériaux (carrelage, parquet, mur) pour que le résultat ne porte aucune « trace » de suppression. Trois séries de révisions sont incluses si un détail n’est pas juste.",
      },
      {
        q: "Quel est le délai de livraison ?",
        a: "Le délai standard est de 3 à 5 jours ouvrés par image. Les forfaits de 10 images et plus sont livrés par étapes, selon accord — les premières images plus tôt, le reste selon le calendrier.",
      },
      {
        q: "Que dois-je envoyer pour commencer ?",
        a: "Des photos en bonne résolution et une indication claire des éléments à supprimer (un commentaire dans l’e-mail, une capture d’écran annotée ou une liste en texte).",
      },
    ],
    portfolioImages: [
      {
        src: "/artwork/portfolio-item-removal-ir-01.webp",
        alt: "Suppression d’objets — salon rangé pour la photo de l’annonce",
        beforeSrc: "/artwork/portfolio-item-removal-ir-01-before.webp",
        beforeAlt: "Le même salon avant la suppression d’objets — objets épars et désordre",
      },
      {
        src: "/artwork/portfolio-item-removal-ir-02.webp",
        alt: "Suppression d’objets — pièce rangée et prête pour la photo",
        beforeSrc: "/artwork/portfolio-item-removal-ir-02-before.webp",
        beforeAlt: "La même pièce avant la suppression d’objets — objets en trop et désordre",
      },
      {
        src: "/artwork/portfolio-item-removal-ir-03.webp",
        alt: "Suppression d’objets — pièce dégagée et prête pour la photo",
        beforeSrc: "/artwork/portfolio-item-removal-ir-03-before.webp",
        beforeAlt: "La même pièce avant la suppression d’objets — objets épars",
      },
      {
        src: "/artwork/portfolio-item-removal-ir-04.webp",
        alt: "Suppression d’objets — espace débarrassé des éléments en trop pour la photo",
        beforeSrc: "/artwork/portfolio-item-removal-ir-04-before.webp",
        beforeAlt: "Le même espace avant la suppression d’objets — éléments en trop et désordre visibles",
      },
    ],
    variants: [
      {
        id: "item-removal-main",
        title: "Suppression d’objets",
        basePrice: 12,
        priceLabel: "€12",
        unitLabel: "par image (simple)",
        description:
          "€12 simple (petits objets, effets personnels) / €25 complexe (objets volumineux). Forfait 10+ : remise de volume.",
        included:
          "Suppression numérique d’objets, de désordre ou d’effets personnels sur une photo, avec reconstruction de l’arrière-plan.",
        addOns: [
          "Suppression complexe (reconstruction de l’arrière-plan) : €25",
          "Image supplémentaire — simple : €8 (remise de 33 %)",
          "Image supplémentaire — complexe : €18 (remise de 28 %)",
          "Forfait de 10 images et plus : €10 simple / €20 complexe",
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
      return `${service.name} - image source avant la retouche visuelle`;
    case "after":
      return `${service.name} - visuel final après la retouche`;
    case "problem":
      return `${service.name} - exemple de problème et de solution, catégorie ${category}`;
    case "listing":
      return `${service.name} - exemple de prestation de la catégorie ${category}`;
    case "portfolio":
      return `${service.name} - exemple de portfolio d’un visuel livré`;
    case "hero":
      return `${service.name} - ${service.tagline}`;
    case "og":
      return `${service.name} - Elegant Render ${category}`;
    case "detail":
    default:
      return `${service.name} - exemple de visualisation architecturale par Elegant Render`;
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
