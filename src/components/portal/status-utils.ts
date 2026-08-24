/**
 * StatusUtils — Shared status label map, badge color helper, and ordered
 * step definitions used by StatusTracker and all order-related components.
 *
 * Used on: StatusTracker, OrderDetailHero, OrderOverviewCard, OrdersFilterBar.
 */
export const STATUS_LABELS: Record<string, string> = {
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
  { key: "draft", label: "Commande" },
  { key: "paid", label: "Paiement" },
  { key: "in_progress", label: "Production" },
  { key: "in_review", label: "Validation" },
  { key: "revision_requested", label: "Révision" },
  { key: "delivered", label: "Livraison" },
  { key: "closed", label: "Clôture" },
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
    title: "Préparez les éléments pour le paiement",
    description:
      "Complétez chaque élément (nom, nombre de vues, description, fichiers). Quand tout est prêt, cliquez sur « Continuer vers le paiement » dans la carte de récapitulatif.",
    tone: "action",
  },
  awaiting_payment: {
    title: "Finalisez le paiement",
    description:
      "Les éléments sont verrouillés. Dès réception du paiement, notre équipe lance la production. Les premières ébauches arrivent sous 24 à 48 heures.",
    tone: "action",
  },
  paid: {
    title: "Paiement reçu",
    description:
      "Merci. Notre équipe a commencé la préparation du projet. Nous envoyons les premières ébauches sous 24 à 48 heures.",
    tone: "info",
  },
  in_progress: {
    title: "L’équipe travaille sur votre projet",
    description:
      "Nous vous préviendrons dès que des ébauches seront prêtes à être validées. En attendant, vous pouvez ajouter des notes et des fichiers aux différents éléments.",
    tone: "info",
  },
  in_review: {
    title: "À vous de valider",
    description:
      "Notre équipe a envoyé les premiers rendus. Examinez les fichiers et répondez : approuvez-les ou demandez des révisions. Vous disposez de 5 jours ouvrés.",
    tone: "action",
  },
  revision_requested: {
    title: "L’équipe travaille sur les révisions",
    description:
      "Votre demande de révision a bien été reçue. Délai estimé pour la nouvelle version : 2 à 3 jours ouvrés. Nous vous préviendrons dès qu’elle sera prête.",
    tone: "info",
  },
  delivered: {
    title: "Les fichiers finaux sont prêts",
    description:
      "Téléchargez les fichiers livrés depuis la section « Fichiers livrés ». Merci d’avoir choisi Elegant Render. Vous pourrez référencer cette commande pour bénéficier de remises sur vos prochains projets.",
    tone: "info",
  },
  closed: {
    title: "Projet clôturé",
    description:
      "La commande a été archivée. Lors de votre prochaine commande, vous pourrez la référencer et bénéficier d’une remise, car le modèle 3D existe déjà.",
    tone: "info",
  },
  cancelled: {
    title: "Commande annulée",
    description:
      "Cette commande n’est plus active. Si vous pensez qu’il s’agit d’une erreur, contactez-nous par chat ou par e-mail.",
    tone: "alert",
  },
  refunded: {
    title: "Fonds remboursés",
    description:
      "La commande a été annulée et les fonds vous ont été restitués. Pour toute question, ou pour commander à nouveau, contactez-nous.",
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
