/**
 * WhatsApp Business connection helpers (Integrations module) —
 * Meta Embedded Signup, redirect-based flow.
 *
 * Distinct from legacy lib/whatsapp.ts (manual Cloud API token setup);
 * on connect we also sync the legacy WhatsAppSettings row so existing
 * invoice/communication send features keep working.
 */
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/crypto";
import { encryptToken as legacyEncryptToken } from "@/lib/whatsapp";
import {
  FB_DIALOG_BASE,
  MetaApiError,
  debugToken,
  getMetaAppId,
  graphGet,
} from "@/lib/social/meta";

export const WHATSAPP_SCOPES = [
  "whatsapp_business_management",
  "whatsapp_business_messaging",
];

export interface WhatsAppPhoneNumber {
  id: string; // phone_number_id
  display_phone_number?: string;
  verified_name?: string;
  code_verification_status?: string;
}

export interface WhatsAppBusinessAccount {
  id: string; // WABA ID
  name?: string;
  phoneNumbers: WhatsAppPhoneNumber[];
}

export function getWhatsAppConfigId(): string {
  return process.env.META_WHATSAPP_CONFIG_ID || "";
}

export function buildWhatsAppSignupUrl(opts: { state: string; redirectUri: string }): string {
  const params = new URLSearchParams({
    client_id: getMetaAppId(),
    redirect_uri: opts.redirectUri,
    state: opts.state,
    response_type: "code",
    config_id: getWhatsAppConfigId(),
    override_default_response_type: "true",
  });
  return `${FB_DIALOG_BASE}?${params}`;
}

/**
 * Discover the WABA shared during Embedded Signup via debug_token
 * granular scopes, then fetch its phone numbers.
 */
export async function discoverWhatsAppBusinessAccount(
  accessToken: string,
): Promise<{ waba: WhatsAppBusinessAccount; scopes: string[]; expiresAt?: number }> {
  const info = await debugToken(accessToken);

  const wabaIds =
    info.granular_scopes.find((g) => g.scope === "whatsapp_business_management")?.target_ids ??
    info.granular_scopes.find((g) => g.scope === "whatsapp_business_messaging")?.target_ids ??
    [];

  if (wabaIds.length === 0) {
    throw new MetaApiError("No WhatsApp Business Account was shared during signup");
  }

  const wabaId = wabaIds[0];
  const [wabaInfo, phoneData] = await Promise.all([
    graphGet<{ id: string; name?: string }>(wabaId, accessToken, { fields: "id,name" }),
    graphGet<{ data?: WhatsAppPhoneNumber[] }>(`${wabaId}/phone_numbers`, accessToken, {
      fields: "id,display_phone_number,verified_name,code_verification_status",
    }),
  ]);

  return {
    waba: {
      id: wabaInfo.id,
      name: wabaInfo.name,
      phoneNumbers: phoneData.data ?? [],
    },
    scopes: info.scopes,
    expiresAt: info.expires_at,
  };
}

export async function saveWhatsAppConnection(opts: {
  shopId: string;
  userId: string; // legacy WhatsAppSettings is keyed by userId
  accessToken: string;
  waba: WhatsAppBusinessAccount;
  scopes: string[];
  expiresAt?: number; // unix seconds, 0/undefined = never
}): Promise<void> {
  const { shopId, userId, accessToken, waba, scopes } = opts;
  const phone = waba.phoneNumbers[0];

  const common = {
    accountId: waba.id,
    accountName: phone?.verified_name ?? waba.name ?? null,
    accountAvatarUrl: null as string | null,
    accessToken: encryptToken(accessToken),
    tokenType: "business",
    tokenExpiresAt: opts.expiresAt ? new Date(opts.expiresAt * 1000) : null,
    scopes,
    metadata: {
      waba_id: waba.id,
      waba_name: waba.name ?? null,
      phone_number_id: phone?.id ?? null,
      display_phone_number: phone?.display_phone_number ?? null,
      code_verification_status: phone?.code_verification_status ?? null,
    },
    status: "connected",
    connectedAt: new Date(),
  };

  await prisma.socialConnection.upsert({
    where: { shopId_platform: { shopId, platform: "whatsapp" } },
    create: { shopId, platform: "whatsapp", ...common },
    update: common,
  });

  // Sync legacy settings so existing WhatsApp send features keep working
  if (phone?.id) {
    const legacyData = {
      apiToken: legacyEncryptToken(accessToken),
      phoneNumberId: phone.id,
      businessAccountId: waba.id,
      isConnected: true,
      connectedAt: new Date(),
    };
    await prisma.whatsAppSettings.upsert({
      where: { userId },
      create: { userId, ...legacyData },
      update: legacyData,
    });
  }
}

export async function disconnectWhatsApp(shopId: string, userId: string): Promise<void> {
  await prisma.socialConnection.updateMany({
    where: { shopId, platform: "whatsapp" },
    data: { status: "disconnected", accessToken: "" },
  });

  await prisma.whatsAppSettings.updateMany({
    where: { userId },
    data: { isConnected: false },
  });
}
