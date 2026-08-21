import Link from "next/link";
import { Suspense } from "react";
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
    <section className="border-t border-border py-16 md:py-24">
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-kicker">Catalogue de services</p>
            <h2 className="mt-4 max-w-2xl text-3xl leading-tight text-foreground md:text-4xl">
              Tous les services au même endroit
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Parcourez la fiche complète de chaque service — ce qui est
              inclus, ce que cela coûte et comment il se combine avec
              d’autres visuels. Les prix détaillés et les options
              supplémentaires se trouvent sur la page des tarifs.
            </p>
          </div>
          <Link
            href="/pricing"
            className="self-start font-mono text-xs uppercase tracking-[0.08em] text-foreground hover:underline md:self-end"
          >
            Ouvrir les tarifs
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
