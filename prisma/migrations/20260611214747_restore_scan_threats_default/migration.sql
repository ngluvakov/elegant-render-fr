-- Rekonstruisano 2026-07-03 (drift iz neuvezane sesije 2026-06-11 —
-- vidi napomenu u 20260611200825_add_buyer_contact_fields).
-- Korektivna migracija sa dana incidenta: vraća DEFAULT koji je drift
-- artefakt tog jutra bio uklonio (i srušio upload-e na ~1,5h).
-- Idempotentna i već na snazi u bazi na obe tabele.

-- AlterTable
ALTER TABLE "order_files" ALTER COLUMN "scanThreats" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "project_inquiry_files" ALTER COLUMN "scanThreats" SET DEFAULT ARRAY[]::TEXT[];
