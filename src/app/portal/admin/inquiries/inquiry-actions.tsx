"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  retryProjectInquiryBitrixSync,
  updateProjectInquiryStatus,
} from "@/server/actions/project-inquiry";
import { convertInquiryToOrder } from "@/server/actions/convert-inquiry-to-order";

const NEXT_STATUS: Record<string, Array<{ to: string; label: string }>> = {
  pending: [
    { to: "in_progress", label: "Démarrer" },
    { to: "closed", label: "Fermer" },
  ],
  in_progress: [
    { to: "proposal_sent", label: "Devis envoyé" },
    { to: "converted", label: "Convertie" },
    { to: "closed", label: "Fermer" },
  ],
  proposal_sent: [
    { to: "converted", label: "Convertie" },
    { to: "closed", label: "Fermer" },
    { to: "in_progress", label: "Revenir à la discussion" },
  ],
  converted: [{ to: "closed", label: "Fermer" }],
  closed: [{ to: "pending", label: "Repasser en attente" }],
};

export function ProjectInquiryActions({
  inquiryId,
  status,
  canRetryBitrix,
  canConvertToOrder,
}: {
  inquiryId: string;
  status: string;
  canRetryBitrix: boolean;
  canConvertToOrder: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingConvert, setConfirmingConvert] = useState(false);
  const router = useRouter();

  const changeStatus = (next: string) => {
    setError(null);
    startTransition(async () => {
      const res = await updateProjectInquiryStatus(
        inquiryId,
        next as "pending" | "in_progress" | "proposal_sent" | "converted" | "closed",
      );
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  const retryBitrix = () => {
    setError(null);
    startTransition(async () => {
      const res = await retryProjectInquiryBitrixSync(inquiryId);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  const convertToOrder = () => {
    setError(null);
    startTransition(async () => {
      const res = await convertInquiryToOrder(inquiryId);
      if (!res.ok) {
        setError(humanConvertReason(res.reason));
        setConfirmingConvert(false);
        return;
      }
      router.push(`/portal/admin/orders/${res.orderId}`);
    });
  };

  const transitions = NEXT_STATUS[status] ?? [];
  const canConvert = status !== "converted" && status !== "closed";

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap justify-end gap-1.5">
        {canConvertToOrder &&
          canConvert &&
          (confirmingConvert ? (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={convertToOrder}
                className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition hover:opacity-90 disabled:opacity-50"
              >
                {pending ? "Conversion…" : "Confirmer la conversion"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirmingConvert(false)}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-secondary disabled:opacity-50"
              >
                Annuler
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmingConvert(true)}
              className="rounded-md border border-foreground bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-foreground hover:text-background disabled:opacity-50"
            >
              Convertir en commande
            </button>
          ))}
        {transitions.map((transition) => (
          <button
            key={transition.to}
            type="button"
            disabled={pending}
            onClick={() => changeStatus(transition.to)}
            className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
          >
            {transition.label}
          </button>
        ))}
        {canRetryBitrix && (
          <button
            type="button"
            disabled={pending}
            onClick={retryBitrix}
            className="rounded-md border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/15 disabled:opacity-50"
          >
            Relancer Bitrix
          </button>
        )}
      </div>
      {error && <p className="text-[0.7rem] text-destructive">{error}</p>}
    </div>
  );
}

function humanConvertReason(reason: string): string {
  if (reason === "not_admin") return "Vous n’êtes pas administrateur.";
  if (reason === "inquiry_not_found") return "La demande est introuvable.";
  if (reason === "already_converted")
    return "La demande a déjà été convertie en commande.";
  return `Erreur : ${reason}`;
}
