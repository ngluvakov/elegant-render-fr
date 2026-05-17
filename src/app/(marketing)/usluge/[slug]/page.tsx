import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { QuickInquiryLink } from "@/components/inquiry/quick-inquiry-link";
import { JsonLd } from "@/components/seo/json-ld";
import { BeforeAfterReveal } from "@/components/marketing/before-after-reveal";
import {
  CATEGORY_LABELS,
  SERVICES,
  getServiceBySlug,
} from "@/lib/catalog/services";
import { formatPublicPriceText } from "@/lib/catalog/display-currency";
import { getPublicDisplayCurrency } from "@/lib/catalog/public-currency-server";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";
import {
  buildBreadcrumbJsonLd,
  buildServiceJsonLd,
  buildWebPageJsonLd,
  createPublicMetadata,
} from "@/lib/seo";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.slug }));
}

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
    path: `/usluge/${slug}`,
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

  return (
    <article className="mx-auto w-full max-w-4xl px-6 pb-24 pt-20 md:pt-28">
      <JsonLd
        data={[
          buildWebPageJsonLd({
            path: `/usluge/${service.slug}`,
            name: service.name,
            description: service.description,
          }),
          buildBreadcrumbJsonLd([
            { name: "Početna", path: "/" },
            { name: "Usluge", path: "/usluge" },
            { name: service.name, path: `/usluge/${service.slug}` },
          ]),
          buildServiceJsonLd(service),
        ]}
      />
      <Link
        href="/usluge"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Sve usluge
      </Link>

      {/* Detail-page hero imagery — priority: pair > iframe > single image.
          Renders nothing while detail* fields stay unset on the service. */}
      {service.detailBeforeAsset && service.detailAfterAsset ? (
        <BeforeAfterReveal
          beforeSrc={service.detailBeforeAsset}
          afterSrc={service.detailAfterAsset}
          alt={service.name}
          sizes="(max-width: 768px) 100vw, 896px"
          className="mt-10 aspect-[16/9] w-full rounded-3xl border border-border bg-secondary shadow-[0_30px_60px_rgba(28,26,25,0.12)]"
        >
          <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-foreground/55 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-background/95">
            Pre / posle
          </span>
        </BeforeAfterReveal>
      ) : service.detailEmbedSrc ? (
        <div className="mt-10 relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-border bg-secondary shadow-[0_30px_60px_rgba(28,26,25,0.12)]">
          <iframe
            title={`${service.name} — 360 pregled`}
            src={service.detailEmbedSrc}
            className="h-full w-full border-0"
            allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen"
            loading="lazy"
          />
        </div>
      ) : service.detailAsset ? (
        <div className="mt-10 relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-border bg-secondary shadow-[0_30px_60px_rgba(28,26,25,0.12)]">
          <Image
            src={service.detailAsset}
            alt={service.name}
            fill
            sizes="(max-width: 768px) 100vw, 896px"
            className="object-cover"
            priority
          />
        </div>
      ) : null}

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Badge variant="secondary">{CATEGORY_LABELS[service.category]}</Badge>
        {service.outsourced && <Badge variant="outline">Partner mreža</Badge>}
      </div>

      <h1 className="mt-6 text-5xl leading-tight text-foreground md:text-6xl">
        {service.name}
      </h1>
      <p className="mt-4 text-xl leading-relaxed text-muted-foreground">
        {service.tagline}
      </p>

      {service.forSegments && service.forSegments.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Idealno za:
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
          displayCurrency,
          pricingSettings,
        )}
      </p>

      <div className="mt-10 rounded-2xl border border-border/70 bg-secondary/40 p-6 md:p-8">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Kako se cena formira
        </p>
        <p className="mt-3 text-sm leading-7 text-foreground/85">
          {formatPublicPriceText(
            service.philosophy,
            displayCurrency,
            pricingSettings,
          )}
        </p>
      </div>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <InfoBlock title="Kada koristiti" text={service.highlight} />
        <InfoBlock title="Šta poslati" text={service.materials} />
        <InfoBlock
          title="Šta dobijate"
          text={`${service.variants[0].included} Dodatni obim se računa kroz javne doplate iz cenovnika.`}
        />
      </section>

      <section className="mt-14 space-y-6">
        <h2 className="text-2xl text-foreground md:text-3xl">
          Dostupne varijante i cene
        </h2>

        <div className="space-y-4">
          {service.variants.map((variant) => (
            <div
              key={variant.id}
              className="rounded-2xl border border-border/70 bg-card/85 p-6 shadow-[0_14px_40px_rgba(28,26,25,0.05)] md:p-8"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <h3 className="text-xl text-foreground md:text-2xl">
                    {variant.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {formatPublicPriceText(
                      variant.description,
                      displayCurrency,
                      pricingSettings,
                    )}
                  </p>
                </div>
                <div className="md:text-right">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Početna cena
                  </p>
                  <p className="mt-1 text-3xl text-foreground md:text-4xl">
                    {formatPublicPriceText(
                      variant.priceLabel,
                      displayCurrency,
                      pricingSettings,
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatPublicPriceText(
                      variant.unitLabel,
                      displayCurrency,
                      pricingSettings,
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Šta dobijate u ovoj ceni
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground/85">
                    {formatPublicPriceText(
                      variant.included,
                      displayCurrency,
                      pricingSettings,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Doplate iz cenovnika
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
                          displayCurrency,
                          pricingSettings,
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {variant.note && (
                  <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm leading-6 text-muted-foreground">
                    {formatPublicPriceText(
                      variant.note,
                      displayCurrency,
                      pricingSettings,
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
          Pošaljite projekat
        </QuickInquiryLink>
        <ButtonLink href="/cene" size="xl" variant="outline">
          Detaljan cenovnik
        </ButtonLink>
      </div>
    </article>
  );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/75 p-5">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-7 text-foreground/80">{text}</p>
    </div>
  );
}
