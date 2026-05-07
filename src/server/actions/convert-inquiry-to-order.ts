/**
 * convert-inquiry-to-order.ts — Admin action that converts a generic
 * ProjectInquiry into a draft Order on the wire-transfer payment
 * track. The created order has no items yet — admin adds them on the
 * order detail page (existing add-service flow), then issues a
 * predračun (existing #97 button).
 *
 * This is the first half of the inquiry → admin offer wizard. The
 * second half (item suggestion from inquiry.serviceType + snapshot,
 * customer notification email) is deliberately deferred — admin can
 * already do everything needed via the order detail UI once the
 * draft exists.
 *
 * Difference from vr-inquiry.ts (VR inquiries have a known product
 * + price): here the inquiry is open-ended — message + serviceType
 * + budget — so we never auto-create OrderItems.
 */
"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import { requireAdmin } from "@/server/actions/admin";
import { generateOrderNumber } from "@/lib/order/generate-number";
import { enqueueOutboxEvent } from "@/lib/outbox";

export type ConvertInquiryResult =
  | { ok: true; orderId: string; orderNumber: string }
  | { ok: false; reason: string };

export async function convertInquiryToOrder(
  inquiryId: string,
): Promise<ConvertInquiryResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, reason: "not_admin" };
  }

  try {
    const inquiry = await prisma.projectInquiry.findUnique({
      where: { id: inquiryId },
    });
    if (!inquiry) return { ok: false, reason: "inquiry_not_found" };
    if (inquiry.status === "converted") {
      return { ok: false, reason: "already_converted" };
    }

    // Find or create the customer user. Pattern lifted from
    // vr-inquiry.ts:201–226. Inquiry.userId takes priority (set when
    // the customer was logged in at submit), otherwise match by email
    // or create a passwordless guest user — Auth.js v5 supports
    // password-less accounts (sign-in via magic link / OAuth on
    // first portal visit).
    let userId: string;
    if (inquiry.userId) {
      userId = inquiry.userId;
    } else {
      const email = inquiry.email.trim().toLowerCase();
      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (existing) {
        userId = existing.id;
      } else {
        const created = await prisma.user.create({
          data: {
            email,
            name: inquiry.contactName,
            phone: inquiry.phone ?? null,
          },
          select: { id: true },
        });
        userId = created.id;
      }
    }

    const customerNote = composeCustomerNote(inquiry);

    // Default buyerType to company_rs when the inquiry came in with a
    // company name. Admin can flip this on the order detail before
    // issuing the predračun if the company turns out to be foreign.
    const buyerType: "individual" | "company_rs" = inquiry.company
      ? "company_rs"
      : "individual";

    const orderNumber = generateOrderNumber();

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: "draft",
          paymentMethod: "wire_transfer",
          paymentStatus: "pending",
          buyerType,
          companyName: inquiry.company ?? null,
          customerNote,
          totalEur: 0,
          totalCents: 0,
        },
        select: { id: true, orderNumber: true },
      });

      await tx.projectInquiry.update({
        where: { id: inquiryId },
        data: {
          status: "converted",
          reviewedAt: new Date(),
        },
      });

      return created;
    });

    // Heads-up email to the customer so they know their inquiry was
    // received and a predračun is being prepared. Idempotent on the
    // (inquiry, order) pair so a stuck UI / replayed action can't
    // double-mail. PDF-less — the predračun email comes separately
    // when admin clicks "Izdaj predračun".
    await enqueueOutboxEvent({
      type: "inquiry_converted_email",
      payload: {
        to: inquiry.email,
        contactName: inquiry.contactName,
        inquirySubject: inquiry.serviceType ?? null,
        orderId: order.id,
        inquiryId,
      },
      idempotencyKey: `inquiry_converted_email:${inquiryId}:${order.id}`,
    });

    await recordAuditLog({
      action: "inquiry.converted_to_order",
      entityType: "ProjectInquiry",
      entityId: inquiryId,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId,
        actorId: admin.id,
      },
    });

    revalidatePath("/portal/admin/upiti");
    revalidatePath("/portal/admin");

    return {
      ok: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "inquiry", flow: "convert-to-order" },
      extra: { inquiryId },
    });
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "unknown",
    };
  }
}

function composeCustomerNote(inquiry: {
  id: string;
  message: string;
  serviceType: string | null;
  budget: string | null;
  deadline: string | null;
  sourceLabel: string | null;
  sourcePath: string | null;
}): string {
  const parts: string[] = [`Iz upita #${inquiry.id}.`];

  if (inquiry.serviceType) parts.push(`Tip usluge: ${inquiry.serviceType}.`);
  if (inquiry.budget) parts.push(`Budžet: ${inquiry.budget}.`);
  if (inquiry.deadline) parts.push(`Rok: ${inquiry.deadline}.`);
  if (inquiry.sourceLabel || inquiry.sourcePath) {
    parts.push(
      `Izvor: ${inquiry.sourceLabel ?? inquiry.sourcePath ?? "—"}.`,
    );
  }

  parts.push("");
  parts.push(inquiry.message.trim());

  return parts.join("\n");
}
