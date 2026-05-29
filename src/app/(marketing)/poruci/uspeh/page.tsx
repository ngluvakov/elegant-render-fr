/**
 * /poruci/uspeh — payment success confirmation screen.
 *
 * Customers land here after the Nestpay HPP redirect resolves to
 * Approved. The bank's transaction parameters (the 7 fields EPM
 * standard 2.7 requires) are read from the persisted Order snapshot,
 * not from the URL — the URL only carries the oid for lookup.
 *
 * Server-rendered: no auth gate. The order is looked up by oid; anyone
 * who knows the oid can see the receipt. The oid is the bank-facing
 * id and was never broadcast — they had to complete the flow to know
 * it. Same trust model as PayPal's return URL.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { getNestpayReceiptData } from "@/lib/nestpay/receipt-data";
import { NestpayReceipt } from "@/components/marketing/nestpay-receipt";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ oid?: string }>;
};

export default async function NestpaySuccessPage({ searchParams }: PageProps) {
  const { oid } = await searchParams;
  if (!oid) notFound();

  const order = await prisma.order.findFirst({
    where: { paymentId: oid, paymentProvider: "nestpay" },
    select: {
      id: true,
      paymentStatus: true,
    },
  });
  if (!order) notFound();
  if (order.paymentStatus !== "completed") notFound();

  const receipt = await getNestpayReceiptData(order.id);
  if (!receipt) notFound();

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          Uspešno plaćanje
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          Uspešno ste izvršili plaćanje — račun Vaše platne kartice je zadužen.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Hvala vam na poverenju. Potvrda sa svim parametrima transakcije
          poslata je na vašu email adresu. Status porudžbine možete pratiti u
          portalu.
        </p>
      </div>

      <NestpayReceipt data={receipt} variant="success" />

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/portal/porudzbine/${order.id}`}
          className={buttonVariants({ variant: "accent", size: "lg" })}
        >
          Otvorite porudžbinu u portalu
        </Link>
        <Link
          href="/portal"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          Idite u portal
        </Link>
      </div>
    </main>
  );
}
