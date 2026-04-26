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
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await prisma.quote.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  return NextResponse.json({ ok: true, deleted: result.count });
}
