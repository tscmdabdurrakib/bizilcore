import { prisma } from "@/lib/prisma";
import { ACTION_TO_FEATURE, type ActionType } from "@/lib/activity/types";

export async function incrementFeatureUsage(
  shopId: string,
  actionType: ActionType | string,
): Promise<void> {
  const featureName = ACTION_TO_FEATURE[actionType as ActionType];
  if (!featureName) return;

  const monthYear = new Date().toISOString().slice(0, 7);

  await prisma.featureUsageStat.upsert({
    where: {
      shopId_featureName_monthYear: { shopId, featureName, monthYear },
    },
    create: {
      shopId,
      featureName,
      monthYear,
      usageCount: 1,
      lastUsedAt: new Date(),
    },
    update: {
      usageCount: { increment: 1 },
      lastUsedAt: new Date(),
    },
  });
}
