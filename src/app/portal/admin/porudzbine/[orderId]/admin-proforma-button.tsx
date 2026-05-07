/**
 * AdminProformaButton — admin trigger to issue a predračun for an
 * order on the wire-transfer path. Server action runs the
 * issueProforma pipeline (PDF + Supabase + email + audit log).
 *
 * Idempotent: the server action returns the existing proformaNumber
 * if one was already issued, so a stuck UI / double-click can't
 * burn a counter slot.
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { issueProforma } from "@/server/actions/issue-proforma";

type Props = {
  orderId: string;
  alreadyIssued: boolean;
};

export function AdminProformaButton({ orderId, alreadyIssued }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState(alreadyIssued);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await issueProforma(orderId);
      if (result.ok) {
        setIssued(true);
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
        className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-[0.78rem] font-medium text-background transition hover:opacity-90 disabled:opacity-50"
      >
        {pending
          ? "Izdajem…"
          : issued
            ? "Ponovo izdaj predračun"
            : "Izdaj predračun"}
      </button>
      {error && (
        <p className="text-[0.78rem] text-destructive">{error}</p>
      )}
    </div>
  );
}

function humanReason(reason: string): string {
  if (reason === "not_admin") return "Niste admin.";
  if (reason === "order_not_found") return "Porudžbina nije pronađena.";
  if (reason === "no_billable_items") return "Porudžbina nema naplatljive stavke.";
  return `Greška pri izdavanju: ${reason}`;
}
