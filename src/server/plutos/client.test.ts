import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlutosConfig } from "./config";
import { getPlutosInvoiceStatus, PlutosClientError, postPlutosInvoice } from "./client";
import type { PlutosInvoicePayload } from "./payload";

const CONFIG: PlutosConfig = {
  apiUrl: "https://plutos.example",
  apiKey: "secret-key",
  from: new Date("2026-01-01T00:00:00Z"),
};

function payload(): PlutosInvoicePayload {
  return {
    order_id: "elegantrender.fr:order:o1",
    source: "elegantrender.fr",
    invoice_number: "2026-0001",
    buyer: {
      type: "individual_foreign",
      name: "Jane",
      email: "jane@example.com",
      vat_number: "",
      country: "DE",
      address: null,
      city: null,
      postal_code: null,
    },
    currency: "EUR",
    exchange_rate: null,
    issue_date: "2026-07-15",
    supply_date: "2026-07-15",
    due_date: "2026-07-15",
    lines: [
      {
        description_sr: "x",
        description_en: "x",
        quantity: "1",
        price: "480.00",
        discount_percent: "0",
        vat_rate: "0",
      },
    ],
    send_to_sef: false,
  };
}

function response(status: number, body: unknown, opts: { raw?: string } = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => opts.raw ?? JSON.stringify(body),
  } as unknown as Response;
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("postPlutosInvoice", () => {
  it("returns a normalized invoice on 200 and sends the api key header", async () => {
    fetchMock.mockResolvedValue(
      response(200, {
        plutos_invoice_id: 42,
        number: "2026-0001",
        status: "IZDATA",
        sef_status: "poslata",
        sef_id: "sef-1",
      }),
    );

    const result = await postPlutosInvoice(CONFIG, payload());

    expect(result).toEqual({
      invoiceId: "42", // numeric id normalized to string
      number: "2026-0001",
      status: "IZDATA",
      sefStatus: "poslata",
      sefId: "sef-1",
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://plutos.example/api/v1/invoices/ingest");
    expect((init.headers as Record<string, string>)["X-Plutos-Api-Key"]).toBe("secret-key");
  });

  it("is idempotent — a repeated 200 yields the same result", async () => {
    const ok = response(200, { plutos_invoice_id: "42", number: "2026-0001", status: "IZDATA" });
    fetchMock.mockResolvedValue(ok);
    const a = await postPlutosInvoice(CONFIG, payload());
    fetchMock.mockResolvedValue(
      response(200, { plutos_invoice_id: "42", number: "2026-0001", status: "IZDATA" }),
    );
    const b = await postPlutosInvoice(CONFIG, payload());
    expect(a).toEqual(b);
  });

  it.each([401, 422, 429, 500, 503])("maps HTTP %s to http_<status>", async (status) => {
    fetchMock.mockResolvedValue(response(status, { errors: { field: "bad" } }));
    await expect(postPlutosInvoice(CONFIG, payload())).rejects.toMatchObject({
      reason: `http_${status}`,
      status,
    });
  });

  it("maps a timeout to reason 'timeout'", async () => {
    fetchMock.mockRejectedValue(new DOMException("timed out", "TimeoutError"));
    await expect(postPlutosInvoice(CONFIG, payload())).rejects.toMatchObject({
      reason: "timeout",
    });
  });

  it("rejects a non-JSON body", async () => {
    fetchMock.mockResolvedValue(response(200, null, { raw: "<html>oops</html>" }));
    await expect(postPlutosInvoice(CONFIG, payload())).rejects.toMatchObject({
      reason: "invalid_json",
    });
  });

  it("rejects a schema-invalid body", async () => {
    fetchMock.mockResolvedValue(response(200, { number: "2026-0001", status: "IZDATA" }));
    await expect(postPlutosInvoice(CONFIG, payload())).rejects.toMatchObject({
      reason: "invalid_schema",
    });
  });

  it("rejects a response whose number differs from the local invoice number", async () => {
    fetchMock.mockResolvedValue(
      response(200, { plutos_invoice_id: 1, number: "2026-9999", status: "IZDATA" }),
    );
    await expect(postPlutosInvoice(CONFIG, payload())).rejects.toMatchObject({
      reason: "number_mismatch",
    });
  });

  it("never leaks the api key, buyer payload, or raw error body in an error", async () => {
    // A 422 whose body echoes buyer fields must not reach the thrown/stored error.
    fetchMock.mockResolvedValue(
      response(422, {
        errors: {
          "buyer.name": "Jane Doe is invalid",
          "buyer.email": "jane@example.com is not allowed",
        },
      }),
    );
    const err = await postPlutosInvoice(CONFIG, payload()).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PlutosClientError);
    if (!(err instanceof PlutosClientError)) throw err;
    expect(err.reason).toBe("http_422");
    expect(err.message).toBe("Plutos returned HTTP 422");
    expect(err.message).not.toContain("secret-key");
    expect(err.message).not.toContain("Jane Doe");
    expect(err.message).not.toContain("jane@example.com");
  });
});

describe("getPlutosInvoiceStatus", () => {
  it("URL-encodes the composite order id and returns the status", async () => {
    fetchMock.mockResolvedValue(
      response(200, { plutos_invoice_id: 42, number: "2026-0001", status: "PRIHVACENA", sef_status: "prihvacena" }),
    );
    const result = await getPlutosInvoiceStatus(CONFIG, "elegantrender.fr:order:o1");
    expect(result.status).toBe("PRIHVACENA");
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://plutos.example/api/v1/invoices/elegantrender.fr%3Aorder%3Ao1",
    );
  });
});
