import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SectionKicker } from "@/components/brand/section-kicker";
import { CheckoutWizard } from "./checkout-wizard";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";
import { getPublicCountryCode } from "@/lib/catalog/public-currency-server";
import { getDisplayCurrencyForCountry } from "@/lib/catalog/display-currency";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import type { BuyerInfoState } from "./checkout-context";

export const metadata: Metadata = {
  title: "Porudžbina",
  description:
    "Završite porudžbinu, proverite podatke za kupca i pošaljite zahtev timu Elegant Render.",
  robots: NO_INDEX_ROBOTS,
};

export default async function PoruciPage() {
  const [session, pricingCatalog, publicCountryCode] = await Promise.all([
    auth(),
    getPublishedPricingCatalog(),
    getPublicCountryCode(),
  ]);
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          billingBuyerType: true,
          billingCountryCode: true,
          billingCompanyName: true,
          billingCompanyTaxId: true,
          billingCompanyMb: true,
          billingCompanyAddress: true,
        },
      })
    : null;

  const initialCountryCode =
    user?.billingCountryCode ?? publicCountryCode ?? "";
  const initialBuyerInfo: BuyerInfoState = {
    buyerType: user?.billingBuyerType ?? "individual",
    buyerCountryCode: initialCountryCode,
    companyName: user?.billingCompanyName ?? "",
    companyTaxId: user?.billingCompanyTaxId ?? "",
    companyMb: user?.billingCompanyMb ?? "",
    companyAddress: user?.billingCompanyAddress ?? "",
    companyCountryCode:
      user?.billingBuyerType === "company_foreign" ? initialCountryCode : "",
  };
  const displayCurrency = initialCountryCode
    ? getDisplayCurrencyForCountry(initialCountryCode)
    : getDisplayCurrencyForCountry(publicCountryCode);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 md:py-24">
      <div className="mb-10 text-center">
        <SectionKicker align="center">Porudžbina</SectionKicker>
        <h1 className="mt-4 text-3xl text-foreground md:text-4xl">
          Završite porudžbinu
        </h1>
      </div>

      <CheckoutWizard
        userId={session?.user?.id ?? null}
        userName={session?.user?.name ?? ""}
        userEmail={session?.user?.email ?? ""}
        pricingCatalog={pricingCatalog}
        displayCurrency={displayCurrency}
        initialBuyerInfo={initialBuyerInfo}
      />
    </div>
  );
}
