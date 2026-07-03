"use server";

// Expire/spend/refund ledger živi u @/server/credits/ledger.ts (običan
// modul) da ne bi bio izložen kao javni server-action endpoint. Ovde
// ostaje samo kupovina kredita, koju poziva platni hook (payment.ts).
import { prisma } from "@/lib/db";
import {
  addMonths,
} from "@/lib/ai-studio/catalog";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";

export async function applyPurchasedAiCreditsForOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        where: { kind: "ai_credits" },
        select: {
          aiCreditUnits: true,
          totalCents: true,
        },
      },
    },
  });

  if (!order || order.aiCreditsAppliedAt || order.items.length === 0) return;

  const units = order.items.reduce(
    (sum, item) => sum + (item.aiCreditUnits ?? 0),
    0,
  );
  if (units <= 0) return;

  const amountCents = order.items.reduce(
    (sum, item) => sum + (item.totalCents ?? 0),
    0,
  );
  const pricingCatalog = await getPublishedPricingCatalog();
  const expiresAt = addMonths(
    new Date(),
    pricingCatalog.settings.aiCreditExpiresAfterMonths,
  );

  await prisma.$transaction(async (tx) => {
    const claim = await tx.order.updateMany({
      where: { id: orderId, aiCreditsAppliedAt: null },
      data: { aiCreditsAppliedAt: new Date() },
    });
    if (claim.count === 0) return;

    const user = await tx.user.update({
      where: { id: order.userId },
      data: {
        aiCreditBalanceUnits: { increment: units },
        aiCreditsExpireAt: expiresAt,
        aiCreditsReminder30SentAt: null,
        aiCreditsReminder7SentAt: null,
      },
      select: { aiCreditBalanceUnits: true },
    });

    await tx.aiCreditTransaction.create({
      data: {
        userId: order.userId,
        orderId,
        type: "purchase",
        units,
        balanceAfterUnits: user.aiCreditBalanceUnits,
        amountCents,
        note: "Kupovina AI Studio kredita",
      },
    });

  });
}

