import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { SectionKicker } from "@/components/brand/section-kicker";
import {
  CATEGORY_DESCRIPTIONS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  getServicesByCategory,
} from "@/lib/catalog/services";

export const metadata: Metadata = {
  title: "Cene",
  description:
    "Transparentan cenovnik usluga arhitektonske vizuelizacije po Model-First Pricing pravilima. Prva isporuka iz modela nosi pun iznos, svaki sledeći prikaz je znatno povoljniji.",
};

export default function CenePage() {
  return (
    <>
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6 pt-20 md:pt-28">
        <SectionKicker>Cene</SectionKicker>
        <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] text-foreground md:text-6xl">
          Cena bez nagađanja
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Gradimo model jednom — koristite ga više puta. Prva isporuka iz modela
          nosi pun iznos, a svaki sledeći prikaz košta manje jer je osnovni rad
          već urađen. Sve cene su izražene u evrima i ne uključuju PDV.
        </p>
      </div>

      <section className="pb-20 pt-16">
        <div className="mx-auto w-full max-w-[min(96vw,1720px)] space-y-20 px-6">
          {CATEGORY_ORDER.map((category) => {
            const services = getServicesByCategory(category);
            if (services.length === 0) return null;
            return (
              <div key={category}>
                <div className="border-b border-border/60 pb-4">
                  <h2 className="text-3xl text-foreground md:text-4xl">
                    {CATEGORY_LABELS[category]}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                    {CATEGORY_DESCRIPTIONS[category]}
                  </p>
                </div>

                <div className="mt-8 space-y-8">
                  {services.map((service) => (
                    <div
                      key={service.slug}
                      className="rounded-2xl border border-border/60 bg-card/80 p-6 md:p-8"
                    >
                      <div className="flex flex-col gap-2 border-b border-border/50 pb-4 md:flex-row md:items-end md:justify-between">
                        <div>
                          <Link
                            href={`/usluge/${service.slug}`}
                            className="text-2xl text-foreground transition-colors hover:text-accent md:text-3xl"
                          >
                            {service.name}
                          </Link>
                          {service.outsourced && (
                            <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                              Partner mreža
                            </p>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {service.tagline}
                        </p>
                      </div>

                      <div className="mt-6 grid gap-4 md:grid-cols-2">
                        {service.variants.map((variant) => (
                          <div
                            key={variant.id}
                            className="rounded-xl border border-border bg-background/60 p-5"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="text-base font-semibold text-foreground">
                                {variant.title}
                              </h3>
                              <p className="flex-shrink-0 text-xl font-semibold text-foreground">
                                {variant.priceLabel}
                              </p>
                            </div>
                            <p className="mt-1 text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                              {variant.unitLabel}
                            </p>
                            <p className="mt-3 text-xs leading-6 text-muted-foreground">
                              <strong className="text-foreground">
                                Uključeno:
                              </strong>{" "}
                              {variant.included}
                            </p>
                            <ul className="mt-3 space-y-1 text-xs leading-6 text-muted-foreground">
                              {variant.addOns.map((addOn) => (
                                <li key={addOn} className="flex gap-2">
                                  <span className="mt-[0.5em] h-1 w-1 flex-shrink-0 rounded-full bg-accent" />
                                  {addOn}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto w-full max-w-3xl px-6">
          <div className="rounded-2xl border border-[color:var(--color-border-warm)] bg-secondary/40 p-6 md:p-8">
            <h3 className="text-lg text-foreground">Napomene uz cenovnik</h3>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
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
              <ButtonLink href="/kontakt" size="lg" variant="accent">
                Zatražite procenu
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
