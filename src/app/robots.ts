import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content/site";

// Keep crawlers on public, citeable material. Index exclusion for HTML pages
// should still use noindex/auth; robots.txt is a crawl preference.
const PRIVATE_PATHS = [
  "/api",
  "/monitoring",
  "/portal",
  "/checkout",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/portal-access",
];

const PUBLIC_ALLOW = [
  "/",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/llms-full.txt",
];

// Named entries make AI visibility explicit instead of relying only on the
// wildcard. This covers common AI search crawlers, user-initiated retrieval
// agents, and model-development user-agent tokens; all stay on public pages.
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bytespider",
  "CCBot",
  "Amazonbot",
  "Meta-ExternalAgent",
  "Diffbot",
  "cohere-ai",
  "DuckAssistBot",
  "MistralAI-User",
  "YouBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: PUBLIC_ALLOW,
        disallow: PRIVATE_PATHS,
      },
      ...AI_BOTS.map((userAgent) => ({
        userAgent,
        allow: PUBLIC_ALLOW,
        disallow: PRIVATE_PATHS,
      })),
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: new URL(SITE.url).host,
  };
}
