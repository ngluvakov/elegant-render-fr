/**
 * GET /api/portal/invoice/[orderId] — signed-URL redirect to the issued
 * invoice PDF. Both the order owner and any admin can fetch.
 *
 * The PDF lives in Supabase Storage at the path stored in
 * Order.invoicePdfPath (`invoices/{year}/{number}.pdf` per the issue
 * pipeline). 1-hour signed URL is enough for a one-shot download or
 * a quick re-open from the customer's email link.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase";
import { UPLOADS_BUCKET } from "@/lib/file-scan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [order, viewer] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, invoicePdfPath: true, invoiceNumber: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    }),
  ]);

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!order.invoicePdfPath || !order.invoiceNumber) {
    return NextResponse.json(
      { error: "Invoice not yet issued" },
      { status: 404 },
    );
  }

  const isOwner = order.userId === session.user.id;
  const isAdmin = Boolean(viewer?.isAdmin);
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await getSupabaseAdmin().storage
    .from(UPLOADS_BUCKET)
    .createSignedUrl(order.invoicePdfPath, 3600, {
      download: `racun-${order.invoiceNumber}.pdf`,
    });

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Sign URL failed" },
      { status: 500 },
    );
  }

  return NextResponse.redirect(data.signedUrl);
}
