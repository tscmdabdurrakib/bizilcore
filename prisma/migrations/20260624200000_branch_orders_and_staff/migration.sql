-- AlterTable
ALTER TABLE "Order" ADD COLUMN "branchId" TEXT;

-- AlterTable
ALTER TABLE "StaffMember" ADD COLUMN "branchId" TEXT;

-- CreateIndex
CREATE INDEX "Order_branchId_idx" ON "Order"("branchId");

-- CreateIndex
CREATE INDEX "StaffMember_branchId_idx" ON "StaffMember"("branchId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "ShopBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffMember" ADD CONSTRAINT "StaffMember_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "ShopBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
