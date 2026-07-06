import "server-only";

import { prisma } from "@/lib/db";
import {
  centsToDataLayerValue,
  type GoogleDataLayerItem,
  type GooglePurchaseDataLayerEvent,
} from "@/lib/analytics/google-data-layer";

export type PurchaseConversionSource =
  | "paypal_capture"
  | "paypal_capture_replay"
  | "paypal_capture_race"
  | "paypal_webhook"
  | "paypal_reconciler"
  | "mock_card_success"
  | "mock_card_replay"
  | "mock_card_race";

function orderValueCents(order: {
  billingTotalCents: number | null;
  totalCents: number | null;
  totalEur: number;
}): number {
  return order.billingTotalCents ?? order.totalCents ?? order.totalEur * 100;
}

function itemValueCents(item: {
  totalCents: number | null;
  totalEur: number;
}): number {
  return item.totalCents ?? item.totalEur * 100;
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

  const value = centsToDataLayerValue(orderValueCents(order));
  const items: GoogleDataLayerItem[] = order.items.map((item) => ({
    item_id: item.productId,
    item_name: item.productLabel,
    item_category: item.categoryLabel,
    price: centsToDataLayerValue(itemValueCents(item)),
    quantity: 1,
    product_id: item.productId,
    category_id: item.categoryId,
    item_kind: item.kind,
    ...(item.aiCreditQuantity
      ? { ai_credit_quantity: item.aiCreditQuantity }
      : {}),
  }));

  return {
    event: "purchase",
    event_id: `purchase:${order.orderNumber}`,
    transaction_id: order.orderNumber,
    value,
    currency: "EUR",
    ecommerce: {
      transaction_id: order.orderNumber,
      value,
      currency: "EUR",
      items,
    },
    items,
    payment_provider: order.paymentProvider,
    buyer_type: order.buyerType,
    contains_ai_credits: order.containsAiCredits,
    conversion_source: conversionSource,
  };
}
