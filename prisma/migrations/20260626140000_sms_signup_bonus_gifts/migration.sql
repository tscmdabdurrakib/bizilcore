-- SMS signup bonus settings

ALTER TABLE "SmsCreditGlobalSettings"
  ADD COLUMN IF NOT EXISTS "signupBonusEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "signupBonusMasking" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "signupBonusNonMasking" INTEGER NOT NULL DEFAULT 5;
