-- ISO 27001 A.8.7 (Protection against malware). Synchronous Cloudmersive
-- scan runs before any of these rows is created; current flow only
-- inserts when scanStatus = 'clean'. Pre-scan-era rows stay NULL —
-- they were never scanned and a backfill would be misleading.
ALTER TABLE "order_files"
  ADD COLUMN "scanStatus" TEXT,
  ADD COLUMN "scannedAt" TIMESTAMP(3),
  ADD COLUMN "scanThreats" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "project_inquiry_files"
  ADD COLUMN "scanStatus" TEXT,
  ADD COLUMN "scannedAt" TIMESTAMP(3),
  ADD COLUMN "scanThreats" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
