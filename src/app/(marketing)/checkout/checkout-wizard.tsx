"use client";

/**
 * checkout-wizard.tsx — 2-step checkout (details → payment) plus the
 * post-payment SuccessScreen with the moved-after-payment file upload.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { type QuoteItem } from "@/lib/catalog/calculate";
import type { ResolvedPricingCatalog } from "@/lib/pricing/catalog";
import type { DisplayCurrency } from "@/lib/catalog/display-currency";
import { ButtonLink } from "@/components/ui/button-link";
import { OrderFileUpload } from "@/components/portal/order-file-upload";
import { requestPortalAccessAction } from "@/server/actions/auth";
import { CHECKOUT_QUOTE_STORAGE_KEY } from "@/lib/checkout-session";
import {
  CheckoutProvider,
  useCheckout,
  type BuyerInfoState,
  type PaymentState,
} from "./checkout-context";
import { StepDetails } from "./steps/step-details";
import { StepPayment } from "./steps/step-payment";

const STEPS = [
  { label: "Details", short: "1" },
  { label: "Payment", short: "2" },
];

function WizardInner() {
  const {
    step,
    paymentState,
    orderId,
    initiallySignedIn,
    customerEmail,
    calculation,
  } = useCheckout();
  const requiresUpload = calculation.items.some(
    (item) => item.kind === "service",
  );

  if (paymentState !== "idle") {
    return (
      <SuccessScreen
        orderId={orderId}
        initiallySignedIn={initiallySignedIn}
        customerEmail={customerEmail}
        paymentState={paymentState}
        requiresUpload={requiresUpload}
      />
    );
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                i < step
                  ? "bg-[color:var(--color-sage)] text-white"
                  : i === step
                    ? "bg-accent text-white"
                    : "bg-secondary text-muted-foreground",
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : s.short}
            </div>
            <span
              className={cn(
                "hidden text-xs sm:inline",
                i === step ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="mx-1 h-px w-6 bg-border sm:w-10" />
            )}
          </div>
        ))}
      </div>

      {/* Active step */}
      {step === 0 && <StepDetails />}
      {step === 1 && <StepPayment />}
    </div>
  );
}

function SuccessScreen({
  orderId,
  initiallySignedIn,
  customerEmail,
  paymentState,
  requiresUpload,
}: {
  orderId: string | null;
  initiallySignedIn: boolean;
  customerEmail: string;
  paymentState: PaymentState;
  requiresUpload: boolean;
}) {
  const [linkState, setLinkState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const processing = paymentState === "processing";

  useEffect(() => {
    if (initiallySignedIn || !orderId || linkState !== "idle") return;
    setLinkState("sending");
    requestPortalAccessAction(orderId).then((result) => {
      if (result.error) {
        setLinkState("error");
        setErrorMsg(result.error);
      } else {
        setLinkState("sent");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resend = async () => {
    if (!orderId) return;
    setLinkState("sending");
    setErrorMsg("");
    const result = await requestPortalAccessAction(orderId);
    if (result.error) {
      setLinkState("error");
      setErrorMsg(result.error);
    } else {
      setLinkState("sent");
    }
  };

  const orderHref = orderId ? `/portal/orders/${orderId}` : "/portal";

  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <div
        className={cn(
          "mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full",
          processing
            ? "bg-accent/10"
            : "bg-[color:var(--color-sage)]/15",
        )}
      >
        {processing ? (
          <Clock className="h-8 w-8 text-accent" />
        ) : (
          <Check className="h-8 w-8 text-[color:var(--color-sage-deep)]" />
        )}
      </div>
      <h2 className="text-3xl text-foreground">
        {processing ? "Your payment is processing" : "Payment received"}
      </h2>
      <p className="mt-4 text-muted-foreground">
        {processing
          ? "PayPal confirms eCheck payments within a few days — we'll email you as soon as it clears. Your order is saved and nothing else is needed from you right now."
          : "Thank you for your order. We've sent a confirmation to"}
        {!processing && (
          <>
            {" "}
            <strong className="text-foreground">{customerEmail}</strong>.
          </>
        )}
      </p>

      {requiresUpload && orderId && (
        <div className="mt-8">
          <OrderFileUpload
            orderId={orderId}
            title="Upload your plans now — or later from your portal"
            description="Floor plans, photos and style references help us start right away. You can always add them from your portal."
          />
        </div>
      )}

      {!initiallySignedIn && (
        <div className="mt-6 rounded-2xl border border-border/60 bg-card/60 p-5 text-left">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10">
              <Mail className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1">
              {linkState === "sending" && (
                <p className="text-sm text-muted-foreground">
                  Sending your portal access link…
                </p>
              )}
              {linkState === "sent" && (
                <>
                  <p className="text-sm font-semibold text-foreground">
                    One-click portal access
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    We've sent a link to{" "}
                    <strong className="text-foreground">{customerEmail}</strong>.
                    Clicking it signs you in automatically — no password
                    needed.
                  </p>
                  <button
                    type="button"
                    onClick={resend}
                    className="mt-3 text-xs text-accent underline-offset-4 hover:underline"
                  >
                    Send again
                  </button>
                </>
              )}
              {linkState === "error" && (
                <>
                  <p className="text-sm font-semibold text-destructive">
                    Email not sent
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {errorMsg || "Try again in a few seconds."}
                  </p>
                  <button
                    type="button"
                    onClick={resend}
                    className="mt-3 text-xs text-accent underline-offset-4 hover:underline"
                  >
                    Try again
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <ButtonLink href={orderHref} variant="accent" size="lg">
          {initiallySignedIn ? "Open your order" : "Open your portal"}
        </ButtonLink>
        <ButtonLink href="/pricing" variant="outline" size="lg">
          New order
        </ButtonLink>
      </div>
    </div>
  );
}

export function CheckoutWizard({
  userId,
  userName,
  userEmail,
  pricingCatalog,
  displayCurrency,
  initialBuyerInfo,
}: {
  userId: string | null;
  userName: string;
  userEmail: string;
  pricingCatalog?: ResolvedPricingCatalog;
  displayCurrency: DisplayCurrency;
  initialBuyerInfo: BuyerInfoState;
}) {
  const router = useRouter();
  const [quoteItems, setQuoteItems] = useState<QuoteItem[] | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(CHECKOUT_QUOTE_STORAGE_KEY);
    if (!raw) {
      router.replace("/pricing");
      return;
    }
    try {
      const items = JSON.parse(raw) as QuoteItem[];
      if (!items.length) {
        router.replace("/pricing");
        return;
      }
      queueMicrotask(() => setQuoteItems(items));
    } catch {
      router.replace("/pricing");
    }
  }, [router]);

  if (!quoteItems) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <CheckoutProvider
      initialItems={quoteItems}
      initialUserId={userId}
      initialName={userName}
      initialEmail={userEmail}
      pricingCatalog={pricingCatalog}
      displayCurrency={displayCurrency}
      initialBuyerInfo={initialBuyerInfo}
    >
      <WizardInner />
    </CheckoutProvider>
  );
}
