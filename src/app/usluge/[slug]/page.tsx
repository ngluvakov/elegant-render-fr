import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { FinalCta } from "@/components/marketing/final-cta";
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
  };
}

export default async function ServiceDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  return (
    <>
      <article className="mx-auto w-full max-w-4xl px-6 pb-16 pt-20 md:pt-28">
        <Link
          href="/usluge"
          className="inline-flex items-center gap-1 text-sm text-foreground/60 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Sve usluge
        </Link>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{CATEGORY_LABELS[service.category]}</Badge>
          {service.outsourced && (
            <Badge variant="outline">Partner mreža</Badge>
          )}
        </div>

        <h1 className="mt-6 text-5xl leading-tight text-foreground md:text-6xl">
          {service.name}
        </h1>
        <p className="mt-4 text-xl leading-relaxed text-foreground/75">
          {service.tagline}
        </p>

        <p className="mt-10 text-base leading-relaxed text-foreground/75">
          {service.description}
        </p>

        <div className="mt-12 rounded-xl border border-border/60 bg-secondary/30 p-6 md:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-foreground/55">
            Startna cena
          </p>
          <p className="mt-2 text-5xl text-foreground">
            od €{service.startingFromEur}
            {service.unit === "po sekundi" && (
              <span className="text-xl text-foreground/60">/s</span>
            )}
          </p>
          {service.unit && (
            <p className="mt-1 text-sm text-foreground/60">{service.unit}</p>
          )}
          <ul className="mt-6 space-y-2 text-sm text-foreground/75">
            {service.highlights.map((highlight) => (
              <li key={highlight} className="flex gap-2">
                <span className="mt-[0.5em] h-1 w-1 flex-shrink-0 rounded-full bg-accent" />
                {highlight}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/kontakt" size="xl" variant="accent">
            Pošaljite projekat
          </ButtonLink>
          <ButtonLink href="/cene" size="xl" variant="outline">
            Detaljan cenovnik
          </ButtonLink>
        </div>
      </article>
      <FinalCta />
    </>
  );
}
