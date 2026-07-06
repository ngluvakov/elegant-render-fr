/**
 * PayPal reconciliation cron — recovers orders whose capture never
 * settled (buyer's return leg died, eCheck PENDING with a lost
 * webhook, voided/expired PayPal orders).
 *
 * Queries GET /v2/checkout/orders/:id for paypal-pending orders older
 * than 15 minutes, throttled to one lookup per 30 minutes per order;
 * auto-captures APPROVED-but-uncaptured orders younger than 3 hours.
 */
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { reconcilePayPalPending } from "@/server/finance/reconcile-paypal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Sentry.withMonitor(
    "paypal-reconcile",
    async () => {
      const stats = await reconcilePayPalPending();
      if (!stats.ok) {
        Sentry.captureMessage("paypal-reconcile completed with errors", {
          level: "warning",
          tags: { area: "payment", flow: "paypal-reconcile" },
          extra: stats,
        });
      }
      return NextResponse.json(stats);
    },
    {
      schedule: { type: "crontab", value: "*/15 * * * *" },
      checkinMargin: 5,
      maxRuntime: 10,
      timezone: "UTC",
    },
  );
}
