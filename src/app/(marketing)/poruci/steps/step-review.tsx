"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatEur } from "@/lib/catalog/calculate";
import { track } from "@/lib/posthog-events";
import { useCheckout } from "../checkout-context";
import { createOrder } from "@/server/actions/order";

export function StepReview() {
  const {
    calculation, quoteItems, userId, customerNote,
    uploadedFiles, setOrderId, setStep,
  } = useCheckout();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [waiveWithdrawal, setWaiveWithdrawal] = useState(false);
  const requiresUpload = calculation.items.some((item) => item.kind === "service");

  const handleProceed = async () => {
    if (!userId) {
      setError("Korisnik nije identifikovan. Vratite se na prvi korak.");
      return;
    }
    if (!waiveWithdrawal) {
      setError("Pre nastavka morate potvrditi saglasnost ispod.");
      return;
    }

    setPending(true);
    setError("");

    const result = await createOrder(
      userId,
      quoteItems,
      customerNote,
      new Date(),
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
          disabled={pending || !waiveWithdrawal}
        >
          {pending ? "Kreiranje…" : "Nastavi na plaćanje"}
        </Button>
      </div>
    </div>
  );
}
