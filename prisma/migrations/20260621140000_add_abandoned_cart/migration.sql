-- AbandonedCart: server-side capture of started-but-incomplete storefront checkouts
CREATE TABLE IF NOT EXISTS "AbandonedCart" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "storeSlug" TEXT,
    "customerName" TEXT,
    "phone" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'open',
    "couponSent" TEXT,
    "remindedAt" TIMESTAMP(3),
    "recoveredOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbandonedCart_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AbandonedCart_shopId_phone_key" ON "AbandonedCart"("shopId", "phone");
CREATE INDEX IF NOT EXISTS "AbandonedCart_shopId_status_idx" ON "AbandonedCart"("shopId", "status");
CREATE INDEX IF NOT EXISTS "AbandonedCart_createdAt_idx" ON "AbandonedCart"("createdAt");
