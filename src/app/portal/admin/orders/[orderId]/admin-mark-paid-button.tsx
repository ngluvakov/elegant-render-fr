/**
 * AdminMarkPaidButton — admin trigger to record a wire transfer
 * payment against an order on the predračun flow. Server action
 * (markWireTransferPaid) flips paymentStatus + transitions to paid
 * and runs the same finishSuccessfulPayment hook used by card payments.
 *
 * Inline confirm pattern: first click reveals "Potvrdi" + "Otkaži"
 * to prevent a stray click from issuing the konačni račun. Mirrors
 * DeleteOrderButton elsewhere in admin.
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markWireTransferPaid } from "@/server/actions/mark-wire-paid";

type Props = {
  orderId: string;
};

export function AdminMarkPaidButton({ orderId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await markWireTransferPaid(orderId);
      if (result.ok) {
        setConfirming(false);
        router.refresh();
      } else {
        setError(humanReason(result.reason));
      }
    });
  };

  if (confirming) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.78rem] text-muted-foreground">
            Označavanjem se izdaje konačni račun i šalje e-pošta kupcu.
          </span>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-[0.78rem] font-medium text-background transition hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Beleženje…" : "Potvrdi uplatu"}
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirming(false);
              setError(null);
            }}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[0.78rem] font-medium text-foreground transition hover:bg-secondary disabled:opacity-50"
          >
            Otkaži
          </button>
        </div>
        {error && (
          <p className="text-[0.78rem] text-destructive">{error}</p>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1.5 rounded-md border border-foreground bg-card px-3 py-1.5 text-[0.78rem] font-medium text-foreground transition hover:bg-foreground hover:text-background"
    >
      Označi uplatu primljenu
    </button>
  );
}

function humanReason(reason: string): string {
  if (reason === "not_admin") return "Niste admin.";
  if (reason === "order_not_found") return "Porudžbina nije pronađena.";
  if (reason === "not_wire_transfer")
    return "Porudžbina nije na predračun-flow-u.";
  if (reason === "no_proforma")
    return "Predračun nije izdat — prvo izdajte predračun.";
  if (reason === "already_paid") return "Uplata je već zabeležena.";
  return `Greška: ${reason}`;
}
