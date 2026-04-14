"use client";

import { useEffect, useRef, useState } from "react";
import {
  createPayPalOrderAction,
  capturePayPalOrderAction,
} from "@/server/actions/payment";

type PayPalButtonsProps = {
  orderId: string;
  onSuccess: () => void;
  onError: (message: string) => void;
};

export function PayPalButtons({ orderId, onSuccess, onError }: PayPalButtonsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const renderedRef = useRef(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      onError("PayPal Client ID nije konfigurisan");
      return;
    }

    // Load PayPal JS SDK
    const existing = document.querySelector('script[src*="paypal.com/sdk"]');
    if (existing) {
      setLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR`;
    script.onload = () => setLoaded(true);
    script.onerror = () => onError("PayPal SDK nije uspeo da se učita");
    document.head.appendChild(script);
  }, [onError]);

  useEffect(() => {
    if (!loaded || !containerRef.current || renderedRef.current) return;
    renderedRef.current = true;

    const paypal = (window as unknown as { paypal: PayPalNamespace }).paypal;
    if (!paypal?.Buttons) return;

    paypal.Buttons({
      style: {
        layout: "vertical",
        color: "gold",
        shape: "rect",
        label: "pay",
        height: 45,
      },
      createOrder: async () => {
        const result = await createPayPalOrderAction(orderId);
        if (result.error) {
          onError(result.error);
          throw new Error(result.error);
        }
        return result.paypalOrderId!;
      },
      onApprove: async (data: { orderID: string }) => {
        const result = await capturePayPalOrderAction(orderId, data.orderID);
        if (result.error) {
          onError(result.error);
          return;
        }
        onSuccess();
      },
      onError: (err: Error) => {
        onError(err.message || "PayPal greška");
      },
    }).render(containerRef.current!);
  }, [loaded, orderId, onSuccess, onError]);

  return (
    <div>
      <div ref={containerRef} />
      {!loaded && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Učitavanje PayPal-a…
        </p>
      )}
    </div>
  );
}

// Minimal PayPal types
type PayPalNamespace = {
  Buttons: (config: {
    style?: Record<string, unknown>;
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onError: (err: Error) => void;
  }) => { render: (el: HTMLElement) => void };
};
