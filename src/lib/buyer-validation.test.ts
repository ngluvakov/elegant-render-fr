import { describe, expect, it } from "vitest";
import { validateBuyerInfo } from "@/lib/buyer-validation";

describe("validateBuyerInfo", () => {
  it("accepts an individual with a country", () => {
    expect(
      validateBuyerInfo({ buyerType: "individual", buyerCountryCode: "RS" }),
    ).toBeNull();
  });

  it("rejects an individual without a country", () => {
    expect(
      validateBuyerInfo({ buyerType: "individual", buyerCountryCode: null }),
    ).toMatch(/pays de facturation/i);
  });

  it("normalizes lowercase letters in the country code", () => {
    expect(
      validateBuyerInfo({ buyerType: "individual", buyerCountryCode: " de " }),
    ).toBeNull();
  });

  describe("business", () => {
    const base = {
      buyerType: "business" as const,
      companyName: "Acme GmbH",
      companyAddress: "Hauptstrasse 1, Berlin",
      buyerCountryCode: "DE",
    };

    it("accepts a business without a VAT ID (optional)", () => {
      expect(validateBuyerInfo(base)).toBeNull();
    });

    it("rejects a business without a name or address", () => {
      expect(
        validateBuyerInfo({
          buyerType: "business",
          buyerCountryCode: "DE",
          companyAddress: "Address 1",
        }),
      ).toMatch(/nom de l’entreprise/i);
      expect(
        validateBuyerInfo({
          buyerType: "business",
          buyerCountryCode: "DE",
          companyName: "Firm",
        }),
      ).toMatch(/adresse de l’entreprise/i);
    });

    it("rejects a business without a country", () => {
      expect(
        validateBuyerInfo({
          buyerType: "business",
          companyName: "Firm",
          companyAddress: "Address 1",
        }),
      ).toMatch(/pays de facturation/i);
    });

    it("uses companyCountryCode as the country fallback", () => {
      expect(
        validateBuyerInfo({
          buyerType: "business",
          companyName: "Firm",
          companyAddress: "Address 1",
          companyCountryCode: "fr",
        }),
      ).toBeNull();
    });

    it("accepts a valid EU VAT ID", () => {
      expect(
        validateBuyerInfo({ ...base, companyTaxId: "DE123456789" }),
      ).toBeNull();
    });

    it("rejects an EU VAT ID with a bad format (VIES prefix)", () => {
      expect(validateBuyerInfo({ ...base, companyTaxId: "DE123" })).toMatch(
        /numéro de TVA/i,
      );
      expect(
        validateBuyerInfo({ ...base, companyTaxId: "FR 12-34" }),
      ).toMatch(/numéro de TVA/i);
    });

    it("accepts a non-EU tax number in free format", () => {
      expect(
        validateBuyerInfo({
          ...base,
          buyerCountryCode: "US",
          companyTaxId: "98-7654321",
        }),
      ).toBeNull();
      expect(
        validateBuyerInfo({
          ...base,
          buyerCountryCode: "CH",
          companyTaxId: "CHE-123.456.789",
        }),
      ).toBeNull();
    });
  });
});
