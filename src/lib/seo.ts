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
const DEFAULT_META_TITLE = `${SITE.name} — Architectural visualization`;
const DEFAULT_META_DESCRIPTION =
  "Hand-crafted 3D interior and exterior renders, virtual staging and visual makeovers for homes and properties — with prices you can see up front.";
const DEFAULT_TWITTER_DESCRIPTION =
  "Photorealistic 3D renders, virtual staging and visual makeovers — with transparent pricing.";
const OG_IMAGE_SIZE = { width: 1200, height: 630 };
const SOCIAL_TITLE_MAX_LENGTH = 60;
const SOCIAL_DESCRIPTION_MAX_LENGTH = 155;
const DISCOVERY_KEYWORDS = [
  "architectural visualization studio",
  "3D rendering services",
  "photorealistic interior renders",
  "exterior renders",
  "virtual staging",
  "virtual renovation",
  "real estate renders Europe",
  "floor plan rendering",
  "360 virtual tour",
  "architectural animation",
  "day-to-dusk editing",
  "AI real estate photo editing",
];

export const SEO = {
  htmlLang: "en",
  locale: "en_US",
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
  // Cross-domain sr link to elegantrender.rs is intentionally omitted for
  // now — flagged separately; add it here once the pairing is signed off.
  return {
    en: canonical,
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
  imageAlt = `${SITE.name} architectural visualization`,
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
    category: "Architecture visualization",
    classification:
      "Architectural visualization, virtual staging, 3D rendering, AI real estate imagery",
    keywords: mergeKeywords(keywords),
    alternates: {
      canonical,
      languages: buildLanguageAlternates(path),
    },
    robots: noIndex ? NO_INDEX_ROBOTS : INDEXABLE_ROBOTS,
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
      "Architectural visualization",
      "3D rendering",
      "Virtual staging",
      "AI real estate photo editing",
    ],
    audience: [
      {
        "@type": "Audience",
        audienceType:
          "Property owners, real estate agents, architects, designers and developers",
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
          "Concise AI-readable overview of public pages, services and citation rules.",
      },
      {
        "@type": "CreativeWork",
        "@id": `${SITE.url}/llms-full.txt#llms-full`,
        name: "llms-full.txt",
        url: `${SITE.url}/llms-full.txt`,
        encodingFormat: "text/plain",
        description:
          "Detailed AI-readable profile with services, prices, FAQ answers and rules for AI systems.",
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
        "@type": "AdministrativeArea",
        name: "Europe",
      },
      {
        "@type": "Country",
        name: "United Kingdom",
      },
      {
        "@type": "Country",
        name: "United States",
      },
      {
        "@type": "Place",
        name: "Worldwide",
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
      name: `${service.name} — variants`,
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
    name: "Elegant Render services",
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
    "@id": `${absoluteUrl("/pricing")}#offer-catalog`,
    name: "Elegant Render price list",
    description:
      "Base prices for architectural visualization are in EUR.",
    url: absoluteUrl("/pricing"),
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
        url: absoluteUrl("/pricing"),
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
    name: "How to order architectural visualization",
    description:
      "The Elegant Render process: get your estimate, send your materials, receive first drafts and finalize through revisions.",
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
      name: `${SITE.name} — architectural visualization`,
      description: SEO.defaultDescription,
    }),
    buildServicesItemListJsonLd(SERVICES.filter((service) => service.featured)),
    buildOrderingHowToJsonLd(),
    buildFaqJsonLd(faqItems),
  ];
}
