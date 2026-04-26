/**
 * Daily cron — removes expired Quote rows.
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
import { prisma } from "@/lib/db";

// Sentry.withMonitor wraps the run in a Crons check-in so missed or
// failed runs surface as alerts. The slug must match what Sentry
// expects in the Crons UI.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Sentry.withMonitor(
    "quote-cleanup",
    async () => {
      const result = await prisma.quote.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      return NextResponse.json({ ok: true, deleted: result.count });
    },
    {
      schedule: { type: "crontab", value: "30 3 * * *" },
      checkinMargin: 5,
      maxRuntime: 5,
      timezone: "UTC",
    },
  );
}
