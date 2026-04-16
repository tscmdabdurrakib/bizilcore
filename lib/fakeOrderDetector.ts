import { prisma } from "@/lib/prisma";

export type RiskLevel = "safe" | "low" | "medium" | "high" | "blocked";
export type RiskAction = "allow" | "warn" | "block";

export interface RiskResult {
  riskScore: number;
  riskLevel: RiskLevel;
  flags: string[];
  action: RiskAction;
  blockReason?: string;
}

const BD_PHONE_REGEX = /^(?:\+?880|0)?1[3-9]\d{8}$/;

function normalizeBDPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-().]/g, "");
  if (cleaned.startsWith("+880")) return "0" + cleaned.slice(4);
  if (cleaned.startsWith("880") && cleaned.length === 13) return "0" + cleaned.slice(3);
  return cleaned;
}

function isValidBDPhone(phone: string): boolean {
  const normalized = normalizeBDPhone(phone);
  return BD_PHONE_REGEX.test(normalized);
}

function isSequentialOrRepeated(phone: string): boolean {
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (digits.length < 8) return false;
  const allSame = /^(\d)\1+$/.test(digits);
  if (allSame) return true;
  const ascending = digits.split("").every((d, i, arr) => i === 0 || parseInt(d) === parseInt(arr[i - 1]) + 1);
  const descending = digits.split("").every((d, i, arr) => i === 0 || parseInt(d) === parseInt(arr[i - 1]) - 1);
  return ascending || descending;
}

const SUSPICIOUS_NAME_PATTERNS = [
  /^(test|টেস্ট|demo|ডেমো|fake|ফেক|dummy|abc|xyz|asdf|aaa|bbb|xxx|yyy|zzz)$/i,
  /^\d+$/,
  /^[a-z]{1,2}$/i,
];

const SUSPICIOUS_ADDRESS_PATTERNS = [
  /^(test|টেস্ট|demo|ডেমো|fake|ফেক|dummy|n\/a|na|none|nothing|no address)$/i,
  /^\d{1,3}$/,
  /^[a-z]{1,3}$/i,
];

function checkSuspiciousName(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 2) return true;
  return SUSPICIOUS_NAME_PATTERNS.some(p => p.test(trimmed));
}

function checkSuspiciousAddress(address: string): boolean {
  const trimmed = address.trim();
  if (trimmed.length < 4) return true;
  return SUSPICIOUS_ADDRESS_PATTERNS.some(p => p.test(trimmed));
}

export async function detectFakeOrder(params: {
  shopId: string;
  phone: string;
  customerName?: string;
  customerAddress?: string;
  ip?: string;
}): Promise<RiskResult> {
  const { shopId, phone, customerName, customerAddress, ip } = params;
  const flags: string[] = [];
  let score = 0;

  const normalizedPhone = normalizeBDPhone(phone.trim());

  if (!isValidBDPhone(phone)) {
    flags.push("অবৈধ বাংলাদেশি ফোন নম্বর");
    score += 40;
  } else if (isSequentialOrRepeated(normalizedPhone)) {
    flags.push("সিকোয়েন্শিয়াল বা পুনরাবৃত্তি নম্বর");
    score += 30;
  }

  const [blacklisted, recentOrders, crossStoreShops, cancelledOrders] = await Promise.all([
    prisma.phoneBlacklist.findFirst({
      where: { shopId, phone: normalizedPhone },
      select: { id: true, reason: true },
    }),
    prisma.order.count({
      where: {
        customer: { phone: { contains: normalizedPhone.slice(-10) } },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.fakeOrderReport.groupBy({
      by: ["shopId"],
      where: { phone: normalizedPhone },
    }),
    prisma.order.count({
      where: {
        customer: { phone: { contains: normalizedPhone.slice(-10) } },
        status: "cancelled",
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  if (blacklisted) {
    return {
      riskScore: 100,
      riskLevel: "blocked",
      flags: [`ব্ল্যাকলিস্টে আছে${blacklisted.reason ? `: ${blacklisted.reason}` : ""}`],
      action: "block",
      blockReason: blacklisted.reason ?? "ব্ল্যাকলিস্টে যুক্ত",
    };
  }

  const distinctShopCount = crossStoreShops.length;
  if (distinctShopCount >= 3) {
    flags.push(`${distinctShopCount}টি আলাদা দোকানে ফেক অর্ডারের রিপোর্ট`);
    score += 50;
  } else if (distinctShopCount >= 1) {
    flags.push(`${distinctShopCount}টি দোকানে ফেক অর্ডারের রিপোর্ট`);
    score += 25;
  }

  if (recentOrders >= 5) {
    flags.push(`২৪ ঘণ্টায় ${recentOrders}টি অর্ডার (অস্বাভাবিক বেশি)`);
    score += 30;
  } else if (recentOrders >= 3) {
    flags.push(`২৪ ঘণ্টায় ${recentOrders}টি অর্ডার`);
    score += 15;
  }

  if (cancelledOrders >= 3) {
    flags.push(`গত ৩০ দিনে ${cancelledOrders}টি বাতিল অর্ডার`);
    score += cancelledOrders >= 5 ? 30 : 20;
  }

  if (ip && ip !== "unknown") {
    const recentOrdersFromIp = await prisma.storeOrder.count({
      where: { shopId, ipAddress: ip, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });
    if (recentOrdersFromIp >= 5) {
      flags.push(`একই IP থেকে ${recentOrdersFromIp}টি অর্ডার (২৪ ঘণ্টায়)`);
      score += 25;
    } else if (recentOrdersFromIp >= 3) {
      flags.push(`একই IP থেকে ${recentOrdersFromIp}টি অর্ডার`);
      score += 10;
    }
  }

  if (customerName && checkSuspiciousName(customerName)) {
    flags.push("সন্দেহজনক নাম");
    score += 20;
  }

  if (customerAddress && checkSuspiciousAddress(customerAddress)) {
    flags.push("সন্দেহজনক ঠিকানা");
    score += 15;
  }

  const clampedScore = Math.min(100, score);

  let riskLevel: RiskLevel;
  let action: RiskAction;

  if (clampedScore >= 80 || distinctShopCount >= 3) {
    riskLevel = "high";
    action = "block";
  } else if (clampedScore >= 50) {
    riskLevel = "medium";
    action = "warn";
  } else if (clampedScore >= 20) {
    riskLevel = "low";
    action = "warn";
  } else {
    riskLevel = "safe";
    action = "allow";
  }

  return {
    riskScore: clampedScore,
    riskLevel,
    flags,
    action,
    blockReason: action === "block" ? (flags[0] ?? "উচ্চ-ঝুঁকির নম্বর") : undefined,
  };
}
