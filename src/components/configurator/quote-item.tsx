/**
 * QuoteItemCard — Expandable card for a product in the quote, showing included
 * add-ons, duration slider, add-on steppers, and disclaimers.
 *
 * Used on: PricingConfigurator (main column, /cene page).
 */
"use client";

import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getConfiguratorProduct } from "@/lib/catalog/configurator";
import {
  formatDiscountedPrice,
  type LineItemBreakdown,
} from "@/lib/catalog/calculate";
import { Collapsible } from "@/components/ui/collapsible";
import { useQuote } from "./quote-context";
import { AddOnStepper } from "./addon-stepper";
import { InteriorQuoteEditor } from "./interior-quote-editor";
import { Tour360QuoteEditor } from "./tour360-quote-editor";

type QuoteItemProps = {
  breakdown: LineItemBreakdown;
};

export function QuoteItemCard({ breakdown }: QuoteItemProps) {
  const [expanded, setExpanded] = useState(true);
  const {
    items,
    setAddOnQty,
    setDuration,
    setInteriorConfig,
    setTour360Config,
    removeProduct,
  } = useQuote();
  const item = items.find((i) => i.instanceId === breakdown.instanceId);
  const result = getConfiguratorProduct(breakdown.productId);

  if (!item || !result) return null;
  const { product } = result;

  // int-static / int-360 are configured via per-floor editors that route
  // pricing through calcInteriorTotal / calcTour360Total — the catalog
  // addon model doesn't apply, so we suppress the AddOnStepper section
  // and the "included addons" badges (their data lives in the editor's
  // breakdown rows instead).
  const usesInteriorEditor =
    breakdown.productId === "int-static" && Array.isArray(item.interiorConfig);
  const usesTour360Editor =
    breakdown.productId === "int-360" && !!item.tour360Config;
  const usesSpecialEditor = usesInteriorEditor || usesTour360Editor;

  // Cross-service discount metadata for the editor's footer panel. The
  // editor needs the un-discounted total so it can show the struck price
  // and the savings line. discountReason / discountPct come straight from
  // the breakdown the resolver produced.
  const editorDiscount =
    breakdown.discountPct > 0 &&
    breakdown.originalTotalEur > breakdown.totalEur &&
    breakdown.discountReason
      ? {
          pct: breakdown.discountPct,
          reason: breakdown.discountReason,
          originalTotalEur: breakdown.originalTotalEur,
          totalEur: breakdown.totalEur,
        }
      : null;

  const hasIncludedAddOns =
    !usesSpecialEditor &&
    breakdown.addOns.some((ao) => ao.includedQty > 0 && ao.quantity > 0);

  return (
    <div
      data-quote-item={breakdown.instanceId}
      className="overflow-hidden rounded-2xl border border-border/60 bg-card/95 transition-shadow"
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 bg-secondary/40 px-5 py-4 text-left transition-colors hover:bg-secondary/60"
      >
        <div className="min-w-0 flex-1">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {breakdown.categoryLabel}
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {breakdown.productLabel}
          </p>
          {breakdown.discountReason && (
            <p className="mt-1 text-xs text-[color:var(--color-sage-deep)]">
              {breakdown.discountReason}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {(() => {
            const { primary, struck, badge } = formatDiscountedPrice(
              breakdown.totalEur,
              breakdown.originalTotalEur,
              breakdown.discountPct,
            );
            return (
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  {struck && (
                    <span className="text-sm text-muted-foreground/60 line-through">
                      {struck}
                    </span>
                  )}
                  <span className="text-lg font-semibold text-foreground">
                    {primary}
                  </span>
                </div>
                {badge && (
                  <span className="mt-0.5 rounded-md bg-[color:var(--color-sage)]/15 px-1.5 py-0.5 text-[0.68rem] font-semibold text-[color:var(--color-sage-deep)]">
                    {badge}
                  </span>
                )}
              </div>
            );
          })()}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-300",
              expanded && "rotate-180",
            )}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeProduct(breakdown.instanceId);
            }}
            aria-label="Ukloni"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </button>

      <Collapsible open={expanded}>
        <div>
          {/* Included items badges */}
          {hasIncludedAddOns && (
            <div className="border-t border-border/40 bg-[color:var(--color-sage)]/5 px-5 py-3">
              <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-sage-deep)]">
                Već je uključeno
              </p>
              <div className="flex flex-wrap gap-2">
                {breakdown.addOns
                  .filter((ao) => ao.includedQty > 0 && ao.quantity > 0)
                  .map((ao) => (
                    <span
                      key={ao.addOnId}
                      className="inline-flex items-center gap-1 rounded-md bg-[color:var(--color-sage)]/12 px-2.5 py-1 text-xs font-medium text-[color:var(--color-sage-deep)]"
                    >
                      <Check className="h-3 w-3" />
                      {ao.includedQty} {ao.label.toLowerCase()}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Duration slider for animation products */}
          {product.durationConfig && item.durationSeconds !== undefined && (
            <div className="border-t border-border/40 px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Trajanje</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={product.durationConfig.minSeconds}
                    max={product.durationConfig.maxSeconds}
                    value={item.durationSeconds}
                    onChange={(e) =>
                      setDuration(
                        item.instanceId,
                        parseInt(e.target.value) || product.durationConfig!.minSeconds,
                      )
                    }
                    className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-right text-sm font-semibold text-foreground"
                  />
                  <span className="text-sm text-muted-foreground">sekundi</span>
                </div>
              </div>
              <input
                type="range"
                min={product.durationConfig.minSeconds}
                max={180}
                value={Math.min(item.durationSeconds, 180)}
                onChange={(e) =>
                  setDuration(item.instanceId, parseInt(e.target.value))
                }
                className="mt-3 w-full accent-accent"
              />
              <div className="mt-1 flex justify-between">
                {["15s", "30s", "60s", "120s", "180s"].map((l) => (
                  <span key={l} className="text-[0.72rem] text-muted-foreground/50">
                    {l}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                €{product.durationConfig.perSecondEur}/sek ×{" "}
                {item.durationSeconds}s
                {breakdown.durationDiscount && breakdown.durationDiscount > 0 && (
                  <span className="font-semibold text-[color:var(--color-sage-deep)]">
                    {" "}
                    — {Math.round(breakdown.durationDiscount * 100)}% popust na
                    trajanje
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Per-floor editor for int-static / int-360 (replaces addon steppers) */}
          {usesInteriorEditor && item.interiorConfig && (
            <div className="border-t border-border/40 px-5 py-4">
              <p className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Konfiguracija
              </p>
              <InteriorQuoteEditor
                floors={item.interiorConfig}
                discount={editorDiscount}
                onChange={(floors) =>
                  setInteriorConfig(item.instanceId, floors)
                }
              />
            </div>
          )}
          {usesTour360Editor && item.tour360Config && (
            <div className="border-t border-border/40 px-5 py-4">
              <p className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Konfiguracija
              </p>
              <Tour360QuoteEditor
                config={item.tour360Config}
                discount={editorDiscount}
                onChange={(config) =>
                  setTour360Config(item.instanceId, config)
                }
              />
            </div>
          )}

          {/* Add-on steppers — for products that don't use a special editor */}
          {!usesSpecialEditor && product.addOns.length > 0 && (
            <div className="border-t border-border/40 px-5 py-4">
              <p className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Prilagodi
              </p>
              <div className="space-y-1">
                {product.addOns.map((def) => {
                  const aoBreakdown = breakdown.addOns.find(
                    (ao) => ao.addOnId === def.id,
                  );
                  return (
                    <AddOnStepper
                      key={def.id}
                      label={def.label}
                      description={def.description}
                      quantity={item.addOnQuantities[def.id] ?? def.includedQty}
                      includedQty={def.includedQty}
                      maxQty={def.maxQty}
                      priceEur={aoBreakdown?.unitPriceEur ?? def.priceEur}
                      basePriceEur={def.priceEur}
                      priceType={def.priceType}
                      isVolumeRate={aoBreakdown?.isVolumeRate ?? false}
                      volumeRules={def.volumeRules}
                      onChange={(qty) =>
                        setAddOnQty(item.instanceId, def.id, qty)
                      }
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Disclaimers */}
          {product.disclaimers && product.disclaimers.length > 0 && (
            <div className="border-t border-border/40 px-5 py-3">
              {product.disclaimers.map((d) => (
                <p
                  key={d}
                  className="text-[0.68rem] leading-5 text-muted-foreground"
                >
                  {d}
                </p>
              ))}
            </div>
          )}
        </div>
      </Collapsible>
    </div>
  );
}
