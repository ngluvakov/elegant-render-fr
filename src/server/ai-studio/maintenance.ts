import { prisma } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase";
import { formatCreditsFromUnits } from "@/lib/ai-studio/catalog";
import { enqueueOutboxEvent } from "@/lib/outbox";
import { recoverAiStudioGenerationJobs } from "@/server/actions/ai-studio";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function runAiStudioMaintenance(now = new Date()) {
  const [expiredCredits, reminders, files, recoveredJobs] = await Promise.all([
    expireStaleCreditBalances(now),
    sendCreditExpiryReminders(now),
    removeExpiredGenerationFiles(now),
    recoverAiStudioGenerationJobs(),
  ]);

  return {
    expiredCreditBalances: expiredCredits,
    remindersSent: reminders,
    storageFilesRemoved: files,
    recoveredJobs,
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
    const queued = await enqueueCreditExpiryReminder(user, 30, now);
    if (queued) {
      sent += 1;
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
    const queued = await enqueueCreditExpiryReminder(user, 7, now);
    if (queued) {
      sent += 1;
    }
  }

  return sent;
}

async function enqueueCreditExpiryReminder(
  user: {
    id: string;
    email: string;
    aiCreditBalanceUnits: number;
    aiCreditsExpireAt: Date | null;
  },
  daysLeft: 30 | 7,
  now: Date,
) {
  if (!user.aiCreditsExpireAt) return false;
  const expiresAt = user.aiCreditsExpireAt;

  try {
    return await prisma.$transaction(async (tx) => {
      const result =
        daysLeft === 30
          ? await tx.user.updateMany({
              where: { id: user.id, aiCreditsReminder30SentAt: null },
              data: { aiCreditsReminder30SentAt: now },
            })
          : await tx.user.updateMany({
              where: { id: user.id, aiCreditsReminder7SentAt: null },
              data: { aiCreditsReminder7SentAt: now },
            });

      if (result.count === 0) return false;

      const expiresAtKey = expiresAt.toISOString().slice(0, 10);
      await enqueueOutboxEvent({
        tx,
        type: "ai_credits_expiry_reminder_email",
        payload: {
          to: user.email,
          creditsLabel: formatCreditsFromUnits(user.aiCreditBalanceUnits),
          expiresAt: expiresAt.toISOString(),
          daysLeft,
        },
        idempotencyKey: `ai_credit_expiry:${user.id}:${daysLeft}:${expiresAtKey}`,
      });

      return true;
    });
  } catch (err) {
    console.error(`[AI Studio] ${daysLeft}-day credit reminder enqueue failed:`, err);
    return false;
  }
}

async function removeExpiredGenerationFiles(now: Date) {
  const expired = await prisma.aiGeneration.findMany({
    where: { expiresAt: { lt: now } },
    select: {
      id: true,
      inputStoragePath: true,
      maskStoragePath: true,
      referenceStoragePath: true,
      resultStoragePath: true,
    },
    take: 500,
  });
  const expiredIds = expired.map((generation) => generation.id);
  const expiredReferenceImages =
    expiredIds.length > 0
      ? await prisma.aiGenerationReferenceImage.findMany({
          where: { generationId: { in: expiredIds } },
          select: { storagePath: true },
        })
      : [];

  const candidates = new Set<string>();
  for (const generation of expired) {
    candidates.add(generation.inputStoragePath);
    if (generation.maskStoragePath) candidates.add(generation.maskStoragePath);
    if (generation.referenceStoragePath) {
      candidates.add(generation.referenceStoragePath);
    }
    if (generation.resultStoragePath) candidates.add(generation.resultStoragePath);
  }
  for (const reference of expiredReferenceImages) {
    candidates.add(reference.storagePath);
  }

  if (candidates.size === 0) return 0;
  const paths = [...candidates];

  const stillActive = await prisma.aiGeneration.findMany({
    where: {
      expiresAt: { gte: now },
      OR: [
        { inputStoragePath: { in: paths } },
        { maskStoragePath: { in: paths } },
        { referenceStoragePath: { in: paths } },
        { resultStoragePath: { in: paths } },
      ],
    },
    select: {
      inputStoragePath: true,
      maskStoragePath: true,
      referenceStoragePath: true,
      resultStoragePath: true,
    },
  });
  const activeReferenceImages = await prisma.aiGenerationReferenceImage.findMany({
    where: {
      storagePath: { in: paths },
      generation: { expiresAt: { gte: now } },
    },
    select: { storagePath: true },
  });

  for (const generation of stillActive) {
    candidates.delete(generation.inputStoragePath);
    if (generation.maskStoragePath) candidates.delete(generation.maskStoragePath);
    if (generation.referenceStoragePath) {
      candidates.delete(generation.referenceStoragePath);
    }
    if (generation.resultStoragePath) candidates.delete(generation.resultStoragePath);
  }
  for (const reference of activeReferenceImages) {
    candidates.delete(reference.storagePath);
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
