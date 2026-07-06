import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { timingSafeEquals } from "@/lib/cron-auth";
import { handleDealUpdate } from "@/server/bitrix/inbound";

export async function POST(request: Request) {
  // Verify auth token. The secret arrives through the query string because
  // Bitrix24 outbound webhooks cannot send custom headers — moving to a
  // header requires a change on the Bitrix side (backlog). Fail-closed when
  // the env var is not set.
  const expectedSecret = process.env.BITRIX24_OUTBOUND_SECRET;
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (!expectedSecret || !secret || !timingSafeEquals(secret, expectedSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Bitrix24 sends event type and data
    const event = body.event;
    const data = body.data;

    if (event === "ONCRMDEALUPDATE" || event === "onCrmDealUpdate") {
      const dealId = data?.FIELDS?.ID ?? data?.id;
      if (dealId) {
        await handleDealUpdate(String(dealId));
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Still return 200 (Bitrix would otherwise retry forever), but the error
    // must be visible to humans — it used to go only to the console.
    Sentry.captureException(err, {
      tags: { integration: "bitrix24", surface: "webhook" },
    });
    return NextResponse.json({ ok: true }); // Always return 200 to prevent retries
  }
}
