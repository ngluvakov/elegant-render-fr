import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
  },
  async redirects() {
    return [
      // Legacy mixed service split into vr-tura + arhitektonska-animacija.
      // Old slug 301s to vr-tura (primary product of the legacy bundle).
      {
        source: "/usluge/360-ture-i-animacije",
        destination: "/usluge/vr-tura",
        permanent: true,
      },
      // Friendly alias: people type "uredjenje-pejzaza" but slug is prikazi-dvorista.
      {
        source: "/usluge/uredjenje-pejzaza",
        destination: "/usluge/prikazi-dvorista",
        permanent: true,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "white-rook",
  project: "javascript-nextjs",

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
