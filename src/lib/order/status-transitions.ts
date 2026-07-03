/**
 * status-transitions.ts — čista tabela dozvoljenih prelaza statusa
 * porudžbine. Izdvojena iz status-machine.ts da bi bila testabilna bez
 * Prisma/Sentry/Bitrix imports (status-machine je vezan za DB).
 *
 * `delivered → in_progress` is an admin-only override for the "free
 * revision" flow: customer asks for a change after delivery, admin
 * approves it at no charge, and the order reopens for work. Only
 * reachable via the admin path; the customer flow has no UI for it.
 */
import type { OrderStatus } from "@/generated/prisma/client";

export const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["awaiting_payment", "cancelled"],
  awaiting_payment: ["paid", "cancelled"],
  paid: ["in_progress", "closed", "cancelled", "refunded"],
  in_progress: ["in_review", "cancelled"],
  in_review: ["revision_requested", "delivered"],
  revision_requested: ["in_progress"],
  delivered: ["closed", "in_progress"],
  closed: [],
  cancelled: [],
  refunded: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
