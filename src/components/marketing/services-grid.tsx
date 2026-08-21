/**
 * ServicesGrid — Categorized grid of service cards with pricing and links.
 * Supports a `preview` mode that limits to the first 2 categories.
 *
 * Used on: /services (services listing page).
 * @prop preview — show only a compact subset of categories
 */
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  CATEGORY_DESCRIPTIONS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  getServicesByCategory,
} from "@/lib/catalog/services";
import { formatPublicPriceText } from "@/lib/catalog/display-currency";
import { getPublicDisplayCurrency } from "@/lib/catalog/public-currency-server";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";

type ServicesGridProps = {
  /** When true, only show a compact preview (first 2 categories). */
  preview?: boolean;
};

export async function ServicesGrid({ preview = false }: ServicesGridProps) {
  const [displayCurrency, pricingCatalog] = await Promise.all([
    getPublicDisplayCurrency(),
    getPublishedPricingCatalog(),
  ]);
  const categories = preview ? CATEGORY_ORDER.slice(0, 2) : CATEGORY_ORDER;

  return (
    <section className="py-24">
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
        {!preview && (
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-kicker">Services</p>
            <h2 className="mt-4 text-4xl leading-tight text-foreground md:text-5xl">
              Tout ce qu’il faut pour présenter un espace clairement
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              De la vue unique à la visite virtuelle complète. Chaque service
              est clairement défini — vous savez d’avance ce que vous recevez
              et ce que cela coûte.
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
                  <span className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    {services.length} service{services.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map((service) => {
                    const firstVariant = service.variants[0];
                    return (
                      <Link
                        key={service.slug}
                        href={`/services/${service.slug}`}
                        className="group flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/80 p-6 transition-[border-color,box-shadow] duration-200 hover:border-[#d4d4d4] hover:shadow-[0_1px_3px_rgba(17,17,17,0.06)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-lg text-foreground">
                            {service.name}
                          </h4>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors duration-200 group-hover:text-accent" />
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {service.tagline}
                        </p>
                        {service.priceContext && (
                          <p className="text-[0.78rem] leading-6 text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              Ce que vous recevez :
                            </span>{" "}
                            {formatPublicPriceText(
                              service.priceContext,
                              displayCurrency,
                              pricingCatalog.settings,
                            )}
                          </p>
                        )}
                        <div className="mt-auto flex items-center justify-between pt-4">
                          <span className="text-sm font-medium text-foreground">
                            dès{" "}
                            {formatPublicPriceText(
                              firstVariant.priceLabel,
                              displayCurrency,
                              pricingCatalog.settings,
                            )}
                          </span>
                          {service.outsourced && (
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase tracking-wider"
                            >
                              Réseau de partenaires
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
