/**
 * backfill-bitrix-inquiries — push unsynced project inquiries into Bitrix24.
 *
 * For every ProjectInquiry with no bitrixLeadId (the fire-and-forget lead
 * sync failed — e.g. the Aug 2026 REST-API plan outage), re-runs the exact
 * same syncProjectInquiryLead the submit action uses. Idempotent: already
 * synced inquiries are skipped by the sync itself, and errors are persisted
 * to bitrixSyncError like in production.
 *
 * Needs in .env.local: DATABASE_URL, BITRIX24_WEBHOOK_URL
 * (optionally AUTH_URL so the admin link in the lead comment points at
 * https://www.elegantrender.com instead of localhost).
 *
 * Usage:
 *   npx tsx scripts/backfill-bitrix-inquiries.ts --dry-run
 *   npx tsx scripts/backfill-bitrix-inquiries.ts
 *   npx tsx scripts/backfill-bitrix-inquiries.ts --since=2026-08-16
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set in .env.local");
    process.exit(1);
  }
  if (!process.env.BITRIX24_WEBHOOK_URL) {
    console.error("BITRIX24_WEBHOOK_URL is not set in .env.local");
    process.exit(1);
  }

  // Imported dynamically so dotenv above runs before lib/db reads the env.
  const { prisma } = await import("../src/lib/db");
  const { syncProjectInquiryLead } = await import(
    "../src/server/bitrix/sync-project-inquiry"
  );

  const dryRun = process.argv.includes("--dry-run");
  const sinceArg = process.argv
    .find((arg) => arg.startsWith("--since="))
    ?.slice("--since=".length);
  const since = sinceArg ? new Date(sinceArg) : undefined;
  if (since && Number.isNaN(since.getTime())) {
    console.error(`Invalid --since date: ${sinceArg}`);
    process.exit(1);
  }

  const pending = await prisma.projectInquiry.findMany({
    where: {
      bitrixLeadId: null,
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      contactName: true,
      email: true,
      createdAt: true,
      bitrixSyncError: true,
      _count: { select: { files: true } },
    },
  });

  console.log(
    `Unsynced inquiries${since ? ` since ${since.toISOString().slice(0, 10)}` : ""}: ${pending.length}`,
  );
  for (const inquiry of pending) {
    console.log(
      `  ${inquiry.createdAt.toISOString()}  ${inquiry.id}  ${inquiry.contactName} <${inquiry.email}> files=${inquiry._count.files}${
        inquiry.bitrixSyncError ? `  lastError="${inquiry.bitrixSyncError.slice(0, 80)}"` : ""
      }`,
    );
  }

  if (dryRun) {
    console.log("\nDry run — nothing synced.");
    await prisma.$disconnect();
    return;
  }

  let ok = 0;
  let failed = 0;
  for (const inquiry of pending) {
    try {
      const leadId = await syncProjectInquiryLead(inquiry.id);
      ok += 1;
      console.log(`SYNCED  ${inquiry.id} → lead ${leadId}`);
    } catch (err) {
      failed += 1;
      console.error(
        `FAILED  ${inquiry.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    // Bitrix allows ~2 req/s; each sync makes 2 calls, so pace at 1/s.
    await sleep(1000);
  }

  console.log(`\nDone: ${ok} synced, ${failed} failed.`);
  await prisma.$disconnect();
})();
