import { prisma } from "@/lib/prisma";

export async function logActivity({
  shopId,
  userId,
  action,
  detail,
}: {
  shopId: string;
  userId: string;
  action: string;
  detail?: string;
}) {
  try {
    await prisma.activityLog.create({
      data: { shopId, userId, action, detail: detail ?? null },
    });
  } catch {
  }
}
