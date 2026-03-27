import { prisma } from "@/lib/prisma";

const BADGE_RULES: Record<string, (userId: string) => Promise<boolean>> = {
  first_sale: async (userId) => {
    const count = await prisma.order.count({ where: { userId } });
    return count >= 1;
  },
  orders_10: async (userId) => {
    const count = await prisma.order.count({ where: { userId } });
    return count >= 10;
  },
  orders_100: async (userId) => {
    const count = await prisma.order.count({ where: { userId } });
    return count >= 100;
  },
  orders_500: async (userId) => {
    const count = await prisma.order.count({ where: { userId } });
    return count >= 500;
  },
  streak_7: async (userId) => {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { streak: true } });
    return (user?.streak ?? 0) >= 7;
  },
  streak_30: async (userId) => {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { streak: true } });
    return (user?.streak ?? 0) >= 30;
  },
  revenue_1lakh: async (userId) => {
    const result = await prisma.order.aggregate({
      where: { userId, status: "delivered" },
      _sum: { totalAmount: true },
    });
    return (result._sum.totalAmount ?? 0) >= 100000;
  },
  team_leader: async (userId) => {
    const shop = await prisma.shop.findUnique({ where: { userId }, select: { id: true } });
    if (!shop) return false;
    const staffCount = await prisma.staffMember.count({ where: { shopId: shop.id } });
    return staffCount >= 1;
  },
};

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { badges: true } });
    const currentBadges = user?.badges ?? [];
    const newBadges: string[] = [];

    for (const [badgeId, check] of Object.entries(BADGE_RULES)) {
      if (currentBadges.includes(badgeId)) continue;
      const earned = await check(userId);
      if (earned) newBadges.push(badgeId);
    }

    if (newBadges.length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { badges: { push: newBadges } },
      });
    }

    return newBadges;
  } catch {
    return [];
  }
}

export async function updateLoginStreak(userId: string): Promise<void> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { streak: true, lastLoginDate: true } });

    const lastDate = user?.lastLoginDate;
    if (lastDate === today) return;

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const newStreak = lastDate === yesterday ? (user?.streak ?? 0) + 1 : 1;

    await prisma.user.update({ where: { id: userId }, data: { streak: newStreak, lastLoginDate: today } });
    await checkAndAwardBadges(userId);
  } catch {
  }
}
