import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms";
import {
  checkAndDeductCredit,
  countSmsSegments,
  getApprovedSenderId,
  getBalanceForType,
  getGlobalSmsSettings,
  getPriceForType,
  getSmsCreditBalance,
} from "@/lib/sms/credits";
import { applySmsTemplate, getSmsAutoSettings } from "@/lib/sms/settings";
import { parseSmsType, type SmsType } from "@/lib/sms/types";

export class InsufficientCreditsError extends Error {
  constructor(
    public required: number,
    public available: number,
    public smsType: SmsType = "non_masking"
  ) {
    super(`অপর্যাপ্ত ${smsType === "masking" ? "Masking" : "Non-Masking"} SMS ক্রেডিট: ${available}টি আছে, ${required}টি প্রয়োজন`);
    this.name = "InsufficientCreditsError";
  }
}

export class SmsServiceInactiveError extends Error {
  constructor() {
    super("SMS সার্ভিস বর্তমানে বন্ধ আছে");
    this.name = "SmsServiceInactiveError";
  }
}

export class MaskingNotApprovedError extends Error {
  constructor() {
    super("Masking SMS পাঠাতে প্রথমে Sender ID approve করান");
    this.name = "MaskingNotApprovedError";
  }
}

export class MaskingDisabledError extends Error {
  constructor() {
    super("Masking SMS সার্ভিস বর্তমানে বন্ধ আছে");
    this.name = "MaskingDisabledError";
  }
}

function getPlatformApiKey(): string {
  const key = process.env.SMS_PLATFORM_API_KEY ?? "";
  if (!key) throw new Error("SMS platform API key not configured");
  return key;
}

export interface SendPlatformSMSOptions {
  smsType?: SmsType;
  customerId?: string;
}

async function resolveSmsType(userId: string, override?: SmsType): Promise<SmsType> {
  const settings = await getGlobalSmsSettings();
  const requested = override
    ? parseSmsType(override)
    : parseSmsType((await getSmsAutoSettings(userId)).defaultSmsType);

  if (requested === "masking" && !settings.maskingEnabled) {
    if (override) throw new MaskingDisabledError();
    return "non_masking";
  }
  return requested;
}

export async function sendPlatformSMS(
  userId: string,
  phone: string,
  message: string,
  options?: SendPlatformSMSOptions | string
): Promise<{ success: boolean; messageLogId?: string; segments?: number; smsType?: SmsType }> {
  const opts: SendPlatformSMSOptions =
    typeof options === "string" ? { customerId: options } : (options ?? {});
  const settings = await getGlobalSmsSettings();
  if (!settings.isSmsServiceActive) {
    throw new SmsServiceInactiveError();
  }

  const smsType = await resolveSmsType(userId, opts.smsType);
  if (smsType === "masking" && !settings.maskingEnabled) {
    throw new MaskingDisabledError();
  }
  if (smsType === "non_masking" && !settings.nonMaskingEnabled) {
    throw new Error("Non-Masking SMS সার্ভিস বর্তমানে বন্ধ আছে");
  }

  let senderId: string | undefined;
  if (smsType === "masking") {
    const approved = await getApprovedSenderId(userId);
    if (!approved) throw new MaskingNotApprovedError();
    senderId = approved;
  }

  const segments = countSmsSegments(message);
  const balanceRow = await prisma.smsCreditBalance.findUnique({ where: { userId } });
  const available = getBalanceForType(balanceRow, smsType);
  if (available < segments) {
    throw new InsufficientCreditsError(segments, available, smsType);
  }

  const log = await prisma.messageLog.create({
    data: {
      userId,
      customerId: opts.customerId ?? null,
      toPhone: phone.replace(/[^0-9+]/g, ""),
      message,
      channel: "sms",
      smsType,
      senderId: senderId ?? null,
      status: "pending",
    },
  });

  try {
    const apiKey = getPlatformApiKey();
    const result = await sendSMS(apiKey, phone, message, senderId);

    if (!result.success) {
      await prisma.messageLog.update({
        where: { id: log.id },
        data: {
          status: "failed",
          errorMessage: result.errorMessage ?? "Provider rejected message",
        },
      });
      return { success: false, smsType };
    }

    const deduct = await checkAndDeductCredit(
      userId,
      segments,
      smsType,
      log.id,
      `${smsType === "masking" ? "Masking" : "Non-Masking"} SMS to ${phone}`
    );
    if (!deduct.success) {
      await prisma.messageLog.update({
        where: { id: log.id },
        data: { status: "failed", errorMessage: "Credit deduction failed after send" },
      });
      return { success: false, smsType };
    }

    await prisma.messageLog.update({
      where: { id: log.id },
      data: { status: "sent" },
    });

    const shop = await prisma.shop.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (shop) {
      void import("@/lib/activity/trackFromSession").then(({ trackForUser }) =>
        trackForUser(userId, shop.id, {
          actionType: "sms_sent",
          actionLabel: `SMS পাঠানো হয়েছে: ${phone}`,
          metadata: { message_log_id: log.id, phone, segments },
        }),
      );
    }

    return { success: true, messageLogId: log.id, segments, smsType };
  } catch (err) {
    await prisma.messageLog
      .update({
        where: { id: log.id },
        data: {
          status: "failed",
          errorMessage: err instanceof Error ? err.message : "Unknown error",
        },
      })
      .catch(() => {});
    throw err;
  }
}

export async function triggerAutoOrderSMS(
  userId: string,
  type: "order_create" | "order_status_change",
  customerPhone: string,
  vars: { order_id: string; customer_name?: string; amount?: string; status?: string; shopName?: string },
  customerId?: string
) {
  if (!customerPhone) return;

  const autoSettings = await getSmsAutoSettings(userId);
  const enabled =
    type === "order_create"
      ? autoSettings.autoSmsOnOrderCreate
      : autoSettings.autoSmsOnOrderStatusChange;
  if (!enabled) return;

  const template =
    type === "order_create"
      ? autoSettings.autoSmsTemplateOrderCreate
      : autoSettings.autoSmsTemplateStatusChange;

  const message = applySmsTemplate(template, vars);
  await sendPlatformSMS(userId, customerPhone, message, {
    customerId,
    smsType: parseSmsType(autoSettings.defaultSmsType),
  }).catch(() => {});
}

export { countSmsSegments, getPriceForType };
