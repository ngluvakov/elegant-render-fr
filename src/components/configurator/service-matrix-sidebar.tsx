"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { CONFIGURATOR_CATEGORIES } from "@/lib/catalog/configurator";
import { useQuote } from "./quote-context";
import { track } from "@/lib/posthog-events";
import { ALL_FILTER, MATRIX_CAT_PARAM } from "./service-matrix-shared";
import { useFlipAnimation } from "./use-flip-animation";

const INTERACTED_KEY = "matrix-cat-interacted";

// useSyncExternalStore handles SSR + client divergence cleanly without
// triggering hydration warnings — server returns the "already interacted"
// snapshot so the pulse class never lands in static HTML, and the client
// reconciles from localStorage after hydration.
function subscribeInteracted(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(INTERACTED_KEY, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(INTERACTED_KEY, callback);
    window.removeEventListener("storage", callback);
  };
}

function getInteractedSnapshot() {
  return localStorage.getItem(INTERACTED_KEY) === "1";
}

function getInteractedServerSnapshot() {
  return true;
}

function markInteracted() {
  try {
    localStorage.setItem(INTERACTED_KEY, "1");
    window.dispatchEvent(new Event(INTERACTED_KEY));
  } catch {}
}

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

  const allItem: Item = { id: ALL_FILTER, label: "Sve usluge", count: totalCount };
  const catItems: Item[] = categories.map((c) => ({
    id: c.id,
    label: c.label,
    count: c.products.length,
  }));

  // Reorder: Sve always first, the active category (if any) bumps to position 2,
  // then the remaining categories follow in their catalog order.
  const orderedItems: Item[] =
    activeCat === ALL_FILTER
      ? [allItem, ...catItems]
      : (() => {
          const active = catItems.find((c) => c.id === activeCat);
          const rest = catItems.filter((c) => c.id !== activeCat);
          return active ? [allItem, active, ...rest] : [allItem, ...catItems];
        })();

  const desktopRef = useRef<HTMLUListElement | null>(null);
  const mobileRef = useRef<HTMLUListElement | null>(null);
  useFlipAnimation(desktopRef, activeCat);
  useFlipAnimation(mobileRef, activeCat);

  const hasInteracted = useSyncExternalStore(
    subscribeInteracted,
    getInteractedSnapshot,
    getInteractedServerSnapshot,
  );

  const setCat = useCallback(
    (id: string) => {
      if (!hasInteracted) markInteracted();
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
    [router, sp, hasInteracted],
  );

  return (
    <>
      {/* Desktop: sticky vertical list */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <p className="mb-3 px-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Kategorije
          </p>
          <ul ref={desktopRef} className="flex flex-col gap-0.5">
            {orderedItems.map((item, idx) => {
              const isActive = item.id === activeCat;
              const isAll = item.id === ALL_FILTER;
              const shouldPulse = !hasInteracted && !isActive;
              return (
                <li key={item.id} data-flip-key={item.id}>
                  <button
                    type="button"
                    onClick={() => setCat(item.id)}
                    aria-pressed={isActive}
                    style={
                      shouldPulse
                        ? { animationDelay: `${idx * 0.35}s` }
                        : undefined
                    }
                    className={cn(
                      "group flex w-full items-center justify-between gap-2 rounded-lg border-l-[3px] px-3 py-2 text-left text-sm transition-colors",
                      isActive
                        ? "border-accent bg-accent/10 text-foreground font-medium"
                        : "border-transparent text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
                      isAll && !isActive && "font-medium text-foreground/80",
                      shouldPulse && "sidebar-attention-pulse",
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                    {item.count !== null && (
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-1.5 text-[0.65rem] tabular-nums",
                          isActive
                            ? "bg-accent text-accent-foreground"
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
        <ul ref={mobileRef} className="flex gap-2 pb-1">
          {orderedItems.map((item, idx) => {
            const isActive = item.id === activeCat;
            const shouldPulse = !hasInteracted && !isActive;
            return (
              <li key={item.id} data-flip-key={item.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setCat(item.id)}
                  aria-pressed={isActive}
                  style={
                    shouldPulse
                      ? { animationDelay: `${idx * 0.35}s` }
                      : undefined
                  }
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary/60 text-foreground hover:bg-secondary",
                    shouldPulse && "sidebar-attention-pulse",
                  )}
                >
                  <span>{item.label}</span>
                  {item.count !== null && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 text-[0.6rem] tabular-nums",
                        isActive
                          ? "bg-accent-foreground/20 text-accent-foreground"
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
