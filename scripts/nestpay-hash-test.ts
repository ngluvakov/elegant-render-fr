/**
 * nestpay-hash-test.ts — Sanity tests for the Nestpay HASHPARAMS hash.
 *
 * Run: npx tsx scripts/nestpay-hash-test.ts
 *
 * Exercises:
 *   1. buildHashWithParams determinism + length (SHA-512 base64 = 88).
 *   2. HASHPARAMSVAL is pipe-joined and escaped.
 *   3. Verification round-trip via HASHPARAMSVAL field.
 *   4. Tamper / wrong storeKey rejection.
 *   5. Case-insensitive HASH field lookup (bank uses uppercase).
 *
 * No DB or env required — the helpers are pure.
 */
import {
  buildHashWithParams,
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

function caseBuildHash() {
  console.log("\n[case] buildHashWithParams — happy path");
  const storeKey = "TEST-store-key-xyz";
  const params = [
    { name: "clientid", value: "13IN999999" },
    { name: "oid", value: "ER-1001-AB12CD" },
    { name: "amount", value: "29300.00" },
    { name: "okUrl", value: "https://elegantrender.rs/api/nestpay/return" },
    { name: "failUrl", value: "https://elegantrender.rs/api/nestpay/return" },
    { name: "trantype", value: "Auth" },
    { name: "rnd", value: "8d5a3b4f6e2c1a9b0d4f" },
    { name: "currency", value: "941" },
  ];
  const { hash, hashParams, hashParamsVal } = buildHashWithParams(
    params,
    storeKey,
  );
  assert(typeof hash === "string", "hash is a string");
  assert(hash.length === 88, `hash length === 88 (got ${hash.length})`);
  assert(/^[A-Za-z0-9+/=]+$/.test(hash), "hash is base64");
  assert(
    hashParams === "clientid|oid|amount|okUrl|failUrl|trantype|rnd|currency",
    "HASHPARAMS lists names in order",
  );
  assert(
    hashParamsVal ===
      "13IN999999|ER-1001-AB12CD|29300.00|https://elegantrender.rs/api/nestpay/return|https://elegantrender.rs/api/nestpay/return|Auth|8d5a3b4f6e2c1a9b0d4f|941",
    "HASHPARAMSVAL joins values in order",
  );

  const result2 = buildHashWithParams(params, storeKey);
  assert(result2.hash === hash, "deterministic for identical inputs");

  const result3 = buildHashWithParams(
    [...params, { name: "extra", value: "newvalue" }],
    storeKey,
  );
  assert(result3.hash !== hash, "differs when a param is added");
}

function caseEscape() {
  console.log("\n[case] buildHashWithParams — pipe and backslash escape");
  const { hashParamsVal } = buildHashWithParams(
    [{ name: "description", value: "value with | pipe and \\ backslash" }],
    "key",
  );
  assert(
    hashParamsVal === "value with \\| pipe and \\\\ backslash",
    "values are pipe and backslash escaped",
  );
}

function caseVerifyRoundtrip() {
  console.log("\n[case] verifyResponseHash — round-trip");
  const storeKey = "TEST-store-key-xyz";
  const params = [
    { name: "clientid", value: "13IN999999" },
    { name: "oid", value: "ER-1001-AB12CD" },
    { name: "rnd", value: "abc123" },
  ];
  const { hash, hashParams, hashParamsVal } = buildHashWithParams(
    params,
    storeKey,
  );
  // Bank uses uppercase HASH; we look up case-insensitively.
  const responseFields = {
    HASH: hash,
    HASHPARAMS: hashParams,
    HASHPARAMSVAL: hashParamsVal,
    Response: "Approved",
  };
  const result = verifyResponseHash(responseFields, storeKey);
  assert(result.ok, `verification ok (reason: ${result.reason ?? "n/a"})`);
}

function caseVerifyLowercaseHash() {
  console.log("\n[case] verifyResponseHash — lowercase hash field also works");
  const storeKey = "TEST-store-key-xyz";
  const { hash, hashParams, hashParamsVal } = buildHashWithParams(
    [{ name: "clientid", value: "X" }],
    storeKey,
  );
  const result = verifyResponseHash(
    {
      hash, // lowercase
      HASHPARAMS: hashParams,
      HASHPARAMSVAL: hashParamsVal,
    },
    storeKey,
  );
  assert(result.ok, "lowercase 'hash' field also verifies");
}

function caseVerifyTamper() {
  console.log("\n[case] verifyResponseHash — tamper detection");
  const storeKey = "TEST-store-key-xyz";
  const { hash, hashParams, hashParamsVal } = buildHashWithParams(
    [{ name: "clientid", value: "X" }],
    storeKey,
  );
  const tampered = verifyResponseHash(
    {
      HASH: hash,
      HASHPARAMS: hashParams,
      HASHPARAMSVAL: hashParamsVal + "|injected",
    },
    storeKey,
  );
  assert(!tampered.ok, "tampered HASHPARAMSVAL fails");
  assert(tampered.reason === "mismatch", "reason is mismatch");

  const wrongKey = verifyResponseHash(
    {
      HASH: hash,
      HASHPARAMS: hashParams,
      HASHPARAMSVAL: hashParamsVal,
    },
    "wrong-store-key",
  );
  assert(!wrongKey.ok, "wrong storeKey fails");
}

function caseVerifyMissingPieces() {
  console.log("\n[case] verifyResponseHash — missing fields");
  const noHash = verifyResponseHash({ HASHPARAMSVAL: "x|y" }, "k");
  assert(!noHash.ok && noHash.reason === "no-hash", "missing HASH → no-hash");

  const noVal = verifyResponseHash({ HASH: "abc" }, "k");
  assert(
    !noVal.ok && noVal.reason === "no-hashparamsval",
    "missing HASHPARAMSVAL → no-hashparamsval",
  );
}

caseBuildHash();
caseEscape();
caseVerifyRoundtrip();
caseVerifyLowercaseHash();
caseVerifyTamper();
caseVerifyMissingPieces();

console.log(
  `\n${failures === 0 ? "All hash sanity checks passed." : `FAILED: ${failures} check(s) failed.`}`,
);
process.exit(failures === 0 ? 0 : 1);
