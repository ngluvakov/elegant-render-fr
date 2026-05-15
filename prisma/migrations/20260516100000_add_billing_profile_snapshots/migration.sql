-- Billing profile defaults and immutable billing snapshots.
-- Payment provider amounts remain in the existing EUR fields; these
-- fields represent customer-facing invoice/display currency.

CREATE TYPE "BillingCurrency" AS ENUM ('RSD', 'EUR');

ALTER TABLE "users"
  ADD COLUMN "billingBuyerType" "BuyerType" NOT NULL DEFAULT 'individual',
  ADD COLUMN "billingCountryCode" TEXT,
  ADD COLUMN "billingCompanyName" TEXT,
  ADD COLUMN "billingCompanyTaxId" TEXT,
  ADD COLUMN "billingCompanyMb" TEXT,
  ADD COLUMN "billingCompanyAddress" TEXT;

ALTER TABLE "orders"
  ADD COLUMN "buyerCountryCode" TEXT,
  ADD COLUMN "billingCurrency" "BillingCurrency",
  ADD COLUMN "billingVatRate" DOUBLE PRECISION,
  ADD COLUMN "billingEurToRsdRate" DOUBLE PRECISION,
  ADD COLUMN "billingTotalCents" INTEGER;

ALTER TABLE "order_charges"
  ADD COLUMN "buyerType" "BuyerType",
  ADD COLUMN "buyerCountryCode" TEXT,
  ADD COLUMN "companyName" TEXT,
  ADD COLUMN "companyTaxId" TEXT,
  ADD COLUMN "companyMb" TEXT,
  ADD COLUMN "companyAddress" TEXT,
  ADD COLUMN "companyCountryCode" TEXT,
  ADD COLUMN "billingCurrency" "BillingCurrency",
  ADD COLUMN "billingVatRate" DOUBLE PRECISION,
  ADD COLUMN "billingEurToRsdRate" DOUBLE PRECISION,
  ADD COLUMN "billingTotalCents" INTEGER;

