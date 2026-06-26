import { prisma } from "@/lib/prisma";

export function formatActivityLog(log: {
  id: string;
  userId: string;
  shopId: string | null;
  actionType: string;
  actionLabel: string | null;
  pagePath: string | null;
  metadata: unknown;
  durationSeconds: number | null;
  createdAt: Date;
  user?: { id: string; name: string; email: string } | null;
  shop?: { id: string; name: string } | null;
}) {
  return {
    id: log.id,
    userId: log.userId,
    shopId: log.shopId,
    actionType: log.actionType,
    actionLabel: log.actionLabel,
    pagePath: log.pagePath,
    metadata: log.metadata,
    durationSeconds: log.durationSeconds,
    createdAt: log.createdAt.toISOString(),
    user: log.user ?? null,
    shop: log.shop ?? null,
  };
}

export const activityInclude = {
  user: { select: { id: true, name: true, email: true } },
  shop: { select: { id: true, name: true } },
} as const;

export async function fetchRecentLogs(limit = 50, since?: Date) {
  return prisma.userActivityLog.findMany({
    where: since ? { createdAt: { gt: since } } : undefined,
    include: activityInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfWeek() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}
