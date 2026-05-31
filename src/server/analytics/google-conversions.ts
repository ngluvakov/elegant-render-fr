import "server-only";

import { prisma } from "@/lib/db";
import {
  billingCentsFromEurCents,
  type BillingCurrency,
} from "@/lib/billing";
import {
  centsToDataLayerValue,
  type GoogleConversionCurrency,
  type GoogleDataLayerItem,
  type GooglePurchaseDataLayerEvent,
} from "@/lib/analytics/google-data-layer";

type PurchaseConversionSource =
  | "paypal_capture"
  | "paypal_capture_replay"
  | "paypal_capture_race"
  | "mock_card_success"
  | "mock_card_replay"
  | "mock_card_race"
  | "nestpay_success_page";

function normalizeCurrency(
  currency: BillingCurrency | null | undefined,
): GoogleConversionCurrency {
  return currency === "RSD" ? "RSD" : "EUR";
}

function orderValueCents(order: {
  billingCurrency: BillingCurrency | null;
  billingTotalCents: number | null;
  totalCents: number | null;
  totalEur: number;
}): number {
  if (order.billingCurrency === "RSD" && order.billingTotalCents != null) {
    return order.billingTotalCents;
  }
  return order.totalCents ?? order.totalEur * 100;
}

function itemValueCents(
  item: { totalCents: number | null; totalEur: number },
  order: {
    billingCurrency: BillingCurrency | null;
    billingEurToRsdRate: number | null;
    billingVatRate: number | null;
  },
): number {
  const eurCents = item.totalCents ?? item.totalEur * 100;
  if (order.billingCurrency !== "RSD" || !order.billingEurToRsdRate) {
    return eurCents;
  }

  return billingCentsFromEurCents(eurCents, {
    billingCurrency: "RSD",
    billingEurToRsdRate: order.billingEurToRsdRate,
    billingVatRate: order.billingVatRate ?? 0,
  });
}

export async function buildPurchaseDataLayerEvent(
  orderId: string,
  conversionSource: PurchaseConversionSource,
): Promise<GooglePurchaseDataLayerEvent | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      orderNumber: true,
      paymentProvider: true,
      buyerType: true,
      billingCurrency: true,
      billingEurToRsdRate: true,
      billingVatRate: true,
      billingTotalCents: true,
      totalCents: true,
      totalEur: true,
      containsAiCredits: true,
      items: {
        select: {
          productId: true,
          categoryId: true,
          productLabel: true,
          categoryLabel: true,
          kind: true,
          totalCents: true,
          totalEur: true,
          aiCreditQuantity: true,
        },
      },
    },
  });
  if (!order) return null;

  const currency = normalizeCurrency(order.billingCurrency);
  const value = centsToDataLayerValue(orderValueCents(order));
  const items: GoogleDataLayerItem[] = order.items.map((item) => ({
    item_id: item.productId,
    item_name: item.productLabel,
    item_category: item.categoryLabel,
    price: centsToDataLayerValue(itemValueCents(item, order)),
    quantity: 1,
    product_id: item.productId,
    category_id: item.categoryId,
    item_kind: item.kind,
    ...(item.aiCreditQuantity
      ? { ai_credit_quantity: item.aiCreditQuantity }
      : {}),
  }));

  return {
    event: "er_purchase",
    event_id: `purchase:${order.orderNumber}`,
    transaction_id: order.orderNumber,
    value,
    currency,
    transaction_value: value,
    transaction_currency: currency,
    items,
    payment_provider: order.paymentProvider,
    buyer_type: order.buyerType,
    contains_ai_credits: order.containsAiCredits,
    conversion_source: conversionSource,
  };
}
