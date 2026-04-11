import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { PRICING_HIGHLIGHTS } from "@/lib/content/site";

export function PricingPreview() {
  return (
    <section className="py-24">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <SectionKicker>Cene</SectionKicker>
            <h2 className="mt-4 text-4xl leading-tight text-foreground md:text-5xl">
              Cena bez nagađanja
            </h2>
            <p className="mt-4 text-base leading-relaxed text-foreground/70">
              Unapred znate kako se cena formira. Prva isporuka iz modela nosi
              pun iznos, a svaki sledeći prikaz košta manje jer je osnovni rad
              već urađen.
            </p>
          </div>
          <ButtonLink
            href="/cene"
            variant="ghost"
            className="self-start md:self-auto"
          >
            Ceo cenovnik
            <ArrowRight className="ml-1 h-4 w-4" />
          </ButtonLink>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRICING_HIGHLIGHTS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col gap-4 rounded-lg border border-border/60 bg-background p-6 transition-colors hover:border-accent/60"
            >
              <h3 className="text-lg text-foreground">{item.title}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-xs uppercase tracking-wider text-foreground/55">
                  {item.unit}
                </span>
                <span className="text-4xl text-foreground">€{item.price}</span>
              </div>
              <p className="text-sm leading-relaxed text-foreground/65">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
