import { describe, expect, it } from "vitest";
import type { OrderStatus } from "@/generated/prisma/client";
import {
  VALID_TRANSITIONS,
  canTransition,
} from "@/lib/order/status-transitions";

const ALL_STATUSES = Object.keys(VALID_TRANSITIONS) as OrderStatus[];

describe("canTransition", () => {
  it("dozvoljava regularan put porudžbine", () => {
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

  it("dozvoljava revizionu petlju", () => {
    expect(canTransition("in_review", "revision_requested")).toBe(true);
    expect(canTransition("revision_requested", "in_progress")).toBe(true);
  });

  it("dozvoljava besplatnu reviziju posle isporuke (admin override)", () => {
    expect(canTransition("delivered", "in_progress")).toBe(true);
  });

  it("ne dozvoljava preskakanje plaćanja", () => {
    expect(canTransition("draft", "paid")).toBe(false);
    expect(canTransition("draft", "in_progress")).toBe(false);
    expect(canTransition("awaiting_payment", "in_progress")).toBe(false);
    expect(canTransition("awaiting_payment", "delivered")).toBe(false);
  });

  it("refundacija je moguća samo iz paid", () => {
    for (const from of ALL_STATUSES) {
      expect(canTransition(from, "refunded" as OrderStatus)).toBe(
        from === "paid",
      );
    }
  });

  it("terminalna stanja nemaju izlaz", () => {
    for (const terminal of ["closed", "cancelled", "refunded"] as OrderStatus[]) {
      for (const to of ALL_STATUSES) {
        expect(canTransition(terminal, to)).toBe(false);
      }
    }
  });

  it("nepoznat status ne prolazi", () => {
    expect(canTransition("nepostojeci" as OrderStatus, "paid")).toBe(false);
  });
});
