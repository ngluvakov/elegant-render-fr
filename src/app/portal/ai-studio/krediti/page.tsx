import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AiCreditPurchaseClient } from "./purchase-client";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";
import { getPublicCountryCode } from "@/lib/catalog/public-currency-server";
import { getDisplayCurrencyForCountry } from "@/lib/catalog/display-currency";

export const metadata: Metadata = {
  title: "AI krediti",
  description:
    "Kupovina AI kredita za obradu fotografija i praćenje dostupnog stanja.",
  robots: { index: false, follow: false },
};

export default async function AiStudioCreditsPage() {
  const [session, pricingCatalog, publicCountryCode] = await Promise.all([
    auth(),
    getPublishedPricingCatalog(),
    getPublicCountryCode(),
  ]);
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { billingCountryCode: true },
      })
    : null;
  // Match /poruci's resolution order: stored profile country first, then
  // IP geo, then RSD default. Lets logged-in users see the RSD-only pricing even when
  // the IP header is missing (e.g. local dev) and vice versa.
  const countryCode = user?.billingCountryCode ?? publicCountryCode ?? "";
  const displayCurrency = getDisplayCurrencyForCountry(countryCode);
  return (
    <AiCreditPurchaseClient
      pricingCatalog={pricingCatalog}
      displayCurrency={displayCurrency}
    />
  );
}
