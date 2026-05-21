"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { CONFIGURATOR_CATEGORIES } from "@/lib/catalog/configurator";
import { useQuote } from "./quote-context";
import { track } from "@/lib/posthog-events";
import { ALL_FILTER, MATRIX_CAT_PARAM } from "./service-matrix-shared";

type Item = {
  id: string;
  label: string;
  count: number | null;
};

export function ServiceMatrixSidebar({ activeCat }: { activeCat: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const { pricingCatalog } = useQuote();
  const categories = pricingCatalog?.categories ?? CONFIGURATOR_CATEGORIES;

  const totalCount = categories.reduce(
    (acc, c) => acc + c.products.length,
    0,
  );

  const items: Item[] = [
    { id: ALL_FILTER, label: "Sve usluge", count: totalCount },
    ...categories.map((c) => ({
      id: c.id,
      label: c.label,
      count: c.products.length,
    })),
  ];

  const setCat = useCallback(
    (id: string) => {
      const params = new URLSearchParams(sp.toString());
      if (id === ALL_FILTER) {
        params.delete(MATRIX_CAT_PARAM);
      } else {
        params.set(MATRIX_CAT_PARAM, id);
      }
      const qs = params.toString();
      router.replace(`/cene${qs ? `?${qs}` : ""}#usluge`, { scroll: false });
      track("service_matrix_cat_click", { cat: id });
    },
    [router, sp],
  );

  return (
    <>
      {/* Desktop: sticky vertical list */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <p className="mb-3 px-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Kategorije
          </p>
          <ul className="flex flex-col gap-0.5">
            {items.map((item) => {
              const isActive = item.id === activeCat;
              const isAll = item.id === ALL_FILTER;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setCat(item.id)}
                    aria-pressed={isActive}
                    className={cn(
                      "group flex w-full items-center justify-between gap-2 rounded-lg border-l-2 px-3 py-2 text-left text-sm transition-colors",
                      isActive
                        ? "border-accent bg-secondary/60 text-foreground"
                        : "border-transparent text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
                      isAll && !isActive && "font-medium text-foreground/80",
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                    {item.count !== null && (
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-1.5 text-[0.65rem] tabular-nums",
                          isActive
                            ? "bg-foreground text-background"
                            : "bg-secondary/80 text-muted-foreground",
                        )}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      {/* Mobile / tablet: horizontal scrollable chip strip */}
      <div className="lg:hidden -mx-6 px-6 overflow-x-auto scrollbar-none">
        <ul className="flex gap-2 pb-1">
          {items.map((item) => {
            const isActive = item.id === activeCat;
            return (
              <li key={item.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setCat(item.id)}
                  aria-pressed={isActive}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-foreground text-background"
                      : "bg-secondary/60 text-foreground hover:bg-secondary",
                  )}
                >
                  <span>{item.label}</span>
                  {item.count !== null && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 text-[0.6rem] tabular-nums",
                        isActive
                          ? "bg-background/20 text-background"
                          : "bg-background text-muted-foreground",
                      )}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
