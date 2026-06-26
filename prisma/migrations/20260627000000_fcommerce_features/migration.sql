-- F-Commerce extended features migration

ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "storeLoyaltyEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "storeLoyaltyEarnRate" DOUBLE PRECISION NOT NULL DEFAULT 1;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "storeLoyaltyRedeemRate" DOUBLE PRECISION NOT NULL DEFAULT 0.5;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "storeFbPixelId" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "storeGoogleAnalyticsId" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "storeTiktokPixelId" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "storeSslcommerzStoreId" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "storeSslcommerzStorePass" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "storeSslcommerzEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "storePwaEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "storeMultiVendorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "storeAnnouncementBar" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "storeAnnouncementEndsAt" TIMESTAMP(3);

ALTER TABLE "ComboProduct" ADD COLUMN IF NOT EXISTS "storeVisible" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS "ComboProduct_storeVisible_idx" ON "ComboProduct"("storeVisible");

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "vendorId" TEXT;
CREATE INDEX IF NOT EXISTS "Product_vendorId_idx" ON "Product"("vendorId");

ALTER TABLE "StoreCustomer" ADD COLUMN IF NOT EXISTS "loyaltyPoints" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StoreCustomer" ADD COLUMN IF NOT EXISTS "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "StoreCustomer" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
ALTER TABLE "StoreCustomer" ADD COLUMN IF NOT EXISTS "birthday" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "StoreCustomer_shopId_referralCode_key" ON "StoreCustomer"("shopId", "referralCode");

ALTER TABLE "StoreOrder" ADD COLUMN IF NOT EXISTS "storeCustomerId" TEXT;
ALTER TABLE "StoreOrder" ADD COLUMN IF NOT EXISTS "affiliateCode" TEXT;
ALTER TABLE "StoreOrder" ADD COLUMN IF NOT EXISTS "utmSource" TEXT;
ALTER TABLE "StoreOrder" ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT;
ALTER TABLE "StoreOrder" ADD COLUMN IF NOT EXISTS "giftCardCode" TEXT;
ALTER TABLE "StoreOrder" ADD COLUMN IF NOT EXISTS "giftCardAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "StoreOrder" ADD COLUMN IF NOT EXISTS "loyaltyPointsUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StoreOrder" ADD COLUMN IF NOT EXISTS "loyaltyPointsEarned" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "StoreOrder_storeCustomerId_idx" ON "StoreOrder"("storeCustomerId");

ALTER TABLE "StoreOrderItem" ADD COLUMN IF NOT EXISTS "comboId" TEXT;
CREATE INDEX IF NOT EXISTS "StoreOrderItem_comboId_idx" ON "StoreOrderItem"("comboId");

CREATE TABLE IF NOT EXISTS "StoreWishlistItem" (
    "id" TEXT NOT NULL,
    "storeCustomerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoreWishlistItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "StoreWishlistItem_storeCustomerId_productId_key" ON "StoreWishlistItem"("storeCustomerId", "productId");
CREATE INDEX IF NOT EXISTS "StoreWishlistItem_storeCustomerId_idx" ON "StoreWishlistItem"("storeCustomerId");
CREATE INDEX IF NOT EXISTS "StoreWishlistItem_productId_idx" ON "StoreWishlistItem"("productId");

CREATE TABLE IF NOT EXISTS "StoreCustomerAddress" (
    "id" TEXT NOT NULL,
    "storeCustomerId" TEXT NOT NULL,
    "label" TEXT,
    "address" TEXT NOT NULL,
    "district" TEXT,
    "upazila" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoreCustomerAddress_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "StoreCustomerAddress_storeCustomerId_idx" ON "StoreCustomerAddress"("storeCustomerId");

CREATE TABLE IF NOT EXISTS "FlashSale" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FlashSale_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FlashSale_shopId_idx" ON "FlashSale"("shopId");
CREATE INDEX IF NOT EXISTS "FlashSale_shopId_isActive_idx" ON "FlashSale"("shopId", "isActive");
CREATE INDEX IF NOT EXISTS "FlashSale_startAt_endAt_idx" ON "FlashSale"("startAt", "endAt");

CREATE TABLE IF NOT EXISTS "FlashSaleProduct" (
    "id" TEXT NOT NULL,
    "flashSaleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "salePrice" DOUBLE PRECISION NOT NULL,
    "maxQty" INTEGER,
    CONSTRAINT "FlashSaleProduct_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FlashSaleProduct_flashSaleId_productId_key" ON "FlashSaleProduct"("flashSaleId", "productId");
CREATE INDEX IF NOT EXISTS "FlashSaleProduct_flashSaleId_idx" ON "FlashSaleProduct"("flashSaleId");
CREATE INDEX IF NOT EXISTS "FlashSaleProduct_productId_idx" ON "FlashSaleProduct"("productId");

CREATE TABLE IF NOT EXISTS "ProductRelation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "relatedProductId" TEXT NOT NULL,
    CONSTRAINT "ProductRelation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProductRelation_productId_relatedProductId_key" ON "ProductRelation"("productId", "relatedProductId");
CREATE INDEX IF NOT EXISTS "ProductRelation_productId_idx" ON "ProductRelation"("productId");

CREATE TABLE IF NOT EXISTS "StoreLoyaltyTransaction" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "storeCustomerId" TEXT,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "orderId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoreLoyaltyTransaction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "StoreLoyaltyTransaction_shopId_idx" ON "StoreLoyaltyTransaction"("shopId");
CREATE INDEX IF NOT EXISTS "StoreLoyaltyTransaction_storeCustomerId_idx" ON "StoreLoyaltyTransaction"("storeCustomerId");
CREATE INDEX IF NOT EXISTS "StoreLoyaltyTransaction_createdAt_idx" ON "StoreLoyaltyTransaction"("createdAt");

CREATE TABLE IF NOT EXISTS "StoreReturnRequest" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "storeOrderId" TEXT NOT NULL,
    "storeCustomerId" TEXT,
    "reason" TEXT NOT NULL,
    "photos" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "refundAmount" DOUBLE PRECISION,
    "merchantNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StoreReturnRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "StoreReturnRequest_shopId_idx" ON "StoreReturnRequest"("shopId");
CREATE INDEX IF NOT EXISTS "StoreReturnRequest_storeOrderId_idx" ON "StoreReturnRequest"("storeOrderId");
CREATE INDEX IF NOT EXISTS "StoreReturnRequest_status_idx" ON "StoreReturnRequest"("status");

CREATE TABLE IF NOT EXISTS "StoreReturnItem" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "StoreReturnItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "StoreReturnItem_returnId_idx" ON "StoreReturnItem"("returnId");

CREATE TABLE IF NOT EXISTS "GiftCard" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "initialBalance" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "purchaserEmail" TEXT,
    "recipientEmail" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GiftCard_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "GiftCard_shopId_code_key" ON "GiftCard"("shopId", "code");
CREATE INDEX IF NOT EXISTS "GiftCard_shopId_idx" ON "GiftCard"("shopId");
CREATE INDEX IF NOT EXISTS "GiftCard_code_idx" ON "GiftCard"("code");

CREATE TABLE IF NOT EXISTS "StoreAffiliate" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoreAffiliate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "StoreAffiliate_shopId_code_key" ON "StoreAffiliate"("shopId", "code");
CREATE INDEX IF NOT EXISTS "StoreAffiliate_shopId_idx" ON "StoreAffiliate"("shopId");

CREATE TABLE IF NOT EXISTS "StoreCampaign" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "segment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoreCampaign_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "StoreCampaign_shopId_idx" ON "StoreCampaign"("shopId");
CREATE INDEX IF NOT EXISTS "StoreCampaign_status_idx" ON "StoreCampaign"("status");

CREATE TABLE IF NOT EXISTS "StoreFunnelEvent" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "productId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoreFunnelEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "StoreFunnelEvent_shopId_idx" ON "StoreFunnelEvent"("shopId");
CREATE INDEX IF NOT EXISTS "StoreFunnelEvent_shopId_eventType_idx" ON "StoreFunnelEvent"("shopId", "eventType");
CREATE INDEX IF NOT EXISTS "StoreFunnelEvent_sessionId_idx" ON "StoreFunnelEvent"("sessionId");
CREATE INDEX IF NOT EXISTS "StoreFunnelEvent_createdAt_idx" ON "StoreFunnelEvent"("createdAt");

CREATE TABLE IF NOT EXISTS "StoreStockAlert" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoreStockAlert_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "StoreStockAlert_shopId_idx" ON "StoreStockAlert"("shopId");
CREATE INDEX IF NOT EXISTS "StoreStockAlert_productId_idx" ON "StoreStockAlert"("productId");
CREATE INDEX IF NOT EXISTS "StoreStockAlert_notified_idx" ON "StoreStockAlert"("notified");

CREATE TABLE IF NOT EXISTS "ProductSubscription" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "storeCustomerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "nextDeliveryAt" TIMESTAMP(3) NOT NULL,
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductSubscription_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ProductSubscription_shopId_idx" ON "ProductSubscription"("shopId");
CREATE INDEX IF NOT EXISTS "ProductSubscription_storeCustomerId_idx" ON "ProductSubscription"("storeCustomerId");
CREATE INDEX IF NOT EXISTS "ProductSubscription_status_idx" ON "ProductSubscription"("status");
CREATE INDEX IF NOT EXISTS "ProductSubscription_nextDeliveryAt_idx" ON "ProductSubscription"("nextDeliveryAt");

CREATE TABLE IF NOT EXISTS "StoreVendor" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoreVendor_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "StoreVendor_shopId_idx" ON "StoreVendor"("shopId");
CREATE INDEX IF NOT EXISTS "StoreVendor_email_idx" ON "StoreVendor"("email");

CREATE TABLE IF NOT EXISTS "LiveCommerceSession" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "streamUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "pinnedProductIds" JSONB,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LiveCommerceSession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "LiveCommerceSession_shopId_idx" ON "LiveCommerceSession"("shopId");
CREATE INDEX IF NOT EXISTS "LiveCommerceSession_status_idx" ON "LiveCommerceSession"("status");
CREATE INDEX IF NOT EXISTS "LiveCommerceSession_startAt_idx" ON "LiveCommerceSession"("startAt");

ALTER TABLE "Product" ADD CONSTRAINT "Product_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "StoreVendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StoreOrder" ADD CONSTRAINT "StoreOrder_storeCustomerId_fkey" FOREIGN KEY ("storeCustomerId") REFERENCES "StoreCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StoreOrderItem" ADD CONSTRAINT "StoreOrderItem_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "ComboProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StoreWishlistItem" ADD CONSTRAINT "StoreWishlistItem_storeCustomerId_fkey" FOREIGN KEY ("storeCustomerId") REFERENCES "StoreCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreWishlistItem" ADD CONSTRAINT "StoreWishlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreCustomerAddress" ADD CONSTRAINT "StoreCustomerAddress_storeCustomerId_fkey" FOREIGN KEY ("storeCustomerId") REFERENCES "StoreCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FlashSale" ADD CONSTRAINT "FlashSale_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FlashSaleProduct" ADD CONSTRAINT "FlashSaleProduct_flashSaleId_fkey" FOREIGN KEY ("flashSaleId") REFERENCES "FlashSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FlashSaleProduct" ADD CONSTRAINT "FlashSaleProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductRelation" ADD CONSTRAINT "ProductRelation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductRelation" ADD CONSTRAINT "ProductRelation_relatedProductId_fkey" FOREIGN KEY ("relatedProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreLoyaltyTransaction" ADD CONSTRAINT "StoreLoyaltyTransaction_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreLoyaltyTransaction" ADD CONSTRAINT "StoreLoyaltyTransaction_storeCustomerId_fkey" FOREIGN KEY ("storeCustomerId") REFERENCES "StoreCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StoreReturnRequest" ADD CONSTRAINT "StoreReturnRequest_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreReturnRequest" ADD CONSTRAINT "StoreReturnRequest_storeOrderId_fkey" FOREIGN KEY ("storeOrderId") REFERENCES "StoreOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreReturnRequest" ADD CONSTRAINT "StoreReturnRequest_storeCustomerId_fkey" FOREIGN KEY ("storeCustomerId") REFERENCES "StoreCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StoreReturnItem" ADD CONSTRAINT "StoreReturnItem_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "StoreReturnRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GiftCard" ADD CONSTRAINT "GiftCard_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreAffiliate" ADD CONSTRAINT "StoreAffiliate_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreCampaign" ADD CONSTRAINT "StoreCampaign_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreFunnelEvent" ADD CONSTRAINT "StoreFunnelEvent_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreStockAlert" ADD CONSTRAINT "StoreStockAlert_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreStockAlert" ADD CONSTRAINT "StoreStockAlert_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductSubscription" ADD CONSTRAINT "ProductSubscription_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductSubscription" ADD CONSTRAINT "ProductSubscription_storeCustomerId_fkey" FOREIGN KEY ("storeCustomerId") REFERENCES "StoreCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreVendor" ADD CONSTRAINT "StoreVendor_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LiveCommerceSession" ADD CONSTRAINT "LiveCommerceSession_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
