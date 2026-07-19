import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { plutosOutboxKey } from "./ids";

const { orderFindMany, chargeFindMany, outboxFindMany, outboxUpdate, enqueueOutboxEvent } =
  vi.hoisted(() => ({
    orderFindMany: vi.fn(),
    chargeFindMany: vi.fn(),
    outboxFindMany: vi.fn().mockResolvedValue([]),
    outboxUpdate: vi.fn(),
    enqueueOutboxEvent: vi.fn().mockResolvedValue(undefined),
  }));

vi.mock("@/lib/db", () => ({
  prisma: {
    order: { findMany: orderFindMany },
    orderCharge: { findMany: chargeFindMany },
    outboxEvent: { findMany: outboxFindMany, update: outboxUpdate },
  },
}));
vi.mock("@/lib/outbox", () => ({ enqueueOutboxEvent }));
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

import { reconcilePlutosSync } from "./reconcile";

function enablePlutos() {
  vi.stubEnv("PLUTOS_SYNC_ENABLED", "true");
  vi.stubEnv("PLUTOS_API_URL", "https://plutos.example");
  vi.stubEnv("PLUTOS_API_KEY", "k");
  vi.stubEnv("PLUTOS_SYNC_FROM", "2026-01-01T00:00:00Z");
}

const ISSUED = new Date("2026-07-15T00:00:00Z");

function enqueuedTargets(): string[] {
  return enqueueOutboxEvent.mock.calls.map((c) => `${c[0].payload.target}:${c[0].payload.targetId}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  outboxFindMany.mockResolvedValue([]);
});
afterEach(() => vi.unstubAllEnvs());

describe("reconcilePlutosSync", () => {
  it("is a no-op that never touches the DB when disabled", async () => {
    vi.stubEnv("PLUTOS_SYNC_ENABLED", "false");
    const result = await reconcilePlutosSync();
    expect(result.skipped).toBe(true);
    expect(orderFindMany).not.toHaveBeenCalled();
    expect(chargeFindMany).not.toHaveBeenCalled();
  });

  it("enqueues only documents that have no event yet", async () => {
    enablePlutos();
    orderFindMany.mockResolvedValue([
      { id: "o1", invoiceIssuedAt: ISSUED },
      { id: "o2", invoiceIssuedAt: ISSUED },
    ]);
    chargeFindMany.mockResolvedValue([{ id: "c1", invoiceIssuedAt: ISSUED }]);

    const result = await reconcilePlutosSync(10);

    expect(result.ordersQueued).toBe(2);
    expect(result.chargesQueued).toBe(1);
    expect(enqueuedTargets().sort()).toEqual(["charge:c1", "order:o1", "order:o2"]);
  });

  it("never resets a terminal failed event and does not spend budget on it", async () => {
    enablePlutos();
    orderFindMany.mockResolvedValue([
      { id: "o1", invoiceIssuedAt: ISSUED }, // has a failed event
      { id: "o2", invoiceIssuedAt: ISSUED }, // genuinely missing
    ]);
    chargeFindMany.mockResolvedValue([]);
    // o1 already has an event (e.g. terminal failed) — reconcile must skip it.
    outboxFindMany.mockResolvedValue([{ idempotencyKey: plutosOutboxKey("order", "o1") }]);

    const result = await reconcilePlutosSync(10);

    // The failed event was neither reset nor re-enqueued...
    expect(outboxUpdate).not.toHaveBeenCalled();
    expect(enqueuedTargets()).not.toContain("order:o1");
    // ...and the genuinely-missing document was still repaired (no starvation).
    expect(enqueuedTargets()).toContain("order:o2");
    expect(result.ordersQueued).toBe(1);
    expect(result.skippedExisting).toBe(1);
  });

  it("excludes already-attempted rows at the DB level so a failed backlog can't fill the scan window", async () => {
    enablePlutos();
    orderFindMany.mockResolvedValue([]);
    chargeFindMany.mockResolvedValue([]);

    await reconcilePlutosSync();

    // plutosLastAttemptAt is set by the first sync attempt, so terminal-failed
    // rows never enter the scan and can't crowd out genuine missed enqueues.
    expect(orderFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          plutosSyncedAt: null,
          plutosLastAttemptAt: null,
        }),
      }),
    );
    expect(chargeFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ plutosLastAttemptAt: null }),
      }),
    );
  });

  it("caps the number of documents queued per run at the limit", async () => {
    enablePlutos();
    orderFindMany.mockResolvedValue([
      { id: "o1", invoiceIssuedAt: ISSUED },
      { id: "o2", invoiceIssuedAt: ISSUED },
      { id: "o3", invoiceIssuedAt: ISSUED },
    ]);
    chargeFindMany.mockResolvedValue([]);

    const result = await reconcilePlutosSync(2);

    expect(result.ordersQueued).toBe(2);
    expect(enqueueOutboxEvent).toHaveBeenCalledTimes(2);
  });
});
