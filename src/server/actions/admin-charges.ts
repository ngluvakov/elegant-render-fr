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
import {
  billingCentsFromEurCents,
  buildBillingSnapshot,
} from "@/lib/billing";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";

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

  const [order, pricingCatalog] = await Promise.all([
    prisma.order.findUnique({
      where: { id: args.orderId },
      select: {
        id: true,
        orderNumber: true,
        userId: true,
        buyerType: true,
        buyerCountryCode: true,
        companyName: true,
        companyTaxId: true,
        companyMb: true,
        companyAddress: true,
        companyCountryCode: true,
        user: {
          select: {
            email: true,
            billingBuyerType: true,
            billingCountryCode: true,
            billingCompanyName: true,
            billingCompanyTaxId: true,
            billingCompanyMb: true,
            billingCompanyAddress: true,
          },
        },
      },
    }),
    getPublishedPricingCatalog(),
  ]);
  if (!order) return { error: "Porudžbina nije pronađena." };

  const reason = args.reason?.trim() || null;
  const userHasBillingProfile = Boolean(order.user.billingCountryCode);
  const billingSnapshot = buildBillingSnapshot(
    userHasBillingProfile
      ? {
          buyerType: order.user.billingBuyerType,
          buyerCountryCode: order.user.billingCountryCode,
          companyName: order.user.billingCompanyName,
          companyTaxId: order.user.billingCompanyTaxId,
          companyMb: order.user.billingCompanyMb,
          companyAddress: order.user.billingCompanyAddress,
          companyCountryCode: order.user.billingCountryCode,
        }
      : {
          buyerType: order.buyerType,
          buyerCountryCode:
            order.buyerCountryCode ??
            (order.buyerType === "company_rs" ? "RS" : order.companyCountryCode),
          companyName: order.companyName,
          companyTaxId: order.companyTaxId,
          companyMb: order.companyMb,
          companyAddress: order.companyAddress,
          companyCountryCode: order.companyCountryCode,
        },
    pricingCatalog.settings,
    order.buyerCountryCode ??
      (order.buyerType === "company_rs" ? "RS" : order.companyCountryCode),
  );
  const billingTotalCents = normalized.reduce(
    (sum, item) =>
      sum +
      billingCentsFromEurCents(
        item.amountCents * item.quantity,
        billingSnapshot,
      ),
    0,
  );

  const admin = await requireAdmin();

  const charge = await prisma.$transaction(async (tx) => {
    const created = await tx.orderCharge.create({
      data: {
        orderId: order.id,
        requestedById: admin.id,
        reason,
        totalCents,
        buyerType: billingSnapshot.buyerType,
        buyerCountryCode: billingSnapshot.buyerCountryCode,
        companyName: billingSnapshot.companyName,
        companyTaxId: billingSnapshot.companyTaxId,
        companyMb: billingSnapshot.companyMb,
        companyAddress: billingSnapshot.companyAddress,
        companyCountryCode: billingSnapshot.companyCountryCode,
        billingCurrency: billingSnapshot.billingCurrency,
        billingVatRate: billingSnapshot.billingVatRate,
        billingEurToRsdRate: billingSnapshot.billingEurToRsdRate,
        billingTotalCents,
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
          billingCurrency: billingSnapshot.billingCurrency,
          billingTotalCents,
          reason: reason ?? "",
          lines: normalized.map((item) => ({
            label: item.label,
            quantity: item.quantity,
            amountCents: item.amountCents,
            billingSubtotalCents: billingCentsFromEurCents(
              item.amountCents * item.quantity,
              billingSnapshot,
            ),
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
      billing_currency: billingSnapshot.billingCurrency,
      billing_total_cents: billingTotalCents,
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
