import type { MetadataRoute } from "next";
import { SERVICES } from "@/lib/catalog/services";
import { absoluteUrl } from "@/lib/seo";

type SitemapEntry = {
  path: string;
  changeFrequency: NonNullable<
    MetadataRoute.Sitemap[number]["changeFrequency"]
  >;
  priority: number;
};

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: SitemapEntry[] = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/usluge", changeFrequency: "weekly", priority: 0.95 },
    { path: "/cene", changeFrequency: "daily", priority: 0.95 },
    { path: "/ai-studio", changeFrequency: "weekly", priority: 0.9 },
    { path: "/kontakt", changeFrequency: "monthly", priority: 0.85 },
    { path: "/o-nama", changeFrequency: "monthly", priority: 0.65 },
    {
      path: "/usluge/vr/konsultacija",
      changeFrequency: "monthly",
      priority: 0.65,
    },
    { path: "/pravno/impressum", changeFrequency: "yearly", priority: 0.45 },
    { path: "/pravno/sertifikati", changeFrequency: "yearly", priority: 0.55 },
    { path: "/pravno/privatnost", changeFrequency: "yearly", priority: 0.35 },
    { path: "/pravno/uslovi", changeFrequency: "yearly", priority: 0.35 },
    { path: "/pravno/kolacici", changeFrequency: "yearly", priority: 0.35 },
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(route.path),
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...SERVICES.map((service) => ({
      url: absoluteUrl(`/usluge/${service.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: service.featured ? 0.9 : 0.75,
    })),
  ];
}
