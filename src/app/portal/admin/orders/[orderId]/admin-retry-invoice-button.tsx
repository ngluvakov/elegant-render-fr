/**
 * AdminRetryInvoiceButton — fallback admin trigger that re-runs the
 * invoice issuance pipeline for a paid order whose post-payment hook
 * didn't produce an invoiceNumber. Surfaces the underlying issueInvoice
 * error inline so ops can decide whether to retry or escalate.
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { retryIssueInvoice } from "@/server/actions/retry-invoice";

type Props = {
  orderId: string;
};

export function AdminRetryInvoiceButton({ orderId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await retryIssueInvoice(orderId);
      if (result.ok) {
        router.refresh();
      } else {
        setError(humanReason(result.reason));
      }
    });
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-md border border-foreground bg-card px-3 py-1.5 text-[0.78rem] font-medium text-foreground transition hover:bg-foreground hover:text-background disabled:opacity-50"
      >
        {pending ? "Nouvelle tentative…" : "Relancer l’émission de la facture"}
      </button>
      {error && (
        <p className="text-[0.78rem] text-destructive">{error}</p>
      )}
    </div>
  );
}

function humanReason(reason: string): string {
  if (reason === "not_admin") return "Vous n’avez pas les droits d’administrateur.";
  if (reason === "order_not_found") return "Commande introuvable.";
  if (reason === "not_paid") return "La commande n’est pas payée.";
  if (reason === "no_billable_items")
    return "La commande ne contient aucun article facturable.";
  return `Erreur : ${reason}`;
}
