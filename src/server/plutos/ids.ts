import type { PlutosTarget } from "./types";

/**
 * ids.ts — Stable identifiers for the Plutos integration.
 *
 * Plutos treats `order_id` as its idempotency key: the same value ingested
 * twice yields one invoice. We namespace it by source + target so an order and
 * a charge — or the same underlying id on `.rs` vs `.com` — never collide.
 */
export const PLUTOS_SOURCE = "elegantrender.fr";

/** Plutos idempotency key, e.g. `elegantrender.fr:order:abc123`. */
export function plutosOrderId(target: PlutosTarget, targetId: string): string {
  return `${PLUTOS_SOURCE}:${target}:${targetId}`;
}

/** Local outbox idempotency key for the ingest event. */
export function plutosOutboxKey(
  target: PlutosTarget,
  targetId: string,
): string {
  return `plutos_invoice_requested:${plutosOrderId(target, targetId)}`;
}
