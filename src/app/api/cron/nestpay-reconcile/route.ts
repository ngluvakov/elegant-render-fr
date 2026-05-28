/**
 * Nestpay reconciliation cron — recovers orders whose return POST
 * from Banca Intesa never arrived (tab closed, network drop, etc).
 *
 * Queries Nestpay's Order Status Query API for pending payments
 * older than 2 minutes and younger than 24 hours, throttled to one
 * lookup per 10 minutes per order.
 */
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { reconcileNestpayPending } from "@/server/finance/reconcile-nestpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Sentry.withMonitor(
    "nestpay-reconcile",
    async () => {
      const stats = await reconcileNestpayPending();
      if (!stats.ok) {
        Sentry.captureMessage("nestpay-reconcile completed with errors", {
          level: "warning",
          tags: { area: "payment", flow: "nestpay-reconcile" },
          extra: stats,
        });
      }
      return NextResponse.json(stats);
    },
    {
      schedule: { type: "crontab", value: "*/5 * * * *" },
      checkinMargin: 2,
      maxRuntime: 5,
      timezone: "UTC",
    },
  );
}
