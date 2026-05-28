-- Banca Intesa Nestpay (3D Pay Hosting) integration.
--
-- Adds the `nestpay` value to the PaymentProvider enum so the
-- existing payment flow can route card capture through the Banca
-- Intesa HPP redirect, and extends Order + OrderCharge with forensic
-- columns for the bank's standard response payload (TransId,
-- AuthCode, ProcReturnCode, mdStatus, HostRefNum, EXTRA.TRXDATE) plus
-- the raw verified POST body. Two new OutboxEventType values carry
-- the bank-mandated payment confirmation and failure notifications.
--
-- The `nestpayCharged*` triad captures the actual RSD amount
-- charged on the card. Banca Intesa clears in RSD (currency=941)
-- even for EUR-billed foreign buyers, so the conversion happens at
-- the rate displayed to the customer at checkout per EPM standard
-- 2.1.3 "Izjava o konverziji" and the snapshot lives on the order
-- for accounting reconciliation.

ALTER TYPE "PaymentProvider" ADD VALUE 'nestpay';

ALTER TYPE "OutboxEventType" ADD VALUE 'payment_success_email';
ALTER TYPE "OutboxEventType" ADD VALUE 'payment_failure_email';

ALTER TABLE "orders"
  ADD COLUMN "nestpayTransId" TEXT,
  ADD COLUMN "nestpayAuthCode" TEXT,
  ADD COLUMN "nestpayProcReturnCode" TEXT,
  ADD COLUMN "nestpayMdStatus" TEXT,
  ADD COLUMN "nestpayHostRefNum" TEXT,
  ADD COLUMN "nestpayExtraTrxDate" TIMESTAMP(3),
  ADD COLUMN "nestpayResponseRaw" JSONB,
  ADD COLUMN "nestpayResponseHash" TEXT,
  ADD COLUMN "nestpayLastQueryAt" TIMESTAMP(3),
  ADD COLUMN "nestpayChargedAmountCents" INTEGER,
  ADD COLUMN "nestpayChargedCurrency" TEXT,
  ADD COLUMN "nestpayChargeRate" DOUBLE PRECISION;

ALTER TABLE "order_charges"
  ADD COLUMN "nestpayTransId" TEXT,
  ADD COLUMN "nestpayAuthCode" TEXT,
  ADD COLUMN "nestpayProcReturnCode" TEXT,
  ADD COLUMN "nestpayMdStatus" TEXT,
  ADD COLUMN "nestpayHostRefNum" TEXT,
  ADD COLUMN "nestpayExtraTrxDate" TIMESTAMP(3),
  ADD COLUMN "nestpayResponseRaw" JSONB,
  ADD COLUMN "nestpayResponseHash" TEXT,
  ADD COLUMN "nestpayLastQueryAt" TIMESTAMP(3),
  ADD COLUMN "nestpayChargedAmountCents" INTEGER,
  ADD COLUMN "nestpayChargedCurrency" TEXT,
  ADD COLUMN "nestpayChargeRate" DOUBLE PRECISION;

-- Reconciler scan support — the cron worker looks up pending Nestpay
-- orders inside a narrow time window. Partial index keeps the scan
-- cheap as the wider orders table grows.
CREATE INDEX "orders_nestpay_pending_idx"
  ON "orders" ("paymentStatus", "createdAt")
  WHERE "paymentProvider" = 'nestpay';
