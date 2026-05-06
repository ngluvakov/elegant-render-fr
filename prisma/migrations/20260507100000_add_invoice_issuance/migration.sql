-- Phase A.2 of payments-implementation-plan.md. Order learns to carry
-- an invoice number + issuance timestamp + storage path; new
-- invoice_counters table provides atomic per-year sequence; outbox
-- enum gains the email handler key.

ALTER TYPE "OutboxEventType" ADD VALUE 'invoice_issued_email';

ALTER TABLE "orders"
  ADD COLUMN "invoiceNumber"   TEXT,
  ADD COLUMN "invoiceIssuedAt" TIMESTAMP(3),
  ADD COLUMN "invoicePdfPath"  TEXT;

CREATE UNIQUE INDEX "orders_invoiceNumber_key" ON "orders" ("invoiceNumber");

CREATE TABLE "invoice_counters" (
  "year"      INTEGER NOT NULL,
  "seq"       INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "invoice_counters_pkey" PRIMARY KEY ("year")
);
