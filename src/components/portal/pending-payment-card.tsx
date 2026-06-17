/**
 * PendingPaymentCard — NestPay card payment card for unpaid orders.
 *
 * Used on: /portal/porudzbine/[orderId] (order detail page, when unpaid).
 */
"use client";

import { useState } from "react";
import { AlertCircle, Check, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRsd } from "@/lib/catalog/calculate";
import {
  formatBillingMoney,
  type BillingCurrency,
} from "@/lib/billing";
import { track } from "@/lib/posthog-events";
import { initiateNestpayPayment } from "@/server/actions/nestpay";
import { NestpayRedirectForm } from "@/app/(marketing)/poruci/nestpay-redirect-form";

type PendingPaymentCardProps = {
  orderId: string;
  totalRsd: number;
  totalCents?: number | null;
  billingCurrency?: BillingCurrency | null;
  billingTotalCents?: number | null;
};

export function PendingPaymentCard({
  orderId,
  totalRsd,
  totalCents,
  billingCurrency,
  billingTotalCents,
}: PendingPaymentCardProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [redirect, setRedirect] = useState<{
    url: string;
    fields: Record<string, string>;
  } | null>(null);
  const amountLabel =
    billingCurrency && billingTotalCents != null
      ? formatBillingMoney(billingTotalCents, billingCurrency)
      : formatRsd((totalCents ?? totalRsd * 100) / 100);

  if (redirect) {
    return <NestpayRedirectForm url={redirect.url} fields={redirect.fields} />;
  }

  const handleNestpay = async () => {
    setPending(true);
    setError("");
    track("payment_started", { provider: "nestpay", total_rsd: totalRsd });
    const result = await initiateNestpayPayment({ orderId, turnstileToken: null });
    if ("error" in result) {
      setError(result.error);
      setPending(false);
      track("payment_failed", {
        provider: "nestpay",
        error_kind: result.error.slice(0, 80),
      });
      return;
    }
    setRedirect(result);
  };

  return (
    <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">
          Čeka uplatu
        </h3>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Ova porudžbina još nije plaćena. Ukupno:{" "}
        <strong className="text-foreground">{amountLabel}</strong>
      </p>

      {error && (
        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-accent bg-accent/5 p-3 text-left text-xs">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/10">
          <CreditCard className="h-4 w-4" />
        </div>
        <span className="font-medium text-foreground">Platna kartica</span>
        <Check className="ml-auto h-3 w-3 text-accent" />
      </div>

      <div className="mt-4 space-y-3">
        <Button
          variant="accent"
          size="xl"
          className="w-full"
          onClick={handleNestpay}
          disabled={pending}
        >
          {pending ? "Preusmeravanje…" : `Plati ${amountLabel} karticom`}
        </Button>
        <p className="text-center text-[0.72rem] text-muted-foreground">
          Bezbedno plaćanje — preusmeravamo Vas na zaštićenu stranicu Banca
          Intesa za unos podataka kartice.
        </p>
      </div>
    </div>
  );
}
