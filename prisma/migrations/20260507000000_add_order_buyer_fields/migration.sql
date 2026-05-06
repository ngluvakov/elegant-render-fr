-- Buyer identity for invoicing. Adds the BuyerType enum and 5 nullable
-- columns to orders. Existing rows get buyerType='individual' via the
-- column default — that matches the implicit pre-PR behavior where
-- every customer was treated as a natural person.

CREATE TYPE "BuyerType" AS ENUM ('individual', 'company_rs', 'company_foreign');

ALTER TABLE "orders"
  ADD COLUMN "buyerType"          "BuyerType" NOT NULL DEFAULT 'individual',
  ADD COLUMN "companyName"        TEXT,
  ADD COLUMN "companyTaxId"       TEXT,
  ADD COLUMN "companyMb"          TEXT,
  ADD COLUMN "companyAddress"     TEXT,
  ADD COLUMN "companyCountryCode" TEXT;
