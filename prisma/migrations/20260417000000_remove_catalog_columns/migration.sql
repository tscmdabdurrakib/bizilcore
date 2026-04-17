-- Remove catalog columns from Shop table (catalog feature has been removed)
ALTER TABLE "Shop" DROP COLUMN IF EXISTS "catalogEnabled";
ALTER TABLE "Shop" DROP COLUMN IF EXISTS "catalogTagline";
ALTER TABLE "Shop" DROP COLUMN IF EXISTS "catalogShowInStockOnly";
