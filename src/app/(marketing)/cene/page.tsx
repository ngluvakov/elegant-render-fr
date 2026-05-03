import type { Metadata } from "next";
import { Suspense } from "react";
import { Layers, TrendingDown, Zap } from "lucide-react";
import { QuickInquiryLink } from "@/components/inquiry/quick-inquiry-link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { CategoryPreview } from "@/components/configurator/category-preview";
import { ConfiguratorBody } from "@/components/configurator/pricing-configurator";
import { QuoteProvider } from "@/components/configurator/quote-context";
import { StandaloneAiCredits } from "@/components/configurator/standalone-ai-credits";
import { getConfiguratorProduct } from "@/lib/catalog/configurator";
import {
  formatPublicPrice,
  publicPriceNote,
} from "@/lib/catalog/display-currency";
import { getPublicDisplayCurrency } from "@/lib/catalog/public-currency-server";

// Numbers in the philosophy strip's middle card are pulled live from the
// catalog so a price change there propagates here automatically — no
// stale-copy hazard. Falls back to the values current at the time of
// writing if the addon ever gets renamed (so the page never crashes on
// a missing lookup).
const extStaticBaseEur =
  getConfiguratorProduct("ext-static")?.product.basePriceEur ?? 250;
const extStaticCamPriceEur =
  getConfiguratorProduct("ext-static")?.product.addOns.find(
    (a) => a.id === "ext-static-cam",
  )?.priceEur ?? 48;

export const metadata: Metadata = {
  title: "Cene",
  description:
    "Transparentan cenovnik usluga arhitektonske vizuelizacije. Prva isporuka iz modela nosi pun iznos, svaki sledeći prikaz iz istog modela je znatno povoljniji.",
  openGraph: {
    title: "Cene — Elegant Render",
    description:
      "Transparentan cenovnik usluga arhitektonske vizuelizacije. Plaćate model jednom — koristite ga više puta.",
    url: "/cene",
  },
};

export const dynamic = "force-dynamic";

export default async function CenePage() {
  const displayCurrency = await getPublicDisplayCurrency();

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

      {/* Model-First philosophy strip */}
      <section className="pt-12 pb-2">
        <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Layers,
                title: "Gradimo jednom",
                desc: "Prva isporuka nosi pun iznos izrade 3D modela — geometrija, teksture, osvetljenje, okruženje.",
              },
              {
                icon: TrendingDown,
                title: "Drugi kadar je znatno jeftiniji",
                desc: `Render eksterijera sa modelom: ${formatPublicPrice(extStaticBaseEur, displayCurrency)} (uključuje prvi kadar). Svaki dodatni kadar iste fasade: ${formatPublicPrice(extStaticCamPriceEur, displayCurrency)}. Plaćate samo novi pogled, ne ponovo ceo model.`,
              },
              {
                icon: Zap,
                title: "Više naručite — više uštedite",
                desc: "Što više naručite iz istog modela, to je ušteda veća. Volumen popusti se primenjuju na već snižene cene.",
              },
            ].map((point) => (
              <div
                key={point.title}
                className="flex items-start gap-4 rounded-2xl border border-border/40 bg-card/80 p-5 shadow-[0_4px_16px_rgba(28,26,25,0.03)]"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent/10">
                  <point.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {point.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {point.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category preview — five starting-price cards above the configurator. */}
      <section className="pt-10 pb-2">
        <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
          <h2 className="mb-5 text-[0.7rem] font-bold uppercase tracking-[0.28em] text-muted-foreground">
            Šta vam treba?
          </h2>
          <CategoryPreview displayCurrency={displayCurrency} />
        </div>
      </section>

      {/* StandaloneAiCredits + the configurator share a single QuoteProvider
          so credits added in the package picker show up immediately in the
          summary sidebar and the in-configurator <details> disclosure — no
          handoff plumbing, single cart. */}
      <QuoteProvider displayCurrency={displayCurrency}>
        <StandaloneAiCredits />
        <section id="configurator" className="scroll-mt-24 pb-20 pt-10">
          <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
            <Suspense fallback={null}>
              <ConfiguratorBody />
            </Suspense>
          </div>
        </section>
      </QuoteProvider>

      <section className="pb-24">
        <div className="mx-auto w-full max-w-3xl px-6">
          <div className="rounded-2xl border border-[color:var(--color-border-warm)] bg-secondary/40 p-6 md:p-8">
            <h3 className="text-lg text-foreground">Napomene uz cenovnik</h3>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li>
                {publicPriceNote(displayCurrency)}
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
              <QuickInquiryLink
                size="lg"
                variant="accent"
                inquiry={{
                  source: "pricing-notes",
                  sourceLabel: "Cene - zatražite procenu",
                }}
              >
                Zatražite procenu
              </QuickInquiryLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
