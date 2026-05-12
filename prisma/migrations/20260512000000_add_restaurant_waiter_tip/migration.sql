-- Add waiterId (FK to StaffMember) and tipAmount to RestaurantOrder
ALTER TABLE "RestaurantOrder" ADD COLUMN IF NOT EXISTS "waiterId" TEXT;
ALTER TABLE "RestaurantOrder" ADD COLUMN IF NOT EXISTS "tipAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Add FK constraint (safe — column is nullable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RestaurantOrder_waiterId_fkey'
  ) THEN
    ALTER TABLE "RestaurantOrder"
      ADD CONSTRAINT "RestaurantOrder_waiterId_fkey"
      FOREIGN KEY ("waiterId") REFERENCES "StaffMember"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Composite index for waiter-scoped order lookups
CREATE INDEX IF NOT EXISTS "RestaurantOrder_shopId_waiterId_idx"
  ON "RestaurantOrder"("shopId", "waiterId");
