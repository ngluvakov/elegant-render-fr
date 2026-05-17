import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { ServicesShowcase } from "@/components/marketing/services-showcase";
import { SERVICES_PAGE_FAQS } from "@/lib/content/site";
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildOfferCatalogJsonLd,
  buildServicesItemListJsonLd,
  buildWebPageJsonLd,
  createPublicMetadata,
} from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  title: "Usluge",
  description:
    "Kompletna ponuda arhitektonske vizuelizacije — renderi, animacije, 360 ture, virtuelno opremanje i adaptacije prostora.",
  path: "/usluge",
});

export default function UslugePage() {
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
          buildFaqJsonLd(SERVICES_PAGE_FAQS),
        ]}
      />
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6 pt-12 md:pt-20">
        <ServicesShowcase />
      </div>
    </>
  );
}
