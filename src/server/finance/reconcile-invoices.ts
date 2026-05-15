/**
 * Repairs paid transactions whose invoice issuance did not complete
 * during the payment hook.
 */

import { prisma } from "@/lib/db";
import { issueInvoice } from "@/server/actions/issue-invoice";
import { issueChargeInvoice } from "@/server/actions/issue-charge-invoice";

const DEFAULT_LIMIT = 50;

export async function reconcileMissingInvoices(limit = DEFAULT_LIMIT) {
  const [orders, charges] = await Promise.all([
    prisma.order.findMany({
      where: {
        paymentStatus: "completed",
        invoiceNumber: null,
        items: { some: { totalCents: { gt: 0 } } },
      },
      select: { id: true },
      orderBy: { updatedAt: "asc" },
      take: limit,
    }),
    prisma.orderCharge.findMany({
      where: {
        status: "paid",
        paymentStatus: "completed",
        invoiceNumber: null,
        items: { some: { amountCents: { gt: 0 } } },
      },
      select: { id: true },
      orderBy: { updatedAt: "asc" },
      take: limit,
    }),
  ]);

  const errors: Array<{ target: "order" | "charge"; id: string; reason: string }> = [];
  let orderIssued = 0;
  let chargeIssued = 0;

  for (const order of orders) {
    const result = await issueInvoice(order.id);
    if (result.ok) {
      orderIssued += 1;
    } else {
      errors.push({ target: "order", id: order.id, reason: result.reason });
    }
  }

  for (const charge of charges) {
    const result = await issueChargeInvoice(charge.id);
    if (result.ok) {
      chargeIssued += 1;
    } else {
      errors.push({ target: "charge", id: charge.id, reason: result.reason });
    }
  }

  return {
    ok: errors.length === 0,
    ordersScanned: orders.length,
    chargesScanned: charges.length,
    orderIssued,
    chargeIssued,
    errors,
  };
}
