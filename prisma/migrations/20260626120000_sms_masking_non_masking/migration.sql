-- Masking / Non-Masking SMS dual wallet migration

ALTER TABLE "SmsCreditGlobalSettings"
  ADD COLUMN IF NOT EXISTS "pricePerSmsMasking" DOUBLE PRECISION NOT NULL DEFAULT 0.35,
  ADD COLUMN IF NOT EXISTS "pricePerSmsNonMasking" DOUBLE PRECISION NOT NULL DEFAULT 0.30,
  ADD COLUMN IF NOT EXISTS "maskingEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "nonMaskingEnabled" BOOLEAN NOT NULL DEFAULT true;

UPDATE "SmsCreditGlobalSettings"
SET
  "pricePerSmsMasking" = COALESCE("pricePerSmsMasking", "pricePerSms", 0.35),
  "pricePerSmsNonMasking" = COALESCE("pricePerSmsNonMasking", "pricePerSms", 0.30);

ALTER TABLE "SmsCreditBalance"
  ADD COLUMN IF NOT EXISTS "maskingBalance" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "nonMaskingBalance" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "totalPurchasedMasking" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "totalPurchasedNonMasking" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "totalUsedMasking" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "totalUsedNonMasking" INTEGER NOT NULL DEFAULT 0;

-- Migrate existing single wallet to non-masking
UPDATE "SmsCreditBalance"
SET
  "nonMaskingBalance" = "balance",
  "totalPurchasedNonMasking" = "totalPurchased",
  "totalUsedNonMasking" = "totalUsed"
WHERE "nonMaskingBalance" = 0 AND "balance" > 0;

ALTER TABLE "SmsCreditTransaction"
  ADD COLUMN IF NOT EXISTS "smsType" TEXT NOT NULL DEFAULT 'non_masking';

UPDATE "SmsCreditTransaction" SET "smsType" = 'non_masking' WHERE "smsType" IS NULL;

ALTER TABLE "MessageLog"
  ADD COLUMN IF NOT EXISTS "smsType" TEXT NOT NULL DEFAULT 'non_masking',
  ADD COLUMN IF NOT EXISTS "senderId" TEXT;

UPDATE "MessageLog" SET "smsType" = 'non_masking' WHERE "smsType" IS NULL;

CREATE INDEX IF NOT EXISTS "MessageLog_smsType_idx" ON "MessageLog"("smsType");

ALTER TABLE "SmsAutoSettings"
  ADD COLUMN IF NOT EXISTS "defaultSmsType" TEXT NOT NULL DEFAULT 'non_masking';

CREATE TABLE IF NOT EXISTS "SmsSenderIdRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "adminNote" TEXT,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SmsSenderIdRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SmsSenderIdRequest_userId_key" ON "SmsSenderIdRequest"("userId");
CREATE INDEX IF NOT EXISTS "SmsSenderIdRequest_userId_idx" ON "SmsSenderIdRequest"("userId");
CREATE INDEX IF NOT EXISTS "SmsSenderIdRequest_status_idx" ON "SmsSenderIdRequest"("status");

DO $$ BEGIN
  ALTER TABLE "SmsSenderIdRequest" ADD CONSTRAINT "SmsSenderIdRequest_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
