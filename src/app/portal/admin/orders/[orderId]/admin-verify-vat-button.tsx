/**
 * AdminVerifyVatButton — runs a VIES lookup against the order's
 * company_foreign VAT ID and surfaces the result inline. Stored
 * verification is also rendered as a badge in the customer block
 * above; this button is the trigger.
 *
 * Returns four kinds of feedback:
 *   valid     — green badge in parent ("Verifikovan…") via revalidate
 *   invalid   — destructive inline message
 *   error     — neutral inline (often a VIES outage, retry-able)
 *   unsupported_country — neutral inline ("nije EU zemlja")
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
            text: "VIES kaže: VAT ID nije važeći.",
          });
          router.refresh();
          break;
        case "error":
          setFeedback({
            kind: "neutral",
            text: `VIES greška: ${result.result.reason}. Pokušajte ponovo za par minuta.`,
          });
          break;
        case "unsupported_country":
          setFeedback({
            kind: "neutral",
            text: "Zemlja nije u EU — VIES verifikacija nije primenljiva.",
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
        {pending ? "Proveravam…" : "Proveri VAT (VIES)"}
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
  if (reason === "not_admin") return "Niste admin.";
  if (reason === "order_not_found") return "Porudžbina nije pronađena.";
  if (reason === "not_foreign_company")
    return "Verifikacija je samo za strane firme.";
  if (reason === "missing_vat_data")
    return "VAT ID ili zemlja nedostaju na porudžbini.";
  if (reason === "non_eu_country")
    return "Zemlja nije u EU — VIES nije primenljiv.";
  return `Greška: ${reason}`;
}
