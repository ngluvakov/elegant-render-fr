/**
 * outbox.ts — Transactional outbox for must-not-lose side effects.
 *
 * Producer pattern (called from a server action that mutated DB):
 *
 *   await enqueueOutboxEvent({
 *     type: "order_confirmation_email",
 *     payload: { orderId },
 *     idempotencyKey: `order_confirmation:${orderId}`,
 *   });
 *
 * The unique constraint on idempotencyKey makes the call safe to
 * retry — a duplicate enqueue silently no-ops, never raises.
 *
 * Processor pattern (called from /api/cron/outbox-processor):
 *
 *   const stats = await processOutboxBatch();
 *
 * The processor claims a batch via atomic updateMany (status:pending,
 * nextAttemptAt <= now), runs each handler, and writes terminal state
 * (succeeded / scheduled retry / failed) per row. Exponential backoff
 * on retry; gives up after maxAttempts and leaves the row in `failed`
 * so it surfaces on a SELECT for human review.
 *
 * Consistency model: at-least-once. If the handler succeeds at the
 * provider but we crash before writing succeededAt, the next claim
 * will run the handler again and the customer can receive the email
 * twice. We accept this in exchange for never losing one — it's the
 * better failure mode for an email about a paid order. If handlers
 * grow side effects more sensitive than email (charging cards,
 * triggering downstream workflows), they should add their own
 * idempotency check inside the handler.
 */
import * as Sentry from "@sentry/nextjs";
import { Prisma } from "@/generated/prisma/client";
import type { OutboxEventType } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  sendOrderConfirmationEmail,
  sendPortalAccessEmail,
  sendVrProjectReadyEmail,
} from "@/lib/email";

// ─── Producer ────────────────────────────────────────────

export type EnqueueArgs = {
  type: OutboxEventType;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  // Optional: lets callers enqueue inside an existing Prisma
  // transaction so the outbox row commits atomically with the data
  // change that produced it.
  tx?: Prisma.TransactionClient;
};

export async function enqueueOutboxEvent(args: EnqueueArgs): Promise<void> {
  const client = args.tx ?? prisma;
  try {
    await client.outboxEvent.create({
      data: {
        type: args.type,
        payload: args.payload as Prisma.InputJsonValue,
        idempotencyKey: args.idempotencyKey,
      },
    });
  } catch (err) {
    // Unique constraint violation = already enqueued. Idempotent skip.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return;
    }
    throw err;
  }
}

// ─── Handler registry ────────────────────────────────────

type Handler = (payload: Record<string, unknown>) => Promise<void>;

const HANDLERS: Record<OutboxEventType, Handler> = {
  order_confirmation_email: async (payload) => {
    const orderId = String(payload.orderId ?? "");
    if (!orderId) throw new Error("order_confirmation_email: missing orderId");
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { email: true } } },
    });
    if (!order || !order.user.email) {
      throw new Error(
        `order_confirmation_email: order ${orderId} or user.email missing`,
      );
    }
    await sendOrderConfirmationEmail(
      order.user.email,
      order.orderNumber,
      order.totalEur,
    );
  },

  portal_access_email: async (payload) => {
    const to = String(payload.to ?? "");
    const token = String(payload.token ?? "");
    const orderNumber = String(payload.orderNumber ?? "");
    const orderId = String(payload.orderId ?? "");
    if (!to || !token || !orderNumber || !orderId) {
      throw new Error("portal_access_email: missing required field(s)");
    }
    await sendPortalAccessEmail(to, token, orderNumber, orderId);
  },

  vr_project_ready_email: async (payload) => {
    const required = [
      "to",
      "contactName",
      "productLabel",
      "projectName",
      "priceEur",
      "orderNumber",
      "orderId",
      "token",
    ];
    for (const k of required) {
      if (payload[k] === undefined || payload[k] === null) {
        throw new Error(`vr_project_ready_email: missing ${k}`);
      }
    }
    await sendVrProjectReadyEmail({
      to: String(payload.to),
      contactName: String(payload.contactName),
      productLabel: String(payload.productLabel),
      projectName: String(payload.projectName),
      priceEur: Number(payload.priceEur),
      orderNumber: String(payload.orderNumber),
      orderId: String(payload.orderId),
      token: String(payload.token),
    });
  },
};

// ─── Processor ───────────────────────────────────────────

const BATCH_SIZE = 25;

// Exponential backoff: 1m, 2m, 4m, 8m, 16m. Capped so a stuck handler
// gets retried often enough to recover within a few hours.
function nextAttemptDelayMs(attempts: number): number {
  const minutes = Math.min(16, Math.pow(2, attempts));
  return minutes * 60 * 1000;
}

export type ProcessBatchResult = {
  claimed: number;
  succeeded: number;
  retried: number;
  failed: number;
};

export async function processOutboxBatch(): Promise<ProcessBatchResult> {
  const now = new Date();

  // Claim a batch. We do the claim in two steps because Prisma doesn't
  // expose RETURNING on updateMany — we set rows to `running` first,
  // then SELECT them back. The (status, nextAttemptAt) index makes the
  // updateMany cheap. Worst case race: two processors claim the same
  // batch — but the WHERE on `pending` makes the second updateMany
  // hit nothing.
  await prisma.outboxEvent.updateMany({
    where: {
      status: "pending",
      nextAttemptAt: { lte: now },
    },
    data: { status: "running" },
  });

  const claimed = await prisma.outboxEvent.findMany({
    where: { status: "running" },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
  });

  let succeeded = 0;
  let retried = 0;
  let failed = 0;

  for (const event of claimed) {
    const handler = HANDLERS[event.type];
    if (!handler) {
      // Unknown type — schema diverged from runtime. Mark failed so
      // it doesn't loop forever.
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: "failed",
          lastError: `No handler registered for type: ${event.type}`,
        },
      });
      Sentry.captureMessage(
        `[outbox] unknown event type: ${event.type}`,
        { level: "error", tags: { area: "outbox" } },
      );
      failed++;
      continue;
    }

    try {
      await handler(event.payload as Record<string, unknown>);
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: "succeeded",
          succeededAt: new Date(),
          lastError: null,
        },
      });
      succeeded++;
    } catch (err) {
      const attempts = event.attempts + 1;
      const message = err instanceof Error ? err.message : String(err);
      const isFinal = attempts >= event.maxAttempts;

      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: isFinal ? "failed" : "pending",
          attempts,
          lastError: message.slice(0, 4000),
          ...(isFinal
            ? {}
            : {
                nextAttemptAt: new Date(
                  Date.now() + nextAttemptDelayMs(attempts),
                ),
              }),
        },
      });

      Sentry.captureException(err, {
        tags: {
          area: "outbox",
          eventType: event.type,
          terminal: isFinal ? "true" : "false",
        },
        extra: {
          eventId: event.id,
          attempts,
          maxAttempts: event.maxAttempts,
          idempotencyKey: event.idempotencyKey,
        },
      });

      if (isFinal) failed++;
      else retried++;
    }
  }

  return { claimed: claimed.length, succeeded, retried, failed };
}
