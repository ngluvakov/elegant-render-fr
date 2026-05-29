/**
 * hash.ts — Nestpay HASH ver2 builder and verifier (HASHPARAMS form).
 *
 * Modern Asseco/BIB Nestpay ver2 uses an explicit HASHPARAMS layout
 * instead of the legacy positional template. We declare which params
 * we signed (HASHPARAMS), the pipe-joined escaped values (HASHPARAMSVAL),
 * and the hash:
 *
 *   HASH = base64( SHA-512( HASHPARAMSVAL + "|" + escape(StoreKey) ) )
 *
 * The bank's verifier reads HASHPARAMSVAL, appends its stored StoreKey,
 * SHA-512s, and compares. On error responses the bank echoes its own
 * HASH + HASHPARAMS + HASHPARAMSVAL so we can verify the response with
 * the exact same algorithm — no sort heuristics needed.
 *
 * Escape rule (Asseco spec): backslash first, then pipe.
 *   `\` → `\\`
 *   `|` → `\|`
 *
 * StoreKey escapes the same way (it's the merchant secret and rarely
 * contains these characters, but the spec says to escape it).
 *
 * Used by: client.ts (request side) and /api/nestpay/return route
 * (response side).
 */
import { createHash } from "node:crypto";

export type NestpayHashParam = {
  name: string;
  value: string;
};

export type NestpayHashOutput = {
  hash: string;
  hashParams: string;
  hashParamsVal: string;
};

function escapeValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
}

export function buildHashWithParams(
  params: NestpayHashParam[],
  storeKey: string,
): NestpayHashOutput {
  const hashParams = params.map((p) => p.name).join("|");
  const escapedValues = params.map((p) => escapeValue(p.value ?? ""));
  const hashParamsVal = escapedValues.join("|");
  const plaintext = `${hashParamsVal}|${escapeValue(storeKey)}`;
  const hash = createHash("sha512").update(plaintext, "utf8").digest("base64");
  return { hash, hashParams, hashParamsVal };
}

// Case-insensitive lookup — bank fields are mixed case (HASH vs hash,
// AuthCode vs authCode). Returns the first matching key's value.
function lookupCI(
  fields: Record<string, string>,
  name: string,
): string | undefined {
  if (fields[name] !== undefined) return fields[name];
  const lower = name.toLowerCase();
  for (const key of Object.keys(fields)) {
    if (key.toLowerCase() === lower) return fields[key];
  }
  return undefined;
}

export type VerifyResponseHashResult = {
  ok: boolean;
  // Why it failed — for diagnostics. "no-hash" = bank didn't send HASH
  // at all; "no-hashparamsval" = bank used a non-HASHPARAMS format
  // we don't know how to verify; "mismatch" = computed != received.
  reason?: "no-hash" | "no-hashparamsval" | "mismatch";
  receivedHash?: string;
  computedHash?: string;
};

export function verifyResponseHash(
  fields: Record<string, string>,
  storeKey: string,
): VerifyResponseHashResult {
  const receivedHash = lookupCI(fields, "HASH") ?? lookupCI(fields, "hash");
  if (!receivedHash) {
    return { ok: false, reason: "no-hash" };
  }

  const hashParamsVal = lookupCI(fields, "HASHPARAMSVAL");
  if (hashParamsVal === undefined) {
    return { ok: false, reason: "no-hashparamsval", receivedHash };
  }

  const plaintext = `${hashParamsVal}|${escapeValue(storeKey)}`;
  const computed = createHash("sha512")
    .update(plaintext, "utf8")
    .digest("base64");

  if (computed.length !== receivedHash.length) {
    return { ok: false, reason: "mismatch", receivedHash, computedHash: computed };
  }
  let mismatch = 0;
  for (let i = 0; i < computed.length; i++) {
    mismatch |= computed.charCodeAt(i) ^ receivedHash.charCodeAt(i);
  }
  if (mismatch !== 0) {
    return { ok: false, reason: "mismatch", receivedHash, computedHash: computed };
  }
  return { ok: true, receivedHash, computedHash: computed };
}
