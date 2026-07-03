-- HITNO (2026-07-03): prethodna drift_check migracija je ponovila
-- incident od 2026-06-11 — DROP DEFAULT na scanThreats obara sve
-- upload-e (INSERT bez scanThreats na NOT NULL koloni). Uzrok: main-ov
-- schema.prisma nikad nije dobio @default([]) (ta izmena je ostala u
-- neuvezanoj sesiji), pa je migrate dev "ispravio" bazu na šemu.
-- Ova migracija vraća defaulte, a schema.prisma od sada ima
-- @default([]) na oba polja — čime su šema, istorija i baza usklađene.

-- AlterTable
ALTER TABLE "order_files" ALTER COLUMN "scanThreats" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "project_inquiry_files" ALTER COLUMN "scanThreats" SET DEFAULT ARRAY[]::TEXT[];
