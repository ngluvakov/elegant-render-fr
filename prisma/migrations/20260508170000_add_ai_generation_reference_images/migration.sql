CREATE TABLE IF NOT EXISTS "ai_generation_reference_images" (
  "id" TEXT NOT NULL,
  "generationId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "storagePath" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "fileName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ai_generation_reference_images_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_generation_reference_images_generationId_sortOrder_key"
  ON "ai_generation_reference_images"("generationId", "sortOrder");

CREATE INDEX IF NOT EXISTS "ai_generation_reference_images_storagePath_idx"
  ON "ai_generation_reference_images"("storagePath");

ALTER TABLE "ai_generation_reference_images"
  ADD CONSTRAINT "ai_generation_reference_images_generationId_fkey"
  FOREIGN KEY ("generationId") REFERENCES "ai_generations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
