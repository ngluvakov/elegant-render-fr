/**
 * RetryOutboxButton — admin-only trigger to requeue a failed
 * OutboxEvent row. Calls retryOutboxEvent server action and
 * refreshes the page so the row flips to pending tone.
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { retryOutboxEvent } from "@/server/actions/outbox-admin";

export function RetryOutboxButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await retryOutboxEvent(eventId);
      if (result.ok) {
        router.refresh();
      } else {
        setError(humanReason(result.reason));
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-md border border-foreground bg-card px-2.5 py-1 text-[0.72rem] font-medium text-foreground transition hover:bg-foreground hover:text-background disabled:opacity-50"
      >
        {pending ? "Sending..." : "Send again"}
      </button>
      {error && (
        <p className="text-[0.7rem] text-destructive">{error}</p>
      )}
    </div>
  );
}

function humanReason(reason: string): string {
  if (reason === "not_admin") return "You are not an admin.";
  if (reason === "event_not_found") return "Event was not found.";
  if (reason.startsWith("cannot_retry_"))
    return `Cannot retry - status is ${reason.replace("cannot_retry_", "")}.`;
  return `Error: ${reason}`;
}
