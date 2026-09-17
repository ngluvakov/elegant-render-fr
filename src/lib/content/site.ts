/**
 * site.ts — Site-wide content constants (branding, navigation, copy).
 *
 * Exports SITE, NAV_MAIN, NAV_LEGAL, TRUST_SIGNALS, PLATFORM_PRINCIPLES,
 * ORDERING_STEPS, FAQ_ITEMS — all static French-language content for the
 * French (elegantrender.fr) deployment.
 *
 * Copy source of truth: the English elegantrender.com build, translated to
 * French (formal "vous"), with geo-targeting adapted to France.
 *
 * Used by: layout.tsx, site-header, site-footer, marketing pages,
 *          legal pages, robots.ts, sitemap.ts
 */
import { SITE_FEATURES } from "@/lib/site-features";

// Canonical site URL used by absoluteUrl(), robots.ts, sitemap.ts,
// and the JSON-LD Organization schema below. Env-driven with a
// fallback so the production build always resolves a real URL even
// if NEXT_PUBLIC_SITE_URL isn't set.
const DEFAULT_SITE_URL = "https://elegantrender.fr";

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
  tagline: "Une belle image, un prix clair, une décision plus simple.",
  description:
    "Des rendus réalisés à la main, du home staging virtuel et des transformations visuelles pour maisons et biens immobiliers — avec des prix affichés dès le départ. Une belle image, un prix clair, une décision plus simple.",
  url: RESOLVED_SITE_URL,
  email: "info@elegantrender.com",
  instagram: "https://www.instagram.com/elegantrender",
} as const;

/**
 * Legal identity of the operating company — used on /informations-legales/mentions-legales, in
 * the footer and in the JSON-LD Organization schema. Values come from the
 * Serbian business registry (APR, https://pretraga.apr.gov.rs). Phone and
 * legal-representative name are optional — the e-commerce disclosure rules
 * require the registered name, seat, registry numbers and a means of quick,
 * direct contact — email satisfies the last requirement.
 */
export const IMPRINT = {
  // Title case for display. APR registers in all-caps as a typesetting
  // convention; capitalization is not part of the legal identity. Use
  // shortName ("White Rook DOO") on customer-facing surfaces and reserve
  // legalName for legal pages where the formal registered identity is
  // surfaced (imprint, privacy controller block, terms provider block).
  legalName:
    "Društvo za grafički dizajn, proizvodnju, trgovinu i usluge, White Rook DOO Kovačica",
  shortName: "White Rook DOO",
  street: "JNA 25",
  postalCode: "26210",
  city: "Kovačica",
  country: "Serbie",
  taxId: "110339214", // PIB (tax ID)
  registryNumber: "21339393", // MB (company registry number)
  activityCode: "7410", // Specialized design activities
  foundedAt: "2017-11-22",
  size: "Petite entreprise",
  email: "info@elegantrender.com",
  privacyEmail: "info@elegantrender.com",
  euRepresentative: null as null | {
    name: string;
    address: string;
    email: string;
  },
  // Bank account info that lands on proforma invoice PDFs as the
  // payment instruction. PayPal-only billing: no wire-transfer account.
  bank: {
    name: "",
    iban: "",
    swift: "",
    accountNumber: "",
  },
} as const;

export function formatAddress(): string {
  return `${IMPRINT.street}, ${IMPRINT.postalCode} ${IMPRINT.city}, ${IMPRINT.country}`;
}

export const TRUST_SIGNALS = [
  "Aucun forfait en dehors de la grille tarifaire — chaque prix provient directement de la grille tarifaire officielle.",
  "Vous savez exactement ce que vous payez et ce que vous recevez — pas de frais cachés, pas de clauses en petits caractères.",
  "Trois séries de révisions sont incluses dans chaque projet, pour que le résultat final corresponde à votre vision.",
  "Certifié par TÜV Rheinland — ISO 9001:2015, ISO/IEC 27001:2022, ISO 50001:2018.",
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
  fullName: "TÜV Rheinland — organisme de certification allemand",
  description:
    "TÜV Rheinland est l’un des organismes de certification les plus anciens et les plus respectés au monde, dont le siège est à Cologne et qui est présent dans plus de 50 pays. Ses certificats font référence dans le secteur et exigent des audits indépendants réguliers — non pas une déclaration ponctuelle, mais un système entretenu en continu.",
  // Combined Testmark badge issued for all three standards under a single ID.
  badgeAsset: {
    src: "/informations-legales/tuv-rheinland-certified.webp",
    pdfSrc: "/informations-legales/tuv-rheinland-certified.pdf",
    width: 1600,
    height: 590,
    alt: "TÜV Rheinland CERTIFIED — ISO 9001:2015, ISO/IEC 27001:2022, ISO 50001:2018, ID 9000025319",
  },
} as const;

const TUV_RHEINLAND_CERT_ID = "9000025319";
// Certipedia is TÜV Rheinland's public certificate registry.
const TUV_RHEINLAND_VERIFY_URL = `https://www.certipedia.com/quality_marks/${TUV_RHEINLAND_CERT_ID}?locale=fr`;

export const ISO_CERTIFICATIONS: IsoCertification[] = [
  {
    id: "iso-9001",
    code: "ISO 9001:2015",
    domain: "Management de la qualité",
    description:
      "La norme qui définit les exigences d’un système de management de la qualité, des processus jusqu’à la prestation de service. Notre méthode de travail — de la réception des documents aux révisions, jusqu’à la livraison des rendus finaux — est alignée sur cette norme, ce qui signifie une qualité prévisible et un résultat constant sur chaque projet.",
    certNumber: TUV_RHEINLAND_CERT_ID,
    verifyUrl: TUV_RHEINLAND_VERIFY_URL,
  },
  {
    id: "iso-27001",
    code: "ISO/IEC 27001:2022",
    domain: "Sécurité de l’information",
    description:
      "La norme du management de la sécurité de l’information. Vos fichiers (plans, photos et données personnelles dans le portail) sont traités selon des procédures certifiées : accès contrôlé, chiffrement en transit, durées de conservation définies et processus de réponse aux incidents. Cette norme est aussi le socle de notre conformité au RGPD.",
    certNumber: TUV_RHEINLAND_CERT_ID,
    verifyUrl: TUV_RHEINLAND_VERIFY_URL,
  },
  {
    id: "iso-50001",
    code: "ISO 50001:2018",
    domain: "Management de l’énergie",
    description:
      "La norme du management systématique de l’efficacité énergétique. Notre capacité de rendu et notre infrastructure interne suivent et optimisent la consommation d’énergie, réduisant ainsi l’empreinte environnementale de la production architecturale numérique.",
    certNumber: TUV_RHEINLAND_CERT_ID,
    verifyUrl: TUV_RHEINLAND_VERIFY_URL,
  },
];

/**
 * The four ordering-process steps — rendered on the homepage Process
 * section and in the HowTo JSON-LD.
 */
export const PLATFORM_PRINCIPLES = [
  {
    title: "1. Obtenez votre devis",
    text: "Choisissez un service et voyez immédiatement le prix de départ — et exactement ce qu’il comprend.",
  },
  {
    title: "2. Envoyez vos documents",
    text: "Le formulaire ne demande que ce dont nous avons besoin pour commencer : plans, photos, références de style et un objectif en quelques mots.",
  },
  {
    title: "3. Recevez les premières versions",
    text: "Pour les projets standards, les premières versions arrivent sous 3 à 5 jours ouvrés, avec une communication claire via le portail.",
  },
  {
    title: "4. Finalisez par les révisions",
    text: "Trois séries de révisions sont incluses. Vous téléchargez ensuite les fichiers finaux et la documentation du projet.",
  },
] as const;

export type NavItem = { href: string; label: string };

export const NAV_MAIN: NavItem[] = [
  { href: "/ai-studio", label: "AI Studio" },
  { href: "/services", label: "Services" },
  { href: "/tarifs", label: "Tarifs" },
  ...(SITE_FEATURES.portfolio
    ? [{ href: "/portfolio", label: "Portfolio" }]
    : []),
  { href: "/a-propos", label: "À propos" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

const STRUCTURED_DATA_DESCRIPTION =
  "Visualisation architecturale professionnelle — rendus 3D d’intérieur et d’extérieur, home staging virtuel et rénovation virtuelle.";

export const NAV_LEGAL: NavItem[] = [
  { href: "/informations-legales", label: "Informations légales" },
  { href: "/informations-legales/mentions-legales", label: "Mentions légales" },
  { href: "/informations-legales/cgv", label: "CGV" },
  { href: "/informations-legales/confidentialite", label: "Politique de confidentialité" },
  { href: "/informations-legales/cookies", label: "Politique relative aux cookies" },
  { href: "/informations-legales/retractation#online-withdrawal", label: "Droit de rétractation" },
  { href: "/informations-legales/remboursements", label: "Remboursements" },
  { href: "/informations-legales/reclamations", label: "Procédure de réclamation" },
  { href: "/informations-legales/livraison", label: "Livraison numérique" },
  { href: "/informations-legales/certificats", label: "Certificats et normes" },
];

// Four concrete model-first savings examples — rendered as the 2×2 card grid
// next to the dark panel.
export const ORDERING_STEPS = [
  {
    step: "01",
    title: "Un nouvel angle de vue",
    description:
      "Les rendus d’extérieur commencent à 250 €, modèle 3D complet inclus. Chaque angle supplémentaire du même bâtiment coûte 81 % de moins.",
  },
  {
    step: "02",
    title: "Étages supplémentaires",
    description:
      "Le premier étage en intérieur couvre jusqu’à 10 pièces. Chaque étage supplémentaire du même bâtiment bénéficie d’une remise automatique de 30 %.",
  },
  {
    step: "03",
    title: "Animation",
    description:
      "Si nous avons déjà construit le modèle lors d’un projet précédent, le prix par seconde d’animation baisse de 33 %.",
  },
  {
    step: "04",
    title: "Immeubles résidentiels",
    description:
      "Pour les promoteurs : le premier type d’appartement est au plein tarif, et chaque type supplémentaire bénéficie d’une remise progressive pouvant atteindre 44 %.",
  },
] as const;

/** Alias kept for legacy imports in /contact and other places. */
export const HOW_IT_WORKS = ORDERING_STEPS;

export const FAQ_ITEMS = [
  {
    question: "Combien de temps prend un rendu ?",
    answer:
      "Pour les projets standards — par exemple l’intérieur d’une seule pièce — les premières versions arrivent sous 3 à 5 jours ouvrés. Pour les projets plus importants, vous recevez un calendrier précis avec le devis, avant le début du travail.",
  },
  {
    question: "Le prix comprend-il les révisions ?",
    answer:
      "Oui. Alors que le standard du secteur est de 1 à 2 séries, nous incluons 3 séries de révisions dans le prix de base. Nous voulons que vous soyez pleinement satisfait du résultat.",
  },
  {
    question: "Quels documents dois-je vous envoyer ?",
    answer:
      "Les plans (2D ou PDF), les photos de l’état actuel et des références de style ou d’ambiance sont les plus utiles. Le formulaire de commande vous permet de tout importer en une seule fois.",
  },
  {
    question: "Émettez-vous des factures et travaillez-vous sous contrat ?",
    answer:
      "Oui. Elegant Render fait partie de White Rook DOO et applique une facturation compatible avec les règles de l’UE. Chaque projet s’accompagne d’une documentation en bonne et due forme.",
  },
  {
    question: "Et si mon projet est plus grand que la moyenne ?",
    answer:
      "Pour les immeubles résidentiels et les grands projets immobiliers, nous appliquons des remises progressives — par exemple sur les types d’appartements répétés. Envoyez-nous une demande et vous recevrez un calcul précis.",
  },
] as const;

export const SERVICES_PAGE_FAQS = [
  {
    question: "Comment savoir quel service me convient ?",
    answer:
      "Envoyez-nous des photos, un plan ou une courte description de votre objectif. Sur cette base, nous vous proposons le service le plus logique et une fourchette de prix.",
  },
  {
    question: "Les prix sont-ils définitifs ?",
    answer:
      "La page affiche des prix de départ. Le prix final dépend de l’étendue du projet, du nombre de vues, du niveau de détail et des documents fournis.",
  },
  {
    question: "Combien de séries de révisions sont incluses ?",
    answer:
      "Trois séries de révisions sont incluses dans le prix de base de chaque service, sauf si l’étendue du projet change.",
  },
  {
    question: "Travaillez-vous uniquement en local ?",
    answer:
      "Elegant Render livre partout en France et au-delà. L’ensemble du processus — du devis aux fichiers finaux — se déroule en ligne via votre portail de projet.",
  },
] as const;

export const AI_STUDIO_FAQS = [
  {
    question: "AI Studio produit-il un rendu 3D ?",
    answer:
      "Non. AI Studio retouche des photographies existantes. Si l’espace n’existe pas encore ou si vous avez besoin d’une vue architecturale entièrement contrôlée, un rendu classique est le meilleur choix.",
  },
  {
    question: "Quand dois-je utiliser un masque ?",
    answer:
      "Utilisez un masque lorsque la retouche ne doit concerner qu’une partie de l’image : un objet volumineux, un mur précis, une partie du sol ou une zone de la pièce.",
  },
  {
    question: "Quelle est la différence entre staging, rénovation et redesign ?",
    answer:
      "Le staging ajoute des meubles dans un espace vide. La rénovation modifie les matériaux et les éléments de l’espace. Le redesign change le style et l’atmosphère d’une pièce existante.",
  },
  {
    question: "Quand utiliser l’insertion ou le remplacement de meubles/décoration ?",
    answer:
      "Lorsque vous avez une photo de l’espace et des images séparées d’un meuble, d’un objet de décoration, d’un luminaire, d’une plante, d’une œuvre d’art ou d’un appareil précis. Vous pouvez ajouter plusieurs angles du même modèle/de la même couleur/du même matériau, et pour un remplacement, vous marquez l’élément existant avec un masque.",
  },
  {
    question: "Puis-je retravailler un résultat ?",
    answer:
      "Oui. Un résultat peut devenir la nouvelle image d’entrée pour une petite correction ou une retouche supplémentaire. Si vous poursuivez le même type de retouche, le système autorise actuellement un nouvel essai gratuit.",
  },
  {
    question: "Que se passe-t-il si la retouche échoue ?",
    answer:
      "Si le système ne parvient pas à terminer la retouche, les crédits débités sont recrédités sur votre solde AI Studio. Si le résultat n’est pas assez bon, poursuivez la retouche à partir du résultat et utilisez l’essai gratuit disponible pour le même type de retouche.",
  },
  {
    question: "Combien de temps les fichiers restent-ils disponibles ?",
    answer:
      "Les fichiers AI Studio sont conservés pendant 30 jours. Pendant cette période, vous pouvez télécharger le résultat depuis votre historique ou l’utiliser comme nouvelle image d’entrée.",
  },
  {
    question: "Recevrai-je une facture pour les achats de crédits ?",
    answer:
      "Oui. Elegant Render fait partie de White Rook DOO et délivre une documentation en bonne et due forme pour les achats de crédits, sur la base des coordonnées de l’acheteur.",
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
        availableLanguage: ["fr"],
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
    areaServed: ["FR", "EU", "Worldwide"],
    currenciesAccepted: "EUR",
    priceRange: "€€",
    serviceType: [
      "Visualisation architecturale",
      "Rendu 3D",
      "Home staging virtuel",
      "Retouche photo immobilière par IA",
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
