import { prisma } from "@/lib/prisma";

export type RiskLevel = "safe" | "low" | "medium" | "high" | "blocked";
export type RiskAction = "allow" | "flag" | "block";

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
}): Promise<RiskResult> {
  const { shopId, phone, customerName, customerAddress } = params;
  const flags: string[] = [];
  let score = 0;

  const normalizedPhone = normalizeBDPhone(phone.trim());

  if (!isValidBDPhone(phone)) {
    flags.push("অবৈধ বাংলাদেশি ফোন নম্বর");
    score += 40;
  }

  const [blacklisted, crossStoreReports, recentOrders] = await Promise.all([
    prisma.phoneBlacklist.findFirst({
      where: { shopId, phone: normalizedPhone },
      select: { id: true, reason: true },
    }),
    prisma.fakeOrderReport.count({
      where: { phone: normalizedPhone },
    }),
    prisma.order.count({
      where: {
        customer: { phone: { contains: normalizedPhone.slice(-10) } },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
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

  if (crossStoreReports >= 3) {
    flags.push(`${crossStoreReports}টি দোকানে ফেক অর্ডারের রিপোর্ট`);
    score += 50;
  } else if (crossStoreReports >= 1) {
    flags.push(`${crossStoreReports}টি ফেক অর্ডারের রিপোর্ট`);
    score += 25;
  }

  if (recentOrders >= 5) {
    flags.push(`২৪ ঘণ্টায় ${recentOrders}টি অর্ডার (অস্বাভাবিক বেশি)`);
    score += 30;
  } else if (recentOrders >= 3) {
    flags.push(`২৪ ঘণ্টায় ${recentOrders}টি অর্ডার`);
    score += 15;
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

  if (clampedScore >= 80 || crossStoreReports >= 3) {
    riskLevel = "high";
    action = "block";
  } else if (clampedScore >= 50) {
    riskLevel = "medium";
    action = "flag";
  } else if (clampedScore >= 20) {
    riskLevel = "low";
    action = "flag";
  } else {
    riskLevel = "safe";
    action = "allow";
  }

  return {
    riskScore: clampedScore,
    riskLevel,
    flags,
    action,
    blockReason: action === "block" ? flags[0] : undefined,
  };
}
