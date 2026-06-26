/**
 * Instagram Business account connection helpers (Integrations module).
 * IG Business accounts connect via their linked Facebook Page —
 * the Page access token is reused for IG Graph API calls.
 */
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/crypto";
import { graphGet, expiresInToDate } from "@/lib/social/meta";
import type { FacebookPageInfo } from "@/lib/social/facebook";

export interface InstagramAccountInfo {
  id: string;
  username?: string;
  profile_picture_url?: string;
}

/** The IG Business account linked to a FB Page, or null if none. */
export async function getLinkedInstagramAccount(
  pageId: string,
  pageToken: string,
): Promise<InstagramAccountInfo | null> {
  const data = await graphGet<{
    instagram_business_account?: InstagramAccountInfo;
  }>(pageId, pageToken, {
    fields: "instagram_business_account{id,username,profile_picture_url}",
  });
  return data.instagram_business_account ?? null;
}

export async function saveInstagramConnection(opts: {
  shopId: string;
  igAccount: InstagramAccountInfo;
  page: FacebookPageInfo;
  scopes: string[];
  tokenExpiresIn?: number;
}): Promise<void> {
  const { shopId, igAccount, page, scopes } = opts;

  const common = {
    accountId: igAccount.id,
    accountName: igAccount.username ?? null,
    accountAvatarUrl: igAccount.profile_picture_url ?? null,
    // IG Graph API calls use the linked Page's access token
    accessToken: encryptToken(page.access_token),
    tokenType: "long_lived",
    tokenExpiresAt: expiresInToDate(opts.tokenExpiresIn),
    scopes,
    metadata: { page_id: page.id, page_name: page.name },
    status: "connected",
    connectedAt: new Date(),
  };

  await prisma.socialConnection.upsert({
    where: { shopId_platform: { shopId, platform: "instagram" } },
    create: { shopId, platform: "instagram", ...common },
    update: common,
  });
}

export async function disconnectInstagram(shopId: string): Promise<void> {
  await prisma.socialConnection.updateMany({
    where: { shopId, platform: "instagram" },
    data: { status: "disconnected", accessToken: "" },
  });
}
