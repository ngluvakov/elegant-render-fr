/**
 * admin.ts — Admin-only server actions.
 *
 * Exports adminCreateComment, adminTransitionOrder, adminUploadDeliverable,
 * adminGrantAiCredits, adminGrantFreeRevision, plus the requireAdmin()
 * helper used by sibling admin action files. All write paths are gated
 * behind requireAdmin() and most sync to Bitrix24.
 *
 * Used by: admin/porudzbine/[orderId], admin/korisnici, admin charges.
 */
"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { transitionOrder } from "@/lib/order/status-machine";
import type { OrderStatus } from "@/generated/prisma/client";
import { syncCommentToDeal } from "@/server/bitrix/sync-comment";
import { syncFileToDeal } from "@/server/bitrix/sync-file";
import { enqueueOutboxEvent } from "@/lib/outbox";
import { recordAuditLog } from "@/lib/audit";
import { requireAnyAdminPermission, requirePermission } from "@/lib/admin-auth";
import {
  addMonths,
  formatCreditsFromUnits,
} from "@/lib/ai-studio/catalog";
import { captureServerEvent } from "@/lib/posthog";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";
import { recordUserActivity } from "@/lib/user-activity";

export async function requireAdmin() {
  return requireAnyAdminPermission();
}

export async function adminCreateComment(orderId: string, body: string) {
  const admin = await requirePermission("PROJECTS_MANAGE");
  if (!body.trim()) return { error: "Poruka ne može biti prazna." };

  const comment = await prisma.orderComment.create({
    data: {
      orderId,
      authorId: admin.id,
      role: "team",
      body: body.trim(),
    },
  });

  syncCommentToDeal(comment.id).catch((err) => {
    Sentry.captureException(err, {
      tags: { area: "bitrix", flow: "sync-comment-team" },
      extra: { commentId: comment.id, orderId: comment.orderId },
    });
  });

  await recordAuditLog({
    action: "order.comment_create",
    entityType: "Order",
    entityId: orderId,
    metadata: { commentId: comment.id, length: body.trim().length },
  });

  return { success: true };
}

export async function adminTransitionOrder(
  orderId: string,
  toStatus: string,
  note?: string,
) {
  const admin = await requirePermission("PROJECTS_MANAGE");

  // Capture the from-status before transition so the audit trail
  // doesn't depend on reading it after the row has been moved.
  const before = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });

  try {
    await transitionOrder(orderId, toStatus as OrderStatus, admin.id, note);

    await recordAuditLog({
      action: "order.transition",
      entityType: "Order",
      entityId: orderId,
      metadata: {
        from: before?.status ?? null,
        to: toStatus,
        note: note ?? null,
      },
    });

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška" };
  }
}

export async function adminUploadDeliverable(
  orderId: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  storagePath: string,
) {
  await requirePermission("PROJECTS_MANAGE");

  const file = await prisma.orderFile.create({
    data: {
      orderId,
      kind: "deliverable",
      fileName,
      fileSize,
      mimeType,
      storagePath,
    },
  });

  syncFileToDeal(file.id).catch((err) => {
    Sentry.captureException(err, {
      tags: { area: "bitrix", flow: "sync-file-deliverable" },
      extra: { fileId: file.id, orderId },
    });
  });

  await recordAuditLog({
    action: "order.deliverable_upload",
    entityType: "Order",
    entityId: orderId,
    metadata: { fileId: file.id, fileName, fileSize, mimeType },
  });

  return { success: true };
}

// ─── AI credit grants ────────────────────────────────────

export async function adminGrantAiCredits(args: {
  userId: string;
  units: number;
  note: string;
}): Promise<{ error?: string; balanceAfterUnits?: number }> {
  await requirePermission("AI_CREDITS_MANAGE");

  const units = Math.floor(args.units);
  const note = args.note.trim();
  if (units <= 0) return { error: "Količina mora biti veća od nule." };
  if (!note) return { error: "Napomena je obavezna." };

  // Same expiry semantics as a credit purchase: a grant resets the
  // user's expireAt to 12 months from now and clears any prior
  // expiry-reminder marks. The active balance — including units the
  // user already had — gets the fresh deadline.
  const pricingCatalog = await getPublishedPricingCatalog();
  const expiresAt = addMonths(
    new Date(),
    pricingCatalog.settings.aiCreditExpiresAfterMonths,
  );

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: args.userId },
      data: {
        aiCreditBalanceUnits: { increment: units },
        aiCreditsExpireAt: expiresAt,
        aiCreditsReminder30SentAt: null,
        aiCreditsReminder7SentAt: null,
      },
      select: { aiCreditBalanceUnits: true, email: true },
    });

    await tx.aiCreditTransaction.create({
      data: {
        userId: args.userId,
        type: "adjustment",
        units,
        balanceAfterUnits: user.aiCreditBalanceUnits,
        note: `Admin grant: ${note}`,
      },
    });

    if (user.email) {
      await enqueueOutboxEvent({
        type: "ai_credits_granted_email",
        payload: {
          to: user.email,
          unitsGranted: units,
          balanceAfterUnits: user.aiCreditBalanceUnits,
          balanceLabel: formatCreditsFromUnits(user.aiCreditBalanceUnits),
          grantedLabel: formatCreditsFromUnits(units),
          note,
          expiresAt: expiresAt.toISOString(),
        },
        idempotencyKey: `ai_credits_granted:${args.userId}:${Date.now()}`,
        tx,
      });
    }

    return { balanceAfterUnits: user.aiCreditBalanceUnits };
  });

  revalidatePath("/portal/admin/korisnici");
  revalidatePath(`/portal/admin/korisnici/${args.userId}`);

  await captureServerEvent({
    distinctId: `user:${args.userId}`,
    event: "admin_credits_granted",
    properties: { user_id: args.userId, units },
  });
  await recordUserActivity(args.userId, { aiCreditsGrantedUnits: units });

  await recordAuditLog({
    action: "ai_credits.grant",
    entityType: "User",
    entityId: args.userId,
    metadata: {
      units,
      note,
      balanceAfterUnits: result.balanceAfterUnits,
      expiresAt: expiresAt.toISOString(),
    },
  });

  return result;
}

// ─── Free revision grant ─────────────────────────────────

// Proactive: admin can grant a free revision regardless of whether
// the customer has clicked the in-portal "request revision" path.
// If the order is post-delivery, transition delivered → in_progress
// (allowed via the admin override in the status machine). If the
// order is mid-flight (in_progress / in_review / revision_requested),
// just log a status event with a FREE_REVISION_GRANTED prefix — the
// portal surfaces this as a notice without forcing a status change.
const FREE_REVISION_NOTE_PREFIX = "FREE_REVISION_GRANTED:";

export async function adminGrantFreeRevision(args: {
  orderId: string;
  note: string;
}): Promise<{ error?: string; success?: boolean }> {
  const admin = await requirePermission("PROJECTS_MANAGE");

  const note = args.note.trim();
  if (!note) return { error: "Razlog je obavezan." };

  const order = await prisma.order.findUnique({
    where: { id: args.orderId },
    select: {
      id: true,
      status: true,
      userId: true,
      orderNumber: true,
      user: { select: { email: true } },
    },
  });
  if (!order) return { error: "Porudžbina nije pronađena." };

  const fullNote = `${FREE_REVISION_NOTE_PREFIX} ${note}`;
  const reopenable: OrderStatus[] = ["delivered", "revision_requested"];
  const inFlight: OrderStatus[] = ["in_progress", "in_review"];

  try {
    if (reopenable.includes(order.status)) {
      await transitionOrder(order.id, "in_progress", admin.id, fullNote);
    } else if (inFlight.includes(order.status)) {
      await prisma.orderStatusEvent.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: order.status,
          actorId: admin.id,
          note: fullNote,
        },
      });
    } else {
      return {
        error: `Besplatna izmena se ne može odobriti u statusu "${order.status}".`,
      };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška" };
  }

  if (order.user.email) {
    await enqueueOutboxEvent({
      type: "free_revision_granted_email",
      payload: {
        to: order.user.email,
        orderNumber: order.orderNumber,
        orderId: order.id,
        note,
      },
      idempotencyKey: `free_revision_granted:${order.id}:${Date.now()}`,
    });
  }

  revalidatePath(`/portal/admin/porudzbine/${order.id}`);
  revalidatePath(`/portal/porudzbine/${order.id}`);

  await captureServerEvent({
    distinctId: `user:${order.userId}`,
    event: "admin_free_revision_granted",
    properties: { order_id: order.id, from_status: order.status },
  });

  await recordAuditLog({
    action: "order.free_revision_grant",
    entityType: "Order",
    entityId: order.id,
    metadata: { fromStatus: order.status, note },
  });

  return { success: true };
}
