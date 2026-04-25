/**
 * StatusUtils — Shared status label map, badge color helper, and ordered
 * step definitions used by StatusTracker and all order-related components.
 *
 * Used on: StatusTracker, OrderDetailHero, OrderOverviewCard, OrdersFilterBar.
 */
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

// Customer-friendly explanation for each order status. The `tone` drives
// how the StatusTracker renders the guidance card:
//   - "action" — customer is expected to do something (highlighted)
//   - "info"   — purely informational (default sage)
//   - "alert"  — off-track (cancelled / refunded) — shown in destructive
export type StatusTone = "action" | "info" | "alert";

export const STATUS_GUIDANCE: Record<
  string,
  { title: string; description: string; tone: StatusTone }
> = {
  draft: {
    title: "Pripremite stavke za plaćanje",
    description:
      "Popunite sve stavke (naziv, broj kadrova, opis, fajlovi) — kad bude sve spremno, kliknite na „Nastavi na plaćanje“ u sumarnoj kartici.",
    tone: "action",
  },
  awaiting_payment: {
    title: "Završite plaćanje",
    description:
      "Stavke su zaključane. Čim primimo uplatu, naš tim počinje izradu — prvi nacrti za 24–48 časova.",
    tone: "action",
  },
  paid: {
    title: "Plaćanje primljeno",
    description:
      "Hvala! Naš tim je započeo pripremu projekta. Prve nacrte šaljemo u roku od 24–48 časova.",
    tone: "info",
  },
  in_progress: {
    title: "Tim radi na vašem projektu",
    description:
      "Obavestićemo vas čim budu spremni nacrti za pregled. U međuvremenu možete dodavati napomene i fajlove na pojedinačne stavke.",
    tone: "info",
  },
  in_review: {
    title: "Pregled je na vama",
    description:
      "Naš tim je poslao prve render-e. Pogledajte fajlove i odgovorite — odobrite ih ili zatražite izmene. Imate do 5 radnih dana.",
    tone: "action",
  },
  revision_requested: {
    title: "Tim radi na izmenama",
    description:
      "Vaše izmene su primljene. Procena za novu verziju: 2–3 radna dana. Bićete obavešteni čim bude spremno.",
    tone: "info",
  },
  delivered: {
    title: "Finalni fajlovi su spremni",
    description:
      "Preuzmite isporučene fajlove iz sekcije „Isporučeni fajlovi“. Hvala što ste izabrali Elegant Render — iskoristite ovu porudžbinu kao referencu za buduće popuste.",
    tone: "info",
  },
  closed: {
    title: "Projekat zatvoren",
    description:
      "Porudžbina je arhivirana. Pri sledećoj porudžbini možete je referencirati i dobiti popust — model je već izgrađen.",
    tone: "info",
  },
  cancelled: {
    title: "Porudžbina otkazana",
    description:
      "Ova porudžbina više nije aktivna. Ako mislite da je ovo greška, kontaktirajte nas preko chat-a ili e-pošte.",
    tone: "alert",
  },
  refunded: {
    title: "Sredstva refundirana",
    description:
      "Porudžbina je otkazana i sredstva vraćena. Ako imate pitanja ili želite da naručite ponovo, slobodno nas kontaktirajte.",
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
