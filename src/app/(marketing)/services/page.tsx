import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { ServicesShowcase } from "@/components/marketing/services-showcase";
import { PreFooterCta } from "@/components/site/pre-footer-cta";
import { SERVICES_PAGE_FAQS } from "@/lib/content/site";
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildOfferCatalogJsonLd,
  buildServicesItemListJsonLd,
  buildWebPageJsonLd,
  createPublicMetadata,
} from "@/lib/seo";
import { formatPublicPriceText } from "@/lib/catalog/display-currency";
import { getPublicDisplayCurrency } from "@/lib/catalog/public-currency-server";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";

export const metadata: Metadata = createPublicMetadata({
  title: "Services",
  description:
    "The full range of architectural visualization — renders, animations, 360° tours, virtual staging, and virtual renovation.",
  path: "/services",
  image: "/artwork/elegant-render-services-triptych-1.webp",
  imageAlt:
    "Elegant Render services - architectural visualization, renders, 360° tours, and virtual staging",
  keywords: [
    "architectural visualization services",
    "interior and exterior renders",
    "virtual renovation",
  ],
});

export default async function ServicesPage() {
  const [displayCurrency, pricingCatalog] = await Promise.all([
    getPublicDisplayCurrency(),
    getPublishedPricingCatalog(),
  ]);
  const pricingSettings = pricingCatalog.settings;
  const servicesPageFaqs = SERVICES_PAGE_FAQS.map((item) => ({
    ...item,
    answer: formatPublicPriceText(
      item.answer,
      displayCurrency,
      pricingSettings,
    ),
  }));

  return (
    <>
      <JsonLd
        data={[
          buildWebPageJsonLd({
            path: "/services",
            name: "Architectural visualization services",
            description:
              "Interior and exterior renders, 3D floor plans, 360° tours, animations, virtual staging, and AI photo editing.",
          }),
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
          ]),
          buildServicesItemListJsonLd(),
          buildOfferCatalogJsonLd(),
          buildFaqJsonLd(servicesPageFaqs),
        ]}
      />
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6 pt-12 md:pt-20">
        <ServicesShowcase />
      </div>
      <PreFooterCta
        heading="Ready to go — open the calculator and build your order."
        body="Pick a visualization type, set the parameters, and see the exact price right away — no bundles, no fine print."
      />
    </>
  );
}
