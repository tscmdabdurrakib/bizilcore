import { prisma } from "@/lib/prisma";

const LIMITS: Record<string, number> = { free: 10, pro: 100, business: 999999 };

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export async function getAIUsageCount(userId: string): Promise<number> {
  return prisma.aiUsage.count({ where: { userId, date: today() } });
}

export async function checkAILimit(userId: string, userPlan: string): Promise<{ allowed: boolean; remaining?: number; message?: string }> {
  const count = await getAIUsageCount(userId);
  const limit = LIMITS[userPlan] ?? 10;

  if (count >= limit) {
    const messages: Record<string, string> = {
      free: `আজকের বিনামূল্যে AI ব্যবহারের সীমা (${limit}টি) শেষ। আরও ব্যবহার করতে Pro তে আপগ্রেড করুন।`,
      pro:  `আজকের AI ব্যবহারের সীমা (${limit}টি) শেষ। আগামীকাল আবার চেষ্টা করুন।`,
      business: "",
    };
    return { allowed: false, message: messages[userPlan] ?? messages.free };
  }

  return { allowed: true, remaining: limit - count };
}

export async function logAIUsage(userId: string, feature: string, model: string): Promise<void> {
  await prisma.aiUsage.create({ data: { userId, feature, model, date: today() } });
}

export async function getAIUsageStats(userId: string, userPlan: string) {
  const count = await getAIUsageCount(userId);
  const limit = LIMITS[userPlan] ?? 10;
  return { used: count, limit, remaining: Math.max(0, limit - count) };
}
