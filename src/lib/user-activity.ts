import "server-only";

import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";

type UserActivityDelta = {
  portalVisits?: number;
  ordersCreated?: number;
  aiGenerationsStarted?: number;
  aiCreditsSpentUnits?: number;
  aiCreditsGrantedUnits?: number;
};

export async function recordUserActivity(
  userId: string | null | undefined,
  delta: UserActivityDelta,
): Promise<void> {
  if (!userId) return;

  const now = new Date();
  const day = utcDay(now);

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { lastActiveAt: now },
      }),
      prisma.userUsageDaily.upsert({
        where: {
          userId_day: {
            userId,
            day,
          },
        },
        create: {
          userId,
          day,
          portalVisits: delta.portalVisits ?? 0,
          ordersCreated: delta.ordersCreated ?? 0,
          aiGenerationsStarted: delta.aiGenerationsStarted ?? 0,
          aiCreditsSpentUnits: delta.aiCreditsSpentUnits ?? 0,
          aiCreditsGrantedUnits: delta.aiCreditsGrantedUnits ?? 0,
          lastActiveAt: now,
        },
        update: {
          portalVisits: { increment: delta.portalVisits ?? 0 },
          ordersCreated: { increment: delta.ordersCreated ?? 0 },
          aiGenerationsStarted: {
            increment: delta.aiGenerationsStarted ?? 0,
          },
          aiCreditsSpentUnits: {
            increment: delta.aiCreditsSpentUnits ?? 0,
          },
          aiCreditsGrantedUnits: {
            increment: delta.aiCreditsGrantedUnits ?? 0,
          },
          lastActiveAt: now,
        },
      }),
    ]);
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "user-activity" },
      extra: { userId, delta },
    });
  }
}

function utcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
