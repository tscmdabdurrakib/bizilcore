import { prisma } from "@/lib/prisma";

export async function requireTaskPlan(userId: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  return sub?.plan === "pro" || sub?.plan === "business";
}
