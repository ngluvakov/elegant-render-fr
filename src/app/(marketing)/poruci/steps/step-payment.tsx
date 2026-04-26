"use client";

import { useState } from "react";
import { Check, CreditCard, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatEur } from "@/lib/catalog/calculate";
import { track } from "@/lib/posthog-events";
import { useCheckout } from "../checkout-context";
import { PayPalButtons } from "../paypal-buttons";
import {
  mockCardPaymentAction,
} from "@/server/actions/payment";

export function StepPayment() {
  const { orderId, calculation, setPaymentComplete, setStep } = useCheckout();
  const [method, setMethod] = useState<"paypal" | "card">("paypal");
  const [cardPending, setCardPending] = useState(false);
  const [error, setError] = useState("");

  if (!orderId) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
        Porudžbina nije kreirana. Vratite se na prethodni korak.
      </div>
    );
  }

  const handleMockCard = async () => {
    setCardPending(true);
    setError("");
    track("payment_started", {
      provider: "card_mock",
      total_eur: calculation.total,
    });
    const result = await mockCardPaymentAction(orderId);
    if (result.error) {
      setError(result.error);
      setCardPending(false);
      track("payment_failed", {
        provider: "card_mock",
        error_kind: result.error.slice(0, 80),
      });
      return;
    }
    track("payment_completed", {
      provider: "card_mock",
      total_eur: calculation.total,
      order_number: orderId,
    });
    setPaymentComplete();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foreground">Plaćanje</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ukupno za plaćanje:{" "}
          <strong className="text-foreground">
            {formatEur(calculation.total)}
          </strong>
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Method selector */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMethod("paypal")}
            className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
              method === "paypal"
                ? "border-accent bg-accent/5"
                : "border-border/60 bg-background/40 hover:border-accent/40"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0070ba] text-white text-xs font-bold">
              PP
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">PayPal</p>
              <p className="text-xs text-muted-foreground">
                Sigurno plaćanje putem PayPal-a
              </p>
            </div>
            {method === "paypal" && (
              <Check className="ml-auto h-4 w-4 text-accent" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMethod("card")}
            className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
              method === "card"
                ? "border-accent bg-accent/5"
                : "border-border/60 bg-background/40 hover:border-accent/40"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/10">
              <CreditCard className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Kartica</p>
              <p className="text-xs text-muted-foreground">
                Visa, Mastercard (test režim)
              </p>
            </div>
            {method === "card" && (
              <Check className="ml-auto h-4 w-4 text-accent" />
            )}
          </button>
        </div>

        {/* PayPal */}
        {method === "paypal" && (
          <div className="mt-6">
            <PayPalButtons
              orderId={orderId}
              onSuccess={() => setPaymentComplete()}
              onError={(msg) => setError(msg)}
            />
          </div>
        )}

        {/* Mock card */}
        {method === "card" && (
          <div className="mt-6 space-y-4">
            <p className="rounded-lg bg-secondary/60 px-4 py-2.5 text-xs text-muted-foreground">
              Ovo je test režim. Unesite bilo koji podatak da simulirate
              plaćanje.
            </p>
            <div className="space-y-2">
              <Label>
                <Pencil className="h-3 w-3 text-accent/60" />
                Broj kartice
              </Label>
              <Input defaultValue="4111 1111 1111 1111" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  <Pencil className="h-3 w-3 text-accent/60" />
                  Ističe
                </Label>
                <Input defaultValue="12/28" />
              </div>
              <div className="space-y-2">
                <Label>
                  <Pencil className="h-3 w-3 text-accent/60" />
                  CVV
                </Label>
                <Input defaultValue="123" />
              </div>
            </div>
            <Button
              variant="accent"
              size="xl"
              className="w-full"
              onClick={handleMockCard}
              disabled={cardPending}
            >
              {cardPending ? "Obrada…" : `Plati ${formatEur(calculation.total)}`}
            </Button>
          </div>
        )}
      </div>

      <Button variant="outline" onClick={() => setStep(2)}>
        Nazad na pregled
      </Button>
    </div>
  );
}
