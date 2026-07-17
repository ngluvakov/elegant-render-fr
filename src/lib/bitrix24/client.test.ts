import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BitrixApiError,
  BitrixEmptyResultError,
  bitrixCall,
  isBitrixNotFound,
} from "@/lib/bitrix24/client";

// bitrixCall writes to BitrixSyncLog only when `meta` is passed. The cases below
// omit `meta`, but mock the db so a stray write can never reach a real client.
vi.mock("@/lib/db", () => ({
  prisma: {
    bitrixSyncLog: { create: vi.fn().mockResolvedValue({}) },
  },
}));

/** Stub global fetch with a single JSON response body. */
function stubFetch(payload: unknown, status = 200) {
  const fn = vi.fn(async () => ({
    status,
    json: async () => payload,
  })) as unknown as typeof fetch;
  vi.stubGlobal("fetch", fn);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("bitrixCall", () => {
  it("returns the result object for a normal crm.deal.get response", async () => {
    const deal = { ID: "42", STAGE_ID: "C5:NEW", TITLE: "ER-1042" };
    stubFetch({ result: deal });

    const out = await bitrixCall("crm.deal.get", { id: "42" });
    expect(out).toEqual(deal);
  });

  it("throws BitrixEmptyResultError when result is null", async () => {
    stubFetch({ result: null });

    const err = await bitrixCall("crm.deal.get", { id: "999" }).catch((e) => e);
    expect(err).toBeInstanceOf(BitrixEmptyResultError);
    expect(isBitrixNotFound(err)).toBe(true);
  });

  it("throws BitrixEmptyResultError when result is absent (undefined)", async () => {
    stubFetch({}); // no `result`, no `error`

    const err = await bitrixCall("crm.deal.get", { id: "999" }).catch((e) => e);
    expect(err).toBeInstanceOf(BitrixEmptyResultError);
    expect(isBitrixNotFound(err)).toBe(true);
  });

  it("throws BitrixApiError preserving error code and description", async () => {
    stubFetch({ error: "NOT_FOUND", error_description: "Not found" });

    const err = await bitrixCall("crm.deal.get", { id: "999" }).catch((e) => e);
    expect(err).toBeInstanceOf(BitrixApiError);
    expect((err as BitrixApiError).code).toBe("NOT_FOUND");
    expect((err as BitrixApiError).description).toBe("Not found");
    // An explicit NOT_FOUND is still classified as "missing".
    expect(isBitrixNotFound(err)).toBe(true);
  });

  it("classifies a non-not-found API error as a real error, not missing", async () => {
    stubFetch({ error: "QUERY_LIMIT_EXCEEDED", error_description: "Too many requests" });

    const err = await bitrixCall("crm.deal.get", { id: "1" }).catch((e) => e);
    expect(err).toBeInstanceOf(BitrixApiError);
    expect(isBitrixNotFound(err)).toBe(false);
  });

  it("passes through legitimately non-null results (true, empty array)", async () => {
    stubFetch({ result: true });
    expect(await bitrixCall("crm.deal.update", { id: "1" })).toBe(true);

    stubFetch({ result: [] });
    expect(await bitrixCall("crm.deal.list", {})).toEqual([]);
  });
});
