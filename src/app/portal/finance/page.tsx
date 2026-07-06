import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock, ReceiptText } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  formatBillingMoney,
  type BillingCurrency,
} from "@/lib/billing";
import {
  invoiceCurrencyForBuyer,
  invoiceGrossCentsFromEurCents,
} from "@/lib/invoice-data";
import { buildInvoiceList, type InvoiceDoc } from "@/lib/invoice-list";
import { FinanceInvoicesCell } from "@/components/portal/finance-invoices-cell";

export const metadata: Metadata = {
  title: "Finance",
  description:
    "Overview of payments, invoices, refunds, and financial status for your projects.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type RowStatus = "completed" | "pending" | "failed" | "refunded" | "partial";

type ProjectRow = {
  orderId: string;
  orderNumber: string;
  projectName: string;
  status: RowStatus;
  latestActivity: Date;
  total: CurrencyTotals;
  paid: CurrencyTotals;
  pending: CurrencyTotals;
  invoices: InvoiceDoc[];
};

type CurrencyTotals = { EUR: number };

export default async function FinancePage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const orders = await prisma.order.findMany({
    where: { userId, status: { not: "cancelled" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      projectName: true,
      status: true,
      paymentStatus: true,
      buyerType: true,
      buyerCountryCode: true,
      companyCountryCode: true,
      billingCurrency: true,
      billingVatRate: true,
      billingTotalCents: true,
      totalEur: true,
      totalCents: true,
      createdAt: true,
      updatedAt: true,
      proformaNumber: true,
      proformaIssuedAt: true,
      proformaPdfPath: true,
      invoiceNumber: true,
      invoiceIssuedAt: true,
      invoicePdfPath: true,
      items: {
        select: { productLabel: true },
        orderBy: { id: "asc" },
        take: 1,
      },
      charges: {
        where: { status: { not: "cancelled" } },
        select: {
          id: true,
          reason: true,
          totalCents: true,
          buyerType: true,
          buyerCountryCode: true,
          companyCountryCode: true,
          billingCurrency: true,
          billingVatRate: true,
          billingTotalCents: true,
          status: true,
          createdAt: true,
          paidAt: true,
          invoiceNumber: true,
          invoiceIssuedAt: true,
          invoicePdfPath: true,
        },
      },
      statusEvents: {
        where: { toStatus: "paid" },
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const rows: ProjectRow[] = orders.map((order) => {
    const baseProviderCents = order.totalCents ?? order.totalEur * 100;
    const orderCurrency = invoiceCurrencyForBuyer(order);
    const baseBillingCents =
      order.billingTotalCents ??
      invoiceGrossCentsFromEurCents(baseProviderCents, order);
    const orderPaid = order.paymentStatus === "completed";
    const total = emptyTotals();
    const paid = emptyTotals();
    const pending = emptyTotals();

    addCurrencyTotal(total, orderCurrency, baseBillingCents);
    addCurrencyTotal(orderPaid ? paid : pending, orderCurrency, baseBillingCents);

    for (const charge of order.charges) {
      const chargeBuyer = {
        buyerType: charge.buyerType ?? order.buyerType,
        buyerCountryCode: charge.buyerCountryCode ?? order.buyerCountryCode,
        companyCountryCode:
          charge.companyCountryCode ?? order.companyCountryCode,
        billingCurrency: charge.billingCurrency ?? order.billingCurrency,
        billingVatRate: charge.billingVatRate ?? order.billingVatRate,
      };
      const chargeCurrency = invoiceCurrencyForBuyer(chargeBuyer);
      const chargeBillingCents =
        charge.billingTotalCents ??
        invoiceGrossCentsFromEurCents(charge.totalCents, chargeBuyer);
      addCurrencyTotal(total, chargeCurrency, chargeBillingCents);
      if (charge.status === "paid") {
        addCurrencyTotal(paid, chargeCurrency, chargeBillingCents);
      } else if (charge.status === "pending") {
        addCurrencyTotal(pending, chargeCurrency, chargeBillingCents);
      }
    }

    let status: RowStatus;
    if (order.paymentStatus === "failed") status = "failed";
    else if (order.paymentStatus === "refunded") status = "refunded";
    else if (orderPaid && totalsValue(pending) > 0) status = "partial";
    else if (orderPaid) status = "completed";
    else status = "pending";

    const orderPaidAt = order.statusEvents[0]?.createdAt ?? null;
    const chargeDates = order.charges.map((c) => c.paidAt ?? c.createdAt);
    const latestActivity = maxDate([
      order.updatedAt,
      orderPaidAt,
      ...chargeDates,
    ]);

    const projectName =
      order.projectName ??
      order.items[0]?.productLabel ??
      "Order";

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      projectName,
      status,
      latestActivity,
      total,
      paid,
      pending,
      invoices: buildInvoiceList(order, order.charges),
    };
  });

  rows.sort(
    (a, b) => b.latestActivity.getTime() - a.latestActivity.getTime(),
  );

  const paidTotal = rows.reduce(
    (totals, row) => mergeCurrencyTotals(totals, row.paid),
    emptyTotals(),
  );
  const pendingTotal = rows.reduce(
    (totals, row) => mergeCurrencyTotals(totals, row.pending),
    emptyTotals(),
  );
  const missingInvoiceCount = rows.reduce((count, row) => {
    let missing = 0;
    const order = orders.find((o) => o.id === row.orderId);
    if (!order) return count;
    if (order.paymentStatus === "completed" && !order.invoiceNumber) missing++;
    for (const c of order.charges) {
      if (c.status === "paid" && !c.invoiceNumber) missing++;
    }
    return count + missing;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-foreground md:text-3xl">
            Finance
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of projects, payments, and issued invoices.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={CheckCircle2}
          label="Paid"
          value={formatCurrencyTotals(paidTotal)}
          tone="sage"
        />
        <StatCard
          icon={Clock}
          label="Awaiting payment"
          value={formatCurrencyTotals(pendingTotal)}
        />
        <StatCard
          icon={AlertCircle}
          label="Invoice in preparation"
          value={missingInvoiceCount.toString()}
          tone={missingInvoiceCount > 0 ? "accent" : "neutral"}
        />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 bg-card/40 p-12 text-center">
          <ReceiptText className="mx-auto h-8 w-8 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-medium text-foreground">
            There are no financial transactions yet.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop: zebra-striped table-like grid */}
          <div className="hidden md:block">
            <div className="space-y-1">
              {/* Header */}
              <div className="grid grid-cols-[2fr_8rem_6.5rem_8rem_10rem] items-center gap-4 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Project</span>
                <span className="text-center">Status</span>
                <span>Date</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Invoices</span>
              </div>

              {rows.map((row, idx) => (
                <div
                  key={row.orderId}
                  className={cn(
                    "group relative grid grid-cols-[2fr_8rem_6.5rem_8rem_10rem] items-center gap-4 rounded-lg border border-transparent px-4 py-3 transition-colors hover:border-border/50",
                    idx % 2 === 0 ? "bg-card/60" : "bg-secondary/30",
                  )}
                >
                  <Link
                    href={`/portal/orders/${row.orderId}`}
                    className="absolute inset-0 rounded-lg"
                    aria-label={`Open ${row.orderNumber}`}
                  />
                  <div className="relative pointer-events-none min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {row.projectName}
                    </p>
                    <p className="mt-0.5 font-mono text-[0.72rem] text-muted-foreground">
                      {row.orderNumber}
                    </p>
                  </div>
                  <div className="relative pointer-events-none flex justify-center">
                    <Badge className={statusAccent(row.status)}>
                      {statusLabel(row.status)}
                    </Badge>
                  </div>
                  <p className="relative pointer-events-none text-[0.78rem] text-muted-foreground tabular-nums">
                    {formatDate(row.latestActivity)}
                  </p>
                  <div className="relative pointer-events-none text-right">
                    <p className="text-sm font-semibold text-foreground tabular-nums">
                      {formatCurrencyTotals(row.total)}
                    </p>
                    {totalsValue(row.pending) > 0 && row.status !== "pending" && (
                      <p className="mt-0.5 text-[0.62rem] text-accent">
                        {formatCurrencyTotals(row.pending)} pending
                      </p>
                    )}
                  </div>
                  <div className="relative flex justify-end pointer-events-none [&>*]:pointer-events-auto">
                    <FinanceInvoicesCell
                      invoices={row.invoices}
                      status={row.status}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: card stack */}
          <div className="space-y-3 md:hidden">
            {rows.map((row) => (
              <div
                key={row.orderId}
                className="relative rounded-lg border border-border/40 bg-card/80 p-4"
              >
                <Link
                  href={`/portal/orders/${row.orderId}`}
                  className="absolute inset-0 rounded-lg"
                  aria-label={`Open ${row.orderNumber}`}
                />
                <div className="relative pointer-events-none flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {row.projectName}
                    </p>
                    <p className="mt-0.5 font-mono text-[0.72rem] text-muted-foreground">
                      {row.orderNumber}
                    </p>
                  </div>
                  <Badge className={statusAccent(row.status)}>
                    {statusLabel(row.status)}
                  </Badge>
                </div>
                <div className="relative pointer-events-none mt-4 flex items-end justify-between gap-3">
                  <p className="text-[0.72rem] text-muted-foreground">
                    {formatDate(row.latestActivity)}
                  </p>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground tabular-nums">
                      {formatCurrencyTotals(row.total)}
                    </p>
                    {totalsValue(row.pending) > 0 && row.status !== "pending" && (
                      <p className="mt-0.5 text-[0.62rem] text-accent">
                        {formatCurrencyTotals(row.pending)} pending
                      </p>
                    )}
                  </div>
                </div>
                <div className="relative mt-3 flex justify-end pointer-events-none [&>*]:pointer-events-auto">
                  <FinanceInvoicesCell
                    invoices={row.invoices}
                    status={row.status}
                  />
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
      ? "bg-accent/10 text-foreground"
      : tone === "accent"
        ? "bg-accent/10 text-accent"
        : "bg-secondary/70 text-muted-foreground";

  return (
    <div className="rounded-lg border border-border/40 bg-card/80 p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}
        >
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

function statusLabel(status: RowStatus): string {
  if (status === "completed") return "Paid";
  if (status === "partial") return "Additional payment pending";
  if (status === "failed") return "Failed";
  if (status === "refunded") return "Refunded";
  return "Awaiting payment";
}

function statusAccent(status: RowStatus): string {
  if (status === "completed") {
    return "bg-accent/15 text-foreground";
  }
  if (status === "failed" || status === "refunded") {
    return "bg-destructive/10 text-destructive";
  }
  return "bg-accent/15 text-accent";
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function maxDate(dates: Array<Date | null>): Date {
  let best: Date | null = null;
  for (const d of dates) {
    if (!d) continue;
    if (!best || d.getTime() > best.getTime()) best = d;
  }
  return best ?? new Date(0);
}

function emptyTotals(): CurrencyTotals {
  return { EUR: 0 };
}

function addCurrencyTotal(
  totals: CurrencyTotals,
  _currency: BillingCurrency,
  cents: number,
): void {
  totals.EUR += cents;
}

function mergeCurrencyTotals(
  base: CurrencyTotals,
  next: CurrencyTotals,
): CurrencyTotals {
  base.EUR += next.EUR;
  return base;
}

function totalsValue(totals: CurrencyTotals): number {
  return totals.EUR;
}

function formatCurrencyTotals(totals: CurrencyTotals): string {
  const parts: string[] = [];
  if (totals.EUR > 0) parts.push(formatBillingMoney(totals.EUR, "EUR"));
  return parts.length > 0 ? parts.join(" / ") : "0";
}
