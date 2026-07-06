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
  title: "Checkout",
  description:
    "Complete your order, confirm your details and pay securely through PayPal.",
  robots: NO_INDEX_ROBOTS,
};

export default async function CheckoutPage() {
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
    companyAddress: user?.billingCompanyAddress ?? "",
    companyCountryCode:
      user?.billingBuyerType === "business" ? initialCountryCode : "",
  };
  // Display currency is geo-derived only — it must match the charge
  // snapshot createOrder locks server-side from the same geo header
  // (WYSIWYG: what this page shows is what PayPal charges).
  const displayCurrency = getDisplayCurrencyForCountry(publicCountryCode);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 md:py-24">
      <div className="mb-10 text-center">
        <SectionKicker align="center">Checkout</SectionKicker>
        <h1 className="mt-4 text-3xl text-foreground md:text-4xl">
          Complete your order
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
