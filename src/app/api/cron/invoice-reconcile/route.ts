/**
 * Invoice reconciliation cron — repairs paid orders and paid extra
 * charges that missed automatic invoice issuance during payment.
 */
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { reconcileMissingInvoices } from "@/server/finance/reconcile-invoices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Sentry.withMonitor(
    "invoice-reconcile",
    async () => {
      const stats = await reconcileMissingInvoices();
      if (!stats.ok) {
        Sentry.captureMessage("invoice-reconcile completed with errors", {
          level: "warning",
          tags: { area: "invoice", flow: "reconcile" },
          extra: stats,
        });
      }
      return NextResponse.json(stats);
    },
    {
      schedule: { type: "crontab", value: "15 4 * * *" },
      checkinMargin: 5,
      maxRuntime: 30,
      timezone: "UTC",
    },
  );
}
