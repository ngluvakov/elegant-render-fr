/**
 * proforma-number.ts — Atomic per-year proforma (predračun) numbering.
 *
 * Format: `P-{year}-{4-digit-seq}` (e.g. `P-2026-0001`). The `P-` prefix
 * keeps proforma numbers visually distinct from invoice numbers
 * (`{year}-{seq}`) — the accountant scrolling through emails can tell
 * at a glance what kind of document she's looking at.
 *
 * Same row-lock concurrency story as invoice-number.ts: prisma upsert
 * with `update.seq.increment` issues one SQL statement that locks the
 * year row for the duration of the transaction. Concurrent allocations
 * on the same year serialize through the lock; numbers are gap-free
 * within a year barring a transaction rollback after the increment
 * (rare; documented in invoice-number.ts).
 *
 * Used by: src/server/actions/issue-proforma.ts
 */

import { prisma } from "@/lib/db";

export async function allocateProformaNumber(
  year: number = new Date().getFullYear(),
): Promise<{ year: number; seq: number; formatted: string }> {
  const row = await prisma.proformaCounter.upsert({
    where: { year },
    create: { year, seq: 1 },
    update: { seq: { increment: 1 } },
    select: { seq: true },
  });
  const seq = row.seq;
  const formatted = `P-${year}-${String(seq).padStart(4, "0")}`;
  return { year, seq, formatted };
}
