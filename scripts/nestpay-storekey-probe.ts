/**
 * nestpay-storekey-probe.ts — Locally test a candidate StoreKey
 * against the bank's HASH from a debug response.
 *
 * Usage:
 *   npx tsx scripts/nestpay-storekey-probe.ts \
 *     "<storeKey-candidate>" \
 *     "<HASH-from-bank>" \
 *     "<HASHPARAMSVAL-from-bank>"
 *
 * Example using values from the latest debug JSON:
 *   npx tsx scripts/nestpay-storekey-probe.ts \
 *     "your-store-key" \
 *     "Z/WhsHLhqbSIho+rnXiSlYrgekDBwDKHA7389Bmxse4rtDVZ4MzqTSKfxO3W+tynM/Vp+BFwEZN9hTeAc0kveg==" \
 *     "13IN004509|ER-20260529-CIUX-23NAFG|9cdaeavLXr50GqmpDPJ1"
 *
 * Tries five known Nestpay/Asseco variants of the SHA-512 plaintext
 * and reports which (if any) matches the bank's HASH. If at least
 * one matches, the storeKey is correct and we now know which
 * variant the bank uses. If none match, the storeKey is wrong —
 * recopy from Merchant Center → Administration → Store Key.
 */
import { createHash } from "node:crypto";

function escape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
}

function sha512Base64(text: string): string {
  return createHash("sha512").update(text, "utf8").digest("base64");
}

const [, , storeKey, expectedHash, hashParamsVal] = process.argv;
if (!storeKey || !expectedHash || !hashParamsVal) {
  console.error(
    `Usage:\n  npx tsx scripts/nestpay-storekey-probe.ts "<storeKey>" "<HASH>" "<HASHPARAMSVAL>"\n`,
  );
  process.exit(2);
}

const variants: Array<{ name: string; plaintext: string }> = [
  {
    name: "V1  paramsval + '|' + escape(storeKey)   (current production)",
    plaintext: `${hashParamsVal}|${escape(storeKey)}`,
  },
  {
    name: "V2  paramsval + '|' + storeKey            (no storeKey escape)",
    plaintext: `${hashParamsVal}|${storeKey}`,
  },
  {
    name: "V3  paramsval + escape(storeKey)          (no separator, escaped)",
    plaintext: `${hashParamsVal}${escape(storeKey)}`,
  },
  {
    name: "V4  paramsval + storeKey                  (no separator, no escape)",
    plaintext: `${hashParamsVal}${storeKey}`,
  },
  {
    name: "V5  paramsval + '|' + storeKey + '|'      (trailing pipe)",
    plaintext: `${hashParamsVal}|${storeKey}|`,
  },
];

console.log("");
console.log(`Expected HASH      : ${expectedHash}`);
console.log(`HASHPARAMSVAL      : ${hashParamsVal}`);
console.log(
  `StoreKey           : length=${storeKey.length}, fingerprint=${storeKey.slice(0, 2)}…${storeKey.slice(-2)}`,
);
console.log("");

let anyMatch = false;
for (const variant of variants) {
  const computed = sha512Base64(variant.plaintext);
  const ok = computed === expectedHash;
  console.log(`${ok ? "✓ MATCH" : "  no   "}  ${variant.name}`);
  console.log(`           computed: ${computed}`);
  if (ok) anyMatch = true;
}

console.log("");
if (anyMatch) {
  console.log(
    "✓ A variant matched. Your storeKey is CORRECT. Update production to use that variant if needed.",
  );
  process.exit(0);
}
console.log(
  "✗ No variant matched. Your storeKey is WRONG (or the bank uses an unsupported variant).",
);
console.log(
  "  → Recheck Merchant Center → Administration → Store Key.",
);
console.log(
  "  → Make sure you copied the TEST storeKey (not LIVE) if your gateway URL is testsecurepay.eway2pay.com.",
);
process.exit(1);
