-- Purchase Order enhancements
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "PurchaseOrder_expectedDate_idx" ON "PurchaseOrder"("expectedDate");

ALTER TABLE "PurchaseOrderItem" ADD COLUMN IF NOT EXISTS "productId" TEXT;
ALTER TABLE "PurchaseOrderItem" ADD COLUMN IF NOT EXISTS "receivedQuantity" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "PurchaseOrderItem_productId_idx" ON "PurchaseOrderItem"("productId");

ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "purchaseOrderId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Purchase_purchaseOrderId_key" ON "Purchase"("purchaseOrderId") WHERE "purchaseOrderId" IS NOT NULL;

DO $$ BEGIN
  ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_purchaseOrderId_fkey"
    FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
