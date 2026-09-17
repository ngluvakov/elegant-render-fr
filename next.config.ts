import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Per-ikonica tree-shaking umesto celog lucide-react barrel-a.
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d2xsxph8kpxj0f.cloudfront.net",
      },
    ],
  },
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/@fontsource/noto-sans/files/noto-sans-latin-ext-400-normal.woff",
      "./node_modules/@fontsource/noto-sans/files/noto-sans-latin-ext-400-italic.woff",
      "./node_modules/@fontsource/noto-sans/files/noto-sans-latin-ext-700-normal.woff",
      // sharp (AI Studio image processing) is already externalized by Next,
      // but its linux-x64 binding dlopen()s libvips at runtime — a path the
      // file-tracer can't follow, so libvips-cpp.so.* was left out of the
      // Vercel function and sharp failed to load in production. Force-include
      // both native packages so the .node binding and its libvips .so ship
      // together. (Vercel runs linux-x64; other platforms are dev-only.)
      "./node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Safe baseline without CSP. A full Content-Security-Policy
          // should be introduced via a Report-Only phase after launch —
          // it can break the PayPal JS SDK, GTM and Sentry if rolled out
          // blind, so wire it deliberately, not here.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Canonical host is the apex (https://elegantrender.fr). The .fr PayPal
      // webhooks, NEXT_PUBLIC_SITE_URL and the sitemap all use it; www only
      // exists so typed-in URLs still land. PayPal does not follow redirects,
      // so the webhook path must never sit behind this rule — it lives on apex.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.elegantrender.fr" }],
        destination: "https://elegantrender.fr/:path*",
        permanent: true,
      },
      // English route names from the .com fork → French (2026-09-17).
      // Nothing was indexed under the old paths; these keep bookmarks,
      // PayPal return URLs and old emails working.
      { source: "/legal/certificates", destination: "/informations-legales/certificats", permanent: true },
      { source: "/legal/complaints", destination: "/informations-legales/reclamations", permanent: true },
      { source: "/legal/cookies", destination: "/informations-legales/cookies", permanent: true },
      { source: "/legal/delivery", destination: "/informations-legales/livraison", permanent: true },
      { source: "/legal/imprint", destination: "/informations-legales/mentions-legales", permanent: true },
      { source: "/legal/privacy", destination: "/informations-legales/confidentialite", permanent: true },
      { source: "/legal/refunds", destination: "/informations-legales/remboursements", permanent: true },
      { source: "/legal/terms", destination: "/informations-legales/cgv", permanent: true },
      { source: "/legal/withdrawal", destination: "/informations-legales/retractation", permanent: true },
      { source: "/checkout/success", destination: "/commande/succes", permanent: true },
      { source: "/checkout/failure", destination: "/commande/echec", permanent: true },
      { source: "/checkout/:path+", destination: "/commande/:path+", permanent: true },
      { source: "/checkout", destination: "/commande", permanent: true },
      { source: "/legal/:path+", destination: "/informations-legales/:path+", permanent: true },
      { source: "/legal", destination: "/informations-legales", permanent: true },
      { source: "/pricing", destination: "/tarifs", permanent: true },
      { source: "/about", destination: "/a-propos", permanent: true },
      { source: "/career", destination: "/carrieres", permanent: true },
      { source: "/login", destination: "/connexion", permanent: true },
      { source: "/register", destination: "/inscription", permanent: true },
      { source: "/forgot-password", destination: "/mot-de-passe-oublie", permanent: true },
      { source: "/reset-password", destination: "/nouveau-mot-de-passe", permanent: true },
      { source: "/verify-email", destination: "/verification-email", permanent: true },
      { source: "/portal-access", destination: "/acces-portail", permanent: true },
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
      {
        source: "/jobs",
        destination: "/carrieres",
        permanent: true,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "white-rook",
  // Sentry project for elegantrender.fr (org white-rook; create it under this
  // slug before go-live — see docs/go-live-fr.md). The .rs project kept the
  // wizard default name "javascript-nextjs" — do not reuse it.
  project: "elegant-render-fr",

  // Source map upload auth token. Set in Vercel env (Production +
  // Preview), locally in .env.sentry-build-plugin which is gitignored.
  // Without this, source maps don't upload and Sentry stack traces
  // point at minified bundles instead of TypeScript files.
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
