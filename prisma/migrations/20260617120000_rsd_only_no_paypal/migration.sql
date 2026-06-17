-- RSD-only pricing and payment domain.
-- Transactional test data is intentionally reset with scripts/reset-test-data-keep-users.ts.
-- These guards keep deploys recoverable if an earlier attempt already renamed columns.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'billingEurToRsdRate'
  ) THEN
    UPDATE "orders"
    SET "billingTotalCents" = ROUND("billingTotalCents" * 117.2)::integer
    WHERE "billingCurrency"::text = 'EUR'
      AND "billingTotalCents" IS NOT NULL;

    ALTER TABLE "orders" RENAME COLUMN "billingEurToRsdRate" TO "billingRsdRate";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'order_charges'
      AND column_name = 'billingEurToRsdRate'
  ) THEN
    UPDATE "order_charges"
    SET "billingTotalCents" = ROUND("billingTotalCents" * 117.2)::integer
    WHERE "billingCurrency"::text = 'EUR'
      AND "billingTotalCents" IS NOT NULL;

    ALTER TABLE "order_charges" RENAME COLUMN "billingEurToRsdRate" TO "billingRsdRate";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'totalEur'
  ) THEN
    ALTER TABLE "orders" RENAME COLUMN "totalEur" TO "totalRsd";
    UPDATE "orders" SET "totalRsd" = ROUND("totalRsd" * 117.2)::integer;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'premiumTotalEur'
  ) THEN
    ALTER TABLE "orders" RENAME COLUMN "premiumTotalEur" TO "premiumTotalRsd";
    UPDATE "orders"
    SET "premiumTotalRsd" = ROUND("premiumTotalRsd" * 117.2)::integer
    WHERE "premiumTotalRsd" IS NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'order_items'
      AND column_name = 'basePriceEur'
  ) THEN
    ALTER TABLE "order_items" RENAME COLUMN "basePriceEur" TO "basePriceRsd";
    UPDATE "order_items" SET "basePriceRsd" = ROUND("basePriceRsd" * 117.2)::integer;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'order_items'
      AND column_name = 'totalEur'
  ) THEN
    ALTER TABLE "order_items" RENAME COLUMN "totalEur" TO "totalRsd";
    UPDATE "order_items" SET "totalRsd" = ROUND("totalRsd" * 117.2)::integer;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'order_items'
      AND column_name = 'originalTotalEur'
  ) THEN
    ALTER TABLE "order_items" RENAME COLUMN "originalTotalEur" TO "originalTotalRsd";
    UPDATE "order_items"
    SET "originalTotalRsd" = ROUND("originalTotalRsd" * 117.2)::integer
    WHERE "originalTotalRsd" IS NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pricing_products'
      AND column_name = 'basePriceEur'
  ) THEN
    ALTER TABLE "pricing_products" RENAME COLUMN "basePriceEur" TO "basePriceRsd";
    UPDATE "pricing_products" SET "basePriceRsd" = ROUND("basePriceRsd" * 117.2);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pricing_add_ons'
      AND column_name = 'priceEur'
  ) THEN
    ALTER TABLE "pricing_add_ons" RENAME COLUMN "priceEur" TO "priceRsd";
    UPDATE "pricing_add_ons" SET "priceRsd" = ROUND("priceRsd" * 117.2);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pricing_duration_rules'
      AND column_name = 'perSecondEur'
  ) THEN
    ALTER TABLE "pricing_duration_rules" RENAME COLUMN "perSecondEur" TO "perSecondRsd";
    UPDATE "pricing_duration_rules" SET "perSecondRsd" = ROUND("perSecondRsd" * 117.2);
  END IF;
END $$;

UPDATE "orders" SET "paymentProvider" = NULL WHERE "paymentProvider"::text = 'paypal';
UPDATE "order_charges" SET "paymentProvider" = NULL WHERE "paymentProvider"::text = 'paypal';

DROP INDEX IF EXISTS "orders_nestpay_pending_idx";
DROP TYPE IF EXISTS "PaymentProvider_new";
CREATE TYPE "PaymentProvider_new" AS ENUM ('card_mock', 'wire_transfer', 'nestpay');
ALTER TABLE "orders"
  ALTER COLUMN "paymentProvider" TYPE "PaymentProvider_new"
  USING ("paymentProvider"::text::"PaymentProvider_new");
ALTER TABLE "order_charges"
  ALTER COLUMN "paymentProvider" TYPE "PaymentProvider_new"
  USING ("paymentProvider"::text::"PaymentProvider_new");
DROP TYPE "PaymentProvider";
ALTER TYPE "PaymentProvider_new" RENAME TO "PaymentProvider";
CREATE INDEX "orders_nestpay_pending_idx"
  ON "orders" ("paymentStatus", "createdAt")
  WHERE "paymentProvider" = 'nestpay';

UPDATE "orders" SET "billingCurrency" = 'RSD' WHERE "billingCurrency" IS NOT NULL;
UPDATE "order_charges" SET "billingCurrency" = 'RSD' WHERE "billingCurrency" IS NOT NULL;

DROP TYPE IF EXISTS "BillingCurrency_new";
CREATE TYPE "BillingCurrency_new" AS ENUM ('RSD');
ALTER TABLE "orders"
  ALTER COLUMN "billingCurrency" TYPE "BillingCurrency_new"
  USING ("billingCurrency"::text::"BillingCurrency_new");
ALTER TABLE "order_charges"
  ALTER COLUMN "billingCurrency" TYPE "BillingCurrency_new"
  USING ("billingCurrency"::text::"BillingCurrency_new");
DROP TYPE "BillingCurrency";
ALTER TYPE "BillingCurrency_new" RENAME TO "BillingCurrency";

UPDATE "orders" SET "billingRsdRate" = 1 WHERE "billingRsdRate" IS NOT NULL;
UPDATE "order_charges" SET "billingRsdRate" = 1 WHERE "billingRsdRate" IS NOT NULL;
UPDATE "orders" SET "nestpayChargeRate" = 1 WHERE "nestpayChargeRate" IS NOT NULL;
UPDATE "order_charges" SET "nestpayChargeRate" = 1 WHERE "nestpayChargeRate" IS NOT NULL;
