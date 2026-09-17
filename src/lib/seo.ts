import type { Metadata } from "next";
import type { ConfiguratorCategory } from "@/lib/catalog/configurator";
import type { Service } from "@/lib/catalog/services";
import { CONFIGURATOR_CATEGORIES } from "@/lib/catalog/configurator";
import {
  SERVICES,
  buildServiceImageAlt,
  buildServiceImageCaption,
} from "@/lib/catalog/services";
import {
  FAQ_ITEMS,
  PLATFORM_PRINCIPLES,
  SITE,
  buildOrganizationJsonLd,
} from "@/lib/content/site";

const DEFAULT_OG_IMAGE = "/og-image.jpg";
const DEFAULT_META_TITLE = `${SITE.name} — Visualisation architecturale`;
const DEFAULT_META_DESCRIPTION =
  "Rendus 3D d’intérieur et d’extérieur réalisés à la main, home staging virtuel et transformations visuelles pour maisons et biens immobiliers — avec des prix affichés dès le départ.";
const DEFAULT_TWITTER_DESCRIPTION =
  "Rendus 3D photoréalistes, home staging virtuel et transformations visuelles — avec des prix transparents.";
const OG_IMAGE_SIZE = { width: 1200, height: 630 };
const SOCIAL_TITLE_MAX_LENGTH = 60;
const SOCIAL_DESCRIPTION_MAX_LENGTH = 155;
const DISCOVERY_KEYWORDS = [
  "studio de visualisation architecturale",
  "service de rendu 3D",
  "perspective 3D immobilier",
  "rendu 3D intérieur photoréaliste",
  "rendu 3D extérieur",
  "home staging virtuel",
  "rénovation virtuelle",
  "rendu 3D immobilier France",
  "plan 3D maison",
  "visite virtuelle 360°",
  "animation architecturale",
  "photo crépuscule immobilier",
  "retouche photo immobilière IA",
];

export const SEO = {
  htmlLang: "fr-FR",
  locale: "fr_FR",
  defaultTitle: DEFAULT_META_TITLE,
  defaultDescription: DEFAULT_META_DESCRIPTION,
  twitterDescription: DEFAULT_TWITTER_DESCRIPTION,
  defaultImage: DEFAULT_OG_IMAGE,
  organizationId: `${SITE.url}/#organization`,
  websiteId: `${SITE.url}/#website`,
  keywords: DISCOVERY_KEYWORDS,
} as const;

type SeoImageObjectOptions = {
  src: string;
  name: string;
  caption: string;
};

function buildSeoImageObject({
  src,
  name,
  caption,
}: SeoImageObjectOptions) {
  const url = absoluteUrl(src);
  return {
    "@type": "ImageObject",
    url,
    contentUrl: url,
    name,
    caption,
    description: caption,
    inLanguage: SEO.htmlLang,
  };
}

export const INDEXABLE_ROBOTS: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

export const NO_INDEX_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
};

/**
 * Preview deployments run with USE_STATIC_PRICING=1 (no database) on a
 * *.vercel.app URL. They must never be indexed: the same copy would compete
 * with the real domain and the canonical URLs point at vercel.app. Dropping
 * USE_STATIC_PRICING at go-live flips the whole site back to indexable.
 */
export const IS_PREVIEW_DEPLOYMENT = process.env.USE_STATIC_PRICING === "1";

/** Site-wide robots directive — no-index while this is a preview build. */
export const PAGE_ROBOTS: Metadata["robots"] = IS_PREVIEW_DEPLOYMENT
  ? NO_INDEX_ROBOTS
  : INDEXABLE_ROBOTS;

type PublicMetadataOptions = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  imageAlt?: string;
  keywords?: string[];
  twitterDescription?: string;
  noIndex?: boolean;
};

function normalizePath(path = "/"): string {
  const trimmed = path.trim();
  if (!trimmed || trimmed === "/") return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function normalizeCanonicalPath(path = "/"): string {
  const absoluteMatch = path.match(/^https?:\/\//);
  const rawPath = absoluteMatch ? new URL(path).pathname : path;
  const withoutSearchOrHash = rawPath.split(/[?#]/, 1)[0];
  const normalized = normalizePath(withoutSearchOrHash).replace(/\/{2,}/g, "/");
  return normalized === "/" ? normalized : normalized.replace(/\/+$/, "");
}

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  const normalized = normalizePath(path);
  return `${SITE.url}${normalized === "/" ? "" : normalized}`;
}

export function canonicalUrl(path = "/"): string {
  return absoluteUrl(normalizeCanonicalPath(path));
}

export function buildLanguageAlternates(path = "/"): Record<string, string> {
  const canonical = canonicalUrl(path);
  // Cross-domain alternates to the .com/.de siblings are intentionally
  // omitted for now — add them here once the pairing is signed off.
  return {
    fr: canonical,
    "x-default": canonical,
  };
}

function mergeKeywords(keywords: string[] = []): string[] {
  return Array.from(new Set([...SEO.keywords, ...keywords]));
}

function trimForMeta(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  const truncated = normalized.slice(0, maxLength - 1);
  const lastSpace = truncated.lastIndexOf(" ");
  const safeCut = lastSpace > maxLength * 0.6 ? truncated.slice(0, lastSpace) : truncated;
  return `${safeCut.trim()}…`;
}

function formatSocialTitle(title: string, path: string): string {
  if (path === "/") return DEFAULT_META_TITLE;
  return trimForMeta(`${title} — ${SITE.name}`, SOCIAL_TITLE_MAX_LENGTH);
}

export function createPublicMetadata({
  title,
  description,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  imageAlt = `${SITE.name} — visualisation architecturale`,
  keywords,
  twitterDescription,
  noIndex = false,
}: PublicMetadataOptions): Metadata {
  const canonical = canonicalUrl(path);
  const imageUrl = absoluteUrl(image);
  const socialTitle = formatSocialTitle(title, path);
  const socialDescription = trimForMeta(
    description,
    SOCIAL_DESCRIPTION_MAX_LENGTH,
  );
  const socialTwitterDescription = trimForMeta(
    twitterDescription ?? description,
    SOCIAL_DESCRIPTION_MAX_LENGTH,
  );

  return {
    title: path === "/" ? { absolute: DEFAULT_META_TITLE } : title,
    description,
    applicationName: SITE.name,
    authors: [{ name: SITE.parentCompany, url: SITE.url }],
    creator: SITE.name,
    publisher: SITE.parentCompany,
    referrer: "strict-origin-when-cross-origin",
    category: "Visualisation architecturale",
    classification:
      "Visualisation architecturale, home staging virtuel, rendu 3D, imagerie immobilière par IA",
    keywords: mergeKeywords(keywords),
    alternates: {
      canonical,
      languages: buildLanguageAlternates(path),
    },
    robots: noIndex ? NO_INDEX_ROBOTS : PAGE_ROBOTS,
    openGraph: {
      title: socialTitle,
      description: socialDescription,
      url: canonical,
      siteName: SITE.name,
      locale: SEO.locale,
      type: "website",
      images: [
        {
          url: imageUrl,
          ...OG_IMAGE_SIZE,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: socialTwitterDescription,
      images: [imageUrl],
    },
    other: {
      "twitter:url": canonical,
    },
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SEO.websiteId,
    url: SITE.url,
    name: SITE.name,
    description: SEO.defaultDescription,
    inLanguage: SEO.htmlLang,
    keywords: SEO.keywords.join(", "),
    publisher: {
      "@id": SEO.organizationId,
    },
    about: [
      "Visualisation architecturale",
      "Rendu 3D",
      "Home staging virtuel",
      "Retouche photo immobilière par IA",
    ],
    audience: [
      {
        "@type": "Audience",
        audienceType:
          "Propriétaires, agents immobiliers, architectes, designers et promoteurs",
      },
    ],
    hasPart: [
      {
        "@type": "CreativeWork",
        "@id": `${SITE.url}/llms.txt#llms`,
        name: "llms.txt",
        url: `${SITE.url}/llms.txt`,
        encodingFormat: "text/plain",
        description:
          "Aperçu concis, lisible par les IA, des pages publiques, des services et des règles de citation.",
      },
      {
        "@type": "CreativeWork",
        "@id": `${SITE.url}/llms-full.txt#llms-full`,
        name: "llms-full.txt",
        url: `${SITE.url}/llms-full.txt`,
        encodingFormat: "text/plain",
        description:
          "Profil détaillé, lisible par les IA, avec les services, les prix, les réponses de la FAQ et les règles pour les systèmes d’IA.",
      },
    ],
  };
}

export function buildWebPageJsonLd({
  path,
  name,
  description,
}: {
  path: string;
  name: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${absoluteUrl(path)}#webpage`,
    url: absoluteUrl(path),
    name,
    description,
    inLanguage: SEO.htmlLang,
    isPartOf: {
      "@id": SEO.websiteId,
    },
    publisher: {
      "@id": SEO.organizationId,
    },
    about: {
      "@id": SEO.organizationId,
    },
  };
}

export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildFaqJsonLd(
  items: ReadonlyArray<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildServiceJsonLd(service: Service) {
  const serviceUrl = absoluteUrl(`/services/${service.slug}`);
  const image =
    service.detailAsset ??
    service.detailAfterAsset ??
    service.listingAsset ??
    service.asset ??
    DEFAULT_OG_IMAGE;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${serviceUrl}#service`,
    name: service.name,
    alternateName: service.shortName,
    description: service.description,
    serviceType: service.name,
    category: service.category,
    mainEntityOfPage: {
      "@id": `${serviceUrl}#webpage`,
    },
    provider: {
      "@type": "LocalBusiness",
      "@id": SEO.organizationId,
      name: SITE.name,
      url: SITE.url,
    },
    areaServed: [
      {
        "@type": "Country",
        name: "France",
      },
      {
        "@type": "AdministrativeArea",
        name: "Europe",
      },
      {
        "@type": "Place",
        name: "Monde entier",
      },
    ],
    ...(service.forSegments?.length
      ? {
          audience: service.forSegments.map((segment) => ({
            "@type": "Audience",
            audienceType: segment,
          })),
        }
      : {}),
    url: serviceUrl,
    image: buildSeoImageObject({
      src: image,
      name: buildServiceImageAlt(service, "detail"),
      caption: buildServiceImageCaption(service, "detail"),
    }),
    offers: {
      "@type": "OfferCatalog",
      "@id": `${serviceUrl}#offers`,
      name: `${service.name} — variantes`,
      itemListElement: service.variants.map((variant) => ({
        "@type": "Offer",
        name: variant.title,
        description: variant.description,
        price: variant.basePrice,
        priceCurrency: "EUR",
        url: serviceUrl,
        itemOffered: {
          "@type": "Service",
          name: variant.title,
          description: variant.included,
        },
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: variant.basePrice,
          priceCurrency: "EUR",
          unitText: variant.unitLabel,
        },
      })),
    },
  };
}

export function buildServicesItemListJsonLd(services: Service[] = SERVICES) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Services Elegant Render",
    url: absoluteUrl("/services"),
    itemListElement: services.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: service.name,
      url: absoluteUrl(`/services/${service.slug}`),
      description: service.description,
    })),
  };
}

export function buildOfferCatalogJsonLd(
  categories: ConfiguratorCategory[] = CONFIGURATOR_CATEGORIES,
) {
  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    "@id": `${absoluteUrl("/tarifs")}#offer-catalog`,
    name: "Grille tarifaire Elegant Render",
    description:
      "Les prix de base de la visualisation architecturale sont en euros.",
    url: absoluteUrl("/tarifs"),
    provider: {
      "@id": SEO.organizationId,
    },
    itemListElement: categories.map((category) => ({
      "@type": "OfferCatalog",
      name: category.label,
      description: category.description,
      itemListElement: category.products.map((product) => ({
        "@type": "Offer",
        name: product.label,
        description: product.includes.join(", "),
        price: product.basePriceEur,
        priceCurrency: "EUR",
        url: absoluteUrl("/tarifs"),
        availability: product.inquiryOnly
          ? "https://schema.org/PreOrder"
          : "https://schema.org/InStock",
        itemOffered: {
          "@type": "Service",
          name: product.label,
          description: product.includes.join(", "),
          provider: {
            "@id": SEO.organizationId,
          },
        },
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: product.basePriceEur,
          priceCurrency: "EUR",
          unitText: product.unitLabel,
        },
      })),
    })),
  };
}

export function buildOrderingHowToJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${SITE.url}/#ordering-howto`,
    name: "Comment commander une visualisation architecturale",
    description:
      "Le processus Elegant Render : obtenez votre devis, envoyez vos documents, recevez les premières versions et finalisez par les révisions.",
    inLanguage: SEO.htmlLang,
    provider: {
      "@id": SEO.organizationId,
    },
    step: PLATFORM_PRINCIPLES.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.title.replace(/^\d+\.\s*/, ""),
      text: step.text,
    })),
  };
}

export function buildHomeJsonLd(
  faqItems: ReadonlyArray<{ question: string; answer: string }> = FAQ_ITEMS,
) {
  return [
    buildOrganizationJsonLd(),
    buildWebSiteJsonLd(),
    buildWebPageJsonLd({
      path: "/",
      name: `${SITE.name} — visualisation architecturale`,
      description: SEO.defaultDescription,
    }),
    buildServicesItemListJsonLd(SERVICES.filter((service) => service.featured)),
    buildOrderingHowToJsonLd(),
    buildFaqJsonLd(faqItems),
  ];
}
