import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content/site";

export default function robots(): MetadataRoute.Robots {
  // Pre-launch: discourage crawling. Flip to "allow" before going live.
  return {
    rules: [
      {
        userAgent: "*",
        disallow: "/",
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
