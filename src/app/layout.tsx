import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ConsentBanner } from "@/components/site/consent-banner";
import { GoogleAnalyticsPostLaunch } from "@/components/analytics/google-analytics-post-launch";
import { GoogleTagManagerPostLaunch } from "@/components/analytics/google-tag-manager-post-launch";
import { SITE } from "@/lib/content/site";
import { absoluteUrl, INDEXABLE_ROBOTS, SEO } from "@/lib/seo";

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

const GTM_CONTAINER_ID = "GTM-5X2MCQ87";
const GTM_BOOTSTRAP = `
window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied'
});
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_CONTAINER_ID}');
`;

export const metadata: Metadata = {
  title: {
    default: SEO.defaultTitle,
    template: `%s · ${SITE.name}`,
  },
  description: SEO.defaultDescription,
  metadataBase: new URL(SITE.url),
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
      <Script id="google-tag-manager" strategy="beforeInteractive">
        {GTM_BOOTSTRAP}
      </Script>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
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
