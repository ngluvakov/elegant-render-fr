/**
 * hash.ts — Nestpay HASH ver2 builder and verifier.
 *
 * Two flavors per the bank's "3D Pay Hosting" spec (ISPC_Nestpay_
 * Merchant_Integration_3D_PayHosting.pdf, ch. 3 + appendix A):
 *
 *   1. REQUEST hash — positional plaintext with predefined empty slots
 *      where unused parameters would go. Spec format:
 *
 *      clientid|oid|amount|okurl|failurl|trantype||rnd||||currency|StoreKey
 *
 *      Send `hash = base64(SHA-512(plaintext))` as a form field on the
 *      POST to /fim/est3Dgate.
 *
 *   2. RESPONSE hash — bank POSTs back to okUrl/failUrl with a `hash`
 *      field that authenticates the response. Plaintext is all received
 *      form fields except `hash` and `encoding`, sorted alphabetically
 *      by key (case-insensitive), values pipe-joined with `\` and `|`
 *      escaped, then `|StoreKey` appended. Same SHA-512 → base64.
 *
 * StoreKey is the merchant secret. It never appears in the POST body,
 * only inside the hash plaintext. Test and live keys differ; rotate
 * the live key every ~3 months per bank guidance.
 *
 * Used by: client.ts (request side) and the /api/nestpay/return route
 * handler (response side).
 */
import { createHash } from "node:crypto";

export type NestpayRequestHashInput = {
  clientId: string;
  oid: string;
  amount: string;
  okUrl: string;
  failUrl: string;
  tranType: string;
  rnd: string;
  currency: string;
  storeKey: string;
};

export function buildRequestHashVer2(input: NestpayRequestHashInput): string {
  const plain = [
    input.clientId,
    input.oid,
    input.amount,
    input.okUrl,
    input.failUrl,
    input.tranType,
    "",
    input.rnd,
    "",
    "",
    "",
    input.currency,
    input.storeKey,
  ].join("|");

  return createHash("sha512").update(plain, "utf8").digest("base64");
}

// Backslash and pipe inside a value would otherwise collide with the
// outer pipe separator. Per the Nestpay ver2 spec the escape order is
// backslash FIRST so a literal `\|` in a value becomes `\\\|` rather
// than `\\|` (which would round-trip incorrectly).
function escapeFieldValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
}

export function buildResponseHashVer2(
  fields: Record<string, string>,
  storeKey: string,
): string {
  const keys = Object.keys(fields)
    .filter((k) => k.toLowerCase() !== "hash" && k.toLowerCase() !== "encoding")
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  const parts: string[] = [];
  for (const key of keys) {
    parts.push(escapeFieldValue(fields[key] ?? ""));
  }
  parts.push(escapeFieldValue(storeKey));

  const plain = parts.join("|");
  return createHash("sha512").update(plain, "utf8").digest("base64");
}

export function verifyResponseHash(
  fields: Record<string, string>,
  storeKey: string,
): boolean {
  const expected = buildResponseHashVer2(fields, storeKey);
  const received = fields.hash ?? "";
  if (expected.length !== received.length) return false;
  // Constant-time compare to avoid leaking length / position info via
  // timing. Both are base64 SHA-512 → 88 chars, so the length guard
  // above already short-circuits common mismatches.
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ received.charCodeAt(i);
  }
  return mismatch === 0;
}
