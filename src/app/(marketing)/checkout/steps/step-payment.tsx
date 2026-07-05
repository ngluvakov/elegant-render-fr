"use client";

import { useState } from "react";
import { Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";
import { PaymentTrustBadges } from "@/components/marketing/payment-trust-badges";
import {
  formatPublicPrice,
  type PublicPricingFormatSettings,
} from "@/lib/catalog/display-currency";
import { track } from "@/lib/posthog-events";
import { useCheckout } from "../checkout-context";
import { NestpayRedirectForm } from "../nestpay-redirect-form";
import { mockCardPaymentAction } from "@/server/actions/payment";
import { initiateNestpayPayment } from "@/server/actions/nestpay";
import { NESTPAY_INSTALLMENT_OPTIONS } from "@/lib/nestpay/installments";
import { isTurnstileTestingSiteKey } from "@/lib/turnstile-keys";
import { pushGoogleDataLayerEvent } from "@/lib/analytics/google-data-layer-client";

type PaymentMethod = "nestpay" | "card_mock";

// Mock card path is dev-only. Render only when explicitly opted in
// via NEXT_PUBLIC_NESTPAY_MODE=test; absence of the env var should
// NOT expose a mock checkout on production.
const NESTPAY_TEST_MODE =
  process.env.NEXT_PUBLIC_NESTPAY_MODE === "test";
const NESTPAY_INSTALLMENTS_ENABLED =
  process.env.NEXT_PUBLIC_NESTPAY_INSTALLMENTS_ENABLED === "true";

export function StepPayment() {
  const {
    orderId,
    calculation,
    installmentCount,
    setInstallmentCount,
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
          rsdRate: pricingCatalog.settings.rsdRate,
          serbiaVatRate: pricingCatalog.settings.serbiaVatRate,
        }
      : undefined;
  const formatTotal = (amountRsd: number) =>
    formatPublicPrice(amountRsd, displayCurrency, pricingSettings);

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
  const turnstileUsesTestingSiteKey =
    process.env.NODE_ENV === "production" &&
    isTurnstileTestingSiteKey(turnstileSiteKey);
  const requiresTurnstile =
    Boolean(turnstileSiteKey) && !turnstileUsesTestingSiteKey;
  const turnstileConfigMissing =
    process.env.NODE_ENV === "production" && !turnstileSiteKey;
  const turnstileConfigError = turnstileConfigMissing
    ? "Sigurnosna provera nije konfigurisana. Potrebno je podesiti NEXT_PUBLIC_TURNSTILE_SITE_KEY u produkcionom okruženju."
    : turnstileUsesTestingSiteKey
      ? "Sigurnosna provera koristi test ključ. Za završnu verziju potrebno je podesiti realan Cloudflare Turnstile site key."
      : "";
  const hasTurnstileToken =
    !requiresTurnstile || Boolean(turnstileToken);
  const canSubmit =
    acceptedTerms && hasTurnstileToken && !turnstileConfigError;

  const handleMockCard = async () => {
    setCardPending(true);
    setError("");
    track("payment_started", {
      provider: "card_mock",
      total_rsd: calculation.total,
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
      total_rsd: calculation.total,
      order_number: orderId,
    });
    if (result.purchaseEvent) {
      pushGoogleDataLayerEvent(result.purchaseEvent);
    }
    setPaymentComplete();
  };

  const handleNestpay = async () => {
    setNestpayPending(true);
    setError("");
    track("payment_started", {
      provider: "nestpay",
      total_rsd: calculation.total,
    });
    try {
      const result = await initiateNestpayPayment({
        orderId,
        turnstileToken,
        taksit: NESTPAY_INSTALLMENTS_ENABLED ? installmentCount : 1,
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
        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={() => setMethod("nestpay")}
            className={`relative flex h-full flex-col gap-4 rounded-xl border p-5 text-left transition ${
              method === "nestpay"
                ? "border-accent bg-accent/5"
                : "border-border/60 bg-background/40 hover:border-accent/40"
            }`}
          >
            {method === "nestpay" && (
              <Check className="absolute right-4 top-4 h-4 w-4 text-accent" />
            )}
            <div className="pr-6">
              <p className="text-base font-semibold text-foreground">
                Platna kartica
              </p>
            </div>
          </button>

        </div>

        {/* Nestpay card */}
        {method === "nestpay" && (
          <div className="mt-6 space-y-4">
            <label className="flex items-start gap-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 cursor-pointer"
                aria-required
              />
              <span>
                Pročitao/la sam i prihvatam{" "}
                <a
                  href="/legal/terms"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline"
                >
                  Pravna dokumenta
                </a>{" "}
                (Opšti uslovi, Politika privatnosti i Politika povraćaja sredstava).
              </span>
            </label>

            {NESTPAY_INSTALLMENTS_ENABLED && (
              <div className="rounded-lg border border-border/60 bg-background/40 p-4">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-foreground">
                    Plaćanje na rate
                  </span>
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    Podelite iznos na rate bez kamate — banka izdavalac kartice
                    obračunava mesečne rate kupcu, a Banca Intesa nam isplaćuje
                    ukupan iznos odjednom.
                  </span>
                  <select
                    value={installmentCount}
                    onChange={(event) =>
                      setInstallmentCount(Number(event.target.value))
                    }
                    className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-accent"
                  >
                    {NESTPAY_INSTALLMENT_OPTIONS.map((count) => (
                      <option key={count} value={count}>
                        {count === 1
                          ? "Jednokratno (puna cena odmah)"
                          : `${count} ${count < 5 ? "rate" : "rata"} bez kamate`}
                      </option>
                    ))}
                  </select>
                  {installmentCount > 1 && (
                    <p className="text-xs text-muted-foreground">
                      Mesečna rata:{" "}
                      <strong className="text-foreground">
                        ~{formatTotal(calculation.total / installmentCount)}
                      </strong>{" "}
                      × {installmentCount}{" "}
                      {installmentCount < 5 ? "rate" : "rata"}.
                    </p>
                  )}
                </label>
              </div>
            )}

            {turnstileConfigError && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive"
              >
                {turnstileConfigError}
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

      </div>

      <Button variant="outline" onClick={() => setStep(2)}>
        Nazad na pregled
      </Button>
    </div>
  );
}
