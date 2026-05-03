-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReturnStatus" ADD VALUE 'LABEL_ISSUED';
ALTER TYPE "ReturnStatus" ADD VALUE 'RECEIVED';
ALTER TYPE "ReturnStatus" ADD VALUE 'CLOSED';

-- AlterTable
ALTER TABLE "order_status_history" ADD COLUMN     "changedByAdminId" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "carrierName" TEXT,
ADD COLUMN     "trackingNumber" TEXT;
