/**
 * AdminVerifyVatButton — runs a VIES lookup against the order's
 * company_foreign VAT ID and surfaces the result inline. Stored
 * verification is also rendered as a badge in the customer block
 * above; this button is the trigger.
 *
 * Returns four kinds of feedback:
 *   valid     — green badge in parent ("Verified…") via revalidate
 *   invalid   — destructive inline message
 *   error     — neutral inline (often a VIES outage, retry-able)
 *   unsupported_country — neutral inline ("not an EU country")
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifyOrderVat } from "@/server/actions/verify-vat";

type Props = {
  orderId: string;
};

export function AdminVerifyVatButton({ orderId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<
    | null
    | { kind: "invalid"; text: string }
    | { kind: "neutral"; text: string }
  >(null);

  const handleClick = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await verifyOrderVat(orderId);
      if (!result.ok) {
        setFeedback({ kind: "neutral", text: humanReason(result.reason) });
        return;
      }
      switch (result.result.status) {
        case "valid":
          // Server has updated the snapshot; refresh so the parent
          // badge re-renders with the new vatVerifiedAt + name.
          router.refresh();
          break;
        case "invalid":
          setFeedback({
            kind: "invalid",
            text: "VIES says: VAT ID is invalid.",
          });
          router.refresh();
          break;
        case "error":
          setFeedback({
            kind: "neutral",
            text: `VIES error: ${result.result.reason}. Try again in a few minutes.`,
          });
          break;
        case "unsupported_country":
          setFeedback({
            kind: "neutral",
            text: "Country is not in the EU — VIES verification does not apply.",
          });
          break;
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
        {pending ? "Checking…" : "Verify VAT (VIES)"}
      </button>
      {feedback && (
        <p
          className={`text-[0.78rem] ${
            feedback.kind === "invalid"
              ? "text-destructive"
              : "text-muted-foreground"
          }`}
        >
          {feedback.text}
        </p>
      )}
    </div>
  );
}

function humanReason(reason: string): string {
  if (reason === "not_admin") return "You are not an admin.";
  if (reason === "order_not_found") return "Order was not found.";
  if (reason === "not_foreign_company")
    return "Verification is only for foreign companies.";
  if (reason === "missing_vat_data")
    return "VAT ID or country is missing from the order.";
  if (reason === "non_eu_country")
    return "Country is not in the EU — VIES does not apply.";
  return `Error: ${reason}`;
}
