-- Admin rebuild: shop status, admin roles, audit log, cron log, newsletter campaigns

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "adminRole" TEXT;

ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "shopStatus" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "statusReason" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3);
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "suspendedBy" TEXT;

CREATE INDEX IF NOT EXISTS "Shop_shopStatus_idx" ON "Shop"("shopStatus");

CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdminAuditLog_adminId_idx" ON "AdminAuditLog"("adminId");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

CREATE TABLE IF NOT EXISTS "CronRunLog" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "result" JSONB,
    "ranAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triggeredBy" TEXT,
    CONSTRAINT "CronRunLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CronRunLog_jobName_idx" ON "CronRunLog"("jobName");
CREATE INDEX IF NOT EXISTS "CronRunLog_ranAt_idx" ON "CronRunLog"("ranAt");

CREATE TABLE IF NOT EXISTS "NewsletterCampaign" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "sentBy" TEXT NOT NULL,
    "recipientCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NewsletterCampaign_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "NewsletterCampaign_status_idx" ON "NewsletterCampaign"("status");
CREATE INDEX IF NOT EXISTS "NewsletterCampaign_createdAt_idx" ON "NewsletterCampaign"("createdAt");
