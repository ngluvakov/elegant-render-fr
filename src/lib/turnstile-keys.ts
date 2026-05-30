/**
 * turnstile-keys.ts -- Cloudflare Turnstile test-key detection.
 *
 * Cloudflare publishes dummy keys for automated testing. They are useful
 * in local/controlled test runs, but production payment initiation must
 * use real widget keys from the Cloudflare dashboard.
 */

const TURNSTILE_TEST_SITE_KEYS = new Set([
  "1x00000000000000000000AA",
  "2x00000000000000000000AB",
  "1x00000000000000000000BB",
  "2x00000000000000000000BB",
  "3x00000000000000000000FF",
]);

const TURNSTILE_TEST_SECRET_KEYS = new Set([
  "1x0000000000000000000000000000000AA",
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
]);

export function isTurnstileTestingSiteKey(
  siteKey: string | null | undefined,
): boolean {
  return Boolean(siteKey && TURNSTILE_TEST_SITE_KEYS.has(siteKey.trim()));
}

export function isTurnstileTestingSecretKey(
  secretKey: string | null | undefined,
): boolean {
  return Boolean(secretKey && TURNSTILE_TEST_SECRET_KEYS.has(secretKey.trim()));
}
