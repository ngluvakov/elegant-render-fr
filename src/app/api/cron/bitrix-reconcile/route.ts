import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { reconcileAllOrders } from "@/server/bitrix/reconcile";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Sentry.withMonitor(
    "bitrix-reconcile",
    async () => {
      const summary = await reconcileAllOrders();
      return NextResponse.json({ ok: true, ...summary });
    },
    {
      schedule: { type: "crontab", value: "0 3 * * *" },
      checkinMargin: 5,
      maxRuntime: 30,
      timezone: "UTC",
    },
  );
}
