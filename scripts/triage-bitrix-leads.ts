/**
 * triage-bitrix-leads — read-only review of Bitrix24 leads with heuristic
 * spam scoring, grouped by SOURCE so you can see WHICH channel leaks spam
 * (our form sends SOURCE_ID "WEB" + title "Elegant Render inquiry —").
 *
 * Changes nothing in Bitrix (only crm.lead.list). Needs BITRIX24_WEBHOOK_URL
 * in .env.local (the same inbound webhook the app already uses; must have the
 * crm scope).
 *
 * Usage:
 *   npx tsx scripts/triage-bitrix-leads.ts            # all, grouped by source
 *   npx tsx scripts/triage-bitrix-leads.ts --spam     # only suspicious + likely_spam in the list
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import {
  scoreInquiry,
  spamLevelLabel,
  type SpamLevel,
} from "../src/lib/spam-detection";

const WEBHOOK_URL = process.env.BITRIX24_WEBHOOK_URL;
if (!WEBHOOK_URL) {
  console.error("BITRIX24_WEBHOOK_URL is not set in .env.local");
  process.exit(1);
}
const BASE = WEBHOOK_URL.endsWith("/") ? WEBHOOK_URL : `${WEBHOOK_URL}/`;

// Readable labels for the most common Bitrix sources (others print as code).
const SOURCE_LABELS: Record<string, string> = {
  WEB: "Web (our form)",
  CALL: "Call",
  EMAIL: "Email",
  CALLBACK: "Callback widget",
  WEBFORM: "CRM web form",
  RC_GENERATOR: "CRM form (generator)",
  STORE: "Online store",
  PARTNER: "Partner",
  ADVERTISING: "Advertising",
  RECOMMENDATION: "Recommendation",
  OTHER: "Other",
};

type BitrixLead = {
  ID: string;
  TITLE?: string;
  NAME?: string;
  LAST_NAME?: string;
  COMPANY_TITLE?: string;
  SOURCE_ID?: string;
  STATUS_ID?: string;
  DATE_CREATE?: string;
  COMMENTS?: string;
  EMAIL?: Array<{ VALUE?: string }>;
  PHONE?: Array<{ VALUE?: string }>;
};

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchAllLeads(): Promise<BitrixLead[]> {
  const leads: BitrixLead[] = [];
  let start = 0;
  const MAX_PAGES = 60; // ~3000 leads upper bound, so it can't run away
  for (let page = 0; page < MAX_PAGES; page++) {
    const body = await bitrix<{
      result: BitrixLead[];
      next?: number;
      total?: number;
    }>("crm.lead.list", {
      select: [
        "ID",
        "TITLE",
        "NAME",
        "LAST_NAME",
        "COMPANY_TITLE",
        "SOURCE_ID",
        "STATUS_ID",
        "DATE_CREATE",
        "COMMENTS",
        "EMAIL",
        "PHONE",
      ],
      order: { DATE_CREATE: "DESC" },
      start,
    });
    leads.push(...(body.result ?? []));
    if (body.next === undefined || body.next === null) break;
    start = body.next;
    await sleep(500); // Bitrix ~2 req/s
  }
  return leads;
}

function firstValue(arr?: Array<{ VALUE?: string }>): string | null {
  return arr?.[0]?.VALUE ?? null;
}

/**
 * Customer text for scoring — strips OUR boilerplate out of TITLE/COMMENTS
 * (Admin URL, meta lines, our title), otherwise our own links would falsely
 * raise the score of every lead from the form. For Bitrix-native leads
 * (no boilerplate) the whole text is kept.
 */
function customerMessage(lead: BitrixLead): string {
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
    .filter((line) => !/^\s*-\s.+\(\d[\d.,]*\s*MB\)\s*$/.test(line)) // file lines
    .join("\n")
    .trim();
}

async function main() {
  const onlySpam = process.argv.includes("--spam");
  console.log("Fetching Bitrix leads…");
  const leads = await fetchAllLeads();

  type Scored = {
    lead: BitrixLead;
    source: string;
    level: SpamLevel;
    score: number;
    reasons: string[];
    name: string;
    email: string | null;
  };

  const scored: Scored[] = leads.map((lead) => {
    const name =
      [lead.NAME, lead.LAST_NAME].filter(Boolean).join(" ").trim() ||
      (lead.TITLE ?? "");
    const email = firstValue(lead.EMAIL);
    const phone = firstValue(lead.PHONE);
    const r = scoreInquiry({
      contactName: name,
      email,
      phone,
      company: lead.COMPANY_TITLE,
      message: customerMessage(lead),
    });
    return { lead, source: lead.SOURCE_ID || "(empty)", ...r, name, email };
  });

  // ── Summary by SOURCE (main diagnostic) ──
  const bySource = new Map<
    string,
    { total: number; spam: number; susp: number }
  >();
  for (const s of scored) {
    const e = bySource.get(s.source) ?? { total: 0, spam: 0, susp: 0 };
    e.total++;
    if (s.level === "likely_spam") e.spam++;
    else if (s.level === "suspicious") e.susp++;
    bySource.set(s.source, e);
  }

  const totalSpam = scored.filter((s) => s.level === "likely_spam").length;
  const totalSusp = scored.filter((s) => s.level === "suspicious").length;

  console.log("\n=== BITRIX LEAD TRIAGE ===");
  console.log(
    `Total leads: ${leads.length} | likely_spam: ${totalSpam} | suspicious: ${totalSusp}\n`,
  );

  console.log("--- By source (SOURCE_ID) — which channel leaks spam ---");
  const rows = [...bySource.entries()].sort(
    (a, b) => b[1].spam - a[1].spam || b[1].total - a[1].total,
  );
  for (const [source, c] of rows) {
    const label = SOURCE_LABELS[source] ? ` (${SOURCE_LABELS[source]})` : "";
    const flag = c.spam > 0 ? "🔴" : c.susp > 0 ? "🟡" : "🟢";
    console.log(
      `${flag} ${source}${label}: total ${c.total}, likely_spam ${c.spam}, suspicious ${c.susp}`,
    );
  }

  // ── List of spam/suspicious ──
  const flagged = scored
    .filter((s) => (onlySpam ? s.level !== "clean" : s.level === "likely_spam"))
    .sort((a, b) => b.score - a.score);

  console.log(
    `\n--- ${onlySpam ? "Suspicious + spam" : "Likely_spam"} leads (${flagged.length}) ---`,
  );
  for (const s of flagged) {
    const flag = s.level === "likely_spam" ? "🔴" : "🟡";
    const date = s.lead.DATE_CREATE?.slice(0, 10) ?? "?";
    console.log(
      `${flag} score ${s.score} — ${spamLevelLabel(s.level)} · source ${s.source} · lead #${s.lead.ID} · ${date}`,
    );
    console.log(`   ${s.name} <${s.email ?? "no email"}>`);
    if (s.reasons.length) console.log(`   reasons: ${s.reasons.join("; ")}`);
  }

  // Full list of all addresses — for a manual eyeball of "obvious spam".
  console.log(
    `\n--- All addresses (${scored.length}), grouped by source + date ---`,
  );
  const all = [...scored].sort(
    (a, b) =>
      a.source.localeCompare(b.source) ||
      (b.lead.DATE_CREATE ?? "").localeCompare(a.lead.DATE_CREATE ?? ""),
  );
  for (const s of all) {
    const flag =
      s.level === "likely_spam" ? "🔴" : s.level === "suspicious" ? "🟡" : "🟢";
    const date = s.lead.DATE_CREATE?.slice(0, 10) ?? "?";
    console.log(
      `${flag} ${s.source.padEnd(8)} ${date}  ${(s.email ?? "—").padEnd(34)} · ${s.name}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
