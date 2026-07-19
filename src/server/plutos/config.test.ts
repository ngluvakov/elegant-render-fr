import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

import { isPlutosEligible, resolvePlutosConfig } from "./config";

beforeEach(() => {
  vi.stubEnv("PLUTOS_SYNC_ENABLED", "true");
  vi.stubEnv("PLUTOS_API_URL", "https://plutos.example");
  vi.stubEnv("PLUTOS_API_KEY", "k");
  vi.stubEnv("PLUTOS_SYNC_FROM", "2026-01-01T00:00:00Z");
});
afterEach(() => vi.unstubAllEnvs());

describe("resolvePlutosConfig", () => {
  it("is disabled unless PLUTOS_SYNC_ENABLED=true", () => {
    vi.stubEnv("PLUTOS_SYNC_ENABLED", "false");
    const result = resolvePlutosConfig();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("disabled");
  });

  it("is invalid_config when the URL is missing", () => {
    vi.stubEnv("PLUTOS_API_URL", "");
    const result = resolvePlutosConfig();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("invalid_config");
  });

  it("is invalid_config when PLUTOS_SYNC_FROM is not a valid ISO timestamp", () => {
    vi.stubEnv("PLUTOS_SYNC_FROM", "not-a-date");
    const result = resolvePlutosConfig();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("invalid_config");
  });

  it("strips a trailing slash from the API URL so endpoint joins can't double up", () => {
    vi.stubEnv("PLUTOS_API_URL", "https://plutos.example/");
    const result = resolvePlutosConfig();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.config.apiUrl).toBe("https://plutos.example");
  });

  it("returns the parsed config when everything is valid", () => {
    const result = resolvePlutosConfig();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.apiKey).toBe("k");
      expect(result.config.from.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    }
  });
});

describe("isPlutosEligible", () => {
  const from = new Date("2026-01-01T00:00:00Z");

  it("is false for a null issue date", () => {
    expect(isPlutosEligible(null, from)).toBe(false);
  });

  it("is false before the cutoff", () => {
    expect(isPlutosEligible(new Date("2025-12-31T23:59:59Z"), from)).toBe(false);
  });

  it("is true at or after the cutoff", () => {
    expect(isPlutosEligible(from, from)).toBe(true);
    expect(isPlutosEligible(new Date("2026-07-15T00:00:00Z"), from)).toBe(true);
  });
});
