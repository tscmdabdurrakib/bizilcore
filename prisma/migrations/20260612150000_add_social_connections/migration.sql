-- Social Integrations module: OAuth-connected social accounts (one per platform per shop)

CREATE TABLE IF NOT EXISTS "SocialConnection" (
  "id"               TEXT NOT NULL,
  "shopId"           TEXT NOT NULL,
  "platform"         TEXT NOT NULL,
  "accountId"        TEXT NOT NULL,
  "accountName"      TEXT,
  "accountAvatarUrl" TEXT,
  "accessToken"      TEXT NOT NULL,
  "tokenType"        TEXT,
  "tokenExpiresAt"   TIMESTAMP(3),
  "scopes"           TEXT[] DEFAULT ARRAY[]::TEXT[],
  "metadata"         JSONB NOT NULL DEFAULT '{}',
  "status"           TEXT NOT NULL DEFAULT 'connected',
  "connectedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SocialConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SocialConnection_shopId_platform_key"
  ON "SocialConnection"("shopId", "platform");

CREATE INDEX IF NOT EXISTS "SocialConnection_shopId_idx"
  ON "SocialConnection"("shopId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SocialConnection_shopId_fkey'
  ) THEN
    ALTER TABLE "SocialConnection"
      ADD CONSTRAINT "SocialConnection_shopId_fkey"
      FOREIGN KEY ("shopId") REFERENCES "Shop"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
