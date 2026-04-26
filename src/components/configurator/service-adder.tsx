/**
 * ServiceAdder — Category tab bar with browsable product cards and "Dodaj" buttons.
 * Groups services by section and lets users add items to the quote.
 *
 * The animation category is rendered specially: instead of showing the
 * 3 source-mode product variants as separate cards, a single
 * "Animacija" card exposes a 3-segment mode picker (od nule / postojeći
 * model / aktivan projekat). All three feed the same `anim` catalog
 * product; the picked mode is passed to addProduct as `sourceMode`.
 *
 * Used on: PricingConfigurator (main column, /cene page).
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Film, Headphones, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CONFIGURATOR_CATEGORIES,
  type ConfiguratorCategory,
  type ConfiguratorProduct,
} from "@/lib/catalog/configurator";
import {
  ANIM_PRODUCT_ID,
  ANIM_SOURCE_MODES,
  type AnimSourceMode,
} from "@/lib/catalog/animation-config";
import { track } from "@/lib/posthog-events";
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

  const handleAdd = (product: ConfiguratorProduct, sourceMode?: string) => {
    if (!activeCategory) return;
    addProduct(product.id, activeCategory.id, sourceMode);
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
          {/* Animation category renders one consolidated card with a mode
              picker; everything else maps catalog products to cards 1:1. */}
          {activeCategory.id === "animation"
            ? renderAnimationCard(activeCategory, justAdded, handleAdd)
            : activeCategory.products.map((product) => {
                const isAdded = justAdded === product.id;
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isAdded={isAdded}
                    onAdd={() => handleAdd(product)}
                  />
                );
              })}
        </div>
      )}
    </div>
  );
}

function ProductCard({
  product,
  isAdded,
  onAdd,
}: {
  product: ConfiguratorProduct;
  isAdded: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-5 transition-shadow hover:shadow-[0_14px_40px_rgba(28,26,25,0.05)]">
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
          {product.inquiryOnly ? (
            <Link
              href={`/usluge/vr/konsultacija?p=${product.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent/15 px-4 py-2 text-xs font-semibold text-accent transition-all hover:bg-accent hover:text-white"
            >
              <Headphones className="h-3 w-3" /> Zatraži konsultaciju
              <ArrowRight className="h-3 w-3" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAdd}
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
          )}
        </div>
      </div>
    </div>
  );
}

function renderAnimationCard(
  category: ConfiguratorCategory,
  justAdded: string | null,
  onAdd: (product: ConfiguratorProduct, sourceMode: string) => void,
) {
  const product = category.products.find((p) => p.id === ANIM_PRODUCT_ID);
  if (!product) return null;
  return (
    <AnimationCard product={product} isAdded={justAdded === product.id} onAdd={onAdd} />
  );
}

function AnimationCard({
  product,
  isAdded,
  onAdd,
}: {
  product: ConfiguratorProduct;
  isAdded: boolean;
  onAdd: (product: ConfiguratorProduct, sourceMode: string) => void;
}) {
  const [mode, setMode] = useState<AnimSourceMode>("scratch");
  const modeMeta = ANIM_SOURCE_MODES.find((m) => m.id === mode);
  const perSec = modeMeta?.perSecondEur ?? 15;

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-5 transition-shadow hover:shadow-[0_14px_40px_rgba(28,26,25,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Film className="h-4 w-4 text-accent" />
            3D animacija
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Cinematski flythrough / walkthrough — minimum 15 sekundi
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-2">
          <p className="text-xl font-semibold text-foreground">
            €{perSec}
            <span className="text-xs font-normal text-muted-foreground">
              /sek
            </span>
          </p>
        </div>
      </div>

      {/* Source mode picker */}
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {ANIM_SOURCE_MODES.map((m) => {
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMode(m.id);
                track("anim_source_mode_picked", { mode: m.id, where: "cene" });
              }}
              className={cn(
                "flex flex-col items-start gap-1 rounded-lg border px-3 py-2 text-left transition-colors",
                isActive
                  ? "border-accent bg-accent/10"
                  : "border-border/40 bg-background/40 hover:border-accent/40",
              )}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="text-[0.78rem] font-semibold text-foreground">
                  {m.shortLabel}
                </span>
                <span className="text-[0.7rem] font-bold text-accent tabular-nums">
                  €{m.perSecondEur}/s
                </span>
              </span>
              <span className="text-[0.7rem] leading-snug text-muted-foreground">
                {m.description}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-end">
        <button
          type="button"
          onClick={() => onAdd(product, mode)}
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
              <Plus className="h-3 w-3" /> Dodaj animaciju
            </>
          )}
        </button>
      </div>
    </div>
  );
}
