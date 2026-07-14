/**
 * delete-bitrix-spam-converted — PERMANENTLY delete Deals + Contacts that were
 * created by CONVERTING .com spam leads in Bitrix24.
 *
 * ⚠ IRREVERSIBLE (crm.deal.delete + crm.contact.delete).
 *
 * Context: deleting a spam LEAD does NOT remove the Deal/Contact a prior lead
 * conversion produced — those survive as orphans (e.g. deal #283 / contact
 * #125 for bot "ACrtEgjxchoDBGHzGk"). This purges them.
 *
 * Targets, using the same conservative name signal as delete-bitrix-spam.ts:
 *   - Deals: .com-inquiry format (TITLE/COMMENTS markers) AND the name in the
 *     "Elegant Render inquiry — <name>" title scores likely_spam. Real orders
 *     (ER-######## in the C5 pipeline) score at most "suspicious" and are
 *     never matched.
 *   - Contacts: name scores likely_spam (random-string handle) AND the contact
 *     carries a .com inquiry marker in its comments. Legit contacts (real
 *     names) never match.
 *
 * Safe by default — dry-run prints what it would delete.
 *   npx tsx scripts/delete-bitrix-spam-converted.ts           # dry-run
 *   npx tsx scripts/delete-bitrix-spam-converted.ts --apply    # actually delete
 *
 * Needs BITRIX24_WEBHOOK_URL in .env.local (crm scope). Deletes Deals first,
 * then Contacts.
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

async function scan<T>(method: string, select: string[]): Promise<T[]> {
  const all: T[] = [];
  let start = 0;
  for (let page = 0; page < 80; page++) {
    const body = await bitrix<{ result: T[]; next?: number }>(method, {
      select,
      order: { DATE_CREATE: "DESC" },
      start,
    });
    all.push(...(body.result ?? []));
    if (body.next === undefined || body.next === null) break;
    start = body.next;
    await sleep(400);
  }
  return all;
}

function isComInquiry(blob: string): boolean {
  return /elegantrender\.com|\/portal\/admin\/inquiries|inquiry id|elegant render inquiry/i.test(
    blob,
  );
}

/** Handle after "Elegant Render inquiry — ", else the raw title. */
function nameFromTitle(title: string): string {
  const m = title.match(/Elegant Render inquiry\s*—\s*(.+)$/i);
  return (m?.[1] ?? title).trim();
}

function isSpamName(name: string): boolean {
  // Conservative: score the name as the message — the bot signal lives in the
  // random-string handle, not the (boilerplate) body.
  return scoreInquiry({ contactName: name, message: name }).level === "likely_spam";
}

type Deal = { ID: string; TITLE?: string; COMMENTS?: string; STAGE_ID?: string };
type Contact = {
  ID: string;
  NAME?: string;
  LAST_NAME?: string;
  COMMENTS?: string;
};

async function main() {
  const deals = await scan<Deal>("crm.deal.list", [
    "ID",
    "TITLE",
    "COMMENTS",
    "STAGE_ID",
  ]);
  const contacts = await scan<Contact>("crm.contact.list", [
    "ID",
    "NAME",
    "LAST_NAME",
    "COMMENTS",
  ]);

  const dealTargets = deals.filter((d) => {
    const blob = `${d.TITLE ?? ""}\n${d.COMMENTS ?? ""}`;
    return isComInquiry(blob) && isSpamName(nameFromTitle(d.TITLE ?? ""));
  });

  const contactTargets = contacts.filter((c) => {
    const name = [c.NAME, c.LAST_NAME].filter(Boolean).join(" ").trim();
    return isSpamName(name) && isComInquiry(c.COMMENTS ?? "");
  });

  console.log(
    `Deals: ${deals.length} total, ${dealTargets.length} spam · Contacts: ${contacts.length} total, ${contactTargets.length} spam`,
  );
  console.log(
    APPLY
      ? "\n⚠⚠ APPLY — PERMANENTLY DELETING deals + contacts (irreversible) ⚠⚠"
      : "\n== DRY-RUN (nothing is deleted; add --apply) ==",
  );

  console.log(`\nDeals (${dealTargets.length}):`);
  for (const d of dealTargets) {
    const label = `#${d.ID} [${d.STAGE_ID ?? "?"}] ${d.TITLE ?? ""}`.slice(0, 100);
    if (APPLY) {
      await bitrix("crm.deal.delete", { id: d.ID });
      console.log(`  🗑  deleted deal: ${label}`);
      await sleep(500);
    } else {
      console.log(`  • ${label}`);
    }
  }

  console.log(`\nContacts (${contactTargets.length}):`);
  for (const c of contactTargets) {
    const name = [c.NAME, c.LAST_NAME].filter(Boolean).join(" ").trim();
    const label = `#${c.ID} "${name}"`.slice(0, 100);
    if (APPLY) {
      await bitrix("crm.contact.delete", { id: c.ID });
      console.log(`  🗑  deleted contact: ${label}`);
      await sleep(500);
    } else {
      console.log(`  • ${label}`);
    }
  }

  console.log(
    APPLY
      ? `\nDone — deleted ${dealTargets.length} deals and ${contactTargets.length} contacts.`
      : `\nDry-run: would PERMANENTLY delete ${dealTargets.length} deals and ${contactTargets.length} contacts. Re-run with --apply.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
