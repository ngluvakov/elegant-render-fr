import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NewOrderFromQuote } from "./new-order-from-quote";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";

export const metadata: Metadata = {
  title: "Nova porudžbina",
  description:
    "Pokrenite novu porudžbinu iz portala i izaberite usluge prema važećem cenovniku.",
  robots: { index: false, follow: false },
};

export default async function NovaPorudzbina() {
  const session = await auth();
  if (!session?.user?.id) redirect("/prijava?callbackUrl=/portal/nova-porudzbina");
  const pricingCatalog = await getPublishedPricingCatalog();

  return (
    <NewOrderFromQuote
      userId={session.user.id}
      pricingCatalog={pricingCatalog}
    />
  );
}
