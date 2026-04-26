import { prisma } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase";
import { formatCreditsFromUnits } from "@/lib/ai-studio/catalog";
import { sendAiCreditsExpiryReminderEmail } from "@/lib/email";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function runAiStudioMaintenance(now = new Date()) {
  const [expiredCredits, reminders, files] = await Promise.all([
    expireStaleCreditBalances(now),
    sendCreditExpiryReminders(now),
    removeExpiredGenerationFiles(now),
  ]);

  return {
    expiredCreditBalances: expiredCredits,
    remindersSent: reminders,
    storageFilesRemoved: files,
  };
}

async function expireStaleCreditBalances(now: Date) {
  const users = await prisma.user.findMany({
    where: {
      aiCreditBalanceUnits: { gt: 0 },
      aiCreditsExpireAt: { lt: now },
    },
    select: {
      id: true,
      aiCreditBalanceUnits: true,
    },
    take: 200,
  });

  for (const user of users) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          aiCreditBalanceUnits: 0,
          aiCreditsExpireAt: null,
          aiCreditsReminder30SentAt: null,
          aiCreditsReminder7SentAt: null,
        },
      }),
      prisma.aiCreditTransaction.create({
        data: {
          userId: user.id,
          type: "expiry",
          units: -user.aiCreditBalanceUnits,
          balanceAfterUnits: 0,
          note: "AI Studio krediti istekli",
        },
      }),
    ]);
  }

  return users.length;
}

async function sendCreditExpiryReminders(now: Date) {
  const thirtyDays = new Date(now.getTime() + 30 * DAY_MS);
  const sevenDays = new Date(now.getTime() + 7 * DAY_MS);
  let sent = 0;

  const thirtyDayUsers = await prisma.user.findMany({
    where: {
      aiCreditBalanceUnits: { gt: 0 },
      aiCreditsExpireAt: { gt: sevenDays, lte: thirtyDays },
      aiCreditsReminder30SentAt: null,
    },
    select: {
      id: true,
      email: true,
      aiCreditBalanceUnits: true,
      aiCreditsExpireAt: true,
    },
    take: 200,
  });

  for (const user of thirtyDayUsers) {
    if (!user.aiCreditsExpireAt) continue;
    try {
      await sendAiCreditsExpiryReminderEmail({
        to: user.email,
        creditsLabel: formatCreditsFromUnits(user.aiCreditBalanceUnits),
        expiresAt: user.aiCreditsExpireAt,
        daysLeft: 30,
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { aiCreditsReminder30SentAt: now },
      });
      sent += 1;
    } catch (err) {
      console.error("[AI Studio] 30-day credit reminder failed:", err);
    }
  }

  const sevenDayUsers = await prisma.user.findMany({
    where: {
      aiCreditBalanceUnits: { gt: 0 },
      aiCreditsExpireAt: { gt: now, lte: sevenDays },
      aiCreditsReminder7SentAt: null,
    },
    select: {
      id: true,
      email: true,
      aiCreditBalanceUnits: true,
      aiCreditsExpireAt: true,
    },
    take: 200,
  });

  for (const user of sevenDayUsers) {
    if (!user.aiCreditsExpireAt) continue;
    try {
      await sendAiCreditsExpiryReminderEmail({
        to: user.email,
        creditsLabel: formatCreditsFromUnits(user.aiCreditBalanceUnits),
        expiresAt: user.aiCreditsExpireAt,
        daysLeft: 7,
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { aiCreditsReminder7SentAt: now },
      });
      sent += 1;
    } catch (err) {
      console.error("[AI Studio] 7-day credit reminder failed:", err);
    }
  }

  return sent;
}

async function removeExpiredGenerationFiles(now: Date) {
  const expired = await prisma.aiGeneration.findMany({
    where: { expiresAt: { lt: now } },
    select: {
      inputStoragePath: true,
      maskStoragePath: true,
      resultStoragePath: true,
    },
    take: 500,
  });

  const candidates = new Set<string>();
  for (const generation of expired) {
    candidates.add(generation.inputStoragePath);
    if (generation.maskStoragePath) candidates.add(generation.maskStoragePath);
    if (generation.resultStoragePath) candidates.add(generation.resultStoragePath);
  }

  if (candidates.size === 0) return 0;
  const paths = [...candidates];

  const stillActive = await prisma.aiGeneration.findMany({
    where: {
      expiresAt: { gte: now },
      OR: [
        { inputStoragePath: { in: paths } },
        { maskStoragePath: { in: paths } },
        { resultStoragePath: { in: paths } },
      ],
    },
    select: {
      inputStoragePath: true,
      maskStoragePath: true,
      resultStoragePath: true,
    },
  });

  for (const generation of stillActive) {
    candidates.delete(generation.inputStoragePath);
    if (generation.maskStoragePath) candidates.delete(generation.maskStoragePath);
    if (generation.resultStoragePath) candidates.delete(generation.resultStoragePath);
  }

  const removable = [...candidates];
  for (let i = 0; i < removable.length; i += 100) {
    const chunk = removable.slice(i, i + 100);
    const { error } = await getSupabaseAdmin()
      .storage.from("order-files")
      .remove(chunk);
    if (error) {
      console.error("[AI Studio] Storage cleanup failed:", error);
    }
  }

  return removable.length;
}
