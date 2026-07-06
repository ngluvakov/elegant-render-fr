"use client";

/**
 * step-details.tsx — step 1 of the 2-step checkout: identity + order
 * summary + optional business invoice block + consents.
 *
 * Merge of the pre-restructure step-details (name/email →
 * ensureCheckoutUser) and step-review (summary, buyer block, EU
 * withdrawal waiver). Prices render in the visitor's display currency —
 * the same conversion the server locks into the charge snapshot.
 */

import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { track } from "@/lib/posthog-events";
import { validateBuyerInfo } from "@/lib/buyer-validation";
import {
  formatPublicPrice,
  type PublicPricingFormatSettings,
} from "@/lib/catalog/display-currency";
import { COUNTRIES } from "@/lib/iso-countries";
import { useCheckout, type BuyerInfoState } from "../checkout-context";
import { ensureCheckoutUser } from "@/server/actions/checkout";
import { createOrder } from "@/server/actions/order";
import { CompanyVatVerifier } from "../company-vat-verifier";

export function StepDetails() {
  const {
    calculation, quoteItems, userId, initiallySignedIn,
    customerName, customerEmail, customerNote, setCustomerNote,
    setCustomer, setUserId, setOrderId, setStep, orderId,
    buyerInfo, setBuyerInfo,
    displayCurrency, pricingCatalog,
  } = useCheckout();

  const [name, setName] = useState(customerName);
  const [email, setEmail] = useState(customerEmail);
  const [businessOpen, setBusinessOpen] = useState(
    buyerInfo.buyerType === "business",
  );
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [waiveWithdrawal, setWaiveWithdrawal] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const geoCountryCode = buyerInfo.buyerCountryCode;
  const [businessCountry, setBusinessCountry] = useState(
    buyerInfo.companyCountryCode || geoCountryCode,
  );
  // Individuals normally never see a country field — it defaults to the
  // server-derived geo country and PayPal backfills the payer country at
  // capture. When geo is unavailable (no CDN header), fall back to a
  // visible select so checkout stays usable.
  const [individualCountry, setIndividualCountry] = useState(geoCountryCode);
  const needsIndividualCountry = !geoCountryCode;

  const pricingSettings: PublicPricingFormatSettings | undefined =
    pricingCatalog
      ? { serbiaVatRate: pricingCatalog.settings.serbiaVatRate }
      : undefined;
  const fmt = (amountEur: number) =>
    formatPublicPrice(amountEur, displayCurrency, pricingSettings);

  const effectiveBuyerInfo = useMemo<BuyerInfoState>(() => {
    if (businessOpen) {
      return {
        ...buyerInfo,
        buyerType: "business",
        buyerCountryCode: businessCountry,
        companyCountryCode: businessCountry,
      };
    }
    return {
      buyerType: "individual",
      buyerCountryCode: individualCountry || geoCountryCode,
      companyName: "",
      companyTaxId: "",
      companyAddress: "",
      companyCountryCode: "",
    };
  }, [businessOpen, buyerInfo, businessCountry, individualCountry, geoCountryCode]);

  const buyerError = useMemo(
    () => validateBuyerInfo(effectiveBuyerInfo),
    [effectiveBuyerInfo],
  );

  const updateBuyer = (patch: Partial<BuyerInfoState>) => {
    setBuyerInfo({ ...buyerInfo, ...patch });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!acceptedTerms || !waiveWithdrawal) {
      setError("Please confirm both checkboxes below to continue.");
      return;
    }
    if (buyerError) {
      setError(buyerError);
      return;
    }

    setPending(true);
    try {
      // Identity: guests get (or reuse) a passwordless account; signed-in
      // users keep their own.
      let uid = userId;
      if (!uid) {
        if (!name.trim() || !email.trim()) {
          setError("Please enter your name and email.");
          return;
        }
        const userResult = await ensureCheckoutUser(name.trim(), email.trim());
        if (userResult.error || !userResult.userId) {
          setError(userResult.error ?? "Could not create your account.");
          return;
        }
        uid = userResult.userId;
        setUserId(uid);
        setCustomer(name.trim(), email.trim());
      }

      // Going back from the payment step and resubmitting reuses the
      // already-created draft instead of minting a duplicate.
      if (orderId) {
        setStep(1);
        return;
      }

      setBuyerInfo(effectiveBuyerInfo);
      const result = await createOrder(
        uid,
        quoteItems,
        customerNote,
        new Date(),
        effectiveBuyerInfo,
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.orderId && result.orderNumber) {
        track("order_created", {
          order_number: result.orderNumber,
          total_eur: calculation.total,
          item_count: calculation.items.length,
        });
        setOrderId(result.orderId);
        setStep(1);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setPending(false);
    }
  };

  const submitDisabled =
    pending || !acceptedTerms || !waiveWithdrawal || Boolean(buyerError);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Identity */}
      <div className="rounded-lg border border-border/60 bg-card/80 p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foreground">Your details</h2>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {initiallySignedIn ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Ordering as{" "}
            <strong className="text-foreground">
              {customerName || customerEmail}
            </strong>
            {customerName ? ` (${customerEmail})` : ""}.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your name and email so we can reach you about the
              project. An account is created automatically.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="checkout-name">
                  <Pencil className="h-3 w-3 text-accent/60" />
                  Full name
                </Label>
                <Input
                  id="checkout-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkout-email">
                  <Pencil className="h-3 w-3 text-accent/60" />
                  Email
                </Label>
                <Input
                  id="checkout-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>
          </>
        )}

        {needsIndividualCountry && !businessOpen && (
          <div className="mt-4 max-w-xs">
            <CountrySelect
              label="Country"
              value={individualCountry}
              onChange={setIndividualCountry}
            />
          </div>
        )}
      </div>

      {/* Order summary */}
      <div className="rounded-lg border border-border/60 bg-card/80 p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foreground">Order summary</h2>

        <div className="mt-5 space-y-3">
          {calculation.items.map((item) => (
            <div
              key={item.instanceId}
              className="rounded-xl border border-border/40 bg-background/60 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {item.productLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.categoryLabel}
                  </p>
                  {item.addOns
                    .filter((ao) => ao.billableQty > 0)
                    .map((ao) => (
                      <p key={ao.addOnId} className="mt-1 text-xs text-accent">
                        + {ao.billableQty}× {ao.label} ({fmt(ao.totalEur)})
                      </p>
                    ))}
                </div>
                <p className="flex-shrink-0 text-base font-semibold text-foreground">
                  {fmt(item.totalEur)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-border/40 pt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-base font-semibold text-foreground">Total</span>
            <span className="text-xl font-bold text-foreground tabular-nums">
              {fmt(calculation.total)}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {displayCurrency === "EUR"
              ? "Charged in EUR; your invoice is issued in EUR."
              : `Total in ${displayCurrency} — you are charged in ${displayCurrency}; your invoice is issued in EUR.`}
          </p>
        </div>

        {/* Optional note */}
        <div className="mt-6">
          <Label htmlFor="checkout-note">
            <Pencil className="h-3 w-3 text-accent/60" />
            Note (optional)
          </Label>
          <Textarea
            id="checkout-note"
            value={customerNote}
            onChange={(e) => setCustomerNote(e.target.value)}
            rows={3}
            placeholder="Deadline, style, special requests…"
            className="mt-2"
          />
        </div>
      </div>

      {/* Business invoice toggle */}
      <div className="rounded-lg border border-border/60 bg-card/80 p-6 md:p-8">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={businessOpen}
            onChange={(e) => setBusinessOpen(e.target.checked)}
            className="mt-0.5 h-4 w-4 cursor-pointer accent-accent"
          />
          <span>
            <span className="block text-sm font-semibold text-foreground">
              I&apos;m buying as a business (get a VAT invoice)
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              The invoice is issued to your company. VAT ID is optional.
            </span>
          </span>
        </label>

        {businessOpen && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field
              label="Company name"
              required
              value={buyerInfo.companyName}
              onChange={(v) => updateBuyer({ companyName: v })}
            />
            <Field
              label="Company address"
              required
              value={buyerInfo.companyAddress}
              onChange={(v) => updateBuyer({ companyAddress: v })}
            />
            <CountrySelect
              label="Country"
              required
              value={businessCountry}
              onChange={setBusinessCountry}
            />
            <div>
              <Field
                label="VAT ID / Tax ID (optional)"
                value={buyerInfo.companyTaxId}
                hint="e.g. DE123456789"
                onChange={(v) =>
                  updateBuyer({
                    companyTaxId: v.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                  })
                }
              />
              <CompanyVatVerifier
                countryCode={businessCountry}
                vatNumber={buyerInfo.companyTaxId}
              />
            </div>
          </div>
        )}

        {buyerError && (
          <p className="mt-4 text-sm text-destructive">{buyerError}</p>
        )}
      </div>

      {/* Consents — two legally distinct, separately required checkboxes. */}
      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border/40 bg-card/40 px-4 py-2.5">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="h-5 w-5 flex-shrink-0 cursor-pointer accent-accent"
            aria-required
          />
          <span className="text-xs leading-relaxed text-muted-foreground">
            I agree to the{" "}
            <a
              href="/legal/terms"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline"
            >
              Terms of Service
            </a>
            .
          </span>
        </label>

        {/* EU CRD art. 16(m) withdrawal waiver — express, opt-in consent;
            pre-checked or implicit doesn't satisfy the law. */}
        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border/40 bg-card/40 px-4 py-2.5">
          <input
            type="checkbox"
            checked={waiveWithdrawal}
            onChange={(e) => setWaiveWithdrawal(e.target.checked)}
            className="h-5 w-5 flex-shrink-0 cursor-pointer accent-accent"
            aria-required
          />
          <span className="text-xs leading-relaxed text-muted-foreground">
            I ask you to start work immediately and acknowledge that I lose
            my 14-day right of withdrawal once delivery begins.
          </span>
        </label>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="accent"
          size="lg"
          disabled={submitDisabled}
        >
          {pending ? "Creating order…" : "Continue to payment"}
        </Button>
      </div>
    </form>
  );
}

function CountrySelect({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (code: string) => void;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent"
      >
        <option value="">— Select —</option>
        {COUNTRIES.map((c) =>
          c.code === "" ? (
            <option key="separator" disabled>
              {c.label}
            </option>
          ) : (
            <option key={c.code} value={c.code}>
              {c.label} ({c.code})
            </option>
          ),
        )}
      </select>
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  hint,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent"
      />
      {hint && <span className="text-[0.72rem] text-muted-foreground">{hint}</span>}
    </label>
  );
}
