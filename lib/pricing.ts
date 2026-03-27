import { prisma } from "@/lib/prisma";

const FALLBACK: Record<string, number> = { pro: 199, business: 699 };
const DURATION_DISCOUNT: Record<number, number> = { 1: 1.0, 3: 0.95, 6: 0.90 };

export async function getPlanAmount(plan: string, months: number): Promise<number> {
  try {
    const config = await prisma.pricingConfig.findUnique({ where: { planKey: plan } });
    const base = config?.monthlyPrice ?? FALLBACK[plan] ?? 0;
    const discounted = config?.discountEnabled && config.discountPercent > 0
      ? Math.round(base * (1 - config.discountPercent / 100))
      : base;
    const durationMult = DURATION_DISCOUNT[months] ?? 1.0;
    return Math.round(discounted * months * durationMult);
  } catch {
    const base = FALLBACK[plan] ?? 0;
    return Math.round(base * months * (DURATION_DISCOUNT[months] ?? 1));
  }
}

export async function isValidPaidPlan(plan: string): Promise<boolean> {
  try {
    const config = await prisma.pricingConfig.findUnique({ where: { planKey: plan } });
    return config ? config.monthlyPrice > 0 : plan in FALLBACK;
  } catch {
    return plan in FALLBACK;
  }
}
