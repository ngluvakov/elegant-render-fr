/**
 * client.ts — Builds the Nestpay HPP request form.
 *
 * `buildHostedPaymentForm` returns the `{ url, fields }` that the
 * client-side auto-submit form POSTs to the bank. The bank then
 * renders its hosted card-entry page, runs 3DS, and POSTs the result
 * back to our okUrl/failUrl. The merchant secret (StoreKey) is used
 * to compute the request hash; it is NOT included in the POST body.
 *
 * Hash format is BIB's positional ver2 request template:
 * clientid|oid|amount|okUrl|failUrl|trantype||rnd||||currency|StoreKey.
 * StoreKey is appended only inside the SHA-512 plaintext and is never
 * sent to the bank as a form field.
 *
 * Both `okUrl` and `failUrl` point at the same internal endpoint —
 * `/api/nestpay/return` — because the bank's `Response` field is the
 * sole authority on outcome and we want a single hash-verified entry
 * point rather than two divergent flows.
 *
 * Used by: server/actions/nestpay
 */
import { buildRequestHashVer2 } from "./hash";
import { mintRnd } from "./oid";
import { getNestpayConfig } from "./config";
import {
  nestpayTaksitField,
  normalizeNestpayInstallmentCount,
  type NestpayInstallmentCount,
} from "./installments";

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
  taksit?: NestpayInstallmentCount | number | null;
  allowInstallments?: boolean;
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
  const installmentCount = input.allowInstallments
    ? normalizeNestpayInstallmentCount(input.taksit)
    : 1;

  const formData: Record<string, string> = {
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
  };

  const hash = buildRequestHashVer2({
    clientId: config.clientId,
    oid: input.oid,
    amount,
    okUrl: input.returnUrl,
    failUrl: input.returnUrl,
    tranType: config.tranType,
    rnd,
    currency: NESTPAY_CURRENCY_RSD,
    storeKey: config.storeKey,
  });

  const fields: Record<string, string> = { ...formData, hash };

  const taksit = nestpayTaksitField(installmentCount);
  if (taksit) fields.TAKSIT = taksit;
  if (input.buyerEmail) fields.email = input.buyerEmail;
  if (input.buyerName) fields.BillToName = input.buyerName;

  return {
    url: config.baseUrl,
    fields,
  };
}
