/**
 * GET /api/admin/proforma-preview/[orderId] — admin-only PDF preview
 * of what the proforma would look like for an order, WITHOUT
 * burning a proforma counter slot or persisting anything.
 *
 * Lets admin sanity-check buyer info, total, and bank instructions
 * before actually clicking "Issue proforma" (which sends the email
 * to the customer). Especially valuable around launch when bank
 * details in IMPRINT.bank still have placeholders.
 *
 * The proforma number is rendered as a placeholder string so it's
 * obvious from the PDF that this isn't a real document.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { renderProformaPdf } from "@/lib/proforma-pdf";
import { buildProformaDataForOrder } from "@/lib/proforma-data-builder";
import { requirePermission } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROFORMA_VALIDITY_DAYS = 14;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;

  try {
    await requirePermission("FINANCE_VIEW");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      user: { select: { name: true, email: true } },
    },
  });
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + PROFORMA_VALIDITY_DAYS);

  const built = buildProformaDataForOrder(order, {
    // Placeholder so the PDF clearly looks like a draft. Doesn't
    // touch ProformaCounter — admin can preview as many times as
    // they want without consuming numbers.
    proformaNumber: "P-PREVIEW",
    issueDate: now,
    dueDate,
  });
  if (!built.ok) {
    return NextResponse.json({ error: built.reason }, { status: 422 });
  }

  const pdfBuffer = await renderProformaPdf(built.data);
  // Force inline display in a new tab so admin can review without a
  // download dance. Content-Disposition: inline is the default but
  // setting filename helps browsers tab-title it sensibly.
  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="proforma-preview-${order.orderNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
