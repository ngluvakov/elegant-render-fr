import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlutosInvoiceSource } from "./payload";

const {
  orderUpdate,
  orderFindUnique,
  chargeUpdate,
  chargeFindUnique,
  getPlutosInvoiceStatus,
  postPlutosInvoice,
  loadPlutosInvoiceSource,
} = vi.hoisted(() => ({
  orderUpdate: vi.fn().mockResolvedValue({}),
  orderFindUnique: vi.fn(),
  chargeUpdate: vi.fn().mockResolvedValue({}),
  chargeFindUnique: vi.fn(),
  getPlutosInvoiceStatus: vi.fn(),
  postPlutosInvoice: vi.fn(),
  loadPlutosInvoiceSource: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    order: { update: orderUpdate, findUnique: orderFindUnique },
    orderCharge: { update: chargeUpdate, findUnique: chargeFindUnique },
  },
}));
vi.mock("./source", () => ({ loadPlutosInvoiceSource }));
// Keep the real PlutosClientError; only stub the network calls.
vi.mock("./client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./client")>();
  return { ...actual, getPlutosInvoiceStatus, postPlutosInvoice };
});
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

import { PlutosClientError } from "./client";
import { refreshPlutosInvoiceStatus, syncPlutosInvoice } from "./sync";

function enablePlutos() {
  vi.stubEnv("PLUTOS_SYNC_ENABLED", "true");
  vi.stubEnv("PLUTOS_API_URL", "https://plutos.example");
  vi.stubEnv("PLUTOS_API_KEY", "secret-key");
  vi.stubEnv("PLUTOS_SYNC_FROM", "2026-01-01T00:00:00Z");
}

function validSource(): PlutosInvoiceSource {
  return {
    target: "order",
    targetId: "o1",
    invoiceNumber: "2026-0001",
    issueDate: new Date("2026-07-15T00:00:00Z"),
    buyerType: "individual",
    buyer: {
      name: "Jane",
      email: "jane@example.com",
      countryCode: "DE",
      address: null,
      city: null,
      postalCode: null,
      vatNumber: null,
    },
    currency: "EUR",
    vatRate: 0,
    lines: [{ description: "x", grossUnitCents: 48000, quantity: 1 }],
    totalCents: 48000,
    payment: { provider: "paypal", paymentId: "p", captureId: "c", paidAt: null },
  };
}

function orderUpdateData() {
  return orderUpdate.mock.calls.map((c) => c[0].data as Record<string, unknown>);
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllEnvs());

describe("refreshPlutosInvoiceStatus", () => {
  it("records the attempt and clears the error on success", async () => {
    enablePlutos();
    orderFindUnique.mockResolvedValue({ invoiceNumber: "2026-0001" });
    getPlutosInvoiceStatus.mockResolvedValue({
      invoiceId: "42",
      number: "2026-0001",
      status: "PRIHVACENA",
      sefStatus: "prihvacena",
      sefId: null,
    });

    await refreshPlutosInvoiceStatus("order", "o1");

    const datas = orderUpdateData();
    expect(datas[0]).toHaveProperty("plutosLastAttemptAt");
    expect(
      datas.some((d) => d.plutosStatus === "PRIHVACENA" && d.plutosLastError === null),
    ).toBe(true);
  });

  it("records the attempt and a sanitized error, then rethrows, on failure", async () => {
    enablePlutos();
    orderFindUnique.mockResolvedValue({ invoiceNumber: "2026-0001" });
    getPlutosInvoiceStatus.mockRejectedValue(
      new PlutosClientError("http_500", "Plutos returned HTTP 500", 500),
    );

    await expect(refreshPlutosInvoiceStatus("order", "o1")).rejects.toBeInstanceOf(
      PlutosClientError,
    );

    const datas = orderUpdateData();
    expect(datas.some((d) => "plutosLastAttemptAt" in d)).toBe(true);
    const errData = datas.find(
      (d) => typeof d.plutosLastError === "string",
    );
    expect(errData?.plutosLastError).toContain("HTTP 500");
    expect(errData?.plutosLastError).not.toContain("secret-key");
  });
});

describe("syncPlutosInvoice", () => {
  it("persists external ids and clears the error on success", async () => {
    enablePlutos();
    loadPlutosInvoiceSource.mockResolvedValue(validSource());
    postPlutosInvoice.mockResolvedValue({
      invoiceId: "42",
      number: "2026-0001",
      status: "IZDATA",
      sefStatus: null,
      sefId: null,
    });

    await syncPlutosInvoice("order", "o1");

    const datas = orderUpdateData();
    expect(
      datas.some(
        (d) => d.plutosInvoiceId === "42" && d.plutosSyncedAt && d.plutosLastError === null,
      ),
    ).toBe(true);
  });

  it("records the attempt and a sanitized error, then rethrows, on POST failure", async () => {
    enablePlutos();
    loadPlutosInvoiceSource.mockResolvedValue(validSource());
    postPlutosInvoice.mockRejectedValue(
      new PlutosClientError("http_422", "Plutos returned HTTP 422", 422),
    );

    await expect(syncPlutosInvoice("order", "o1")).rejects.toBeInstanceOf(
      PlutosClientError,
    );

    const datas = orderUpdateData();
    expect(datas.some((d) => "plutosLastAttemptAt" in d)).toBe(true);
    const errData = datas.find((d) => typeof d.plutosLastError === "string");
    expect(errData?.plutosLastError).toContain("HTTP 422");
  });

  it("records the attempt even when payload construction throws (never a silent no-attempt)", async () => {
    enablePlutos();
    // A total mismatch makes buildPlutosInvoicePayload throw inside the try.
    loadPlutosInvoiceSource.mockResolvedValue({ ...validSource(), totalCents: 99999 });

    await expect(syncPlutosInvoice("order", "o1")).rejects.toThrow();

    const datas = orderUpdateData();
    expect(datas.some((d) => "plutosLastAttemptAt" in d)).toBe(true);
    const errData = datas.find((d) => typeof d.plutosLastError === "string");
    expect(errData?.plutosLastError).toContain("!=");
    expect(postPlutosInvoice).not.toHaveBeenCalled();
  });
});
