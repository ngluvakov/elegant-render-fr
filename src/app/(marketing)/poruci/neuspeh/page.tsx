/**
 * /poruci/neuspeh — payment failure / decline screen.
 *
 * Mirror of /poruci/uspeh but with the failure copy mandated by EPM
 * standard 2.7 ("Plaćanje neuspešno — račun Vaše platne kartice nije
 * zadužen.") and a retry CTA back to the order's payment step. The
 * same 7 transaction parameters are surfaced for auditability — the
 * bank requires them on both success and failure responses.
 *
 * No paymentStatus guard: the failure screen is intentionally shown for
 * declined / error / refunded states — anything other than completed.
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

export default async function NestpayFailurePage({ searchParams }: PageProps) {
  const { oid } = await searchParams;
  if (!oid) notFound();

  const order = await prisma.order.findFirst({
    where: { paymentId: oid, paymentProvider: "nestpay" },
    select: {
      id: true,
    },
  });
  if (!order) notFound();

  const receipt = await getNestpayReceiptData(order.id);
  if (!receipt) notFound();

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
          Neuspešno plaćanje
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          Plaćanje neuspešno — račun Vaše platne kartice nije zadužen.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Vaša porudžbina je sačuvana i možete pokušati ponovo. Najčešći uzrok
          je pogrešno unet broj kartice, datum isteka ili sigurnosni kod. U
          slučaju uzastopnih grešaka, pozovite Vašu banku.
        </p>
      </div>

      <NestpayReceipt data={receipt} variant="failure" />

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/portal/porudzbine/${order.id}`}
          className={buttonVariants({ variant: "accent", size: "lg" })}
        >
          Pokušajte ponovo iz portala
        </Link>
        <Link
          href="/poruci"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          Nazad na checkout
        </Link>
      </div>
    </main>
  );
}
