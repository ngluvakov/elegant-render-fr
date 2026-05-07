-- VIES VAT verification snapshot for company_foreign orders.
-- Populated when admin clicks "Proveri VAT (VIES)" on order detail.
-- Result is cached per-order (point-in-time snapshot) so we don't
-- hammer the EU API on each render and so we have forensic proof
-- of when the check ran in case of a tax authority dispute.

ALTER TABLE "orders"
  ADD COLUMN "vatVerifiedAt"    TIMESTAMP(3),
  ADD COLUMN "vatVerifiedName"  TEXT,
  ADD COLUMN "vatRequestId"     TEXT;
