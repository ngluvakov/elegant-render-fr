ALTER TYPE "AiEditType" ADD VALUE 'object_insertion';

ALTER TABLE "ai_generations"
  ADD COLUMN "referenceStoragePath" TEXT,
  ADD COLUMN "referenceMimeType" TEXT,
  ADD COLUMN "referenceFileName" TEXT;
