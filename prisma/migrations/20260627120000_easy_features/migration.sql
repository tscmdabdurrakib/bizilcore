-- Easy features: guest OTP, BOPIS, delivery slots, Q&A, canned replies

ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "storePickupEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "storePickupAddress" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "storeSocialProofEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "storeExitPopupEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "storeExitPopupCoupon" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "storeCheckoutOtpEnabled" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "StoreOrder" ADD COLUMN IF NOT EXISTS "fulfillmentType" TEXT NOT NULL DEFAULT 'delivery';
ALTER TABLE "StoreOrder" ADD COLUMN IF NOT EXISTS "deliverySlot" TEXT;
ALTER TABLE "StoreOrder" ADD COLUMN IF NOT EXISTS "guestOtpVerified" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "StoreOrder_utmSource_idx" ON "StoreOrder"("utmSource");
CREATE INDEX IF NOT EXISTS "StoreOrder_utmCampaign_idx" ON "StoreOrder"("utmCampaign");

CREATE TABLE IF NOT EXISTS "StoreCheckoutOtp" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoreCheckoutOtp_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProductQuestion" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "askerName" TEXT NOT NULL,
    "askerPhone" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MessengerCannedReply" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessengerCannedReply_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StoreCheckoutOtp_shopId_phone_idx" ON "StoreCheckoutOtp"("shopId", "phone");
CREATE INDEX IF NOT EXISTS "StoreCheckoutOtp_expiresAt_idx" ON "StoreCheckoutOtp"("expiresAt");
CREATE INDEX IF NOT EXISTS "ProductQuestion_shopId_idx" ON "ProductQuestion"("shopId");
CREATE INDEX IF NOT EXISTS "ProductQuestion_productId_idx" ON "ProductQuestion"("productId");
CREATE INDEX IF NOT EXISTS "ProductQuestion_isApproved_idx" ON "ProductQuestion"("isApproved");
CREATE INDEX IF NOT EXISTS "MessengerCannedReply_shopId_idx" ON "MessengerCannedReply"("shopId");

ALTER TABLE "StoreCheckoutOtp" ADD CONSTRAINT "StoreCheckoutOtp_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductQuestion" ADD CONSTRAINT "ProductQuestion_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductQuestion" ADD CONSTRAINT "ProductQuestion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessengerCannedReply" ADD CONSTRAINT "MessengerCannedReply_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
