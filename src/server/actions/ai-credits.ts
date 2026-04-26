"use server";

import { prisma } from "@/lib/db";
import {
  AI_CREDIT_EXPIRES_AFTER_MONTHS,
  addMonths,
} from "@/lib/ai-studio/catalog";

export async function expireAiCreditsIfNeeded(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      aiCreditBalanceUnits: true,
      aiCreditsExpireAt: true,
    },
  });

  if (
    !user ||
    user.aiCreditBalanceUnits <= 0 ||
    !user.aiCreditsExpireAt ||
    user.aiCreditsExpireAt > new Date()
  ) {
    return;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        aiCreditBalanceUnits: 0,
        aiCreditsExpireAt: null,
        aiCreditsReminder30SentAt: null,
        aiCreditsReminder7SentAt: null,
      },
    }),
    prisma.aiCreditTransaction.create({
      data: {
        userId,
        type: "expiry",
        units: -user.aiCreditBalanceUnits,
        balanceAfterUnits: 0,
        note: "AI Studio krediti istekli",
      },
    }),
  ]);
}

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
  const expiresAt = addMonths(new Date(), AI_CREDIT_EXPIRES_AFTER_MONTHS);

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

export async function spendAiCreditUnits({
  userId,
  units,
  generationId,
  note,
}: {
  userId: string;
  units: number;
  generationId?: string;
  note?: string;
}): Promise<{ error?: string; balanceAfterUnits?: number }> {
  await expireAiCreditsIfNeeded(userId);

  if (units <= 0) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { aiCreditBalanceUnits: true },
    });
    return { balanceAfterUnits: user?.aiCreditBalanceUnits ?? 0 };
  }

  return prisma.$transaction(async (tx) => {
    const claimed = await tx.user.updateMany({
      where: {
        id: userId,
        aiCreditBalanceUnits: { gte: units },
      },
      data: { aiCreditBalanceUnits: { decrement: units } },
    });

    if (claimed.count === 0) {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { aiCreditBalanceUnits: true },
      });
      if (!user) return { error: "Korisnik nije pronađen." };
      return {
        error: "Nemate dovoljno AI kredita.",
        balanceAfterUnits: user.aiCreditBalanceUnits,
      };
    }

    const updated = await tx.user.findUnique({
      where: { id: userId },
      select: { aiCreditBalanceUnits: true },
    });
    if (!updated) return { error: "Korisnik nije pronađen." };

    await tx.aiCreditTransaction.create({
      data: {
        userId,
        generationId,
        type: "spend",
        units: -units,
        balanceAfterUnits: updated.aiCreditBalanceUnits,
        note: note ?? "AI Studio obrada",
      },
    });

    return { balanceAfterUnits: updated.aiCreditBalanceUnits };
  });
}

export async function refundAiCreditUnits({
  userId,
  units,
  generationId,
  note,
}: {
  userId: string;
  units: number;
  generationId?: string;
  note?: string;
}): Promise<{ balanceAfterUnits?: number }> {
  if (units <= 0) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { aiCreditBalanceUnits: true },
    });
    return { balanceAfterUnits: user?.aiCreditBalanceUnits ?? 0 };
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { aiCreditBalanceUnits: { increment: units } },
      select: { aiCreditBalanceUnits: true },
    });

    await tx.aiCreditTransaction.create({
      data: {
        userId,
        generationId,
        type: "refund",
        units,
        balanceAfterUnits: user.aiCreditBalanceUnits,
        note: note ?? "AI Studio refund za neuspelu obradu",
      },
    });

    return { balanceAfterUnits: user.aiCreditBalanceUnits };
  });
}
