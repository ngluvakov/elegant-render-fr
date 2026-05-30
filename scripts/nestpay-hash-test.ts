/**
 * nestpay-hash-test.ts — Sanity tests for the Nestpay request/response hash.
 *
 * Run: npx tsx scripts/nestpay-hash-test.ts
 *
 * Exercises:
 *   1. Request hash plaintext matches the BIB positional template.
 *   2. Hosted payment form carries only the allowed request hash fields.
 *   3. Response verification still accepts bank HASHPARAMSVAL payloads.
 *   4. Tamper / wrong storeKey rejection.
 *   5. Public redirect base prefers AUTH_URL over deployment/bank origins.
 *
 * No DB or env required — the helpers are pure.
 */
import { createHash } from "node:crypto";
import { buildHostedPaymentForm } from "../src/lib/nestpay/client";
import { __setNestpayConfigForTests } from "../src/lib/nestpay/config";
import {
  buildHashWithParams,
  buildRequestHashPlaintext,
  buildRequestHashVer2,
  verifyResponseHash,
} from "../src/lib/nestpay/hash";
import { getNestpayPublicBaseUrl } from "../src/lib/nestpay/url";

let failures = 0;

function assert(condition: boolean, label: string) {
  if (!condition) {
    failures += 1;
    console.error(`  ✗ ${label}`);
  } else {
    console.log(`  ✓ ${label}`);
  }
}

function sha512Base64(value: string): string {
  return createHash("sha512").update(value, "utf8").digest("base64");
}

function caseRequestHash() {
  console.log("\n[case] buildRequestHashVer2 — BIB positional request template");
  const input = {
    clientId: "13IN004509",
    oid: "ER-20260529-024L-LYXCNZ",
    amount: "19924.00",
    okUrl: "https://elegantrender.rs/api/nestpay/return",
    failUrl: "https://elegantrender.rs/api/nestpay/return",
    tranType: "Auth",
    rnd: "8d5a3b4f6e2c1a9b0d4f",
    currency: "941",
    storeKey: "TEST-store-key-xyz",
  };
  const expectedPlaintext =
    "13IN004509|ER-20260529-024L-LYXCNZ|19924.00|https://elegantrender.rs/api/nestpay/return|https://elegantrender.rs/api/nestpay/return|Auth||8d5a3b4f6e2c1a9b0d4f||||941|TEST-store-key-xyz";
  assert(
    buildRequestHashPlaintext(input) === expectedPlaintext,
    "request plaintext has the exact BIB field order and empty slots",
  );
  assert(
    buildRequestHashVer2(input) === sha512Base64(expectedPlaintext),
    "request hash is SHA-512 base64 of the positional plaintext",
  );
}

function caseHostedPaymentForm() {
  console.log("\n[case] buildHostedPaymentForm — allowed outgoing POST fields");
  __setNestpayConfigForTests({
    mode: "test",
    clientId: "13IN004509",
    storeKey: "TEST-store-key-xyz",
    baseUrl: "https://testsecurepay.eway2pay.com/fim/est3Dgate",
    queryUrl: "https://testsecurepay.eway2pay.com/fim/api",
    queryUsername: "",
    queryPassword: "",
    tranType: "Auth",
    oidPrefix: "ER-",
  });

  const form = buildHostedPaymentForm({
    oid: "ER-20260529-024L-LYXCNZ",
    amountRsdCents: 1_992_400,
    returnUrl: "https://elegantrender.rs/api/nestpay/return",
    buyerEmail: "buyer@example.com",
    buyerName: "Test Buyer",
  });

  assert(
    form.url === "https://testsecurepay.eway2pay.com/fim/est3Dgate",
    "form posts to configured Nestpay HPP URL",
  );
  assert(form.fields.hashAlgorithm === "ver2", "hashAlgorithm=ver2");
  assert(form.fields.currency === "941", "currency=941");
  assert(form.fields.storetype === "3d_pay_hosting", "storetype=3d_pay_hosting");
  assert(typeof form.fields.hash === "string" && form.fields.hash.length === 88, "hash exists and is SHA-512 base64 length");
  assert(!("StoreKey" in form.fields), "StoreKey is not sent");
  assert(!("CallbackURL" in form.fields), "CallbackURL is not sent");
  assert(!("instalment" in form.fields), "instalment is not sent");
  assert(!("TAKSIT" in form.fields), "TAKSIT is omitted for one-time payments");
  assert(!("HASHPARAMS" in form.fields), "HASHPARAMS is not sent");
  assert(!("HASHPARAMSVAL" in form.fields), "HASHPARAMSVAL is not sent");

  const expectedHash = buildRequestHashVer2({
    clientId: "13IN004509",
    oid: "ER-20260529-024L-LYXCNZ",
    amount: "19924.00",
    okUrl: "https://elegantrender.rs/api/nestpay/return",
    failUrl: "https://elegantrender.rs/api/nestpay/return",
    tranType: "Auth",
    rnd: form.fields.rnd,
    currency: "941",
    storeKey: "TEST-store-key-xyz",
  });
  assert(form.fields.hash === expectedHash, "form hash signs the positional request template");

  __setNestpayConfigForTests(null);
}

function caseHostedPaymentInstallments() {
  console.log("\n[case] buildHostedPaymentForm — TAKSIT is an unsigned form field");
  __setNestpayConfigForTests({
    mode: "test",
    clientId: "13IN004509",
    storeKey: "TEST-store-key-xyz",
    baseUrl: "https://testsecurepay.eway2pay.com/fim/est3Dgate",
    queryUrl: "https://testsecurepay.eway2pay.com/fim/api",
    queryUsername: "",
    queryPassword: "",
    tranType: "Auth",
    oidPrefix: "ER-",
  });

  const base = {
    oid: "ER-20260530-TAKSIT-000001",
    amountRsdCents: 1_992_400,
    returnUrl: "https://elegantrender.rs/api/nestpay/return",
  };
  const oneTime = buildHostedPaymentForm(base);
  const threeRates = buildHostedPaymentForm({ ...base, taksit: 3 });

  assert(threeRates.fields.TAKSIT === "3", "TAKSIT=3 is included for instalments");
  assert(!("TAKSIT" in oneTime.fields), "TAKSIT is omitted when taksit=1/empty");

  const expectedHash = buildRequestHashVer2({
    clientId: "13IN004509",
    oid: base.oid,
    amount: "19924.00",
    okUrl: base.returnUrl,
    failUrl: base.returnUrl,
    tranType: "Auth",
    rnd: threeRates.fields.rnd,
    currency: "941",
    storeKey: "TEST-store-key-xyz",
  });
  assert(
    threeRates.fields.hash === expectedHash,
    "TAKSIT does not participate in the request hash",
  );

  __setNestpayConfigForTests(null);
}

function caseBuildHash() {
  console.log("\n[case] buildHashWithParams — response HASHPARAMSVAL helper");
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

function casePublicBaseUrl() {
  console.log("\n[case] getNestpayPublicBaseUrl — AUTH_URL wins");
  assert(
    getNestpayPublicBaseUrl({
      AUTH_URL: "https://elegantrender.rs",
      VERCEL_ENV: "preview",
      VERCEL_URL: "preview-host.vercel.app",
    }) === "https://elegantrender.rs",
    "AUTH_URL is used even when another deployment host is present",
  );
  assert(
    getNestpayPublicBaseUrl({
      VERCEL_ENV: "preview",
      VERCEL_URL: "preview-host.vercel.app",
    }) === "https://preview-host.vercel.app",
    "preview URL is fallback when AUTH_URL is absent",
  );
}

caseRequestHash();
caseHostedPaymentForm();
caseHostedPaymentInstallments();
caseBuildHash();
caseEscape();
caseVerifyRoundtrip();
caseVerifyLowercaseHash();
caseVerifyTamper();
caseVerifyMissingPieces();
casePublicBaseUrl();

console.log(
  `\n${failures === 0 ? "All hash sanity checks passed." : `FAILED: ${failures} check(s) failed.`}`,
);
process.exit(failures === 0 ? 0 : 1);
