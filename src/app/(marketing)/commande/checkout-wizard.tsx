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
  { label: "Coordonnées", short: "1" },
  { label: "Paiement", short: "2" },
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
                  ? "bg-accent text-accent-foreground"
                  : i === step
                    ? "bg-primary text-primary-foreground"
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
            : "bg-accent/15",
        )}
      >
        {processing ? (
          <Clock className="h-8 w-8 text-accent" />
        ) : (
          <Check className="h-8 w-8 text-foreground" />
        )}
      </div>
      <h2 className="text-3xl text-foreground">
        {processing ? "Votre paiement est en cours de traitement" : "Paiement reçu"}
      </h2>
      <p className="mt-4 text-muted-foreground">
        {processing
          ? "PayPal confirme les paiements par eCheck sous quelques jours — nous vous écrirons dès que le paiement sera validé. Votre commande est enregistrée et aucune action n’est requise de votre part pour le moment."
          : "Merci pour votre commande. Nous avons envoyé une confirmation à"}
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
            title="Importez vos plans maintenant — ou plus tard depuis votre espace client"
            description="Plans, photos et références de style nous permettent de démarrer sans attendre. Vous pourrez toujours les ajouter depuis votre espace client."
          />
        </div>
      )}

      {!initiallySignedIn && (
        <div className="mt-6 rounded-lg border border-border/60 bg-card/60 p-5 text-left">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10">
              <Mail className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1">
              {linkState === "sending" && (
                <p className="text-sm text-muted-foreground">
                  Envoi de votre lien d’accès à l’espace client…
                </p>
              )}
              {linkState === "sent" && (
                <>
                  <p className="text-sm font-semibold text-foreground">
                    Accès à l’espace client en un clic
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Nous avons envoyé un lien à{" "}
                    <strong className="text-foreground">{customerEmail}</strong>.
                    Un clic suffit pour vous connecter automatiquement — sans
                    mot de passe.
                  </p>
                  <button
                    type="button"
                    onClick={resend}
                    className="mt-3 text-xs text-accent underline-offset-4 hover:underline"
                  >
                    Renvoyer
                  </button>
                </>
              )}
              {linkState === "error" && (
                <>
                  <p className="text-sm font-semibold text-destructive">
                    E-mail non envoyé
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {errorMsg || "Réessayez dans quelques secondes."}
                  </p>
                  <button
                    type="button"
                    onClick={resend}
                    className="mt-3 text-xs text-accent underline-offset-4 hover:underline"
                  >
                    Réessayer
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <ButtonLink href={orderHref} variant="accent" size="lg">
          {initiallySignedIn ? "Ouvrir votre commande" : "Ouvrir votre espace client"}
        </ButtonLink>
        <ButtonLink href="/tarifs" variant="outline" size="lg">
          Nouvelle commande
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
      router.replace("/tarifs");
      return;
    }
    try {
      const items = JSON.parse(raw) as QuoteItem[];
      if (!items.length) {
        router.replace("/tarifs");
        return;
      }
      queueMicrotask(() => setQuoteItems(items));
    } catch {
      router.replace("/tarifs");
    }
  }, [router]);

  if (!quoteItems) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Chargement…
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
