/**
 * GET /api/portal/proforma/[orderId] — signed-URL redirect to the
 * issued proforma PDF. Same auth shape as the invoice route:
 * order owner OR any admin.
 *
 * Different storage prefix (proformas/{year}/{number}.pdf) and a
 * distinct download filename so the customer doesn't confuse the
 * payment instruction with the legal invoice that comes later.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase";
import { UPLOADS_BUCKET } from "@/lib/file-scan";
import {
  hasAdminPermission,
  normalizeAdminPermissions,
} from "@/lib/admin-permissions";

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
      select: { userId: true, proformaPdfPath: true, proformaNumber: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, adminPermissions: true },
    }),
  ]);

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!order.proformaPdfPath || !order.proformaNumber) {
    return NextResponse.json(
      { error: "Proforma not yet issued" },
      { status: 404 },
    );
  }

  const isOwner = order.userId === session.user.id;
  const canViewFinance = viewer
    ? hasAdminPermission(
        normalizeAdminPermissions(viewer.adminPermissions, {
          isAdmin: viewer.isAdmin,
        }),
        "FINANCE_VIEW",
      )
    : false;
  if (!isOwner && !canViewFinance) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await getSupabaseAdmin().storage
    .from(UPLOADS_BUCKET)
    .createSignedUrl(order.proformaPdfPath, 3600, {
      download: `proforma-${order.proformaNumber}.pdf`,
    });

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Sign URL failed" },
      { status: 500 },
    );
  }

  return NextResponse.redirect(data.signedUrl);
}
