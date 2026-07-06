/**
 * PendingPaymentCard — PayPal payment card for unpaid orders.
 *
 * Renders the unified <PayPalButtons> wired to the order payment
 * actions; the amount shown is the order's charged-amount snapshot
 * (the exact amount PayPal captures).
 *
 * Used on: /portal/orders/[orderId] (order detail page, when unpaid).
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Clock } from "lucide-react";
import { formatBillingMoney } from "@/lib/billing";
import { isChargeCurrency } from "@/lib/currency/config";
import { formatChargeAmount } from "@/lib/currency/convert";
import { track } from "@/lib/posthog-events";
import { PayPalButtons } from "@/components/payments/paypal-buttons";
import {
  capturePayPalOrderAction,
  createPayPalOrderAction,
} from "@/server/actions/payment";

type PendingPaymentCardProps = {
  orderId: string;
  totalEur: number;
  totalCents?: number | null;
  chargedCurrency?: string | null;
  chargedAmountMinor?: number | null;
};

export function PendingPaymentCard({
  orderId,
  totalEur,
  totalCents,
  chargedCurrency,
  chargedAmountMinor,
}: PendingPaymentCardProps) {
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
    : formatBillingMoney(totalCents ?? totalEur * 100);

  if (state === "completed") {
    return (
      <div className="rounded-2xl border border-[color:var(--color-sage)]/30 bg-[color:var(--color-sage)]/5 p-6 text-center">
        <Check className="mx-auto h-6 w-6 text-[color:var(--color-sage-deep)]" />
        <p className="mt-2 text-sm font-semibold text-foreground">
          Payment received
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Thank you — refreshing the order…
        </p>
      </div>
    );
  }

  if (state === "processing") {
    return (
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center">
        <Clock className="mx-auto h-6 w-6 text-accent" />
        <p className="mt-2 text-sm font-semibold text-foreground">
          Your payment is processing
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PayPal confirms eCheck payments within a few days — we&apos;ll
          email you as soon as it clears.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">
          Awaiting payment
        </h3>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        This order has not been paid yet. Total:{" "}
        <strong className="text-foreground">{amountLabel}</strong>
        {currency !== "EUR" && (
          <span> — charged in {currency}; invoice issued in EUR.</span>
        )}
      </p>

      {error && (
        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="mt-4">
        <PayPalButtons
          currency={currency}
          createAction={() => {
            track("payment_started", {
              provider: "paypal",
              total_eur: totalEur,
              charged_currency: currency,
            });
            return createPayPalOrderAction(orderId);
          }}
          captureAction={(paypalOrderId) =>
            capturePayPalOrderAction(orderId, paypalOrderId)
          }
          onSuccess={() => {
            track("payment_completed", {
              provider: "paypal",
              total_eur: totalEur,
              order_number: orderId,
              charged_currency: currency,
            });
            setState("completed");
            setTimeout(() => router.refresh(), 1200);
          }}
          onProcessing={() => {
            setState("processing");
            setTimeout(() => router.refresh(), 2500);
          }}
          onError={(message) => {
            setError(message);
            track("payment_failed", {
              provider: "paypal",
              error_kind: message.slice(0, 80),
            });
          }}
        />
      </div>
      <p className="mt-3 text-center text-[0.72rem] text-muted-foreground">
        You pay securely through PayPal — with your PayPal balance or a
        card, no PayPal account required.
      </p>
    </div>
  );
}
