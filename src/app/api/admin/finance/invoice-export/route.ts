/**
 * GET /api/admin/finance/invoice-export — CSV export of issued invoices
 * for a date range. Designed for the accountant's monthly PDV input.
 *
 * Query params:
 *   from=YYYY-MM-DD  (inclusive, start of day in Belgrade time)
 *   to=YYYY-MM-DD    (inclusive, end of day in Belgrade time)
 *
 * Constraints:
 *   - admin only (requireAdmin)
 *   - from <= to
 *   - range capped at 366 days so a fat-finger can't pull the full
 *     history in one shot
 *
 * Format: RFC 4180-ish CSV with a BOM prefix so Excel opens UTF-8
 * correctly (Đ/Ć/Š/Ž/Č render right). CRLF line endings, fields
 * quoted only when they contain `,` `"` or a newline.
 *
 * Each issued Order yields one row. Pre-A.2-era orders without an
 * invoiceNumber are excluded so the export only carries documents
 * that legally exist as faktura.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin-auth";
import { recordAuditLog } from "@/lib/audit";
import {
  invoiceCurrencyForBuyer,
  invoiceGrossCentsFromEurCents,
  invoiceVatRateForBuyer,
} from "@/lib/invoice-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 366;

export async function GET(request: Request) {
  let admin;
  try {
    admin = await requirePermission("FINANCE_VIEW");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const fromRaw = searchParams.get("from") ?? "";
  const toRaw = searchParams.get("to") ?? "";

  if (!ISO_DATE_RE.test(fromRaw) || !ISO_DATE_RE.test(toRaw)) {
    return NextResponse.json(
      { error: "from i to moraju biti u formatu YYYY-MM-DD" },
      { status: 400 },
    );
  }

  const from = new Date(`${fromRaw}T00:00:00.000Z`);
  const to = new Date(`${toRaw}T23:59:59.999Z`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: "Neispravan datum" }, { status: 400 });
  }
  if (from > to) {
    return NextResponse.json(
      { error: "from mora biti pre ili isti kao to" },
      { status: 400 },
    );
  }
  const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  if (days > MAX_RANGE_DAYS) {
    return NextResponse.json(
      { error: `Opseg veći od ${MAX_RANGE_DAYS} dana — suzite filter.` },
      { status: 400 },
    );
  }

  const orders = await prisma.order.findMany({
    where: {
      invoiceIssuedAt: { gte: from, lte: to },
      invoiceNumber: { not: null },
    },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { invoiceIssuedAt: "asc" },
  });

  const header = [
    "Broj fakture",
    "Datum izdavanja",
    "Datum prometa",
    "Broj porudžbine",
    "Kupac",
    "VAT ID",
    "Država",
    "Tip kupca",
    "Valuta",
    "Neto (valuta)",
    "PDV (valuta)",
    "Bruto (valuta)",
    "Bruto (EUR)",
    "Status plaćanja",
    "Payment provider",
    "Email",
  ];

  const lines: string[] = [header.map(csvField).join(",")];

  for (const order of orders) {
    const currency = invoiceCurrencyForBuyer(order);
    const vatRate = invoiceVatRateForBuyer(order);
    const grossCents =
      order.billingTotalCents ??
      invoiceGrossCentsFromEurCents(
        order.totalCents ?? order.totalEur * 100,
        order,
      );
    const netCents =
      vatRate > 0 ? Math.round(grossCents / (1 + vatRate)) : grossCents;
    const vatCents = grossCents - netCents;
    const grossEur = currency === "EUR" ? grossCents / 100 : null;

    const buyerName =
      order.buyerType === "individual"
        ? (order.user.name ?? order.user.email ?? "—")
        : (order.companyName ?? "—");

    const issueDate = order.invoiceIssuedAt
      ? formatIsoDate(order.invoiceIssuedAt)
      : "";
    // Single-invoice flow per Order: issue and service date coincide.
    const serviceDate = issueDate;

    const row = [
      order.invoiceNumber ?? "",
      issueDate,
      serviceDate,
      order.orderNumber,
      buyerName,
      order.companyTaxId ?? "",
      order.buyerCountryCode ?? order.companyCountryCode ?? "",
      buyerTypeLabel(order.buyerType),
      currency,
      formatMoneyNumber(netCents, currency),
      formatMoneyNumber(vatCents, currency),
      formatMoneyNumber(grossCents, currency),
      grossEur != null ? formatNumber(grossEur, 0) : "",
      order.paymentStatus,
      order.paymentProvider ?? "",
      order.user.email ?? "",
    ];
    lines.push(row.map(csvField).join(","));
  }

  await recordAuditLog({
    action: "invoice.export",
    entityType: "Admin",
    entityId: admin.id,
    metadata: { from: fromRaw, to: toRaw, count: orders.length },
  });

  // BOM prefix tells Excel "this is UTF-8" — without it Cyrillic /
  // Serbian Latin diacritics get mojibake'd on open.
  const csv = "﻿" + lines.join("\r\n") + "\r\n";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="elegant-render-racuni-${fromRaw}-${toRaw}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

function csvField(value: string): string {
  if (/[,"\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatNumber(n: number, decimals: number): string {
  // CSV typically uses `.` decimal separator regardless of locale —
  // that matches Excel's auto-import on en-US / sr-Latn alike.
  return n.toFixed(decimals);
}

function formatMoneyNumber(cents: number, _currency: "EUR"): string {
  void _currency;
  return formatNumber(cents / 100, 0);
}

function formatIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buyerTypeLabel(t: string): string {
  if (t === "business") return "Firma";
  return "Fizičko lice";
}
