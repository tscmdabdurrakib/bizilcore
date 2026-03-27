import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const SMS_NET_BD_SEND = "https://api.sms.net.bd/sendsms";
const SMS_NET_BD_BALANCE = "https://api.sms.net.bd/user/balance";

function getEncryptionKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "bizilcore-sms-fallback-key-32chars!";
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptApiKey(plain: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decryptApiKey(encrypted: string): string {
  try {
    const [ivHex, encHex] = encrypted.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const enc = Buffer.from(encHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", getEncryptionKey(), iv);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}

export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 4) return "••••";
  return "••••••••" + apiKey.slice(-4);
}

export async function sendSMS(apiKey: string, toPhone: string, message: string): Promise<boolean> {
  const phone = toPhone.replace(/[^0-9]/g, "");
  if (!phone || !apiKey) return false;
  try {
    const res = await fetch(SMS_NET_BD_SEND, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, msg: message, to: phone }),
    });
    const data = await res.json();
    return data?.error === 0 || res.ok;
  } catch {
    return false;
  }
}

/**
 * Returns:
 *   number  — success (balance value, may be 0)
 *   false   — invalid API key (got response, error != 0)
 *   null    — network/fetch error, can't verify
 */
export async function checkSMSBalance(apiKey: string): Promise<number | false | null> {
  if (!apiKey) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${SMS_NET_BD_BALANCE}?api_key=${encodeURIComponent(apiKey)}`, {
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    let data: Record<string, unknown>;
    try {
      data = await res.json();
    } catch {
      return null;
    }

    // sms.net.bd returns error:0 (number) on success; sometimes as string "0"
    // eslint-disable-next-line eqeqeq
    if (data?.error == 0) return parseFloat((data.data as string) ?? "0") || 0;

    // Non-zero error means bad API key
    return false;
  } catch {
    // Network error, DNS failure, timeout, etc.
    return null;
  }
}

export async function getUserSMSSettings(userId: string) {
  const settings = await prisma.smsSettings.findUnique({ where: { userId } });
  const prefs = await prisma.smsNotificationPreferences.findUnique({ where: { userId } });
  return { settings, prefs };
}

export async function shouldSendSMS(userId: string, preferenceKey: keyof {
  orderConfirmed: boolean; orderStatusChanged: boolean; deliveryConfirmed: boolean;
  paymentReceived: boolean; lowStockAlert: boolean;
}): Promise<{ should: boolean; apiKey: string }> {
  const { settings, prefs } = await getUserSMSSettings(userId);
  if (!settings?.isConnected || !settings?.apiKey) return { should: false, apiKey: "" };
  const should = prefs ? Boolean(prefs[preferenceKey]) : preferenceKey === "orderConfirmed";
  const apiKey = should ? decryptApiKey(settings.apiKey) : "";
  return { should, apiKey };
}

export async function triggerOrderSMS(userId: string, preferenceKey: "orderConfirmed" | "orderStatusChanged" | "deliveryConfirmed" | "paymentReceived", customerPhone: string, message: string) {
  const { should, apiKey } = await shouldSendSMS(userId, preferenceKey);
  if (!should || !customerPhone) return;
  sendSMS(apiKey, customerPhone, message).catch(() => {});
}

export async function triggerLowStockAlert(userId: string, ownerPhone: string, productName: string, stock: number) {
  const { should, apiKey } = await shouldSendSMS(userId, "lowStockAlert");
  if (!should || !ownerPhone) return;
  const message = `BizilCore স্টক সতর্কতা: "${productName}" এর স্টক মাত্র ${stock}টি বাকি আছে। দ্রুত পুনরায় স্টক করুন।`;
  sendSMS(apiKey, ownerPhone, message).catch(() => {});
}

export interface SMSNotifSettings {
  smsConfirm: boolean;
  smsShipped: boolean;
  smsDelivered: boolean;
  smsTemplateConfirm: string;
  smsTemplateShipped: string;
  smsTemplateDelivered: string;
}

export const DEFAULT_SMS_SETTINGS: SMSNotifSettings = {
  smsConfirm: true,
  smsShipped: true,
  smsDelivered: true,
  smsTemplateConfirm: "আপনার অর্ডার নিশ্চিত হয়েছে। ধন্যবাদ! - {shopName}",
  smsTemplateShipped: "আপনার পণ্য পাঠানো হয়েছে। Tracking: {trackingId} - {shopName}",
  smsTemplateDelivered: "আপনার পণ্য পৌঁছেছে। ধন্যবাদ! - {shopName}",
};

export function buildSMSMessage(
  template: string,
  vars: { shopName?: string; trackingId?: string; amount?: string }
): string {
  return template
    .replace("{shopName}", vars.shopName ?? "")
    .replace("{trackingId}", vars.trackingId ?? "")
    .replace("{amount}", vars.amount ?? "");
}
