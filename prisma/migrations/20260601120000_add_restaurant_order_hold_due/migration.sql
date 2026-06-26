-- RestaurantOrder: due tracking + hold/resume (schema sync)
ALTER TABLE "RestaurantOrder"
  ADD COLUMN IF NOT EXISTS "dueAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "RestaurantOrder"
  ADD COLUMN IF NOT EXISTS "isHeld" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "RestaurantOrder"
  ADD COLUMN IF NOT EXISTS "heldAt" TIMESTAMP(3);

ALTER TABLE "RestaurantOrder"
  ADD COLUMN IF NOT EXISTS "heldBy" TEXT;

CREATE INDEX IF NOT EXISTS "RestaurantOrder_shopId_isHeld_idx"
  ON "RestaurantOrder"("shopId", "isHeld");
