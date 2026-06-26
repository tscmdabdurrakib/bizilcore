-- Idempotency keys for client-retried mutations (offline POS sale replay).
CREATE TABLE IF NOT EXISTS "IdempotencyKey" (
  "id"        TEXT NOT NULL,
  "key"       TEXT NOT NULL,
  "scope"     TEXT NOT NULL DEFAULT 'pos_sale',
  "userId"    TEXT NOT NULL,
  "response"  JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IdempotencyKey_key_key" ON "IdempotencyKey"("key");
CREATE INDEX IF NOT EXISTS "IdempotencyKey_userId_idx" ON "IdempotencyKey"("userId");
CREATE INDEX IF NOT EXISTS "IdempotencyKey_createdAt_idx" ON "IdempotencyKey"("createdAt");
