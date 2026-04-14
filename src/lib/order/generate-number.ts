/**
 * generate-number.ts — Order number generator (ER-YYYYMMDD-XXXX format).
 *
 * Exports generateOrderNumber() producing unique, human-readable order
 * identifiers combining date and random alphanumeric suffix.
 *
 * Used by: server/actions/order
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ER-${date}-${rand}`;
}
