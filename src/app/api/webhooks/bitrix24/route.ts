import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { timingSafeEquals } from "@/lib/cron-auth";
import { handleDealUpdate } from "@/server/bitrix/inbound";

export async function POST(request: Request) {
  // Verify auth token. Secret stiže kroz query string jer Bitrix24
  // outbound webhook ne šalje custom headere — prelazak na header
  // zahteva izmenu na Bitrix strani (backlog). Fail-closed kad env
  // var nije podešen.
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
    // 200 i dalje (Bitrix bi inače beskonačno ponavljao), ali greška
    // mora biti vidljiva ljudima — ranije je išla samo u console.
    Sentry.captureException(err, {
      tags: { integration: "bitrix24", surface: "webhook" },
    });
    return NextResponse.json({ ok: true }); // Always return 200 to prevent retries
  }
}
