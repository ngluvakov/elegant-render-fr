import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { SectionKicker } from "@/components/brand/section-kicker";
import { CheckoutWizard } from "./checkout-wizard";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";

export const metadata: Metadata = {
  title: "Porudžbina",
  robots: { index: false, follow: false },
};

export default async function PoruciPage() {
  const [session, pricingCatalog] = await Promise.all([
    auth(),
    getPublishedPricingCatalog(),
  ]);

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
      />
    </div>
  );
}
