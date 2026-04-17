import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NewOrderFromQuote } from "./new-order-from-quote";

export const metadata: Metadata = {
  title: "Nova porudžbina",
  robots: { index: false, follow: false },
};

export default async function NovaPorudzbina() {
  const session = await auth();
  if (!session?.user?.id) redirect("/prijava?callbackUrl=/portal/nova-porudzbina");

  return <NewOrderFromQuote userId={session.user.id} />;
}
