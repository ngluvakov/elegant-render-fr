/**
 * cron-auth.ts — authorization for cron/webhook routes.
 *
 * Fail-closed: if the secret env var is not set, the request is
 * REJECTED — `header !== `Bearer ${undefined}`` comparisons used to
 * let the literal "Bearer undefined" through. Comparison is timing-safe.
 */
import crypto from "node:crypto";

export function timingSafeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return timingSafeEquals(header, `Bearer ${secret}`);
}
