/**
 * PayPalChargeButtons — PayPal payment buttons for an OrderCharge.
 *
 * Mirrors PayPalPortalButtons but plumbs the create/capture actions to
 * the charge-payment.ts server actions. Same SDK, same idempotency
 * pattern (createOrder reuses existing paypalOrderId on retry).
 *
 * Used on: ChargePaymentCard inside the customer order detail page.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import {
  createPayPalChargeAction,
  capturePayPalChargeAction,
} from "@/server/actions/charge-payment";

type Props = {
  chargeId: string;
  onSuccess: () => void;
  onError: (message: string) => void;
};

export function PayPalChargeButtons({ chargeId, onSuccess, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const renderedRef = useRef(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      onError("PayPal nije konfigurisan");
      return;
    }

    const existing = document.querySelector('script[src*="paypal.com/sdk"]');
    if (existing) {
      queueMicrotask(() => setLoaded(true));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR`;
    script.onload = () => setLoaded(true);
    script.onerror = () => onError("PayPal SDK greška");
    document.head.appendChild(script);
  }, [onError]);

  useEffect(() => {
    if (!loaded || !containerRef.current || renderedRef.current) return;
    renderedRef.current = true;

    const paypal = (window as unknown as { paypal: PayPalNS }).paypal;
    if (!paypal?.Buttons) return;

    paypal
      .Buttons({
        style: { layout: "vertical", color: "gold", shape: "rect", label: "pay", height: 40 },
        createOrder: async () => {
          const result = await createPayPalChargeAction(chargeId);
          if (result.error) {
            onError(result.error);
            throw new Error(result.error);
          }
          return result.paypalOrderId!;
        },
        onApprove: async (data: { orderID: string }) => {
          const result = await capturePayPalChargeAction(chargeId, data.orderID);
          if (result.error) {
            onError(result.error);
            return;
          }
          onSuccess();
        },
        onError: (err: Error) => onError(err.message || "PayPal greška"),
      })
      .render(containerRef.current!);
  }, [loaded, chargeId, onSuccess, onError]);

  return (
    <div>
      <div ref={containerRef} />
      {!loaded && (
        <p className="py-3 text-center text-xs text-muted-foreground">
          Učitavanje PayPal-a…
        </p>
      )}
    </div>
  );
}

type PayPalNS = {
  Buttons: (config: {
    style?: Record<string, unknown>;
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onError: (err: Error) => void;
  }) => { render: (el: HTMLElement) => void };
};
