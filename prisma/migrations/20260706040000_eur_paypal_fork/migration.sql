-- AlterEnum
BEGIN;
CREATE TYPE "BuyerType_new" AS ENUM ('individual', 'business');
ALTER TABLE "users" ALTER COLUMN "billingBuyerType" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "buyerType" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "billingBuyerType" TYPE "BuyerType_new" USING ("billingBuyerType"::text::"BuyerType_new");
ALTER TABLE "orders" ALTER COLUMN "buyerType" TYPE "BuyerType_new" USING ("buyerType"::text::"BuyerType_new");
ALTER TABLE "order_charges" ALTER COLUMN "buyerType" TYPE "BuyerType_new" USING ("buyerType"::text::"BuyerType_new");
ALTER TYPE "BuyerType" RENAME TO "BuyerType_old";
ALTER TYPE "BuyerType_new" RENAME TO "BuyerType";
DROP TYPE "BuyerType_old";
ALTER TABLE "users" ALTER COLUMN "billingBuyerType" SET DEFAULT 'individual';
ALTER TABLE "orders" ALTER COLUMN "buyerType" SET DEFAULT 'individual';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentProvider_new" AS ENUM ('paypal', 'wire_transfer', 'card_mock');
ALTER TABLE "orders" ALTER COLUMN "paymentProvider" TYPE "PaymentProvider_new" USING ("paymentProvider"::text::"PaymentProvider_new");
ALTER TABLE "order_charges" ALTER COLUMN "paymentProvider" TYPE "PaymentProvider_new" USING ("paymentProvider"::text::"PaymentProvider_new");
ALTER TYPE "PaymentProvider" RENAME TO "PaymentProvider_old";
ALTER TYPE "PaymentProvider_new" RENAME TO "PaymentProvider";
DROP TYPE "PaymentProvider_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "BillingCurrency_new" AS ENUM ('EUR');
ALTER TABLE "orders" ALTER COLUMN "billingCurrency" TYPE "BillingCurrency_new" USING ("billingCurrency"::text::"BillingCurrency_new");
ALTER TABLE "order_charges" ALTER COLUMN "billingCurrency" TYPE "BillingCurrency_new" USING ("billingCurrency"::text::"BillingCurrency_new");
ALTER TYPE "BillingCurrency" RENAME TO "BillingCurrency_old";
ALTER TYPE "BillingCurrency_new" RENAME TO "BillingCurrency";
DROP TYPE "BillingCurrency_old";
COMMIT;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "billingRsdRate",
DROP COLUMN "companyMb",
DROP COLUMN "nestpayAuthCode",
DROP COLUMN "nestpayChargeRate",
DROP COLUMN "nestpayChargedAmountCents",
DROP COLUMN "nestpayChargedCurrency",
DROP COLUMN "nestpayExtraTrxDate",
DROP COLUMN "nestpayHostRefNum",
DROP COLUMN "nestpayInstallmentCount",
DROP COLUMN "nestpayLastQueryAt",
DROP COLUMN "nestpayMdStatus",
DROP COLUMN "nestpayProcReturnCode",
DROP COLUMN "nestpayResponseHash",
DROP COLUMN "nestpayResponseRaw",
DROP COLUMN "nestpayTransId",
DROP COLUMN "premiumTotalRsd",
DROP COLUMN "totalRsd",
ADD COLUMN     "chargedAmountMinor" INTEGER,
ADD COLUMN     "chargedCurrency" TEXT,
ADD COLUMN     "chargedFxAsOf" TIMESTAMP(3),
ADD COLUMN     "chargedFxRate" DECIMAL(12,6),
ADD COLUMN     "paypalCaptureId" TEXT,
ADD COLUMN     "paypalCaptureStatus" TEXT,
ADD COLUMN     "paypalLastQueryAt" TIMESTAMP(3),
ADD COLUMN     "paypalPayerCountry" TEXT,
ADD COLUMN     "paypalPayerEmail" TEXT,
ADD COLUMN     "paypalResponseRaw" JSONB,
ADD COLUMN     "premiumTotalEur" INTEGER,
ADD COLUMN     "totalEur" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "basePriceRsd",
DROP COLUMN "originalTotalRsd",
DROP COLUMN "totalRsd",
ADD COLUMN     "basePriceEur" INTEGER NOT NULL,
ADD COLUMN     "originalTotalEur" INTEGER,
ADD COLUMN     "totalEur" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "order_charges" DROP COLUMN "billingRsdRate",
DROP COLUMN "companyMb",
DROP COLUMN "nestpayAuthCode",
DROP COLUMN "nestpayChargeRate",
DROP COLUMN "nestpayChargedAmountCents",
DROP COLUMN "nestpayChargedCurrency",
DROP COLUMN "nestpayExtraTrxDate",
DROP COLUMN "nestpayHostRefNum",
DROP COLUMN "nestpayLastQueryAt",
DROP COLUMN "nestpayMdStatus",
DROP COLUMN "nestpayProcReturnCode",
DROP COLUMN "nestpayResponseHash",
DROP COLUMN "nestpayResponseRaw",
DROP COLUMN "nestpayTransId",
ADD COLUMN     "chargedAmountMinor" INTEGER,
ADD COLUMN     "chargedCurrency" TEXT,
ADD COLUMN     "chargedFxAsOf" TIMESTAMP(3),
ADD COLUMN     "chargedFxRate" DECIMAL(12,6),
ADD COLUMN     "paypalCaptureId" TEXT,
ADD COLUMN     "paypalCaptureStatus" TEXT,
ADD COLUMN     "paypalLastQueryAt" TIMESTAMP(3),
ADD COLUMN     "paypalPayerCountry" TEXT,
ADD COLUMN     "paypalPayerEmail" TEXT,
ADD COLUMN     "paypalResponseRaw" JSONB;

-- AlterTable
ALTER TABLE "pricing_products" DROP COLUMN "basePriceRsd",
ADD COLUMN     "basePriceEur" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "pricing_add_ons" DROP COLUMN "priceRsd",
ADD COLUMN     "priceEur" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "pricing_duration_rules" DROP COLUMN "perSecondRsd",
ADD COLUMN     "perSecondEur" DOUBLE PRECISION NOT NULL;

-- CreateTable
CREATE TABLE "payment_webhook_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "resourceId" TEXT,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_webhook_events_eventType_receivedAt_idx" ON "payment_webhook_events"("eventType", "receivedAt");

-- Partial index for the PayPal reconcile cron sweep (not expressible in
-- schema.prisma). Matches the reconciler's WHERE clause exactly.
CREATE INDEX "orders_paypal_pending_idx"
  ON "orders" ("paymentStatus", "updatedAt")
  WHERE "paymentProvider" = 'paypal' AND "paymentStatus" = 'pending';
