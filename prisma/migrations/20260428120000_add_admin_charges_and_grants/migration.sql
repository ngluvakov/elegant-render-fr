-- CreateEnum
CREATE TYPE "OrderChargeStatus" AS ENUM ('pending', 'paid', 'cancelled');

-- AlterEnum: add four new outbox event types.
-- Postgres requires ADD VALUE for each enum addition, separated by
-- commits. We split into discrete statements so the migration runs on
-- Postgres 11 and earlier; on 12+ they can be batched.
ALTER TYPE "OutboxEventType" ADD VALUE 'ai_credits_granted_email';
ALTER TYPE "OutboxEventType" ADD VALUE 'free_revision_granted_email';
ALTER TYPE "OutboxEventType" ADD VALUE 'additional_charge_requested_email';
ALTER TYPE "OutboxEventType" ADD VALUE 'additional_charge_paid_email';

-- CreateTable
CREATE TABLE "order_charges" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "reason" TEXT,
    "totalCents" INTEGER NOT NULL,
    "status" "OrderChargeStatus" NOT NULL DEFAULT 'pending',
    "paymentProvider" "PaymentProvider",
    "paymentId" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "order_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_charge_items" (
    "id" TEXT NOT NULL,
    "chargeId" TEXT NOT NULL,
    "productId" TEXT,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "configJson" JSONB,

    CONSTRAINT "order_charge_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_charges_orderId_status_idx" ON "order_charges"("orderId", "status");

-- CreateIndex
CREATE INDEX "order_charge_items_chargeId_idx" ON "order_charge_items"("chargeId");

-- AddForeignKey
ALTER TABLE "order_charges" ADD CONSTRAINT "order_charges_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_charges" ADD CONSTRAINT "order_charges_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_charge_items" ADD CONSTRAINT "order_charge_items_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "order_charges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
