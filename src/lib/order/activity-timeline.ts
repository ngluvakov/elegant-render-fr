/**
 * activity-timeline.ts — Aggregator that merges OrderStatusEvent and
 * order-scoped AuditLog rows into a single chronological feed for
 * the admin order detail page.
 *
 * AuditLog rows where entityType="Order" + entityId=orderId cover
 * everything tagged after #88 (invoice, proforma, payment, vat,
 * deliverables, free-revision grants). Older events that predate
 * the audit-logging rollout only show up via OrderStatusEvent —
 * that's expected; the timeline degrades gracefully on legacy
 * orders rather than fabricating entries.
 *
 * Returns newest-first. Adjacent entries with the same `at` second
 * are stable-sorted by source (status events before audits) so a
 * "draft → awaiting_payment" transition appears above the audit
 * row that triggered it.
 */
import { prisma } from "@/lib/db";
import type { OrderStatus } from "@/generated/prisma/client";

export type TimelineEntry = {
  at: Date;
  source: "status" | "audit";
  /** Short title shown bold on the row */
  label: string;
  /** Optional secondary line (e.g. invoice number, transition note) */
  detail?: string;
  /** Actor display name when known */
  actor?: string;
  /** Tone bucket; the component maps to icon + colour */
  tone: "neutral" | "success" | "warning" | "danger";
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Brouillon",
  awaiting_payment: "En attente de paiement",
  paid: "Payée",
  in_progress: "En production",
  in_review: "À valider",
  revision_requested: "Révisions demandées",
  delivered: "Livrée",
  closed: "Clôturée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

export async function buildOrderActivityTimeline(
  orderId: string,
): Promise<TimelineEntry[]> {
  const [statusEvents, auditRows] = await Promise.all([
    prisma.orderStatusEvent.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.auditLog.findMany({
      where: { entityType: "Order", entityId: orderId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const entries: TimelineEntry[] = [];

  for (const ev of statusEvents) {
    entries.push({
      at: ev.createdAt,
      source: "status",
      label: ev.fromStatus
        ? `Statut : ${STATUS_LABELS[ev.fromStatus]} → ${STATUS_LABELS[ev.toStatus]}`
        : `Statut : ${STATUS_LABELS[ev.toStatus]}`,
      detail: ev.note ?? undefined,
      tone: statusTone(ev.toStatus),
    });
  }

  for (const row of auditRows) {
    const mapped = mapAuditAction(row);
    if (!mapped) continue;
    entries.push({
      at: row.createdAt,
      source: "audit",
      label: mapped.label,
      detail: mapped.detail,
      actor: row.actorEmail ?? undefined,
      tone: mapped.tone,
    });
  }

  // Stable: status events come first within a same-second tie because
  // they were pushed first.
  entries.sort((a, b) => b.at.getTime() - a.at.getTime());

  return entries;
}

function statusTone(status: OrderStatus): TimelineEntry["tone"] {
  if (status === "paid" || status === "delivered" || status === "closed")
    return "success";
  if (status === "cancelled" || status === "refunded") return "danger";
  if (status === "revision_requested") return "warning";
  return "neutral";
}

function mapAuditAction(row: {
  action: string;
  metadata: unknown;
}): { label: string; detail?: string; tone: TimelineEntry["tone"] } | null {
  const meta = (row.metadata && typeof row.metadata === "object"
    ? (row.metadata as Record<string, unknown>)
    : {}) as Record<string, unknown>;
  const metaString = (key: string) =>
    typeof meta[key] === "string" ? (meta[key] as string) : undefined;
  const metaNumber = (key: string) =>
    typeof meta[key] === "number" ? (meta[key] as number) : undefined;

  switch (row.action) {
    case "invoice.issued":
      return {
        label: "Facture émise",
        detail: metaString("invoiceNumber"),
        tone: "success",
      };
    case "invoice.error":
      return {
        label: "Échec de l’émission de la facture",
        detail: metaString("errorReason"),
        tone: "danger",
      };
    case "invoice.retry_requested":
      return {
        label: "Nouvelle tentative d’émission de la facture",
        detail: metaString("existingInvoiceNumber")
          ? `Numéro existant : ${metaString("existingInvoiceNumber")}`
          : undefined,
        tone: "warning",
      };
    case "proforma.issued":
      return {
        label: "Facture proforma émise",
        detail: metaString("proformaNumber"),
        tone: "success",
      };
    case "proforma.error":
      return {
        label: "Échec de l’émission de la facture proforma",
        detail: metaString("errorReason"),
        tone: "danger",
      };
    case "payment.wire_received":
      return {
        label: "Paiement par virement enregistré pour la proforma",
        detail: metaString("proformaNumber")
          ? `Proforma : ${metaString("proformaNumber")}`
          : undefined,
        tone: "success",
      };
    case "vat.verification_attempted": {
      const status = metaString("status");
      const country = metaString("countryCode");
      const number = metaString("vatNumber");
      const tone: TimelineEntry["tone"] =
        status === "valid"
          ? "success"
          : status === "invalid"
            ? "danger"
            : "neutral";
      const label = `Vérification TVA VIES : ${status ?? "?"}`;
      const idText =
        country && number ? `${country}${number}` : country ?? number ?? "";
      const verifiedName = metaString("name");
      const detail = [idText, verifiedName].filter(Boolean).join(" · ");
      return {
        label,
        detail: detail || undefined,
        tone,
      };
    }
    case "order.created_with_buyer_info":
      return {
        label: "Commande créée",
        detail: metaString("buyerType"),
        tone: "neutral",
      };
    case "order.deliverable_upload":
      return {
        label: "Fichier livré ajouté",
        detail: metaString("fileName"),
        tone: "success",
      };
    case "order.free_revision_grant": {
      const reason = metaString("reason");
      return {
        label: "Révision gratuite approuvée",
        detail: reason,
        tone: "success",
      };
    }
    case "inquiry.converted_to_order": {
      // Audited on the inquiry entity, not the order, so we never
      // get here when filtering by entityType=Order — but kept for
      // completeness if ever the audit shape changes.
      const seeded = metaNumber("itemsSeeded");
      return {
        label: "Créée à partir d’une demande",
        detail: typeof seeded === "number" ? `Éléments : ${seeded}` : undefined,
        tone: "neutral",
      };
    }
    // Status transitions and comments are surfaced via their own
    // dedicated rendering surfaces — skip in the merged timeline so
    // we don't double-render.
    case "order.transition":
    case "order.comment_create":
      return null;
    default:
      // Unknown action — show it raw so admin sees something rather
      // than nothing. Better than silently dropping events we forgot
      // to map.
      return {
        label: row.action,
        tone: "neutral",
      };
  }
}
