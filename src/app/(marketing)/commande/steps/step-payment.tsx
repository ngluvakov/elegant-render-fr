"use client";

/**
 * step-payment.tsx — step 2 of the 2-step checkout: PayPal buttons +
 * amount recap in the charged currency.
 *
 * The server actions charge exactly the snapshot locked at order
 * creation; this component only renders the same converted amount.
 * eCheck captures come back "processing" — the wizard shows an
 * explicit pending state, not a failure. The mock-card tile exists
 * only outside production builds.
 */

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  formatPublicPrice,
  type PublicPricingFormatSettings,
} from "@/lib/catalog/display-currency";
import { track } from "@/lib/posthog-events";
import { pushGoogleDataLayerEvent } from "@/lib/analytics/google-data-layer-client";
import { PayPalButtons } from "@/components/payments/paypal-buttons";
import {
  capturePayPalOrderAction,
  createPayPalOrderAction,
  mockCardPaymentAction,
} from "@/server/actions/payment";
import { useCheckout } from "../checkout-context";

const SHOW_MOCK_CARD = process.env.NODE_ENV !== "production";

export function StepPayment() {
  const {
    orderId,
    calculation,
    setPaymentComplete,
    setPaymentProcessing,
    setStep,
    displayCurrency,
    pricingCatalog,
  } = useCheckout();
  const [error, setError] = useState("");
  const [cardPending, setCardPending] = useState(false);

  const pricingSettings: PublicPricingFormatSettings | undefined =
    pricingCatalog
      ? { serbiaVatRate: pricingCatalog.settings.serbiaVatRate }
      : undefined;
  const amountLabel = formatPublicPrice(
    calculation.total,
    displayCurrency,
    pricingSettings,
  );

  const handleCreate = useCallback(() => {
    track("payment_started", {
      provider: "paypal",
      total_eur: calculation.total,
      charged_currency: displayCurrency,
    });
    return createPayPalOrderAction(orderId ?? "");
  }, [orderId, calculation.total, displayCurrency]);

  const handleCapture = useCallback(
    (paypalOrderId: string) =>
      capturePayPalOrderAction(orderId ?? "", paypalOrderId),
    [orderId],
  );

  const handleSuccess = useCallback(() => {
    track("payment_completed", {
      provider: "paypal",
      total_eur: calculation.total,
      order_number: orderId ?? "",
      charged_currency: displayCurrency,
    });
    setPaymentComplete();
  }, [calculation.total, orderId, displayCurrency, setPaymentComplete]);

  const handleProcessing = useCallback(() => {
    track("payment_processing", {
      provider: "paypal",
      total_eur: calculation.total,
      charged_currency: displayCurrency,
    });
    setPaymentProcessing();
  }, [calculation.total, displayCurrency, setPaymentProcessing]);

  const handleError = useCallback((message: string) => {
    setError(message);
    track("payment_failed", {
      provider: "paypal",
      error_kind: message.slice(0, 80),
    });
  }, []);

  if (!orderId) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
        La commande n’a pas encore été créée. Revenez à l’étape précédente.
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
    if (result.purchaseEvent) {
      pushGoogleDataLayerEvent(result.purchaseEvent);
    }
    setPaymentComplete();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border/60 bg-card/80 p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foreground">Paiement</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Total à payer :{" "}
          <strong className="text-foreground">{amountLabel}</strong>
          {displayCurrency !== "EUR" && (
            <span className="text-muted-foreground">
              {" "}
              — débit en {displayCurrency} ; facture émise en EUR.
            </span>
          )}
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <div className="mt-6">
          <PayPalButtons
            currency={displayCurrency}
            createAction={handleCreate}
            captureAction={handleCapture}
            onSuccess={handleSuccess}
            onProcessing={handleProcessing}
            onError={handleError}
          />
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Vous payez en toute sécurité via PayPal — avec votre solde PayPal
          ou une carte bancaire, sans compte PayPal obligatoire.
        </p>

        {SHOW_MOCK_CARD && (
          <div className="mt-6 border-t border-border/40 pt-5">
            <p className="rounded-lg bg-secondary/60 px-4 py-2.5 text-xs text-muted-foreground">
              Développement uniquement : simulation d’un paiement réussi sans
              contacter PayPal.
            </p>
            <Button
              variant="outline"
              size="lg"
              className="mt-3 w-full"
              onClick={handleMockCard}
              disabled={cardPending}
            >
              {cardPending ? "Traitement…" : `Payer ${amountLabel} (simulation)`}
            </Button>
          </div>
        )}
      </div>

      <Button variant="outline" onClick={() => setStep(0)}>
        Retour aux coordonnées
      </Button>
    </div>
  );
}
