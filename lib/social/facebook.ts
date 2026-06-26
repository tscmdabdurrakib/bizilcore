/**
 * Facebook Page connection helpers (Integrations module).
 * SocialConnection is the source of truth; legacy FacebookPage rows are
 * synced on connect/disconnect so the existing FB inbox / comment-order
 * features keep working.
 */
import { prisma } from "@/lib/prisma";
import { encryptToken, decryptToken } from "@/lib/crypto";
import {
  FB_DIALOG_BASE,
  getMetaAppId,
  graphGet,
  expiresInToDate,
} from "@/lib/social/meta";

export const FACEBOOK_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_metadata",
  "pages_messaging",
  "business_management",
];

// Instagram connections go through the same FB dialog but also need IG scopes
export const INSTAGRAM_EXTRA_SCOPES = ["instagram_basic"];

export interface FacebookPageInfo {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  fan_count?: number;
  picture?: { data?: { url?: string } };
}

export function buildFacebookOAuthUrl(opts: {
  state: string;
  redirectUri: string;
  includeInstagramScopes?: boolean;
}): string {
  const scopes = opts.includeInstagramScopes
    ? [...FACEBOOK_SCOPES, ...INSTAGRAM_EXTRA_SCOPES]
    : FACEBOOK_SCOPES;
  const params = new URLSearchParams({
    client_id: getMetaAppId(),
    redirect_uri: opts.redirectUri,
    state: opts.state,
    scope: scopes.join(","),
    response_type: "code",
  });
  return `${FB_DIALOG_BASE}?${params}`;
}

/** Pages the user manages, with page access tokens. */
export async function getUserPages(userToken: string): Promise<FacebookPageInfo[]> {
  const data = await graphGet<{ data?: FacebookPageInfo[] }>("me/accounts", userToken, {
    fields: "id,name,access_token,category,fan_count,picture{url}",
    limit: "100",
  });
  return data.data ?? [];
}

export async function saveFacebookConnection(opts: {
  shopId: string;
  page: FacebookPageInfo;
  scopes: string[];
  tokenExpiresIn?: number;
}): Promise<void> {
  const { shopId, page, scopes } = opts;
  const avatarUrl =
    page.picture?.data?.url ??
    `https://graph.facebook.com/${page.id}/picture?type=square&width=160&height=160`;

  const common = {
    accountId: page.id,
    accountName: page.name,
    accountAvatarUrl: avatarUrl,
    accessToken: encryptToken(page.access_token),
    tokenType: "long_lived",
    tokenExpiresAt: expiresInToDate(opts.tokenExpiresIn),
    scopes,
    metadata: { category: page.category ?? null, fan_count: page.fan_count ?? null },
    status: "connected",
    connectedAt: new Date(),
  };

  await prisma.socialConnection.upsert({
    where: { shopId_platform: { shopId, platform: "facebook" } },
    create: { shopId, platform: "facebook", ...common },
    update: common,
  });

  // Sync legacy table (plaintext token — existing readers expect it)
  await prisma.facebookPage.upsert({
    where: { shopId_pageId: { shopId, pageId: page.id } },
    create: {
      shopId,
      pageId: page.id,
      pageName: page.name,
      accessToken: page.access_token,
      category: page.category,
      followers: page.fan_count,
      isActive: true,
    },
    update: {
      pageName: page.name,
      accessToken: page.access_token,
      category: page.category,
      followers: page.fan_count,
      isActive: true,
    },
  });
}

export interface PendingFbAuth {
  token: string; // long-lived user token
  platform: "facebook" | "instagram";
  expiresIn: number | null;
  shopId: string;
}

/** Parse + validate the encrypted page-picker cookie. Null if invalid/foreign. */
export function parsePendingFbCookie(
  cookieValue: string | undefined,
  shopId: string,
): PendingFbAuth | null {
  if (!cookieValue) return null;
  try {
    const json = decryptToken(cookieValue);
    if (!json) return null;
    const pending = JSON.parse(json) as PendingFbAuth;
    if (!pending.token || pending.shopId !== shopId) return null;
    return pending;
  } catch {
    return null;
  }
}

export async function disconnectFacebook(shopId: string): Promise<void> {
  const conn = await prisma.socialConnection.findUnique({
    where: { shopId_platform: { shopId, platform: "facebook" } },
  });
  if (!conn) return;

  await prisma.socialConnection.update({
    where: { id: conn.id },
    data: { status: "disconnected", accessToken: "" },
  });

  // Deactivate the synced legacy row
  await prisma.facebookPage.updateMany({
    where: { shopId, pageId: conn.accountId },
    data: { isActive: false },
  });
}
