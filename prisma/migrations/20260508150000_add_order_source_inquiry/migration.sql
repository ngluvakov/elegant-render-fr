-- Order.sourceInquiryId: foreign key back to the ProjectInquiry that
-- spawned this order via convertInquiryToOrder. Nullable for all
-- orders that came in via the regular checkout flow. ON DELETE SET
-- NULL so a deleted inquiry doesn't cascade and wipe the order
-- (orders are tax records under Zakon o računovodstvu — 10y retention).

ALTER TABLE "orders"
  ADD COLUMN "sourceInquiryId" TEXT;

CREATE INDEX "orders_sourceInquiryId_idx" ON "orders" ("sourceInquiryId");

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_sourceInquiryId_fkey"
  FOREIGN KEY ("sourceInquiryId")
  REFERENCES "project_inquiries"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
