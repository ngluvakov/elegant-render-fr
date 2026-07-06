/**
 * AdminRefundButton — finance-admin trigger for a full PayPal refund.
 *
 * Inline confirm pattern (mirrors AdminMarkPaidButton): the first click
 * reveals "Refund payment" + "Cancel" so a stray click never moves
 * money. Server action refundPayPalPaymentAction does the actual
 * refund + status flip.
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { refundPayPalPaymentAction } from "@/server/actions/admin-refund";

type Props = {
  orderId: string;
};

export function AdminRefundButton({ orderId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await refundPayPalPaymentAction(orderId);
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
            This refunds the full captured amount through PayPal and marks
            the order refunded.
          </span>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-md bg-destructive px-3 py-1.5 text-[0.78rem] font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Refunding..." : "Refund payment"}
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
            Cancel
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
      className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-card px-3 py-1.5 text-[0.78rem] font-medium text-destructive transition hover:bg-destructive hover:text-white"
    >
      Refund via PayPal
    </button>
  );
}

function humanReason(reason: string): string {
  if (reason === "not_admin") return "You do not have finance permissions.";
  if (reason === "order_not_found") return "Order was not found.";
  if (reason === "not_paypal") return "This order was not paid through PayPal.";
  if (reason === "not_completed")
    return "Only completed payments can be refunded.";
  if (reason === "no_capture_id")
    return "No PayPal capture id on this order — refund it from the PayPal dashboard.";
  return `Error: ${reason}`;
}
