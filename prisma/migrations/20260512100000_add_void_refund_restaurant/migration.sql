-- Void & partial refund fields on RestaurantOrder
ALTER TABLE "RestaurantOrder" ADD COLUMN IF NOT EXISTS "isVoided"     BOOLEAN          NOT NULL DEFAULT false;
ALTER TABLE "RestaurantOrder" ADD COLUMN IF NOT EXISTS "voidedAt"     TIMESTAMP(3);
ALTER TABLE "RestaurantOrder" ADD COLUMN IF NOT EXISTS "voidReason"   TEXT;
ALTER TABLE "RestaurantOrder" ADD COLUMN IF NOT EXISTS "voidedBy"     TEXT;
ALTER TABLE "RestaurantOrder" ADD COLUMN IF NOT EXISTS "refundedAt"   TIMESTAMP(3);
ALTER TABLE "RestaurantOrder" ADD COLUMN IF NOT EXISTS "refundAmount" DOUBLE PRECISION;
ALTER TABLE "RestaurantOrder" ADD COLUMN IF NOT EXISTS "refundReason" TEXT;
ALTER TABLE "RestaurantOrder" ADD COLUMN IF NOT EXISTS "refundedBy"   TEXT;

-- Per-item void flag
ALTER TABLE "RestaurantOrderItem" ADD COLUMN IF NOT EXISTS "isVoided" BOOLEAN NOT NULL DEFAULT false;

-- Manager PIN + void threshold on Shop
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "managerPin"             TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "restVoidThresholdHours" INTEGER NOT NULL DEFAULT 24;

-- Index for fast void log queries
CREATE INDEX IF NOT EXISTS "RestaurantOrder_shopId_isVoided_idx"
  ON "RestaurantOrder"("shopId", "isVoided");
