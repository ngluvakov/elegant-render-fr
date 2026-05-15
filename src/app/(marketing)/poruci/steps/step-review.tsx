"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/posthog-events";
import { validateBuyerInfo } from "@/lib/buyer-validation";
import {
  billingCurrencyForCountry,
  buyerTypeForBilling,
} from "@/lib/billing";
import {
  formatPublicPrice,
  type PublicPricingFormatSettings,
} from "@/lib/catalog/display-currency";
import { COUNTRIES } from "@/lib/iso-countries";
import { useCheckout, type BuyerInfoState } from "../checkout-context";
import { createOrder } from "@/server/actions/order";
import { CompanyVatVerifier } from "../company-vat-verifier";

export function StepReview() {
  const {
    calculation, quoteItems, userId, customerNote,
    uploadedFiles, setOrderId, setStep,
    buyerInfo, setBuyerInfo,
    displayCurrency, pricingCatalog,
  } = useCheckout();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [waiveWithdrawal, setWaiveWithdrawal] = useState(false);
  const requiresUpload = calculation.items.some((item) => item.kind === "service");
  const buyerKind =
    buyerInfo.buyerType === "individual" ? "individual" : "company";
  const buyerCountryCode =
    buyerInfo.buyerCountryCode ||
    (buyerInfo.buyerType === "company_rs"
      ? "RS"
      : buyerInfo.companyCountryCode);
  const buyerCurrency = billingCurrencyForCountry(buyerCountryCode);
  const isSerbianBuyer = buyerCountryCode === "RS";

  const pricingSettings: PublicPricingFormatSettings | undefined = pricingCatalog
    ? {
        eurToRsdRate: pricingCatalog.settings.eurToRsdRate,
        serbiaVatRate: pricingCatalog.settings.serbiaVatRate,
      }
    : undefined;

  const fmt = (eur: number) =>
    formatPublicPrice(eur, displayCurrency, pricingSettings);

  const buyerError = useMemo(
    () => validateBuyerInfo(buyerInfo),
    [buyerInfo],
  );

  const updateBuyer = (patch: Partial<BuyerInfoState>) => {
    setBuyerInfo({ ...buyerInfo, ...patch });
  };

  const updateBuyerKind = (kind: "individual" | "company") => {
    const nextType = buyerTypeForBilling(kind, buyerCountryCode || "RS");
    setBuyerInfo({
      ...buyerInfo,
      buyerType: nextType,
      buyerCountryCode: buyerCountryCode || "RS",
      companyCountryCode:
        nextType === "company_foreign" ? buyerCountryCode : "",
      ...(kind === "individual"
        ? {
            companyName: "",
            companyTaxId: "",
            companyMb: "",
            companyAddress: "",
            companyCountryCode: "",
          }
        : {}),
    });
  };

  const updateBuyerCountry = (countryCode: string) => {
    const nextType = buyerTypeForBilling(buyerKind, countryCode);
    setBuyerInfo({
      ...buyerInfo,
      buyerType: nextType,
      buyerCountryCode: countryCode,
      companyCountryCode:
        nextType === "company_foreign" ? countryCode : "",
      ...(nextType === "company_rs" ? { companyMb: buyerInfo.companyMb } : {}),
    });
  };

  const handleProceed = async () => {
    if (!userId) {
      setError("Korisnik nije identifikovan. Vratite se na prvi korak.");
      return;
    }
    if (!waiveWithdrawal) {
      setError("Pre nastavka morate potvrditi saglasnost ispod.");
      return;
    }
    if (buyerError) {
      setError(buyerError);
      return;
    }

    setPending(true);
    setError("");

    const result = await createOrder(
      userId,
      quoteItems,
      customerNote,
      new Date(),
      buyerInfo,
    );

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    if (result.orderId && result.orderNumber) {
      track("order_created", {
        order_number: result.orderNumber,
        total_eur: calculation.total,
        item_count: calculation.items.length,
      });
      setOrderId(result.orderId);
      setStep(3);
    }

    setPending(false);
  };

  const submitDisabled =
    pending || !waiveWithdrawal || Boolean(buyerError);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foreground">
          Pregled porudžbine
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Proverite stavke pre nego što nastavite na plaćanje.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Line items */}
        <div className="mt-6 space-y-3">
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

        {/* Files summary */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Priloženi fajlovi ({uploadedFiles.length})
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {uploadedFiles.map((f) => (
                <span
                  key={f.storagePath}
                  className="rounded-md bg-secondary/60 px-2.5 py-1 text-xs text-foreground"
                >
                  {f.fileName}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Customer note */}
        {customerNote && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Napomena
            </p>
            <p className="mt-1 text-sm text-foreground/80">{customerNote}</p>
          </div>
        )}

        {/* Totals — currency-aware. For RS visitors we break out
            osnovica + PDV + ukupno because that's how customers
            (especially B2B) expect to see it. For foreign visitors
            it's a single EUR line — the "no VAT" notice goes on the
            issued PDF anyway. */}
        <div className="mt-8 border-t border-border/40 pt-4">
          {displayCurrency === "rsd" ? (
            <RsdTotalsBreakdown
              totalEur={calculation.total}
              settings={pricingSettings}
            />
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-foreground">Ukupno</p>
              <p className="text-2xl font-bold text-foreground">
                {fmt(calculation.total)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Billing snapshot for this order. Profile defaults land here,
          but the customer can still adjust the legal invoice data
          before payment; the order stores this exact snapshot. */}
      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 md:p-8">
        <h2 className="text-base font-semibold text-foreground">
          Podaci za račun
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Određuje valutu i podatke koji će biti zaključani na računu za ovu
          porudžbinu.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <BuyerKindButton
            active={buyerKind === "individual"}
            title="Fizičko lice"
            description="Račun glasi na ime naloga."
            onClick={() => updateBuyerKind("individual")}
          />
          <BuyerKindButton
            active={buyerKind === "company"}
            title="Firma"
            description="Račun glasi na pravno lice."
            onClick={() => updateBuyerKind("company")}
          />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <CountrySelect
            value={buyerCountryCode}
            onChange={updateBuyerCountry}
          />
          <div className="flex items-center rounded-xl border border-border/40 bg-background/60 px-3 py-2 text-sm text-foreground">
            {buyerCurrency === "RSD"
              ? "Račun za Srbiju: RSD sa PDV-om"
              : "Račun za inostranstvo: EUR bez PDV-a"}
          </div>
        </div>

        {buyerKind === "company" && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field
              label="Naziv firme"
              required
              value={buyerInfo.companyName}
              onChange={(v) => updateBuyer({ companyName: v })}
            />
            <Field
              label="Adresa"
              required
              value={buyerInfo.companyAddress}
              onChange={(v) => updateBuyer({ companyAddress: v })}
            />
            {isSerbianBuyer && (
              <>
                <Field
                  label="PIB"
                  required
                  value={buyerInfo.companyTaxId}
                  hint="9 cifara"
                  inputMode="numeric"
                  maxLength={9}
                  onChange={(v) =>
                    updateBuyer({ companyTaxId: v.replace(/\D/g, "") })
                  }
                />
                <Field
                  label="Matični broj (opciono)"
                  value={buyerInfo.companyMb}
                  hint="8 cifara"
                  inputMode="numeric"
                  maxLength={8}
                  onChange={(v) =>
                    updateBuyer({ companyMb: v.replace(/\D/g, "") })
                  }
                />
              </>
            )}
            {!isSerbianBuyer && (
              <div>
                <Field
                  label="VAT ID / Tax ID (opciono)"
                  value={buyerInfo.companyTaxId}
                  hint="npr. DE123456789"
                  onChange={(v) =>
                    updateBuyer({
                      companyTaxId: v.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                    })
                  }
                />
                <CompanyVatVerifier
                  countryCode={buyerCountryCode}
                  vatNumber={buyerInfo.companyTaxId}
                />
              </div>
            )}
          </div>
        )}

        {buyerError && (
          <p className="mt-4 text-sm text-destructive">{buyerError}</p>
        )}
      </div>

      {/* Distance-selling withdrawal waiver. EU CRD čl. 16(m) + Zakon o
          zaštiti potrošača čl. 28 require an express, opt-in consent
          here — pre-checked or implicit doesn't satisfy the law. We
          keep the click but compress the visual weight: tight inline
          row, small text, link-out for legal detail. */}
      <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border/40 bg-card/40 px-4 py-2.5">
        <input
          type="checkbox"
          checked={waiveWithdrawal}
          onChange={(e) => setWaiveWithdrawal(e.target.checked)}
          className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer accent-accent"
        />
        <span className="text-xs leading-relaxed text-muted-foreground">
          Pristajem da izrada počne odmah i da time odustajem od 14-dnevnog
          povlačenja.{" "}
          <Link
            href="/pravno/uslovi"
            target="_blank"
            className="text-foreground/80 underline-offset-4 hover:underline"
          >
            Detalji
          </Link>
        </span>
      </label>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(requiresUpload ? 1 : 0)}>
          Nazad
        </Button>
        <Button
          variant="accent"
          size="lg"
          onClick={handleProceed}
          disabled={submitDisabled}
        >
          {pending ? "Kreiranje…" : "Nastavi na plaćanje"}
        </Button>
      </div>
    </div>
  );
}

function RsdTotalsBreakdown({
  totalEur,
  settings,
}: {
  totalEur: number;
  settings: PublicPricingFormatSettings | undefined;
}) {
  // formatPublicPrice for RSD already adds VAT. Reverse-engineer net
  // and VAT slices for the breakdown — the exact same math the
  // invoice generator uses, so what the customer sees here matches
  // what lands in their PDF.
  const grossLine = formatPublicPrice(totalEur, "rsd", settings);
  const netLine = formatPublicPrice(
    totalEur,
    "rsd",
    settings
      ? {
          eurToRsdRate: settings.eurToRsdRate,
          serbiaVatRate: 0,
        }
      : undefined,
  );
  const vatRate = settings?.serbiaVatRate ?? 0.2;
  const vatLine = formatPublicPrice(
    totalEur,
    "rsd",
    settings
      ? {
          eurToRsdRate: settings.eurToRsdRate * vatRate,
          serbiaVatRate: 0,
        }
      : undefined,
  );

  return (
    <div className="space-y-1.5 text-sm">
      <div className="flex justify-between text-muted-foreground">
        <span>Osnovica</span>
        <span className="tabular-nums">{netLine}</span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <span>PDV ({Math.round(vatRate * 100)}%)</span>
        <span className="tabular-nums">{vatLine}</span>
      </div>
      <div className="flex items-baseline justify-between border-t border-border/30 pt-2">
        <span className="text-base font-semibold text-foreground">Ukupno</span>
        <span className="text-xl font-bold text-foreground tabular-nums">
          {grossLine}
        </span>
      </div>
    </div>
  );
}

function BuyerKindButton({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex cursor-pointer flex-col gap-1 rounded-xl border p-4 text-left transition " +
        (active
          ? "border-accent bg-accent/5"
          : "border-border bg-background/60 hover:bg-background")
      }
    >
      <span className="text-sm font-semibold text-foreground">{title}</span>
      <span className="text-xs leading-relaxed text-muted-foreground">
        {description}
      </span>
    </button>
  );
}

function CountrySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-foreground">
        Država <span className="ml-1 text-destructive">*</span>
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent"
      >
        <option value="">— Odaberite —</option>
        <option value="RS">Srbija (RS)</option>
        <option disabled>──────────</option>
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
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  required?: boolean;
  hint?: string;
  inputMode?: "text" | "numeric";
  maxLength?: number;
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
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent"
      />
      {hint && <span className="text-[0.72rem] text-muted-foreground">{hint}</span>}
    </label>
  );
}
