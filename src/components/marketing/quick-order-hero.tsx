/**
 * QuickOrderHero — Home page hero with a focused expert-service quick estimate.
 * The selected service/variant is carried into /cene so the configurator can
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
      fromPriceText: `od ${priceText(selectedService.variants[0].priceLabel)}`,
      priceContext: selectedService.priceContext
        ? priceText(selectedService.priceContext)
        : undefined,
      kicker: "Jasne cene · Plaćate samo ono što Vam je potrebno",
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
  const expertDetailsHref = `/usluge/${selectedService.slug}`;
  const featuredAiTool = AI_EDIT_TYPES[0];

  return (
    <section
      id="naruci"
      className="relative pt-20 pb-10 md:pt-28 md:pb-16 lg:pb-20"
    >
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-4 sm:px-6 lg:px-8">
        {/* Grid with explicit xl placement so mobile source order (managed via
            `order-*`) differs from desktop layout. Mobile flow:
              1. Hero header  2. Minimalni ulaz  3. Brza procena (panel)
              4. Izabrana usluga  5. Trust signals
            Desktop: 2 columns; left col stacks Hero → Minimalni → Izabrana →
            Trust, right col is the sticky panel spanning all rows. */}
        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,440px)]">
          {/* Hero header: pill + title + description */}
          <div className="order-1 space-y-5 xl:col-start-1 xl:row-start-1">
            <span className="inline-flex rounded-full border border-border bg-secondary/70 px-4 py-2 text-[0.7rem] font-bold uppercase tracking-[0.22em] text-muted-foreground sm:tracking-[0.28em]">
              {view.kicker}
            </span>
            <h1 className="text-5xl leading-[0.94] text-foreground sm:text-6xl lg:text-7xl xl:text-[5.2rem]">
              Lep prikaz. Jasna cena.{" "}
              <span className="text-accent">Lakša odluka.</span>
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
              {SITE.description}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href={expertCtaHref}
                className={cn(
                  buttonVariants({ variant: "accent", size: "lg" }),
                  "rounded-full",
                )}
              >
                Izračunajte cenu
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <QuickInquiryLink
                variant="outline"
                size="lg"
                className="rounded-full"
                inquiry={{
                  source: "home-hero",
                  sourceLabel: "Homepage hero brief",
                }}
              >
                Pošaljite brief
              </QuickInquiryLink>
            </div>
          </div>

          {/* "Minimalni ulaz za start" — full column width, image > text on desktop */}
          <div className="order-2 grain-soft relative overflow-hidden rounded-3xl border border-border bg-card/80 p-6 shadow-[0_24px_60px_rgba(28,26,25,0.07)] sm:p-8 lg:p-10 xl:col-start-1 xl:row-start-2">
              <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(135deg,rgba(184,131,99,0.1),transparent_55%,rgba(143,154,138,0.1))]"
              />
              <div className="relative grid gap-6 md:grid-cols-[2fr_3fr] md:items-center md:gap-10">
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                    Minimalni ulaz za start
                  </p>
                  <h2 className="mt-3 text-2xl leading-tight text-foreground md:text-3xl">
                    Šta šaljete odmah za{" "}
                    <span className="text-accent">{view.shortName}</span>
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
                    {view.materials}
                  </p>
                  <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5">
                    <view.IconEl className="h-3.5 w-3.5 text-accent" />
                    <span className="text-[0.72rem] font-medium text-foreground">
                      {view.name}
                    </span>
                    <span className="text-[0.72rem] text-muted-foreground">
                      {view.fromPriceText}
                    </span>
                  </div>
                  {view.priceContext && (
                    <p className="mt-3 text-[0.78rem] leading-6 text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        Šta dobijate:
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
                    className="aspect-[4/3] w-full rounded-2xl border border-border bg-secondary md:aspect-[3/2]"
                    autoDemoIntervalMs={HERO_BEFORE_AFTER_DEMO_INTERVAL_MS}
                    demoReplayKey={`${view.beforeAsset}:${view.afterAsset}`}
                  >
                    <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-foreground/55 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-background/95">
                      Pre / posle
                    </span>
                    {view.objectAsset && (
                      <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-center gap-1">
                        <div className="relative h-24 w-24 overflow-hidden rounded-xl border-2 border-background/80 bg-background/40 shadow-[0_8px_24px_rgba(28,26,25,0.35)] md:h-32 md:w-32">
                          <Image
                            src={view.objectAsset}
                            alt="Predmet koji umećemo"
                            fill
                            sizes="(max-width: 768px) 96px, 128px"
                            className="object-cover"
                          />
                        </div>
                        <span className="rounded-full bg-foreground/55 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-background/95">
                          Predmet
                        </span>
                      </div>
                    )}
                  </BeforeAfterReveal>
                ) : view.embedSrc ? (
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-secondary md:aspect-[3/2]">
                    <iframe
                      title={`${view.name} — 360 pregled`}
                      src={view.embedSrc}
                      className="h-full w-full border-0"
                      allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen"
                      loading="lazy"
                    />
                  </div>
                ) : view.asset ? (
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-secondary md:aspect-[3/2]">
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
                  className="rounded-2xl border border-border/70 bg-background/75 p-4 shadow-[0_12px_32px_rgba(28,26,25,0.05)]"
                >
                  <BadgeCheck className="mb-3 h-5 w-5 text-[color:var(--color-sage-deep)]" />
                  <p className="text-sm leading-6 text-muted-foreground">
                    {signal}
                  </p>
                </div>
              ))}
            </div>

          {/* Selected service dark detail card — full column width */}
          <div className="order-4 overflow-hidden rounded-3xl border border-foreground/10 bg-foreground p-6 text-background shadow-[0_30px_80px_rgba(28,26,25,0.22)] sm:p-8 lg:p-10 xl:col-start-1 xl:row-start-3">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="lg:max-w-2xl">
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-background/65">
                    Izabrana usluga
                  </p>
                  <h2 className="mt-2 text-3xl text-background md:text-4xl">
                    {view.name}
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-background/72 md:text-base">
                    {view.description}
                  </p>
                </div>
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-background/15 bg-background/5">
                  <view.IconEl className="h-6 w-6 text-background" />
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-background/10 bg-background/5 p-4">
                  <p className="text-[0.64rem] uppercase tracking-[0.22em] text-background/65">
                    Početna cena
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-background">
                    {priceText(selectedService.variants[0].priceLabel)}
                  </p>
                </div>
                <div className="rounded-2xl border border-background/10 bg-background/5 p-4">
                  <p className="text-[0.64rem] uppercase tracking-[0.22em] text-background/65">
                    Obračun
                  </p>
                  <p className="mt-2 text-sm leading-6 text-background/85">
                    {priceText(selectedVariant.unitLabel)}
                  </p>
                </div>
                <div className="rounded-2xl border border-background/10 bg-background/5 p-4">
                  <p className="text-[0.64rem] uppercase tracking-[0.22em] text-background/65">
                    Revizije
                  </p>
                  <p className="mt-2 text-sm leading-6 text-background/85">
                    3 runde uključene
                  </p>
                </div>
              </div>
            </div>

          {/* Quick Order Panel — mobile order-3 (between Minimalni and Izabrana);
              desktop col 2, rowspan all so it pins as a single sticky panel */}
          <aside className="order-3 relative overflow-hidden rounded-3xl border border-border bg-card/95 p-5 shadow-[0_30px_80px_rgba(28,26,25,0.12)] sm:p-6 xl:col-start-2 xl:row-start-1 xl:row-span-4 xl:sticky xl:top-24 xl:self-start">
            <div className="space-y-5">
              <div>
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                  Brza procena
                </p>
                <h2 className="mt-2 text-2xl leading-tight text-foreground">
                  Izaberite uslugu, vidite šta dobijate i koliko košta.
                </h2>
              </div>

              <p className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3 text-sm leading-6 text-muted-foreground">
                Primarni tok je ekspertska izrada: ručni render, jasna početna
                cena i uključene revizije. AI Studio je izdvojen niže kao brza
                obrada postojeće fotografije.
              </p>

              {/* SERVICE PICKER */}
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                    1. Izaberite uslugu
                    <span className="ml-1.5 text-muted-foreground/60">
                      · {SERVICES.length}
                    </span>
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={scrollServicesUp}
                      aria-label="Skroluj naviše"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background/60 text-foreground/70 transition hover:bg-muted hover:text-foreground"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={scrollServicesDown}
                      aria-label="Skroluj naniže"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background/60 text-foreground/70 transition hover:bg-muted hover:text-foreground"
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
                    {SERVICES.map((service) => {
                      const isActive = service.slug === selectedService.slug;
                      const ServiceIconEl = ICON_MAP[service.icon];
                      return (
                        <button
                          key={service.slug}
                          type="button"
                          onClick={() => handleServiceChange(service.slug)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition",
                            isActive
                              ? "border-accent bg-accent/10 shadow-[0_12px_26px_rgba(184,131,99,0.14)]"
                              : "border-border bg-background/60 hover:border-[color:var(--color-border-warm)] hover:bg-background",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border",
                              isActive
                                ? "border-accent/40 bg-accent/15 text-accent"
                                : "border-border bg-card text-foreground",
                            )}
                          >
                            <ServiceIconEl className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[0.82rem] font-semibold leading-tight text-foreground">
                              {service.shortName}
                            </p>
                            <p className="mt-0.5 text-[0.7rem] font-semibold text-[color:var(--color-clay-deep)]">
                              od {priceText(service.variants[0].priceLabel)}
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
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-10 rounded-b-xl bg-gradient-to-t from-card via-card/85 to-transparent"
                  />
                </div>
              </div>

              {/* STEP 2 — variants */}
              <div>
                <p className="mb-2.5 text-[0.7rem] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                  2. Način obračuna
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
                          "w-full rounded-xl border px-3 py-2.5 text-left transition",
                          isActive
                            ? "border-[color:var(--color-sage-deep)] bg-[color:var(--color-sage)]/15 shadow-[0_12px_26px_rgba(111,128,106,0.12)]"
                            : "border-border bg-background/70 hover:bg-background",
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
                            <p className="text-[0.82rem] font-semibold text-[color:var(--color-clay-deep)]">
                              {priceText(variant.priceLabel)}
                            </p>
                            <p className="mt-0.5 text-[0.72rem] uppercase tracking-[0.14em] text-muted-foreground">
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
              <div className="rounded-2xl border border-foreground/10 bg-foreground p-4 text-background shadow-[0_24px_60px_rgba(28,26,25,0.22)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.72rem] uppercase tracking-[0.22em] text-background/65">
                      Pregled porudžbine
                    </p>
                    <h3 className="mt-1 truncate text-lg text-background">
                      {selectedVariant.title}
                    </h3>
                  </div>
                  <Calculator className="h-4 w-4 flex-shrink-0 text-background/60" />
                </div>

                <div className="mt-3 rounded-xl border border-background/10 bg-background/5 p-3">
                  <p className="text-[0.62rem] uppercase tracking-[0.2em] text-background/65">
                    Osnovna cena
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-background">
                    {priceText(selectedVariant.priceLabel)}
                  </p>
                  <p className="mt-1 text-[0.68rem] leading-5 text-background/70">
                    {priceText(selectedVariant.unitLabel)}
                  </p>
                </div>

                <div className="mt-3 text-[0.72rem] leading-5 text-background/80">
                  <p className="font-semibold text-background">
                    Šta dobijate u ovoj ceni:
                  </p>
                  <p className="mt-1 line-clamp-2 text-background/72">
                    {priceText(selectedVariant.included)}
                  </p>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Link
                    href={expertCtaHref}
                    className={cn(
                      buttonVariants({ variant: "accent", size: "sm" }),
                      "rounded-full",
                    )}
                  >
                    Izračunajte cenu
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                  <Link
                    href={expertDetailsHref}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "rounded-full border-background/20 bg-transparent text-background hover:bg-background/10 hover:text-background",
                    )}
                  >
                    Saznajte više
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  Brza obrada fotografije
                </p>
                <h3 className="mt-2 text-base font-semibold text-foreground">
                  AI Studio je za postojeće slike, ne za pun render projekat.
                </h3>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Ako već imate fotografiju i treba Vam čišćenje, staging,
                  promena stila ili renovacija kadra, krenite od{" "}
                  <span className="font-semibold text-foreground">
                    {featuredAiTool.shortLabel.toLowerCase()}
                  </span>
                  .
                </p>
                <Link
                  href="/ai-studio"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
                >
                  Pogledajte AI alate
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
