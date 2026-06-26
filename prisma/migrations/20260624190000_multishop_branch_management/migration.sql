-- Multi-Shop / Branch Management

-- Organization
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Organization_ownerId_key" ON "Organization"("ownerId");

ALTER TABLE "Organization" ADD CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ShopMembership
CREATE TABLE "ShopMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShopMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShopMembership_userId_shopId_key" ON "ShopMembership"("userId", "shopId");
CREATE INDEX "ShopMembership_userId_idx" ON "ShopMembership"("userId");
CREATE INDEX "ShopMembership_shopId_idx" ON "ShopMembership"("shopId");

ALTER TABLE "ShopMembership" ADD CONSTRAINT "ShopMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShopMembership" ADD CONSTRAINT "ShopMembership_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Shop: optional userId, organization, hierarchy indexes
ALTER TABLE "Shop" ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

CREATE INDEX IF NOT EXISTS "Shop_organizationId_idx" ON "Shop"("organizationId");
CREATE INDEX IF NOT EXISTS "Shop_parentShopId_idx" ON "Shop"("parentShopId");

ALTER TABLE "Shop" ADD CONSTRAINT "Shop_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_parentShopId_fkey" FOREIGN KEY ("parentShopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ShopBranch extensions
ALTER TABLE "ShopBranch" ADD COLUMN IF NOT EXISTS "logoPublicId" TEXT;
ALTER TABLE "ShopBranch" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "ShopBranch" ADD COLUMN IF NOT EXISTS "linkedShopId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "ShopBranch_linkedShopId_key" ON "ShopBranch"("linkedShopId");

ALTER TABLE "ShopBranch" ADD CONSTRAINT "ShopBranch_linkedShopId_fkey" FOREIGN KEY ("linkedShopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- BranchStock
CREATE TABLE "BranchStock" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BranchStock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BranchStock_branchId_productId_key" ON "BranchStock"("branchId", "productId");
CREATE INDEX "BranchStock_branchId_idx" ON "BranchStock"("branchId");
CREATE INDEX "BranchStock_productId_idx" ON "BranchStock"("productId");

ALTER TABLE "BranchStock" ADD CONSTRAINT "BranchStock_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "ShopBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BranchStock" ADD CONSTRAINT "BranchStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- StockMovement extensions
ALTER TABLE "StockMovement" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "StockMovement" ADD COLUMN IF NOT EXISTS "fromBranchId" TEXT;
ALTER TABLE "StockMovement" ADD COLUMN IF NOT EXISTS "toBranchId" TEXT;
ALTER TABLE "StockMovement" ADD COLUMN IF NOT EXISTS "direction" TEXT;

CREATE INDEX IF NOT EXISTS "StockMovement_branchId_idx" ON "StockMovement"("branchId");
CREATE INDEX IF NOT EXISTS "StockMovement_type_branchId_idx" ON "StockMovement"("type", "branchId");

ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "ShopBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
