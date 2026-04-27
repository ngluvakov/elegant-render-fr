/**
 * admin-charges.ts — Admin actions for ad-hoc additional charges.
 *
 * Exports adminCreateCharge, adminCancelCharge. A charge is a billable
 * line set attached to an existing Order — used when scope changes
 * after the original payment (forgotten service, extra room, edit
 * beyond included revisions, custom work).
 *
 * Modeled separately from Order because Order.totalCents is immutable
 * for idempotency on the original PayPal/card capture. Each charge
 * has its own payment lifecycle through charge-payment.ts and is
 * delivered to the customer via the portal order detail page.
 */
"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { enqueueOutboxEvent } from "@/lib/outbox";
import { captureServerEvent } from "@/lib/posthog";
import { requireAdmin } from "@/server/actions/admin";

export type ChargeItemInput = {
  productId?: string;
  kind: string;
  label: string;
  amountCents: number;
  quantity?: number;
  configJson?: Prisma.InputJsonValue;
};

export async function adminCreateCharge(args: {
  orderId: string;
  reason?: string;
  items: ChargeItemInput[];
}): Promise<{ error?: string; chargeId?: string }> {
  await requireAdmin();

  if (!args.items.length) {
    return { error: "Mora postojati barem jedna stavka." };
  }

  const normalized = args.items.map((item) => {
    const quantity = Math.floor(item.quantity ?? 1);
    return {
      productId: item.productId ?? null,
      kind: item.kind.trim(),
      label: item.label.trim(),
      amountCents: Math.floor(item.amountCents),
      quantity,
      configJson: item.configJson,
    };
  });

  for (const item of normalized) {
    if (!item.label) return { error: "Svaka stavka mora imati naziv." };
    if (!item.kind) return { error: "Tip stavke je obavezan." };
    if (item.amountCents <= 0) {
      return { error: `Cena stavke "${item.label}" mora biti veća od nule.` };
    }
    if (item.quantity < 1) {
      return { error: `Količina za "${item.label}" mora biti najmanje 1.` };
    }
  }

  const totalCents = normalized.reduce(
    (sum, item) => sum + item.amountCents * item.quantity,
    0,
  );

  const order = await prisma.order.findUnique({
    where: { id: args.orderId },
    select: {
      id: true,
      orderNumber: true,
      userId: true,
      user: { select: { email: true } },
    },
  });
  if (!order) return { error: "Porudžbina nije pronađena." };

  const reason = args.reason?.trim() || null;

  const admin = await requireAdmin();

  const charge = await prisma.$transaction(async (tx) => {
    const created = await tx.orderCharge.create({
      data: {
        orderId: order.id,
        requestedById: admin.id,
        reason,
        totalCents,
        items: {
          create: normalized.map((item) => ({
            productId: item.productId,
            kind: item.kind,
            label: item.label,
            amountCents: item.amountCents,
            quantity: item.quantity,
            configJson:
              item.configJson === undefined
                ? Prisma.JsonNull
                : item.configJson,
          })),
        },
      },
      select: { id: true },
    });

    if (order.user.email) {
      await enqueueOutboxEvent({
        type: "additional_charge_requested_email",
        payload: {
          to: order.user.email,
          orderNumber: order.orderNumber,
          orderId: order.id,
          chargeId: created.id,
          totalCents,
          reason: reason ?? "",
          lines: normalized.map((item) => ({
            label: item.label,
            quantity: item.quantity,
            amountCents: item.amountCents,
          })),
        },
        idempotencyKey: `additional_charge_requested:${created.id}`,
        tx,
      });
    }

    return created;
  });

  revalidatePath(`/portal/admin/porudzbine/${order.id}`);
  revalidatePath(`/portal/porudzbine/${order.id}`);

  await captureServerEvent({
    distinctId: `user:${order.userId}`,
    event: "admin_charge_requested",
    properties: {
      order_id: order.id,
      charge_id: charge.id,
      total_cents: totalCents,
      item_count: normalized.length,
    },
  });

  return { chargeId: charge.id };
}

export async function adminCancelCharge(args: {
  chargeId: string;
}): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin();

  const charge = await prisma.orderCharge.findUnique({
    where: { id: args.chargeId },
    select: { id: true, status: true, orderId: true },
  });
  if (!charge) return { error: "Naplata nije pronađena." };
  if (charge.status !== "pending") {
    return { error: "Mogu se otkazati samo naplate u statusu 'pending'." };
  }

  await prisma.orderCharge.update({
    where: { id: args.chargeId },
    data: { status: "cancelled", cancelledAt: new Date() },
  });

  revalidatePath(`/portal/admin/porudzbine/${charge.orderId}`);
  revalidatePath(`/portal/porudzbine/${charge.orderId}`);
  return { success: true };
}
