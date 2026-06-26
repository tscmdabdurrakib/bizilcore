import { prisma } from "@/lib/prisma";
import { getGlobalSmsSettings } from "@/lib/sms/credits";

export interface SmsAutoSettingsData {
  autoSmsOnOrderCreate: boolean;
  autoSmsOnOrderStatusChange: boolean;
  autoSmsTemplateOrderCreate: string;
  autoSmsTemplateStatusChange: string;
  defaultSmsType: "masking" | "non_masking";
  lowCreditNotification: boolean;
}

export const DEFAULT_SMS_AUTO_SETTINGS: SmsAutoSettingsData = {
  autoSmsOnOrderCreate: false,
  autoSmsOnOrderStatusChange: false,
  autoSmsTemplateOrderCreate: "আপনার অর্ডার #{order_id} কনফার্ম হয়েছে। ধন্যবাদ!",
  autoSmsTemplateStatusChange: "আপনার অর্ডার #{order_id} এর স্ট্যাটাস আপডেট হয়েছে: {status}",
  defaultSmsType: "non_masking",
  lowCreditNotification: true,
};

export async function getSmsAutoSettings(userId: string): Promise<SmsAutoSettingsData> {
  const row = await prisma.smsAutoSettings.findUnique({ where: { userId } });
  if (!row) return { ...DEFAULT_SMS_AUTO_SETTINGS };
  return {
    autoSmsOnOrderCreate: row.autoSmsOnOrderCreate,
    autoSmsOnOrderStatusChange: row.autoSmsOnOrderStatusChange,
    autoSmsTemplateOrderCreate: row.autoSmsTemplateOrderCreate,
    autoSmsTemplateStatusChange: row.autoSmsTemplateStatusChange,
    defaultSmsType: row.defaultSmsType === "masking" ? "masking" : "non_masking",
    lowCreditNotification: row.lowCreditNotification,
  };
}

export async function updateSmsAutoSettings(
  userId: string,
  data: Partial<SmsAutoSettingsData>
): Promise<SmsAutoSettingsData> {
  const global = await getGlobalSmsSettings();
  const patch = { ...data };
  if (!global.maskingEnabled && patch.defaultSmsType === "masking") {
    patch.defaultSmsType = "non_masking";
  }

  const row = await prisma.smsAutoSettings.upsert({
    where: { userId },
    create: { userId, ...DEFAULT_SMS_AUTO_SETTINGS, ...patch },
    update: patch,
  });
  return {
    autoSmsOnOrderCreate: row.autoSmsOnOrderCreate,
    autoSmsOnOrderStatusChange: row.autoSmsOnOrderStatusChange,
    autoSmsTemplateOrderCreate: row.autoSmsTemplateOrderCreate,
    autoSmsTemplateStatusChange: row.autoSmsTemplateStatusChange,
    defaultSmsType: row.defaultSmsType === "masking" ? "masking" : "non_masking",
    lowCreditNotification: row.lowCreditNotification,
  };
}

export function applySmsTemplate(
  template: string,
  vars: { order_id?: string; customer_name?: string; amount?: string; status?: string; shopName?: string }
): string {
  return template
    .replace(/#\{order_id\}/g, vars.order_id ?? "")
    .replace(/\{order_id\}/g, vars.order_id ?? "")
    .replace(/\{customer_name\}/g, vars.customer_name ?? "")
    .replace(/\{amount\}/g, vars.amount ?? "")
    .replace(/\{status\}/g, vars.status ?? "")
    .replace(/\{shopName\}/g, vars.shopName ?? "");
}
