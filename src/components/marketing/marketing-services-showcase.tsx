import Link from "next/link";
import { Suspense } from "react";
import { SectionKicker } from "@/components/brand/section-kicker";
import { QuoteProvider } from "@/components/configurator/quote-context";
import { ServiceChooserChips } from "@/components/configurator/service-chooser-chips";
import { TablicaGrid } from "@/components/configurator/tablica-grid";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";
import { getPublicDisplayCurrency } from "@/lib/catalog/public-currency-server";

export async function MarketingServicesShowcase() {
  const [displayCurrency, pricingCatalog] = await Promise.all([
    getPublicDisplayCurrency(),
    getPublishedPricingCatalog(),
  ]);

  return (
    <section className="border-t border-border/60 py-16 md:py-24">
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionKicker>Katalog usluga</SectionKicker>
            <h2 className="mt-4 max-w-2xl text-3xl leading-tight text-foreground md:text-4xl">
              Sve usluge na jednom mestu
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Pregledaj pune kartice svake usluge — šta je uključeno, koliko
              košta i kako se kombinuje sa drugim prikazima. Detaljne cene i
              dodatne opcije su na stranici cenovnika.
            </p>
          </div>
          <Link
            href="/pricing"
            className="self-start text-xs font-semibold uppercase tracking-[0.16em] text-accent hover:underline md:self-end"
          >
            Otvori cenovnik
          </Link>
        </div>

        <QuoteProvider
          displayCurrency={displayCurrency}
          pricingCatalog={pricingCatalog}
        >
          <Suspense fallback={null}>
            <ServiceChooserChips basePath="/" showCartChip={false} />
          </Suspense>
          <Suspense fallback={null}>
            <TablicaGrid marketingMode />
          </Suspense>
        </QuoteProvider>
      </div>
    </section>
  );
}
