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
    ).toMatch(/Država/);
  });

  it("normalizuje mala slova u kodu države", () => {
    expect(
      validateBuyerInfo({ buyerType: "individual", buyerCountryCode: " rs " }),
    ).toBeNull();
  });

  describe("company_rs", () => {
    const base = {
      buyerType: "company_rs" as const,
      companyName: "White Rook DOO",
      companyAddress: "Bulevar 1, Beograd",
    };

    it("prihvata firmu sa validnim PIB-om (9 cifara)", () => {
      expect(
        validateBuyerInfo({ ...base, companyTaxId: "123456789" }),
      ).toBeNull();
    });

    it("odbija PIB koji nema tačno 9 cifara", () => {
      expect(validateBuyerInfo({ ...base, companyTaxId: "12345678" })).toMatch(
        /PIB/,
      );
      expect(
        validateBuyerInfo({ ...base, companyTaxId: "1234567890" }),
      ).toMatch(/PIB/);
      expect(validateBuyerInfo({ ...base, companyTaxId: "12345678a" })).toMatch(
        /PIB/,
      );
    });

    it("odbija firmu bez naziva ili adrese", () => {
      expect(
        validateBuyerInfo({
          buyerType: "company_rs",
          companyTaxId: "123456789",
          companyAddress: "Adresa 1",
        }),
      ).toMatch(/Naziv firme/);
      expect(
        validateBuyerInfo({
          buyerType: "company_rs",
          companyName: "Firma",
          companyTaxId: "123456789",
        }),
      ).toMatch(/Adresa/);
    });

    it("matični broj je opcion, ali ako postoji mora imati 8 cifara", () => {
      expect(
        validateBuyerInfo({ ...base, companyTaxId: "123456789", companyMb: "" }),
      ).toBeNull();
      expect(
        validateBuyerInfo({
          ...base,
          companyTaxId: "123456789",
          companyMb: "1234567",
        }),
      ).toMatch(/Matični broj/);
    });

    it("odbija domaću firmu sa stranom državom", () => {
      expect(
        validateBuyerInfo({
          ...base,
          buyerCountryCode: "DE",
          companyTaxId: "123456789",
        }),
      ).toMatch(/Srbij/);
    });
  });

  describe("company_foreign", () => {
    const base = {
      buyerType: "company_foreign" as const,
      companyName: "Acme GmbH",
      companyAddress: "Hauptstrasse 1, Berlin",
      buyerCountryCode: "DE",
    };

    it("prihvata stranu firmu bez VAT ID-a (opcion za ne-EU)", () => {
      expect(validateBuyerInfo(base)).toBeNull();
    });

    it("prihvata validan VAT ID", () => {
      expect(
        validateBuyerInfo({ ...base, companyTaxId: "DE123456789" }),
      ).toBeNull();
    });

    it("odbija VAT ID pogrešnog formata", () => {
      expect(validateBuyerInfo({ ...base, companyTaxId: "12345" })).toMatch(
        /VAT ID/,
      );
    });

    it("preusmerava RS firmu na tip company_rs", () => {
      expect(
        validateBuyerInfo({ ...base, buyerCountryCode: "RS" }),
      ).toMatch(/Firma — Srbija/);
    });
  });
});
