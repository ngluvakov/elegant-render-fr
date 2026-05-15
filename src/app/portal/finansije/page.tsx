import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  ReceiptText,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatEur } from "@/lib/catalog/calculate";

export const metadata: Metadata = {
  title: "Finansije",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

type FinanceTransaction = {
  id: string;
  kind: "order" | "charge";
  title: string;
  orderId: string;
  orderNumber: string;
  amountCents: number;
  paymentStatus: PaymentStatus;
  paymentProvider: string | null;
  createdAt: Date;
  paidAt: Date | null;
  invoiceNumber: string | null;
  invoiceIssuedAt: Date | null;
  invoiceHref: string | null;
  proformaNumber?: string | null;
  proformaHref?: string | null;
};

export default async function FinancePage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const [orders, charges] = await Promise.all([
    prisma.order.findMany({
      where: { userId, status: { not: "cancelled" } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        projectName: true,
        status: true,
        paymentStatus: true,
        paymentProvider: true,
        totalEur: true,
        totalCents: true,
        createdAt: true,
        updatedAt: true,
        invoiceNumber: true,
        invoiceIssuedAt: true,
        invoicePdfPath: true,
        proformaNumber: true,
        proformaPdfPath: true,
        items: {
          select: { productLabel: true, categoryLabel: true },
          orderBy: { id: "asc" },
          take: 1,
        },
        statusEvents: {
          where: { toStatus: "paid" },
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.orderCharge.findMany({
      where: {
        status: { not: "cancelled" },
        order: { userId },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        reason: true,
        totalCents: true,
        status: true,
        paymentStatus: true,
        paymentProvider: true,
        createdAt: true,
        paidAt: true,
        invoiceNumber: true,
        invoiceIssuedAt: true,
        invoicePdfPath: true,
        items: {
          select: { label: true },
          orderBy: { id: "asc" },
          take: 1,
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            projectName: true,
            items: {
              select: { productLabel: true },
              orderBy: { id: "asc" },
              take: 1,
            },
          },
        },
      },
    }),
  ]);

  const transactions: FinanceTransaction[] = [
    ...orders.map((order) => {
      const firstItem = order.items[0];
      const amountCents = order.totalCents ?? order.totalEur * 100;
      return {
        id: order.id,
        kind: "order" as const,
        title: order.projectName ?? firstItem?.productLabel ?? "Porudžbina",
        orderId: order.id,
        orderNumber: order.orderNumber,
        amountCents,
        paymentStatus: order.paymentStatus,
        paymentProvider: order.paymentProvider,
        createdAt: order.createdAt,
        paidAt: order.statusEvents[0]?.createdAt ?? null,
        invoiceNumber: order.invoiceNumber,
        invoiceIssuedAt: order.invoiceIssuedAt,
        invoiceHref:
          order.invoiceNumber && order.invoicePdfPath
            ? `/api/portal/invoice/${order.id}`
            : null,
        proformaNumber: order.proformaNumber,
        proformaHref:
          order.proformaNumber && order.proformaPdfPath
            ? `/api/portal/proforma/${order.id}`
            : null,
      };
    }),
    ...charges.map((charge) => {
      const firstChargeItem = charge.items[0];
      const firstOrderItem = charge.order.items[0];
      const title =
        charge.reason ??
        firstChargeItem?.label ??
        `Doplata za ${charge.order.projectName ?? firstOrderItem?.productLabel ?? "porudžbinu"}`;
      return {
        id: charge.id,
        kind: "charge" as const,
        title,
        orderId: charge.order.id,
        orderNumber: charge.order.orderNumber,
        amountCents: charge.totalCents,
        paymentStatus: charge.paymentStatus,
        paymentProvider: charge.paymentProvider,
        createdAt: charge.createdAt,
        paidAt: charge.paidAt,
        invoiceNumber: charge.invoiceNumber,
        invoiceIssuedAt: charge.invoiceIssuedAt,
        invoiceHref:
          charge.invoiceNumber && charge.invoicePdfPath
            ? `/api/portal/charge-invoice/${charge.id}`
            : null,
      };
    }),
  ].sort((a, b) => {
    const aDate = a.paidAt ?? a.createdAt;
    const bDate = b.paidAt ?? b.createdAt;
    return bDate.getTime() - aDate.getTime();
  });

  const paidCents = transactions
    .filter((tx) => tx.paymentStatus === "completed")
    .reduce((sum, tx) => sum + tx.amountCents, 0);
  const pendingCents = transactions
    .filter((tx) => tx.paymentStatus === "pending")
    .reduce((sum, tx) => sum + tx.amountCents, 0);
  const missingInvoiceCount = transactions.filter(
    (tx) => tx.paymentStatus === "completed" && !tx.invoiceHref,
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-foreground md:text-3xl">
            Finansije
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pregled uplata, doplata i izdatih računa.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={CheckCircle2}
          label="Plaćeno"
          value={formatEur(paidCents / 100)}
          tone="sage"
        />
        <StatCard
          icon={Clock}
          label="Čeka uplatu"
          value={formatEur(pendingCents / 100)}
        />
        <StatCard
          icon={AlertCircle}
          label="Račun u pripremi"
          value={missingInvoiceCount.toString()}
          tone={missingInvoiceCount > 0 ? "accent" : "neutral"}
        />
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-12 text-center">
          <ReceiptText className="mx-auto h-8 w-8 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-medium text-foreground">
            Još nema finansijskih transakcija.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-sm">
              <thead className="text-left text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border/60">
                  <th className="px-3 py-3">Transakcija</th>
                  <th className="px-3 py-3">Porudžbina</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Datum</th>
                  <th className="px-3 py-3 text-right">Iznos</th>
                  <th className="px-3 py-3 text-right">Dokument</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {transactions.map((tx) => (
                  <tr key={`${tx.kind}:${tx.id}`} className="align-top">
                    <td className="px-3 py-4">
                      <div className="flex items-start gap-2">
                        <TransactionIcon kind={tx.kind} />
                        <div>
                          <p className="font-medium text-foreground">
                            {tx.title}
                          </p>
                          <p className="mt-0.5 text-[0.72rem] text-muted-foreground">
                            {tx.kind === "order" ? "Porudžbina" : "Doplata"}{" "}
                            {providerLabel(tx.paymentProvider)
                              ? `· ${providerLabel(tx.paymentProvider)}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <Link
                        href={`/portal/porudzbine/${tx.orderId}`}
                        className="font-mono text-[0.78rem] text-foreground underline-offset-4 hover:underline"
                      >
                        {tx.orderNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-4">
                      <Badge className={paymentStatusAccent(tx.paymentStatus)}>
                        {paymentStatusLabel(tx.paymentStatus)}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-[0.82rem] text-muted-foreground">
                      {formatDate(tx.paidAt ?? tx.createdAt)}
                    </td>
                    <td className="px-3 py-4 text-right font-semibold text-foreground tabular-nums">
                      {formatEur(tx.amountCents / 100)}
                    </td>
                    <td className="px-3 py-4 text-right">
                      <DocumentAction tx={tx} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {transactions.map((tx) => (
              <div
                key={`${tx.kind}:${tx.id}`}
                className="rounded-2xl border border-border/40 bg-card/80 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2">
                    <TransactionIcon kind={tx.kind} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {tx.title}
                      </p>
                      <Link
                        href={`/portal/porudzbine/${tx.orderId}`}
                        className="mt-0.5 block font-mono text-[0.72rem] text-muted-foreground"
                      >
                        {tx.orderNumber}
                      </Link>
                    </div>
                  </div>
                  <Badge className={paymentStatusAccent(tx.paymentStatus)}>
                    {paymentStatusLabel(tx.paymentStatus)}
                  </Badge>
                </div>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div className="text-[0.72rem] text-muted-foreground">
                    <p>{formatDate(tx.paidAt ?? tx.createdAt)}</p>
                    {providerLabel(tx.paymentProvider) && (
                      <p>{providerLabel(tx.paymentProvider)}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {formatEur(tx.amountCents / 100)}
                    </p>
                    <div className="mt-2">
                      <DocumentAction tx={tx} compact />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
  tone?: "neutral" | "sage" | "accent";
}) {
  const toneClass =
    tone === "sage"
      ? "bg-[color:var(--color-sage)]/10 text-[color:var(--color-sage-deep)]"
      : tone === "accent"
        ? "bg-accent/10 text-accent"
        : "bg-secondary/70 text-muted-foreground";

  return (
    <div className="rounded-2xl border border-border/40 bg-card/80 p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xl font-bold text-foreground tabular-nums">
            {value}
          </p>
          <p className="text-[0.72rem] text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

function TransactionIcon({ kind }: { kind: FinanceTransaction["kind"] }) {
  const Icon = kind === "order" ? ReceiptText : FileText;
  return (
    <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-secondary/70 text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

function DocumentAction({
  tx,
  compact,
}: {
  tx: FinanceTransaction;
  compact?: boolean;
}) {
  if (tx.invoiceHref) {
    return (
      <a
        href={tx.invoiceHref}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-[0.78rem] font-medium text-background transition hover:opacity-90"
      >
        <Download className="h-3.5 w-3.5" />
        {compact ? "PDF" : `Račun ${tx.invoiceNumber}`}
      </a>
    );
  }

  if (tx.proformaHref) {
    return (
      <a
        href={tx.proformaHref}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[0.78rem] font-medium text-foreground transition hover:bg-secondary"
      >
        <Download className="h-3.5 w-3.5" />
        {compact ? "Predračun" : `Predračun ${tx.proformaNumber}`}
      </a>
    );
  }

  if (tx.paymentStatus === "completed") {
    return (
      <span className="text-[0.78rem] text-muted-foreground">
        Račun se priprema
      </span>
    );
  }

  return (
    <span className="text-[0.78rem] text-muted-foreground">
      Posle plaćanja
    </span>
  );
}

function paymentStatusLabel(status: PaymentStatus): string {
  if (status === "completed") return "Plaćeno";
  if (status === "failed") return "Neuspelo";
  if (status === "refunded") return "Refundirano";
  return "Čeka uplatu";
}

function paymentStatusAccent(status: PaymentStatus): string {
  if (status === "completed") {
    return "bg-[color:var(--color-sage)]/20 text-[color:var(--color-sage-deep)]";
  }
  if (status === "failed" || status === "refunded") {
    return "bg-destructive/10 text-destructive";
  }
  return "bg-accent/15 text-accent";
}

function providerLabel(provider: string | null): string {
  if (provider === "paypal") return "PayPal";
  if (provider === "card_mock") return "Kartica";
  if (provider === "wire_transfer") return "Uplata na račun";
  return "";
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("sr-Latn-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
