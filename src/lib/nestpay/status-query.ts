/**
 * status-query.ts — Order Status Query (CC5 XML API).
 *
 * Recovery path for when the okUrl/failUrl POST never arrives — the
 * customer closed the tab, lost their network, or the bank's response
 * timed out. The reconciler cron looks up the recorded oid via this
 * API and either confirms or declines the order based on what the
 * bank actually saw. Spec: ISPC_Nestpay_Merchant_Integration_API_
 * Manual.pdf, ch. 1.2 (overview) and ch. 2.3 (Order Status Query).
 *
 * Auth uses NESTPAY_QUERY_USERNAME / NESTPAY_QUERY_PASSWORD which the
 * bank issues separately from the HPP storeKey. The request goes to
 * NESTPAY_QUERY_URL (e.g. https://testsecurepay.eway2pay.com/fim/api).
 *
 * Used by: server/finance/reconcile-nestpay
 */
import { getNestpayConfig } from "./config";
import { parseNestpayTrxDate } from "./response";

export type NestpayQueryResult = {
  found: boolean;
  response: string;
  procReturnCode: string;
  authCode: string;
  transId: string;
  mdStatus: string;
  hostRefNum: string;
  extraTrxDate: Date | null;
  errMsg: string;
  rawXml: string;
};

function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildQueryEnvelope(oid: string): string {
  const config = getNestpayConfig();
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<CC5Request>",
    `  <Name>${escapeXmlText(config.queryUsername)}</Name>`,
    `  <Password>${escapeXmlText(config.queryPassword)}</Password>`,
    `  <ClientId>${escapeXmlText(config.clientId)}</ClientId>`,
    `  <OrderId>${escapeXmlText(oid)}</OrderId>`,
    "  <Extra>",
    "    <ORDERSTATUS>QUERY</ORDERSTATUS>",
    "  </Extra>",
    "</CC5Request>",
  ].join("\n");
}

// The CC5Response XML is shallow and well-defined; regex parsing is
// faster and avoids pulling in a dependency. If the bank ever adds
// nested elements we read, swap to fast-xml-parser.
function extractTag(xml: string, tagPath: string): string {
  const tag = tagPath.replace(/[.[\]]/g, ""); // tolerate "Extra.HOST_REF_NUM"
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i");
  const match = re.exec(xml);
  return match ? match[1].trim() : "";
}

export async function queryOrderStatus(oid: string): Promise<NestpayQueryResult> {
  const config = getNestpayConfig();
  const body = buildQueryEnvelope(oid);

  const res = await fetch(config.queryUrl, {
    method: "POST",
    headers: { "Content-Type": "application/xml; charset=UTF-8" },
    body,
    // Bank gateways occasionally hang under load; bound the wait so the
    // cron worker can still process the rest of its batch.
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`Nestpay query failed: HTTP ${res.status}`);
  }

  const rawXml = await res.text();

  const response = extractTag(rawXml, "Response");
  const procReturnCode = extractTag(rawXml, "ProcReturnCode");
  const authCode = extractTag(rawXml, "AuthCode");
  const transId = extractTag(rawXml, "TransId");
  const mdStatus = extractTag(rawXml, "mdStatus");
  const hostRefNum = extractTag(rawXml, "HOST_REF_NUM");
  const hostDate = extractTag(rawXml, "HOSTDATE");
  const errMsg = extractTag(rawXml, "ErrMsg") || extractTag(rawXml, "ERRORCODE");

  return {
    // The bank returns Response=Approved + ProcReturnCode=00 even on
    // a query of an unknown OID with some response codes; treat
    // "found" pragmatically as "we got back something we can act on".
    found: Boolean(response || procReturnCode),
    response,
    procReturnCode,
    authCode,
    transId,
    mdStatus,
    hostRefNum,
    extraTrxDate: parseNestpayTrxDate(hostDate),
    errMsg,
    rawXml,
  };
}
