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
  title: "Usluge",
  description:
    "Kompletna ponuda arhitektonske vizuelizacije — renderi, animacije, 360 ture, virtuelno opremanje i adaptacije prostora.",
  path: "/usluge",
  image: "/artwork/elegant-render-services-triptych-1.webp",
  imageAlt:
    "Elegant Render usluge - arhitektonska vizuelizacija, renderi, 360 ture i virtuelno opremanje",
  keywords: [
    "usluge arhitektonske vizuelizacije",
    "renderi enterijera i eksterijera",
    "virtuelna renovacija",
  ],
});

export default async function UslugePage() {
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
            path: "/usluge",
            name: "Usluge arhitektonske vizuelizacije",
            description:
              "Renderi enterijera i eksterijera, 3D osnove, 360 ture, animacije, virtuelno opremanje i AI obrada fotografija.",
          }),
          buildBreadcrumbJsonLd([
            { name: "Početna", path: "/" },
            { name: "Usluge", path: "/usluge" },
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
        heading="Spreman si — otvori kalkulator i složi narudžbinu."
        body="Izaberi tip vizuelizacije iz ponude, podesi parametre i odmah vidi tačnu cenu — bez paketa i sitnih slova."
      />
    </>
  );
}
