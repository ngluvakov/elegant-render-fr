"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatEur } from "@/lib/catalog/calculate";
import { track } from "@/lib/posthog-events";
import {
  validateBuyerInfo,
  type BuyerType,
} from "@/lib/buyer-validation";
import { useCheckout, type BuyerInfoState } from "../checkout-context";
import { createOrder } from "@/server/actions/order";

const BUYER_TYPE_OPTIONS: Array<{
  value: BuyerType;
  label: string;
  description: string;
}> = [
  {
    value: "individual",
    label: "Fizičko lice",
    description: "Račun na vaše ime i prezime, sa PDV-om.",
  },
  {
    value: "company_rs",
    label: "Firma — Srbija",
    description: "PIB, MB i naziv firme za PDV fakturu kroz SEF.",
  },
  {
    value: "company_foreign",
    label: "Firma — inostranstvo",
    description: "PDF faktura bez PDV-a (oslobođenje po čl. 24/25 ZPDV).",
  },
];

export function StepReview() {
  const {
    calculation, quoteItems, userId, customerNote,
    uploadedFiles, setOrderId, setStep,
    buyerInfo, setBuyerInfo,
  } = useCheckout();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [waiveWithdrawal, setWaiveWithdrawal] = useState(false);
  const requiresUpload = calculation.items.some((item) => item.kind === "service");

  const buyerError = useMemo(
    () => validateBuyerInfo(buyerInfo),
    [buyerInfo],
  );

  const updateBuyer = (patch: Partial<BuyerInfoState>) => {
    setBuyerInfo({ ...buyerInfo, ...patch });
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
                        + {ao.billableQty}× {ao.label} ({formatEur(ao.totalEur)})
                      </p>
                    ))}
                </div>
                <p className="flex-shrink-0 text-base font-semibold text-foreground">
                  {formatEur(item.totalEur)}
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

        {/* Total */}
        <div className="mt-8 flex items-center justify-between border-t border-border/40 pt-4">
          <p className="text-lg font-semibold text-foreground">Ukupno</p>
          <p className="text-2xl font-bold text-foreground">
            {formatEur(calculation.total)}
          </p>
        </div>
      </div>

      {/* Tip kupca — buyer identity for invoicing. Default is individual.
          Validation feedback is rendered inline so the customer fixes
          one issue at a time; the same check runs on the server. */}
      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 md:p-8">
        <h2 className="text-base font-semibold text-foreground">Tip kupca</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Određuje kako će glasiti račun za ovu porudžbinu.
        </p>

        <div className="mt-5 grid gap-2 md:grid-cols-3">
          {BUYER_TYPE_OPTIONS.map((opt) => {
            const active = buyerInfo.buyerType === opt.value;
            return (
              <label
                key={opt.value}
                className={
                  "flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition " +
                  (active
                    ? "border-accent bg-accent/5"
                    : "border-border bg-background/60 hover:bg-background")
                }
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="buyer-type"
                    value={opt.value}
                    checked={active}
                    onChange={() =>
                      updateBuyer({
                        buyerType: opt.value,
                        // Clear company fields when switching to individual,
                        // and preserve them when switching between the two
                        // company variants so the customer doesn't lose work.
                        ...(opt.value === "individual"
                          ? {
                              companyName: "",
                              companyTaxId: "",
                              companyMb: "",
                              companyAddress: "",
                              companyCountryCode: "",
                            }
                          : {}),
                      })
                    }
                    className="h-4 w-4 flex-shrink-0 accent-accent"
                  />
                  <span className="text-sm font-semibold text-foreground">
                    {opt.label}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {opt.description}
                </p>
              </label>
            );
          })}
        </div>

        {buyerInfo.buyerType !== "individual" && (
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
            {buyerInfo.buyerType === "company_rs" && (
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
            {buyerInfo.buyerType === "company_foreign" && (
              <>
                <Field
                  label="Država (ISO kod)"
                  required
                  value={buyerInfo.companyCountryCode}
                  hint="2 velika slova (npr. DE, FR, IT)"
                  maxLength={2}
                  onChange={(v) =>
                    updateBuyer({
                      companyCountryCode: v.toUpperCase().replace(/[^A-Z]/g, ""),
                    })
                  }
                />
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
              </>
            )}
          </div>
        )}

        {buyerError && buyerInfo.buyerType !== "individual" && (
          <p className="mt-4 text-sm text-destructive">{buyerError}</p>
        )}
      </div>

      {/* Distance-selling withdrawal waiver. Per Zakon o zaštiti potrošača
          čl. 28 / EU CRD čl. 16(m), digital services that begin before
          the 14-day window elapses require the customer's explicit
          waiver of the withdrawal right. Without checking, the proceed
          button is disabled. The checkout server action also enforces
          this server-side. */}
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/60 bg-card/80 p-5 md:p-6">
        <input
          type="checkbox"
          checked={waiveWithdrawal}
          onChange={(e) => setWaiveWithdrawal(e.target.checked)}
          className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer accent-accent"
          aria-describedby="waive-withdrawal-help"
        />
        <span className="text-sm leading-relaxed text-foreground/80">
          <strong className="text-foreground">
            Saglasan/saglasna sam da izrada počinje odmah po plaćanju
          </strong>{" "}
          i razumem da time gubim pravo na povlačenje od 14 dana po članu
          16(m) Direktive (EU) 2011/83 i članu 28. Zakona o zaštiti
          potrošača Republike Srbije.{" "}
          <Link
            href="/pravno/uslovi"
            target="_blank"
            className="text-foreground underline-offset-4 hover:underline"
            id="waive-withdrawal-help"
          >
            Više u Uslovima korišćenja
          </Link>
          .
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
