-- Extend Transaction for unified expense tracking
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "shopId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "receiptUrl" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "supplierId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "recurringInterval" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "nextDueDate" TIMESTAMP(3);
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "recurringParentId" TEXT;

-- Backfill shopId on existing transactions
UPDATE "Transaction" t
SET "shopId" = s."id"
FROM "Shop" s
WHERE t."shopId" IS NULL AND s."userId" = t."userId";

-- Migrate Expense rows into Transaction (skip if id already exists)
INSERT INTO "Transaction" (
  "id", "userId", "shopId", "type", "amount", "category", "title", "note",
  "date", "createdAt", "taxAmount", "taxRate", "isRecurring"
)
SELECT
  e."id", e."userId", e."shopId", 'expense', e."amount", e."category", e."title", e."notes",
  e."date", e."createdAt", 0, 0, false
FROM "Expense" e
WHERE NOT EXISTS (SELECT 1 FROM "Transaction" t WHERE t."id" = e."id");

-- Foreign keys
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Transaction_shopId_idx" ON "Transaction"("shopId");
CREATE INDEX IF NOT EXISTS "Transaction_shopId_type_date_idx" ON "Transaction"("shopId", "type", "date");
CREATE INDEX IF NOT EXISTS "Transaction_type_idx" ON "Transaction"("type");
CREATE INDEX IF NOT EXISTS "Transaction_isRecurring_idx" ON "Transaction"("isRecurring");

-- Expense budget table
CREATE TABLE IF NOT EXISTS "ExpenseBudget" (
  "id" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "month" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExpenseBudget_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ExpenseBudget_shopId_category_month_key"
  ON "ExpenseBudget"("shopId", "category", "month");
CREATE INDEX IF NOT EXISTS "ExpenseBudget_shopId_idx" ON "ExpenseBudget"("shopId");

ALTER TABLE "ExpenseBudget" ADD CONSTRAINT "ExpenseBudget_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
