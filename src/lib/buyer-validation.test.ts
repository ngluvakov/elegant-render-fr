import { describe, expect, it } from "vitest";
import { validateBuyerInfo } from "@/lib/buyer-validation";

describe("validateBuyerInfo", () => {
  it("prihvata fizičko lice sa državom", () => {
    expect(
      validateBuyerInfo({ buyerType: "individual", buyerCountryCode: "RS" }),
    ).toBeNull();
  });

  it("odbija fizičko lice bez države", () => {
    expect(
      validateBuyerInfo({ buyerType: "individual", buyerCountryCode: null }),
    ).toMatch(/country/i);
  });

  it("normalizuje mala slova u kodu države", () => {
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

    it("prihvata firmu bez VAT ID-a (opcion)", () => {
      expect(validateBuyerInfo(base)).toBeNull();
    });

    it("odbija firmu bez naziva ili adrese", () => {
      expect(
        validateBuyerInfo({
          buyerType: "business",
          buyerCountryCode: "DE",
          companyAddress: "Adresa 1",
        }),
      ).toMatch(/Company name/);
      expect(
        validateBuyerInfo({
          buyerType: "business",
          buyerCountryCode: "DE",
          companyName: "Firma",
        }),
      ).toMatch(/address/i);
    });

    it("odbija firmu bez države", () => {
      expect(
        validateBuyerInfo({
          buyerType: "business",
          companyName: "Firma",
          companyAddress: "Adresa 1",
        }),
      ).toMatch(/country/i);
    });

    it("koristi companyCountryCode kao rezervu za državu", () => {
      expect(
        validateBuyerInfo({
          buyerType: "business",
          companyName: "Firma",
          companyAddress: "Adresa 1",
          companyCountryCode: "fr",
        }),
      ).toBeNull();
    });

    it("prihvata validan EU VAT ID", () => {
      expect(
        validateBuyerInfo({ ...base, companyTaxId: "DE123456789" }),
      ).toBeNull();
    });

    it("odbija EU VAT ID pogrešnog formata (VIES prefiks)", () => {
      expect(validateBuyerInfo({ ...base, companyTaxId: "DE123" })).toMatch(
        /VAT ID/,
      );
      expect(
        validateBuyerInfo({ ...base, companyTaxId: "FR 12-34" }),
      ).toMatch(/VAT ID/);
    });

    it("prihvata ne-EU poreski broj u slobodnom formatu", () => {
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
