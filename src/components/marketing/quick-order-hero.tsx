"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  Camera,
  Check,
  ChevronRight,
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
  getFeaturedServices,
  type ServiceIcon,
} from "@/lib/catalog/services";
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

export function QuickOrderHero() {
  const services = useMemo(() => getFeaturedServices(), []);
  const [selectedServiceSlug, setSelectedServiceSlug] = useState<string>(
    services[0].slug,
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    services[0].variants[0].id,
  );

  const selectedService = useMemo(
    () => services.find((s) => s.slug === selectedServiceSlug) ?? services[0],
    [selectedServiceSlug, services],
  );

  const selectedVariant = useMemo(
    () =>
      selectedService.variants.find((v) => v.id === selectedVariantId) ??
      selectedService.variants[0],
    [selectedService, selectedVariantId],
  );

  const SelectedIcon = ICON_MAP[selectedService.icon];

  const handleServiceChange = (slug: string) => {
    const service = services.find((s) => s.slug === slug);
    if (!service) return;
    setSelectedServiceSlug(slug);
    setSelectedVariantId(service.variants[0].id);
  };

  return (
    <section id="naruci" className="relative py-10 md:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,460px)]">
          {/* LEFT — Hero card */}
          <div className="grain-soft relative overflow-hidden rounded-3xl border border-border/60 bg-card/75 p-6 shadow-[0_30px_80px_rgba(28,26,25,0.08)] sm:p-8 lg:p-10">
            <div className="relative z-10 space-y-8">
              <div className="space-y-5">
                <span className="inline-flex rounded-full border border-border bg-secondary/70 px-4 py-2 text-[0.7rem] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                  Transaction-first · Model-first pricing
                </span>
                <h1 className="max-w-4xl text-5xl leading-[0.92] tracking-[-0.02em] text-foreground sm:text-6xl lg:text-7xl">
                  Lep prikaz. Jasna cena.{" "}
                  <span className="text-accent">Lakša odluka.</span>
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                  {SITE.description}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {TRUST_SIGNALS.map((signal) => (
                  <div
                    key={signal}
                    className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-[0_16px_40px_rgba(28,26,25,0.05)]"
                  >
                    <BadgeCheck className="mb-3 h-5 w-5 text-[color:var(--color-sage-deep)]" />
                    <p className="text-sm leading-6 text-muted-foreground">
                      {signal}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                {/* Dark coal card — selected service summary */}
                <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-foreground p-5 text-background shadow-[0_24px_60px_rgba(28,26,25,0.18)]">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.7rem] uppercase tracking-[0.28em] text-background/50">
                        Izabrana usluga
                      </p>
                      <h2 className="mt-2 text-2xl text-background">
                        {selectedService.name}
                      </h2>
                    </div>
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-background/15 bg-background/5">
                      <SelectedIcon className="h-5 w-5 text-background" />
                    </div>
                  </div>

                  <p className="max-w-xl text-sm leading-6 text-background/70">
                    {selectedService.philosophy}
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-background/10 bg-background/5 p-4">
                      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-background/45">
                        Javni start
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-background">
                        {selectedService.variants[0].priceLabel}
                      </p>
                    </div>
                    <div className="rounded-xl border border-background/10 bg-background/5 p-4">
                      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-background/45">
                        Obračun
                      </p>
                      <p className="mt-2 text-sm leading-6 text-background/85">
                        {selectedVariant.unitLabel}
                      </p>
                    </div>
                    <div className="rounded-xl border border-background/10 bg-background/5 p-4">
                      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-background/45">
                        Revizije
                      </p>
                      <p className="mt-2 text-sm leading-6 text-background/85">
                        3 runde uključene
                      </p>
                    </div>
                  </div>
                </div>

                {/* Warm card — materials + asset image */}
                <div className="relative overflow-hidden rounded-2xl border border-border bg-background/85 p-5 shadow-[0_22px_50px_rgba(28,26,25,0.07)]">
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[linear-gradient(135deg,rgba(184,131,99,0.1),transparent_55%,rgba(143,154,138,0.1))]"
                  />
                  <div className="relative space-y-4">
                    <p className="text-[0.7rem] uppercase tracking-[0.28em] text-muted-foreground">
                      Minimalni ulaz za start
                    </p>
                    <h3 className="text-2xl text-foreground">
                      Šta šaljete odmah
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {selectedService.materials}
                    </p>
                    {selectedService.asset && (
                      <div className="relative h-48 w-full overflow-hidden rounded-xl border border-border bg-secondary">
                        <Image
                          src={selectedService.asset}
                          alt={selectedService.name}
                          fill
                          sizes="(max-width: 1024px) 100vw, 40vw"
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Quick Order Panel */}
          <aside className="relative overflow-hidden rounded-3xl border border-border bg-card/95 p-5 shadow-[0_30px_80px_rgba(28,26,25,0.12)] sm:p-6">
            <div className="space-y-6">
              <div>
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                  Quick order panel
                </p>
                <h2 className="mt-3 text-3xl leading-tight text-foreground">
                  Izaberi uslugu i odmah vidi tačnu logiku cene.
                </h2>
              </div>

              {/* Service picker */}
              <div className="space-y-3">
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                  1. Usluga
                </p>
                <div className="grid gap-2">
                  {services.map((service) => {
                    const isActive = service.slug === selectedService.slug;
                    const ServiceIconEl = ICON_MAP[service.icon];
                    return (
                      <button
                        key={service.slug}
                        type="button"
                        onClick={() => handleServiceChange(service.slug)}
                        className={cn(
                          "group flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition",
                          isActive
                            ? "border-accent bg-accent/10 shadow-[0_16px_35px_rgba(184,131,99,0.12)]"
                            : "border-border bg-background/60 hover:border-[color:var(--color-border-warm)] hover:bg-background",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground">
                            <ServiceIconEl className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {service.shortName}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              od {service.variants[0].priceLabel}
                            </p>
                          </div>
                        </div>
                        <ChevronRight
                          className={cn(
                            "mt-1 h-4 w-4 flex-shrink-0 transition",
                            isActive
                              ? "text-[color:var(--color-clay-deep)]"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Variant picker */}
              <div className="space-y-3">
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                  2. Obračun iz cenovnika
                </p>
                <div className="grid gap-2">
                  {selectedService.variants.map((variant) => {
                    const isActive = variant.id === selectedVariant.id;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariantId(variant.id)}
                        className={cn(
                          "rounded-xl border p-4 text-left transition",
                          isActive
                            ? "border-[color:var(--color-sage-deep)] bg-[color:var(--color-sage)]/15 shadow-[0_16px_35px_rgba(111,128,106,0.12)]"
                            : "border-border bg-background/70 hover:border-[color:var(--color-border-warm)] hover:bg-background",
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {variant.title}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              {variant.description}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-sm font-semibold text-[color:var(--color-clay-deep)]">
                              {variant.priceLabel}
                            </p>
                            <p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                              {variant.unitLabel}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Order summary (dark coal card) */}
              <div className="rounded-2xl border border-foreground/10 bg-foreground p-5 text-background shadow-[0_24px_60px_rgba(28,26,25,0.2)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.7rem] uppercase tracking-[0.25em] text-background/45">
                      Order summary
                    </p>
                    <h3 className="mt-2 text-2xl text-background">
                      {selectedVariant.title}
                    </h3>
                  </div>
                  <Calculator className="h-5 w-5 flex-shrink-0 text-background/65" />
                </div>

                <div className="mt-5 rounded-xl border border-background/10 bg-background/5 p-4">
                  <p className="text-[0.7rem] uppercase tracking-[0.24em] text-background/45">
                    Bazna javna cena
                  </p>
                  <p className="mt-2 text-4xl font-semibold text-background">
                    {selectedVariant.priceLabel}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-background/70">
                    {selectedVariant.unitLabel}
                  </p>
                </div>

                <div className="mt-4 space-y-3 text-sm leading-6 text-background/80">
                  <div>
                    <p className="font-semibold text-background">
                      Šta je uključeno
                    </p>
                    <p className="mt-1">{selectedVariant.included}</p>
                  </div>
                  {selectedVariant.note && (
                    <div className="rounded-lg border border-background/10 bg-background/5 p-3 text-background/70">
                      {selectedVariant.note}
                    </div>
                  )}
                </div>

                <div className="mt-5 space-y-2">
                  <p className="text-[0.65rem] uppercase tracking-[0.2em] text-background/45">
                    Doplate iz cenovnika
                  </p>
                  {selectedVariant.addOns.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-lg border border-background/10 bg-background/5 px-3 py-2.5"
                    >
                      <Check className="mt-1 h-4 w-4 flex-shrink-0 text-[color:var(--color-sand)]" />
                      <p className="text-sm leading-6 text-background/80">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/kontakt"
                    className={cn(
                      buttonVariants({ variant: "accent", size: "lg" }),
                      "rounded-full",
                    )}
                  >
                    Nastavi ka narudžbini
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link
                    href={`/usluge/${selectedService.slug}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "rounded-full border-background/20 bg-transparent text-background hover:bg-background/10 hover:text-background",
                    )}
                  >
                    Detalji usluge
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
