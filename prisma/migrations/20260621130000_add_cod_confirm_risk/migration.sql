-- Order COD confirmation fields
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "confirmStatus" TEXT DEFAULT 'pending';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP(3);

-- CustomerRiskCache: cached COD delivery-risk score per (shop, phone)
CREATE TABLE IF NOT EXISTS "CustomerRiskCache" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "level" TEXT NOT NULL DEFAULT 'green',
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "returnedCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'internal',
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerRiskCache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CustomerRiskCache_shopId_phone_key" ON "CustomerRiskCache"("shopId", "phone");
CREATE INDEX IF NOT EXISTS "CustomerRiskCache_shopId_idx" ON "CustomerRiskCache"("shopId");
