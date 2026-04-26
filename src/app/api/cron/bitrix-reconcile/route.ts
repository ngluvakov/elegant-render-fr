import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { reconcileAllOrders } from "@/server/bitrix/reconcile";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Sentry.withMonitor(
    "bitrix-reconcile",
    async () => {
      await reconcileAllOrders();
      return NextResponse.json({ ok: true });
    },
    {
      schedule: { type: "crontab", value: "0 3 * * *" },
      checkinMargin: 5,
      maxRuntime: 30,
      timezone: "UTC",
    },
  );
}
