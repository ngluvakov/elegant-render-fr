import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { outboxFindUnique, outboxUpdate, enqueueOutboxEvent, kickOutboxSoon } =
  vi.hoisted(() => ({
    outboxFindUnique: vi.fn(),
    outboxUpdate: vi.fn().mockResolvedValue({}),
    enqueueOutboxEvent: vi.fn().mockResolvedValue(undefined),
    kickOutboxSoon: vi.fn(),
  }));

vi.mock("@/lib/db", () => ({
  prisma: { outboxEvent: { findUnique: outboxFindUnique, update: outboxUpdate } },
}));
vi.mock("@/lib/outbox", () => ({ enqueueOutboxEvent, kickOutboxSoon }));
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

import { enqueuePlutosSyncIfEligible, ensurePlutosSyncQueued } from "./producer";

function enablePlutos() {
  vi.stubEnv("PLUTOS_SYNC_ENABLED", "true");
  vi.stubEnv("PLUTOS_API_URL", "https://plutos.example");
  vi.stubEnv("PLUTOS_API_KEY", "k");
  vi.stubEnv("PLUTOS_SYNC_FROM", "2026-01-01T00:00:00Z");
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllEnvs());

describe("enqueuePlutosSyncIfEligible", () => {
  it("no-ops when the integration is disabled", async () => {
    vi.stubEnv("PLUTOS_SYNC_ENABLED", "false");
    await enqueuePlutosSyncIfEligible("order", "o1", new Date("2026-07-15T00:00:00Z"));
    expect(enqueueOutboxEvent).not.toHaveBeenCalled();
  });

  it("no-ops for an invoice issued before the cutoff", async () => {
    enablePlutos();
    await enqueuePlutosSyncIfEligible("order", "o1", new Date("2025-12-31T00:00:00Z"));
    expect(enqueueOutboxEvent).not.toHaveBeenCalled();
  });

  it("no-ops when the invoice has no issue date", async () => {
    enablePlutos();
    await enqueuePlutosSyncIfEligible("order", "o1", null);
    expect(enqueueOutboxEvent).not.toHaveBeenCalled();
  });

  it("enqueues one event with the namespaced key when eligible", async () => {
    enablePlutos();
    await enqueuePlutosSyncIfEligible("order", "o1", new Date("2026-07-15T00:00:00Z"));
    expect(enqueueOutboxEvent).toHaveBeenCalledTimes(1);
    expect(enqueueOutboxEvent).toHaveBeenCalledWith({
      type: "plutos_invoice_requested",
      payload: { target: "order", targetId: "o1" },
      idempotencyKey: "plutos_invoice_requested:elegantrender.com:order:o1",
    });
  });

  it("swallows an enqueue failure so the local invoice result is unaffected", async () => {
    enablePlutos();
    enqueueOutboxEvent.mockRejectedValueOnce(new Error("db down"));
    await expect(
      enqueuePlutosSyncIfEligible("order", "o1", new Date("2026-07-15T00:00:00Z")),
    ).resolves.toBeUndefined();
  });
});

describe("ensurePlutosSyncQueued", () => {
  it("creates the event when none exists", async () => {
    outboxFindUnique.mockResolvedValue(null);
    const outcome = await ensurePlutosSyncQueued("charge", "c1");
    expect(outcome).toBe("created");
    expect(enqueueOutboxEvent).toHaveBeenCalledTimes(1);
    expect(outboxUpdate).not.toHaveBeenCalled();
  });

  it("resets a failed event back to pending", async () => {
    outboxFindUnique.mockResolvedValue({ id: "e1", status: "failed" });
    const outcome = await ensurePlutosSyncQueued("order", "o1");
    expect(outcome).toBe("reset");
    expect(outboxUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "e1" },
        data: expect.objectContaining({ status: "pending", attempts: 0 }),
      }),
    );
    expect(kickOutboxSoon).toHaveBeenCalled();
    expect(enqueueOutboxEvent).not.toHaveBeenCalled();
  });

  it("leaves an in-flight event alone so no duplicate is created", async () => {
    outboxFindUnique.mockResolvedValue({ id: "e1", status: "running" });
    const outcome = await ensurePlutosSyncQueued("order", "o1");
    expect(outcome).toBe("skipped");
    expect(enqueueOutboxEvent).not.toHaveBeenCalled();
    expect(outboxUpdate).not.toHaveBeenCalled();
  });
});
