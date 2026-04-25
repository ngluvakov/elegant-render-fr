/**
 * QuoteSummary — Sticky dark sidebar showing line items, estimated total,
 * and the "Naruci" (order) CTA that saves the quote to sessionStorage.
 *
 * Used on: PricingConfigurator (sidebar column, /cene page).
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Info, ShoppingCart, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Collapsible } from "@/components/ui/collapsible";
import { formatDiscountedPrice, formatEur } from "@/lib/catalog/calculate";
import { useQuote } from "./quote-context";

export function QuoteSummary() {
  const { items, calculation, clearAll, removeProduct } = useQuote();
  const [explainerOpen, setExplainerOpen] = useState(false);
  const hasItems = calculation.items.length > 0;
  const router = useRouter();

  const handleOrder = () => {
    sessionStorage.setItem("er-checkout-quote", JSON.stringify(items));
    router.push("/poruci");
  };

  const handleOrderInPortal = () => {
    sessionStorage.setItem("er-checkout-quote", JSON.stringify(items));
    router.push("/portal/nova-porudzbina");
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-foreground/10 bg-foreground text-background shadow-[0_30px_80px_rgba(28,26,25,0.22)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-background/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-background/60" />
          <h3 className="text-sm font-semibold text-background">
            Vaša ponuda
          </h3>
          {hasItems && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[0.72rem] font-bold text-white">
              {calculation.items.length}
            </span>
          )}
        </div>
        {hasItems && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-background/50 transition-colors hover:text-background/80"
          >
            <Trash2 className="h-3 w-3" />
            Obriši
          </button>
        )}
      </div>

      {/* Line items */}
      <div className="px-5 py-4">
        {!hasItems && (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-background/10">
              <ShoppingCart className="h-5 w-5 text-background/30" />
            </div>
            <p className="text-sm text-background/50">
              Još nema usluga u ponudi
            </p>
            <p className="mt-1 text-xs text-background/30">
              Izaberite uslugu iz liste iznad
            </p>
          </div>
        )}

        {calculation.items.map((item) => {
          const billableAddOns = item.addOns.filter(
            (a) => a.billableQty > 0,
          ).length;
          const { primary, struck } = formatDiscountedPrice(
            item.totalEur,
            item.originalTotalEur,
            item.discountPct,
          );
          return (
            <div
              key={item.instanceId}
              className="flex items-center justify-between border-b border-background/5 py-2.5 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-background/85">
                  {item.productLabel}
                </p>
                <p className="text-xs text-background/45">
                  {item.categoryLabel}
                  {billableAddOns > 0 && (
                    <span className="text-accent">
                      {" "}
                      + {billableAddOns} extra
                    </span>
                  )}
                </p>
              </div>
              <p className="ml-3 flex-shrink-0 text-right text-sm font-semibold text-background">
                {struck && (
                  <span className="mr-1.5 text-xs font-normal text-background/35 line-through">
                    {struck}
                  </span>
                )}
                {primary}
              </p>
              <button
                type="button"
                onClick={() => removeProduct(item.instanceId)}
                aria-label="Ukloni stavku"
                className="ml-2 flex-shrink-0 rounded p-0.5 text-background/30 transition-colors hover:text-background/70"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Total + CTA */}
      {hasItems && (
        <div className="border-t border-background/10 bg-background/5 px-5 py-4">
          {calculation.originalTotal > calculation.total && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setExplainerOpen((v) => !v)}
                  className="inline-flex items-center gap-1 text-background/50 transition-colors hover:text-background/80"
                  aria-expanded={explainerOpen}
                >
                  Ušteda
                  <Info
                    className={cn(
                      "h-3 w-3 transition-colors",
                      explainerOpen && "text-[color:var(--color-sage)]",
                    )}
                  />
                </button>
                <p className="font-semibold text-[color:var(--color-sage)]">
                  −{formatEur(calculation.originalTotal - calculation.total)}
                </p>
              </div>
              <Collapsible open={explainerOpen}>
                <div className="mt-2 rounded-lg bg-background/5 p-3 text-[0.72rem] leading-relaxed text-background/60">
                  <p>
                    Kada naručite više usluga zajedno, 3D model koji se
                    pravi za jednu uslugu se može ponovo iskoristiti za
                    druge — pa te dodatne usluge dobijaju automatski
                    popust.
                  </p>
                  <ul className="mt-2 space-y-1">
                    <li>
                      • Eksterijer + 360° eksterijer → 360° je{" "}
                      <strong className="text-[color:var(--color-sage)]">
                        −40%
                      </strong>{" "}
                      (model postoji)
                    </li>
                    <li>
                      • Enterijer + 3D osnova sprata → osnova je{" "}
                      <strong className="text-[color:var(--color-sage)]">
                        −70%
                      </strong>{" "}
                      (geometrija postoji)
                    </li>
                    <li>
                      • Animacija + eksterijer → oba dobijaju popust jer
                      svaki deli model sa drugim
                    </li>
                  </ul>
                  <p className="mt-2 text-background/40">
                    Popusti se ne slažu — uvek važi najpovoljniji.
                  </p>
                </div>
              </Collapsible>
            </div>
          )}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-background/60">Procenjena cena</p>
            <p className="text-2xl font-bold text-background">
              {formatEur(calculation.total)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOrder}
            className={cn(
              buttonVariants({ variant: "accent", size: "xl" }),
              "w-full justify-center rounded-xl",
            )}
          >
            Naruči
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </button>
          <p className="mt-3 text-center text-[0.7rem] text-background/40">
            Bez registracije — naručite u par koraka.{" "}
            <button
              type="button"
              onClick={handleOrderInPortal}
              className="underline-offset-2 hover:text-background/70 hover:underline"
            >
              Imam nalog
            </button>
          </p>
          <p className="mt-2 text-center text-[0.68rem] text-background/30">
            Cene su procene. Konačna ponuda može varirati u zavisnosti od
            specifičnosti projekta. Sve cene su u EUR bez PDV-a.
          </p>
        </div>
      )}
    </div>
  );
}
