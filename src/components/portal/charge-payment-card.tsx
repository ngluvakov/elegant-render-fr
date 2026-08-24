/**
 * ChargePaymentCard — customer-facing PayPal payment widget for one
 * OrderCharge. Same unified <PayPalButtons> as checkout/portal orders,
 * wired to the charge payment actions; the amount is the charge's
 * charged-amount snapshot (inherits the parent order's currency).
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock } from "lucide-react";
import { formatBillingMoney } from "@/lib/billing";
import { isChargeCurrency } from "@/lib/currency/config";
import { formatChargeAmount } from "@/lib/currency/convert";
import { PayPalButtons } from "@/components/payments/paypal-buttons";
import {
  capturePayPalChargeAction,
  createPayPalChargeAction,
} from "@/server/actions/charge-payment";

type Props = {
  chargeId: string;
  totalCents: number;
  chargedCurrency?: string | null;
  chargedAmountMinor?: number | null;
};

export function ChargePaymentCard({
  chargeId,
  totalCents,
  chargedCurrency,
  chargedAmountMinor,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [state, setState] = useState<"idle" | "completed" | "processing">(
    "idle",
  );

  const hasSnapshot =
    isChargeCurrency(chargedCurrency) &&
    chargedAmountMinor != null &&
    chargedAmountMinor > 0;
  const currency = isChargeCurrency(chargedCurrency) ? chargedCurrency : "EUR";
  const amountLabel = hasSnapshot
    ? formatChargeAmount(chargedAmountMinor, currency)
    : formatBillingMoney(totalCents);

  if (state === "completed") {
    return (
      <div className="rounded-xl border border-border bg-secondary/50 p-4 text-center">
        <Check className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-xs font-semibold text-foreground">
          Paiement reçu
        </p>
      </div>
    );
  }

  if (state === "processing") {
    return (
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-center">
        <Clock className="mx-auto h-6 w-6 text-accent" />
        <p className="mt-2 text-xs font-semibold text-foreground">
          Paiement en cours de traitement
        </p>
        <p className="mt-1 text-[0.72rem] text-muted-foreground">
          PayPal confirme les paiements par eCheck sous quelques jours — nous
          vous enverrons un e-mail dès que le paiement sera validé.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
      {error && (
        <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <p className="mb-3 text-xs text-muted-foreground">
        Montant à régler :{" "}
        <strong className="text-foreground">{amountLabel}</strong>
      </p>

      <PayPalButtons
        currency={currency}
        createAction={() => createPayPalChargeAction(chargeId)}
        captureAction={(paypalOrderId) =>
          capturePayPalChargeAction(chargeId, paypalOrderId)
        }
        onSuccess={() => {
          setState("completed");
          setTimeout(() => router.refresh(), 1200);
        }}
        onProcessing={() => {
          setState("processing");
          setTimeout(() => router.refresh(), 2500);
        }}
        onError={setError}
      />
    </div>
  );
}
