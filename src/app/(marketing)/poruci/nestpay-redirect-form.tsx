"use client";

/**
 * NestpayRedirectForm — auto-submitting hidden form for the Nestpay
 * HPP redirect. After `initiateNestpayPayment` returns { url, fields },
 * the checkout swaps the payment step for this component. It renders
 * a "Preusmeravanje na Banca Intesa…" splash and submits the form
 * once on mount. The customer lands on the bank's hosted card-entry
 * page; the bank later POSTs the result back to /api/nestpay/return.
 */

import { useEffect, useRef } from "react";

export type NestpayRedirectFormProps = {
  url: string;
  fields: Record<string, string>;
};

export function NestpayRedirectForm({ url, fields }: NestpayRedirectFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);

  useEffect(() => {
    // Guard against React 18 StrictMode double-mount in dev (the form
    // POST is not idempotent on the bank side — Nestpay would log two
    // attempts and clutter Merchant Center).
    if (submitted.current) return;
    submitted.current = true;
    formRef.current?.submit();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-border/60 bg-card/80 p-8 text-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-accent/30 border-t-accent"
        aria-hidden
      />
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Preusmeravanje na Banca Intesa…
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ne zatvarajte prozor. Stranica banke se otvara automatski.
        </p>
      </div>
      <form ref={formRef} method="POST" action={url} className="hidden">
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      </form>
    </div>
  );
}
