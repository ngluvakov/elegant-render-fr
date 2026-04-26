-- AI Studio credits, image generations, and cent-precision order totals.
-- Written idempotently because the preview database briefly received this
-- schema via `prisma db push` before migrations were introduced.

-- CreateEnum
DO $$
BEGIN
  CREATE TYPE "OrderItemKind" AS ENUM ('service', 'ai_credits');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "AiCreditTransactionType" AS ENUM ('purchase', 'spend', 'refund', 'expiry', 'adjustment');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "AiGenerationStatus" AS ENUM ('queued', 'processing', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "AiEditType" AS ENUM ('item_removal', 'day_to_dusk', 'sky_replacement', 'wall_color_change', 'virtual_staging', 'virtual_renovation', 'room_redesign');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "AiImageProvider" AS ENUM ('gemini_flash', 'gemini_pro', 'openai');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "OutboxEventStatus" AS ENUM ('pending', 'running', 'succeeded', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "OutboxEventType" AS ENUM ('order_confirmation_email', 'portal_access_email', 'vr_project_ready_email', 'ai_credits_expiry_reminder_email');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "OutboxEventType" ADD VALUE IF NOT EXISTS 'ai_credits_expiry_reminder_email';
ALTER TYPE "AiGenerationStatus" ADD VALUE IF NOT EXISTS 'queued';

-- AlterTable
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "aiCreditBalanceUnits" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "aiCreditsExpireAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "aiCreditsReminder30SentAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "aiCreditsReminder7SentAt" TIMESTAMP(3);

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "totalCents" INTEGER,
  ADD COLUMN IF NOT EXISTS "premiumTotalEur" INTEGER,
  ADD COLUMN IF NOT EXISTS "containsAiCredits" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "aiCreditsAppliedAt" TIMESTAMP(3);

UPDATE "orders"
SET "totalCents" = "totalEur" * 100
WHERE "totalCents" IS NULL;

UPDATE "orders"
SET "premiumTotalEur" = "totalEur"
WHERE "premiumTotalEur" IS NULL;

ALTER TABLE "order_items"
  ADD COLUMN IF NOT EXISTS "kind" "OrderItemKind" NOT NULL DEFAULT 'service',
  ADD COLUMN IF NOT EXISTS "basePriceCents" INTEGER,
  ADD COLUMN IF NOT EXISTS "totalCents" INTEGER,
  ADD COLUMN IF NOT EXISTS "aiCreditQuantity" INTEGER,
  ADD COLUMN IF NOT EXISTS "aiCreditUnits" INTEGER;

UPDATE "order_items"
SET "basePriceCents" = "basePriceEur" * 100
WHERE "basePriceCents" IS NULL;

UPDATE "order_items"
SET "totalCents" = "totalEur" * 100
WHERE "totalCents" IS NULL;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ai_credit_transactions" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orderId" TEXT,
  "generationId" TEXT,
  "type" "AiCreditTransactionType" NOT NULL,
  "units" INTEGER NOT NULL,
  "balanceAfterUnits" INTEGER NOT NULL,
  "amountCents" INTEGER,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ai_credit_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_generations" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "parentGenerationId" TEXT,
  "paidGenerationId" TEXT,
  "editType" "AiEditType" NOT NULL,
  "provider" "AiImageProvider" NOT NULL,
  "model" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "styleId" TEXT,
  "optionsJson" JSONB,
  "status" "AiGenerationStatus" NOT NULL DEFAULT 'processing',
  "inputStoragePath" TEXT NOT NULL,
  "inputMimeType" TEXT NOT NULL,
  "maskStoragePath" TEXT,
  "resultStoragePath" TEXT,
  "resultMimeType" TEXT,
  "unitsCharged" INTEGER NOT NULL,
  "coveredUnits" INTEGER NOT NULL,
  "freeAttemptIndex" INTEGER,
  "errorMessage" TEXT,
  "providerResponseId" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "processingLockUntil" TIMESTAMP(3),
  "attemptCount" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "ai_generations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "outbox_events" (
  "id" TEXT NOT NULL,
  "type" "OutboxEventType" NOT NULL,
  "payload" JSONB NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "status" "OutboxEventStatus" NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "succeededAt" TIMESTAMP(3),

  CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ai_generations"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "processingLockUntil" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "attemptCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "ai_generations"
  ALTER COLUMN "status" SET DEFAULT 'processing';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ai_credit_transactions_userId_createdAt_idx" ON "ai_credit_transactions"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "ai_credit_transactions_orderId_idx" ON "ai_credit_transactions"("orderId");
CREATE INDEX IF NOT EXISTS "ai_credit_transactions_generationId_idx" ON "ai_credit_transactions"("generationId");

CREATE INDEX IF NOT EXISTS "ai_generations_userId_createdAt_idx" ON "ai_generations"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "ai_generations_expiresAt_idx" ON "ai_generations"("expiresAt");
CREATE INDEX IF NOT EXISTS "ai_generations_status_createdAt_idx" ON "ai_generations"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "ai_generations_paidGenerationId_idx" ON "ai_generations"("paidGenerationId");
CREATE INDEX IF NOT EXISTS "ai_generations_processingLockUntil_idx" ON "ai_generations"("processingLockUntil");
CREATE UNIQUE INDEX IF NOT EXISTS "ai_generations_paidGenerationId_freeAttemptIndex_key" ON "ai_generations"("paidGenerationId", "freeAttemptIndex");
CREATE UNIQUE INDEX IF NOT EXISTS "outbox_events_idempotencyKey_key" ON "outbox_events"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "outbox_events_status_nextAttemptAt_idx" ON "outbox_events"("status", "nextAttemptAt");

-- AddForeignKey
DO $$
BEGIN
  ALTER TABLE "ai_credit_transactions"
    ADD CONSTRAINT "ai_credit_transactions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "ai_generations"
    ADD CONSTRAINT "ai_generations_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
