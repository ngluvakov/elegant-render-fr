/**
 * url.ts — Public base URL helpers for Nestpay redirects.
 *
 * Bank callbacks must round-trip to the merchant domain configured in
 * AUTH_URL, not to the bank Origin header or a random deployment host.
 */

type PublicBaseEnv = {
  [key: string]: string | undefined;
  AUTH_URL?: string;
  VERCEL_ENV?: string;
  VERCEL_URL?: string;
};

export function getNestpayPublicBaseUrl(
  env: PublicBaseEnv = process.env,
): string {
  if (env.AUTH_URL) return env.AUTH_URL;
  if (env.VERCEL_ENV === "preview" && env.VERCEL_URL) {
    return `https://${env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
