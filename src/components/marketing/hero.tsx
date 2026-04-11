import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { SITE } from "@/lib/content/site";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-20 sm:pt-28 md:pb-24 md:pt-36">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.22em] text-foreground/55">
            Arhitektonska vizuelizacija · {SITE.parentCompany}
          </p>
          <h1 className="text-5xl leading-[1.02] tracking-tight text-foreground sm:text-6xl md:text-7xl">
            Lep prikaz.
            <br />
            Jasna cena.
            <br />
            <span className="text-accent">Lakša odluka.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-foreground/75 md:text-xl">
            {SITE.description}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/cene" size="xl" className="w-full sm:w-auto">
              Pogledajte cene
              <ArrowRight className="ml-1 h-4 w-4" />
            </ButtonLink>
            <ButtonLink
              href="/portfolio"
              size="xl"
              variant="outline"
              className="w-full sm:w-auto"
            >
              Pogledajte primere
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
