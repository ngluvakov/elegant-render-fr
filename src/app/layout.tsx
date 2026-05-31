import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ConsentBanner } from "@/components/site/consent-banner";
import { GoogleAnalyticsPostLaunch } from "@/components/analytics/google-analytics-post-launch";
import { GoogleTagManagerPostLaunch } from "@/components/analytics/google-tag-manager-post-launch";
import { LinkedInInsightTag } from "@/components/analytics/linkedin-insight-tag";
import { SITE } from "@/lib/content/site";
import {
  absoluteUrl,
  buildLanguageAlternates,
  INDEXABLE_ROBOTS,
  SEO,
} from "@/lib/seo";

const cormorant = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const googleSiteVerification =
  process.env.GOOGLE_SITE_VERIFICATION?.trim() || undefined;

export const metadata: Metadata = {
  title: {
    default: SEO.defaultTitle,
    template: `%s · ${SITE.name}`,
  },
  description: SEO.defaultDescription,
  applicationName: SITE.name,
  authors: [{ name: SITE.parentCompany, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.parentCompany,
  referrer: "strict-origin-when-cross-origin",
  category: "Architecture visualization",
  classification:
    "Architectural visualization, virtual staging, 3D rendering, AI real estate imagery",
  keywords: [...SEO.keywords],
  metadataBase: new URL(SITE.url),
  alternates: {
    canonical: SITE.url,
    languages: buildLanguageAlternates("/"),
  },
  robots: INDEXABLE_ROBOTS,
  openGraph: {
    title: SEO.defaultTitle,
    description: SEO.defaultDescription,
    url: SITE.url,
    siteName: SITE.name,
    locale: SEO.locale,
    type: "website",
    images: [
      {
        url: absoluteUrl(SEO.defaultImage),
        width: 1200,
        height: 630,
        alt: `${SITE.name} arhitektonska vizuelizacija`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO.defaultTitle,
    description: SEO.twitterDescription,
    images: [absoluteUrl(SEO.defaultImage)],
  },
  other: {
    "twitter:url": SITE.url,
  },
  verification: googleSiteVerification
    ? {
        google: googleSiteVerification,
      }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={SEO.htmlLang}
      className={cn("h-full antialiased", cormorant.variable, manrope.variable)}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
        <ConsentBanner />
        <Analytics />
        <SpeedInsights />
        <GoogleAnalyticsPostLaunch />
        <GoogleTagManagerPostLaunch />
        <LinkedInInsightTag />
      </body>
    </html>
  );
}
