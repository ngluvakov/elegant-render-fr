"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatEur } from "@/lib/catalog/calculate";
import {
  createPayPalOrderAction,
  capturePayPalOrderAction,
  mockCardPaymentAction,
} from "@/server/actions/payment";
import { PayPalPortalButtons } from "./paypal-portal-buttons";

type PendingPaymentCardProps = {
  orderId: string;
  totalEur: number;
};

export function PendingPaymentCard({ orderId, totalEur }: PendingPaymentCardProps) {
  const [method, setMethod] = useState<"paypal" | "card">("paypal");
  const [cardPending, setCardPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

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

  const handleMockCard = async () => {
    setCardPending(true);
    setError("");
    const result = await mockCardPaymentAction(orderId);
    if (result.error) {
      setError(result.error);
      setCardPending(false);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.refresh(), 1500);
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
        <strong className="text-foreground">{formatEur(totalEur)}</strong>
      </p>

      {error && (
        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Method selector */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0070ba] text-[0.5rem] font-bold text-white">
            PP
          </div>
          <span className="font-medium text-foreground">PayPal</span>
          {method === "paypal" && <Check className="ml-auto h-3 w-3 text-accent" />}
        </button>
        <button
          type="button"
          onClick={() => setMethod("card")}
          className={cn(
            "flex items-center gap-2 rounded-xl border p-3 text-left text-xs transition",
            method === "card"
              ? "border-accent bg-accent/5"
              : "border-border/40 hover:border-accent/40",
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/10">
            <CreditCard className="h-4 w-4" />
          </div>
          <span className="font-medium text-foreground">Kartica (test)</span>
          {method === "card" && <Check className="ml-auto h-3 w-3 text-accent" />}
        </button>
      </div>

      {/* PayPal */}
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

      {/* Mock card */}
      {method === "card" && (
        <div className="mt-4 space-y-3">
          <p className="rounded-lg bg-secondary/60 px-3 py-2 text-[0.6rem] text-muted-foreground">
            Test režim — unesite bilo koje podatke.
          </p>
          <div className="space-y-2">
            <Label className="text-xs">Broj kartice</Label>
            <Input defaultValue="4111 1111 1111 1111" className="h-8 text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Ističe</Label>
              <Input defaultValue="12/28" className="h-8 text-xs" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">CVV</Label>
              <Input defaultValue="123" className="h-8 text-xs" />
            </div>
          </div>
          <Button
            variant="accent"
            size="sm"
            className="w-full"
            onClick={handleMockCard}
            disabled={cardPending}
          >
            {cardPending ? "Obrada…" : `Plati ${formatEur(totalEur)}`}
          </Button>
        </div>
      )}
    </div>
  );
}
