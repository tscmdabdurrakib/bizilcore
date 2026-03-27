-- Add catalog fields to Shop
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "catalogEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "catalogTagline" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "catalogShowInStockOnly" BOOLEAN NOT NULL DEFAULT false;

-- Add description field to Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Backfill: assign each shop without a slug a guaranteed-unique slug using the shop's primary key.
-- CUIDs contain only lowercase alphanumeric characters and are safe URL slugs.
-- This avoids any uniqueness collision risk from name-based normalization (especially for non-ASCII names).
UPDATE "Shop" SET slug = LOWER(id) WHERE slug IS NULL;

-- Now add the unique constraint (safe because all slugs are now non-null and unique via id)
CREATE UNIQUE INDEX IF NOT EXISTS "Shop_slug_key" ON "Shop"("slug");
