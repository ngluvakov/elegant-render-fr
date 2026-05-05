import type { Metadata } from "next";
import type { ConfiguratorCategory } from "@/lib/catalog/configurator";
import type { Service } from "@/lib/catalog/services";
import { CONFIGURATOR_CATEGORIES } from "@/lib/catalog/configurator";
import { SERVICES } from "@/lib/catalog/services";
import { FAQ_ITEMS, SITE } from "@/lib/content/site";

const DEFAULT_OG_IMAGE = "/artwork/elegant-render-hero-interior.webp";
const OG_IMAGE_SIZE = { width: 1200, height: 630 };

export const SEO = {
  htmlLang: "sr-Latn",
  locale: "sr_Latn_RS",
  defaultImage: DEFAULT_OG_IMAGE,
  organizationId: `${SITE.url}/#organization`,
  websiteId: `${SITE.url}/#website`,
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
  noIndex?: boolean;
};

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE.url}${normalized === "/" ? "" : normalized}`;
}

export function createPublicMetadata({
  title,
  description,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  imageAlt = `${SITE.name} arhitektonska vizuelizacija`,
  noIndex = false,
}: PublicMetadataOptions): Metadata {
  const canonical = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: noIndex ? NO_INDEX_ROBOTS : INDEXABLE_ROBOTS,
    openGraph: {
      title: `${title} — ${SITE.name}`,
      description,
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
      title: `${title} — ${SITE.name}`,
      description,
      images: [imageUrl],
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
    description: SITE.description,
    inLanguage: SEO.htmlLang,
    publisher: {
      "@id": SEO.organizationId,
    },
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
    provider: {
      "@id": SEO.organizationId,
    },
    areaServed: ["RS", "EU", "Worldwide"],
    url: serviceUrl,
    image: absoluteUrl(service.asset ?? DEFAULT_OG_IMAGE),
    offers: {
      "@type": "OfferCatalog",
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
      "Osnovne cene arhitektonske vizuelizacije u EUR bez PDV-a. Regionalni prikaz cena je informativni display sloj.",
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

export function buildHomeJsonLd() {
  return [
    buildWebSiteJsonLd(),
    buildWebPageJsonLd({
      path: "/",
      name: `${SITE.name} - arhitektonska vizuelizacija`,
      description: SITE.description,
    }),
    buildServicesItemListJsonLd(SERVICES.filter((service) => service.featured)),
    buildFaqJsonLd(FAQ_ITEMS),
  ];
}
