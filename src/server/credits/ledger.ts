/**
 * ledger.ts — interni AI-kredit ledger (expire/spend/refund).
 *
 * Namerno OBIČAN server modul, ne "use server": ove funkcije primaju
 * proizvoljan userId/units i nemaju sopstvenu auth proveru, pa ne smeju
 * biti registrovane kao javno pozivljivi server-action endpointi.
 * Pozivaju ih isključivo autorizovane akcije (ai-studio.ts) i server
 * hook-ovi. Kupovinu kredita (applyPurchasedAiCreditsForOrder) i dalje
 * drži actions/ai-credits.ts jer je deo platnog toka.
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
        note: "AI Studio krediti istekli",
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
        note: note ?? "AI Studio refund za neuspelu obradu",
      },
    });

    return { balanceAfterUnits: user.aiCreditBalanceUnits };
  });
}
