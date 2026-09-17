import { describe, expect, it } from "vitest";
import {
  buildPlutosInvoicePayload,
  PlutosPayloadError,
  type PlutosInvoiceSource,
} from "./payload";

function source(overrides: Partial<PlutosInvoiceSource> = {}): PlutosInvoiceSource {
  return {
    target: "order",
    targetId: "o1",
    invoiceNumber: "2026-0001",
    issueDate: new Date("2026-07-15T10:00:00Z"),
    buyerType: "individual",
    buyer: {
      name: "Jane Doe",
      email: "jane@example.com",
      countryCode: "DE",
      address: "Main St 1",
      city: "Berlin",
      postalCode: "10115",
      vatNumber: null,
    },
    currency: "EUR",
    vatRate: 0,
    lines: [{ description: "Exterior 3D visualization", grossUnitCents: 48000, quantity: 1 }],
    totalCents: 48000,
    payment: { provider: "paypal", paymentId: "pay_1", captureId: "cap_1", paidAt: new Date("2026-07-15T10:00:00Z") },
    ...overrides,
  };
}

describe("buildPlutosInvoicePayload", () => {
  it("maps a foreign individual order to individual_foreign, 0% VAT, no SEF", () => {
    const payload = buildPlutosInvoicePayload(source());
    expect(payload.order_id).toBe("elegantrender.fr:order:o1");
    expect(payload.source).toBe("elegantrender.fr");
    expect(payload.invoice_number).toBe("2026-0001");
    expect(payload.buyer.type).toBe("individual_foreign");
    expect(payload.buyer.vat_number).toBe("");
    expect(payload.currency).toBe("EUR");
    expect(payload.exchange_rate).toBeNull();
    expect(payload.send_to_sef).toBe(false);
    expect(payload.lines).toHaveLength(1);
    expect(payload.lines[0]).toMatchObject({
      description_sr: "Exterior 3D visualization",
      description_en: "Exterior 3D visualization",
      quantity: "1",
      price: "480.00",
      discount_percent: "0",
      vat_rate: "0",
    });
  });

  it("maps a foreign business order to company_foreign and sends the VAT id", () => {
    const payload = buildPlutosInvoicePayload(
      source({
        buyerType: "business",
        buyer: {
          name: "Delta GmbH",
          email: "ap@delta.de",
          countryCode: "DE",
          address: "Ring 2",
          city: "Munich",
          postalCode: "80331",
          vatNumber: "DE123456789",
        },
      }),
    );
    expect(payload.buyer.type).toBe("company_foreign");
    expect(payload.buyer.name).toBe("Delta GmbH");
    expect(payload.buyer.vat_number).toBe("DE123456789");
  });

  it("uses the local issue date for issue, supply, and due (Europe/Belgrade)", () => {
    const payload = buildPlutosInvoicePayload(source());
    expect(payload.issue_date).toBe("2026-07-15");
    expect(payload.supply_date).toBe("2026-07-15");
    expect(payload.due_date).toBe("2026-07-15");
  });

  it("keeps the composite id for a charge and honors stored quantity", () => {
    const payload = buildPlutosInvoicePayload(
      source({
        target: "charge",
        targetId: "c9",
        lines: [{ description: "Extra view", grossUnitCents: 12000, quantity: 3 }],
        totalCents: 36000,
      }),
    );
    expect(payload.order_id).toBe("elegantrender.fr:charge:c9");
    expect(payload.lines[0].quantity).toBe("3");
    expect(payload.lines[0].price).toBe("120.00");
  });

  it("serializes a VAT-bearing line as a net unit price + percent rate", () => {
    const payload = buildPlutosInvoicePayload(
      source({ vatRate: 0.2, lines: [{ description: "x", grossUnitCents: 12000, quantity: 1 }], totalCents: 12000 }),
    );
    // net = round(12000 / 1.2) = 10000 → "100.00"; guard still compares gross.
    expect(payload.lines[0].price).toBe("100.00");
    expect(payload.lines[0].vat_rate).toBe("20");
  });

  it("prefers the PayPal capture id, and omits the payment block for card_mock", () => {
    const paypal = buildPlutosInvoicePayload(source());
    expect(paypal.payment).toEqual({
      provider: "paypal",
      payment_id: "cap_1",
      amount: "480.00",
      paid_at: "2026-07-15T10:00:00.000Z",
    });

    const mock = buildPlutosInvoicePayload(
      source({ payment: { provider: "card_mock", paymentId: "m1", captureId: null, paidAt: null } }),
    );
    expect(mock.payment).toBeUndefined();
  });

  it("falls back to paymentId when there is no capture id", () => {
    const payload = buildPlutosInvoicePayload(
      source({ payment: { provider: "paypal", paymentId: "pay_1", captureId: null, paidAt: null } }),
    );
    expect(payload.payment?.payment_id).toBe("pay_1");
  });

  it("rejects a line total that does not equal the local invoice total", () => {
    expect(() => buildPlutosInvoicePayload(source({ totalCents: 47999 }))).toThrow(
      PlutosPayloadError,
    );
    try {
      buildPlutosInvoicePayload(source({ totalCents: 47999 }));
    } catch (err) {
      expect((err as PlutosPayloadError).reason).toBe("total_mismatch");
    }
  });

  it("rejects a missing invoice number", () => {
    try {
      buildPlutosInvoicePayload(source({ invoiceNumber: "" }));
      throw new Error("expected throw");
    } catch (err) {
      expect(err).toBeInstanceOf(PlutosPayloadError);
      expect((err as PlutosPayloadError).reason).toBe("missing_invoice_number");
    }
  });
});
