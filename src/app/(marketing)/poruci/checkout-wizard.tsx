"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { type QuoteItem } from "@/lib/catalog/calculate";
import { ButtonLink } from "@/components/ui/button-link";
import { CheckoutProvider, useCheckout } from "./checkout-context";
import { StepDetails } from "./steps/step-details";
import { StepUpload } from "./steps/step-upload";
import { StepReview } from "./steps/step-review";
import { StepPayment } from "./steps/step-payment";

const STEPS = [
  { label: "Podaci", short: "1" },
  { label: "Fajlovi", short: "2" },
  { label: "Pregled", short: "3" },
  { label: "Plaćanje", short: "4" },
];

function WizardInner() {
  const { step, paymentComplete, orderId } = useCheckout();

  if (paymentComplete) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--color-sage)]/15">
          <Check className="h-8 w-8 text-[color:var(--color-sage-deep)]" />
        </div>
        <h2 className="text-3xl text-foreground">Porudžbina primljena!</h2>
        <p className="mt-4 text-muted-foreground">
          Hvala vam na poverenju. Poslali smo potvrdu na vašu email adresu.
          Možete pratiti status porudžbine u portalu.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <ButtonLink href="/portal" variant="accent" size="lg">
            Otvorite portal
          </ButtonLink>
          <ButtonLink href="/cene" variant="outline" size="lg">
            Nova porudžbina
          </ButtonLink>
        </div>
      </div>
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
      {step === 1 && <StepUpload />}
      {step === 2 && <StepReview />}
      {step === 3 && <StepPayment />}
    </div>
  );
}

export function CheckoutWizard({
  userId,
  userName,
  userEmail,
}: {
  userId: string | null;
  userName: string;
  userEmail: string;
}) {
  const router = useRouter();
  const [quoteItems, setQuoteItems] = useState<QuoteItem[] | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("er-checkout-quote");
    if (!raw) {
      router.replace("/cene");
      return;
    }
    try {
      const items = JSON.parse(raw) as QuoteItem[];
      if (!items.length) {
        router.replace("/cene");
        return;
      }
      setQuoteItems(items);
    } catch {
      router.replace("/cene");
    }
  }, [router]);

  if (!quoteItems) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Učitavanje…
      </div>
    );
  }

  return (
    <CheckoutProvider
      initialItems={quoteItems}
      initialUserId={userId}
      initialName={userName}
      initialEmail={userEmail}
    >
      <WizardInner />
    </CheckoutProvider>
  );
}
