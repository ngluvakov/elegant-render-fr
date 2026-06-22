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
  // Strip any trailing slash so callers can append "/api/nestpay/return"
  // without producing a double slash. okUrl/failUrl are part of the ver2
  // request hash, so a stray slash from a copy-pasted AUTH_URL (the bank's
  // onboarding mail lists the store URL as "https://elegantrender.rs/")
  // would otherwise break the hash/return round-trip.
  const normalize = (url: string) => url.replace(/\/+$/, "");
  if (env.AUTH_URL) return normalize(env.AUTH_URL);
  if (env.VERCEL_ENV === "preview" && env.VERCEL_URL) {
    return normalize(`https://${env.VERCEL_URL}`);
  }
  return "http://localhost:3000";
}
