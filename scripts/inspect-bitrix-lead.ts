/**
 * inspect-bitrix-lead — read-only diagnostic for a single Bitrix lead.
 *
 * Finds a WEB lead by its Inquiry ID (the cuid in COMMENTS) or by its Bitrix
 * lead ID, prints its full content, and re-runs scoreInquiry BOTH ways —
 * name/email-only (what junk/delete use) and full customer message (what
 * triage uses) — so you can see exactly why it is or isn't flagged as spam.
 *
 * Changes nothing. Needs BITRIX24_WEBHOOK_URL in .env.local (crm scope).
 *
 * Usage:
 *   npx tsx scripts/inspect-bitrix-lead.ts <inquiry-id-or-lead-id>
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { scoreInquiry } from "../src/lib/spam-detection";

const BASE0 = process.env.BITRIX24_WEBHOOK_URL;
if (!BASE0) {
  console.error("BITRIX24_WEBHOOK_URL is not set in .env.local");
  process.exit(1);
}
const BASE = BASE0.endsWith("/") ? BASE0 : `${BASE0}/`;

const query = process.argv.slice(2).find((a) => a && !a.startsWith("--"));
if (!query) {
  console.error("Usage: npx tsx scripts/inspect-bitrix-lead.ts <inquiry-id-or-lead-id>");
  process.exit(1);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function bitrix<T>(
  method: string,
  params: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${BASE}${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const body = await res.json();
  if (body.error) {
    throw new Error(
      `Bitrix ${method}: ${body.error} ${body.error_description ?? ""}`,
    );
  }
  return body as T;
}

type Lead = {
  ID: string;
  TITLE?: string;
  COMMENTS?: string;
  SOURCE_ID?: string;
  STATUS_ID?: string;
  DATE_CREATE?: string;
  NAME?: string;
  LAST_NAME?: string;
  EMAIL?: Array<{ VALUE?: string }>;
  PHONE?: Array<{ VALUE?: string }>;
  COMPANY_TITLE?: string;
};

/** Strip OUR boilerplate lines to recover the customer's own message. */
function customerMessage(lead: Lead): string {
  const raw = [lead.TITLE, lead.COMMENTS].filter(Boolean).join("\n");
  return raw
    .split(/\r?\n/)
    .filter(
      (line) =>
        !/^\s*(Admin|Inquiry ID|Source|Path|CTA|Service type|Budget|Deadline|Files|Estimate snapshot|Description)\s*:/i.test(
          line,
        ),
    )
    .filter((line) => !/^\s*Elegant Render inquiry —/.test(line))
    .filter((line) => !/^\s*⚠/.test(line))
    .filter((line) => !/^\s*-\s.+\(\d[\d.,]*\s*MB\)\s*$/.test(line))
    .join("\n")
    .trim();
}

async function findLead(): Promise<Lead | null> {
  let start = 0;
  for (let page = 0; page < 60; page++) {
    const body = await bitrix<{ result: Lead[]; next?: number }>(
      "crm.lead.list",
      {
        select: [
          "ID",
          "TITLE",
          "COMMENTS",
          "SOURCE_ID",
          "STATUS_ID",
          "DATE_CREATE",
          "NAME",
          "LAST_NAME",
          "EMAIL",
          "PHONE",
          "COMPANY_TITLE",
        ],
        order: { DATE_CREATE: "DESC" },
        start,
      },
    );
    const hit = (body.result ?? []).find(
      (l) =>
        l.ID === query ||
        (l.COMMENTS ?? "").includes(`Inquiry ID: ${query}`) ||
        (l.COMMENTS ?? "").includes(query!),
    );
    if (hit) return hit;
    if (body.next === undefined || body.next === null) break;
    start = body.next;
    await sleep(500);
  }
  return null;
}

async function main() {
  const lead = await findLead();
  if (!lead) {
    console.log(`No Bitrix lead found for "${query}".`);
    return;
  }

  const name =
    [lead.NAME, lead.LAST_NAME].filter(Boolean).join(" ").trim() ||
    (lead.TITLE ?? "");
  const email = lead.EMAIL?.[0]?.VALUE ?? null;
  const phone = lead.PHONE?.[0]?.VALUE ?? null;
  const msg = customerMessage(lead);

  console.log("=== LEAD ===");
  console.log(`Bitrix ID:   #${lead.ID}`);
  console.log(`Status:      ${lead.STATUS_ID ?? "?"}`);
  console.log(`Source:      ${lead.SOURCE_ID ?? "?"}`);
  console.log(`Created:     ${lead.DATE_CREATE ?? "?"}`);
  console.log(`Title:       ${lead.TITLE ?? ""}`);
  console.log(`Name:        ${name}`);
  console.log(`Email:       ${email ?? "—"}`);
  console.log(`Phone:       ${phone ?? "—"}`);
  console.log(`Company:     ${lead.COMPANY_TITLE ?? "—"}`);
  console.log(`\n--- Customer message (boilerplate stripped) ---\n${msg || "(empty)"}`);

  const nameOnly = scoreInquiry({
    contactName: name,
    email,
    phone,
    company: lead.COMPANY_TITLE,
    message: name,
  });
  const full = scoreInquiry({
    contactName: name,
    email,
    phone,
    company: lead.COMPANY_TITLE,
    message: msg,
  });

  console.log("\n=== SCORING ===");
  console.log(
    `junk/delete mode (name/email only): score ${nameOnly.score} → ${nameOnly.level}`,
  );
  console.log(`   reasons: ${nameOnly.reasons.join("; ") || "—"}`);
  console.log(
    `triage mode (full message):        score ${full.score} → ${full.level}`,
  );
  console.log(`   reasons: ${full.reasons.join("; ") || "—"}`);
  console.log(
    `\nThresholds: score ≥3 = likely_spam, ≥1 = suspicious, 0 = clean.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
