/**
 * invoice-pdf.tsx — Server-side PDF rendering for issued invoices.
 *
 * Single English export-invoice layout (EUR) shared by both buyer
 * types ({individual, business}); business recipients additionally
 * show their tax ID and country.
 *
 * Rendered with @react-pdf/renderer's `renderToBuffer()` so the call
 * site can pipe straight to Supabase.
 *
 * Used by: src/server/actions/issue-invoice.ts
 */

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { IMPRINT, SITE, formatAddress } from "@/lib/content/site";
import { PDF_FONT_FAMILY, ensurePdfFontsRegistered } from "@/lib/pdf-fonts";

export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unitPriceNetCents: number;
  vatRate: number; // 0 or 0.2
};

export type InvoiceData = {
  invoiceNumber: string;
  issueDate: Date;
  serviceDate: Date;
  buyerType: "individual" | "business";
  recipient: {
    name: string;
    address: string;
    taxId?: string | null;
    countryCode?: string | null;
    email?: string | null;
  };
  items: InvoiceLineItem[];
  currency: "EUR";
  paymentMethod: string;
};

const COLORS = {
  fg: "#1c1a19",
  muted: "#6e655d",
  border: "#d8cec4",
  surface: "#fbf6ee",
  accent: "#b88363",
};

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    color: COLORS.fg,
    fontFamily: PDF_FONT_FAMILY,
  },
  h1: {
    fontSize: 20,
    fontFamily: PDF_FONT_FAMILY,
    fontWeight: 700,
    marginBottom: 4,
  },
  number: { fontSize: 10, color: COLORS.muted },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottom: `1pt solid ${COLORS.border}`,
    paddingBottom: 12,
  },
  metaCol: { textAlign: "right" },
  metaPair: { flexDirection: "row", gap: 18, marginTop: 2 },
  metaLabel: { color: COLORS.muted, width: 90, textAlign: "right" },
  metaValue: { fontFamily: PDF_FONT_FAMILY, fontWeight: 700 },
  partyGrid: {
    flexDirection: "row",
    gap: 24,
    marginTop: 18,
  },
  partyBlock: { flex: 1 },
  partyLabel: {
    fontSize: 8,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  partyName: {
    fontFamily: PDF_FONT_FAMILY,
    fontWeight: 700,
    marginBottom: 1,
  },
  partyText: { lineHeight: 1.5 },
  partyMono: {
    fontFamily: PDF_FONT_FAMILY,
    fontSize: 9,
    marginTop: 2,
  },
  itemsTable: { marginTop: 24 },
  thead: {
    flexDirection: "row",
    borderBottom: `1pt solid ${COLORS.border}`,
    paddingBottom: 6,
  },
  th: {
    fontSize: 8,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  trow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottom: `0.5pt solid ${COLORS.border}`,
  },
  tcellDesc: { flex: 4, paddingRight: 8 },
  tcellQty: { width: 36, textAlign: "right" },
  tcellPrice: { width: 70, textAlign: "right" },
  tcellVat: { width: 50, textAlign: "right", color: COLORS.muted },
  tcellTotal: {
    width: 80,
    textAlign: "right",
    fontFamily: PDF_FONT_FAMILY,
    fontWeight: 700,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 240,
    marginTop: 8,
    marginLeft: "auto",
  },
  totalsLabel: { color: COLORS.muted },
  totalsValue: {
    fontFamily: PDF_FONT_FAMILY,
    fontWeight: 700,
    textAlign: "right",
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 240,
    marginTop: 8,
    paddingTop: 8,
    borderTop: `1pt solid ${COLORS.border}`,
    marginLeft: "auto",
  },
  grandLabel: {
    fontSize: 11,
    fontFamily: PDF_FONT_FAMILY,
    fontWeight: 700,
  },
  grandValue: {
    fontSize: 13,
    fontFamily: PDF_FONT_FAMILY,
    fontWeight: 700,
    textAlign: "right",
  },
  notes: {
    marginTop: 28,
    padding: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    lineHeight: 1.5,
  },
  notesLine: { marginBottom: 4 },
  paymentLine: {
    marginTop: 8,
    paddingTop: 6,
    borderTop: `0.5pt dashed ${COLORS.border}`,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    fontSize: 8,
    color: COLORS.muted,
    textAlign: "center",
    borderTop: `0.5pt solid ${COLORS.border}`,
    paddingTop: 8,
  },
});

function formatMoney(cents: number, _currency: "EUR"): string {
  void _currency;
  const value = cents / 100;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(date: Date, locale: "sr-Latn-RS" | "en-GB"): string {
  // Serbian tax point: render in Europe/Belgrade so the printed invoice date
  // matches the accounting (Plutos) issue/supply/due date regardless of the
  // server timezone (UTC on Vercel).
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Belgrade",
  });
}

const ENGLISH_STRINGS = {
  title: "INVOICE",
  issuer: "Issuer",
  recipient: "Recipient",
  issueDate: "Issue date",
  serviceDate: "Service date",
  description: "Description",
  qty: "Qty",
  unitNet: "Unit net",
  vat: "VAT",
  lineTotal: "Net total",
  subtotal: "Subtotal",
  vatTotal: "VAT",
  grand: "Total due",
  paymentLabel: "Payment method",
} as const;

const STRINGS = {
  individual: ENGLISH_STRINGS,
  business: ENGLISH_STRINGS,
} as const;

export async function renderInvoicePdf(data: InvoiceData): Promise<Buffer> {
  ensurePdfFontsRegistered();

  const buffer = await renderToBuffer(<InvoiceDocument data={data} />);
  return buffer;
}

function InvoiceDocument({ data }: { data: InvoiceData }) {
  const layoutKey = data.buyerType;
  const t = STRINGS[layoutKey];
  const locale = "en-GB";

  const subtotalCents = data.items.reduce(
    (sum, it) => sum + it.quantity * it.unitPriceNetCents,
    0,
  );
  const vatCents = data.items.reduce(
    (sum, it) => sum + it.quantity * it.unitPriceNetCents * it.vatRate,
    0,
  );
  const totalCents = subtotalCents + vatCents;

  const notes = buildNotes(data);

  return (
    <Document
      title={`${t.title} ${data.invoiceNumber}`}
      author={IMPRINT.shortName}
      creator={SITE.name}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.h1}>{t.title}</Text>
            <Text style={styles.number}>No. {data.invoiceNumber}</Text>
          </View>
          <View style={styles.metaCol}>
            <View style={styles.metaPair}>
              <Text style={styles.metaLabel}>{t.issueDate}</Text>
              <Text style={styles.metaValue}>{formatDate(data.issueDate, locale)}</Text>
            </View>
            <View style={styles.metaPair}>
              <Text style={styles.metaLabel}>{t.serviceDate}</Text>
              <Text style={styles.metaValue}>{formatDate(data.serviceDate, locale)}</Text>
            </View>
          </View>
        </View>

        {/* Issuer + Recipient */}
        <View style={styles.partyGrid}>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>{t.issuer}</Text>
            <Text style={styles.partyName}>{IMPRINT.shortName}</Text>
            <Text style={styles.partyText}>{IMPRINT.legalName}</Text>
            <Text style={styles.partyText}>{formatAddress()}</Text>
            <Text style={styles.partyMono}>
              MB {IMPRINT.registryNumber} · PIB {IMPRINT.taxId}
            </Text>
            <Text style={styles.partyText}>{IMPRINT.email}</Text>
          </View>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>{t.recipient}</Text>
            <Text style={styles.partyName}>{data.recipient.name}</Text>
            <Text style={styles.partyText}>{data.recipient.address}</Text>
            {data.recipient.taxId && data.buyerType === "business" && (
              <Text style={styles.partyMono}>Tax ID {data.recipient.taxId}</Text>
            )}
            {data.recipient.countryCode &&
              data.buyerType === "business" && (
                <Text style={styles.partyText}>
                  Country: {data.recipient.countryCode}
                </Text>
              )}
            {data.recipient.email && (
              <Text style={styles.partyText}>{data.recipient.email}</Text>
            )}
          </View>
        </View>

        {/* Items */}
        <View style={styles.itemsTable}>
          <View style={styles.thead}>
            <Text style={[styles.th, styles.tcellDesc]}>{t.description}</Text>
            <Text style={[styles.th, styles.tcellQty]}>{t.qty}</Text>
            <Text style={[styles.th, styles.tcellPrice]}>{t.unitNet}</Text>
            <Text style={[styles.th, styles.tcellVat]}>{t.vat}</Text>
            <Text style={[styles.th, styles.tcellTotal]}>{t.lineTotal}</Text>
          </View>
          {data.items.map((it, idx) => {
            const lineNet = it.quantity * it.unitPriceNetCents;
            return (
              <View key={idx} style={styles.trow}>
                <Text style={styles.tcellDesc}>{it.description}</Text>
                <Text style={styles.tcellQty}>{it.quantity}</Text>
                <Text style={styles.tcellPrice}>
                  {formatMoney(it.unitPriceNetCents, data.currency)}
                </Text>
                <Text style={styles.tcellVat}>
                  {it.vatRate > 0 ? `${Math.round(it.vatRate * 100)}%` : "—"}
                </Text>
                <Text style={styles.tcellTotal}>
                  {formatMoney(lineNet, data.currency)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>{t.subtotal}</Text>
          <Text style={styles.totalsValue}>
            {formatMoney(subtotalCents, data.currency)}
          </Text>
        </View>
        {vatCents > 0 ? (
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>{t.vatTotal}</Text>
            <Text style={styles.totalsValue}>
              {formatMoney(vatCents, data.currency)}
            </Text>
          </View>
        ) : (
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>{t.vatTotal}</Text>
            <Text style={styles.totalsLabel}>— (reverse charge)</Text>
          </View>
        )}
        <View style={styles.grandTotal}>
          <Text style={styles.grandLabel}>{t.grand}</Text>
          <Text style={styles.grandValue}>
            {formatMoney(totalCents, data.currency)}
          </Text>
        </View>

        {/* Notes + payment */}
        <View style={styles.notes}>
          {notes.map((n, i) => (
            <Text key={i} style={styles.notesLine}>
              {n}
            </Text>
          ))}
          <Text style={styles.paymentLine}>
            <Text style={{ fontFamily: PDF_FONT_FAMILY, fontWeight: 700 }}>
              {t.paymentLabel}:{" "}
            </Text>
            {data.paymentMethod}
          </Text>
        </View>

        <Text style={styles.footer} fixed>
          {IMPRINT.legalName} · {formatAddress()} · MB{" "}
          {IMPRINT.registryNumber} · PIB {IMPRINT.taxId} · {SITE.email}
        </Text>
      </Page>
    </Document>
  );
}

function buildNotes(data: InvoiceData): string[] {
  void data;
  return [];
}
