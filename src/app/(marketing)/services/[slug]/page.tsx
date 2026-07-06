import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ChevronDown,
  Clock,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { QuickInquiryLink } from "@/components/inquiry/quick-inquiry-link";
import { JsonLd } from "@/components/seo/json-ld";
import { BeforeAfterReveal } from "@/components/marketing/before-after-reveal";
import { Panorama360 } from "@/components/marketing/panorama-360";
import {
  CATEGORY_LABELS,
  SERVICES,
  buildServiceImageAlt,
  getServiceBySlug,
  type BenefitIcon,
  type Service,
} from "@/lib/catalog/services";
import { buildConfiguratorHref } from "@/lib/catalog/configurator-href";
import {
  formatPublicPriceText,
  type DisplayCurrency,
} from "@/lib/catalog/display-currency";
import { getPublicDisplayCurrency } from "@/lib/catalog/public-currency-server";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";
import type { PricingSettings } from "@/lib/pricing/catalog";
import { PreFooterCta } from "@/components/site/pre-footer-cta";
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildServiceJsonLd,
  buildWebPageJsonLd,
  createPublicMetadata,
} from "@/lib/seo";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.slug }));
}

/** Auto-play the before/after swipe demo on viewport entry, repeating on this
 *  interval — mirrors the home hero / AI Studio behavior so service-page
 *  sliders hint their interactivity. */
const SERVICE_BEFORE_AFTER_DEMO_INTERVAL_MS = 7000;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};
  return createPublicMetadata({
    title: service.name,
    description: service.description,
    path: `/services/${slug}`,
    image:
      service.detailAsset ??
      service.detailAfterAsset ??
      service.listingAsset ??
      service.asset,
    imageAlt: buildServiceImageAlt(service, "og"),
    keywords: [service.name, service.shortName, CATEGORY_LABELS[service.category]],
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();
  const [displayCurrency, pricingCatalog] = await Promise.all([
    getPublicDisplayCurrency(),
    getPublishedPricingCatalog(),
  ]);
  const pricingSettings = pricingCatalog.settings;

  const ctx: RenderCtx = { service, displayCurrency, pricingSettings };
  const hasLandingContent = Boolean(
    service.problemHeading ||
      service.benefits?.length ||
      service.processSteps?.length ||
      service.portfolioImages?.length ||
      service.faqs?.length,
  );

  return (
    <>
      <JsonLd
        data={[
          buildWebPageJsonLd({
            path: `/services/${service.slug}`,
            name: service.name,
            description: service.description,
          }),
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: service.name, path: `/services/${service.slug}` },
          ]),
          buildServiceJsonLd(service),
          ...(service.faqs && service.faqs.length > 0
            ? [
                buildFaqJsonLd(
                  service.faqs.map((f) => ({
                    question: f.q,
                    answer: formatPublicPriceText(
                      f.a,
                      displayCurrency,
                      pricingSettings,
                    ),
                  })),
                ),
              ]
            : []),
        ]}
      />

      {hasLandingContent ? (
        <LandingTemplate ctx={ctx} />
      ) : (
        <EditorialTemplate ctx={ctx} />
      )}
    </>
  );
}

type RenderCtx = {
  service: Service;
  displayCurrency: DisplayCurrency;
  pricingSettings: PricingSettings;
};

/* -------------------------------------------------------------------------- *
 * Landing template — used when a service has the new landing content fields
 * populated (problem/benefits/process/portfolio/faqs). Full hero, dark CTA.
 * -------------------------------------------------------------------------- */

function LandingTemplate({ ctx }: { ctx: RenderCtx }) {
  const { service } = ctx;

  return (
    <article className="flex flex-col">
      {/* Hero — full-width bg image + coal overlay + content left-aligned. */}
      <section className="relative isolate flex min-h-[78svh] items-end overflow-hidden bg-foreground">
        {service.detailAsset && (
          <Image
            src={service.detailAsset}
            alt={buildServiceImageAlt(service, "hero")}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        )}
        <div
          aria-hidden
          className={
            service.detailAsset
              ? "absolute inset-0 bg-gradient-to-tr from-foreground/85 via-foreground/55 to-foreground/15"
              : "absolute inset-0 bg-[#0a0a0a]"
          }
        />
        <div className="relative mx-auto w-full max-w-[min(96vw,1320px)] px-6 pb-16 pt-32 lg:px-10 lg:pt-40">
          <Link
            href="/services"
            className="inline-flex items-center gap-1 font-mono text-xs font-medium uppercase tracking-[0.08em] text-white/60 transition-colors duration-200 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All services
          </Link>
          <div className="mt-8 max-w-2xl">
            <p className="section-kicker text-white/60">
              {CATEGORY_LABELS[service.category]}
            </p>
            <h1 className="mt-5 font-heading text-5xl leading-[1.02] text-background md:text-6xl lg:text-7xl">
              {service.name}
            </h1>
            <p className="mt-5 max-w-xl font-heading text-2xl italic leading-snug text-background/90 md:text-3xl">
              {service.tagline}
            </p>
            <p className="mt-6 max-w-xl text-base leading-7 text-background/80 md:text-lg">
              {formatPublicPriceText(
                service.description,
                ctx.displayCurrency,
                ctx.pricingSettings,
              )}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <QuickInquiryLink
                size="xl"
                variant="accent"
                inquiry={{
                  source: "service-detail-hero",
                  sourceLabel: `${service.name} — hero`,
                  serviceType: service.name,
                }}
              >
                Send your project
              </QuickInquiryLink>
              <a
                href={
                  service.detailEmbedSrc || service.detailVideoSrc
                    ? "#demo"
                    : "#portfolio"
                }
                className="inline-flex h-12 items-center rounded-[4px] border border-background/40 px-6 text-sm font-medium text-background transition duration-200 hover:border-background hover:bg-background/10"
              >
                {service.detailVideoSrc
                  ? "Watch the animation"
                  : service.detailEmbedSrc
                    ? "Try it live"
                    : "See the portfolio"}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / agitation. */}
      {service.problemHeading && (
        <section className="bg-background py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-[1fr_1.3fr] md:items-center lg:px-10">
            <div>
              <p className="section-kicker">The problem</p>
              <h2 className="mt-4 font-heading text-3xl leading-tight text-foreground md:text-4xl">
                {service.problemHeading}
              </h2>
              {service.problemBody && (
                <p className="mt-5 text-base leading-7 text-muted-foreground">
                  {formatPublicPriceText(
                    service.problemBody,
                    ctx.displayCurrency,
                    ctx.pricingSettings,
                  )}
                </p>
              )}
              {service.problemResolution && (
                <p className="mt-4 text-base leading-7 text-foreground/90">
                  <strong className="font-semibold">
                    {formatPublicPriceText(
                      service.problemResolution,
                      ctx.displayCurrency,
                      ctx.pricingSettings,
                    )}
                  </strong>
                </p>
              )}
            </div>
            <ProblemVisual ctx={ctx} />
          </div>
        </section>
      )}

      {/* Benefits — 3 cards. */}
      {service.benefits && service.benefits.length > 0 && (
        <section className="bg-secondary py-16 md:py-24">
          <div className="mx-auto max-w-5xl px-6 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <p className="section-kicker">Why this service</p>
              <h2 className="mt-4 font-heading text-3xl leading-tight text-foreground md:text-4xl">
                Three reasons clients choose Elegant Render.
              </h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {service.benefits.map((benefit) => (
                <article
                  key={benefit.title}
                  className="rounded-2xl border border-border/70 bg-card/85 p-8"
                >
                  <BenefitIconBadge icon={benefit.icon} />
                  <h3 className="mt-5 font-heading text-xl text-foreground">
                    {benefit.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {formatPublicPriceText(
                      benefit.body,
                      ctx.displayCurrency,
                      ctx.pricingSettings,
                    )}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Interactive demo — Kuula 360 embed or a looping animation video. */}
      {(service.detailEmbedSrc || service.detailVideoSrc) && (
        <section id="demo" className="bg-background py-16 md:py-24">
          <div className="mx-auto max-w-5xl px-6 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <p className="section-kicker">Demo</p>
              <h2 className="mt-4 font-heading text-3xl leading-tight text-foreground md:text-4xl">
                {service.detailVideoSrc
                  ? "See the animation in motion."
                  : "Open the panorama — click and drag to look around."}
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                {service.detailVideoSrc
                  ? "The camera moves through the space and reveals the interior, exterior and context in a single narrative — the same format you receive for brochures and social media."
                  : "The demo shows the exact interaction your buyer will have: rotation in every direction, transitions between viewpoints, and VR mode on supported devices."}
              </p>
            </div>
            <div className="mt-10 aspect-[16/9] overflow-hidden rounded-3xl border border-border/70 bg-secondary">
              {service.detailVideoSrc ? (
                <video
                  src={service.detailVideoSrc}
                  poster={service.detailVideoPoster}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              ) : (
                <iframe
                  title={`${service.name} — interactive demo panorama`}
                  src={service.detailEmbedSrc}
                  className="h-full w-full border-0"
                  allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen"
                  loading="lazy"
                />
              )}
            </div>
            {!service.detailVideoSrc && (
              <p className="mt-4 text-center font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Also opens in VR mode on Meta Quest devices
              </p>
            )}
          </div>
        </section>
      )}

      {/* Pricing — variants as cards + model-first explainer. */}
      <section id="cene" className="bg-background py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-kicker">Pricing</p>
            <h2 className="mt-4 font-heading text-3xl leading-tight text-foreground md:text-4xl">
              {service.pricingLead?.heading ?? "Transparent pricing. No guesswork."}
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {service.pricingLead
                ? formatPublicPriceText(
                    service.pricingLead.body,
                    ctx.displayCurrency,
                    ctx.pricingSettings,
                  )
                : "The base price covers building the 3D model and the first final render. Every additional angle from the same model is dramatically cheaper — because the model is already there."}
            </p>
          </div>
          {service.comparison && (
            <PricingComparison comparison={service.comparison} />
          )}
          <div
            className={[
              "mt-12 grid gap-6",
              service.variants.length +
                (service.crossSellVariants?.length ?? 0) >=
              3
                ? "md:grid-cols-3"
                : service.variants.length +
                      (service.crossSellVariants?.length ?? 0) ===
                    2
                  ? "mx-auto max-w-4xl md:grid-cols-2"
                  : "mx-auto max-w-md",
            ].join(" ")}
          >
            {[
              ...service.variants.map((variant, idx) => ({
                variant,
                featured: idx === 0,
                isCrossSell: false,
              })),
              ...(service.crossSellVariants ?? []).map((variant) => ({
                variant,
                featured: false,
                isCrossSell: true,
              })),
            ].map(({ variant, featured, isCrossSell }) => (
              <PricingCard
                key={variant.id}
                ctx={ctx}
                variant={variant}
                featured={featured}
                isCrossSell={isCrossSell}
              />
            ))}
          </div>
          {/* Model-first explainer postcard. */}
          <aside className="mt-10 rounded-2xl border border-border bg-secondary p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-xl text-foreground">
                  How pricing works
                </h3>
                <p className="mt-2 text-sm leading-7 text-foreground/85">
                  {formatPublicPriceText(
                    service.philosophy,
                    ctx.displayCurrency,
                    ctx.pricingSettings,
                  )}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Process — 4 steps. */}
      {service.processSteps && service.processSteps.length > 0 && (
        <section className="bg-secondary py-16 md:py-24">
          <div className="mx-auto max-w-5xl px-6 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <p className="section-kicker">Process</p>
              <h2 className="mt-4 font-heading text-3xl leading-tight text-foreground md:text-4xl">
                From drawings to final visuals in four steps.
              </h2>
            </div>
            <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {service.processSteps.map((step, idx) => (
                <li
                  key={step.title}
                  className="rounded-2xl border border-border/70 bg-card/85 p-6"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                    {idx + 1}
                  </div>
                  <h3 className="mt-4 font-heading text-lg text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {formatPublicPriceText(
                      step.body,
                      ctx.displayCurrency,
                      ctx.pricingSettings,
                    )}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Portfolio. */}
      {service.portfolioImages && service.portfolioImages.length > 0 && (
        <section id="portfolio" className="bg-background py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-6 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <p className="section-kicker">Portfolio</p>
              <h2 className="mt-4 font-heading text-3xl leading-tight text-foreground md:text-4xl">
                Examples from recently delivered projects.
              </h2>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {service.portfolioImages.map((img) =>
                img.beforeSrc ? (
                  <BeforeAfterReveal
                    key={img.src}
                    beforeSrc={img.beforeSrc}
                    afterSrc={img.src}
                    alt={img.alt}
                    beforeAlt={img.beforeAlt ?? img.alt}
                    afterAlt={img.alt}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="aspect-[16/9] w-full rounded-2xl border border-border/70 bg-secondary"
                  >
                    <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-foreground/55 px-2.5 py-1 font-mono text-[0.65rem] font-medium uppercase tracking-[0.08em] text-background/95">
                      Before / after
                    </span>
                  </BeforeAfterReveal>
                ) : (
                  <figure
                    key={img.src}
                    className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border/70 bg-secondary"
                  >
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </figure>
                ),
              )}
            </div>
          </div>
        </section>
      )}

      {/* FAQ. */}
      {service.faqs && service.faqs.length > 0 && (
        <section id="faq" className="bg-secondary py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-6 lg:px-10">
            <div className="text-center">
              <p className="section-kicker">FAQ</p>
              <h2 className="mt-4 font-heading text-3xl leading-tight text-foreground md:text-4xl">
                The questions that directly shape a buying decision.
              </h2>
            </div>
            <div className="mt-10 divide-y divide-border/70 border-y border-border/70">
              {service.faqs.map((item) => (
                <details
                  key={item.q}
                  className="group py-5 [&[open]_.faq-chevron]:rotate-180"
                >
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left">
                    <span className="font-heading text-lg text-foreground">
                      {item.q}
                    </span>
                    <ChevronDown className="faq-chevron mt-1 h-5 w-5 flex-none text-accent transition-transform" />
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {formatPublicPriceText(
                      item.a,
                      ctx.displayCurrency,
                      ctx.pricingSettings,
                    )}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Dark final CTA. */}
      <section className="bg-foreground py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-10">
          <h2 className="font-heading text-3xl leading-tight text-background md:text-4xl">
            Ready to visualize your project?
          </h2>
          <p className="mt-4 text-base leading-7 text-background/80">
            Send us your drawings and we return a precise estimate no later
            than the next working day.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <QuickInquiryLink
              size="xl"
              variant="accent"
              inquiry={{
                source: "service-detail-final-cta",
                sourceLabel: `${service.name} — final CTA`,
                serviceType: service.name,
              }}
            >
              Send your project
            </QuickInquiryLink>
            <ButtonLink
              href="/pricing"
              size="xl"
              variant="outline"
              className="border-background/40 bg-transparent text-background hover:bg-background/10 hover:text-background"
            >
              See pricing
            </ButtonLink>
          </div>
          <p className="mt-6 font-mono text-xs font-medium uppercase tracking-[0.08em] text-white/60">
            No obligation · Three revision rounds included
          </p>
        </div>
      </section>
    </article>
  );
}

function ProblemVisual({ ctx }: { ctx: RenderCtx }) {
  const { service } = ctx;
  if (service.problemVideoSrc) {
    return (
      <figure className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-border/70 bg-secondary">
        <video
          src={service.problemVideoSrc}
          poster={service.problemVideoPoster}
          autoPlay
          loop
          muted
          playsInline
          controls
          preload="metadata"
          className="h-full w-full object-cover"
        />
      </figure>
    );
  }
  if (service.problemPanoramaSrc) {
    return (
      <figure className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border/70 bg-secondary">
        <Panorama360
          src={service.problemPanoramaSrc}
          title={buildServiceImageAlt(service, "problem")}
        />
        <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-foreground/55 px-2.5 py-1 font-mono text-[0.65rem] font-medium uppercase tracking-[0.08em] text-background/95">
          360°
        </span>
      </figure>
    );
  }
  if (service.problemEmbedSrc) {
    return (
      <figure className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border/70 bg-secondary">
        <iframe
          title={`${service.name} — interactive 360° tour`}
          src={service.problemEmbedSrc}
          className="h-full w-full border-0"
          allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen"
          loading="lazy"
        />
      </figure>
    );
  }
  if (service.problemAsset) {
    return (
      <figure className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border/70 bg-secondary">
        <Image
          src={service.problemAsset}
          alt={buildServiceImageAlt(service, "problem")}
          fill
          sizes="(max-width: 768px) 100vw, 640px"
          className="object-cover"
        />
      </figure>
    );
  }
  if (service.detailBeforeAsset && service.detailAfterAsset) {
    return (
      <BeforeAfterReveal
        beforeSrc={service.detailBeforeAsset}
        afterSrc={service.detailAfterAsset}
        alt={service.detailAfterAlt ?? buildServiceImageAlt(service, "after")}
        beforeAlt={service.detailBeforeAlt ?? buildServiceImageAlt(service, "before")}
        afterAlt={service.detailAfterAlt ?? buildServiceImageAlt(service, "after")}
        sizes="(max-width: 768px) 100vw, 640px"
        autoDemoIntervalMs={SERVICE_BEFORE_AFTER_DEMO_INTERVAL_MS}
        className="aspect-[4/3] w-full rounded-3xl border border-border/70 bg-secondary"
      >
        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-foreground/55 px-2.5 py-1 font-mono text-[0.65rem] font-medium uppercase tracking-[0.08em] text-background/95">
          Before / after
        </span>
      </BeforeAfterReveal>
    );
  }
  if (service.portfolioImages && service.portfolioImages.length > 0) {
    const first = service.portfolioImages[0];
    return (
      <figure className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border/70 bg-secondary">
        <Image
          src={first.src}
          alt={first.alt}
          fill
          sizes="(max-width: 768px) 100vw, 640px"
          className="object-cover"
        />
      </figure>
    );
  }
  if (service.detailAsset) {
    return (
      <figure className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border/70 bg-secondary">
        <Image
          src={service.detailAsset}
          alt={buildServiceImageAlt(service, "detail")}
          fill
          sizes="(max-width: 768px) 100vw, 640px"
          className="object-cover"
        />
      </figure>
    );
  }
  return null;
}

function PricingComparison({
  comparison,
}: {
  comparison: NonNullable<Service["comparison"]>;
}) {
  return (
    <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid grid-cols-3 border-b border-border bg-secondary font-mono text-xs font-medium uppercase tracking-[0.08em]">
        <div className="px-3 py-3 text-muted-foreground sm:px-4">Method</div>
        <div className="px-3 py-3 text-foreground sm:px-4">{comparison.aLabel}</div>
        <div className="px-3 py-3 text-muted-foreground sm:px-4">
          {comparison.bLabel}
        </div>
      </div>
      <div className="divide-y divide-border">
        {comparison.rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-3 text-[0.8rem] leading-5 sm:text-sm sm:leading-6"
          >
            <div className="px-3 py-3 font-medium text-muted-foreground sm:px-4">
              {row.label}
            </div>
            <div className="px-3 py-3 text-foreground sm:px-4">{row.a}</div>
            <div className="px-3 py-3 text-muted-foreground sm:px-4">{row.b}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingCard({
  ctx,
  variant,
  featured,
  isCrossSell = false,
}: {
  ctx: RenderCtx;
  variant: Service["variants"][number];
  featured: boolean;
  isCrossSell?: boolean;
}) {
  return (
    <article
      className={[
        "relative flex flex-col rounded-2xl border bg-card/90 p-6 md:p-7",
        featured ? "border-accent" : "border-border/70",
      ].join(" ")}
    >
      {featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 font-mono text-[0.65rem] font-medium uppercase tracking-[0.08em] text-accent-foreground">
          {ctx.service.variants.length +
            (ctx.service.crossSellVariants?.length ?? 0) >
          1
            ? "Our pick"
            : "Complete service"}
        </span>
      )}
      <h3 className="font-heading text-xl text-foreground">{variant.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {formatPublicPriceText(
          variant.description,
          ctx.displayCurrency,
          ctx.pricingSettings,
        )}
      </p>
      <div className="mt-6">
        <p className="font-heading text-4xl text-foreground md:text-5xl">
          {formatPublicPriceText(
            variant.priceLabel,
            ctx.displayCurrency,
            ctx.pricingSettings,
          )}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatPublicPriceText(
            variant.unitLabel,
            ctx.displayCurrency,
            ctx.pricingSettings,
          )}
        </p>
        {variant.decomposition && (
          <p className="mt-2 text-sm text-muted-foreground">
            {formatPublicPriceText(
              variant.decomposition,
              ctx.displayCurrency,
              ctx.pricingSettings,
            )}
          </p>
        )}
      </div>
      <p className="mt-6 font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        Included in the price
      </p>
      <p className="mt-2 text-sm leading-6 text-foreground/85">
        {formatPublicPriceText(
          variant.included,
          ctx.displayCurrency,
          ctx.pricingSettings,
        )}
      </p>
      {variant.addOns.length > 0 && (
        <>
          <p className="mt-5 font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Add-ons from the price list
          </p>
          <ul className="mt-2 space-y-2">
            {variant.addOns.map((addOn) => (
              <li
                key={addOn}
                className="flex gap-2 text-sm leading-6 text-muted-foreground"
              >
                <Check className="mt-1 h-3.5 w-3.5 flex-none text-accent" />
                <span>
                  {formatPublicPriceText(
                    addOn,
                    ctx.displayCurrency,
                    ctx.pricingSettings,
                  )}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      {variant.note && (
        <p className="mt-5 rounded-lg border border-border/70 bg-secondary/50 p-3 text-xs leading-6 text-muted-foreground">
          {formatPublicPriceText(
            variant.note,
            ctx.displayCurrency,
            ctx.pricingSettings,
          )}
        </p>
      )}
      <div className="mt-auto pt-6">
        {featured || isCrossSell || variant.configuratorCategory ? (
          <ButtonLink
            href={buildConfiguratorHref(
              variant.id,
              variant.configuratorCategory ?? ctx.service.category,
              "service-detail",
            )}
            size="lg"
            variant={featured ? "accent" : "outline"}
            className="w-full justify-center"
          >
            Get your estimate and order
          </ButtonLink>
        ) : (
          <QuickInquiryLink
            size="lg"
            variant="outline"
            className="w-full justify-center"
            inquiry={{
              source: "service-detail-pricing",
              sourceLabel: `${ctx.service.name} — ${variant.title}`,
              serviceType: ctx.service.name,
            }}
          >
            Request an estimate
          </QuickInquiryLink>
        )}
      </div>
    </article>
  );
}

const BENEFIT_ICONS: Record<BenefitIcon, React.ComponentType<{ className?: string }>> = {
  speed: TrendingUp,
  trust: BadgeCheck,
  value: Wallet,
  context: Clock,
};

function BenefitIconBadge({ icon }: { icon?: BenefitIcon }) {
  const Icon = icon ? BENEFIT_ICONS[icon] : BadgeCheck;
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground">
      <Icon className="h-5 w-5" />
    </div>
  );
}

/* -------------------------------------------------------------------------- *
 * Editorial template — fallback for services that don't yet have the new
 * landing fields populated. Matches the prior layout 1:1 to avoid regressions.
 * -------------------------------------------------------------------------- */

function EditorialTemplate({ ctx }: { ctx: RenderCtx }) {
  const { service } = ctx;
  return (
    <>
    <article className="mx-auto w-full max-w-4xl px-6 pb-24 pt-20 md:pt-28">
      <Link
        href="/services"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All services
      </Link>

      {service.detailBeforeAsset && service.detailAfterAsset ? (
        <BeforeAfterReveal
          beforeSrc={service.detailBeforeAsset}
          afterSrc={service.detailAfterAsset}
          alt={service.detailAfterAlt ?? buildServiceImageAlt(service, "after")}
          beforeAlt={service.detailBeforeAlt ?? buildServiceImageAlt(service, "before")}
          afterAlt={service.detailAfterAlt ?? buildServiceImageAlt(service, "after")}
          sizes="(max-width: 768px) 100vw, 896px"
          autoDemoIntervalMs={SERVICE_BEFORE_AFTER_DEMO_INTERVAL_MS}
          className="mt-10 aspect-[16/9] w-full rounded-3xl border border-border bg-secondary"
        >
          <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-foreground/55 px-2.5 py-1 font-mono text-[0.65rem] font-medium uppercase tracking-[0.08em] text-background/95">
            Before / after
          </span>
        </BeforeAfterReveal>
      ) : service.detailEmbedSrc ? (
        <div className="relative mt-10 aspect-[16/9] w-full overflow-hidden rounded-3xl border border-border bg-secondary">
          <iframe
            title={`${service.name} — 360° preview`}
            src={service.detailEmbedSrc}
            className="h-full w-full border-0"
            allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen"
            loading="lazy"
          />
        </div>
      ) : service.detailAsset ? (
        <div className="relative mt-10 aspect-[16/9] w-full overflow-hidden rounded-3xl border border-border bg-secondary">
          <Image
            src={service.detailAsset}
            alt={buildServiceImageAlt(service, "detail")}
            fill
            sizes="(max-width: 768px) 100vw, 896px"
            className="object-cover"
            priority
          />
        </div>
      ) : null}

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Badge variant="secondary">{CATEGORY_LABELS[service.category]}</Badge>
        {service.outsourced && <Badge variant="outline">Partner network</Badge>}
      </div>

      <h1 className="mt-6 text-5xl leading-tight text-foreground md:text-6xl">
        {service.name}
      </h1>
      <p className="mt-4 text-xl leading-relaxed text-muted-foreground">
        {service.tagline}
      </p>

      {service.forSegments && service.forSegments.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Ideal for:
          </span>
          {service.forSegments.map((segment) => (
            <span
              key={segment}
              className="inline-flex items-center rounded-full border border-border bg-background/80 px-3 py-1 text-[0.78rem] text-foreground"
            >
              {segment}
            </span>
          ))}
        </div>
      )}

      <p className="mt-10 text-base leading-7 text-muted-foreground">
        {formatPublicPriceText(
          service.description,
          ctx.displayCurrency,
          ctx.pricingSettings,
        )}
      </p>

      <div className="mt-10 rounded-2xl border border-border/70 bg-secondary/40 p-6 md:p-8">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          How pricing works
        </p>
        <p className="mt-3 text-sm leading-7 text-foreground/85">
          {formatPublicPriceText(
            service.philosophy,
            ctx.displayCurrency,
            ctx.pricingSettings,
          )}
        </p>
      </div>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <InfoBlock
          title="When to use it"
          text={formatPublicPriceText(
            service.highlight,
            ctx.displayCurrency,
            ctx.pricingSettings,
          )}
        />
        <InfoBlock
          title="What to send"
          text={formatPublicPriceText(
            service.materials,
            ctx.displayCurrency,
            ctx.pricingSettings,
          )}
        />
        <InfoBlock
          title="What you receive"
          text={formatPublicPriceText(
            `${service.variants[0].included} Additional scope is priced through the public add-ons from the price list.`,
            ctx.displayCurrency,
            ctx.pricingSettings,
          )}
        />
      </section>

      <section className="mt-14 space-y-6">
        <h2 className="text-2xl text-foreground md:text-3xl">
          Available variants and pricing
        </h2>

        <div className="space-y-4">
          {service.variants.map((variant) => (
            <div
              key={variant.id}
              className="rounded-2xl border border-border/70 bg-card/85 p-6 md:p-8"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <h3 className="text-xl text-foreground md:text-2xl">
                    {variant.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {formatPublicPriceText(
                      variant.description,
                      ctx.displayCurrency,
                      ctx.pricingSettings,
                    )}
                  </p>
                </div>
                <div className="md:text-right">
                  <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Starting price
                  </p>
                  <p className="mt-1 text-3xl text-foreground md:text-4xl">
                    {formatPublicPriceText(
                      variant.priceLabel,
                      ctx.displayCurrency,
                      ctx.pricingSettings,
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatPublicPriceText(
                      variant.unitLabel,
                      ctx.displayCurrency,
                      ctx.pricingSettings,
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    What this price includes
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground/85">
                    {formatPublicPriceText(
                      variant.included,
                      ctx.displayCurrency,
                      ctx.pricingSettings,
                    )}
                  </p>
                </div>

                <div>
                  <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Add-ons from the price list
                  </p>
                  <ul className="mt-2 space-y-2">
                    {variant.addOns.map((addOn) => (
                      <li
                        key={addOn}
                        className="flex gap-2 text-sm leading-6 text-muted-foreground"
                      >
                        <Check className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-accent" />
                        {formatPublicPriceText(
                          addOn,
                          ctx.displayCurrency,
                          ctx.pricingSettings,
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {variant.note && (
                  <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm leading-6 text-muted-foreground">
                    {formatPublicPriceText(
                      variant.note,
                      ctx.displayCurrency,
                      ctx.pricingSettings,
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-14 flex flex-col gap-3 sm:flex-row">
        <QuickInquiryLink
          size="xl"
          variant="accent"
          inquiry={{
            source: "service-detail",
            sourceLabel: service.name,
            serviceType: service.name,
          }}
        >
          Send your project
        </QuickInquiryLink>
        <ButtonLink href="/pricing" size="xl" variant="outline">
          See pricing
        </ButtonLink>
      </div>
    </article>
      <PreFooterCta
        heading={`Ready to order — ${service.name.toLowerCase()}?`}
        body="Open the calculator, set the parameters of your visualization and see the exact price right away."
      />
    </>
  );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/75 p-5">
      <h2 className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-7 text-foreground/80">{text}</p>
    </div>
  );
}
