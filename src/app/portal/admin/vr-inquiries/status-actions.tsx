"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateVrInquiryStatus } from "@/server/actions/vr-inquiry";

const NEXT_STATUS: Record<string, Array<{ to: string; label: string }>> = {
  pending: [
    { to: "in_progress", label: "Start conversation" },
    { to: "closed", label: "Close" },
  ],
  in_progress: [
    { to: "converted", label: "Converted to order" },
    { to: "closed", label: "Close" },
    { to: "pending", label: "Move back to pending" },
  ],
  converted: [{ to: "closed", label: "Close" }],
  closed: [{ to: "pending", label: "Move back to pending" }],
};

export function VrInquiryStatusActions({
  inquiryId,
  status,
}: {
  inquiryId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handle = (next: string) => {
    setError(null);
    startTransition(async () => {
      const res = await updateVrInquiryStatus(
        inquiryId,
        next as "pending" | "in_progress" | "converted" | "closed",
      );
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  const transitions = NEXT_STATUS[status] ?? [];

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap gap-1.5">
        {transitions.map((t) => (
          <button
            key={t.to}
            type="button"
            disabled={pending}
            onClick={() => handle(t.to)}
            className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
          >
            {t.label}
          </button>
        ))}
      </div>
      {error && (
        <p className="text-[0.7rem] text-destructive">{error}</p>
      )}
    </div>
  );
}
