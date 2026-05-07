-- Predračun (proforma) flow: payment method enum, proforma fields on
-- Order, separate atomic counter, and outbox enum value for the
-- email handler. All additive — existing orders default to
-- `online_payment` which preserves their pre-PR behavior.

CREATE TYPE "PaymentMethod" AS ENUM ('online_payment', 'wire_transfer');

ALTER TYPE "OutboxEventType" ADD VALUE 'proforma_issued_email';

ALTER TABLE "orders"
  ADD COLUMN "paymentMethod"     "PaymentMethod" NOT NULL DEFAULT 'online_payment',
  ADD COLUMN "proformaNumber"    TEXT,
  ADD COLUMN "proformaIssuedAt"  TIMESTAMP(3),
  ADD COLUMN "proformaPdfPath"   TEXT;

CREATE UNIQUE INDEX "orders_proformaNumber_key" ON "orders" ("proformaNumber");

CREATE TABLE "proforma_counters" (
  "year"      INTEGER NOT NULL,
  "seq"       INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "proforma_counters_pkey" PRIMARY KEY ("year")
);
