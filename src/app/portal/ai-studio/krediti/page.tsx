import type { Metadata } from "next";
import { AiCreditPurchaseClient } from "./purchase-client";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";

export const metadata: Metadata = {
  title: "AI krediti",
  description:
    "Kupovina AI kredita za obradu fotografija i praćenje dostupnog stanja.",
  robots: { index: false, follow: false },
};

export default async function AiStudioCreditsPage() {
  const pricingCatalog = await getPublishedPricingCatalog();
  return <AiCreditPurchaseClient pricingCatalog={pricingCatalog} />;
}
