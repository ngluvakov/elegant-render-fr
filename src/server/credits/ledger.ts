/**
 * ledger.ts — internal AI-credit ledger (expire/spend/refund).
 *
 * Deliberately a PLAIN server module, not "use server": these functions
 * accept an arbitrary userId/units and have no auth check of their own,
 * so they must not be registered as publicly callable server-action
 * endpoints. They are called exclusively by authorized actions
 * (ai-studio.ts) and server hooks. Credit purchase
 * (applyPurchasedAiCreditsForOrder) stays in actions/ai-credits.ts
 * because it is part of the payment flow.
 */
import { prisma } from "@/lib/db";
import { recordUserActivity } from "@/lib/user-activity";

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
        note: "Crédits AI Studio expirés",
      },
    }),
  ]);
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

  const result = await prisma.$transaction(async (tx) => {
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
      if (!user) return { error: "Utilisateur introuvable." };
      return {
        error: "Vous n’avez pas assez de crédits IA.",
        balanceAfterUnits: user.aiCreditBalanceUnits,
      };
    }

    const updated = await tx.user.findUnique({
      where: { id: userId },
      select: { aiCreditBalanceUnits: true },
    });
    if (!updated) return { error: "Utilisateur introuvable." };

    await tx.aiCreditTransaction.create({
      data: {
        userId,
        generationId,
        type: "spend",
        units: -units,
        balanceAfterUnits: updated.aiCreditBalanceUnits,
        note: note ?? "Génération AI Studio",
      },
    });

    return { balanceAfterUnits: updated.aiCreditBalanceUnits };
  });

  if (!result.error) {
    await recordUserActivity(userId, { aiCreditsSpentUnits: units });
  }

  return result;
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
        note: note ?? "Remboursement AI Studio pour une génération échouée",
      },
    });

    return { balanceAfterUnits: user.aiCreditBalanceUnits };
  });
}
