import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionKicker } from "@/components/brand/section-kicker";
import {
  CATEGORY_DESCRIPTIONS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  getServicesByCategory,
} from "@/lib/catalog/services";

type ServicesGridProps = {
  /** When true, only show a compact preview (first 2 categories). */
  preview?: boolean;
};

export function ServicesGrid({ preview = false }: ServicesGridProps) {
  const categories = preview ? CATEGORY_ORDER.slice(0, 2) : CATEGORY_ORDER;

  return (
    <section className="py-24">
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
        {!preview && (
          <div className="mx-auto max-w-2xl text-center">
            <SectionKicker align="center">Usluge</SectionKicker>
            <h2 className="mt-4 text-4xl leading-tight text-foreground md:text-5xl">
              Sve što vam treba za jasan prikaz prostora
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              Od pojedinačnih kadrova do kompletnih virtuelnih tura. Svaka
              usluga je definisana jasno — unapred znate šta dobijate i koliko
              to košta.
            </p>
          </div>
        )}

        <div className={preview ? "mt-12 space-y-16" : "mt-20 space-y-20"}>
          {categories.map((category) => {
            const services = getServicesByCategory(category);
            if (services.length === 0) return null;
            return (
              <div key={category}>
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h3 className="text-2xl text-foreground md:text-3xl">
                      {CATEGORY_LABELS[category]}
                    </h3>
                    <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                      {CATEGORY_DESCRIPTIONS[category]}
                    </p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {services.length} uslug{services.length === 1 ? "a" : "e"}
                  </span>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map((service) => {
                    const firstVariant = service.variants[0];
                    return (
                      <Link
                        key={service.slug}
                        href={`/usluge/${service.slug}`}
                        className="group flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/80 p-6 transition-colors hover:border-accent/60"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-lg text-foreground">
                            {service.name}
                          </h4>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {service.tagline}
                        </p>
                        <div className="mt-auto flex items-center justify-between pt-4">
                          <span className="text-sm font-medium text-foreground">
                            od {firstVariant.priceLabel}
                          </span>
                          {service.outsourced && (
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase tracking-wider"
                            >
                              Partner mreža
                            </Badge>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
