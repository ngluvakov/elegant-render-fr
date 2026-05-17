import type { MetadataRoute } from "next";
import { SERVICES } from "@/lib/catalog/services";
import { absoluteUrl } from "@/lib/seo";

type SitemapEntry = {
  path: string;
  changeFrequency: NonNullable<
    MetadataRoute.Sitemap[number]["changeFrequency"]
  >;
  priority: number;
  images?: string[];
};

function uniqueImages(images: Array<string | undefined>): string[] | undefined {
  const urls = Array.from(
    new Set(
      images
        .filter((image): image is string => Boolean(image))
        .map((image) => absoluteUrl(image)),
    ),
  );

  return urls.length > 0 ? urls : undefined;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: SitemapEntry[] = [
    {
      path: "/",
      changeFrequency: "weekly",
      priority: 1,
      images: uniqueImages([
        "/og-image.jpg",
        "/artwork/elegant-render-hero-interior.webp",
        "/artwork/elegant-render-services-before-after-grid.webp",
      ]),
    },
    {
      path: "/usluge",
      changeFrequency: "weekly",
      priority: 0.95,
      images: uniqueImages([
        "/artwork/elegant-render-services-triptych-1.webp",
        "/artwork/elegant-render-services-triptych-2.webp",
        "/artwork/elegant-render-services-triptych-3.webp",
        "/artwork/elegant-render-services-triptych-4.webp",
      ]),
    },
    {
      path: "/cene",
      changeFrequency: "daily",
      priority: 0.95,
      images: uniqueImages([
        "/artwork/cene-card-enterijer.webp",
        "/artwork/cene-card-eksterijer.webp",
        "/artwork/cene-card-planovi.webp",
        "/artwork/cene-card-opremanje-renovacija.webp",
      ]),
    },
    {
      path: "/ai-studio",
      changeFrequency: "weekly",
      priority: 0.9,
      images: uniqueImages([
        "/artwork/ai-tool-virtual_staging-before.webp",
        "/artwork/ai-tool-virtual_staging-after.webp",
        "/artwork/ai-tool-room_redesign-before.webp",
        "/artwork/ai-tool-room_redesign-after.webp",
        "/artwork/ai-tool-object_insertion-before.webp",
        "/artwork/ai-tool-object_insertion-after.webp",
      ]),
    },
    { path: "/kontakt", changeFrequency: "monthly", priority: 0.85 },
    { path: "/o-nama", changeFrequency: "monthly", priority: 0.65 },
    {
      path: "/cesto-postavljana-pitanja",
      changeFrequency: "monthly",
      priority: 0.75,
    },
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
    { path: "/llms.txt", changeFrequency: "weekly", priority: 0.4 },
    { path: "/llms-full.txt", changeFrequency: "daily", priority: 0.4 },
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(route.path),
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      images: route.images,
    })),
    ...SERVICES.map((service) => ({
      url: absoluteUrl(`/usluge/${service.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: service.featured ? 0.9 : 0.75,
      images: uniqueImages([
        service.listingAsset,
        service.detailAsset,
        service.detailBeforeAsset,
        service.detailAfterAsset,
        service.asset,
        service.beforeAsset,
        service.afterAsset,
      ]),
    })),
  ];
}
