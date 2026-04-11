import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { FinalCta } from "@/components/marketing/final-cta";
import {
  CATEGORY_DESCRIPTIONS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  getServicesByCategory,
} from "@/lib/catalog/services";

export const metadata: Metadata = {
  title: "Cene",
  description:
    "Transparentan cenovnik usluga arhitektonske vizuelizacije. Prva isporuka iz modela nosi pun iznos, svaki sledeći prikaz je znatno povoljniji.",
};

export default function CenePage() {
  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-6 pt-20 md:pt-28">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-foreground/55">
          Cene
        </p>
        <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] text-foreground md:text-6xl">
          Cena bez nagađanja
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/70">
          Gradimo model jednom — koristite ga više puta. Prva isporuka iz modela
          nosi pun iznos, a svaki sledeći prikaz košta manje jer je osnovni rad
          već urađen. Sve cene su izražene u evrima i ne uključuju PDV.
        </p>
      </div>

      <section className="pb-20 pt-16">
        <div className="mx-auto w-full max-w-6xl px-6 space-y-20">
          {CATEGORY_ORDER.map((category) => {
            const services = getServicesByCategory(category);
            if (services.length === 0) return null;
            return (
              <div key={category}>
                <div className="border-b border-border/60 pb-4">
                  <h2 className="text-3xl text-foreground md:text-4xl">
                    {CATEGORY_LABELS[category]}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm text-foreground/65">
                    {CATEGORY_DESCRIPTIONS[category]}
                  </p>
                </div>
                <div className="mt-8 divide-y divide-border/50">
                  {services.map((service) => (
                    <div
                      key={service.slug}
                      className="grid gap-4 py-6 md:grid-cols-[1.5fr_2fr_auto] md:items-start md:gap-8"
                    >
                      <div>
                        <Link
                          href={`/usluge/${service.slug}`}
                          className="text-xl text-foreground transition-colors hover:text-accent"
                        >
                          {service.name}
                        </Link>
                        {service.outsourced && (
                          <p className="mt-1 text-xs uppercase tracking-wider text-foreground/50">
                            Partner mreža
                          </p>
                        )}
                      </div>
                      <ul className="space-y-1 text-sm text-foreground/70">
                        {service.highlights.map((highlight) => (
                          <li key={highlight} className="flex gap-2">
                            <span className="mt-[0.5em] h-1 w-1 flex-shrink-0 rounded-full bg-accent" />
                            {highlight}
                          </li>
                        ))}
                      </ul>
                      <div className="md:text-right">
                        <p className="text-3xl text-foreground">
                          od €{service.startingFromEur}
                          {service.unit === "po sekundi" && (
                            <span className="text-base text-foreground/60">
                              /s
                            </span>
                          )}
                        </p>
                        {service.unit && (
                          <p className="mt-1 text-xs text-foreground/55">
                            {service.unit}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto w-full max-w-3xl px-6">
          <div className="rounded-xl border border-border/60 bg-secondary/30 p-6 md:p-8">
            <h3 className="text-lg text-foreground">Napomene uz cenovnik</h3>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/75">
              <li>
                Sve cene su u evrima (EUR) i <strong>ne uključuju PDV</strong>.
              </li>
              <li>
                Svaki projekat uključuje{" "}
                <strong>tri kruga revizija</strong> bez dodatne naknade.
              </li>
              <li>
                Ukoliko kadar zahteva dodatnu geometriju koja nije vidljiva iz
                primarnog pogleda, primenjujemo jednokratnu doplatu od{" "}
                <strong>+25% na izradu modela</strong> — nakon toga svi kadrovi
                idu po standardnoj ceni.
              </li>
              <li>
                Za veće projekte i stambene komplekse koristimo progresivne
                popuste. Javite nam se i spremićemo ponudu po meri.
              </li>
            </ul>
            <div className="mt-6">
              <ButtonLink href="/kontakt" size="lg">
                Zatražite procenu
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
