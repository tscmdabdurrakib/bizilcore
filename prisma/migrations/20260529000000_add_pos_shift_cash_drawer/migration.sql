-- PosShift: tracks a single POS register session (open → closed)
CREATE TABLE IF NOT EXISTS "PosShift" (
  "id"                    TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
  "shopId"                TEXT         NOT NULL,
  "shiftNumber"           TEXT         NOT NULL,
  "openedBy"              TEXT         NOT NULL,
  "openedById"            TEXT,
  "closedBy"              TEXT,
  "closedById"            TEXT,
  "openedAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt"              TIMESTAMP(3),
  "openingCash"           DOUBLE PRECISION NOT NULL DEFAULT 0,
  "countedCash"           DOUBLE PRECISION,
  "expectedCash"          DOUBLE PRECISION NOT NULL DEFAULT 0,
  "cashOver"              DOUBLE PRECISION,
  "cashShort"             DOUBLE PRECISION,
  "status"                TEXT         NOT NULL DEFAULT 'open',
  "notes"                 TEXT,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PosShift_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PosShift_shopId_shiftNumber_key"
  ON "PosShift"("shopId", "shiftNumber");

CREATE INDEX IF NOT EXISTS "PosShift_shopId_idx"
  ON "PosShift"("shopId");

CREATE INDEX IF NOT EXISTS "PosShift_shopId_status_idx"
  ON "PosShift"("shopId", "status");

-- CashDrawerLog: per-event log attached to a PosShift
CREATE TABLE IF NOT EXISTS "CashDrawerLog" (
  "id"            TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
  "shopId"        TEXT         NOT NULL,
  "shiftId"       TEXT         NOT NULL,
  "type"          TEXT         NOT NULL,
  "amount"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  "note"          TEXT,
  "performedBy"   TEXT,
  "loggedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CashDrawerLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CashDrawerLog_shiftId_fkey"
    FOREIGN KEY ("shiftId") REFERENCES "PosShift"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "CashDrawerLog_shopId_idx"
  ON "CashDrawerLog"("shopId");

CREATE INDEX IF NOT EXISTS "CashDrawerLog_shiftId_idx"
  ON "CashDrawerLog"("shiftId");

-- Shop: shift enforcement flag
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "restRequireShift" BOOLEAN NOT NULL DEFAULT false;
