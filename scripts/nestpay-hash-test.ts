/**
 * nestpay-hash-test.ts — Sanity tests for the Nestpay hash helpers.
 *
 * Run: npx tsx scripts/nestpay-hash-test.ts
 *
 * Exercises:
 *   1. Request-side hash determinism + length (SHA-512 base64 = 88 chars).
 *   2. Response-side alphabetical sort, escape, and verify round-trip.
 *   3. Response hash mismatch is rejected.
 *
 * No DB or env required — the helpers are pure.
 */
import {
  buildRequestHashVer2,
  buildResponseHashVer2,
  verifyResponseHash,
} from "../src/lib/nestpay/hash";

let failures = 0;

function assert(condition: boolean, label: string) {
  if (!condition) {
    failures += 1;
    console.error(`  ✗ ${label}`);
  } else {
    console.log(`  ✓ ${label}`);
  }
}

function caseRequestHash() {
  console.log("\n[case] request hash — ver2 positional");
  const hash = buildRequestHashVer2({
    clientId: "13IN999999",
    oid: "ER-1001-AB12CD",
    amount: "29300.00",
    okUrl: "https://elegantrender.rs/api/nestpay/return",
    failUrl: "https://elegantrender.rs/api/nestpay/return",
    tranType: "Auth",
    rnd: "8d5a3b4f6e2c1a9b0d4f",
    currency: "941",
    storeKey: "TEST-store-key-xyz",
  });
  assert(typeof hash === "string", "returns a string");
  assert(hash.length === 88, `length === 88 (got ${hash.length})`);
  assert(/^[A-Za-z0-9+/=]+$/.test(hash), "base64 character set");

  const hash2 = buildRequestHashVer2({
    clientId: "13IN999999",
    oid: "ER-1001-AB12CD",
    amount: "29300.00",
    okUrl: "https://elegantrender.rs/api/nestpay/return",
    failUrl: "https://elegantrender.rs/api/nestpay/return",
    tranType: "Auth",
    rnd: "8d5a3b4f6e2c1a9b0d4f",
    currency: "941",
    storeKey: "TEST-store-key-xyz",
  });
  assert(hash === hash2, "deterministic for identical inputs");

  const hash3 = buildRequestHashVer2({
    clientId: "13IN999999",
    oid: "ER-1001-AB12CD",
    amount: "29300.00",
    okUrl: "https://elegantrender.rs/api/nestpay/return",
    failUrl: "https://elegantrender.rs/api/nestpay/return",
    tranType: "Auth",
    rnd: "different-rnd-value-here-1234",
    currency: "941",
    storeKey: "TEST-store-key-xyz",
  });
  assert(hash !== hash3, "differs when rnd changes");
}

function caseResponseHashRoundtrip() {
  console.log("\n[case] response hash — verify round-trip");
  const storeKey = "TEST-store-key-xyz";
  const fields: Record<string, string> = {
    clientid: "13IN999999",
    oid: "ER-1001-AB12CD",
    amount: "29300.00",
    Response: "Approved",
    AuthCode: "ABC123",
    TransId: "20260529001",
    ProcReturnCode: "00",
    mdStatus: "1",
    HostRefNum: "999000111222",
    EXTRA_TRXDATE: "20260529120304",
    encoding: "utf-8",
  };
  const hash = buildResponseHashVer2(fields, storeKey);
  assert(hash.length === 88, `length === 88 (got ${hash.length})`);
  const verified = verifyResponseHash({ ...fields, hash }, storeKey);
  assert(verified, "verifyResponseHash returns true for matching hash");
}

function caseResponseHashTamper() {
  console.log("\n[case] response hash — tamper detection");
  const storeKey = "TEST-store-key-xyz";
  const fields: Record<string, string> = {
    clientid: "13IN999999",
    oid: "ER-1001-AB12CD",
    amount: "29300.00",
    Response: "Approved",
    AuthCode: "ABC123",
    TransId: "20260529001",
    ProcReturnCode: "00",
    mdStatus: "1",
    HostRefNum: "999000111222",
    EXTRA_TRXDATE: "20260529120304",
    encoding: "utf-8",
  };
  const hash = buildResponseHashVer2(fields, storeKey);
  // Hostile actor flips the amount but doesn't have the storeKey to
  // recompute the hash.
  const tampered = { ...fields, hash, amount: "1.00" };
  const verified = verifyResponseHash(tampered, storeKey);
  assert(!verified, "verifyResponseHash returns false when a field is changed");

  // Wrong storeKey on our side (env misconfigured) also fails.
  const wrongKey = verifyResponseHash({ ...fields, hash }, "wrong-store-key");
  assert(!wrongKey, "verifyResponseHash returns false with the wrong storeKey");
}

function caseResponseHashEscape() {
  console.log("\n[case] response hash — escapes pipe and backslash");
  const storeKey = "key|with|pipes";
  const fields: Record<string, string> = {
    description: 'value with | pipe and \\ backslash',
    oid: "ER-1001",
    encoding: "utf-8",
  };
  const hash = buildResponseHashVer2(fields, storeKey);
  assert(hash.length === 88, "still 88 chars after escape");
  const verified = verifyResponseHash({ ...fields, hash }, storeKey);
  assert(verified, "round-trips when both sides apply the same escape");
}

caseRequestHash();
caseResponseHashRoundtrip();
caseResponseHashTamper();
caseResponseHashEscape();

console.log(`\n${failures === 0 ? "All hash sanity checks passed." : `FAILED: ${failures} check(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);
