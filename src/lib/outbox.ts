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
  sendAdditionalChargePaidEmail,
  sendAdditionalChargeRequestedEmail,
  sendAiCreditsExpiryReminderEmail,
  sendAiCreditsGrantedEmail,
  sendFreeRevisionGrantedEmail,
  sendInquiryConvertedEmail,
  sendInvoiceIssuedEmail,
  sendOrderConfirmationEmail,
  sendPaymentFailureEmail,
  sendPaymentSuccessEmail,
  sendPortalAccessEmail,
  sendProformaIssuedEmail,
  sendVrProjectReadyEmail,
} from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabase";
import { UPLOADS_BUCKET } from "@/lib/file-scan";
import { getNestpayReceiptData } from "@/lib/nestpay/receipt-data";

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
      order.totalCents ? order.totalCents / 100 : order.totalRsd,
      order.billingCurrency && order.billingTotalCents != null
        ? formatOutboxMoney(order.billingTotalCents, order.billingCurrency)
        : undefined,
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
      "priceRsd",
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
      priceRsd: Number(payload.priceRsd),
      orderNumber: String(payload.orderNumber),
      orderId: String(payload.orderId),
      token: String(payload.token),
    });
  },

  ai_credits_expiry_reminder_email: async (payload) => {
    const to = String(payload.to ?? "");
    const creditsLabel = String(payload.creditsLabel ?? "");
    const expiresAt = new Date(String(payload.expiresAt ?? ""));
    const daysLeft = Number(payload.daysLeft);
    if (!to || !creditsLabel || Number.isNaN(expiresAt.getTime())) {
      throw new Error(
        "ai_credits_expiry_reminder_email: missing required field(s)",
      );
    }
    if (daysLeft !== 30 && daysLeft !== 7) {
      throw new Error("ai_credits_expiry_reminder_email: invalid daysLeft");
    }
    await sendAiCreditsExpiryReminderEmail({
      to,
      creditsLabel,
      expiresAt,
      daysLeft,
    });
  },

  ai_credits_granted_email: async (payload) => {
    const to = String(payload.to ?? "");
    const grantedLabel = String(payload.grantedLabel ?? "");
    const balanceLabel = String(payload.balanceLabel ?? "");
    const note = String(payload.note ?? "");
    const expiresAt = new Date(String(payload.expiresAt ?? ""));
    if (!to || !grantedLabel || !balanceLabel || Number.isNaN(expiresAt.getTime())) {
      throw new Error("ai_credits_granted_email: missing required field(s)");
    }
    await sendAiCreditsGrantedEmail({
      to,
      grantedLabel,
      balanceLabel,
      note,
      expiresAt,
    });
  },

  free_revision_granted_email: async (payload) => {
    const to = String(payload.to ?? "");
    const orderNumber = String(payload.orderNumber ?? "");
    const orderId = String(payload.orderId ?? "");
    const note = String(payload.note ?? "");
    if (!to || !orderNumber || !orderId) {
      throw new Error("free_revision_granted_email: missing required field(s)");
    }
    await sendFreeRevisionGrantedEmail({ to, orderNumber, orderId, note });
  },

  additional_charge_requested_email: async (payload) => {
    const to = String(payload.to ?? "");
    const orderNumber = String(payload.orderNumber ?? "");
    const orderId = String(payload.orderId ?? "");
    const totalCents = Number(payload.totalCents);
    const billingTotalCents =
      payload.billingTotalCents == null
        ? null
        : Number(payload.billingTotalCents);
    const billingCurrency = payload.billingCurrency === "RSD" ? "RSD" : null;
    const reason = String(payload.reason ?? "");
    const rawLines = payload.lines;
    if (!to || !orderNumber || !orderId || !Number.isFinite(totalCents) || !Array.isArray(rawLines)) {
      throw new Error("additional_charge_requested_email: missing required field(s)");
    }
    const lines = rawLines.map((raw) => {
      const line = raw as {
        label?: unknown;
        quantity?: unknown;
        amountCents?: unknown;
        billingSubtotalCents?: unknown;
      };
      const billingSubtotalCents =
        line.billingSubtotalCents == null
          ? null
          : Number(line.billingSubtotalCents);
      return {
        label: String(line.label ?? ""),
        quantity: Number(line.quantity ?? 1),
        amountCents: Number(line.amountCents ?? 0),
        billingSubtotalCents: isFiniteNumber(billingSubtotalCents)
          ? billingSubtotalCents
          : null,
      };
    });
    await sendAdditionalChargeRequestedEmail({
      to,
      orderNumber,
      orderId,
      totalCents,
      billingCurrency,
      billingTotalCents: isFiniteNumber(billingTotalCents)
        ? billingTotalCents
        : null,
      reason,
      lines,
    });
  },

  additional_charge_paid_email: async (payload) => {
    const to = String(payload.to ?? "");
    const orderNumber = String(payload.orderNumber ?? "");
    const orderId = String(payload.orderId ?? "");
    const totalCents = Number(payload.totalCents);
    const billingTotalCents =
      payload.billingTotalCents == null
        ? null
        : Number(payload.billingTotalCents);
    const billingCurrency = payload.billingCurrency === "RSD" ? "RSD" : null;
    if (!to || !orderNumber || !orderId || !Number.isFinite(totalCents)) {
      throw new Error("additional_charge_paid_email: missing required field(s)");
    }
    await sendAdditionalChargePaidEmail({
      to,
      orderNumber,
      orderId,
      totalCents,
      billingCurrency,
      billingTotalCents: isFiniteNumber(billingTotalCents)
        ? billingTotalCents
        : null,
    });
  },

  invoice_issued_email: async (payload) => {
    const to = String(payload.to ?? "");
    const invoiceNumber = String(payload.invoiceNumber ?? "");
    const totalRsd = Number(payload.totalRsd);
    const billingTotalCents =
      payload.billingTotalCents == null
        ? null
        : Number(payload.billingTotalCents);
    const billingCurrency = payload.billingCurrency === "RSD" ? "RSD" : null;
    const pdfPath = String(payload.pdfPath ?? "");
    if (!to || !invoiceNumber || !pdfPath || !Number.isFinite(totalRsd)) {
      throw new Error("invoice_issued_email: missing required field(s)");
    }
    // Pull the rendered PDF straight from Supabase storage. We
    // re-download per send so a retry after a transient Resend outage
    // still has the right content even if the order/invoice was
    // updated in between (rare).
    const supabase = getSupabaseAdmin();
    const download = await supabase.storage
      .from(UPLOADS_BUCKET)
      .download(pdfPath);
    if (download.error || !download.data) {
      throw new Error(
        `invoice_issued_email: download failed for ${pdfPath}: ${download.error?.message ?? "no data"}`,
      );
    }
    const arrayBuffer = await download.data.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    await sendInvoiceIssuedEmail({
      to,
      invoiceNumber,
      totalRsd,
      amountLabel:
        billingCurrency && isFiniteNumber(billingTotalCents)
          ? formatOutboxMoney(billingTotalCents, billingCurrency)
          : undefined,
      pdfBuffer,
    });
  },

  proforma_issued_email: async (payload) => {
    const to = String(payload.to ?? "");
    const proformaNumber = String(payload.proformaNumber ?? "");
    const totalRsd = Number(payload.totalRsd);
    const billingTotalCents =
      payload.billingTotalCents == null
        ? null
        : Number(payload.billingTotalCents);
    const billingCurrency = payload.billingCurrency === "RSD" ? "RSD" : null;
    const pdfPath = String(payload.pdfPath ?? "");
    const dueDate = new Date(String(payload.dueDate ?? ""));
    if (
      !to ||
      !proformaNumber ||
      !pdfPath ||
      !Number.isFinite(totalRsd) ||
      Number.isNaN(dueDate.getTime())
    ) {
      throw new Error("proforma_issued_email: missing required field(s)");
    }
    const supabase = getSupabaseAdmin();
    const download = await supabase.storage
      .from(UPLOADS_BUCKET)
      .download(pdfPath);
    if (download.error || !download.data) {
      throw new Error(
        `proforma_issued_email: download failed for ${pdfPath}: ${download.error?.message ?? "no data"}`,
      );
    }
    const arrayBuffer = await download.data.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    await sendProformaIssuedEmail({
      to,
      proformaNumber,
      totalRsd,
      amountLabel:
        billingCurrency && isFiniteNumber(billingTotalCents)
          ? formatOutboxMoney(billingTotalCents, billingCurrency)
          : undefined,
      dueDate,
      pdfBuffer,
    });
  },

  inquiry_converted_email: async (payload) => {
    const to = String(payload.to ?? "");
    const contactName = String(payload.contactName ?? "");
    const inquirySubject = payload.inquirySubject
      ? String(payload.inquirySubject)
      : null;
    if (!to) {
      throw new Error("inquiry_converted_email: missing required field 'to'");
    }
    await sendInquiryConvertedEmail({ to, contactName, inquirySubject });
  },

  payment_success_email: async (payload) => {
    const orderId = String(payload.orderId ?? "");
    if (!orderId) throw new Error("payment_success_email: missing orderId");
    const data = await loadNestpayEmailData(orderId);
    if (!data) {
      throw new Error(
        `payment_success_email: order ${orderId} or user.email missing`,
      );
    }
    await sendPaymentSuccessEmail({
      to: data.to,
      orderNumber: data.orderNumber,
      customer: data.customer,
      lineItems: data.lineItems,
      totals: data.totals,
      conversion: data.conversion,
      transaction: data.transaction,
    });
  },

  payment_failure_email: async (payload) => {
    const orderId = String(payload.orderId ?? "");
    if (!orderId) throw new Error("payment_failure_email: missing orderId");
    const data = await loadNestpayEmailData(orderId);
    if (!data) {
      throw new Error(
        `payment_failure_email: order ${orderId} or user.email missing`,
      );
    }
    await sendPaymentFailureEmail({
      to: data.to,
      orderNumber: data.orderNumber,
      customer: data.customer,
      lineItems: data.lineItems,
      totals: data.totals,
      conversion: data.conversion,
      transaction: data.transaction,
      retryUrl: data.retryUrl,
    });
  },
};

// ─── Nestpay email data builder ─────────────────────────
//
// Data shape + Prisma query lives in src/lib/nestpay/receipt-data.ts so the
// uspeh/neuspeh pages can reuse it. This wrapper adds the email-only fields:
// recipient address and a portal retry URL.

function getAuthUrl(): string {
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.AUTH_URL ?? "http://localhost:3000";
}

async function loadNestpayEmailData(orderId: string) {
  const data = await getNestpayReceiptData(orderId);
  if (!data) return null;
  return {
    to: data.customer.email,
    orderNumber: data.orderNumber,
    customer: data.customer,
    lineItems: data.lineItems,
    totals: data.totals,
    conversion: data.conversion,
    transaction: data.transaction,
    retryUrl: `${getAuthUrl()}/portal/porudzbine/${orderId}`,
  };
}


// ─── Processor ───────────────────────────────────────────

const BATCH_SIZE = 25;

// Exponential backoff: 1m, 2m, 4m, 8m, 16m. Capped so a stuck handler
// gets retried often enough to recover within a few hours.
function nextAttemptDelayMs(attempts: number): number {
  const minutes = Math.min(16, Math.pow(2, attempts));
  return minutes * 60 * 1000;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatOutboxMoney(cents: number, _currency: "RSD" | null = "RSD"): string {
  void _currency;
  return `${(cents / 100).toLocaleString("sr-Latn-RS", {
    maximumFractionDigits: 0,
  })} RSD`;
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
