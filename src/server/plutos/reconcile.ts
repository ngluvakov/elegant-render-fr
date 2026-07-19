import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { enqueueOutboxEvent } from "@/lib/outbox";
import { resolvePlutosConfig, isPlutosEligible } from "./config";
import { plutosOutboxKey } from "./ids";
import type { PlutosTarget } from "./types";

/**
 * reconcile.ts — Bounded repair pass for invoices that were issued but whose
 * Plutos event was never created (e.g. the best-effort producer failed, or the
 * flag was turned on after issuance but still at/after the cutoff).
 *
 * It repairs MISSING events only. A document that already has an event — queued
 * (pending/running) or terminal `failed` — is left alone: a failed event is the
 * finance user's manual "Retry sync" decision and is bounded by the outbox
 * max-attempt policy, so the cron must never resurrect it.
 *
 * Anti-starvation is enforced at the DB level, not after selection: the scan
 * excludes any document whose sync has ever been attempted
 * (`plutosLastAttemptAt` is not null — set by syncPlutosInvoice before it does
 * anything else). A terminal `failed` document therefore never enters the scan
 * window at all, so an arbitrarily large failed backlog can never crowd out a
 * genuine missed enqueue. The only rows that remain and still carry an event
 * are freshly-queued-but-not-yet-attempted ones, which are transient (the
 * outbox drains them in seconds) and are skipped via the existence check below.
 */

const DEFAULT_LIMIT = 10;
// Rows read per table. A safety bound on the scan; the WHERE already excludes
// attempted rows, so this only ever holds genuine-missing + transient-queued.
const SCAN_MULTIPLE = 10;

export type PlutosReconcileResult = {
  ok: boolean;
  skipped: boolean;
  scanned: number;
  ordersQueued: number;
  chargesQueued: number;
  /** Candidates skipped because a (transient) event already exists. */
  skippedExisting: number;
};

type Candidate = {
  target: PlutosTarget;
  id: string;
  issuedAt: Date | null;
  key: string;
};

export async function reconcilePlutosSync(
  limit = DEFAULT_LIMIT,
): Promise<PlutosReconcileResult> {
  const cfg = resolvePlutosConfig();
  if (!cfg.ok) {
    return {
      ok: true,
      skipped: true,
      scanned: 0,
      ordersQueued: 0,
      chargesQueued: 0,
      skippedExisting: 0,
    };
  }
  const from = cfg.config.from;
  const scanWindow = Math.max(limit * SCAN_MULTIPLE, 50);

  // Only documents whose sync has never been attempted are candidates. This
  // excludes every terminal `failed` and every succeeded row at the DB level.
  const where = {
    invoiceNumber: { not: null },
    invoiceIssuedAt: { gte: from },
    plutosSyncedAt: null,
    plutosLastAttemptAt: null,
  } as const;

  try {
    const [orders, charges] = await Promise.all([
      prisma.order.findMany({
        where,
        select: { id: true, invoiceIssuedAt: true },
        orderBy: { invoiceIssuedAt: "asc" },
        take: scanWindow,
      }),
      prisma.orderCharge.findMany({
        where,
        select: { id: true, invoiceIssuedAt: true },
        orderBy: { invoiceIssuedAt: "asc" },
        take: scanWindow,
      }),
    ]);

    const candidates: Candidate[] = [
      ...orders.map((o) => ({
        target: "order" as const,
        id: o.id,
        issuedAt: o.invoiceIssuedAt,
        key: plutosOutboxKey("order", o.id),
      })),
      ...charges.map((c) => ({
        target: "charge" as const,
        id: c.id,
        issuedAt: c.invoiceIssuedAt,
        key: plutosOutboxKey("charge", c.id),
      })),
    ];

    // A candidate can still carry a freshly-queued (not-yet-attempted) event.
    // Skip those without spending the budget so the pass only creates truly
    // missing events. enqueueOutboxEvent would no-op on them anyway.
    let existingKeys = new Set<string>();
    if (candidates.length > 0) {
      const existing = await prisma.outboxEvent.findMany({
        where: { idempotencyKey: { in: candidates.map((c) => c.key) } },
        select: { idempotencyKey: true },
      });
      existingKeys = new Set(existing.map((e) => e.idempotencyKey));
    }

    let scanned = 0;
    let ordersQueued = 0;
    let chargesQueued = 0;
    let skippedExisting = 0;

    for (const candidate of candidates) {
      if (ordersQueued + chargesQueued >= limit) break;
      scanned += 1;

      if (existingKeys.has(candidate.key)) {
        skippedExisting += 1;
        continue;
      }
      if (!isPlutosEligible(candidate.issuedAt, from)) continue;

      // Create-if-absent only; enqueueOutboxEvent no-ops on a concurrent create.
      await enqueueOutboxEvent({
        type: "plutos_invoice_requested",
        payload: { target: candidate.target, targetId: candidate.id },
        idempotencyKey: candidate.key,
      });
      if (candidate.target === "order") ordersQueued += 1;
      else chargesQueued += 1;
    }

    return {
      ok: true,
      skipped: false,
      scanned,
      ordersQueued,
      chargesQueued,
      skippedExisting,
    };
  } catch (err) {
    Sentry.captureException(err, { tags: { area: "plutos", flow: "reconcile" } });
    return {
      ok: false,
      skipped: false,
      scanned: 0,
      ordersQueued: 0,
      chargesQueued: 0,
      skippedExisting: 0,
    };
  }
}
