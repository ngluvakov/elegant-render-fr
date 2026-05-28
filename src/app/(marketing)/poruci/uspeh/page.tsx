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
import { formatBillingMoney } from "@/lib/billing";
import { IMPRINT, formatAddress } from "@/lib/content/site";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ oid?: string }>;
};

function row(label: string, value: string | null | undefined) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
      <dt className="min-w-[220px] text-sm text-muted-foreground">{label}</dt>
      <dd className="break-all font-mono text-sm text-foreground">
        {value || "—"}
      </dd>
    </div>
  );
}

export default async function NestpaySuccessPage({ searchParams }: PageProps) {
  const { oid } = await searchParams;
  if (!oid) notFound();

  const order = await prisma.order.findFirst({
    where: { paymentId: oid, paymentProvider: "nestpay" },
    select: {
      id: true,
      orderNumber: true,
      totalEur: true,
      totalCents: true,
      billingCurrency: true,
      billingTotalCents: true,
      nestpayTransId: true,
      nestpayAuthCode: true,
      nestpayProcReturnCode: true,
      nestpayMdStatus: true,
      nestpayHostRefNum: true,
      nestpayExtraTrxDate: true,
      nestpayChargedAmountCents: true,
      nestpayChargedCurrency: true,
      paymentStatus: true,
      paymentId: true,
    },
  });
  if (!order) notFound();

  const billingCurrency = order.billingCurrency ?? "EUR";
  const billingTotalCents =
    order.billingTotalCents ?? (order.totalCents ?? order.totalEur * 100);
  const billingLabel = formatBillingMoney(billingTotalCents, billingCurrency);
  const chargedRsdLabel =
    order.nestpayChargedAmountCents != null
      ? formatBillingMoney(order.nestpayChargedAmountCents, "RSD")
      : null;
  const trxDateLabel = order.nestpayExtraTrxDate
    ? order.nestpayExtraTrxDate.toLocaleString("sr-Latn-RS", { hour12: false })
    : null;
  const response =
    order.nestpayProcReturnCode === "00" ? "Approved" : order.paymentStatus;

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

      <section className="rounded-2xl border border-border/60 bg-card/80 p-6 md:p-8">
        <h2 className="text-lg font-semibold text-foreground">
          Podaci o porudžbini
        </h2>
        <dl className="mt-4 space-y-2">
          {row("Broj porudžbine", order.orderNumber)}
          {row("Ukupno za naplatu", billingLabel)}
          {chargedRsdLabel && billingCurrency === "EUR"
            ? row(
                "Naplaćeno u RSD (Izjava o konverziji)",
                chargedRsdLabel,
              )
            : null}
        </dl>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/80 p-6 md:p-8">
        <h2 className="text-lg font-semibold text-foreground">
          Podaci o transakciji
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">
          Parametri propisani standardom rada e-commerce prodajnog mesta
          (Banca Intesa, poglavlje 2.7).
        </p>
        <dl className="mt-4 space-y-2">
          {row("Broj narudžbine (order ID)", order.paymentId)}
          {row("Autorizacioni kod (AuthCode)", order.nestpayAuthCode)}
          {row("Identifikator transakcije (TransId)", order.nestpayTransId)}
          {row("Status transakcije (Response)", response)}
          {row("Kod statusa (ProcReturnCode)", order.nestpayProcReturnCode)}
          {row("Statusni kod 3D transakcije (mdStatus)", order.nestpayMdStatus)}
          {row("Datum transakcije (EXTRA.TRXDATE)", trxDateLabel)}
          {row("Host ref. broj (HostRefNum)", order.nestpayHostRefNum)}
        </dl>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/80 p-6 md:p-8">
        <h2 className="text-lg font-semibold text-foreground">Trgovac</h2>
        <p className="mt-3 text-sm text-foreground">
          <strong>{IMPRINT.shortName}</strong>
          <br />
          {IMPRINT.legalName}
          <br />
          PIB {IMPRINT.taxId} · MB {IMPRINT.registryNumber}
          <br />
          {formatAddress()}
          <br />
          {IMPRINT.email}
        </p>
      </section>

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
