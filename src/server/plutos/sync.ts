import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { resolvePlutosConfig, isPlutosEligible } from "./config";
import { loadPlutosInvoiceSource } from "./source";
import { buildPlutosInvoicePayload } from "./payload";
import {
  getPlutosInvoiceStatus,
  postPlutosInvoice,
  PlutosClientError,
} from "./client";
import { plutosOrderId } from "./ids";
import type { PlutosTarget } from "./types";

/**
 * sync.ts — Orchestrates one Plutos exchange (POST ingest or GET status) and
 * persists the outcome onto the Order/OrderCharge. Called by the outbox
 * handler (POST) and the refresh action (GET). Failures rethrow so the outbox
 * retry policy applies; a sanitized error is stored either way.
 */

async function setPlutosFields(
  target: PlutosTarget,
  id: string,
  data: Prisma.OrderUpdateInput & Prisma.OrderChargeUpdateInput,
): Promise<void> {
  if (target === "order") {
    await prisma.order.update({ where: { id }, data });
  } else {
    await prisma.orderCharge.update({ where: { id }, data });
  }
}

async function loadInvoiceNumber(
  target: PlutosTarget,
  id: string,
): Promise<string | null> {
  if (target === "order") {
    const row = await prisma.order.findUnique({
      where: { id },
      select: { invoiceNumber: true },
    });
    return row?.invoiceNumber ?? null;
  }
  const row = await prisma.orderCharge.findUnique({
    where: { id },
    select: { invoiceNumber: true },
  });
  return row?.invoiceNumber ?? null;
}

/** Error message safe to persist/log — never carries key or buyer payload. */
function sanitizeError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return message.slice(0, 1000);
}

/**
 * Ingest one invoice into Plutos. Idempotent on the Plutos side by order_id.
 * Records `plutosLastAttemptAt` on every attempt; on success writes the
 * external ids/status and clears the error; on failure stores a sanitized
 * error and rethrows so the outbox retries with backoff.
 */
export async function syncPlutosInvoice(
  target: PlutosTarget,
  targetId: string,
): Promise<void> {
  const cfg = resolvePlutosConfig();
  if (!cfg.ok) {
    throw new Error(`plutos sync unavailable: ${cfg.reason}`);
  }

  const source = await loadPlutosInvoiceSource(target, targetId);
  if (!source) {
    throw new Error(`plutos source unavailable for ${target}:${targetId}`);
  }

  // Defense in depth: producers already gate the cutoff, but an event that
  // slipped through (e.g. a manual reset) must never resend a pre-cutoff doc.
  if (!isPlutosEligible(source.issueDate, cfg.config.from)) {
    return;
  }

  // Record the attempt BEFORE building the payload, so any failure — including a
  // payload-construction error — marks plutosLastAttemptAt. The reconcile pass
  // relies on this to exclude already-attempted documents from its scan.
  await setPlutosFields(target, targetId, { plutosLastAttemptAt: new Date() });

  try {
    const payload = buildPlutosInvoicePayload(source);
    const remote = await postPlutosInvoice(cfg.config, payload);
    await setPlutosFields(target, targetId, {
      plutosInvoiceId: remote.invoiceId,
      plutosNumber: remote.number,
      plutosStatus: remote.status,
      plutosSefStatus: remote.sefStatus,
      plutosSyncedAt: new Date(),
      plutosLastError: null,
    });
  } catch (err) {
    await setPlutosFields(target, targetId, {
      plutosLastError: sanitizeError(err),
    });
    throw err;
  }
}

/**
 * Refresh the SEF/document status of an already-ingested invoice. Rejects a
 * response whose number diverges from the immutable local invoice number.
 */
export async function refreshPlutosInvoiceStatus(
  target: PlutosTarget,
  targetId: string,
): Promise<void> {
  const cfg = resolvePlutosConfig();
  if (!cfg.ok) {
    throw new Error(`plutos refresh unavailable: ${cfg.reason}`);
  }

  // Record the attempt up front so a failure is symmetric with the POST path —
  // the admin sees a timestamp and a sanitized error, not a silent no-change.
  await setPlutosFields(target, targetId, { plutosLastAttemptAt: new Date() });

  try {
    const localNumber = await loadInvoiceNumber(target, targetId);
    const remote = await getPlutosInvoiceStatus(
      cfg.config,
      plutosOrderId(target, targetId),
    );

    if (localNumber && remote.number !== localNumber) {
      throw new PlutosClientError(
        "number_mismatch",
        `Plutos number ${remote.number} != local ${localNumber}`,
      );
    }

    await setPlutosFields(target, targetId, {
      plutosInvoiceId: remote.invoiceId,
      plutosNumber: remote.number,
      plutosStatus: remote.status,
      plutosSefStatus: remote.sefStatus,
      plutosLastError: null,
    });
  } catch (err) {
    await setPlutosFields(target, targetId, {
      plutosLastError: sanitizeError(err),
    });
    throw err;
  }
}
