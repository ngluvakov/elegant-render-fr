-- CreateEnum
CREATE TYPE "AdminPermission" AS ENUM (
    'PROJECTS_VIEW',
    'PROJECTS_MANAGE',
    'INQUIRIES_MANAGE',
    'FINANCE_VIEW',
    'FINANCE_MANAGE',
    'USERS_VIEW',
    'USERS_MANAGE',
    'AI_CREDITS_MANAGE',
    'USAGE_VIEW',
    'ANALYTICS_VIEW',
    'AUDIT_VIEW',
    'SYSTEM_MANAGE',
    'ADMIN_MANAGE'
);

-- AlterTable
ALTER TABLE "users"
ADD COLUMN "adminPermissions" "AdminPermission"[] NOT NULL DEFAULT ARRAY[]::"AdminPermission"[],
ADD COLUMN "lastActiveAt" TIMESTAMP(3);

-- Existing admins become Super Admins during the transition so nobody
-- gets locked out before access is deliberately narrowed in the UI.
UPDATE "users"
SET "adminPermissions" = ARRAY[
    'PROJECTS_VIEW',
    'PROJECTS_MANAGE',
    'INQUIRIES_MANAGE',
    'FINANCE_VIEW',
    'FINANCE_MANAGE',
    'USERS_VIEW',
    'USERS_MANAGE',
    'AI_CREDITS_MANAGE',
    'USAGE_VIEW',
    'ANALYTICS_VIEW',
    'AUDIT_VIEW',
    'SYSTEM_MANAGE',
    'ADMIN_MANAGE'
]::"AdminPermission"[]
WHERE "isAdmin" = true;

-- CreateTable
CREATE TABLE "user_usage_daily" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "portalVisits" INTEGER NOT NULL DEFAULT 0,
    "ordersCreated" INTEGER NOT NULL DEFAULT 0,
    "aiGenerationsStarted" INTEGER NOT NULL DEFAULT 0,
    "aiCreditsSpentUnits" INTEGER NOT NULL DEFAULT 0,
    "aiCreditsGrantedUnits" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_usage_daily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_usage_daily_userId_day_key" ON "user_usage_daily"("userId", "day");

-- CreateIndex
CREATE INDEX "user_usage_daily_day_idx" ON "user_usage_daily"("day");

-- AddForeignKey
ALTER TABLE "user_usage_daily"
ADD CONSTRAINT "user_usage_daily_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
