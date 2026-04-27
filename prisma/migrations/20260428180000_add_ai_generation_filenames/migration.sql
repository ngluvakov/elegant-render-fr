-- AlterTable: add filename tracking columns. All nullable so existing
-- rows survive the migration; download endpoints fall back to a
-- `obrada-YYYYMMDD-{shortId}.{ext}` synthesized name when these are
-- unset.
ALTER TABLE "ai_generations"
  ADD COLUMN "rootFileName"   TEXT,
  ADD COLUMN "inputFileName"  TEXT,
  ADD COLUMN "resultFileName" TEXT;
