"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  retryProjectInquiryBitrixSync,
  updateProjectInquiryStatus,
} from "@/server/actions/project-inquiry";

const NEXT_STATUS: Record<string, Array<{ to: string; label: string }>> = {
  pending: [
    { to: "in_progress", label: "Pokreni" },
    { to: "closed", label: "Zatvori" },
  ],
  in_progress: [
    { to: "proposal_sent", label: "Ponuda poslata" },
    { to: "converted", label: "Konvertovano" },
    { to: "closed", label: "Zatvori" },
  ],
  proposal_sent: [
    { to: "converted", label: "Konvertovano" },
    { to: "closed", label: "Zatvori" },
    { to: "in_progress", label: "Vrati u razgovor" },
  ],
  converted: [{ to: "closed", label: "Zatvori" }],
  closed: [{ to: "pending", label: "Vrati u čekanje" }],
};

export function ProjectInquiryActions({
  inquiryId,
  status,
  canRetryBitrix,
}: {
  inquiryId: string;
  status: string;
  canRetryBitrix: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
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

  const transitions = NEXT_STATUS[status] ?? [];

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap justify-end gap-1.5">
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
            Retry Bitrix
          </button>
        )}
      </div>
      {error && <p className="text-[0.7rem] text-destructive">{error}</p>}
    </div>
  );
}
