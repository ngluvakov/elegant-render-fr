import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ConsentBanner } from "@/components/site/consent-banner";
import { GoogleAnalyticsPostLaunch } from "@/components/analytics/google-analytics-post-launch";
import { GoogleTagManagerPostLaunch } from "@/components/analytics/google-tag-manager-post-launch";
import { SITE } from "@/lib/content/site";
import {
  absoluteUrl,
  buildLanguageAlternates,
  INDEXABLE_ROBOTS,
  SEO,
} from "@/lib/seo";

// White Rook design system: Inter Tight does both display and body work
// (weight 500 carries headings; --font-heading aliases --font-sans in
// globals.css so the family loads once); JetBrains Mono is the signature
// accent for eyebrows, prices, specs and file names. See docs/design-handoff.
const interTight = Inter_Tight({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
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
  category: "Visualisation architecturale",
  classification:
    "Visualisation architecturale, home staging virtuel, rendu 3D, imagerie immobilière par IA",
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
        alt: `Visualisation architecturale ${SITE.name}`,
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
      className={cn(
        "h-full antialiased",
        interTight.variable,
        jetbrainsMono.variable,
      )}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
        <ConsentBanner />
        <Analytics />
        <SpeedInsights />
        <GoogleAnalyticsPostLaunch />
        <GoogleTagManagerPostLaunch />
      </body>
    </html>
  );
}
