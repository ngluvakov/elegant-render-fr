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
    "Toute la palette de la visualisation architecturale — rendus, animations, visites 360°, home staging virtuel et rénovation virtuelle.",
  path: "/services",
  image: "/artwork/elegant-render-services-triptych-1.webp",
  imageAlt:
    "Services Elegant Render - visualisation architecturale, rendus, visites 360° et home staging virtuel",
  keywords: [
    "services de visualisation architecturale",
    "rendus d’intérieur et d’extérieur",
    "rénovation virtuelle",
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
            name: "Services de visualisation architecturale",
            description:
              "Rendus d’intérieur et d’extérieur, plans 3D, visites 360°, animations, home staging virtuel et retouche photo par IA.",
          }),
          buildBreadcrumbJsonLd([
            { name: "Accueil", path: "/" },
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
        heading="Prêt à vous lancer — ouvrez le calculateur et composez votre commande."
        body="Choisissez un type de visualisation, réglez les paramètres et voyez le prix exact immédiatement — sans forfaits imposés, sans clauses en petits caractères."
      />
    </>
  );
}
