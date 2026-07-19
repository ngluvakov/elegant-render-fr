import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { enqueueOutboxEvent, kickOutboxSoon } from "@/lib/outbox";
import { resolvePlutosConfig, isPlutosEligible } from "./config";
import { plutosOutboxKey } from "./ids";
import type { PlutosTarget } from "./types";

/**
 * producer.ts — Enqueue side of the Plutos integration.
 *
 * Two entry points share one invariant: there is only ever a single outbox
 * idempotency key per target, so no path can fan out into duplicate events.
 */

export type EnsureOutcome = "created" | "reset" | "skipped";

/**
 * Ensure an ingest event is queued: create it when absent, or put a *failed*
 * one back in the queue. A pending/running/succeeded event is left untouched.
 * Assumes the caller has already checked config, cutoff, and that the invoice
 * is issued. Used by the admin action and the reconciliation pass.
 */
export async function ensurePlutosSyncQueued(
  target: PlutosTarget,
  targetId: string,
): Promise<EnsureOutcome> {
  const idempotencyKey = plutosOutboxKey(target, targetId);
  const existing = await prisma.outboxEvent.findUnique({
    where: { idempotencyKey },
    select: { id: true, status: true },
  });

  if (!existing) {
    await enqueueOutboxEvent({
      type: "plutos_invoice_requested",
      payload: { target, targetId },
      idempotencyKey,
    });
    return "created";
  }

  if (existing.status === "failed") {
    await prisma.outboxEvent.update({
      where: { id: existing.id },
      data: {
        status: "pending",
        attempts: 0,
        nextAttemptAt: new Date(),
        lastError: null,
      },
    });
    kickOutboxSoon();
    return "reset";
  }

  return "skipped";
}

/**
 * Best-effort producer for the issue pipeline. NEVER throws — a Plutos enqueue
 * failure must not change a successful local invoice result. No-ops when the
 * integration is disabled/misconfigured or the invoice predates the cutoff.
 * Idempotent: safe to call again on the already-issued return path.
 */
export async function enqueuePlutosSyncIfEligible(
  target: PlutosTarget,
  targetId: string,
  invoiceIssuedAt: Date | null,
): Promise<void> {
  try {
    const cfg = resolvePlutosConfig();
    if (!cfg.ok) return;
    if (!isPlutosEligible(invoiceIssuedAt, cfg.config.from)) return;
    await enqueueOutboxEvent({
      type: "plutos_invoice_requested",
      payload: { target, targetId },
      idempotencyKey: plutosOutboxKey(target, targetId),
    });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "plutos", flow: "producer" },
      extra: { target, targetId },
    });
  }
}
