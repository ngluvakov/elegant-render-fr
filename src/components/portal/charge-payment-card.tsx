/**
 * ChargePaymentCard — customer-facing payment widget for one OrderCharge.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRsd } from "@/lib/catalog/calculate";
import {
  formatBillingMoney,
  type BillingCurrency,
} from "@/lib/billing";
import { mockCardChargePaymentAction } from "@/server/actions/charge-payment";
import { initiateNestpayChargePayment } from "@/server/actions/nestpay";
import { NestpayRedirectForm } from "@/app/(marketing)/poruci/nestpay-redirect-form";

type Props = {
  chargeId: string;
  totalCents: number;
  billingCurrency: BillingCurrency | null;
  billingTotalCents: number | null;
};

const NESTPAY_TEST_MODE =
  process.env.NEXT_PUBLIC_NESTPAY_MODE === "test";

export function ChargePaymentCard({
  chargeId,
  totalCents,
  billingCurrency,
  billingTotalCents,
}: Props) {
  const [method] = useState<"nestpay" | "card_mock">("nestpay");
  const [pending, setPending] = useState(false);
  const [cardPending, setCardPending] = useState(false);
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
      : formatRsd(totalCents / 100);

  if (success) {
    return (
      <div className="rounded-xl border border-[color:var(--color-sage)]/30 bg-[color:var(--color-sage)]/5 p-4 text-center">
        <Check className="mx-auto h-6 w-6 text-[color:var(--color-sage-deep)]" />
        <p className="mt-2 text-xs font-semibold text-foreground">Plaćanje uspešno</p>
      </div>
    );
  }

  if (redirect) {
    return <NestpayRedirectForm url={redirect.url} fields={redirect.fields} />;
  }

  const handleNestpay = async () => {
    setPending(true);
    setError("");
    const result = await initiateNestpayChargePayment({
      chargeId,
      turnstileToken: null,
    });
    if ("error" in result) {
      setError(result.error);
      setPending(false);
      return;
    }
    setRedirect(result);
  };

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

      <div className="flex items-center gap-2 rounded-lg border border-accent bg-accent/5 p-2.5 text-left text-xs">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground/10">
          <CreditCard className="h-4 w-4" />
        </div>
        <span className="font-medium text-foreground">Platna kartica</span>
        <Check className="ml-auto h-3 w-3 text-accent" />
      </div>

      {method === "nestpay" && (
        <div className="mt-3 space-y-2">
          <Button
            variant="accent"
            size="lg"
            className="w-full"
            onClick={handleNestpay}
            disabled={pending}
          >
            {pending ? "Preusmeravanje…" : `Plati ${amountLabel}`}
          </Button>
        </div>
      )}

      {NESTPAY_TEST_MODE && method === "card_mock" && (
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
            {cardPending ? "Obrada…" : `Plati ${amountLabel} (mock)`}
          </Button>
        </div>
      )}
    </div>
  );
}
