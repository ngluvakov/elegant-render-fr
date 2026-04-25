"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { type QuoteItem } from "@/lib/catalog/calculate";
import { ButtonLink } from "@/components/ui/button-link";
import { requestPortalAccessAction } from "@/server/actions/auth";
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
  const { step, paymentComplete, orderId, initiallySignedIn, customerEmail } =
    useCheckout();

  if (paymentComplete) {
    return (
      <SuccessScreen
        orderId={orderId}
        initiallySignedIn={initiallySignedIn}
        customerEmail={customerEmail}
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
      {step === 1 && <StepUpload />}
      {step === 2 && <StepReview />}
      {step === 3 && <StepPayment />}
    </div>
  );
}

function SuccessScreen({
  orderId,
  initiallySignedIn,
  customerEmail,
}: {
  orderId: string | null;
  initiallySignedIn: boolean;
  customerEmail: string;
}) {
  const [linkState, setLinkState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

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

  const orderHref = orderId ? `/portal/porudzbine/${orderId}` : "/portal";

  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--color-sage)]/15">
        <Check className="h-8 w-8 text-[color:var(--color-sage-deep)]" />
      </div>
      <h2 className="text-3xl text-foreground">Porudžbina primljena!</h2>
      <p className="mt-4 text-muted-foreground">
        Hvala vam na poverenju. Poslali smo potvrdu na{" "}
        <strong className="text-foreground">{customerEmail}</strong>.
      </p>

      {!initiallySignedIn && (
        <div className="mt-6 rounded-2xl border border-border/60 bg-card/60 p-5 text-left">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10">
              <Mail className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1">
              {linkState === "sending" && (
                <p className="text-sm text-muted-foreground">
                  Šaljemo vam link za pristup portalu…
                </p>
              )}
              {linkState === "sent" && (
                <>
                  <p className="text-sm font-semibold text-foreground">
                    Pristupite portalu jednim klikom
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Poslali smo vam link na{" "}
                    <strong className="text-foreground">{customerEmail}</strong>.
                    Klik na link iz email-a vas automatski prijavljuje — bez
                    lozinke.
                  </p>
                  <button
                    type="button"
                    onClick={resend}
                    className="mt-3 text-xs text-accent underline-offset-4 hover:underline"
                  >
                    Pošaljite ponovo
                  </button>
                </>
              )}
              {linkState === "error" && (
                <>
                  <p className="text-sm font-semibold text-destructive">
                    Email nije poslat
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {errorMsg || "Pokušajte ponovo za nekoliko sekundi."}
                  </p>
                  <button
                    type="button"
                    onClick={resend}
                    className="mt-3 text-xs text-accent underline-offset-4 hover:underline"
                  >
                    Pokušajte ponovo
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <ButtonLink href={orderHref} variant="accent" size="lg">
          {initiallySignedIn ? "Otvorite porudžbinu" : "Otvorite portal"}
        </ButtonLink>
        <ButtonLink href="/cene" variant="outline" size="lg">
          Nova porudžbina
        </ButtonLink>
      </div>
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
