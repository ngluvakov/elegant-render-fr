import { describe, expect, it } from "vitest";
import type { OrderStatus } from "@/generated/prisma/client";
import {
  VALID_TRANSITIONS,
  canTransition,
} from "@/lib/order/status-transitions";

const ALL_STATUSES = Object.keys(VALID_TRANSITIONS) as OrderStatus[];

describe("canTransition", () => {
  it("allows the regular order path", () => {
    const happyPath: OrderStatus[] = [
      "draft",
      "awaiting_payment",
      "paid",
      "in_progress",
      "in_review",
      "delivered",
      "closed",
    ];
    for (let i = 0; i < happyPath.length - 1; i++) {
      expect(canTransition(happyPath[i], happyPath[i + 1])).toBe(true);
    }
  });

  it("allows the revision loop", () => {
    expect(canTransition("in_review", "revision_requested")).toBe(true);
    expect(canTransition("revision_requested", "in_progress")).toBe(true);
  });

  it("allows a free revision after delivery (admin override)", () => {
    expect(canTransition("delivered", "in_progress")).toBe(true);
  });

  it("does not allow skipping payment", () => {
    expect(canTransition("draft", "paid")).toBe(false);
    expect(canTransition("draft", "in_progress")).toBe(false);
    expect(canTransition("awaiting_payment", "in_progress")).toBe(false);
    expect(canTransition("awaiting_payment", "delivered")).toBe(false);
  });

  it("refund is only possible from paid", () => {
    for (const from of ALL_STATUSES) {
      expect(canTransition(from, "refunded" as OrderStatus)).toBe(
        from === "paid",
      );
    }
  });

  it("terminal states have no exit", () => {
    for (const terminal of ["closed", "cancelled", "refunded"] as OrderStatus[]) {
      for (const to of ALL_STATUSES) {
        expect(canTransition(terminal, to)).toBe(false);
      }
    }
  });

  it("an unknown status does not pass", () => {
    expect(canTransition("nonexistent" as OrderStatus, "paid")).toBe(false);
  });
});
