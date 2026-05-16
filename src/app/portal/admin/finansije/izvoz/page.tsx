/**
 * Admin invoice export — date-range preview + CSV download.
 *
 * The page itself is a server-rendered preview (top 20 rows + totals)
 * driven by `?from=...&to=...` search params. The "Preuzmi CSV" button
 * is just a link to /api/admin/finansije/invoice-export with the same
 * params — that's where the CSV stream lives.
 *
 * Defaults to the current month when no params are present, which is
 * the common monthly-PDV-prijava use case.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Izvoz računa — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ from?: string; to?: string }>;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function defaultRange(): { from: string; to: string } {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const first = new Date(Date.UTC(year, month, 1));
  const last = new Date(Date.UTC(year, month + 1, 0));
  return {
    from: first.toISOString().slice(0, 10),
    to: last.toISOString().slice(0, 10),
  };
}

export default async function InvoiceExportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePermission("FINANCE_VIEW");
  const params = await searchParams;
  const fallback = defaultRange();
  const from =
    params.from && ISO_DATE_RE.test(params.from) ? params.from : fallback.from;
  const to =
    params.to && ISO_DATE_RE.test(params.to) ? params.to : fallback.to;

  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T23:59:59.999Z`);
  const validRange = !Number.isNaN(fromDate.getTime()) && fromDate <= toDate;

  const orders = validRange
    ? await prisma.order.findMany({
        where: {
          invoiceIssuedAt: { gte: fromDate, lte: toDate },
          invoiceNumber: { not: null },
        },
        select: {
          id: true,
          invoiceNumber: true,
          invoiceIssuedAt: true,
          orderNumber: true,
          totalEur: true,
          buyerType: true,
          companyName: true,
          companyTaxId: true,
          paymentStatus: true,
          user: { select: { name: true, email: true } },
        },
        orderBy: { invoiceIssuedAt: "asc" },
      })
    : [];

  const totals = orders.reduce(
    (acc, o) => {
      acc.count += 1;
      acc.gross += o.totalEur;
      return acc;
    },
    { count: 0, gross: 0 },
  );

  const downloadHref = `/api/admin/finansije/invoice-export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

  return (
    <div className="mx-auto w-full max-w-[min(96vw,1400px)] px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            Izvoz računa
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Mesečni pregled izdatih faktura za knjigovođu. Po default-u
            prikazuje tekući mesec; promenite opseg ispod i preuzmite CSV.
          </p>
        </div>
        <Link
          href="/portal/admin/revizije?action=invoice.export"
          className="text-[0.78rem] text-muted-foreground underline-offset-4 hover:underline"
        >
          Istorija izvoza →
        </Link>
      </div>

      {/* Date range form. GET-style submit so URL params drive the page —
          admin can bookmark a specific range or share it. */}
      <form
        action="/portal/admin/finansije/izvoz"
        method="get"
        className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-border/40 bg-card/80 p-5"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.78rem] font-medium text-foreground">Od</span>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.78rem] font-medium text-foreground">Do</span>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <button
          type="submit"
          className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
        >
          Primeni filter
        </button>
        <a
          href={downloadHref}
          className="inline-flex items-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
        >
          Preuzmi CSV
        </a>
      </form>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Stat label="Broj računa" value={totals.count.toString()} />
        <Stat
          label="Ukupno bruto (EUR)"
          value={formatEur(totals.gross)}
        />
        <Stat
          label="Opseg"
          value={`${formatHumanDate(fromDate)} – ${formatHumanDate(toDate)}`}
        />
      </div>

      {/* Preview table */}
      <div className="mt-6 -mx-2 overflow-x-auto sm:mx-0">
        {orders.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 bg-card/40 p-12 text-center text-sm text-muted-foreground">
            Nema izdatih računa u izabranom opsegu. Računi pre uvođenja
            automatskog izdavanja (pre Faze A.2) ne ulaze u izvoz.
          </p>
        ) : (
          <>
            <p className="mb-3 text-[0.78rem] text-muted-foreground">
              Pregled top 20 redova. CSV za preuzimanje sadrži sve.
            </p>
            <table className="min-w-full text-sm">
              <thead className="text-left text-[0.72rem] uppercase tracking-[0.16em] text-muted-foreground">
                <tr className="border-b border-border/60">
                  <th className="px-2 py-3">Broj fakture</th>
                  <th className="px-2 py-3">Datum</th>
                  <th className="px-2 py-3">Porudžbina</th>
                  <th className="px-2 py-3">Kupac</th>
                  <th className="px-2 py-3">PIB / VAT</th>
                  <th className="px-2 py-3 text-right">Bruto (EUR)</th>
                  <th className="px-2 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground/85">
                {orders.slice(0, 20).map((order) => {
                  const buyerName =
                    order.buyerType === "individual"
                      ? (order.user.name ?? order.user.email ?? "—")
                      : (order.companyName ?? "—");
                  return (
                    <tr key={order.id} className="align-top">
                      <td className="px-2 py-3 font-mono text-[0.82rem]">
                        {order.invoiceNumber}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-[0.82rem] text-muted-foreground">
                        {order.invoiceIssuedAt
                          ? formatHumanDate(order.invoiceIssuedAt)
                          : "—"}
                      </td>
                      <td className="px-2 py-3 font-mono text-[0.78rem]">
                        <Link
                          href={`/portal/admin/porudzbine/${order.id}`}
                          className="text-foreground underline-offset-4 hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-2 py-3">{buyerName}</td>
                      <td className="px-2 py-3 font-mono text-[0.78rem] text-muted-foreground">
                        {order.companyTaxId ?? "—"}
                      </td>
                      <td className="px-2 py-3 text-right tabular-nums">
                        {formatEur(order.totalEur)}
                      </td>
                      <td className="px-2 py-3 text-[0.78rem] text-muted-foreground">
                        {order.paymentStatus}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/60 p-4">
      <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-foreground tabular-nums">
        {value}
      </p>
    </div>
  );
}

function formatEur(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatHumanDate(d: Date): string {
  return d.toLocaleDateString("sr-Latn-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
