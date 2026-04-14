import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button-link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { PricingConfigurator } from "@/components/configurator/pricing-configurator";

export const metadata: Metadata = {
  title: "Cene",
  description:
    "Transparentan cenovnik usluga arhitektonske vizuelizacije po Model-First Pricing pravilima. Prva isporuka iz modela nosi pun iznos, svaki sledeći prikaz je znatno povoljniji.",
  openGraph: {
    title: "Cene — Elegant Render",
    description:
      "Transparentan cenovnik usluga arhitektonske vizuelizacije po Model-First Pricing pravilima.",
    url: "/cene",
  },
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
          već urađen. Izaberite usluge i odmah vidite cenu.
        </p>
      </div>

      <section className="pb-20 pt-12">
        <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
          <PricingConfigurator />
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
