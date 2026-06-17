import "server-only";

import { prisma } from "@/lib/db";
import {
  centsToDataLayerValue,
  type GoogleDataLayerItem,
  type GooglePurchaseDataLayerEvent,
} from "@/lib/analytics/google-data-layer";

type PurchaseConversionSource =
  | "mock_card_success"
  | "mock_card_replay"
  | "mock_card_race"
  | "nestpay_success_page";

function orderValueCents(order: {
  billingTotalCents: number | null;
  totalCents: number | null;
  totalRsd: number;
}): number {
  return order.billingTotalCents ?? order.totalCents ?? order.totalRsd * 100;
}

function itemValueCents(item: {
  totalCents: number | null;
  totalRsd: number;
}): number {
  return item.totalCents ?? item.totalRsd * 100;
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
      totalRsd: true,
      containsAiCredits: true,
      items: {
        select: {
          productId: true,
          categoryId: true,
          productLabel: true,
          categoryLabel: true,
          kind: true,
          totalCents: true,
          totalRsd: true,
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
    event: "er_purchase",
    event_id: `purchase:${order.orderNumber}`,
    transaction_id: order.orderNumber,
    value,
    currency: "RSD",
    transaction_value: value,
    transaction_currency: "RSD",
    items,
    payment_provider: order.paymentProvider,
    buyer_type: order.buyerType,
    contains_ai_credits: order.containsAiCredits,
    conversion_source: conversionSource,
  };
}
