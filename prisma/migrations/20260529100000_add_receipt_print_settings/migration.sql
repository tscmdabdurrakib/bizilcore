-- Add 8 receipt/print customisation fields to Shop
-- Columns already applied via psql; migration records this in Prisma history.

ALTER TABLE "Shop"
  ADD COLUMN IF NOT EXISTS "receiptLogo"        TEXT,
  ADD COLUMN IF NOT EXISTS "receiptHeaderLine1" TEXT,
  ADD COLUMN IF NOT EXISTS "receiptHeaderLine2" TEXT,
  ADD COLUMN IF NOT EXISTS "receiptFooter"      TEXT    DEFAULT 'ধন্যবাদ! আবার আসবেন।',
  ADD COLUMN IF NOT EXISTS "receiptPaperSize"   TEXT    DEFAULT '80mm',
  ADD COLUMN IF NOT EXISTS "receiptShowVat"     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "receiptShowQr"      BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "receiptShowLogo"    BOOLEAN NOT NULL DEFAULT true;
