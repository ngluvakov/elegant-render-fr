"use client";

/**
 * PayPalButtons — the single JS-SDK button component used by checkout,
 * the portal pending-payment card and the add-on charge card.
 *
 * Successor of the three near-identical pre-fork components
 * (poruci/paypal-buttons, portal/paypal-portal-buttons,
 * portal/paypal-charge-buttons): the caller injects the create/capture
 * server actions, so the component knows nothing about orders vs
 * charges. The SDK loads once per page in the order's presentment
 * currency (one order per page, so one currency per page).
 *
 * Capture result semantics:
 *  - status "completed": funds captured — the caller shows success.
 *  - status "processing": eCheck capture is PENDING; the webhook or
 *    the reconcile cron completes it later — the caller shows a
 *    "payment is processing" state, NOT a failure.
 */

import { useEffect, useRef, useState } from "react";
import { pushGoogleDataLayerEvent } from "@/lib/analytics/google-data-layer-client";
import type { GooglePurchaseDataLayerEvent } from "@/lib/analytics/google-data-layer";

export type PayPalCaptureOutcome = {
  error?: string;
  status?: "completed" | "processing";
  purchaseEvent?: GooglePurchaseDataLayerEvent | null;
};

export type PayPalCreateOutcome = {
  error?: string;
  paypalOrderId?: string;
};

type PayPalButtonsProps = {
  /** ISO-4217 presentment currency the SDK renders and charges in. */
  currency: string;
  createAction: () => Promise<PayPalCreateOutcome>;
  captureAction: (paypalOrderId: string) => Promise<PayPalCaptureOutcome>;
  onSuccess: () => void;
  /** eCheck PENDING capture — funds not cleared yet, not a failure. */
  onProcessing?: () => void;
  onError: (message: string) => void;
};

export function PayPalButtons({
  currency,
  createAction,
  captureAction,
  onSuccess,
  onProcessing,
  onError,
}: PayPalButtonsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const renderedRef = useRef(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      onError("PayPal n’est pas configuré (identifiant client manquant).");
      return;
    }

    const existing = document.querySelector('script[src*="paypal.com/sdk"]');
    if (existing) {
      queueMicrotask(() => setLoaded(true));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId,
    )}&currency=${encodeURIComponent(currency)}&intent=capture&disable-funding=credit,paylater`;
    script.onload = () => setLoaded(true);
    script.onerror = () => onError("Le SDK PayPal n’a pas pu se charger. Veuillez actualiser la page et réessayer.");
    document.head.appendChild(script);
  }, [currency, onError]);

  useEffect(() => {
    if (!loaded || !containerRef.current || renderedRef.current) return;
    renderedRef.current = true;

    const paypal = (window as unknown as { paypal?: PayPalNamespace }).paypal;
    if (!paypal?.Buttons) {
      onError("Le SDK PayPal n’a pas pu s’initialiser. Veuillez actualiser la page et réessayer.");
      return;
    }

    paypal
      .Buttons({
        style: {
          layout: "vertical",
          color: "black",
          shape: "rect",
          label: "pay",
          height: 45,
        },
        createOrder: async () => {
          const result = await createAction();
          if (result.error || !result.paypalOrderId) {
            const message = result.error ?? "Impossible de démarrer le paiement PayPal.";
            onError(message);
            throw new Error(message);
          }
          return result.paypalOrderId;
        },
        onApprove: async (data: { orderID: string }) => {
          const result = await captureAction(data.orderID);
          if (result.error) {
            onError(result.error);
            return;
          }
          if (result.purchaseEvent) {
            pushGoogleDataLayerEvent(result.purchaseEvent);
          }
          if (result.status === "processing") {
            (onProcessing ?? onSuccess)();
            return;
          }
          onSuccess();
        },
        onError: (err: Error) => {
          onError(err?.message || "PayPal a signalé une erreur. Aucun montant n’a été débité.");
        },
      })
      .render(containerRef.current);
  }, [loaded, createAction, captureAction, onSuccess, onProcessing, onError]);

  return (
    <div>
      <div ref={containerRef} />
      {!loaded && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Chargement de PayPal…
        </p>
      )}
    </div>
  );
}

// Minimal PayPal JS SDK surface we use.
type PayPalNamespace = {
  Buttons: (config: {
    style?: Record<string, unknown>;
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onError: (err: Error) => void;
  }) => { render: (el: HTMLElement) => void };
};
