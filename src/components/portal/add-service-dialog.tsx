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
import {
  CONFIGURATOR_CATEGORIES,
  type ConfiguratorCategory,
} from "@/lib/catalog/configurator";
import { addOrderItem } from "@/server/actions/item-config";
import { useOrderCurrency } from "@/components/portal/order-currency-context";
import { Collapsible } from "@/components/ui/collapsible";

export function AddServiceDialog({
  orderId,
  existingProductIds,
  categories = CONFIGURATOR_CATEGORIES,
}: {
  orderId: string;
  existingProductIds: string[];
  categories?: ConfiguratorCategory[];
}) {
  const [open, setOpen] = useState(false);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  const router = useRouter();
  const { formatPrice, formatPriceText } = useOrderCurrency();

  const availableByCategory = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      products: cat.products.filter(
        (p) => !existingProductIds.includes(p.id),
      ),
    })).filter((cat) => cat.products.length > 0);
  }, [existingProductIds, categories]);

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
      if (result.newItemId) {
        // Picked up by ItemConfigPanel on mount so the newly added
        // service opens its dropdown automatically.
        try {
          sessionStorage.setItem("er-just-added-item-id", result.newItemId);
        } catch {}
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
    <div className="flex flex-col items-center gap-4 pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "group inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4 text-base font-semibold transition-all duration-200",
          open
            ? "bg-card/80 text-foreground ring-1 ring-border/40 hover:bg-muted"
            : "bg-accent text-accent-foreground hover:bg-[var(--color-green-hover)] hover:shadow-[0_1px_3px_rgba(17,17,17,0.06)]",
        )}
      >
        <Plus
          className={cn(
            "h-5 w-5 transition-transform duration-300",
            open ? "rotate-45" : "group-hover:rotate-90",
          )}
        />
        {open ? "Fermer" : "Ajouter un service à ce brouillon"}
      </button>

      <Collapsible open={open} className="w-full">
        <div className="rounded-lg border border-border/40 bg-card/80 p-4">
          {error && (
            <div className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* Category chips */}
          <div className="flex flex-wrap gap-2">
            {availableByCategory.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  setActiveCat(activeCat === cat.id ? null : cat.id)
                }
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                  activeCat === cat.id
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border/40 bg-card/60 text-foreground/80 hover:border-accent/40 hover:bg-accent/[0.04] hover:text-foreground",
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
                    className="group flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-card/80 px-4 py-3 transition-all hover:border-accent/40 hover:shadow-[0_1px_3px_rgba(17,17,17,0.06)]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {prod.label}
                      </p>
                      <p className="mt-0.5 text-[0.72rem] text-muted-foreground">
                        {formatPriceText(prod.unitLabel)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">
                        {formatPrice(prod.basePriceEur)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAdd(prod.id)}
                        disabled={adding === prod.id}
                        className="inline-flex h-8 items-center gap-1 rounded-lg bg-accent px-3 text-xs font-semibold text-accent-foreground shadow-sm transition-all hover:bg-[var(--color-green-hover)] disabled:opacity-60"
                      >
                        {adding === prod.id ? (
                          <>
                            <Check className="h-3 w-3 animate-pulse" />
                            Ajout…
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3" />
                            Ajouter
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {!activeCat && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Choisissez une catégorie
            </p>
          )}
        </div>
      </Collapsible>
    </div>
  );
}
