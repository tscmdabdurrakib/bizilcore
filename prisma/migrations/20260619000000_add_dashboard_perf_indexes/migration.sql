-- Composite indexes for the hot dashboard query filters.
-- These match the multi-column WHERE/ORDER BY patterns used by the dashboard
-- and shell so Postgres can satisfy them with a single index scan.

-- Order: filtered by userId + (createdAt | status | codStatus)
CREATE INDEX IF NOT EXISTS "Order_userId_createdAt_idx"
  ON "Order"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_userId_status_idx"
  ON "Order"("userId", "status");
CREATE INDEX IF NOT EXISTS "Order_userId_codStatus_idx"
  ON "Order"("userId", "codStatus");

-- Transaction: filtered by userId + date ranges
CREATE INDEX IF NOT EXISTS "Transaction_userId_date_idx"
  ON "Transaction"("userId", "date");

-- Customer: due-collection + inactive-customer lookups
CREATE INDEX IF NOT EXISTS "Customer_shopId_dueAmount_idx"
  ON "Customer"("shopId", "dueAmount");
CREATE INDEX IF NOT EXISTS "Customer_shopId_lastOrderAt_idx"
  ON "Customer"("shopId", "lastOrderAt");

-- Task: dashboard task widget (shopId + status + dueDate)
CREATE INDEX IF NOT EXISTS "Task_shopId_status_dueDate_idx"
  ON "Task"("shopId", "status", "dueDate");
