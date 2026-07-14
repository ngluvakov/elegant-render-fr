/**
 * delete-bitrix-spam — PERMANENTLY delete obvious .com spam leads from Bitrix24.
 *
 * ⚠ IRREVERSIBLE. Unlike junk-bitrix-spam.ts (which moves leads to the
 * reversible "Junk" status), this calls crm.lead.delete — the leads are gone
 * for good. Use junk-bitrix-spam.ts first; only run this to purge leads that
 * are already confirmed junk.
 *
 * Targets the SAME set junk-bitrix-spam.ts identifies — leads that are BOTH:
 *   1) the English .com format (TITLE/COMMENTS contain elegantrender.com or
 *      "inquiry" / "Inquiry ID"), and
 *   2) heuristically likely_spam by name/email only (random-string handle,
 *      Gmail dot-trick) — the conservative signal that spares borderline
 *      legit leads whose message includes links (e.g. amel@nordstar.ba).
 * — but here it INCLUDES leads already in Junk (that is exactly what we purge).
 * Shared .rs leads ("Elegant Render upit —") are never matched.
 *
 * Safe by default — dry-run prints what it would delete (with each lead's
 * current status so you can confirm they are all Junk before deleting).
 *   npx tsx scripts/delete-bitrix-spam.ts           # dry-run
 *   npx tsx scripts/delete-bitrix-spam.ts --apply    # actually delete
 *
 * Needs BITRIX24_WEBHOOK_URL in .env.local (crm scope).
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
  const leads = await fetchWebLeads();

  const targets = leads.filter((lead) => {
    if (!isComInquiry(lead)) return false;
    const name =
      [lead.NAME, lead.LAST_NAME].filter(Boolean).join(" ").trim() ||
      lead.TITLE ||
      "";
    // Conservative: name/email bot signal only (same as junk-bitrix-spam.ts),
    // so a borderline-legit lead with links in its message is never deleted.
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
    `WEB leads: ${leads.length} | targets (.com/EN + likely_spam): ${targets.length}`,
  );
  console.log(
    APPLY
      ? "\n⚠⚠ APPLY — PERMANENTLY DELETING (crm.lead.delete, irreversible) ⚠⚠"
      : "\n== DRY-RUN (nothing is deleted; add --apply) ==",
  );

  for (const lead of targets) {
    const email = lead.EMAIL?.[0]?.VALUE ?? "—";
    const label =
      `#${lead.ID} [${lead.STATUS_ID ?? "?"}] ${email} — ${lead.TITLE ?? ""}`.slice(
        0,
        100,
      );
    if (APPLY) {
      await bitrix("crm.lead.delete", { id: lead.ID });
      console.log(`  🗑  deleted: ${label}`);
      await sleep(500);
    } else {
      console.log(`  • ${label}`);
    }
  }

  console.log(
    APPLY
      ? `\nDone — ${targets.length} leads permanently deleted.`
      : `\nDry-run: ${targets.length} leads would be PERMANENTLY deleted. Re-run with --apply to delete.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
