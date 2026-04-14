/**
 * QuickOrderHero — Home page hero section with a vertical service picker,
 * variant selector, order summary card, and "minimalni ulaz" material preview.
 *
 * Used on: / (home page).
 */
"use client";

import { useMemo, useRef, useState } from "react";
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
import { SERVICES, type ServiceIcon } from "@/lib/catalog/services";
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

export function QuickOrderHero() {
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

  const SelectedIcon = ICON_MAP[selectedService.icon];

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

  return (
    <section id="naruci" className="relative py-10 md:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,440px)]">
          {/* ───────────── LEFT COLUMN ───────────── */}
          <div className="space-y-8">
            {/* Hero header: pill + title + description */}
            <div className="space-y-5">
              <span className="inline-flex rounded-full border border-border bg-secondary/70 px-4 py-2 text-[0.7rem] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                Transaction-first · Model-first pricing
              </span>
              <h1 className="text-5xl leading-[0.92] tracking-[-0.02em] text-foreground sm:text-6xl lg:text-7xl xl:text-[5.2rem]">
                Lep prikaz. Jasna cena.{" "}
                <span className="text-accent">Lakša odluka.</span>
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
                {SITE.description}
              </p>
            </div>

            {/* "Minimalni ulaz za start" — full column width, image > text on desktop */}
            <div className="grain-soft relative overflow-hidden rounded-3xl border border-border bg-card/80 p-6 shadow-[0_24px_60px_rgba(28,26,25,0.07)] sm:p-8 lg:p-10">
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
                    <span className="text-accent">
                      {selectedService.shortName.toLowerCase()}
                    </span>
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
                    {selectedService.materials}
                  </p>
                  <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5">
                    <SelectedIcon className="h-3.5 w-3.5 text-accent" />
                    <span className="text-[0.72rem] font-medium text-foreground">
                      {selectedService.name}
                    </span>
                    <span className="text-[0.65rem] text-muted-foreground">
                      od {selectedService.variants[0].priceLabel}
                    </span>
                  </div>
                </div>
                {selectedService.asset && (
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-secondary md:aspect-[3/2]">
                    <Image
                      src={selectedService.asset}
                      alt={selectedService.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 55vw"
                      className="object-cover"
                      priority={false}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Trust signals — 3 col on desktop, 1 col on mobile */}
            <div className="grid gap-4 md:grid-cols-3">
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
            <div className="overflow-hidden rounded-3xl border border-foreground/10 bg-foreground p-6 text-background shadow-[0_30px_80px_rgba(28,26,25,0.22)] sm:p-8 lg:p-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="lg:max-w-2xl">
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-background/65">
                    Izabrana usluga
                  </p>
                  <h2 className="mt-2 text-3xl text-background md:text-4xl">
                    {selectedService.name}
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-background/72 md:text-base">
                    {selectedService.philosophy}
                  </p>
                </div>
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-background/15 bg-background/5">
                  <SelectedIcon className="h-6 w-6 text-background" />
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-background/10 bg-background/5 p-4">
                  <p className="text-[0.64rem] uppercase tracking-[0.22em] text-background/65">
                    Javni start
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-background">
                    {selectedService.variants[0].priceLabel}
                  </p>
                </div>
                <div className="rounded-2xl border border-background/10 bg-background/5 p-4">
                  <p className="text-[0.64rem] uppercase tracking-[0.22em] text-background/65">
                    Obračun
                  </p>
                  <p className="mt-2 text-sm leading-6 text-background/85">
                    {selectedVariant.unitLabel}
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
          </div>

          {/* ───────────── RIGHT COLUMN — Quick Order Panel (sticky on xl) ───────────── */}
          <aside className="relative overflow-hidden rounded-3xl border border-border bg-card/95 p-5 shadow-[0_30px_80px_rgba(28,26,25,0.12)] sm:p-6 xl:sticky xl:top-24 xl:self-start">
            <div className="space-y-5">
              <div>
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                  Quick order panel
                </p>
                <h2 className="mt-2 text-2xl leading-tight text-foreground">
                  Izaberi uslugu i odmah vidi cenu.
                </h2>
              </div>

              {/* SERVICE PICKER — vertical scrollable list, all 11 services */}
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                    1. Usluga
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
                            <p className="mt-0.5 truncate text-[0.65rem] text-muted-foreground">
                              od {service.variants[0].priceLabel}
                            </p>
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

              {/* VARIANT PICKER */}
              <div>
                <p className="mb-2.5 text-[0.7rem] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                  2. Obračun iz cenovnika
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
                              {variant.description}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-[0.82rem] font-semibold text-[color:var(--color-clay-deep)]">
                              {variant.priceLabel}
                            </p>
                            <p className="mt-0.5 text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">
                              {variant.unitLabel}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ORDER SUMMARY — compact */}
              <div className="rounded-2xl border border-foreground/10 bg-foreground p-4 text-background shadow-[0_24px_60px_rgba(28,26,25,0.22)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.65rem] uppercase tracking-[0.22em] text-background/65">
                      Order summary
                    </p>
                    <h3 className="mt-1 truncate text-lg text-background">
                      {selectedVariant.title}
                    </h3>
                  </div>
                  <Calculator className="h-4 w-4 flex-shrink-0 text-background/60" />
                </div>

                <div className="mt-3 rounded-xl border border-background/10 bg-background/5 p-3">
                  <p className="text-[0.62rem] uppercase tracking-[0.2em] text-background/65">
                    Bazna javna cena
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-background">
                    {selectedVariant.priceLabel}
                  </p>
                  <p className="mt-1 text-[0.68rem] leading-5 text-background/70">
                    {selectedVariant.unitLabel}
                  </p>
                </div>

                <div className="mt-3 text-[0.72rem] leading-5 text-background/80">
                  <p className="font-semibold text-background">Uključeno</p>
                  <p className="mt-1 line-clamp-2 text-background/72">
                    {selectedVariant.included}
                  </p>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Link
                    href="/kontakt"
                    className={cn(
                      buttonVariants({ variant: "accent", size: "sm" }),
                      "rounded-full",
                    )}
                  >
                    Kreni
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                  <Link
                    href={`/usluge/${selectedService.slug}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "rounded-full border-background/20 bg-transparent text-background hover:bg-background/10 hover:text-background",
                    )}
                  >
                    Detalji
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
