-- Add COD remittance tracking fields to Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "codRemitted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "codRemittedAt" TIMESTAMP(3);

-- Index for efficient COD reconciliation queries
CREATE INDEX IF NOT EXISTS "Order_codRemitted_idx" ON "Order"("codRemitted");
