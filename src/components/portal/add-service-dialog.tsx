/**
 * AddServiceDialog — Inline panel for adding a service to a draft order.
 * Shows a grouped list of services not already in the order. Once a service
 * is in the order it cannot be re-added.
 */
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONFIGURATOR_CATEGORIES } from "@/lib/catalog/configurator";
import { addOrderItem } from "@/server/actions/item-config";
import { formatEur } from "@/lib/catalog/calculate";

export function AddServiceDialog({
  orderId,
  existingProductIds,
}: {
  orderId: string;
  existingProductIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  const router = useRouter();

  const availableByCategory = useMemo(() => {
    return CONFIGURATOR_CATEGORIES.map((cat) => ({
      ...cat,
      products: cat.products.filter(
        (p) => !existingProductIds.includes(p.id),
      ),
    })).filter((cat) => cat.products.length > 0);
  }, [existingProductIds]);

  const handleAdd = (productId: string) => {
    setAdding(productId);
    setError(null);
    start(async () => {
      const result = await addOrderItem(orderId, productId);
      setAdding(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setActiveCat(null);
      router.refresh();
    });
  };

  if (availableByCategory.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-dashed border-accent/30 bg-accent/[0.03]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-center gap-2 px-5 py-4 text-sm font-medium text-accent transition-all hover:bg-accent/5",
          open && "bg-accent/5",
        )}
      >
        <Plus
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            open && "rotate-45",
          )}
        />
        {open ? "Zatvori" : "Dodaj uslugu u ovaj nacrt"}
      </button>

      {open && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200 border-t border-border/30 p-4">
          {error && (
            <div className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* Category chips */}
          <div className="flex flex-wrap gap-1.5">
            {availableByCategory.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  setActiveCat(activeCat === cat.id ? null : cat.id)
                }
                className={cn(
                  "rounded-full border px-3 py-1 text-[0.7rem] font-medium transition-all",
                  activeCat === cat.id
                    ? "border-accent bg-accent text-accent-foreground shadow-[0_4px_12px_-4px_rgba(159,106,75,0.3)]"
                    : "border-border/40 bg-card/60 text-muted-foreground hover:border-accent/40 hover:text-foreground",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Product list */}
          {activeCat && (
            <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              {availableByCategory
                .find((c) => c.id === activeCat)
                ?.products.map((prod) => (
                  <div
                    key={prod.id}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-card/80 px-4 py-3 transition-all hover:border-accent/40 hover:shadow-[0_4px_12px_rgba(28,26,25,0.04)]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {prod.label}
                      </p>
                      <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                        {prod.unitLabel}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">
                        {formatEur(prod.basePriceEur)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAdd(prod.id)}
                        disabled={adding === prod.id}
                        className="inline-flex h-8 items-center gap-1 rounded-lg bg-accent px-3 text-xs font-semibold text-accent-foreground shadow-sm transition-all hover:bg-accent/90 disabled:opacity-60"
                      >
                        {adding === prod.id ? (
                          <>
                            <Check className="h-3 w-3 animate-pulse" />
                            Dodajem…
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3" />
                            Dodaj
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {!activeCat && (
            <p className="mt-3 text-center text-[0.7rem] text-muted-foreground">
              Izaberite kategoriju
            </p>
          )}
        </div>
      )}
    </div>
  );
}
