import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { QuickInquiryLink } from "@/components/inquiry/quick-inquiry-link";
import {
  CATEGORY_LABELS,
  SERVICES,
  getServiceBySlug,
} from "@/lib/catalog/services";

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
  return {
    title: service.name,
    description: service.description,
    openGraph: {
      title: `${service.name} — Elegant Render`,
      description: service.description,
      url: `/usluge/${slug}`,
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  return (
    <article className="mx-auto w-full max-w-4xl px-6 pb-24 pt-20 md:pt-28">
      <Link
        href="/usluge"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Sve usluge
      </Link>

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

      <p className="mt-10 text-base leading-7 text-muted-foreground">
        {service.description}
      </p>

      <div className="mt-10 rounded-2xl border border-border/70 bg-secondary/40 p-6 md:p-8">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Model-first kontekst
        </p>
        <p className="mt-3 text-sm leading-7 text-foreground/85">
          {service.philosophy}
        </p>
      </div>

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
                    {variant.description}
                  </p>
                </div>
                <div className="md:text-right">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Bazna cena
                  </p>
                  <p className="mt-1 text-3xl text-foreground md:text-4xl">
                    {variant.priceLabel}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {variant.unitLabel}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Uključeno
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground/85">
                    {variant.included}
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
                        {addOn}
                      </li>
                    ))}
                  </ul>
                </div>

                {variant.note && (
                  <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm leading-6 text-muted-foreground">
                    {variant.note}
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
