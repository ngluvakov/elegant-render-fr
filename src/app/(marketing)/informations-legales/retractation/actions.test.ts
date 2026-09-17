import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  recordAuditLog: vi.fn(),
  sendAdmin: vi.fn(),
  sendCustomer: vi.fn(),
  checkRateLimit: vi.fn(),
  getIdentifier: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mocks.captureException,
}));

vi.mock("@/lib/audit", () => ({
  recordAuditLog: mocks.recordAuditLog,
}));

vi.mock("@/lib/email", () => ({
  sendWithdrawalNoticeAdminEmail: mocks.sendAdmin,
  sendWithdrawalNoticeCustomerEmail: mocks.sendCustomer,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  getServerActionIdentifier: mocks.getIdentifier,
  rateLimitMessage: () => "Too many requests.",
}));

import { submitWithdrawalNotice } from "./actions";

function validForm(overrides: Record<string, string> = {}): FormData {
  const values = {
    affirmation: "withdraw",
    consumerName: "Ada Lovelace",
    consumerEmail: "ADA@example.com",
    orderNumber: "ER-2026-001",
    contractDate: "2026-08-01",
    serviceDescription: "Interior render",
    message: "Please confirm receipt.",
    companyWebsite: "",
    ...overrides,
  };
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getIdentifier.mockResolvedValue("ip:127.0.0.1");
  mocks.checkRateLimit.mockResolvedValue({ ok: true });
  mocks.sendAdmin.mockResolvedValue(undefined);
  mocks.sendCustomer.mockResolvedValue(undefined);
  mocks.recordAuditLog.mockResolvedValue(undefined);
});

describe("submitWithdrawalNotice", () => {
  it("rejects an invalid email before recording the notice", async () => {
    const result = await submitWithdrawalNotice(
      { status: "idle" },
      validForm({ consumerEmail: "invalid" }),
    );

    expect(result).toEqual({
      status: "error",
      message: "Saisissez une adresse e-mail valide.",
    });
    expect(mocks.sendAdmin).not.toHaveBeenCalled();
    expect(mocks.recordAuditLog).not.toHaveBeenCalled();
  });

  it("rejects a calendar date that JavaScript would otherwise normalise", async () => {
    const result = await submitWithdrawalNotice(
      { status: "idle" },
      validForm({ contractDate: "2026-02-31" }),
    );

    expect(result).toEqual({
      status: "error",
      message: "Saisissez une date de contrat valide.",
    });
    expect(mocks.sendAdmin).not.toHaveBeenCalled();
  });

  it("records a valid statement and emails matching durable copies", async () => {
    const result = await submitWithdrawalNotice(
      { status: "idle" },
      validForm(),
    );

    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    expect(result.reference).toMatch(/^ER-WD-\d{8}-[A-F0-9]{8}$/);
    expect(result.confirmationSent).toBe(true);
    expect(mocks.sendAdmin).toHaveBeenCalledOnce();
    expect(mocks.sendCustomer).toHaveBeenCalledOnce();
    expect(mocks.sendCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: result.reference,
        consumerEmail: "ada@example.com",
        orderNumber: "ER-2026-001",
      }),
    );
    expect(mocks.recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "consumer.withdrawal_notice_received",
        entityId: result.reference,
      }),
    );
  });

  it("does not report receipt when the operations copy fails", async () => {
    mocks.sendAdmin.mockRejectedValue(new Error("mailbox unavailable"));

    const result = await submitWithdrawalNotice(
      { status: "idle" },
      validForm(),
    );

    expect(result.status).toBe("error");
    expect(mocks.recordAuditLog).not.toHaveBeenCalled();
    expect(mocks.sendCustomer).not.toHaveBeenCalled();
    expect(mocks.captureException).toHaveBeenCalledOnce();
  });

  it("reports a recorded notice even if the customer email fails", async () => {
    mocks.sendCustomer.mockRejectedValue(new Error("delivery rejected"));

    const result = await submitWithdrawalNotice(
      { status: "idle" },
      validForm(),
    );

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.confirmationSent).toBe(false);
    }
    expect(mocks.recordAuditLog).toHaveBeenCalledOnce();
    expect(mocks.captureException).toHaveBeenCalledOnce();
  });

  it("applies the public rate limit before processing fields", async () => {
    mocks.checkRateLimit.mockResolvedValue({
      ok: false,
      retryAfterSeconds: 60,
      limit: 5,
    });

    const result = await submitWithdrawalNotice(
      { status: "idle" },
      validForm(),
    );

    expect(result).toEqual({ status: "error", message: "Too many requests." });
    expect(mocks.sendAdmin).not.toHaveBeenCalled();
  });
});
