/**
 * Daily cron — removes expired Quote rows and runs AI Studio maintenance.
 *
 * The Quote model (saved-and-shared cart snapshots from /cene) has a
 * 30-day TTL via `expiresAt`. The schema has @@index([expiresAt]) so
 * this delete stays cheap as the table grows.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`.
 * Schedule: see vercel.json.
 */
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { prisma } from "@/lib/db";
import { runAiStudioMaintenance } from "@/server/ai-studio/maintenance";

// Sentry.withMonitor wraps the run in a Crons check-in so missed or
// failed runs surface as alerts. The slug must match what Sentry
// expects in the Crons UI.
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Sentry.withMonitor(
    "quote-cleanup",
    async () => {
      const now = new Date();
      const quotes = await prisma.quote.deleteMany({
        where: { expiresAt: { lt: now } },
      });
      const aiStudio = await runAiStudioMaintenance(now);

      return NextResponse.json({
        ok: true,
        deleted: quotes.count,
        aiStudio,
      });
    },
    {
      schedule: { type: "crontab", value: "30 3 * * *" },
      checkinMargin: 5,
      maxRuntime: 5,
      timezone: "UTC",
    },
  );
}
