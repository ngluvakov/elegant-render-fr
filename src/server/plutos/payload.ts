import type { BuyerType, PaymentProvider } from "@/generated/prisma/client";
import { buildInvoiceLineItem } from "@/lib/invoice-data";
import { PLUTOS_SOURCE, plutosOrderId } from "./ids";
import { plutosBuyerType, type PlutosBuyerType, type PlutosTarget } from "./types";

/**
 * payload.ts — Pure construction of the Plutos ingest body.
 *
 * No I/O and no DB access: it takes a normalized `PlutosInvoiceSource`
 * (assembled by source.ts from an Order/OrderCharge) and returns the exact
 * JSON Plutos expects. Kept pure so the payload rules — decimal formatting,
 * buyer mapping, and the exact-total guard — are unit-testable in isolation.
 */

export type PlutosInvoiceSource = {
  target: PlutosTarget;
  targetId: string;
  /** Site-assigned invoice number. Plutos never renumbers; it echoes this. */
  invoiceNumber: string;
  /** Local invoice issue date; also used for supply_date and due_date. */
  issueDate: Date;
  buyerType: BuyerType;
  buyer: {
    name: string;
    email: string | null;
    countryCode: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    /** Foreign VAT id for company buyers; null/empty otherwise. */
    vatNumber: string | null;
  };
  currency: "EUR";
  /** VAT rate as a fraction (0 for .com export; see invoiceVatRateForBuyer). */
  vatRate: number;
  /** One entry per invoice line; gross unit cents in EUR + quantity. */
  lines: Array<{ description: string; grossUnitCents: number; quantity: number }>;
  /** Authoritative local EUR invoice total (gross cents) — the guard target. */
  totalCents: number;
  payment: {
    provider: PaymentProvider | null;
    paymentId: string | null;
    captureId: string | null;
    paidAt: Date | null;
  };
};

export type PlutosLinePayload = {
  description_sr: string;
  description_en: string;
  quantity: string;
  price: string;
  discount_percent: string;
  vat_rate: string;
};

export type PlutosPaymentPayload = {
  provider: "paypal" | "wire" | "nestpay";
  payment_id: string;
  amount: string;
  paid_at: string | null;
};

export type PlutosInvoicePayload = {
  order_id: string;
  source: string;
  invoice_number: string;
  buyer: {
    type: PlutosBuyerType;
    name: string;
    email: string | null;
    vat_number: string;
    country: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
  };
  currency: "EUR";
  exchange_rate: null;
  issue_date: string;
  supply_date: string;
  due_date: string;
  lines: PlutosLinePayload[];
  payment?: PlutosPaymentPayload;
  send_to_sef: false;
};

export type PlutosPayloadErrorReason =
  | "missing_invoice_number"
  | "no_lines"
  | "total_mismatch";

export class PlutosPayloadError extends Error {
  readonly reason: PlutosPayloadErrorReason;
  constructor(reason: PlutosPayloadErrorReason, message?: string) {
    super(message ?? reason);
    this.name = "PlutosPayloadError";
    this.reason = reason;
  }
}

/** Two-decimal money string from integer cents, e.g. 48000 → "480.00". */
function centsToDecimalString(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Fraction → percent string, e.g. 0.2 → "20", 0 → "0", 0.205 → "20.5". */
function vatRateToPercentString(rate: number): string {
  return String(Math.round(rate * 10000) / 100);
}

/** YYYY-MM-DD in Europe/Belgrade — the accountant's local calendar day. */
function belgradeDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Belgrade",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

const WIRE_PROVIDER: Record<PaymentProvider, "paypal" | "wire" | "nestpay" | null> = {
  paypal: "paypal",
  wire_transfer: "wire",
  card_mock: null, // informational payment object is omitted for card_mock
};

function buildPayment(
  source: PlutosInvoiceSource,
  amountCents: number,
): PlutosPaymentPayload | undefined {
  const provider = source.payment.provider;
  if (!provider) return undefined;
  const mapped = WIRE_PROVIDER[provider];
  if (!mapped) return undefined; // card_mock → omit
  // PayPal: prefer the capture id, fall back to the order/payment id.
  const paymentId =
    (provider === "paypal"
      ? source.payment.captureId ?? source.payment.paymentId
      : source.payment.paymentId) ?? "";
  return {
    provider: mapped,
    payment_id: paymentId,
    amount: centsToDecimalString(amountCents),
    paid_at: source.payment.paidAt ? source.payment.paidAt.toISOString() : null,
  };
}

/**
 * Build the Plutos ingest payload from a normalized source.
 *
 * Throws `PlutosPayloadError` when the invoice number is missing, there are no
 * lines, or — critically — the recomputed line total does not equal the local
 * EUR invoice total to the cent. That last guard means a construction bug
 * fails loudly (the invoice never syncs and surfaces for review) instead of
 * silently booking a wrong amount.
 */
export function buildPlutosInvoicePayload(
  source: PlutosInvoiceSource,
): PlutosInvoicePayload {
  if (!source.invoiceNumber) {
    throw new PlutosPayloadError("missing_invoice_number");
  }
  if (source.lines.length === 0) {
    throw new PlutosPayloadError("no_lines");
  }

  let grossCents = 0;
  const lines: PlutosLinePayload[] = source.lines.map((line) => {
    const item = buildInvoiceLineItem({
      description: line.description,
      grossUnitCents: line.grossUnitCents,
      quantity: line.quantity,
      vatRate: source.vatRate,
    });
    grossCents += line.grossUnitCents * item.quantity;
    return {
      // The .com store keeps a single English label; send it as both until
      // the Plutos contract supports an English-only source.
      description_sr: line.description,
      description_en: line.description,
      quantity: String(item.quantity),
      price: centsToDecimalString(item.unitPriceNetCents),
      discount_percent: "0",
      vat_rate: vatRateToPercentString(item.vatRate),
    };
  });

  if (grossCents !== source.totalCents) {
    throw new PlutosPayloadError(
      "total_mismatch",
      `recomputed ${grossCents} != local ${source.totalCents} cents`,
    );
  }

  const issueDate = belgradeDate(source.issueDate);
  const payment = buildPayment(source, grossCents);

  return {
    order_id: plutosOrderId(source.target, source.targetId),
    source: PLUTOS_SOURCE,
    invoice_number: source.invoiceNumber,
    buyer: {
      type: plutosBuyerType(source.buyerType),
      name: source.buyer.name,
      email: source.buyer.email,
      vat_number: source.buyer.vatNumber ?? "",
      country: source.buyer.countryCode,
      address: source.buyer.address,
      city: source.buyer.city,
      postal_code: source.buyer.postalCode,
    },
    currency: "EUR",
    exchange_rate: null,
    issue_date: issueDate,
    supply_date: issueDate,
    due_date: issueDate,
    lines,
    ...(payment ? { payment } : {}),
    send_to_sef: false,
  };
}
