/**
 * ServiceAdder — Customer-facing tab bar with browsable product cards and "Dodaj" buttons.
 * Five top-level groups (Eksterijer / Enterijer / Planovi / Animacija / Opremanje) that
 * each map to one or more catalog categories, so internal section codes
 * ("1.1 — Rendering" etc.) never reach the customer.
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

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, Film, Headphones, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CONFIGURATOR_CATEGORIES,
  type ConfiguratorCategory,
  type ConfiguratorProduct,
} from "@/lib/catalog/configurator";
import {
  CUSTOMER_GROUPS,
  type CustomerGroupId,
} from "@/lib/catalog/customer-groups";
import {
  ANIM_PRODUCT_ID,
  ANIM_SOURCE_MODES,
  type AnimSourceMode,
} from "@/lib/catalog/animation-config";
import { track } from "@/lib/posthog-events";
import { useQuote } from "./quote-context";

const VALID_GROUP_IDS = new Set<string>(CUSTOMER_GROUPS.map((g) => g.id));

function isValidGroupId(id: string | null): id is CustomerGroupId {
  return id !== null && VALID_GROUP_IDS.has(id);
}

export function ServiceAdder() {
  const searchParams = useSearchParams();
  const groupParam = searchParams.get("group");

  const initialGroupId: CustomerGroupId = isValidGroupId(groupParam)
    ? groupParam
    : CUSTOMER_GROUPS[0].id;

  const [activeGroupId, setActiveGroupId] =
    useState<CustomerGroupId>(initialGroupId);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const { addProduct } = useQuote();

  // Sync state when navigation changes the ?group= param (e.g. user clicks a
  // preview card while already on /cene). State is otherwise local — clicking
  // a tab here does not push to the URL, so the user's flow isn't dotted with
  // history entries.
  useEffect(() => {
    if (isValidGroupId(groupParam) && groupParam !== activeGroupId) {
      setActiveGroupId(groupParam);
    }
    // intentional: only react to param flips, not internal tab clicks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupParam]);

  const activeGroup = CUSTOMER_GROUPS.find((g) => g.id === activeGroupId)!;
  const activeCats = useMemo(
    () =>
      CONFIGURATOR_CATEGORIES.filter((c) => activeGroup.catIds.includes(c.id)),
    [activeGroup],
  );

  const handleAdd = (
    product: ConfiguratorProduct,
    categoryId: string,
    sourceMode?: string,
  ) => {
    addProduct(product.id, categoryId, sourceMode);
    setJustAdded(product.id);
    setTimeout(() => setJustAdded(null), 1200);
  };

  return (
    <div className="space-y-6">
      {/* Customer-facing group tabs */}
      <div
        className="flex flex-wrap gap-1.5"
        role="tablist"
        aria-label="Tipovi usluga"
      >
        {CUSTOMER_GROUPS.map((group) => {
          const isActive = group.id === activeGroupId;
          return (
            <button
              key={group.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setActiveGroupId(group.id);
                track("service_group_picked", { group: group.id });
              }}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-xs font-medium transition-all md:text-sm",
                isActive
                  ? "border-accent bg-accent/10 text-foreground shadow-[0_8px_20px_rgba(184,131,99,0.12)]"
                  : "border-border bg-background/60 text-muted-foreground hover:border-[color:var(--color-border-warm)] hover:bg-background hover:text-foreground",
              )}
            >
              {group.label}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground">{activeGroup.blurb}</p>

      {/* Product cards grouped by catalog subcategory.
          When the group has only one underlying category, the subcategory
          header is suppressed to keep the page calm. */}
      <div className="space-y-6">
        {activeCats.map((cat) => (
          <CategoryProducts
            key={cat.id}
            category={cat}
            showHeader={activeCats.length > 1}
            justAdded={justAdded}
            onAdd={(product, sourceMode) =>
              handleAdd(product, cat.id, sourceMode)
            }
          />
        ))}
      </div>
    </div>
  );
}

function CategoryProducts({
  category,
  showHeader,
  justAdded,
  onAdd,
}: {
  category: ConfiguratorCategory;
  showHeader: boolean;
  justAdded: string | null;
  onAdd: (product: ConfiguratorProduct, sourceMode?: string) => void;
}) {
  return (
    <div className="space-y-3">
      {showHeader && (
        <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          {category.label}
        </h3>
      )}
      {category.id === "animation" ? (
        <AnimationCardWrapper
          category={category}
          isAdded={(productId) => justAdded === productId}
          onAdd={(product, sourceMode) => onAdd(product, sourceMode)}
        />
      ) : (
        category.products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isAdded={justAdded === product.id}
            onAdd={() => onAdd(product)}
          />
        ))
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

function AnimationCardWrapper({
  category,
  isAdded,
  onAdd,
}: {
  category: ConfiguratorCategory;
  isAdded: (productId: string) => boolean;
  onAdd: (product: ConfiguratorProduct, sourceMode: string) => void;
}) {
  const product = category.products.find((p) => p.id === ANIM_PRODUCT_ID);
  if (!product) return null;
  return (
    <AnimationCard
      product={product}
      isAdded={isAdded(product.id)}
      onAdd={onAdd}
    />
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

