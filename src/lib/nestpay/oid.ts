/**
 * oid.ts — Nestpay order id minter.
 *
 * The bank-facing `oid` is the merchant's primary key for a payment
 * attempt. Banca Intesa rejects a duplicate oid on retry with a
 * "duplicate order" error, so the customer can't simply re-submit
 * after a decline. We mint `<prefix><orderNumber>-<rnd>` per attempt
 * — the orderNumber stays human-readable in support tickets and the
 * 6-char suffix makes each attempt unique.
 *
 * Forbidden characters per spec: `\` and `|` (they'd corrupt the
 * pipe-separated hash plaintext). The minter only uses URL-safe
 * base32-ish alphabet, so this is structural rather than runtime
 * validation — but we still strip defensively.
 *
 * Used by: server/actions/nestpay
 */
import { randomBytes } from "node:crypto";

const SAFE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // crockford-ish, no 0/O/1/I

function randomSuffix(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += SAFE_ALPHABET[bytes[i] % SAFE_ALPHABET.length];
  }
  return out;
}

export function mintOid(orderNumber: string, prefix: string): string {
  const cleanNumber = orderNumber.replace(/[\\|]/g, "");
  const cleanPrefix = prefix.replace(/[\\|]/g, "");
  const candidate = `${cleanPrefix}${cleanNumber}-${randomSuffix(6)}`;
  // Bank field length cap for oid is 64. Our pattern lands well under,
  // but truncate defensively.
  return candidate.slice(0, 60);
}

// Bank also forbids `\` and `|` inside the `rnd` parameter for the
// same reason. Returns 20 hex chars (10 bytes).
export function mintRnd(): string {
  return randomBytes(10).toString("hex");
}
