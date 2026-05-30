/**
 * receipt-data.ts — Shared NestPay receipt builder.
 *
 * Loads + formats the customer-facing data for a NestPay-paid order:
 * line items with billing-currency labels, VAT breakdown for RSD,
 * EUR→RSD conversion snapshot, customer block, and the seven EPM 2.7
 * transaction parameters. Consumed by:
 *   - /poruci/uspeh and /poruci/neuspeh server components (HTML page).
 *   - outbox handlers payment_success_email / payment_failure_email
 *     (transactional email — adapter in outbox.ts wraps this with
 *     recipient address + retry URL).
 *
 * All money values are returned as pre-formatted strings so callers
 * never touch floats.
 */
import { prisma } from "@/lib/db";
import { billingCentsFromEurCents, formatBillingMoney } from "@/lib/billing";
import {
  PUBLIC_EUR_TO_RSD_RATE,
  PUBLIC_SERBIA_VAT_RATE,
} from "@/lib/catalog/display-currency";

export type NestpayReceiptCustomer = {
  name: string | null;
  email: string;
  address: string | null;
};

export type NestpayReceiptLineItem = {
  label: string;
  quantity: number;
  unitPriceLabel: string;
  totalLabel: string;
};

export type NestpayReceiptTotals = {
  totalLabel: string;
  vatBreakdownLabel: string | null;
  installmentCount: number | null;
};

export type NestpayReceiptConversion = {
  eurAmountLabel: string;
  rsdAmountLabel: string;
  rate: number;
} | null;

export type NestpayReceiptTransaction = {
  oid: string;
  authCode: string;
  transId: string;
  response: string;
  procReturnCode: string;
  mdStatus: string;
  hostRefNum: string;
  trxDate: Date | null;
};

export type NestpayReceiptData = {
  orderNumber: string;
  customer: NestpayReceiptCustomer;
  lineItems: NestpayReceiptLineItem[];
  totals: NestpayReceiptTotals;
  conversion: NestpayReceiptConversion;
  transaction: NestpayReceiptTransaction;
};

export async function getNestpayReceiptData(
  orderId: string,
): Promise<NestpayReceiptData | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      user: { select: { email: true, name: true } },
    },
  });
  if (!order || !order.user.email) return null;

  const billingCurrency = order.billingCurrency ?? "EUR";
  const billingVatRate =
    order.billingVatRate ??
    (billingCurrency === "RSD" ? PUBLIC_SERBIA_VAT_RATE : 0);
  const rate = order.billingEurToRsdRate ?? PUBLIC_EUR_TO_RSD_RATE;
  const snapshot = { billingCurrency, billingEurToRsdRate: rate, billingVatRate };

  const lineItems: NestpayReceiptLineItem[] = order.items.map((line) => {
    const eurTotalCents = line.totalCents ?? line.totalEur * 100;
    const quantity =
      line.kind === "ai_credits" && line.aiCreditQuantity
        ? line.aiCreditQuantity
        : 1;
    const lineGrossCents = billingCentsFromEurCents(eurTotalCents, snapshot);
    const unitGrossCents = Math.round(lineGrossCents / Math.max(1, quantity));
    return {
      label: line.productLabel,
      quantity,
      unitPriceLabel: formatBillingMoney(unitGrossCents, billingCurrency),
      totalLabel: formatBillingMoney(lineGrossCents, billingCurrency),
    };
  });

  const billingTotalCents =
    order.billingTotalCents ??
    billingCentsFromEurCents(
      order.totalCents ?? order.totalEur * 100,
      snapshot,
    );

  let vatBreakdownLabel: string | null = null;
  if (billingCurrency === "RSD" && billingVatRate > 0) {
    const grossUnits = billingTotalCents / 100;
    const netUnits = Math.round(grossUnits / (1 + billingVatRate));
    const vatUnits = grossUnits - netUnits;
    const fmt = (n: number) =>
      `${n.toLocaleString("sr-Latn-RS", { maximumFractionDigits: 0 })} RSD`;
    vatBreakdownLabel = `Osnovica ${fmt(netUnits)} + PDV (20%) ${fmt(vatUnits)}`;
  }

  const conversion: NestpayReceiptConversion =
    billingCurrency === "EUR" && order.nestpayChargedAmountCents
      ? {
          eurAmountLabel: formatBillingMoney(billingTotalCents, "EUR"),
          rsdAmountLabel: formatBillingMoney(
            order.nestpayChargedAmountCents,
            "RSD",
          ),
          rate: order.nestpayChargeRate ?? rate,
        }
      : null;

  const buyerAddressLines: string[] = [];
  if (order.companyName) buyerAddressLines.push(order.companyName);
  if (order.companyAddress) buyerAddressLines.push(order.companyAddress);
  if (order.companyTaxId) buyerAddressLines.push(`PIB ${order.companyTaxId}`);

  const responseFromRaw =
    order.nestpayResponseRaw &&
    typeof order.nestpayResponseRaw === "object" &&
    "Response" in order.nestpayResponseRaw
      ? String(
          (order.nestpayResponseRaw as Record<string, unknown>).Response,
        )
      : "";

  const transaction: NestpayReceiptTransaction = {
    oid: order.paymentId ?? "",
    authCode: order.nestpayAuthCode ?? "",
    transId: order.nestpayTransId ?? "",
    response:
      order.nestpayProcReturnCode === "00" ? "Approved" : responseFromRaw,
    procReturnCode: order.nestpayProcReturnCode ?? "",
    mdStatus: order.nestpayMdStatus ?? "",
    hostRefNum: order.nestpayHostRefNum ?? "",
    trxDate: order.nestpayExtraTrxDate,
  };

  return {
    orderNumber: order.orderNumber,
    customer: {
      name: order.user.name,
      email: order.user.email,
      address: buyerAddressLines.length ? buyerAddressLines.join(", ") : null,
    },
    lineItems,
    totals: {
      totalLabel: formatBillingMoney(billingTotalCents, billingCurrency),
      vatBreakdownLabel,
      installmentCount:
        order.nestpayInstallmentCount && order.nestpayInstallmentCount > 1
          ? order.nestpayInstallmentCount
          : null,
    },
    conversion,
    transaction,
  };
}
