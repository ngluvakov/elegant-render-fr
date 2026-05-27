import type { Metadata } from "next";
import type { ConfiguratorCategory } from "@/lib/catalog/configurator";
import type { Service } from "@/lib/catalog/services";
import { CONFIGURATOR_CATEGORIES } from "@/lib/catalog/configurator";
import { SERVICES } from "@/lib/catalog/services";
import {
  FAQ_ITEMS,
  PLATFORM_PRINCIPLES,
  SITE,
  buildOrganizationJsonLd,
} from "@/lib/content/site";

const DEFAULT_OG_IMAGE = "/og-image.jpg";
const DEFAULT_META_TITLE = `${SITE.name} — Arhitektonska vizuelizacija`;
const DEFAULT_META_DESCRIPTION =
  "Profesionalni 3D renderi enterijera i eksterijera, virtuelno opremanje i renovacija prostora. Brzo, kvalitetno i po pristupačnoj ceni.";
const DEFAULT_TWITTER_DESCRIPTION =
  "Profesionalni 3D renderi enterijera i eksterijera, virtuelno opremanje i renovacija prostora.";
const OG_IMAGE_SIZE = { width: 1200, height: 630 };
const SOCIAL_TITLE_MAX_LENGTH = 60;
const SOCIAL_DESCRIPTION_MAX_LENGTH = 155;
const DISCOVERY_KEYWORDS = [
  "arhitektonska vizuelizacija",
  "3D renderi",
  "renderi enterijera",
  "renderi eksterijera",
  "virtuelno opremanje",
  "virtuelna renovacija",
  "AI obrada fotografija nekretnina",
  "3D osnove",
  "360 ture",
  "arhitektonska animacija",
  "renderi Srbija",
];

export const SEO = {
  htmlLang: "sr-Latn",
  alternateLanguage: "sr-Latn-RS",
  locale: "sr_RS",
  defaultTitle: DEFAULT_META_TITLE,
  defaultDescription: DEFAULT_META_DESCRIPTION,
  twitterDescription: DEFAULT_TWITTER_DESCRIPTION,
  defaultImage: DEFAULT_OG_IMAGE,
  organizationId: `${SITE.url}/#organization`,
  websiteId: `${SITE.url}/#website`,
  keywords: DISCOVERY_KEYWORDS,
} as const;

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
  return {
    [SEO.alternateLanguage]: canonical,
    "sr-RS": canonical,
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
  imageAlt = `${SITE.name} arhitektonska vizuelizacija`,
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
      "Arhitektonska vizuelizacija",
      "3D renderi",
      "Virtuelno opremanje",
      "AI obrada fotografija nekretnina",
    ],
    audience: [
      {
        "@type": "Audience",
        audienceType:
          "Vlasnici nekretnina, agenti, arhitekte, dizajneri i investitori",
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
          "Sažet AI-readable pregled javnih stranica, usluga i pravila za citiranje.",
      },
      {
        "@type": "CreativeWork",
        "@id": `${SITE.url}/llms-full.txt#llms-full`,
        name: "llms-full.txt",
        url: `${SITE.url}/llms-full.txt`,
        encodingFormat: "text/plain",
        description:
          "Detaljan AI-readable profil sa uslugama, cenama, FAQ odgovorima i pravilima za AI sisteme.",
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
  const serviceUrl = absoluteUrl(`/usluge/${service.slug}`);
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
        name: "Serbia",
      },
      {
        "@type": "AdministrativeArea",
        name: "Europe",
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
    image: absoluteUrl(service.detailAsset ?? service.asset ?? DEFAULT_OG_IMAGE),
    offers: {
      "@type": "OfferCatalog",
      "@id": `${serviceUrl}#offers`,
      name: `${service.name} - varijante`,
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
    name: "Elegant Render usluge",
    url: absoluteUrl("/usluge"),
    itemListElement: services.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: service.name,
      url: absoluteUrl(`/usluge/${service.slug}`),
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
    "@id": `${absoluteUrl("/cene")}#offer-catalog`,
    name: "Elegant Render cenovnik",
    description:
      "Osnovne cene arhitektonske vizuelizacije u EUR. Za Srbiju se prikazuje RSD bruto cena sa PDV-om uračunatim u direktno prevedeni iznos.",
    url: absoluteUrl("/cene"),
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
        url: absoluteUrl("/cene"),
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
    name: "Kako naručiti arhitektonsku vizuelizaciju",
    description:
      "Elegant Render proces: izračunavanje okvira, slanje materijala, prvi nacrti i finalizacija kroz revizije.",
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
      name: `${SITE.name} - arhitektonska vizuelizacija`,
      description: SEO.defaultDescription,
    }),
    buildServicesItemListJsonLd(SERVICES.filter((service) => service.featured)),
    buildOrderingHowToJsonLd(),
    buildFaqJsonLd(faqItems),
  ];
}
