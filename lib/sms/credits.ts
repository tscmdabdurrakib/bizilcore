import { prisma } from "@/lib/prisma";
import { revalidateSmsCredits } from "@/lib/cache/revalidate";
import type { Prisma } from "@prisma/client";
import { attemptZiniPayVerification } from "@/lib/payment/zinipay-flow";
import { getPlatformZiniPayApiKey } from "@/lib/zinipay";
import { parseSmsType, type SmsType } from "@/lib/sms/types";

export type { SmsType };
export { parseSmsType };

export interface BonusTier {
  min_amount: number;
  bonus_percent: number;
}

export interface PurchaseCalculation {
  credits: number;
  baseCredits: number;
  finalAmount: number;
  originalAmount: number;
  discountAmount: number;
  bonusCredits: number;
  discountId: string | null;
  pricePerSms: number;
  totalCredits: number;
  smsType: SmsType;
}

const GLOBAL_SETTINGS_ID = "sms_global_settings";

type GlobalSettings = Awaited<ReturnType<typeof getGlobalSmsSettings>>;

export async function getGlobalSmsSettings() {
  const delegate = prisma.smsCreditGlobalSettings;
  if (!delegate?.findFirst) {
    throw new Error("SMS credit module not loaded — restart the dev server");
  }
  let settings = await delegate.findFirst();
  if (!settings) {
    settings = await delegate.create({
      data: { id: GLOBAL_SETTINGS_ID },
    });
  }
  return settings;
}

export interface UpdateGlobalSmsSettingsInput {
  pricePerSms?: number;
  pricePerSmsMasking?: number;
  pricePerSmsNonMasking?: number;
  maskingEnabled?: boolean;
  nonMaskingEnabled?: boolean;
  minPurchaseAmount?: number;
  maxPurchaseAmount?: number | null;
  bonusCreditEnabled?: boolean;
  bonusTiers?: BonusTier[];
  lowCreditAlertThreshold?: number;
  isSmsServiceActive?: boolean;
  signupBonusEnabled?: boolean;
  signupBonusMasking?: number;
  signupBonusNonMasking?: number;
}

export async function updateGlobalSmsSettings(body: UpdateGlobalSmsSettingsInput) {
  const existing = await getGlobalSmsSettings();

  const pricePerSmsMasking = body.pricePerSmsMasking ?? body.pricePerSms ?? existing.pricePerSmsMasking;
  const pricePerSmsNonMasking =
    body.pricePerSmsNonMasking ?? body.pricePerSms ?? existing.pricePerSmsNonMasking;

  return prisma.smsCreditGlobalSettings.update({
    where: { id: existing.id },
    data: {
      pricePerSms: pricePerSmsNonMasking,
      pricePerSmsMasking,
      pricePerSmsNonMasking,
      maskingEnabled: body.maskingEnabled ?? existing.maskingEnabled,
      nonMaskingEnabled: body.nonMaskingEnabled ?? existing.nonMaskingEnabled,
      minPurchaseAmount: body.minPurchaseAmount ?? existing.minPurchaseAmount,
      maxPurchaseAmount: body.maxPurchaseAmount !== undefined ? body.maxPurchaseAmount : existing.maxPurchaseAmount,
      bonusCreditEnabled: body.bonusCreditEnabled ?? existing.bonusCreditEnabled,
      bonusTiers: (body.bonusTiers ?? existing.bonusTiers) as Prisma.InputJsonValue,
      lowCreditAlertThreshold: body.lowCreditAlertThreshold ?? existing.lowCreditAlertThreshold,
      isSmsServiceActive: body.isSmsServiceActive ?? existing.isSmsServiceActive,
      signupBonusEnabled: body.signupBonusEnabled ?? existing.signupBonusEnabled,
      signupBonusMasking: body.signupBonusMasking ?? existing.signupBonusMasking,
      signupBonusNonMasking: body.signupBonusNonMasking ?? existing.signupBonusNonMasking,
    },
  });
}

export function getPriceForType(settings: GlobalSettings, smsType: SmsType): number {
  if (smsType === "masking") {
    return settings.pricePerSmsMasking ?? settings.pricePerSms ?? 0.35;
  }
  return settings.pricePerSmsNonMasking ?? settings.pricePerSms ?? 0.30;
}

export function getBalanceForType(
  balance: { maskingBalance?: number; nonMaskingBalance?: number; balance?: number } | null,
  smsType: SmsType
): number {
  if (!balance) return 0;
  if (smsType === "masking") return balance.maskingBalance ?? 0;
  return balance.nonMaskingBalance ?? balance.balance ?? 0;
}

export function syncLegacyBalanceFields(data: {
  maskingBalance: number;
  nonMaskingBalance: number;
  totalPurchasedMasking: number;
  totalPurchasedNonMasking: number;
  totalUsedMasking: number;
  totalUsedNonMasking: number;
}) {
  return {
    ...data,
    balance: data.maskingBalance + data.nonMaskingBalance,
    totalPurchased: data.totalPurchasedMasking + data.totalPurchasedNonMasking,
    totalUsed: data.totalUsedMasking + data.totalUsedNonMasking,
  };
}

export async function getSmsCreditBalance(userId: string) {
  const [balance, globalSettings] = await Promise.all([
    prisma.smsCreditBalance.findUnique({ where: { userId } }),
    getGlobalSmsSettings(),
  ]);
  const maskingBalance = balance?.maskingBalance ?? 0;
  const nonMaskingBalance = balance?.nonMaskingBalance ?? balance?.balance ?? 0;
  const threshold = globalSettings.lowCreditAlertThreshold;

  return {
    balance: maskingBalance + nonMaskingBalance,
    maskingBalance,
    nonMaskingBalance,
    totalPurchased: balance?.totalPurchased ?? 0,
    totalPurchasedMasking: balance?.totalPurchasedMasking ?? 0,
    totalPurchasedNonMasking: balance?.totalPurchasedNonMasking ?? 0,
    totalUsed: balance?.totalUsed ?? 0,
    totalUsedMasking: balance?.totalUsedMasking ?? 0,
    totalUsedNonMasking: balance?.totalUsedNonMasking ?? 0,
    lowCreditThreshold: threshold,
    isLow: maskingBalance + nonMaskingBalance < threshold,
    isLowMasking: maskingBalance < threshold,
    isLowNonMasking: nonMaskingBalance < threshold,
  };
}

export function countSmsSegments(message: string): number {
  const isUnicode = /[^\u0000-\u007F]/.test(message);
  const singleLimit = isUnicode ? 70 : 160;
  const multiLimit = isUnicode ? 67 : 153;
  const len = message.length;
  if (len === 0) return 1;
  if (len <= singleLimit) return 1;
  return Math.ceil(len / multiLimit);
}

async function findApplicableDiscount(code: string | undefined, amountBdt: number) {
  const now = new Date();

  if (code?.trim()) {
    const discount = await prisma.smsCreditDiscount.findFirst({
      where: {
        code: code.trim().toUpperCase(),
        isActive: true,
        minPurchaseAmount: { lte: amountBdt },
        OR: [{ validUntil: null }, { validUntil: { gte: now } }],
        validFrom: { lte: now },
      },
    });
    if (!discount) return null;
    if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) return null;
    return discount;
  }

  const autoDiscount = await prisma.smsCreditDiscount.findFirst({
    where: {
      code: null,
      isActive: true,
      minPurchaseAmount: { lte: amountBdt },
      OR: [{ validUntil: null }, { validUntil: { gte: now } }],
      validFrom: { lte: now },
    },
    orderBy: { discountValue: "desc" },
  });
  if (!autoDiscount) return null;
  if (autoDiscount.maxUses !== null && autoDiscount.usedCount >= autoDiscount.maxUses) return null;
  return autoDiscount;
}

export async function calculatePurchase(
  amountBdt: number,
  smsType: SmsType = "non_masking",
  discountCode?: string
): Promise<PurchaseCalculation> {
  const settings = await getGlobalSmsSettings();
  const type = parseSmsType(smsType);

  if (type === "masking" && !settings.maskingEnabled) {
    throw new Error("Masking SMS সার্ভিস বর্তমানে বন্ধ আছে");
  }
  if (type === "non_masking" && !settings.nonMaskingEnabled) {
    throw new Error("Non-Masking SMS সার্ভিস বর্তমানে বন্ধ আছে");
  }

  if (amountBdt < settings.minPurchaseAmount) {
    throw new Error(`সর্বনিম্ন ৳${settings.minPurchaseAmount} কেনার পরিমাণ`);
  }
  if (settings.maxPurchaseAmount && amountBdt > settings.maxPurchaseAmount) {
    throw new Error(`সর্বোচ্চ ৳${settings.maxPurchaseAmount} পর্যন্ত কেনা যাবে`);
  }

  const pricePerSms = getPriceForType(settings, type);
  const baseCredits = Math.floor(amountBdt / pricePerSms);

  const discount = await findApplicableDiscount(discountCode, amountBdt);
  let discountAmount = 0;
  if (discount) {
    if (discount.discountType === "percent") {
      discountAmount = Math.round((amountBdt * discount.discountValue) / 100 * 100) / 100;
    } else {
      discountAmount = Math.min(discount.discountValue, amountBdt);
    }
  }

  const finalAmount = Math.max(0, Math.round((amountBdt - discountAmount) * 100) / 100);
  const credits = Math.floor(finalAmount / pricePerSms);

  const tiers = (Array.isArray(settings.bonusTiers) ? settings.bonusTiers : []) as unknown as BonusTier[];
  let bonusCredits = 0;
  if (settings.bonusCreditEnabled && credits > 0) {
    const sorted = [...tiers].sort((a, b) => b.min_amount - a.min_amount);
    const tier = sorted.find((t) => finalAmount >= t.min_amount);
    if (tier) {
      bonusCredits = Math.floor(credits * (tier.bonus_percent / 100));
    }
  }

  return {
    credits,
    baseCredits,
    finalAmount,
    originalAmount: amountBdt,
    discountAmount,
    bonusCredits,
    discountId: discount?.id ?? null,
    pricePerSms,
    totalCredits: credits + bonusCredits,
    smsType: type,
  };
}

export interface InitiatePurchaseData {
  amountBdt: number;
  smsType?: SmsType;
  discountCode?: string;
  paymentMethod: string;
  paymentReference?: string;
  senderPhone?: string;
}

export async function initiatePurchase(userId: string, data: InitiatePurchaseData) {
  const smsType = parseSmsType(data.smsType);
  const calc = await calculatePurchase(data.amountBdt, smsType, data.discountCode);
  const settings = await getGlobalSmsSettings();

  if (!settings.isSmsServiceActive) {
    throw new Error("SMS সার্ভিস বর্তমানে বন্ধ আছে");
  }

  const tx = await prisma.smsCreditTransaction.create({
    data: {
      userId,
      transactionType: "purchase",
      smsType,
      creditsAmount: calc.totalCredits,
      amountBdt: calc.finalAmount,
      pricePerSms: calc.pricePerSms,
      discountId: calc.discountId,
      discountAmountBdt: calc.discountAmount,
      bonusCredits: calc.bonusCredits,
      paymentMethod: data.paymentMethod,
      paymentReference: data.paymentReference ?? data.senderPhone ?? null,
      paymentStatus: "pending",
      note: data.senderPhone ? `Sender: ${data.senderPhone}` : null,
    },
  });

  let autoVerified = false;
  const txRef = data.paymentReference?.trim();
  const ziniPayKey = getPlatformZiniPayApiKey();

  if (ziniPayKey && txRef && data.paymentMethod !== "manual") {
    const result = await attemptZiniPayVerification(ziniPayKey, {
      transactionId: txRef,
      amount: calc.finalAmount,
      invoiceId: tx.id,
      expectedMethod: data.paymentMethod,
    });

    if (result.verifyId) {
      await prisma.smsCreditTransaction.update({
        where: { id: tx.id },
        data: {
          zinipayVerifyId: result.verifyId,
          note: result.error ? `ZiniPay: ${result.error}` : tx.note,
        },
      });
    }

    if (result.success && result.transactionId) {
      await completePurchase(tx.id, result.transactionId);
      autoVerified = true;
    }
  }

  return { transactionId: tx.id, autoVerified, ...calc };
}

export async function completePurchase(transactionId: string, paymentReference?: string) {
  const tx = await prisma.smsCreditTransaction.findUnique({ where: { id: transactionId } });
  if (!tx) throw new Error("Transaction not found");
  if (tx.transactionType !== "purchase") throw new Error("Invalid transaction type");
  if (tx.paymentStatus === "completed") return { success: true, alreadyCompleted: true };
  if (tx.paymentStatus !== "pending") throw new Error("Transaction cannot be completed");

  const smsType = parseSmsType(tx.smsType);

  await prisma.$transaction(async (db) => {
    const existing = await db.smsCreditBalance.findUnique({ where: { userId: tx.userId } });
    const maskingBalance = (existing?.maskingBalance ?? 0) + (smsType === "masking" ? tx.creditsAmount : 0);
    const nonMaskingBalance =
      (existing?.nonMaskingBalance ?? existing?.balance ?? 0) +
      (smsType === "non_masking" ? tx.creditsAmount : 0);
    const totalPurchasedMasking =
      (existing?.totalPurchasedMasking ?? 0) + (smsType === "masking" ? tx.creditsAmount : 0);
    const totalPurchasedNonMasking =
      (existing?.totalPurchasedNonMasking ?? 0) + (smsType === "non_masking" ? tx.creditsAmount : 0);

    const synced = syncLegacyBalanceFields({
      maskingBalance,
      nonMaskingBalance,
      totalPurchasedMasking,
      totalPurchasedNonMasking,
      totalUsedMasking: existing?.totalUsedMasking ?? 0,
      totalUsedNonMasking: existing?.totalUsedNonMasking ?? 0,
    });

    await db.smsCreditBalance.upsert({
      where: { userId: tx.userId },
      create: { userId: tx.userId, ...synced },
      update: synced,
    });

    await db.smsCreditTransaction.update({
      where: { id: transactionId },
      data: {
        paymentStatus: "completed",
        paymentReference: paymentReference ?? tx.paymentReference,
      },
    });

    if (tx.discountId) {
      await db.smsCreditDiscount.update({
        where: { id: tx.discountId },
        data: { usedCount: { increment: 1 } },
      });
    }
  });

  revalidateSmsCredits(tx.userId);
  return { success: true };
}

export async function rejectPurchase(transactionId: string, note?: string) {
  await prisma.smsCreditTransaction.update({
    where: { id: transactionId },
    data: { paymentStatus: "failed", note: note ?? undefined },
  });
  return { success: true };
}

export async function checkAndDeductCredit(
  userId: string,
  segments: number,
  smsType: SmsType = "non_masking",
  messageLogId?: string,
  note?: string
): Promise<{ success: boolean; remainingBalance: number }> {
  if (segments < 1) segments = 1;
  const type = parseSmsType(smsType);

  const result = await prisma.$transaction(async (db) => {
    const balance = await db.smsCreditBalance.findUnique({ where: { userId } });
    const current = getBalanceForType(balance, type);
    if (current < segments) {
      return { success: false, remainingBalance: current };
    }

    const maskingBalance =
      (balance?.maskingBalance ?? 0) - (type === "masking" ? segments : 0);
    const nonMaskingBalance =
      (balance?.nonMaskingBalance ?? balance?.balance ?? 0) -
      (type === "non_masking" ? segments : 0);
    const totalUsedMasking =
      (balance?.totalUsedMasking ?? 0) + (type === "masking" ? segments : 0);
    const totalUsedNonMasking =
      (balance?.totalUsedNonMasking ?? 0) + (type === "non_masking" ? segments : 0);

    const synced = syncLegacyBalanceFields({
      maskingBalance,
      nonMaskingBalance,
      totalPurchasedMasking: balance?.totalPurchasedMasking ?? 0,
      totalPurchasedNonMasking: balance?.totalPurchasedNonMasking ?? 0,
      totalUsedMasking,
      totalUsedNonMasking,
    });

    await db.smsCreditBalance.upsert({
      where: { userId },
      create: { userId, ...synced },
      update: synced,
    });

    await db.smsCreditTransaction.create({
      data: {
        userId,
        transactionType: "usage",
        smsType: type,
        creditsAmount: -segments,
        paymentStatus: "completed",
        messageLogId: messageLogId ?? null,
        note: note ?? null,
      },
    });

    return {
      success: true,
      remainingBalance: type === "masking" ? maskingBalance : nonMaskingBalance,
    };
  });

  if (result.success) {
    revalidateSmsCredits(userId);
  }
  return result;
}

export type SmsCreditGrantType = "signup_bonus" | "gift" | "manual_adjustment";

async function applyBalanceChange(
  db: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: string,
  creditsAmount: number,
  smsType: SmsType
) {
  const type = parseSmsType(smsType);
  const existing = await db.smsCreditBalance.findUnique({ where: { userId } });
  let maskingBalance = existing?.maskingBalance ?? 0;
  let nonMaskingBalance = existing?.nonMaskingBalance ?? existing?.balance ?? 0;
  let totalPurchasedMasking = existing?.totalPurchasedMasking ?? 0;
  let totalPurchasedNonMasking = existing?.totalPurchasedNonMasking ?? 0;

  if (creditsAmount > 0) {
    if (type === "masking") {
      maskingBalance += creditsAmount;
      totalPurchasedMasking += creditsAmount;
    } else {
      nonMaskingBalance += creditsAmount;
      totalPurchasedNonMasking += creditsAmount;
    }
  } else {
    const abs = Math.abs(creditsAmount);
    const current = type === "masking" ? maskingBalance : nonMaskingBalance;
    if (current < abs) throw new Error("Insufficient balance for deduction");
    if (type === "masking") maskingBalance -= abs;
    else nonMaskingBalance -= abs;
  }

  const synced = syncLegacyBalanceFields({
    maskingBalance,
    nonMaskingBalance,
    totalPurchasedMasking,
    totalPurchasedNonMasking,
    totalUsedMasking: existing?.totalUsedMasking ?? 0,
    totalUsedNonMasking: existing?.totalUsedNonMasking ?? 0,
  });

  await db.smsCreditBalance.upsert({
    where: { userId },
    create: { userId, ...synced },
    update: synced,
  });
}

export async function grantCredits(
  userId: string,
  creditsAmount: number,
  smsType: SmsType,
  transactionType: SmsCreditGrantType,
  note: string,
  processedBy?: string | null
) {
  if (!Number.isFinite(creditsAmount) || creditsAmount === 0) {
    throw new Error("Invalid credit amount");
  }

  await prisma.$transaction(async (db) => {
    await applyBalanceChange(db, userId, creditsAmount, smsType);
    await db.smsCreditTransaction.create({
      data: {
        userId,
        transactionType,
        smsType: parseSmsType(smsType),
        creditsAmount,
        paymentStatus: "completed",
        note,
        processedBy: processedBy ?? null,
      },
    });
  });

  revalidateSmsCredits(userId);
}

export async function applySignupBonus(userId: string): Promise<{
  granted: boolean;
  masking: number;
  nonMasking: number;
}> {
  const settings = await getGlobalSmsSettings();
  if (!settings.signupBonusEnabled) {
    return { granted: false, masking: 0, nonMasking: 0 };
  }

  const existing = await prisma.smsCreditTransaction.findFirst({
    where: { userId, transactionType: "signup_bonus" },
  });
  if (existing) return { granted: false, masking: 0, nonMasking: 0 };

  const masking = settings.maskingEnabled ? Math.max(0, settings.signupBonusMasking ?? 0) : 0;
  const nonMasking = Math.max(0, settings.signupBonusNonMasking ?? 0);
  if (masking === 0 && nonMasking === 0) {
    return { granted: false, masking: 0, nonMasking: 0 };
  }

  await prisma.$transaction(async (db) => {
    if (masking > 0) {
      await applyBalanceChange(db, userId, masking, "masking");
      await db.smsCreditTransaction.create({
        data: {
          userId,
          transactionType: "signup_bonus",
          smsType: "masking",
          creditsAmount: masking,
          paymentStatus: "completed",
          note: "Signup bonus (Masking)",
        },
      });
    }
    if (nonMasking > 0) {
      await applyBalanceChange(db, userId, nonMasking, "non_masking");
      await db.smsCreditTransaction.create({
        data: {
          userId,
          transactionType: "signup_bonus",
          smsType: "non_masking",
          creditsAmount: nonMasking,
          paymentStatus: "completed",
          note: "Signup bonus (Non-Masking)",
        },
      });
    }
  });

  revalidateSmsCredits(userId);
  return { granted: true, masking, nonMasking };
}

export async function adjustCredits(
  userId: string,
  creditsAmount: number,
  note: string,
  adminId: string,
  smsType: SmsType = "non_masking"
) {
  await grantCredits(userId, creditsAmount, smsType, "manual_adjustment", note, adminId);
}

export async function giftCredits(
  userId: string,
  creditsAmount: number,
  smsType: SmsType,
  reason: string,
  adminId: string
) {
  if (creditsAmount <= 0) throw new Error("Gift amount must be positive");

  const settings = await getGlobalSmsSettings();
  if (smsType === "masking" && !settings.maskingEnabled) {
    throw new Error("Masking SMS সার্ভিস বর্তমানে বন্ধ আছে");
  }

  await grantCredits(userId, creditsAmount, smsType, "gift", reason, adminId);
}

export async function getApprovedSenderId(userId: string): Promise<string | null> {
  const req = await prisma.smsSenderIdRequest.findUnique({ where: { userId } });
  if (!req || req.status !== "approved") return null;
  return req.senderId;
}

export async function getAdminOverview() {
  const [settings, purchases, pending, activeUsers, maskingPurchases, nonMaskingPurchases] =
    await Promise.all([
      getGlobalSmsSettings(),
      prisma.smsCreditTransaction.aggregate({
        where: { transactionType: "purchase", paymentStatus: "completed" },
        _sum: { amountBdt: true, creditsAmount: true },
      }),
      prisma.smsCreditTransaction.count({
        where: { transactionType: "purchase", paymentStatus: "pending" },
      }),
      prisma.smsCreditBalance.count({
        where: {
          OR: [{ maskingBalance: { gt: 0 } }, { nonMaskingBalance: { gt: 0 } }, { balance: { gt: 0 } }],
        },
      }),
      prisma.smsCreditTransaction.aggregate({
        where: {
          transactionType: "purchase",
          paymentStatus: "completed",
          smsType: "masking",
        },
        _sum: { amountBdt: true, creditsAmount: true },
      }),
      prisma.smsCreditTransaction.aggregate({
        where: {
          transactionType: "purchase",
          paymentStatus: "completed",
          smsType: "non_masking",
        },
        _sum: { amountBdt: true, creditsAmount: true },
      }),
    ]);

  return {
    totalRevenue: purchases._sum.amountBdt ?? 0,
    totalSmsSold: purchases._sum.creditsAmount ?? 0,
    maskingRevenue: maskingPurchases._sum.amountBdt ?? 0,
    maskingSmsSold: maskingPurchases._sum.creditsAmount ?? 0,
    nonMaskingRevenue: nonMaskingPurchases._sum.amountBdt ?? 0,
    nonMaskingSmsSold: nonMaskingPurchases._sum.creditsAmount ?? 0,
    activeUsers,
    pendingPayments: pending,
    isSmsServiceActive: settings.isSmsServiceActive,
    pricePerSms: settings.pricePerSms,
    pricePerSmsMasking: getPriceForType(settings, "masking"),
    pricePerSmsNonMasking: getPriceForType(settings, "non_masking"),
    maskingEnabled: settings.maskingEnabled,
    nonMaskingEnabled: settings.nonMaskingEnabled,
  };
}
