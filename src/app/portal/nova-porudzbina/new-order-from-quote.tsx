/**
 * NewOrderFromQuote — Client component that reads the quote from sessionStorage,
 * creates a draft order via server action, and redirects to the order detail page.
 *
 * Used on: /portal/nova-porudzbina
 */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  calculateQuote,
  formatEur,
  type QuoteItem,
} from "@/lib/catalog/calculate";
import type { ResolvedPricingCatalog } from "@/lib/pricing/catalog";
import { createOrder } from "@/server/actions/order";
import { track } from "@/lib/posthog-events";
import {
  CHECKOUT_QUOTE_STORAGE_KEY,
  clearCheckoutSession,
  readCheckoutWithdrawalWaiver,
} from "@/lib/checkout-session";

export function NewOrderFromQuote({
  userId,
  pricingCatalog,
}: {
  userId: string;
  pricingCatalog: ResolvedPricingCatalog;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [items, setItems] = useState<QuoteItem[] | null>(null);
  const [waiveWithdrawal, setWaiveWithdrawal] = useState(false);
  const [pending, setPending] = useState(false);
  const creatingRef = useRef(false);

  const submitOrder = useCallback(
    async (nextItems: QuoteItem[], withdrawalWaivedAt: Date) => {
      if (creatingRef.current) return;
      creatingRef.current = true;
      setPending(true);
      setError("");

      const result = await createOrder(
        userId,
        nextItems,
        undefined,
        withdrawalWaivedAt,
      );

      if (result.error) {
        setError(result.error);
        setPending(false);
        creatingRef.current = false;
        return;
      }

      const calc = calculateQuote(nextItems, [], pricingCatalog);
      if (result.orderNumber) {
        track("order_created", {
          order_number: result.orderNumber,
          total_eur: calc.total,
          item_count: nextItems.length,
        });
      }
      clearCheckoutSession();
      router.replace(`/portal/porudzbine/${result.orderId}`);
    },
    [pricingCatalog, router, userId],
  );

  useEffect(() => {
    const raw = sessionStorage.getItem(CHECKOUT_QUOTE_STORAGE_KEY);

    if (!raw) {
      router.replace("/cene");
      return;
    }

    let items: QuoteItem[];
    try {
      items = JSON.parse(raw);
      if (!items.length) {
        router.replace("/cene");
        return;
      }
    } catch {
      router.replace("/cene");
      return;
    }

    const storedWaiver = readCheckoutWithdrawalWaiver();
    queueMicrotask(() => {
      setItems(items);
      if (storedWaiver) {
        void submitOrder(items, storedWaiver);
      }
    });
  }, [router, submitOrder]);

  const handleProceed = () => {
    if (!items) return;
    if (!waiveWithdrawal) {
      setError("Pre nastavka morate potvrditi saglasnost ispod.");
      return;
    }
    void submitOrder(items, new Date());
  };

  if (pending || !items) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
          <p className="mt-4 text-sm text-muted-foreground">
            Kreiranje porudžbine…
          </p>
        </div>
      </div>
    );
  }

  const calculation = calculateQuote(items, [], pricingCatalog);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-2xl items-center justify-center">
      <div className="w-full rounded-2xl border border-border/60 bg-card/80 p-6 md:p-8">
        <h1 className="text-2xl font-semibold text-foreground">
          Potvrdite porudžbinu
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Pre kreiranja plaćanja potrebna je saglasnost da usluga počne odmah.
          Nakon toga otvaramo stranicu porudžbine sa opcijama plaćanja.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-3">
          {calculation.items.map((item) => (
            <div
              key={item.instanceId}
              className="flex items-start justify-between gap-4 rounded-xl border border-border/40 bg-background/60 p-4"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {item.productLabel}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.categoryLabel}
                </p>
              </div>
              <p className="flex-shrink-0 text-sm font-semibold text-foreground">
                {formatEur(item.totalEur)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-4">
          <span className="text-sm text-muted-foreground">Ukupno</span>
          <span className="text-2xl font-bold text-foreground">
            {formatEur(calculation.total)}
          </span>
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/50 bg-background/50 px-4 py-3">
          <input
            type="checkbox"
            checked={waiveWithdrawal}
            onChange={(event) => {
              setWaiveWithdrawal(event.target.checked);
              if (event.target.checked) setError("");
            }}
            className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 cursor-pointer accent-accent"
          />
          <span className="text-xs leading-relaxed text-muted-foreground">
            Pristajem da izrada ili aktivacija usluge počne odmah i da time
            odustajem od 14-dnevnog povlačenja.{" "}
            <Link
              href="/pravno/uslovi"
              target="_blank"
              className="text-foreground/80 underline-offset-4 hover:underline"
            >
              Detalji
            </Link>
          </span>
        </label>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/cene")}
          >
            Nazad na cenovnik
          </Button>
          <Button
            type="button"
            variant="accent"
            size="lg"
            onClick={handleProceed}
            disabled={!waiveWithdrawal}
          >
            Nastavi na plaćanje
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
