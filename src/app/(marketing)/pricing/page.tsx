import type { Metadata } from "next";
import { Suspense } from "react";
import { QuickInquiryLink } from "@/components/inquiry/quick-inquiry-link";
import { JsonLd } from "@/components/seo/json-ld";
import { ConfiguratorBody } from "@/components/configurator/pricing-configurator";
import { PricingAssistantGuideContext } from "@/components/chat/pricing-guide-context";
import { QuoteProvider } from "@/components/configurator/quote-context";
import { QuoteSummary } from "@/components/configurator/quote-summary";
import { StandaloneAiCredits } from "@/components/configurator/standalone-ai-credits";
import { ServiceMatrix } from "@/components/configurator/service-matrix";
import { Skeleton } from "@/components/ui/skeleton";
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
  title: "Pricing",
  description:
    "A transparent price list for architectural visualization services. The first delivery from a model carries the full price; every subsequent view from the same model costs significantly less.",
  path: "/pricing",
  image: "/artwork/pricing-card-interior.webp",
  imageAlt:
    "Architectural visualization pricing - an interior render example and rendering services",
  keywords: [
    "3D render prices",
    "architectural visualization price list",
    "virtual staging price",
  ],
});

export const dynamic = "force-dynamic";

export default async function PricingPage() {
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
            path: "/pricing",
            name: "Architectural visualization pricing",
            description:
              "A transparent price list for renders, 3D floor plans, virtual staging, 360° virtual tours and AI credits.",
          }),
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Pricing", path: "/pricing" },
          ]),
          buildOfferCatalogJsonLd(pricingCatalog.categories),
        ]}
      />
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6 pt-20 md:pt-28">
        <p className="section-kicker">Pricing</p>
        <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] text-foreground md:text-6xl">
          A price without guesswork
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          We build the model once — you use it many times. The first delivery
          from a model carries the full price, and every subsequent view costs
          less because the core work is already done. Pick your services and
          see the price immediately.
        </p>
      </div>

      {/* StandaloneAiCredits, the service matrix, and the configurator share a
          single QuoteProvider so every entry point updates the same cart. */}
      <QuoteProvider
        displayCurrency={displayCurrency}
        pricingCatalog={pricingCatalog}
      >
        {/* Feeds the live cart into the assistant guide store so the tip
            bubble + AI recognize what the user is configuring. */}
        <PricingAssistantGuideContext />
        <StandaloneAiCredits />

        {/* Service matrix — left sidebar of categories + right table of services
            with hover-preview pricing and an info drawer. The black "Your
            estimate" QuoteSummary card lives in the matrix as a sticky 3rd
            column on xl+, so the cart is visible while browsing. */}
        <Suspense
          fallback={
            <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6 pt-16">
              <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
                <div className="hidden space-y-3 lg:block">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </div>
            </div>
          }
        >
          <ServiceMatrix cartSlot={<QuoteSummary />} />
        </Suspense>

        {/* Cart / configurator — item-editor cards below the matrix.
            QuoteSummary is suppressed here (already shown above). */}
        <section id="korpa" className="scroll-mt-24 pb-20 pt-16">
          <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
            <Suspense
              fallback={
                <div className="space-y-4">
                  <Skeleton className="h-8 w-56" />
                  <Skeleton className="h-40 w-full" />
                </div>
              }
            >
              <ConfiguratorBody hideQuoteSummary />
            </Suspense>
          </div>
        </section>
      </QuoteProvider>

      <section className="pb-24">
        <div className="mx-auto w-full max-w-3xl px-6">
          <div className="rounded-2xl border border-border bg-secondary/40 p-6 md:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg text-foreground">
                  {pricingTerms.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {pricingTerms.lead}
                </p>
              </div>
              <span className="inline-flex w-fit flex-shrink-0 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 font-mono text-xs font-medium uppercase tracking-[0.08em] text-accent">
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
                  sourceLabel: `Pricing - ${pricingTerms.ctaLabel}`,
                }}
              >
                {pricingTerms.ctaLabel}
              </QuickInquiryLink>
            </div>
          </div>
        </div>
      </section>

      <PreFooterCta
        heading="Need to talk it through first?"
        body="If you want a clear conversation about a larger project or a specific scope, send a short description and we usually reply the same working day."
        ctaLabel="Open the project form"
        ctaHref="/contact"
        inquirySource={{ source: "cene-pre-footer", sourceLabel: "Pricing pre-footer quick inquiry" }}
      />
    </>
  );
}
