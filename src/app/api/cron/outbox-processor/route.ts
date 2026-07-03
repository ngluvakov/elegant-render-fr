/**
 * Outbox processor — runs every minute, drains the OutboxEvent queue.
 *
 * Producers (server actions that mutate state) enqueue rows here so
 * critical side effects (transactional emails) survive transient
 * provider outages. The processor claims a batch, runs each handler,
 * and writes terminal status. Exponential backoff on retry; rows that
 * exceed maxAttempts land in `failed` and surface to humans via
 * /portal/admin/outbox (future) or a Sentry alert from the
 * `terminal: "true"` tag.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`.
 * Schedule: see vercel.json — every minute.
 */
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { processOutboxBatch } from "@/lib/outbox";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Sentry.withMonitor(
    "outbox-processor",
    async () => {
      const stats = await processOutboxBatch();
      return NextResponse.json({ ok: true, ...stats });
    },
    {
      schedule: { type: "crontab", value: "* * * * *" },
      checkinMargin: 2,
      maxRuntime: 5,
      timezone: "UTC",
    },
  );
}
