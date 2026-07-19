-- AlterEnum
ALTER TYPE "OutboxEventType" ADD VALUE 'plutos_invoice_requested';

-- AlterTable
ALTER TABLE "order_charges" ADD COLUMN     "plutosInvoiceId" TEXT,
ADD COLUMN     "plutosLastAttemptAt" TIMESTAMP(3),
ADD COLUMN     "plutosLastError" TEXT,
ADD COLUMN     "plutosNumber" TEXT,
ADD COLUMN     "plutosSefStatus" TEXT,
ADD COLUMN     "plutosStatus" TEXT,
ADD COLUMN     "plutosSyncedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "plutosInvoiceId" TEXT,
ADD COLUMN     "plutosLastAttemptAt" TIMESTAMP(3),
ADD COLUMN     "plutosLastError" TEXT,
ADD COLUMN     "plutosNumber" TEXT,
ADD COLUMN     "plutosSefStatus" TEXT,
ADD COLUMN     "plutosStatus" TEXT,
ADD COLUMN     "plutosSyncedAt" TIMESTAMP(3);
