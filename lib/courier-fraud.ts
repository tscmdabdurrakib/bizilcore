import { prisma } from "@/lib/prisma";

export interface PhoneRisk {
  phone: string;
  score: number; // 0-100, higher = riskier
  level: "green" | "amber" | "red" | "unknown";
  deliveredCount: number;
  returnedCount: number;
  totalCount: number;
  successRate: number; // 0-1 over completed COD orders
  source: string;
  label: string; // human-friendly Bangla summary
  checkedAt: string;
}

const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12h

export function normalizePhone(raw: string): string {
  const digits = (raw || "").replace(/[^0-9]/g, "");
  // Normalize to local 11-digit (01XXXXXXXXX) where possible.
  if (digits.startsWith("880")) return "0" + digits.slice(3);
  if (digits.startsWith("88")) return digits.slice(2);
  return digits;
}

function classify(deliveredCount: number, returnedCount: number): {
  score: number;
  level: PhoneRisk["level"];
  successRate: number;
} {
  const total = deliveredCount + returnedCount;
  if (total === 0) return { score: 0, level: "unknown", successRate: 0 };
  const successRate = deliveredCount / total;
  const score = Math.round((1 - successRate) * 100);
  let level: PhoneRisk["level"];
  // Need at least 2 completed orders before flagging red to avoid noise.
  if (score >= 60 && total >= 2) level = "red";
  else if (score >= 30) level = "amber";
  else level = "green";
  return { score, level, successRate };
}

function buildLabel(r: { level: PhoneRisk["level"]; deliveredCount: number; returnedCount: number; totalCount: number }): string {
  if (r.level === "unknown" || r.totalCount === 0) return "নতুন কাস্টমার — ইতিহাস নেই";
  const pct = Math.round((r.deliveredCount / Math.max(1, r.totalCount)) * 100);
  if (r.level === "red") return `ঝুঁকিপূর্ণ — ${r.returnedCount}টি রিটার্ন (সফল ${pct}%)`;
  if (r.level === "amber") return `সতর্কতা — ${r.returnedCount}টি রিটার্ন (সফল ${pct}%)`;
  return `নির্ভরযোগ্য — সফল ডেলিভারি ${pct}%`;
}

/**
 * Compute delivery risk for a phone from the shop's own COD order history.
 * Results are cached in CustomerRiskCache for CACHE_TTL_MS.
 */
export async function getPhoneRisk(
  shopId: string,
  rawPhone: string,
  opts?: { force?: boolean },
): Promise<PhoneRisk> {
  const phone = normalizePhone(rawPhone);
  if (!phone || phone.length < 6) {
    return {
      phone,
      score: 0,
      level: "unknown",
      deliveredCount: 0,
      returnedCount: 0,
      totalCount: 0,
      successRate: 0,
      source: "internal",
      label: "ফোন নম্বর নেই",
      checkedAt: new Date().toISOString(),
    };
  }

  if (!opts?.force) {
    const cached = await prisma.customerRiskCache.findUnique({
      where: { shopId_phone: { shopId, phone } },
    });
    if (cached && Date.now() - cached.checkedAt.getTime() < CACHE_TTL_MS) {
      const { level, successRate } = classify(cached.deliveredCount, cached.returnedCount);
      return {
        phone,
        score: cached.score,
        level: (cached.level as PhoneRisk["level"]) ?? level,
        deliveredCount: cached.deliveredCount,
        returnedCount: cached.returnedCount,
        totalCount: cached.totalCount,
        successRate,
        source: cached.source,
        label: buildLabel({ level: cached.level as PhoneRisk["level"], deliveredCount: cached.deliveredCount, returnedCount: cached.returnedCount, totalCount: cached.totalCount }),
        checkedAt: cached.checkedAt.toISOString(),
      };
    }
  }

  // Match by both normalized variants in case stored numbers differ slightly.
  const intl = phone.startsWith("0") ? "88" + phone : phone;
  const orders = await prisma.order.findMany({
    where: {
      customer: {
        shopId,
        OR: [{ phone }, { phone: intl }, { phone: phone.replace(/^0/, "") }],
      },
    },
    select: { status: true, courierStatus: true, codStatus: true },
  });

  let deliveredCount = 0;
  let returnedCount = 0;
  for (const o of orders) {
    const delivered =
      o.status === "delivered" || o.courierStatus === "delivered" || o.codStatus === "collected";
    const returned =
      o.courierStatus === "returned" || o.codStatus === "returned" || o.status === "cancelled";
    if (returned) returnedCount++;
    else if (delivered) deliveredCount++;
  }
  const totalCount = deliveredCount + returnedCount;
  const { score, level, successRate } = classify(deliveredCount, returnedCount);

  const result: PhoneRisk = {
    phone,
    score,
    level,
    deliveredCount,
    returnedCount,
    totalCount,
    successRate,
    source: "internal",
    label: buildLabel({ level, deliveredCount, returnedCount, totalCount }),
    checkedAt: new Date().toISOString(),
  };

  // Cache (best-effort; ignore write failures so risk read never breaks UX).
  try {
    await prisma.customerRiskCache.upsert({
      where: { shopId_phone: { shopId, phone } },
      create: {
        shopId,
        phone,
        score,
        level: level === "unknown" ? "green" : level,
        deliveredCount,
        returnedCount,
        totalCount,
        source: "internal",
      },
      update: {
        score,
        level: level === "unknown" ? "green" : level,
        deliveredCount,
        returnedCount,
        totalCount,
        source: "internal",
        checkedAt: new Date(),
      },
    });
  } catch {
    /* cache write is non-critical */
  }

  return result;
}
