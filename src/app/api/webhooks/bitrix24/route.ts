import { NextResponse } from "next/server";
import { handleDealUpdate } from "@/server/bitrix/inbound";

export async function POST(request: Request) {
  // Verify auth token
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.BITRIX24_OUTBOUND_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Bitrix24 sends event type and data
    const event = body.event;
    const data = body.data;

    if (event === "ONCRMDEAUPDATE" || event === "onCrmDealUpdate") {
      const dealId = data?.FIELDS?.ID ?? data?.id;
      if (dealId) {
        await handleDealUpdate(String(dealId));
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Bitrix24 Webhook] Error:", err);
    return NextResponse.json({ ok: true }); // Always return 200 to prevent retries
  }
}
