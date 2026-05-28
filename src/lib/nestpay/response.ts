/**
 * response.ts — Typed parser for the Nestpay return POST payload.
 *
 * After the customer finishes (or fails) the 3DS challenge, the bank
 * POSTs the result back to our okUrl/failUrl with form-encoded fields.
 * The full set of possible keys is documented in the 3D Pay Hosting
 * PDF (appendix A); we parse the ones the bank's EPM standard 2.7
 * requires us to present back to the customer.
 *
 * Used by: /api/nestpay/return route handler, status-query.ts
 */

export type NestpayReturnPayload = {
  oid: string;
  response: string; // "Approved" | "Declined" | "Error" | ...
  procReturnCode: string; // "00" = success, anything else = a bank reason code
  authCode: string;
  transId: string;
  mdStatus: string;
  hostRefNum: string;
  extraTrxDate: string; // YYYYMMDD HH:mm:ss as bank sends it
  amount: string;
  currency: string;
  errMsg: string;
  raw: Record<string, string>;
};

function pick(fields: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    if (fields[key]) return fields[key];
    const lower = key.toLowerCase();
    if (fields[lower]) return fields[lower];
  }
  return "";
}

export function parseNestpayReturn(
  fields: Record<string, string>,
): NestpayReturnPayload {
  return {
    oid: pick(fields, "oid"),
    response: pick(fields, "Response", "response"),
    procReturnCode: pick(fields, "ProcReturnCode", "procReturnCode"),
    authCode: pick(fields, "AuthCode", "authCode"),
    transId: pick(fields, "TransId", "transId"),
    mdStatus: pick(fields, "mdStatus", "MdStatus"),
    hostRefNum: pick(fields, "HostRefNum", "hostRefNum"),
    extraTrxDate: pick(
      fields,
      "EXTRA_TRXDATE",
      "EXTRA.TRXDATE",
      "extra_trxdate",
      "TRXDATE",
    ),
    amount: pick(fields, "amount"),
    currency: pick(fields, "currency"),
    errMsg: pick(fields, "ErrMsg", "mdErrorMsg", "errMsg"),
    raw: fields,
  };
}

// Bank's "approved" outcome per ch. 6 of the integration manual:
// - Response is "Approved" (case-sensitive)
// - ProcReturnCode is "00"
// - mdStatus is 1, 2, 3 or 4 (full or attempted 3DS auth completed)
//
// Anything else — explicit decline, error, missing fields — is treated
// as failed and routed to /poruci/neuspeh.
const APPROVED_MD_STATUS = new Set(["1", "2", "3", "4"]);

export function isApprovedResponse(payload: NestpayReturnPayload): boolean {
  return (
    payload.response === "Approved" &&
    payload.procReturnCode === "00" &&
    APPROVED_MD_STATUS.has(payload.mdStatus)
  );
}

// Parse the bank's "YYYYMMDD HH:mm:ss" or "YYYYMMDDHHMMSS" timestamp
// into a Date. The bank's clock is in Belgrade. We treat it as local
// time and persist as DateTime; for display the customer sees their
// browser locale-formatted value.
export function parseNestpayTrxDate(raw: string): Date | null {
  if (!raw) return null;
  const compact = raw.replace(/[\s./:-]/g, "");
  if (compact.length < 14) return null;
  const year = Number(compact.slice(0, 4));
  const month = Number(compact.slice(4, 6)) - 1;
  const day = Number(compact.slice(6, 8));
  const hour = Number(compact.slice(8, 10));
  const minute = Number(compact.slice(10, 12));
  const second = Number(compact.slice(12, 14));
  const ts = new Date(year, month, day, hour, minute, second);
  return Number.isNaN(ts.getTime()) ? null : ts;
}
