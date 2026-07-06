/**
 * StatusUtils — Shared status label map, badge color helper, and ordered
 * step definitions used by StatusTracker and all order-related components.
 *
 * Used on: StatusTracker, OrderDetailHero, OrderOverviewCard, OrdersFilterBar.
 */
export const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  awaiting_payment: "Awaiting payment",
  paid: "Paid",
  in_progress: "In progress",
  in_review: "Ready for review",
  revision_requested: "Revisions requested",
  delivered: "Delivered",
  closed: "Closed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function statusAccent(status: string): string {
  switch (status) {
    case "paid":
    case "in_progress":
      return "bg-accent/10 text-foreground border-accent/30";
    case "in_review":
      return "bg-accent/15 text-foreground border-accent/40";
    case "delivered":
    case "closed":
      return "bg-primary text-primary-foreground border-primary";
    case "revision_requested":
      return "bg-secondary text-secondary-foreground border-border";
    case "cancelled":
    case "refunded":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "bg-secondary text-muted-foreground border-border";
  }
}

export const STATUS_STEPS = [
  { key: "draft", label: "Order" },
  { key: "paid", label: "Payment" },
  { key: "in_progress", label: "Production" },
  { key: "in_review", label: "Review" },
  { key: "revision_requested", label: "Revision" },
  { key: "delivered", label: "Delivery" },
  { key: "closed", label: "Closed" },
] as const;

// Customer-friendly explanation for each order status. The `tone` drives
// how the StatusTracker renders the guidance card:
//   - "action" — customer is expected to do something (highlighted)
//   - "info"   — purely informational (neutral grey)
//   - "alert"  — off-track (cancelled / refunded) — shown in destructive
export type StatusTone = "action" | "info" | "alert";

export const STATUS_GUIDANCE: Record<
  string,
  { title: string; description: string; tone: StatusTone }
> = {
  draft: {
    title: "Prepare items for payment",
    description:
      "Complete every item (name, number of frames, description, files). When everything is ready, click \"Continue to payment\" in the summary card.",
    tone: "action",
  },
  awaiting_payment: {
    title: "Complete payment",
    description:
      "Items are locked. As soon as we receive payment, our team starts production. First drafts arrive within 24-48 hours.",
    tone: "action",
  },
  paid: {
    title: "Payment received",
    description:
      "Thank you. Our team has started preparing the project. We send first drafts within 24-48 hours.",
    tone: "info",
  },
  in_progress: {
    title: "The team is working on your project",
    description:
      "We will notify you as soon as drafts are ready for review. In the meantime, you can add notes and files to individual items.",
    tone: "info",
  },
  in_review: {
    title: "Review is with you",
    description:
      "Our team has sent the first renders. Review the files and reply: approve them or request revisions. You have up to 5 working days.",
    tone: "action",
  },
  revision_requested: {
    title: "The team is working on revisions",
    description:
      "Your revision request has been received. Estimated turnaround for the new version: 2-3 working days. We will notify you when it is ready.",
    tone: "info",
  },
  delivered: {
    title: "Final files are ready",
    description:
      "Download the delivered files from the \"Delivered files\" section. Thank you for choosing Elegant Render. Use this order as a reference for future discounts.",
    tone: "info",
  },
  closed: {
    title: "Project closed",
    description:
      "The order has been archived. On your next order, you can reference it and receive a discount because the model has already been built.",
    tone: "info",
  },
  cancelled: {
    title: "Order cancelled",
    description:
      "This order is no longer active. If you think this is an error, contact us through chat or email.",
    tone: "alert",
  },
  refunded: {
    title: "Funds refunded",
    description:
      "The order has been cancelled and the funds returned. If you have questions or want to order again, contact us.",
    tone: "alert",
  },
};

export function statusGuidance(status: string) {
  return (
    STATUS_GUIDANCE[status] ?? {
      title: STATUS_LABELS[status] ?? status,
      description: "",
      tone: "info" as StatusTone,
    }
  );
}
