"use server";

import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin-auth";
import { recordAuditLog } from "@/lib/audit";
import { resolvePlutosConfig, isPlutosEligible } from "./config";
import { ensurePlutosSyncQueued } from "./producer";
import { refreshPlutosInvoiceStatus } from "./sync";
import type { PlutosActionResult, PlutosTarget } from "./types";

/**
 * actions.ts — The two admin server actions the order-detail panel calls.
 * Both require FINANCE_MANAGE, audit the request, and revalidate the order
 * page. Reason codes match the panel's `humanReason()` mapping.
 */

type TargetMeta = {
  orderId: string;
  invoiceIssuedAt: Date | null;
  hasInvoice: boolean;
};

async function loadTargetMeta(
  target: PlutosTarget,
  targetId: string,
): Promise<TargetMeta | null> {
  if (target === "order") {
    const order = await prisma.order.findUnique({
      where: { id: targetId },
      select: { id: true, invoiceNumber: true, invoiceIssuedAt: true },
    });
    if (!order) return null;
    return {
      orderId: order.id,
      invoiceIssuedAt: order.invoiceIssuedAt,
      hasInvoice: Boolean(order.invoiceNumber),
    };
  }
  const charge = await prisma.orderCharge.findUnique({
    where: { id: targetId },
    select: { orderId: true, invoiceNumber: true, invoiceIssuedAt: true },
  });
  if (!charge) return null;
  return {
    orderId: charge.orderId,
    invoiceIssuedAt: charge.invoiceIssuedAt,
    hasInvoice: Boolean(charge.invoiceNumber),
  };
}

function entityType(target: PlutosTarget): "Order" | "OrderCharge" {
  return target === "order" ? "Order" : "OrderCharge";
}

function configReason(reason: "disabled" | "invalid_config"): string {
  return reason === "disabled" ? "integration_disabled" : "invalid_config";
}

/**
 * Queue (or re-queue) a Plutos ingest for one invoice. Creates the outbox
 * event when absent, no-ops for a pending/running/succeeded event, and resets
 * a failed one to pending. Only ever uses one idempotency key per target, so a
 * duplicate request can never create a second event.
 */
export async function requestPlutosSync(
  target: PlutosTarget,
  targetId: string,
): Promise<PlutosActionResult> {
  let admin;
  try {
    admin = await requirePermission("FINANCE_MANAGE");
  } catch {
    return { ok: false, reason: "not_admin" };
  }

  const cfg = resolvePlutosConfig();
  if (!cfg.ok) return { ok: false, reason: configReason(cfg.reason) };

  try {
    const meta = await loadTargetMeta(target, targetId);
    if (!meta) {
      return {
        ok: false,
        reason: target === "charge" ? "charge_not_found" : "order_not_found",
      };
    }
    if (!meta.hasInvoice || !meta.invoiceIssuedAt) {
      return { ok: false, reason: "invoice_not_issued" };
    }
    if (!isPlutosEligible(meta.invoiceIssuedAt, cfg.config.from)) {
      return { ok: false, reason: "before_sync_cutoff" };
    }

    const outcome = await ensurePlutosSyncQueued(target, targetId);

    await recordAuditLog({
      action: "plutos.sync_requested",
      entityType: entityType(target),
      entityId: targetId,
      metadata: { orderId: meta.orderId, actorId: admin.id, outcome },
    });

    revalidatePath(`/portal/admin/orders/${meta.orderId}`);
    return { ok: true };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "plutos", flow: "request" },
      extra: { target, targetId },
    });
    return { ok: false, reason: err instanceof Error ? err.message : "unknown" };
  }
}

/**
 * Pull the current Plutos/SEF status for an ingested invoice into the admin.
 */
export async function refreshPlutosStatus(
  target: PlutosTarget,
  targetId: string,
): Promise<PlutosActionResult> {
  let admin;
  try {
    admin = await requirePermission("FINANCE_MANAGE");
  } catch {
    return { ok: false, reason: "not_admin" };
  }

  const cfg = resolvePlutosConfig();
  if (!cfg.ok) return { ok: false, reason: configReason(cfg.reason) };

  try {
    const meta = await loadTargetMeta(target, targetId);
    if (!meta) {
      return {
        ok: false,
        reason: target === "charge" ? "charge_not_found" : "order_not_found",
      };
    }
    if (!meta.hasInvoice) {
      return { ok: false, reason: "invoice_not_issued" };
    }

    await refreshPlutosInvoiceStatus(target, targetId);

    await recordAuditLog({
      action: "plutos.status_refreshed",
      entityType: entityType(target),
      entityId: targetId,
      metadata: { orderId: meta.orderId, actorId: admin.id },
    });

    revalidatePath(`/portal/admin/orders/${meta.orderId}`);
    return { ok: true };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "plutos", flow: "refresh" },
      extra: { target, targetId },
    });
    return { ok: false, reason: err instanceof Error ? err.message : "unknown" };
  }
}
