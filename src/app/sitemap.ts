import type { MetadataRoute } from "next";
import { SERVICES } from "@/lib/catalog/services";
import { SITE } from "@/lib/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const base = SITE.url;
  const staticRoutes = [
    "",
    "/usluge",
    "/cene",
    "/portfolio",
    "/o-nama",
    "/kontakt",
    "/pravno/privatnost",
    "/pravno/uslovi",
    "/pravno/kolacici",
  ];

  return [
    ...staticRoutes.map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
    })),
    ...SERVICES.map((service) => ({
      url: `${base}/usluge/${service.slug}`,
      lastModified: now,
    })),
  ];
}
