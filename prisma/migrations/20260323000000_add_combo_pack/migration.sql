-- CreateTable
CREATE TABLE IF NOT EXISTS "ComboProduct" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sellPrice" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComboProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ComboItem" (
    "id" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "ComboItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ComboProduct_shopId_idx" ON "ComboProduct"("shopId");
CREATE INDEX IF NOT EXISTS "ComboProduct_isActive_idx" ON "ComboProduct"("isActive");
CREATE INDEX IF NOT EXISTS "ComboItem_comboId_idx" ON "ComboItem"("comboId");
CREATE INDEX IF NOT EXISTS "ComboItem_productId_idx" ON "ComboItem"("productId");
CREATE INDEX IF NOT EXISTS "ComboItem_variantId_idx" ON "ComboItem"("variantId");

-- AlterTable: make OrderItem.productId nullable, add comboId and comboSnapshot
ALTER TABLE "OrderItem" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "comboId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "comboSnapshot" TEXT;

-- AddForeignKey
ALTER TABLE "ComboProduct" ADD CONSTRAINT "ComboProduct_shopId_fkey"
    FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_comboId_fkey"
    FOREIGN KEY ("comboId") REFERENCES "ComboProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_variantId_fkey"
    FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_comboId_fkey"
    FOREIGN KEY ("comboId") REFERENCES "ComboProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
