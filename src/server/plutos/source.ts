import { prisma } from "@/lib/db";
import {
  invoiceGrossCentsFromEurCents,
  invoiceVatRateForBuyer,
} from "@/lib/invoice-data";
import type { PlutosInvoiceSource } from "./payload";
import type { PlutosTarget } from "./types";

/**
 * source.ts — Assemble the normalized invoice source Plutos ingest needs,
 * straight from the database. Mirrors the line/buyer construction in
 * issue-invoice.ts / issue-charge-invoice.ts so the numbers Plutos books match
 * the numbers on the PDF the customer received.
 *
 * Returns null when the target is missing or its invoice has not been issued
 * yet (no invoiceNumber / invoiceIssuedAt) — the caller treats that as
 * "nothing to sync".
 */
export async function loadPlutosInvoiceSource(
  target: PlutosTarget,
  targetId: string,
): Promise<PlutosInvoiceSource | null> {
  return target === "order"
    ? loadOrderSource(targetId)
    : loadChargeSource(targetId);
}

async function loadOrderSource(
  orderId: string,
): Promise<PlutosInvoiceSource | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: { select: { name: true, email: true } } },
  });
  if (!order || !order.invoiceNumber || !order.invoiceIssuedAt) return null;

  const invoiceBuyer = {
    buyerType: order.buyerType,
    buyerCountryCode: order.buyerCountryCode,
    companyCountryCode: order.companyCountryCode,
    billingCurrency: order.billingCurrency,
    billingVatRate: order.billingVatRate,
  };
  const isBusiness = order.buyerType === "business";

  const lines = order.items
    .filter((it) => (it.totalCents ?? Math.round(it.totalEur * 100)) > 0)
    .map((it) => {
      const cents = it.totalCents ?? Math.round(it.totalEur * 100);
      return {
        description: it.productLabel,
        grossUnitCents: invoiceGrossCentsFromEurCents(cents, invoiceBuyer),
        quantity: 1,
      };
    });

  return {
    target: "order",
    targetId: orderId,
    invoiceNumber: order.invoiceNumber,
    issueDate: order.invoiceIssuedAt,
    buyerType: order.buyerType,
    buyer: {
      name: isBusiness
        ? order.companyName ?? "-"
        : order.user.name ?? order.user.email ?? "Kupac",
      email: order.user.email,
      countryCode: isBusiness ? order.companyCountryCode : order.buyerCountryCode,
      address: isBusiness ? order.companyAddress : order.buyerAddress,
      city: isBusiness ? null : order.buyerCity,
      postalCode: isBusiness ? null : order.buyerPostalCode,
      vatNumber: isBusiness ? order.companyTaxId : null,
    },
    currency: "EUR",
    vatRate: invoiceVatRateForBuyer(invoiceBuyer),
    lines,
    totalCents: order.totalCents ?? Math.round(order.totalEur * 100),
    payment: {
      provider: order.paymentProvider,
      paymentId: order.paymentId,
      captureId: order.paypalCaptureId,
      paidAt: order.invoiceIssuedAt,
    },
  };
}

async function loadChargeSource(
  chargeId: string,
): Promise<PlutosInvoiceSource | null> {
  const charge = await prisma.orderCharge.findUnique({
    where: { id: chargeId },
    include: {
      items: true,
      order: { include: { user: { select: { name: true, email: true } } } },
    },
  });
  if (!charge || !charge.invoiceNumber || !charge.invoiceIssuedAt) return null;

  const order = charge.order;
  // A charge may carry its own buyer identity; when it does, use it wholesale,
  // otherwise inherit the order's. Mirrors issue-charge-invoice.ts.
  const overrides = charge.buyerType != null;
  const buyerType = charge.buyerType ?? order.buyerType;
  const companyName = overrides ? charge.companyName : order.companyName;
  const companyTaxId = overrides ? charge.companyTaxId : order.companyTaxId;
  const companyAddress = overrides ? charge.companyAddress : order.companyAddress;
  const companyCountryCode = overrides
    ? charge.companyCountryCode
    : order.companyCountryCode;
  const buyerCountryCode = charge.buyerCountryCode ?? order.buyerCountryCode;

  const invoiceBuyer = {
    buyerType,
    buyerCountryCode,
    companyCountryCode,
    billingCurrency: charge.billingCurrency ?? order.billingCurrency,
    billingVatRate: charge.billingVatRate ?? order.billingVatRate,
  };
  const isBusiness = buyerType === "business";

  const lines = charge.items
    .filter((it) => it.amountCents > 0 && it.quantity > 0)
    .map((it) => ({
      description: it.label,
      grossUnitCents: invoiceGrossCentsFromEurCents(it.amountCents, invoiceBuyer),
      quantity: it.quantity,
    }));

  return {
    target: "charge",
    targetId: chargeId,
    invoiceNumber: charge.invoiceNumber,
    issueDate: charge.invoiceIssuedAt,
    buyerType,
    buyer: {
      name: isBusiness
        ? companyName ?? "-"
        : order.user.name ?? order.user.email ?? "Kupac",
      email: order.user.email,
      countryCode: isBusiness ? companyCountryCode : buyerCountryCode,
      address: isBusiness ? companyAddress : null,
      city: null,
      postalCode: null,
      vatNumber: isBusiness ? companyTaxId : null,
    },
    currency: "EUR",
    vatRate: invoiceVatRateForBuyer(invoiceBuyer),
    lines,
    totalCents: charge.totalCents,
    payment: {
      provider: charge.paymentProvider,
      paymentId: charge.paymentId,
      captureId: charge.paypalCaptureId,
      paidAt: charge.paidAt,
    },
  };
}
