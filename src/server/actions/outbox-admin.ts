/**
 * outbox-admin.ts — Admin actions for the OutboxEvent table.
 *
 * Today exposes a single action: requeue a failed event so the cron
 * processor picks it up on the next tick. Useful for transient
 * Resend / Supabase / network failures that exhausted maxAttempts —
 * admin reads /portal/admin/outbox, fixes the underlying cause
 * (e.g. domain verification), and retries.
 *
 * Restricted to `failed` rows. Running rows are in-flight; succeeded
 * rows would double-send (and cause data corruption for events like
 * invoice issuance). Pending rows don't need a retry — they're
 * already queued.
 */
"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import { requireAdmin } from "@/server/actions/admin";

export type RetryOutboxResult =
  | { ok: true }
  | { ok: false; reason: string };

export async function retryOutboxEvent(
  eventId: string,
): Promise<RetryOutboxResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, reason: "not_admin" };
  }

  try {
    const event = await prisma.outboxEvent.findUnique({
      where: { id: eventId },
      select: { id: true, status: true, type: true, attempts: true },
    });
    if (!event) return { ok: false, reason: "event_not_found" };

    if (event.status !== "failed") {
      return { ok: false, reason: `cannot_retry_${event.status}` };
    }

    await prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: "pending",
        // Reset the attempt counter so the cron's exponential backoff
        // starts fresh — admin has presumably fixed the underlying
        // cause, and we don't want to immediately fall back to a
        // 16-minute delay on the new attempt.
        attempts: 0,
        nextAttemptAt: new Date(),
        lastError: null,
      },
    });

    await recordAuditLog({
      action: "outbox.retried",
      entityType: "OutboxEvent",
      entityId: eventId,
      metadata: {
        actorId: admin.id,
        eventType: event.type,
        previousAttempts: event.attempts,
      },
    });

    revalidatePath("/portal/admin/outbox");

    return { ok: true };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "outbox", flow: "admin-retry" },
      extra: { eventId },
    });
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "unknown",
    };
  }
}
