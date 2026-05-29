"use client";

import { useState } from "react";
import { Check, CreditCard, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";
import { PaymentTrustBadges } from "@/components/marketing/payment-trust-badges";
import {
  PUBLIC_EUR_TO_RSD_RATE,
  eurToPublicRsd,
  formatPublicPrice,
  formatPublicPriceFromCents,
  type PublicPricingFormatSettings,
} from "@/lib/catalog/display-currency";
import { track } from "@/lib/posthog-events";
import { useCheckout } from "../checkout-context";
import { PayPalButtons } from "../paypal-buttons";
import { NestpayRedirectForm } from "../nestpay-redirect-form";
import { mockCardPaymentAction } from "@/server/actions/payment";
import { initiateNestpayPayment } from "@/server/actions/nestpay";

type PaymentMethod = "paypal" | "nestpay" | "card_mock";

// Mock card path is dev-only. Render only when explicitly opted in
// via NEXT_PUBLIC_NESTPAY_MODE=test; absence of the env var should
// NOT expose a mock checkout on production.
const NESTPAY_TEST_MODE =
  process.env.NEXT_PUBLIC_NESTPAY_MODE === "test";

export function StepPayment() {
  const {
    orderId,
    calculation,
    setPaymentComplete,
    setStep,
    displayCurrency,
    pricingCatalog,
  } = useCheckout();
  const [method, setMethod] = useState<PaymentMethod>("nestpay");
  const [cardPending, setCardPending] = useState(false);
  const [nestpayPending, setNestpayPending] = useState(false);
  const [error, setError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [redirect, setRedirect] = useState<{
    url: string;
    fields: Record<string, string>;
  } | null>(null);

  const pricingSettings: PublicPricingFormatSettings | undefined =
    pricingCatalog
      ? {
          eurToRsdRate: pricingCatalog.settings.eurToRsdRate,
          serbiaVatRate: pricingCatalog.settings.serbiaVatRate,
        }
      : undefined;
  const formatTotal = (eur: number) =>
    formatPublicPrice(eur, displayCurrency, pricingSettings);

  if (!orderId) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
        Porudžbina nije kreirana. Vratite se na prethodni korak.
      </div>
    );
  }

  if (redirect) {
    return <NestpayRedirectForm url={redirect.url} fields={redirect.fields} />;
  }

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const requiresTurnstile = Boolean(turnstileSiteKey);
  const turnstileConfigMissing =
    process.env.NODE_ENV === "production" && !turnstileSiteKey;
  const hasTurnstileToken =
    !requiresTurnstile || Boolean(turnstileToken);
  const canSubmit =
    acceptedTerms && hasTurnstileToken && !turnstileConfigMissing;

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

  const handleNestpay = async () => {
    setNestpayPending(true);
    setError("");
    track("payment_started", {
      provider: "nestpay",
      total_eur: calculation.total,
    });
    try {
      const result = await initiateNestpayPayment({
        orderId,
        turnstileToken,
      });
      if ("error" in result) {
        setError(result.error);
        setNestpayPending(false);
        track("payment_failed", {
          provider: "nestpay",
          error_kind: result.error.slice(0, 80),
        });
        return;
      }
      setRedirect(result);
    } catch (err) {
      // Network failure or unhandled server rejection. Re-enable the
      // button instead of leaving it stuck on "Preusmeravanje…".
      const message = err instanceof Error ? err.message : "Nepoznata greška";
      setError(`Greška mreže: ${message}`);
      setNestpayPending(false);
      track("payment_failed", {
        provider: "nestpay",
        error_kind: message.slice(0, 80),
      });
    }
  };

  // EUR-displayed visitors see the RSD conversion disclosure mandated by
  // EPM standard 2.1.3. Computed client-side from the same exchange
  // rate used by the configurator and checkout review.
  const conversionRate = pricingSettings?.eurToRsdRate ?? PUBLIC_EUR_TO_RSD_RATE;
  const rsdEquivalent = eurToPublicRsd(calculation.total, pricingSettings);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foreground">Plaćanje</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ukupno za plaćanje:{" "}
          <strong className="text-foreground">
            {formatTotal(calculation.total)}
          </strong>
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {/* Method selector */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMethod("nestpay")}
            className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
              method === "nestpay"
                ? "border-accent bg-accent/5"
                : "border-border/60 bg-background/40 hover:border-accent/40"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/10">
              <CreditCard className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Kartica (Banca Intesa)
              </p>
              <p className="text-xs text-muted-foreground">
                Visa, Mastercard · 3D Secure
              </p>
            </div>
            {method === "nestpay" && (
              <Check className="ml-auto h-4 w-4 text-accent" />
            )}
          </button>

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
        </div>

        {/* Nestpay card */}
        {method === "nestpay" && (
          <div className="mt-6 space-y-4">
            {displayCurrency === "eur" && (
              <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                <strong className="text-foreground">Izjava o konverziji:</strong>{" "}
                Iznos će biti naplaćen u dinarima u protivvrednosti od{" "}
                <strong className="text-foreground">
                  {formatPublicPriceFromCents(rsdEquivalent * 100, "rsd", pricingSettings)}
                </strong>{" "}
                prema kursu Banca Intesa AD Beograd primenjenom na dan
                transakcije (~{conversionRate.toLocaleString("sr-Latn-RS", {
                  maximumFractionDigits: 4,
                })}{" "}
                RSD / EUR). Konverziju vrši banka izdavalac kartice.
              </div>
            )}

            <label className="flex items-start gap-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 cursor-pointer"
                aria-required
              />
              <span>
                Saglasan/saglasna sam sa{" "}
                <a
                  href="/pravno/uslovi"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline"
                >
                  Opštim uslovima
                </a>
                ,{" "}
                <a
                  href="/pravno/privatnost"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline"
                >
                  Politikom privatnosti
                </a>{" "}
                i{" "}
                <a
                  href="/pravno/povracaj-sredstava"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline"
                >
                  Politikom povraćaja sredstava
                </a>
                .
              </span>
            </label>

            {turnstileConfigMissing && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive"
              >
                Sigurnosna provera nije konfigurisana. Potrebno je podesiti
                NEXT_PUBLIC_TURNSTILE_SITE_KEY u produkcionom okruženju.
              </div>
            )}

            {requiresTurnstile && (
              <div aria-label="Sigurnosna provera">
                <TurnstileWidget onVerify={setTurnstileToken} />
              </div>
            )}

            <Button
              variant="accent"
              size="xl"
              className="w-full"
              onClick={handleNestpay}
              disabled={nestpayPending || !canSubmit}
            >
              {nestpayPending
                ? "Preusmeravanje…"
                : `Plati ${formatTotal(calculation.total)} karticom`}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Bezbedno plaćanje — bićete preusmereni na zaštićenu stranicu
              Banca Intesa za unos podataka kartice.
            </p>
            <PaymentTrustBadges className="justify-center" size="sm" />
          </div>
        )}

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

        {/* Legacy mock card — kept in test mode only so dev iteration
            on the post-payment flow doesn't require hitting the real
            Nestpay test gateway. Hidden in production. */}
        {NESTPAY_TEST_MODE && method === "card_mock" && (
          <div className="mt-6 space-y-4">
            <p className="rounded-lg bg-secondary/60 px-4 py-2.5 text-xs text-muted-foreground">
              Test režim. Unesite bilo koji podatak da simulirate plaćanje.
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
              {cardPending
                ? "Obrada…"
                : `Plati ${formatTotal(calculation.total)} (mock)`}
            </Button>
          </div>
        )}

        {NESTPAY_TEST_MODE && method !== "card_mock" && (
          <button
            type="button"
            onClick={() => setMethod("card_mock")}
            className="mt-4 text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Koristi mock karticu (dev)
          </button>
        )}
      </div>

      <Button variant="outline" onClick={() => setStep(2)}>
        Nazad na pregled
      </Button>
    </div>
  );
}
