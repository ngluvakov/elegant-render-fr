/**
 * audit.ts — Forensic logging of consequential admin and system actions.
 *
 * Required by ISO 27001:2022 control A.8.15 (Logging) and supports GDPR
 * Art. 32 (security of processing — accountability for who did what).
 *
 * Use:
 *   await recordAuditLog({
 *     action: "order.transition",
 *     entityType: "Order",
 *     entityId: order.id,
 *     metadata: { from: "draft", to: "awaiting_payment" },
 *   });
 *
 * The helper is best-effort: it captures the session and request
 * headers itself, and a logging failure never throws — the calling
 * action stays alive even if the audit table is unreachable. Errors
 * surface to Sentry so the gap is visible.
 *
 * actorEmail is captured at log time even though we have a foreign-key
 * relation. When a user is later deleted, the FK is set to null but
 * the email column keeps the trail readable for compliance.
 */

import { headers } from "next/headers";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

export type AuditLogInput = {
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  // Override actor if the action runs outside an interactive session
  // (e.g. cron) or when the actor is known but not the current session
  // user.
  actor?: { id: string; email: string | null };
};

export async function recordAuditLog(input: AuditLogInput): Promise<void> {
  try {
    let actorId: string | null = input.actor?.id ?? null;
    let actorEmail: string | null = input.actor?.email ?? null;

    if (!actorId) {
      const session = await auth();
      if (session?.user?.id) {
        actorId = session.user.id;
        actorEmail = session.user.email ?? null;
      }
    }

    let ipAddress: string | null = null;
    let userAgent: string | null = null;
    try {
      const h = await headers();
      // x-forwarded-for is set by Vercel's edge; first hop is the
      // originating client. Fall back to x-real-ip if the platform
      // strips xff.
      const forwardedFor = h.get("x-forwarded-for");
      ipAddress =
        forwardedFor?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
      userAgent = h.get("user-agent") ?? null;
    } catch {
      // headers() throws when called outside a request scope (e.g. cron).
      // Leave ip/ua null in that case.
    }

    await prisma.auditLog.create({
      data: {
        actorId,
        actorEmail,
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata: input.metadata ?? Prisma.JsonNull,
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "audit-log" },
      extra: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
      },
    });
  }
}
