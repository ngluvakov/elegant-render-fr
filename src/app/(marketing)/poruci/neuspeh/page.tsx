/**
 * /poruci/neuspeh — payment failure / decline screen.
 *
 * Mirror of /poruci/uspeh but with the failure copy mandated by EPM
 * standard 2.7 ("Plaćanje neuspešno — račun Vaše platne kartice nije
 * zadužen.") and a retry CTA back to the order's payment step. The
 * same 7 transaction parameters are surfaced for auditability — the
 * bank requires them on both success and failure responses.
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

export default async function NestpayFailurePage({ searchParams }: PageProps) {
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
      nestpayResponseRaw: true,
      paymentStatus: true,
      paymentId: true,
    },
  });
  if (!order) notFound();

  const billingCurrency = order.billingCurrency ?? "EUR";
  const billingTotalCents =
    order.billingTotalCents ?? (order.totalCents ?? order.totalEur * 100);
  const billingLabel = formatBillingMoney(billingTotalCents, billingCurrency);
  const trxDateLabel = order.nestpayExtraTrxDate
    ? order.nestpayExtraTrxDate.toLocaleString("sr-Latn-RS", { hour12: false })
    : null;

  const rawResponse =
    order.nestpayResponseRaw && typeof order.nestpayResponseRaw === "object"
      ? (order.nestpayResponseRaw as Record<string, unknown>)
      : null;
  const response = rawResponse?.Response ? String(rawResponse.Response) : null;
  const errMsg =
    rawResponse?.ErrMsg
      ? String(rawResponse.ErrMsg)
      : rawResponse?.mdErrorMsg
        ? String(rawResponse.mdErrorMsg)
        : null;

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
          Vaša porudžbina je sačuvana i možete pokušati ponovo. Najčešći
          razlozi su pogrešno unet 3D Secure kod, blokada od strane banke
          izdavaoca kartice, ili nedovoljna sredstva.
        </p>
        {errMsg && (
          <p className="mt-3 rounded-lg border border-destructive/20 bg-background/40 px-3 py-2 text-xs text-muted-foreground">
            <strong>Poruka banke:</strong> {errMsg}
          </p>
        )}
      </div>

      <section className="rounded-2xl border border-border/60 bg-card/80 p-6 md:p-8">
        <h2 className="text-lg font-semibold text-foreground">
          Podaci o porudžbini
        </h2>
        <dl className="mt-4 space-y-2">
          {row("Broj porudžbine", order.orderNumber)}
          {row("Iznos koji ste pokušali da platite", billingLabel)}
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
          {row("Status transakcije (Response)", response ?? order.paymentStatus)}
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
