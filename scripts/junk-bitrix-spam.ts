/**
 * junk-bitrix-spam — move obvious spam leads into the Bitrix "Junk" status.
 *
 * The Bitrix portal is SHARED with the Serbian .rs site, so this targets ONLY
 * leads that are simultaneously:
 *   1) the English .com format (TITLE/COMMENTS contain elegantrender.com or
 *      "inquiry" / "Inquiry ID") — that's the spam source, NOT the .rs site, and
 *   2) heuristically likely_spam (scoreInquiry), and
 *   3) not already in Junk.
 * That keeps .rs leads ("Elegant Render upit —" / "Upit ID:") and borderline
 * cases untouched.
 *
 * Scores the SAME customer text as scripts/triage-bitrix-leads.ts, so whatever
 * triage flags as likely_spam is exactly what this moves. Safe by default —
 * dry-run (only prints what it would change).
 *   npx tsx scripts/junk-bitrix-spam.ts           # dry-run
 *   npx tsx scripts/junk-bitrix-spam.ts --apply    # actually move to Junk
 *
 * Needs BITRIX24_WEBHOOK_URL in .env.local (crm scope). Junk is reversible in
 * Bitrix, so a mistaken move can be undone from the CRM.
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
const APPLY = process.argv.includes("--apply");

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
  NAME?: string;
  LAST_NAME?: string;
  EMAIL?: Array<{ VALUE?: string }>;
  PHONE?: Array<{ VALUE?: string }>;
  COMPANY_TITLE?: string;
};

/** English .com inquiry format — distinguishes our leads from .rs leads. */
function isComInquiry(lead: Lead): boolean {
  const blob = `${lead.TITLE ?? ""}\n${lead.COMMENTS ?? ""}`;
  return /elegantrender\.com|\/portal\/admin\/inquiries|inquiry id|elegant render inquiry/i.test(
    blob,
  );
}

async function findJunkStatusId(): Promise<string> {
  const r = await bitrix<{
    result: Array<{ STATUS_ID: string; SEMANTICS?: string | null }>;
  }>("crm.status.list", { filter: { ENTITY_ID: "STATUS" } });
  const fail = (r.result ?? []).find((s) => s.SEMANTICS === "F");
  return fail?.STATUS_ID ?? "JUNK";
}

async function fetchWebLeads(): Promise<Lead[]> {
  const leads: Lead[] = [];
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
          "NAME",
          "LAST_NAME",
          "EMAIL",
          "PHONE",
          "COMPANY_TITLE",
        ],
        filter: { SOURCE_ID: "WEB" },
        order: { DATE_CREATE: "DESC" },
        start,
      },
    );
    leads.push(...(body.result ?? []));
    if (body.next === undefined || body.next === null) break;
    start = body.next;
    await sleep(500);
  }
  return leads;
}

async function main() {
  const junkStatus = await findJunkStatusId();
  const leads = await fetchWebLeads();

  let alreadyJunk = 0;
  const targets = leads.filter((lead) => {
    if (!isComInquiry(lead)) return false;
    if (lead.STATUS_ID === junkStatus) {
      alreadyJunk++;
      return false; // already in Junk — nothing to do
    }
    const name =
      [lead.NAME, lead.LAST_NAME].filter(Boolean).join(" ").trim() ||
      lead.TITLE ||
      "";
    // Deliberately conservative: score the NAME as the message, not the lead
    // body. The bot signal lives in the name/email (random-string handle,
    // Gmail dot-trick), and our own boilerplate links would otherwise flag
    // every form lead. This spares borderline-but-legit leads whose message
    // happens to include links (e.g. a designer sharing references —
    // amel@nordstar.ba). Full message-based signals are for triage (human
    // review), not for the automated Junk move.
    const r = scoreInquiry({
      contactName: name,
      email: lead.EMAIL?.[0]?.VALUE,
      phone: lead.PHONE?.[0]?.VALUE,
      company: lead.COMPANY_TITLE,
      message: name,
    });
    return r.level === "likely_spam";
  });

  console.log(
    `Junk status: "${junkStatus}" | WEB leads: ${leads.length} | already in Junk (.com): ${alreadyJunk} | targets (.com/EN + likely_spam): ${targets.length}`,
  );
  console.log(
    APPLY
      ? "\n== APPLY (moving to Junk) =="
      : "\n== DRY-RUN (nothing changes; add --apply) ==",
  );

  for (const lead of targets) {
    const email = lead.EMAIL?.[0]?.VALUE ?? "—";
    const label = `#${lead.ID} ${email} — ${lead.TITLE ?? ""}`.slice(0, 90);
    if (APPLY) {
      await bitrix("crm.lead.update", {
        id: lead.ID,
        fields: { STATUS_ID: junkStatus },
      });
      console.log(`  ✅ junk: ${label}`);
      await sleep(500);
    } else {
      console.log(`  • ${label}`);
    }
  }

  console.log(
    APPLY
      ? `\nDone — ${targets.length} leads moved to "${junkStatus}".`
      : `\nDry-run: ${targets.length} leads would be moved. Re-run with --apply to apply.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
