/**
 * client.ts — Builds the Nestpay HPP request form.
 *
 * `buildHostedPaymentForm` returns the `{ url, fields }` that the
 * client-side auto-submit form POSTs to the bank. The bank then
 * renders its hosted card-entry page, runs 3DS, and POSTs the result
 * back to our okUrl/failUrl. The merchant secret (StoreKey) is used
 * to compute the request hash; it is NOT included in the POST body.
 *
 * Hash format is HASHPARAMS-based ver2 — we declare which params we
 * signed via the HASHPARAMS form field, the pipe-joined escaped
 * values via HASHPARAMSVAL, and the SHA-512 hash via `hash`. The
 * bank's verifier reads HASHPARAMSVAL and recomputes with its stored
 * StoreKey, so as long as both sides escape the same way the request
 * authenticates.
 *
 * Both `okUrl` and `failUrl` point at the same internal endpoint —
 * `/api/nestpay/return` — because the bank's `Response` field is the
 * sole authority on outcome and we want a single hash-verified entry
 * point rather than two divergent flows.
 *
 * Used by: server/actions/nestpay
 */
import { buildHashWithParams } from "./hash";
import { mintRnd } from "./oid";
import { getNestpayConfig } from "./config";

const NESTPAY_CURRENCY_RSD = "941";
const NESTPAY_STORE_TYPE = "3d_pay_hosting";
const NESTPAY_HASH_ALGO = "ver2";
const NESTPAY_ENCODING = "utf-8";

export type HostedPaymentInput = {
  oid: string;
  amountRsdCents: number;
  lang?: "sr" | "en";
  buyerEmail?: string;
  buyerName?: string;
  returnUrl: string;
};

export type HostedPaymentForm = {
  url: string;
  fields: Record<string, string>;
};

function formatRsdAmount(amountRsdCents: number): string {
  // Nestpay expects decimal RSD with two decimals (paras) regardless of
  // whether the gross is an integer dinar — "29300.00" not "29300".
  const dinars = amountRsdCents / 100;
  return dinars.toFixed(2);
}

export function buildHostedPaymentForm(input: HostedPaymentInput): HostedPaymentForm {
  const config = getNestpayConfig();
  const rnd = mintRnd();
  const amount = formatRsdAmount(input.amountRsdCents);

  // The set of params signed via HASHPARAMS. Order matters — the bank
  // verifies by reading HASHPARAMSVAL in the same order. We include
  // every param the bank meaningfully cares about for routing and
  // amount, in a deterministic order.
  const signedParams = [
    { name: "clientid", value: config.clientId },
    { name: "storetype", value: NESTPAY_STORE_TYPE },
    { name: "hashAlgorithm", value: NESTPAY_HASH_ALGO },
    { name: "trantype", value: config.tranType },
    { name: "amount", value: amount },
    { name: "currency", value: NESTPAY_CURRENCY_RSD },
    { name: "oid", value: input.oid },
    { name: "okUrl", value: input.returnUrl },
    { name: "failUrl", value: input.returnUrl },
    { name: "lang", value: input.lang ?? "sr" },
    { name: "rnd", value: rnd },
    { name: "encoding", value: NESTPAY_ENCODING },
  ];

  const { hash, hashParams, hashParamsVal } = buildHashWithParams(
    signedParams,
    config.storeKey,
  );

  const fields: Record<string, string> = {
    clientid: config.clientId,
    storetype: NESTPAY_STORE_TYPE,
    hashAlgorithm: NESTPAY_HASH_ALGO,
    trantype: config.tranType,
    amount,
    currency: NESTPAY_CURRENCY_RSD,
    oid: input.oid,
    okUrl: input.returnUrl,
    failUrl: input.returnUrl,
    lang: input.lang ?? "sr",
    rnd,
    encoding: NESTPAY_ENCODING,
    HASHPARAMS: hashParams,
    HASHPARAMSVAL: hashParamsVal,
    hash,
  };

  if (input.buyerEmail) fields.email = input.buyerEmail;
  if (input.buyerName) fields.BillToName = input.buyerName;

  return {
    url: config.baseUrl,
    fields,
  };
}
