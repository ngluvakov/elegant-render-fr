import type { MetadataRoute } from "next";
import { SERVICES } from "@/lib/catalog/services";
import { getAllBlogPosts } from "@/lib/content/blog";
import { absoluteUrl, buildLanguageAlternates } from "@/lib/seo";

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
      path: "/services",
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
      path: "/pricing",
      changeFrequency: "daily",
      priority: 0.95,
      images: uniqueImages([
        "/artwork/pricing-card-interior.webp",
        "/artwork/pricing-card-exterior.webp",
        "/artwork/pricing-card-plans.webp",
        "/artwork/pricing-card-staging-renovation.webp",
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
    { path: "/contact", changeFrequency: "monthly", priority: 0.85 },
    {
      path: "/blog",
      changeFrequency: "weekly",
      priority: 0.7,
      images: uniqueImages(
        getAllBlogPosts()
          .slice(0, 4)
          .map((post) => post.coverImage),
      ),
    },
    { path: "/about", changeFrequency: "monthly", priority: 0.65 },
    {
      path: "/faq",
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      path: "/services/vr/consultation",
      changeFrequency: "monthly",
      priority: 0.65,
    },
    { path: "/legal/imprint", changeFrequency: "yearly", priority: 0.45 },
    { path: "/legal/certificates", changeFrequency: "yearly", priority: 0.55 },
    { path: "/legal/privatnost", changeFrequency: "yearly", priority: 0.35 },
    { path: "/legal/uslovi", changeFrequency: "yearly", priority: 0.35 },
    { path: "/legal/cookies", changeFrequency: "yearly", priority: 0.35 },
    { path: "/llms.txt", changeFrequency: "weekly", priority: 0.4 },
    { path: "/llms-full.txt", changeFrequency: "daily", priority: 0.4 },
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(route.path),
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: buildLanguageAlternates(route.path),
      },
      images: route.images,
    })),
    ...SERVICES.map((service) => ({
      url: absoluteUrl(`/services/${service.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: service.featured ? 0.9 : 0.75,
      alternates: {
        languages: buildLanguageAlternates(`/services/${service.slug}`),
      },
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
    ...getAllBlogPosts().map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.updated ?? post.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: {
        languages: buildLanguageAlternates(`/blog/${post.slug}`),
      },
      images: uniqueImages([post.coverImage]),
    })),
  ];
}
