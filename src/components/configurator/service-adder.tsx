/**
 * ServiceAdder — Category tab bar with browsable product cards and "Dodaj" buttons.
 * Groups services by section and lets users add items to the quote.
 *
 * Used on: PricingConfigurator (main column, /cene page).
 */
"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CONFIGURATOR_CATEGORIES,
  type ConfiguratorCategory,
  type ConfiguratorProduct,
} from "@/lib/catalog/configurator";
import { useQuote } from "./quote-context";

// Group categories by sectionLabel for the tab bar
function getSectionGroups() {
  const groups: { label: string; categories: ConfiguratorCategory[] }[] = [];
  for (const cat of CONFIGURATOR_CATEGORIES) {
    const existing = groups.find((g) => g.label === cat.sectionLabel);
    if (existing) {
      existing.categories.push(cat);
    } else {
      groups.push({ label: cat.sectionLabel, categories: [cat] });
    }
  }
  return groups;
}

const SECTION_GROUPS = getSectionGroups();

export function ServiceAdder() {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    CONFIGURATOR_CATEGORIES[0].id,
  );
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const { addProduct } = useQuote();

  const activeCategory = CONFIGURATOR_CATEGORIES.find(
    (c) => c.id === activeCategoryId,
  );

  const handleAdd = (product: ConfiguratorProduct) => {
    if (!activeCategory) return;
    addProduct(product.id, activeCategory.id);
    setJustAdded(product.id);
    setTimeout(() => setJustAdded(null), 1200);
  };

  return (
    <div className="space-y-6">
      {/* Section tabs — one row per section */}
      <div className="space-y-3">
        {SECTION_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.categories.map((cat) => {
                const isActive = cat.id === activeCategoryId;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-xs font-medium transition-all",
                      isActive
                        ? "border-accent bg-accent/10 text-foreground shadow-[0_8px_20px_rgba(184,131,99,0.12)]"
                        : "border-border bg-background/60 text-muted-foreground hover:border-[color:var(--color-border-warm)] hover:bg-background hover:text-foreground",
                    )}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Active category description */}
      {activeCategory && (
        <p className="text-sm text-muted-foreground">
          {activeCategory.description}
        </p>
      )}

      {/* Product cards for active category */}
      {activeCategory && (
        <div className="space-y-3">
          {activeCategory.products.map((product) => {
            const isAdded = justAdded === product.id;
            return (
              <div
                key={product.id}
                className="rounded-2xl border border-border/60 bg-card/80 p-5 transition-shadow hover:shadow-[0_14px_40px_rgba(28,26,25,0.05)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-foreground">
                      {product.label}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {product.unitLabel}
                    </p>
                    {product.includes.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {product.includes.map((inc) => (
                          <span
                            key={inc}
                            className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-sage)]/12 px-2 py-0.5 text-[0.72rem] font-medium text-[color:var(--color-sage-deep)]"
                          >
                            <Check className="h-3 w-3" />
                            {inc}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-2">
                    <p className="text-xl font-semibold text-foreground">
                      {product.durationConfig
                        ? `€${product.durationConfig.perSecondEur}`
                        : `€${product.basePriceEur}`}
                      {product.durationConfig && (
                        <span className="text-xs font-normal text-muted-foreground">
                          /sek
                        </span>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleAdd(product)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all",
                        isAdded
                          ? "bg-[color:var(--color-sage)] text-white"
                          : "bg-accent/15 text-accent hover:bg-accent hover:text-white",
                      )}
                    >
                      {isAdded ? (
                        <>
                          <Check className="h-3 w-3" /> Dodato
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3" /> Dodaj
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
