-- CreateTable
CREATE TABLE "StorePageView" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorePageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StorePageView_shopId_idx" ON "StorePageView"("shopId");

-- CreateIndex
CREATE INDEX "StorePageView_shopId_visitedAt_idx" ON "StorePageView"("shopId", "visitedAt");

-- AddForeignKey
ALTER TABLE "StorePageView" ADD CONSTRAINT "StorePageView_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
