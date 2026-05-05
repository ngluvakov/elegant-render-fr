-- Customer's explicit waiver of the 14-day distance-selling withdrawal
-- right (Zakon o zaštiti potrošača čl. 28 / EU CRD čl. 16(m)). Nullable —
-- existing orders haven't been asked to waive, leave their value null.
ALTER TABLE "orders"
  ADD COLUMN "withdrawalWaivedAt" TIMESTAMP(3);
