/**
 * QuickOrderHero — Home page hero with a focused expert-service quick estimate.
 * The selected service/variant is carried into /tarifs so the configurator can
 * open with the matching quote item already added.
 *
 * Used on: / (home page).
 */
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Eraser,
  FileImage,
  Home,
  Images,
  Layers,
  LayoutGrid,
  RefreshCcw,
  Sparkles,
  Sun,
  Trees,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  usePublicCurrency,
  usePublicPricingSettings,
} from "@/components/site/public-currency-provider";
import {
  SERVICES,
  buildServiceImageAlt,
  type ServiceIcon,
} from "@/lib/catalog/services";
import { buildConfiguratorHref } from "@/lib/catalog/configurator-href";
import { AI_EDIT_TYPES } from "@/lib/ai-studio/catalog";
import { formatPublicPriceText } from "@/lib/catalog/display-currency";
import { BeforeAfterReveal } from "@/components/marketing/before-after-reveal";
import { QuickInquiryLink } from "@/components/inquiry/quick-inquiry-link";
import { SITE, TRUST_SIGNALS } from "@/lib/content/site";

const ICON_MAP: Record<ServiceIcon, LucideIcon> = {
  home: Home,
  grid: LayoutGrid,
  sparkles: Sparkles,
  refresh: RefreshCcw,
  "file-image": FileImage,
  images: Images,
  layers: Layers,
  tree: Trees,
  camera: Camera,
  sun: Sun,
  eraser: Eraser,
};

/** How far the up/down chevrons scroll the services list per click (px). */
const SCROLL_STEP_PX = 220;

const HERO_BEFORE_AFTER_DEMO_INTERVAL_MS = 10_000;

// Quick-order picker list — de-duplicated by display name, keeping the first
// occurrence. A master service and its dedicated split can share a name (e.g.
// the "interior-renders" master and the "interior-render" split share one
// display name); without this they'd appear twice in the picker.
const PICKER_SERVICES = SERVICES.filter(
  (service, index) =>
    SERVICES.findIndex((other) => other.name === service.name) === index,
);

export function QuickOrderHero() {
  const displayCurrency = usePublicCurrency();
  const pricingSettings = usePublicPricingSettings();
  const [selectedServiceSlug, setSelectedServiceSlug] = useState<string>(
    SERVICES[0].slug,
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    SERVICES[0].variants[0].id,
  );

  const servicesScrollRef = useRef<HTMLDivElement>(null);

  const selectedService = useMemo(
    () => SERVICES.find((s) => s.slug === selectedServiceSlug) ?? SERVICES[0],
    [selectedServiceSlug],
  );

  const selectedVariant = useMemo(
    () =>
      selectedService.variants.find((v) => v.id === selectedVariantId) ??
      selectedService.variants[0],
    [selectedService, selectedVariantId],
  );

  const priceText = useCallback(
    (text: string) =>
      formatPublicPriceText(text, displayCurrency, pricingSettings),
    [displayCurrency, pricingSettings],
  );

  /** Unified view object — drives the left column + order summary header. */
  const view = useMemo(
    () =>
      ({
      name: selectedService.name,
      shortName: selectedService.shortName.toLowerCase(),
      description: selectedService.philosophy,
      materials: selectedService.materials,
      asset: selectedService.asset,
      beforeAsset: selectedService.beforeAsset,
      afterAsset: selectedService.afterAsset,
      objectAsset: undefined as string | undefined,
      embedSrc: selectedService.embedSrc,
      imageAlt: buildServiceImageAlt(selectedService, "hero"),
      beforeAlt: buildServiceImageAlt(selectedService, "before"),
      afterAlt: buildServiceImageAlt(selectedService, "after"),
      IconEl: ICON_MAP[selectedService.icon],
      fromPriceText: `dès ${priceText(selectedService.variants[0].priceLabel)}`,
      priceContext: selectedService.priceContext
        ? priceText(selectedService.priceContext)
        : undefined,
      kicker: "Visualisation architecturale · partout en France",
    }) as const,
    [selectedService, priceText],
  );

  const handleServiceChange = (slug: string) => {
    const service = SERVICES.find((s) => s.slug === slug);
    if (!service) return;
    setSelectedServiceSlug(slug);
    setSelectedVariantId(service.variants[0].id);
  };

  const scrollServicesUp = () => {
    servicesScrollRef.current?.scrollBy({
      top: -SCROLL_STEP_PX,
      behavior: "smooth",
    });
  };

  const scrollServicesDown = () => {
    servicesScrollRef.current?.scrollBy({
      top: SCROLL_STEP_PX,
      behavior: "smooth",
    });
  };

  const expertCtaHref = buildConfiguratorHref(
    selectedVariant.id,
    selectedService.category,
  );
  const expertDetailsHref = `/services/${selectedService.slug}`;
  const featuredAiTool = AI_EDIT_TYPES[0];

  return (
    <section
      id="naruci"
      className="relative pt-20 pb-10 md:pt-28 md:pb-16 lg:pb-20"
    >
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-4 sm:px-6 lg:px-8">
        {/* Grid with explicit xl placement so mobile source order (managed via
            `order-*`) differs from desktop layout. Mobile flow:
              1. Hero header  2. Minimum to start  3. Quick estimate (panel)
              4. Selected service  5. Trust signals
            Desktop: 2 columns; left col stacks Hero → Minimum → Selected →
            Trust, right col is the sticky panel spanning all rows. */}
        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,440px)]">
          {/* Hero header: pill + title + description. @container kept for
              layout parity with the .com build; the h1 no longer sizes in
              cqw — it uses a vw clamp (see the comment on the h1). */}
          <div className="@container order-1 space-y-5 xl:col-start-1 xl:row-start-1">
            <span className="inline-flex rounded-full border border-border bg-secondary/70 px-4 py-2 font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {view.kicker}
            </span>
            {/* The French headline can run longer than the English one, so it
                wraps to 1–2 lines instead of forcing a single line. A clamp
                keeps it large but bounded; text-wrap: balance evens the lines. */}
            <h1
              style={{ fontSize: "clamp(1.9rem, 4.6vw, 3.1rem)", textWrap: "balance" }}
              className="leading-[1.08] text-foreground"
            >
              Voyez votre espace avant de décider.
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
              {SITE.description}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href={expertCtaHref}
                className={cn(
                  buttonVariants({ variant: "accent", size: "lg" }),
                  "rounded-[4px]",
                )}
              >
                Voir les tarifs
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <QuickInquiryLink
                variant="outline"
                size="lg"
                className="rounded-[4px]"
                inquiry={{
                  source: "home-hero",
                  sourceLabel: "Homepage hero brief",
                }}
              >
                Envoyer votre espace
              </QuickInquiryLink>
            </div>
          </div>

          {/* "Le minimum pour démarrer" — full column width, image > text on desktop */}
          <div className="order-2 relative overflow-hidden rounded-lg border border-border bg-card p-6 transition-[border-color,box-shadow] duration-200 hover:border-[#d4d4d4] hover:shadow-[0_1px_3px_rgba(17,17,17,0.06)] sm:p-8 lg:p-10 xl:col-start-1 xl:row-start-2">
              <div className="relative grid gap-6 md:grid-cols-[2fr_3fr] md:items-center md:gap-10">
                <div>
                  <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Le minimum pour démarrer
                  </p>
                  <h2 className="mt-3 text-2xl leading-tight text-foreground md:text-3xl">
                    Ce que vous envoyez dès le départ pour{" "}
                    <span>{view.shortName}</span>
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
                    {view.materials}
                  </p>
                  <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
                    <view.IconEl className="h-3.5 w-3.5 text-accent" />
                    <span className="text-[0.72rem] font-medium text-foreground">
                      {view.name}
                    </span>
                    <span className="font-mono text-[0.72rem] text-muted-foreground">
                      {view.fromPriceText}
                    </span>
                  </div>
                  {view.priceContext && (
                    <p className="mt-3 text-[0.78rem] leading-6 text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        Ce que vous recevez :
                      </span>{" "}
                      {view.priceContext}
                    </p>
                  )}
                </div>
                {view.beforeAsset && view.afterAsset ? (
                  <BeforeAfterReveal
                    beforeSrc={view.beforeAsset}
                    afterSrc={view.afterAsset}
                    alt={view.afterAlt}
                    beforeAlt={view.beforeAlt}
                    afterAlt={view.afterAlt}
                    sizes="(max-width: 768px) 100vw, 55vw"
                    className="aspect-[4/3] w-full rounded-none border border-border bg-secondary md:aspect-[3/2]"
                    autoDemoIntervalMs={HERO_BEFORE_AFTER_DEMO_INTERVAL_MS}
                    demoReplayKey={`${view.beforeAsset}:${view.afterAsset}`}
                  >
                    <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-[#0a0a0a]/55 px-2 py-1 font-mono text-[0.6rem] font-medium uppercase tracking-[0.08em] text-white/95">
                      Avant / après
                    </span>
                    {view.objectAsset && (
                      <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-center gap-1">
                        <div className="relative h-24 w-24 overflow-hidden rounded-none border-2 border-white/80 bg-white/40 md:h-32 md:w-32">
                          <Image
                            src={view.objectAsset}
                            alt="L’objet que nous plaçons dans la photo"
                            fill
                            sizes="(max-width: 768px) 96px, 128px"
                            className="object-cover"
                          />
                        </div>
                        <span className="rounded-full bg-[#0a0a0a]/55 px-2 py-0.5 font-mono text-[0.6rem] font-medium uppercase tracking-[0.08em] text-white/95">
                          Objet
                        </span>
                      </div>
                    )}
                  </BeforeAfterReveal>
                ) : view.embedSrc ? (
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-none border border-border bg-secondary md:aspect-[3/2]">
                    <iframe
                      title={`${view.name} — aperçu 360`}
                      src={view.embedSrc}
                      className="h-full w-full border-0"
                      allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen"
                      loading="lazy"
                    />
                  </div>
                ) : view.asset ? (
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-none border border-border bg-secondary md:aspect-[3/2]">
                    <Image
                      src={view.asset}
                      alt={view.imageAlt}
                      fill
                      sizes="(max-width: 768px) 100vw, 55vw"
                      className="object-cover"
                      priority={false}
                    />
                  </div>
                ) : null}
              </div>
            </div>

          {/* Trust signals — 4 col on xl, 2 col on md, 1 col on mobile */}
          <div className="order-5 grid gap-4 md:grid-cols-2 xl:col-start-1 xl:row-start-4 xl:grid-cols-4">
              {TRUST_SIGNALS.map((signal) => (
                <div
                  key={signal}
                  className="rounded-lg border border-border bg-card p-4 transition-[border-color,box-shadow] duration-200 hover:border-[#d4d4d4] hover:shadow-[0_1px_3px_rgba(17,17,17,0.06)]"
                >
                  <BadgeCheck className="mb-3 h-5 w-5 text-muted-foreground" />
                  <p className="text-sm leading-6 text-muted-foreground">
                    {signal}
                  </p>
                </div>
              ))}
            </div>

          {/* Selected service dark detail card — full column width */}
          <div className="order-4 overflow-hidden rounded-lg border border-white/10 bg-[#0a0a0a] p-6 text-white sm:p-8 lg:p-10 xl:col-start-1 xl:row-start-3">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="lg:max-w-2xl">
                  <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-accent">
                    Service sélectionné
                  </p>
                  <h2 className="mt-2 text-3xl text-white md:text-4xl">
                    {view.name}
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-white/72 md:text-base">
                    {view.description}
                  </p>
                </div>
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[4px] border border-white/15 bg-white/5">
                  <view.IconEl className="h-6 w-6 text-white" />
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[4px] border border-white/10 bg-white/5 p-4">
                  <p className="font-mono text-xs uppercase tracking-[0.08em] text-white/65">
                    Prix de départ
                  </p>
                  <p className="mt-2 font-mono text-2xl font-medium tabular-nums text-white">
                    {priceText(selectedService.variants[0].priceLabel)}
                  </p>
                </div>
                <div className="rounded-[4px] border border-white/10 bg-white/5 p-4">
                  <p className="font-mono text-xs uppercase tracking-[0.08em] text-white/65">
                    Modèle tarifaire
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/85">
                    {priceText(selectedVariant.unitLabel)}
                  </p>
                </div>
                <div className="rounded-[4px] border border-white/10 bg-white/5 p-4">
                  <p className="font-mono text-xs uppercase tracking-[0.08em] text-white/65">
                    Révisions
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/85">
                    3 séries incluses
                  </p>
                </div>
              </div>
            </div>

          {/* Quick estimate panel — mobile order-3 (between Minimum-to-start and
              Selected-service); desktop col 2, rowspan all so it pins as a
              single sticky panel */}
          <aside className="order-3 relative overflow-hidden rounded-lg border border-border bg-card p-5 sm:p-6 xl:col-start-2 xl:row-start-1 xl:row-span-4 xl:sticky xl:top-24 xl:self-start">
            <div className="space-y-5">
              <div>
                <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Devis rapide
                </p>
                <h2 className="mt-2 text-2xl leading-tight text-foreground">
                  Choisissez un service, voyez ce que vous recevez et ce que cela coûte.
                </h2>
              </div>

              <p className="rounded-[4px] border border-border bg-secondary px-4 py-3 text-sm leading-6 text-muted-foreground">
                La voie principale est la production experte : un rendu réalisé
                à la main, un prix de départ clair et des révisions incluses.
                AI Studio se trouve plus bas pour des retouches rapides d’une
                photo existante.
              </p>

              {/* SERVICE PICKER */}
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    1. Choisir un service
                    <span className="ml-1.5 text-muted-foreground/60">
                      · {PICKER_SERVICES.length}
                    </span>
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={scrollServicesUp}
                      aria-label="Faire défiler vers le haut"
                      className="flex h-7 w-7 items-center justify-center rounded-[4px] border border-border bg-background/60 text-foreground/70 transition-colors duration-200 hover:bg-muted hover:text-foreground"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={scrollServicesDown}
                      aria-label="Faire défiler vers le bas"
                      className="flex h-7 w-7 items-center justify-center rounded-[4px] border border-border bg-background/60 text-foreground/70 transition-colors duration-200 hover:bg-muted hover:text-foreground"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div
                    ref={servicesScrollRef}
                    className="scrollbar-warm max-h-[264px] space-y-2 overflow-y-auto overscroll-contain pt-1 pr-2 pb-12"
                  >
                    {PICKER_SERVICES.map((service) => {
                      const isActive = service.slug === selectedService.slug;
                      const ServiceIconEl = ICON_MAP[service.icon];
                      return (
                        <button
                          key={service.slug}
                          type="button"
                          onClick={() => handleServiceChange(service.slug)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-[4px] border px-3 py-2.5 text-left transition-colors duration-200",
                            isActive
                              ? "border-accent bg-accent/10"
                              : "border-border bg-background/60 hover:border-[#d4d4d4] hover:bg-background",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border",
                              isActive
                                ? "border-accent/40 bg-accent/15 text-foreground"
                                : "border-border bg-card text-foreground",
                            )}
                          >
                            <ServiceIconEl className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[0.82rem] font-semibold leading-tight text-foreground">
                              {service.shortName}
                            </p>
                            <p className="mt-0.5 font-mono text-[0.7rem] font-medium text-foreground">
                              dès {priceText(service.variants[0].priceLabel)}
                            </p>
                            {service.priceContext && (
                              <p className="mt-0.5 line-clamp-2 text-[0.66rem] leading-4 text-muted-foreground">
                                {priceText(service.priceContext)}
                              </p>
                            )}
                          </div>
                          {isActive && (
                            <Check className="h-3.5 w-3.5 flex-shrink-0 text-accent" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {/* Bottom fade mask — hints that more services exist below the fold */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-10 rounded-b-[4px] bg-gradient-to-t from-card via-card/85 to-transparent"
                  />
                </div>
              </div>

              {/* STEP 2 — variants */}
              <div>
                <p className="mb-2.5 font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  2. Modèle tarifaire
                </p>
                <div className="space-y-2">
                  {selectedService.variants.map((variant) => {
                    const isActive = variant.id === selectedVariant.id;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariantId(variant.id)}
                        className={cn(
                          "w-full rounded-[4px] border px-3 py-2.5 text-left transition-colors duration-200",
                          isActive
                            ? "border-accent bg-accent/10"
                            : "border-border bg-background/70 hover:border-[#d4d4d4] hover:bg-background",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-[0.82rem] font-semibold leading-tight text-foreground">
                              {variant.title}
                            </p>
                            <p className="mt-1 line-clamp-2 text-[0.68rem] leading-4 text-muted-foreground">
                              {priceText(variant.description)}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="font-mono text-[0.82rem] font-medium text-foreground">
                              {priceText(variant.priceLabel)}
                            </p>
                            <p className="mt-0.5 font-mono text-[0.72rem] uppercase tracking-[0.08em] text-muted-foreground">
                              {priceText(variant.unitLabel)}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ORDER SUMMARY — compact expert quote preview */}
              <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-4 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs uppercase tracking-[0.08em] text-white/65">
                      Récapitulatif de commande
                    </p>
                    <h3 className="mt-1 truncate text-lg text-white">
                      {selectedVariant.title}
                    </h3>
                  </div>
                  <Calculator className="h-4 w-4 flex-shrink-0 text-white/60" />
                </div>

                <div className="mt-3 rounded-[4px] border border-white/10 bg-white/5 p-3">
                  <p className="font-mono text-xs uppercase tracking-[0.08em] text-white/65">
                    Prix de base
                  </p>
                  <p className="mt-1 font-mono text-3xl font-medium tabular-nums text-accent">
                    {priceText(selectedVariant.priceLabel)}
                  </p>
                  <p className="mt-1 text-[0.68rem] leading-5 text-white/70">
                    {priceText(selectedVariant.unitLabel)}
                  </p>
                </div>

                <div className="mt-3 text-[0.72rem] leading-5 text-white/80">
                  <p className="font-semibold text-white">
                    Ce que vous recevez pour ce prix :
                  </p>
                  <p className="mt-1 line-clamp-2 text-white/72">
                    {priceText(selectedVariant.included)}
                  </p>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Link
                    href={expertCtaHref}
                    className={cn(
                      buttonVariants({ variant: "accent", size: "sm" }),
                      "rounded-[4px]",
                    )}
                  >
                    Obtenir votre devis
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                  <Link
                    href={expertDetailsHref}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "rounded-[4px] border-white/55 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white",
                    )}
                  >
                    En savoir plus
                  </Link>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-secondary p-4">
                <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Retouche photo rapide
                </p>
                <h3 className="mt-2 text-base font-semibold text-foreground">
                  AI Studio est destiné aux photos existantes, pas à un projet
                  de rendu complet.
                </h3>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Si vous avez déjà une photo et qu’il vous faut un nettoyage,
                  un home staging, un changement de style ou une rénovation
                  virtuelle de la vue, commencez par{" "}
                  <span className="font-semibold text-foreground">
                    {featuredAiTool.shortLabel.toLowerCase()}
                  </span>
                  .
                </p>
                <Link
                  href="/ai-studio"
                  className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.08em] text-foreground hover:underline"
                >
                  Parcourir les outils IA
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
