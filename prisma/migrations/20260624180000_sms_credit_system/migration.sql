-- SMS Credit System migration

CREATE TABLE IF NOT EXISTS "SmsCreditGlobalSettings" (
  "id" TEXT NOT NULL,
  "pricePerSms" DOUBLE PRECISION NOT NULL DEFAULT 0.30,
  "minPurchaseAmount" DOUBLE PRECISION NOT NULL DEFAULT 10.00,
  "maxPurchaseAmount" DOUBLE PRECISION,
  "bonusCreditEnabled" BOOLEAN NOT NULL DEFAULT false,
  "bonusTiers" JSONB NOT NULL DEFAULT '[]',
  "lowCreditAlertThreshold" INTEGER NOT NULL DEFAULT 10,
  "isSmsServiceActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SmsCreditGlobalSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SmsCreditDiscount" (
  "id" TEXT NOT NULL,
  "code" TEXT,
  "discountType" TEXT NOT NULL,
  "discountValue" DOUBLE PRECISION NOT NULL,
  "minPurchaseAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "maxUses" INTEGER,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validUntil" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "description" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SmsCreditDiscount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SmsCreditDiscount_code_key" ON "SmsCreditDiscount"("code") WHERE "code" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "SmsCreditDiscount_isActive_idx" ON "SmsCreditDiscount"("isActive");
CREATE INDEX IF NOT EXISTS "SmsCreditDiscount_code_idx" ON "SmsCreditDiscount"("code");

CREATE TABLE IF NOT EXISTS "SmsCreditBalance" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "balance" INTEGER NOT NULL DEFAULT 0,
  "totalPurchased" INTEGER NOT NULL DEFAULT 0,
  "totalUsed" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SmsCreditBalance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SmsCreditBalance_userId_key" ON "SmsCreditBalance"("userId");
CREATE INDEX IF NOT EXISTS "SmsCreditBalance_userId_idx" ON "SmsCreditBalance"("userId");

CREATE TABLE IF NOT EXISTS "SmsCreditTransaction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "transactionType" TEXT NOT NULL,
  "creditsAmount" INTEGER NOT NULL,
  "amountBdt" DOUBLE PRECISION,
  "pricePerSms" DOUBLE PRECISION,
  "discountId" TEXT,
  "discountAmountBdt" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "bonusCredits" INTEGER NOT NULL DEFAULT 0,
  "paymentMethod" TEXT,
  "paymentReference" TEXT,
  "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
  "messageLogId" TEXT,
  "note" TEXT,
  "processedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SmsCreditTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SmsCreditTransaction_messageLogId_key" ON "SmsCreditTransaction"("messageLogId") WHERE "messageLogId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "SmsCreditTransaction_userId_idx" ON "SmsCreditTransaction"("userId");
CREATE INDEX IF NOT EXISTS "SmsCreditTransaction_transactionType_idx" ON "SmsCreditTransaction"("transactionType");
CREATE INDEX IF NOT EXISTS "SmsCreditTransaction_paymentStatus_idx" ON "SmsCreditTransaction"("paymentStatus");
CREATE INDEX IF NOT EXISTS "SmsCreditTransaction_createdAt_idx" ON "SmsCreditTransaction"("createdAt");

CREATE TABLE IF NOT EXISTS "SmsAutoSettings" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "autoSmsOnOrderCreate" BOOLEAN NOT NULL DEFAULT false,
  "autoSmsOnOrderStatusChange" BOOLEAN NOT NULL DEFAULT false,
  "autoSmsTemplateOrderCreate" TEXT NOT NULL DEFAULT 'আপনার অর্ডার #{order_id} কনফার্ম হয়েছে। ধন্যবাদ!',
  "autoSmsTemplateStatusChange" TEXT NOT NULL DEFAULT 'আপনার অর্ডার #{order_id} এর স্ট্যাটাস আপডেট হয়েছে: {status}',
  "lowCreditNotification" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SmsAutoSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SmsAutoSettings_userId_key" ON "SmsAutoSettings"("userId");
CREATE INDEX IF NOT EXISTS "SmsAutoSettings_userId_idx" ON "SmsAutoSettings"("userId");

ALTER TABLE "MessageLog" ADD COLUMN IF NOT EXISTS "channel" TEXT NOT NULL DEFAULT 'sms';

DO $$ BEGIN
  ALTER TABLE "SmsCreditBalance" ADD CONSTRAINT "SmsCreditBalance_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SmsCreditTransaction" ADD CONSTRAINT "SmsCreditTransaction_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SmsCreditTransaction" ADD CONSTRAINT "SmsCreditTransaction_discountId_fkey"
    FOREIGN KEY ("discountId") REFERENCES "SmsCreditDiscount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SmsCreditTransaction" ADD CONSTRAINT "SmsCreditTransaction_messageLogId_fkey"
    FOREIGN KEY ("messageLogId") REFERENCES "MessageLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SmsAutoSettings" ADD CONSTRAINT "SmsAutoSettings_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed default global settings (singleton)
INSERT INTO "SmsCreditGlobalSettings" ("id", "pricePerSms", "minPurchaseAmount", "bonusCreditEnabled", "bonusTiers", "lowCreditAlertThreshold", "isSmsServiceActive", "createdAt", "updatedAt")
SELECT 'sms_global_settings', 0.30, 10.00, false, '[]'::jsonb, 10, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "SmsCreditGlobalSettings" LIMIT 1);
