/**
 * cron-auth.ts — autorizacija za cron/webhook rute.
 *
 * Fail-closed: ako secret env var nije podešen, zahtev se ODBIJA —
 * `header !== `Bearer ${undefined}`` poređenja su ranije propuštala
 * literal "Bearer undefined". Poređenje je timing-safe.
 *
 * NAPOMENA: api/cron/nestpay-reconcile namerno NE koristi ovaj helper —
 * platna zona je zamrznuta do završetka retesta banke.
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
