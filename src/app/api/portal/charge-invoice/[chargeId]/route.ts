/**
 * GET /api/portal/charge-invoice/[chargeId] — signed-URL redirect to
 * the issued invoice PDF for a paid additional charge.
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
  { params }: { params: Promise<{ chargeId: string }> },
) {
  const { chargeId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [charge, viewer] = await Promise.all([
    prisma.orderCharge.findUnique({
      where: { id: chargeId },
      select: {
        invoicePdfPath: true,
        invoiceNumber: true,
        order: { select: { userId: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, adminPermissions: true },
    }),
  ]);

  if (!charge) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!charge.invoicePdfPath || !charge.invoiceNumber) {
    return NextResponse.json(
      { error: "Facture pas encore émise." },
      { status: 404 },
    );
  }

  const isOwner = charge.order.userId === session.user.id;
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
    .createSignedUrl(charge.invoicePdfPath, 3600, {
      download: `racun-${charge.invoiceNumber}.pdf`,
    });

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Sign URL failed" },
      { status: 500 },
    );
  }

  return NextResponse.redirect(data.signedUrl);
}
