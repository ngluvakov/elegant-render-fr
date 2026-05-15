/**
 * ChargePaymentCard — Customer-facing payment widget for one OrderCharge.
 *
 * Mirrors PendingPaymentCard but operates on a charge: PayPal +
 * mock card, shared idempotency guards, refresh on success. Renders
 * in a list inside OrderChargesCard.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatEur } from "@/lib/catalog/calculate";
import {
  formatBillingMoney,
  type BillingCurrency,
} from "@/lib/billing";
import { mockCardChargePaymentAction } from "@/server/actions/charge-payment";
import { PayPalChargeButtons } from "./paypal-charge-buttons";

type Props = {
  chargeId: string;
  totalCents: number;
  billingCurrency: BillingCurrency | null;
  billingTotalCents: number | null;
};

export function ChargePaymentCard({
  chargeId,
  totalCents,
  billingCurrency,
  billingTotalCents,
}: Props) {
  const [method, setMethod] = useState<"paypal" | "card">("paypal");
  const [cardPending, setCardPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const amountLabel =
    billingCurrency && billingTotalCents != null
      ? formatBillingMoney(billingTotalCents, billingCurrency)
      : formatEur(totalCents / 100);

  if (success) {
    return (
      <div className="rounded-xl border border-[color:var(--color-sage)]/30 bg-[color:var(--color-sage)]/5 p-4 text-center">
        <Check className="mx-auto h-6 w-6 text-[color:var(--color-sage-deep)]" />
        <p className="mt-2 text-xs font-semibold text-foreground">Plaćanje uspešno</p>
      </div>
    );
  }

  const handleMockCard = async () => {
    setCardPending(true);
    setError("");
    const result = await mockCardChargePaymentAction(chargeId);
    if (result.error) {
      setError(result.error);
      setCardPending(false);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.refresh(), 1200);
  };

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
      {error && (
        <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMethod("paypal")}
          className={cn(
            "flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs transition",
            method === "paypal"
              ? "border-accent bg-accent/5"
              : "border-border/40 hover:border-accent/40",
          )}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0070ba] text-[0.6rem] font-bold text-white">
            PP
          </div>
          <span className="font-medium text-foreground">PayPal</span>
          {method === "paypal" && <Check className="ml-auto h-3 w-3 text-accent" />}
        </button>
        <button
          type="button"
          onClick={() => setMethod("card")}
          className={cn(
            "flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs transition",
            method === "card"
              ? "border-accent bg-accent/5"
              : "border-border/40 hover:border-accent/40",
          )}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground/10">
            <CreditCard className="h-4 w-4" />
          </div>
          <span className="font-medium text-foreground">Kartica (test)</span>
          {method === "card" && <Check className="ml-auto h-3 w-3 text-accent" />}
        </button>
      </div>

      {method === "paypal" && (
        <div className="mt-3">
          <PayPalChargeButtons
            chargeId={chargeId}
            onSuccess={() => {
              setSuccess(true);
              setTimeout(() => router.refresh(), 1200);
            }}
            onError={(msg) => setError(msg)}
          />
        </div>
      )}

      {method === "card" && (
        <div className="mt-3 space-y-2">
          <p className="rounded-lg bg-secondary/60 px-3 py-2 text-[0.68rem] text-muted-foreground">
            Test režim — unesite bilo koje podatke.
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs">
              <Pencil className="h-3 w-3 text-accent/60" />
              Broj kartice
            </Label>
            <Input defaultValue="4111 1111 1111 1111" className="h-8 text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">
                <Pencil className="h-3 w-3 text-accent/60" />
                Ističe
              </Label>
              <Input defaultValue="12/28" className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                <Pencil className="h-3 w-3 text-accent/60" />
                CVV
              </Label>
              <Input defaultValue="123" className="h-8 text-xs" />
            </div>
          </div>
          <Button
            variant="accent"
            size="lg"
            className="w-full"
            onClick={handleMockCard}
            disabled={cardPending}
          >
            {cardPending ? "Obrada…" : `Plati ${amountLabel}`}
          </Button>
        </div>
      )}
    </div>
  );
}
