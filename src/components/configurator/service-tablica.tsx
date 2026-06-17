/**
 * ServiceTablica — Full-width product card for the /cene browse grid.
 *
 * 3-zone layout: hero image / content / price-strip band.
 * Mobile: collapsed by default behind "Detalji ›" toggle.
 * Desktop: always expanded.
 *
 * Branched CTA logic:
 *   - inquiryOnly → "Pošalji upit" link → /kontakt?service={id}
 *   - int-static | int-360 → "Konfiguriši sprat" → addProduct (opens InteriorQuoteEditor)
 *   - else → "Dodaj u korpu" → addProduct
 *
 * Upsell hint: sage callout band with preview chips, expand to RelatedUpsellCard grid.
 * Price strip: live cart-triggered discount when product has a qualifying sibling in cart.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Building2, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveDiscount } from "@/lib/catalog/calculate";
import { makePrimaryItem, makeUpsellTargetItem, getUpsellProducts } from "@/lib/catalog/upsell-helpers";
import {
  formatPublicPrice,
  formatPublicPriceText,
} from "@/lib/catalog/display-currency";
import { useQuote } from "./quote-context";
import { RelatedUpsellCard } from "./related-upsell-card";
import { track } from "@/lib/posthog-events";
import { getConfiguratorProduct } from "@/lib/catalog/configurator";
import type { ConfiguratorCategory, ConfiguratorProduct } from "@/lib/catalog/configurator";
import type { QuoteItem } from "@/lib/catalog/calculate";
import type { ResolvedPricingCatalog } from "@/lib/pricing/catalog";

// Serbian pluralization for unit labels used in "U paketu od X Y" annotation.
// Only needed for the small set of units that appear on /cene. Extend if needed.
function pluralizeUnit(unitLabel: string, qty: number): string {
  const map: Record<string, [string, string, string]> = {
    "render":    ["render",   "rendera",  "rendera"],
    "panoramu":  ["panoramu", "panorame", "panorama"],
    "sekundu":   ["sekundu",  "sekunde",  "sekundi"],
    "sliku":     ["sliku",    "slike",    "slika"],
    "kadar":     ["kadar",    "kadra",    "kadrova"],
    "nivo":      ["nivo",     "nivoa",    "nivoa"],
    "pogled":    ["pogled",   "pogleda",  "pogleda"],
    "prostoriju": ["prostoriju", "prostorije", "prostorija"],
  };
  const forms = map[unitLabel] ?? [unitLabel, unitLabel, unitLabel];
  if (qty === 1) return forms[0];
  if (qty >= 2 && qty <= 4) return forms[1];
  return forms[2];
}

type Props = {
  product: ConfiguratorProduct;
  category: ConfiguratorCategory;
  cartItems: QuoteItem[];
  pricingCatalog?: ResolvedPricingCatalog;
  /**
   * When true, the card renders as a marketing showcase on the homepage:
   * primary CTA links to /cene?cat=<category>#usluge instead of adding to
   * cart. Used by MarketingServicesShowcase since cart state does not
   * persist between routes.
   */
  marketingMode?: boolean;
};

export function ServiceTablica({ product, category, cartItems, pricingCatalog, marketingMode = false }: Props) {
  const { addProduct, displayCurrency, pricingSettings } = useQuote();
  const [expanded, setExpanded] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  // ── Upsell products ──────────────────────────────────────────────────────
  const upsellProducts = getUpsellProducts(product.id, cartItems).slice(0, 3);

  const primaryItem = makePrimaryItem(product.id);
  const siblings: QuoteItem[] = [primaryItem, ...cartItems];
  const upsellDiscounts = upsellProducts.map((up) => {
    const targetItem = makeUpsellTargetItem(up.id);
    return resolveDiscount(targetItem, siblings, pricingCatalog);
  });
  const hasAnyUpsellDiscount = upsellDiscounts.some((d) => d !== null);
  const hasUpsells = upsellProducts.length > 0;

  // ── Own (tablica-level) live discount ────────────────────────────────────
  const ownTargetItem = makeUpsellTargetItem(product.id);
  const ownDiscount = resolveDiscount(ownTargetItem, cartItems, pricingCatalog);
  const isInCart = cartItems.some((i) => i.productId === product.id);
  // Suppress when: already in cart (confusing), or inquiry-only (no real price surface)
  const showOwnDiscount = ownDiscount !== null && !isInCart && !product.inquiryOnly;

  // ── Price figures ────────────────────────────────────────────────────────
  const displayUnitLabel = product.displayUnitLabel ?? product.unitLabel;
  const formattedDisplayUnitLabel = formatPublicPriceText(
    displayUnitLabel,
    displayCurrency,
    pricingSettings,
  );
  const displayMinQty = product.displayMinQty;
  const displayPackageNote = product.displayPackageNote;

  const originalPerUnit = product.displayPerUnitRsd ?? product.basePriceRsd;
  const originalPackage = product.basePriceRsd;

  const discountedPerUnit = showOwnDiscount
    ? Math.round(originalPerUnit * (1 - ownDiscount.pct / 100))
    : null;
  const discountedPackage = showOwnDiscount
    ? Math.round(originalPackage * (1 - ownDiscount.pct / 100))
    : null;

  // ── CTA resolution ───────────────────────────────────────────────────────
  const isInquiry = product.inquiryOnly;
  const isInterior = product.id === "int-static" || product.id === "int-360";

  const handleAddToCart = () => {
    addProduct(product.id, category.id);
    track("service_tablica_click_dodaj", {
      product_id: product.id,
      category_id: category.id,
    });
  };

  const primaryCta = isInquiry ? (
    <div>
      <Link
        href={`/kontakt?service=${product.id}`}
        className="inline-flex items-center justify-center w-full rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 px-4 py-2.5 text-sm font-semibold transition-colors"
      >
        Pošalji upit
      </Link>
      <p className="mt-2 text-xs text-muted-foreground text-center">
        Odgovaramo u roku od jednog radnog dana.
      </p>
    </div>
  ) : marketingMode ? (
    <Link
      href={`/cene?cat=${category.id}#usluge`}
      onClick={() =>
        track("service_tablica_click_dodaj", {
          product_id: product.id,
          category_id: category.id,
          marketing_mode: true,
        })
      }
      className="inline-flex items-center justify-center w-full rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 px-4 py-2.5 text-sm font-semibold transition-colors"
    >
      Pogledaj na cenovniku
    </Link>
  ) : (
    <button
      type="button"
      onClick={handleAddToCart}
      className="inline-flex items-center justify-center w-full rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 px-4 py-2.5 text-sm font-semibold transition-colors"
    >
      {isInterior ? "Konfiguriši sprat" : "Dodaj u korpu"}
    </button>
  );

  // ── Price strip container style ──────────────────────────────────────────
  // showOwnDiscount → stronger sage (15%/40 border)
  // no discount but paket product → quiet sage (8%)
  // else → no tint
  const hasPriceStripBand = showOwnDiscount || (displayMinQty !== undefined && displayMinQty > 1);
  const priceStripBandClass = showOwnDiscount
    ? "rounded-lg bg-[color:var(--color-sage)]/15 border border-[color:var(--color-sage)]/40 px-4 py-3 -mx-2 my-1"
    : displayMinQty !== undefined && displayMinQty > 1
    ? "rounded-lg bg-[color:var(--color-sage)]/8 px-4 py-3 -mx-2 my-1"
    : "";

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      {/* ZONE 1 — Hero image */}
      <div className="relative w-full aspect-video overflow-hidden bg-gradient-to-br from-[color:var(--color-sage)]/10 to-[color:var(--color-sage-deep)]/20">
        {!imgFailed ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`/artwork/tablica-${product.id}.webp`}
            alt={`${product.label} - ${category.description}`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-center"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Building2 className="h-14 w-14 text-foreground/20" strokeWidth={1} />
          </div>
        )}
      </div>

      {/* ZONE 2 — Content */}
      <div className="p-6 flex flex-col gap-3">
        {/* H3 — always visible */}
        <h3 className="text-2xl font-semibold text-foreground leading-snug">
          {product.label}
        </h3>

        {/* Collapsible content — hidden on mobile by default, always shown on md+ */}
        <div className={cn("contents", !expanded && "hidden md:contents")}>
          {/* Hook line */}
          <p className="text-sm text-muted-foreground">
            {category.description}
          </p>

          {/* Includes list */}
          {product.includes.length > 0 && (
            <ul className="flex flex-col gap-1.5 mt-1">
              {product.includes.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                  <Check
                    className="h-4 w-4 text-[color:var(--color-sage-deep)] shrink-0 mt-0.5"
                    strokeWidth={2.5}
                  />
                  {item}
                </li>
              ))}
            </ul>
          )}

          {/* ── Issue 3b: Upsell sage callout band ── */}
          {hasUpsells && (
            <div className="rounded-xl border border-[color:var(--color-sage)]/35 bg-[color:var(--color-sage)]/8 p-4 mt-2">
              {/* Kicker row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-sage-deep)] leading-none">
                  Često ide zajedno
                  {hasAnyUpsellDiscount && (
                    <span className="ml-2 inline-flex items-center rounded bg-[color:var(--color-sage-deep)]/15 px-1.5 py-0.5 text-[0.6rem] font-bold normal-case tracking-normal text-[color:var(--color-sage-deep)]">
                      Sa popustom
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => setUpsellOpen((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:text-[color:var(--color-sage-deep)] transition-colors shrink-0"
                >
                  {upsellOpen ? "Sakrij" : "Vidi sve"}
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      upsellOpen && "rotate-180",
                    )}
                  />
                </button>
              </div>

              {/* Preview chips — always visible in collapsed state */}
              <div className="flex flex-wrap gap-1.5">
                {upsellProducts.slice(0, 3).map((up, i) => {
                  const chipDiscount = upsellDiscounts[i];
                  return (
                    <span
                      key={up.id}
                      className="inline-flex items-center gap-1 rounded-full bg-card border border-[color:var(--color-sage)]/25 px-2.5 py-1 text-xs font-medium text-foreground"
                    >
                      {up.label}
                      {chipDiscount !== null && (
                        <span className="text-[0.65rem] font-bold text-[color:var(--color-sage-deep)]">
                          &minus;{chipDiscount.pct}%
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>

              {/* Expanded grid */}
              {upsellOpen && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {upsellProducts.map((up) => {
                    const upCategoryId =
                      getConfiguratorProduct(up.id, pricingCatalog?.categories)
                        ?.category.id ?? category.id;
                    return (
                      <RelatedUpsellCard
                        key={up.id}
                        primaryProductId={product.id}
                        relatedProduct={up}
                        cartItems={cartItems}
                        categoryId={upCategoryId}
                        pricingCatalog={pricingCatalog}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Konfiguriši / Detalji ghost link — for interior products only on desktop */}
          {!isInquiry && isInterior && (
            <p className="text-xs text-muted-foreground">
              Cena zavisi od broja spratova i prostorija — konfiguriši u korpi.
            </p>
          )}
        </div>

        {/* Mobile expand toggle */}
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>{expanded ? "Zatvori" : "Detalji"}</span>
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                expanded && "rotate-90",
              )}
            />
          </button>
        </div>
      </div>

      {/* ZONE 3 — Price strip */}
      <div className="bg-secondary/60 border-t border-border/40 py-5 px-6">

        {/* ── Issues 3a + 4: price band (conditionally tinted) ── */}
        <div className={hasPriceStripBand ? priceStripBandClass : undefined}>

          {/* Issue 4: own discount badge */}
          {showOwnDiscount && (
            <div className="mb-2 inline-flex items-center gap-1.5 rounded bg-[color:var(--color-sage-deep)] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-white">
              Popust &minus;{ownDiscount.pct}%
            </div>
          )}

          {/* Issue 3a: kicker for package products (no discount state) */}
          {!showOwnDiscount && displayMinQty !== undefined && displayMinQty > 1 && (
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-sage-deep)] mb-1">
              Cena po renderu
            </p>
          )}

          {/* Package price line */}
          <p className="text-base text-muted-foreground">
            {showOwnDiscount ? (
              <>
                <span className="line-through text-muted-foreground/60 mr-2">
                  {formatPublicPrice(originalPackage, displayCurrency, pricingSettings)}
                </span>
                <span className="text-foreground font-medium">
                  {formatPublicPrice(discountedPackage!, displayCurrency, pricingSettings)}
                </span>
                {" / paket"}
              </>
            ) : (
              <>
                {formatPublicPrice(originalPackage, displayCurrency, pricingSettings)}
                {" / paket"}
              </>
            )}
          </p>

          {/* Hero per-unit figure */}
          {product.displayPerUnitRsd !== undefined ? (
            <>
              <p className="text-5xl font-bold text-foreground leading-none mt-1">
                {showOwnDiscount ? (
                  <>
                    <span className="line-through text-2xl text-muted-foreground/50 mr-2 font-medium">
                      {formatPublicPrice(originalPerUnit, displayCurrency, pricingSettings)}
                    </span>
                    {formatPublicPrice(discountedPerUnit!, displayCurrency, pricingSettings)}
                  </>
                ) : (
                  <>od {formatPublicPrice(originalPerUnit, displayCurrency, pricingSettings)}</>
                )}
              </p>
              <p className="text-lg text-muted-foreground mt-1">
                / {formattedDisplayUnitLabel}
              </p>
            </>
          ) : (
            <p className="text-5xl font-bold text-foreground leading-none mt-1">
              {showOwnDiscount ? (
                <>
                  <span className="line-through text-2xl text-muted-foreground/50 mr-2 font-medium">
                    {formatPublicPrice(originalPackage, displayCurrency, pricingSettings)}
                  </span>
                  {formatPublicPrice(discountedPackage!, displayCurrency, pricingSettings)}
                </>
              ) : (
                <>od {formatPublicPrice(originalPackage, displayCurrency, pricingSettings)}</>
              )}
            </p>
          )}

          {/* Issue 4: discount reason line */}
          {showOwnDiscount && (
            <p className="mt-2 text-xs italic text-[color:var(--color-sage-deep)]">
              {ownDiscount.reason}
            </p>
          )}

          {/* Package note — always visible (honesty anchor) */}
          {displayPackageNote && (
            <p className="text-xs text-muted-foreground italic mt-3">
              {formatPublicPriceText(
                displayPackageNote,
                displayCurrency,
                pricingSettings,
              )}
            </p>
          )}

          {/* Issue 3a: "U paketu od X" annotation — only when no own discount showing */}
          {!showOwnDiscount && displayMinQty !== undefined && displayMinQty > 1 && (
            <p className="text-xs text-[color:var(--color-sage-deep)] mt-1.5">
              U paketu od {displayMinQty} {pluralizeUnit(formattedDisplayUnitLabel ?? "", displayMinQty)}
            </p>
          )}
        </div>

        {/* CTA */}
        <div className="mt-4">
          {primaryCta}
        </div>
      </div>
    </div>
  );
}
