-- Add Advanced Discount Engine fields
-- Columns already applied via psql; migration records this in Prisma history.

-- Coupon model: new discount type fields
ALTER TABLE "Coupon"
  ADD COLUMN IF NOT EXISTS "name"                 TEXT,
  ADD COLUMN IF NOT EXISTS "applicableItemIds"    JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "applicableCategories" JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "happyHourStart"       TEXT,
  ADD COLUMN IF NOT EXISTS "happyHourEnd"         TEXT,
  ADD COLUMN IF NOT EXISTS "happyHourDays"        JSONB DEFAULT '[0,1,2,3,4,5,6]',
  ADD COLUMN IF NOT EXISTS "memberTier"           TEXT,
  ADD COLUMN IF NOT EXISTS "bogoGetItemId"        TEXT,
  ADD COLUMN IF NOT EXISTS "bogoGetQty"           INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "bogoGetDiscount"      DOUBLE PRECISION NOT NULL DEFAULT 100;

-- Shop model: manager discount threshold
ALTER TABLE "Shop"
  ADD COLUMN IF NOT EXISTS "managerDiscountThreshold" DOUBLE PRECISION NOT NULL DEFAULT 20;

-- RestaurantOrder model: discount breakdown + coupon tracking
ALTER TABLE "RestaurantOrder"
  ADD COLUMN IF NOT EXISTS "discountBreakdown" JSONB,
  ADD COLUMN IF NOT EXISTS "couponCode"        TEXT;
