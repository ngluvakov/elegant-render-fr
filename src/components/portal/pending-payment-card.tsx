/**
 * PendingPaymentCard — Payment card for unpaid orders, supporting
 * Nestpay (Banca Intesa), PayPal, and (in test mode) a mock card path.
 * Shows total and switches to success state on completion. For unpaid
 * orders that already have a Nestpay snapshot from a prior failed
 * attempt, this is the resume surface.
 *
 * Used on: /portal/porudzbine/[orderId] (order detail page, when unpaid).
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatEur } from "@/lib/catalog/calculate";
import {
  formatBillingMoney,
  type BillingCurrency,
} from "@/lib/billing";
import { track } from "@/lib/posthog-events";
import { initiateNestpayPayment } from "@/server/actions/nestpay";
import { NestpayRedirectForm } from "@/app/(marketing)/poruci/nestpay-redirect-form";
import { PayPalPortalButtons } from "./paypal-portal-buttons";

type PendingPaymentCardProps = {
  orderId: string;
  totalEur: number;
  totalCents?: number | null;
  billingCurrency?: BillingCurrency | null;
  billingTotalCents?: number | null;
};

export function PendingPaymentCard({
  orderId,
  totalEur,
  totalCents,
  billingCurrency,
  billingTotalCents,
}: PendingPaymentCardProps) {
  const [method, setMethod] = useState<"paypal" | "nestpay">("nestpay");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [redirect, setRedirect] = useState<{
    url: string;
    fields: Record<string, string>;
  } | null>(null);
  const router = useRouter();
  const amountLabel =
    billingCurrency && billingTotalCents != null
      ? formatBillingMoney(billingTotalCents, billingCurrency)
      : formatEur((totalCents ?? totalEur * 100) / 100);

  if (success) {
    return (
      <div className="rounded-2xl border border-[color:var(--color-sage)]/30 bg-[color:var(--color-sage)]/5 p-6 text-center">
        <Check className="mx-auto h-8 w-8 text-[color:var(--color-sage-deep)]" />
        <p className="mt-3 text-sm font-semibold text-foreground">
          Plaćanje uspešno!
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Stranica će se osvežiti za trenutak.
        </p>
      </div>
    );
  }

  if (redirect) {
    return <NestpayRedirectForm url={redirect.url} fields={redirect.fields} />;
  }

  const handleNestpay = async () => {
    setPending(true);
    setError("");
    track("payment_started", { provider: "nestpay", total_eur: totalEur });
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
        <strong className="text-foreground">
          {amountLabel}
        </strong>
      </p>

      {error && (
        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMethod("nestpay")}
          className={cn(
            "flex items-center gap-2 rounded-xl border p-3 text-left text-xs transition",
            method === "nestpay"
              ? "border-accent bg-accent/5"
              : "border-border/40 hover:border-accent/40",
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/10">
            <CreditCard className="h-4 w-4" />
          </div>
          <span className="font-medium text-foreground">
            Platna kartica
          </span>
          {method === "nestpay" && (
            <Check className="ml-auto h-3 w-3 text-accent" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setMethod("paypal")}
          className={cn(
            "flex items-center gap-2 rounded-xl border p-3 text-left text-xs transition",
            method === "paypal"
              ? "border-accent bg-accent/5"
              : "border-border/40 hover:border-accent/40",
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0070ba] text-[0.62rem] font-bold text-white">
            PP
          </div>
          <span className="font-medium text-foreground">PayPal</span>
          {method === "paypal" && (
            <Check className="ml-auto h-3 w-3 text-accent" />
          )}
        </button>
      </div>

      {method === "nestpay" && (
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
      )}

      {method === "paypal" && (
        <div className="mt-4">
          <PayPalPortalButtons
            orderId={orderId}
            onSuccess={() => {
              setSuccess(true);
              setTimeout(() => router.refresh(), 1500);
            }}
            onError={(msg) => setError(msg)}
          />
        </div>
      )}
    </div>
  );
}
