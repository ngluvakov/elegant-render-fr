import { beforeEach, describe, expect, it, vi } from "vitest";
import { BitrixEmptyResultError } from "@/lib/bitrix24/client";
import { orderStatusToStage } from "@/lib/bitrix24/stage-map";

// Mocks are referenced inside vi.mock factories, which are hoisted above every
// import — so the fns must be created with vi.hoisted() to exist in time.
const { bitrixCall, orderFindMany, syncLogCreate, syncNewDeal } = vi.hoisted(
  () => ({
    bitrixCall: vi.fn(),
    orderFindMany: vi.fn(),
    syncLogCreate: vi.fn().mockResolvedValue({}),
    syncNewDeal: vi.fn(),
  }),
);

// Mock only bitrixCall; keep the real error classes + isBitrixNotFound so the
// reconcile classification (instanceof / not-found) runs against real errors.
vi.mock("@/lib/bitrix24/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/bitrix24/client")>();
  return { ...actual, bitrixCall };
});

vi.mock("@/lib/db", () => ({
  prisma: {
    order: { findMany: orderFindMany },
    bitrixSyncLog: { create: syncLogCreate },
  },
}));

vi.mock("@/server/bitrix/sync-deal", () => ({
  syncNewDeal,
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

import { reconcileAllOrders } from "@/server/bitrix/reconcile";

// Deal whose STAGE_ID matches what reconcile expects → no drift. Computed from
// the real stage-map so the assertions do not depend on env being set.
const inSyncDeal = (id: string) => ({
  ID: id,
  STAGE_ID: orderStatusToStage("paid"),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("reconcileAllOrders", () => {
  it("continues checking remaining orders after one missing deal", async () => {
    orderFindMany
      .mockResolvedValueOnce([
        { id: "o1", orderNumber: "ER-1", status: "paid", bitrix24DealId: "1" },
        { id: "o2", orderNumber: "ER-2", status: "paid", bitrix24DealId: "2" },
        { id: "o3", orderNumber: "ER-3", status: "paid", bitrix24DealId: "3" },
      ]) // synced orders
      .mockResolvedValueOnce([]); // no unsynced orders

    // The middle order's Deal no longer exists on the Bitrix side.
    bitrixCall.mockImplementation(async (_method: string, params: { id: string }) => {
      if (params.id === "2") throw new BitrixEmptyResultError("crm.deal.get");
      return inSyncDeal(params.id);
    });

    const summary = await reconcileAllOrders();

    // All three orders were checked — the run did not abort on the missing one.
    expect(bitrixCall).toHaveBeenCalledTimes(3);
    expect(summary.checked).toBe(3);
    expect(summary.missing).toBe(1);
    expect(summary.drift).toBe(0);
    expect(summary.errors).toBe(0);

    // The missing deal was recorded, not silently ignored...
    expect(syncLogCreate).toHaveBeenCalledTimes(1);
    // ...and the link was neither cleared nor recreated (no duplicate Deals).
    expect(syncNewDeal).not.toHaveBeenCalled();
  });

  it("classifies an explicit Bitrix NOT_FOUND error as missing", async () => {
    const { BitrixApiError } = await import("@/lib/bitrix24/client");
    orderFindMany
      .mockResolvedValueOnce([
        { id: "o1", orderNumber: "ER-1", status: "paid", bitrix24DealId: "1" },
      ])
      .mockResolvedValueOnce([]);

    bitrixCall.mockImplementation(async () => {
      throw new BitrixApiError("crm.deal.get", "NOT_FOUND", "Not found");
    });

    const summary = await reconcileAllOrders();
    expect(summary.missing).toBe(1);
    expect(summary.errors).toBe(0);
    expect(syncNewDeal).not.toHaveBeenCalled();
  });

  it("counts an unexpected error without aborting or misclassifying it as missing", async () => {
    orderFindMany
      .mockResolvedValueOnce([
        { id: "o1", orderNumber: "ER-1", status: "paid", bitrix24DealId: "1" },
        { id: "o2", orderNumber: "ER-2", status: "paid", bitrix24DealId: "2" },
      ])
      .mockResolvedValueOnce([]);

    bitrixCall.mockImplementation(async (_method: string, params: { id: string }) => {
      if (params.id === "1") throw new Error("network down");
      return inSyncDeal(params.id);
    });

    const summary = await reconcileAllOrders();
    expect(summary.checked).toBe(2);
    expect(summary.errors).toBe(1);
    expect(summary.missing).toBe(0);
  });
});
