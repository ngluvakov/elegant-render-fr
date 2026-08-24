"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { adminTransitionOrder } from "@/server/actions/admin";
import { STATUS_LABELS } from "@/components/portal/status-utils";

const TRANSITIONS: Record<string, string[]> = {
  draft: ["awaiting_payment", "cancelled"],
  awaiting_payment: ["paid", "cancelled"],
  paid: ["in_progress", "cancelled", "refunded"],
  in_progress: ["in_review", "cancelled"],
  in_review: ["revision_requested", "delivered"],
  revision_requested: ["in_progress"],
  delivered: ["closed"],
};

export function AdminStatusChanger({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const available = TRANSITIONS[currentStatus] ?? [];

  if (available.length === 0) return null;

  const handleTransition = async (toStatus: string) => {
    setPending(true);
    setError("");
    const result = await adminTransitionOrder(orderId, toStatus);
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    router.refresh();
  };

  return (
    <div className="rounded-lg border border-border/40 bg-card/60 p-4">
      <p className="mb-3 text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
        Changer le statut
      </p>
      {error && (
        <p className="mb-2 text-xs text-destructive">{error}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {available.map((status) => (
          <Button
            key={status}
            variant={status === "cancelled" || status === "refunded" ? "outline" : "accent"}
            size="sm"
            onClick={() => handleTransition(status)}
            disabled={pending}
          >
            → {STATUS_LABELS[status] ?? status}
          </Button>
        ))}
      </div>
    </div>
  );
}
