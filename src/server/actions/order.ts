"use server";

import { prisma } from "@/lib/db";
import { calculateQuote, type QuoteItem } from "@/lib/catalog/calculate";
import { generateOrderNumber } from "@/lib/order/generate-number";
import { syncNewDeal } from "@/server/bitrix/sync-deal";
import { syncFileToDeal } from "@/server/bitrix/sync-file";

export type OrderResult = {
  error?: string;
  orderId?: string;
  orderNumber?: string;
};

export async function createOrder(
  userId: string,
  quoteItems: QuoteItem[],
  customerNote?: string,
): Promise<OrderResult> {
  if (!userId) return { error: "Korisnik nije identifikovan." };
  if (!quoteItems.length) return { error: "Ponuda je prazna." };

  // Server-side price verification
  const calculation = calculateQuote(quoteItems);

  if (calculation.total <= 0) {
    return { error: "Ukupna cena mora biti veća od 0." };
  }

  const orderNumber = generateOrderNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      totalEur: calculation.total,
      customerNote: customerNote || null,
      items: {
        create: calculation.items.map((item) => ({
          productId: item.productId,
          categoryId: quoteItems.find((q) => q.instanceId === item.instanceId)
            ?.categoryId ?? "",
          productLabel: item.productLabel,
          categoryLabel: item.categoryLabel,
          basePriceEur: item.basePriceEur,
          totalEur: item.totalEur,
          addOnsJson: item.addOns,
          durationSeconds: item.durationSeconds ?? null,
          durationDiscount: item.durationDiscount ?? null,
        })),
      },
      statusEvents: {
        create: {
          toStatus: "draft",
          note: "Porudžbina kreirana",
        },
      },
    },
  });

  // Sync to Bitrix24
  syncNewDeal(order.id).catch((err) => {
    console.error("[Bitrix24] Deal creation failed:", err);
  });

  return { orderId: order.id, orderNumber: order.orderNumber };
}

export async function confirmFileUpload(
  orderId: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  storagePath: string,
) {
  const file = await prisma.orderFile.create({
    data: {
      orderId,
      fileName,
      fileSize,
      mimeType,
      storagePath,
      kind: "source",
    },
  });

  syncFileToDeal(file.id).catch((err) => {
    console.error("[Bitrix24] File sync failed:", err);
  });
}
