/**
 * invoice-number.ts — Atomic, gap-free invoice numbering per calendar year.
 *
 * Format: `{year}-{4-digit-seq}` (e.g. `2026-0001`, `2026-0002`...). Resets
 * to 1 on January 1st implicitly because each year owns its own row in
 * `invoice_counters` and `seq` starts at 0 there.
 *
 * Concurrency: prisma upsert with `update.seq.increment` lands as a
 * single SQL statement that holds a row lock for the duration of the
 * transaction. Two concurrent requests on the same year serialize on
 * that lock — the second waits, sees the incremented value, and gets
 * seq+1. No counter gaps under normal operation.
 *
 * Gap caveat: if a transaction that allocated a number is rolled back
 * AFTER the counter increment but BEFORE the order is committed, that
 * number is lost. Practically extreme — invoice numbers are allocated
 * inside the same transaction as the order's invoice fields update,
 * so a rollback discards both atomically. The `seq` advance, being
 * outside the transaction, is the rare hole risk; we accept it as
 * vastly preferable to a duplicate number.
 *
 * Used by: src/server/actions/issue-invoice.ts
 */

import { prisma } from "@/lib/db";

export async function allocateInvoiceNumber(
  year: number = new Date().getFullYear(),
): Promise<{ year: number; seq: number; formatted: string }> {
  const row = await prisma.invoiceCounter.upsert({
    where: { year },
    create: { year, seq: 1 },
    update: { seq: { increment: 1 } },
    select: { seq: true },
  });
  const seq = row.seq;
  const formatted = `${year}-${String(seq).padStart(4, "0")}`;
  return { year, seq, formatted };
}
