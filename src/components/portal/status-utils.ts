export const STATUS_LABELS: Record<string, string> = {
  draft: "Nacrt",
  awaiting_payment: "Čeka uplatu",
  paid: "Plaćeno",
  in_progress: "U izradi",
  in_review: "Spremno za pregled",
  revision_requested: "Izmene zatražene",
  delivered: "Isporučeno",
  closed: "Završeno",
  cancelled: "Otkazano",
  refunded: "Refundirano",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function statusAccent(status: string): string {
  switch (status) {
    case "paid":
    case "in_progress":
      return "bg-accent/10 text-accent border-accent/20";
    case "in_review":
      return "bg-accent/15 text-accent border-accent/30";
    case "delivered":
    case "closed":
      return "bg-[color:var(--color-sage)]/10 text-[color:var(--color-sage-deep)] border-[color:var(--color-sage)]/20";
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
  { key: "draft", label: "Narudžbina" },
  { key: "paid", label: "Plaćanje" },
  { key: "in_progress", label: "Izrada" },
  { key: "in_review", label: "Pregled" },
  { key: "revision_requested", label: "Revizija" },
  { key: "delivered", label: "Isporuka" },
  { key: "closed", label: "Završeno" },
] as const;
