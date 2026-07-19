/**
 * proforma-pdf.tsx — Server-side PDF for the proforma invoice.
 *
 * Single English export layout (EUR) shared by both buyer types
 * ({individual, business}), mirroring invoice-pdf.tsx but with key
 * legal differences:
 *   - Header reads PROFORMA INVOICE
 *   - Explicit note that the document is NOT a tax invoice — it's a
 *     payment instruction. The legal invoice comes after the funds
 *     land (issued via the existing invoice pipeline).
 *   - Bank instructions block (IBAN, SWIFT, recipient, payment
 *     reference using the order/proforma number).
 *
 * Sharing PDF code between invoice-pdf and proforma-pdf would be
 * nice — held off for v1 because subtle layout divergences
 * (header text, bank block, legal note) make the abstraction
 * leaky. If a third PDF lands, refactor.
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

export type ProformaLineItem = {
  description: string;
  quantity: number;
  unitPriceNetCents: number;
  vatRate: number;
};

export type ProformaData = {
  proformaNumber: string;
  issueDate: Date;
  dueDate: Date;
  buyerType: "individual" | "business";
  recipient: {
    name: string;
    address: string;
    taxId?: string | null;
    countryCode?: string | null;
    email?: string | null;
  };
  items: ProformaLineItem[];
  currency: "EUR";
  paymentReference: string; // poziv na broj — usually the order number
};

const COLORS = {
  fg: "#1c1a19",
  muted: "#6e655d",
  border: "#d8cec4",
  surface: "#fbf6ee",
  accent: "#b88363",
  warn: "#a37f2d",
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
  draftNote: {
    marginTop: 6,
    padding: 6,
    backgroundColor: "#fff8e6",
    borderLeft: `2pt solid ${COLORS.warn}`,
    fontSize: 9,
    lineHeight: 1.4,
  },
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
  partyGrid: { flexDirection: "row", gap: 24, marginTop: 18 },
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
  partyMono: { fontFamily: PDF_FONT_FAMILY, fontSize: 9, marginTop: 2 },
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
  bankBox: {
    marginTop: 24,
    padding: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    lineHeight: 1.5,
  },
  bankTitle: {
    fontFamily: PDF_FONT_FAMILY,
    fontWeight: 700,
    marginBottom: 8,
    fontSize: 11,
  },
  bankRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  bankLabel: { color: COLORS.muted, width: 130 },
  bankValue: { fontFamily: PDF_FONT_FAMILY, fontSize: 10 },
  legalNote: {
    marginTop: 16,
    padding: 12,
    fontSize: 9,
    color: COLORS.muted,
    lineHeight: 1.5,
    fontStyle: "italic",
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
  // Serbian tax point: render in Europe/Belgrade so the printed proforma date
  // matches the accounting (Plutos) date regardless of the server timezone.
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Belgrade",
  });
}

const ENGLISH_STRINGS = {
  title: "PROFORMA INVOICE",
  issuer: "Issuer",
  recipient: "Recipient",
  issueDate: "Issue date",
  dueDate: "Payment due",
  description: "Description",
  qty: "Qty",
  unitNet: "Unit net",
  vat: "VAT",
  lineTotal: "Net total",
  subtotal: "Subtotal",
  vatTotal: "VAT",
  grand: "Total due",
  bankTitle: "Payment instructions",
  bankAccount: "Account",
  bankIban: "IBAN",
  bankSwift: "SWIFT/BIC",
  bankBankName: "Bank",
  bankReference: "Reference",
  legal:
    "This is a proforma invoice — not a tax document. The final invoice will be issued upon receipt of payment. Reverse charge — VAT is not charged on this document (Place of supply outside the Republic of Serbia, Art. 24/25 of the Serbian VAT Act, ZPDV).",
  draft:
    "PROFORMA INVOICE — please remit payment as instructed below. The final invoice is issued upon receipt of funds.",
} as const;

const STRINGS = {
  individual: ENGLISH_STRINGS,
  business: ENGLISH_STRINGS,
} as const;

export async function renderProformaPdf(data: ProformaData): Promise<Buffer> {
  ensurePdfFontsRegistered();

  return await renderToBuffer(<ProformaDocument data={data} />);
}

function ProformaDocument({ data }: { data: ProformaData }) {
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

  return (
    <Document
      title={`${t.title} ${data.proformaNumber}`}
      author={IMPRINT.shortName}
      creator={SITE.name}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.h1}>{t.title}</Text>
            <Text style={styles.number}>No. {data.proformaNumber}</Text>
          </View>
          <View style={styles.metaCol}>
            <View style={styles.metaPair}>
              <Text style={styles.metaLabel}>{t.issueDate}</Text>
              <Text style={styles.metaValue}>{formatDate(data.issueDate, locale)}</Text>
            </View>
            <View style={styles.metaPair}>
              <Text style={styles.metaLabel}>{t.dueDate}</Text>
              <Text style={styles.metaValue}>{formatDate(data.dueDate, locale)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.draftNote}>
          <Text>{t.draft}</Text>
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

        {/* Bank instructions */}
        <View style={styles.bankBox}>
          <Text style={styles.bankTitle}>{t.bankTitle}</Text>
          {IMPRINT.bank.name && (
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>{t.bankBankName}</Text>
              <Text style={styles.bankValue}>{IMPRINT.bank.name}</Text>
            </View>
          )}
          {IMPRINT.bank.accountNumber && (
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>{t.bankAccount}</Text>
              <Text style={styles.bankValue}>
                {IMPRINT.bank.accountNumber}
              </Text>
            </View>
          )}
          {IMPRINT.bank.iban && (
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>{t.bankIban}</Text>
              <Text style={styles.bankValue}>{IMPRINT.bank.iban}</Text>
            </View>
          )}
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>{t.bankReference}</Text>
            <Text style={styles.bankValue}>{data.paymentReference}</Text>
          </View>
        </View>

        <Text style={styles.legalNote}>{t.legal}</Text>

        <Text style={styles.footer} fixed>
          {IMPRINT.legalName} · {formatAddress()} · MB{" "}
          {IMPRINT.registryNumber} · PIB {IMPRINT.taxId} · {SITE.email}
        </Text>
      </Page>
    </Document>
  );
}
