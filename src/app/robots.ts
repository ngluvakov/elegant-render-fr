import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/llms.txt", "/llms-full.txt"],
      disallow: [
        "/api/",
        "/portal/",
        "/poruci",
        "/prijava",
        "/registracija",
        "/zaboravljena-lozinka",
        "/nova-lozinka",
        "/verifikacija",
        "/portal-pristup",
      ],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
