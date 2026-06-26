-- Multi-channel inbox: messenger | instagram | whatsapp
ALTER TABLE "MessengerConversation" ADD COLUMN IF NOT EXISTS "channel" TEXT NOT NULL DEFAULT 'messenger';

-- WhatsApp/Instagram conversations have no FacebookPage link.
ALTER TABLE "MessengerConversation" ALTER COLUMN "facebookPageId" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "MessengerConversation_shopId_channel_idx" ON "MessengerConversation"("shopId", "channel");
