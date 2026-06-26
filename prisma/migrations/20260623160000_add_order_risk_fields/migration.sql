-- Order risk / fraud fields referenced by dashboard and COD protection
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "riskScore" DOUBLE PRECISION;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "riskFlags" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "fakeReported" BOOLEAN NOT NULL DEFAULT false;
