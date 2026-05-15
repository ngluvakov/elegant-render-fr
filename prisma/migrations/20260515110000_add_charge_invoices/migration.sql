-- Additional charge invoices.
-- Paid OrderCharge rows now receive their own legal invoice document,
-- issued automatically after the extra payment capture succeeds.

ALTER TABLE "order_charges"
  ADD COLUMN "invoiceNumber" TEXT,
  ADD COLUMN "invoiceIssuedAt" TIMESTAMP(3),
  ADD COLUMN "invoicePdfPath" TEXT;

CREATE UNIQUE INDEX "order_charges_invoiceNumber_key"
  ON "order_charges" ("invoiceNumber");
