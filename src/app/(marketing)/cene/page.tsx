import type { Metadata } from "next";
import { Suspense } from "react";
import { QuickInquiryLink } from "@/components/inquiry/quick-inquiry-link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { JsonLd } from "@/components/seo/json-ld";
import { CategoryPreview } from "@/components/configurator/category-preview";
import { ConfiguratorBody } from "@/components/configurator/pricing-configurator";
import { QuoteProvider } from "@/components/configurator/quote-context";
import { StandaloneAiCredits } from "@/components/configurator/standalone-ai-credits";
import { PreFooterCta } from "@/components/site/pre-footer-cta";
import {
  buildBreadcrumbJsonLd,
  buildOfferCatalogJsonLd,
  buildWebPageJsonLd,
  createPublicMetadata,
} from "@/lib/seo";
import { getPublicPricingTerms } from "@/lib/catalog/display-currency";
import { getPublicDisplayCurrency } from "@/lib/catalog/public-currency-server";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";

export const metadata: Metadata = createPublicMetadata({
  title: "Cene",
  description:
    "Transparentan cenovnik usluga arhitektonske vizuelizacije. Prva isporuka iz modela nosi pun iznos, svaki sledeći prikaz iz istog modela je znatno povoljniji.",
  path: "/cene",
});

export const dynamic = "force-dynamic";

export default async function CenePage() {
  const [displayCurrency, pricingCatalog] = await Promise.all([
    getPublicDisplayCurrency(),
    getPublishedPricingCatalog(),
  ]);
  const pricingTerms = getPublicPricingTerms(displayCurrency);

  return (
    <>
      <JsonLd
        data={[
          buildWebPageJsonLd({
            path: "/cene",
            name: "Cene arhitektonske vizuelizacije",
            description:
              "Transparentan cenovnik rendera, 3D osnova, virtuelnog opremanja, 360 tura i AI kredita.",
          }),
          buildBreadcrumbJsonLd([
            { name: "Početna", path: "/" },
            { name: "Cene", path: "/cene" },
          ]),
          buildOfferCatalogJsonLd(pricingCatalog.categories),
        ]}
      />
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

      {/* StandaloneAiCredits, category preview, and the configurator share a
          single QuoteProvider so every entry point updates the same cart. */}
      <QuoteProvider
        displayCurrency={displayCurrency}
        pricingCatalog={pricingCatalog}
      >
        <StandaloneAiCredits />

        <section className="pt-10 pb-2">
          <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
            <h2 className="mb-5 text-[0.7rem] font-bold uppercase tracking-[0.28em] text-muted-foreground">
              Šta vam treba?
            </h2>
            <CategoryPreview
              displayCurrency={displayCurrency}
              pricingCatalog={pricingCatalog}
            />
          </div>
        </section>

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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg text-foreground">
                  {pricingTerms.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {pricingTerms.lead}
                </p>
              </div>
              <span className="inline-flex w-fit flex-shrink-0 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-accent">
                {pricingTerms.badge}
              </span>
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {pricingTerms.bullets.map((term) => (
                <li key={term}>{term}</li>
              ))}
            </ul>
            <div className="mt-6">
              <QuickInquiryLink
                size="lg"
                variant="accent"
                inquiry={{
                  source: "pricing-notes",
                  sourceLabel: `Cene - ${pricingTerms.ctaLabel}`,
                }}
              >
                {pricingTerms.ctaLabel}
              </QuickInquiryLink>
            </div>
          </div>
        </div>
      </section>

      <PreFooterCta
        heading="Treba dogovor pre nego što kreneš?"
        body="Ako želiš jasan razgovor o većem projektu ili specifičnom obimu, pošalji kratak opis i vraćamo se obično istog radnog dana."
        ctaLabel="Otvori formu za projekat"
        ctaHref="/kontakt"
        inquirySource={{ source: "cene-pre-footer", sourceLabel: "Cene PreFooter brzi upit" }}
      />
    </>
  );
}
