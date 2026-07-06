import { describe, expect, it } from "vitest";
import { CHARGE_CURRENCIES, CURRENCY_RULES, chargeCurrencyForCountry } from "./config";
import { FX_RATES_EUR } from "./fx-rates";
import { convertEurCentsToMinor, formatChargeAmount, roundUpMarketable } from "./convert";

describe("FX table sanity", () => {
  it("has a positive rate for every charge currency", () => {
    for (const c of CHARGE_CURRENCIES) {
      expect(FX_RATES_EUR[c]).toBeGreaterThan(0);
    }
  });

  it("EUR rate is exactly 1", () => {
    expect(FX_RATES_EUR.EUR).toBe(1);
  });
});

describe("roundUpMarketable", () => {
  it("never rounds below the raw conversion (revenue-up property)", () => {
    for (const c of CHARGE_CURRENCIES) {
      for (const raw of [0.01, 1, 9.99, 47.2, 169, 197.7, 200, 999.01, 12345.67]) {
        const rounded = roundUpMarketable(raw, c);
        expect(rounded).toBeGreaterThanOrEqual(raw - 1e-9);
      }
    }
  });

  it("x9-ending currencies land on increment−1 when that stays above raw", () => {
    // €169 → $197.70 at 1.17 → next 10-increment is 200 → 199
    expect(roundUpMarketable(197.7, "USD")).toBe(199);
    // Exactly on the increment: 200−1=199 would round DOWN → bump a step
    expect(roundUpMarketable(200, "USD")).toBe(209);
  });

  it("increment currencies land exactly on the increment", () => {
    expect(roundUpMarketable(197.7, "SEK")).toBe(200);
    expect(roundUpMarketable(67601, "HUF")).toBe(68000);
    expect(roundUpMarketable(29068, "JPY")).toBe(30000);
  });
});

describe("convertEurCentsToMinor", () => {
  it("EUR is identity — catalog price points are final", () => {
    const r = convertEurCentsToMinor(16900, "EUR");
    expect(r.amountMinor).toBe(16900);
    expect(r.amountMajor).toBe(169);
    expect(r.fxRate).toBe(1);
  });

  it("cent currencies return minor = major × 100", () => {
    const r = convertEurCentsToMinor(16900, "USD");
    expect(r.amountMajor * 100).toBe(r.amountMinor);
    expect(Number.isInteger(r.amountMinor)).toBe(true);
  });

  it("zero-decimal currencies return whole units as minor", () => {
    for (const c of ["JPY", "HUF", "TWD"] as const) {
      expect(CURRENCY_RULES[c].minorUnits).toBe(0);
      const r = convertEurCentsToMinor(16900, c);
      expect(r.amountMinor).toBe(r.amountMajor);
      expect(Number.isInteger(r.amountMinor)).toBe(true);
    }
  });

  it("converted majors are always marketable-rounded above raw", () => {
    for (const c of CHARGE_CURRENCIES) {
      const eurCents = 16900;
      const raw = (eurCents / 100) * FX_RATES_EUR[c];
      const r = convertEurCentsToMinor(eurCents, c);
      expect(r.amountMajor).toBeGreaterThanOrEqual(Math.floor(raw));
      if (c !== "EUR") {
        expect(r.amountMajor).toBeGreaterThanOrEqual(raw - 1e-9);
      }
    }
  });

  it("rejects non-integer and negative cent inputs", () => {
    expect(() => convertEurCentsToMinor(12.5, "USD")).toThrow();
    expect(() => convertEurCentsToMinor(-100, "USD")).toThrow();
  });
});

describe("formatChargeAmount", () => {
  it("whole marketable prices render without decimals", () => {
    expect(formatChargeAmount(19900, "USD")).toContain("199");
    expect(formatChargeAmount(19900, "USD")).not.toContain(".00");
  });

  it("zero-decimal currencies format whole units", () => {
    const jpy = formatChargeAmount(30000, "JPY");
    expect(jpy).toMatch(/30[,.]?000/);
  });
});

describe("chargeCurrencyForCountry", () => {
  it("maps direct countries", () => {
    expect(chargeCurrencyForCountry("US")).toBe("USD");
    expect(chargeCurrencyForCountry("GB")).toBe("GBP");
    expect(chargeCurrencyForCountry("JP")).toBe("JPY");
    expect(chargeCurrencyForCountry("HU")).toBe("HUF");
  });

  it("falls back by region: Americas/Asia-Pacific → USD, Europe/rest → EUR", () => {
    expect(chargeCurrencyForCountry("BR")).toBe("USD"); // BRL not sellable
    expect(chargeCurrencyForCountry("RU")).toBe("USD"); // owner's example
    expect(chargeCurrencyForCountry("RS")).toBe("EUR"); // owner's example
    expect(chargeCurrencyForCountry("DE")).toBe("EUR");
    expect(chargeCurrencyForCountry("ZA")).toBe("EUR");
    expect(chargeCurrencyForCountry(null)).toBe("EUR");
    expect(chargeCurrencyForCountry("XX")).toBe("EUR");
  });
});
