import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BADGES, getLevelFromXp, getNextLevelXp } from "@/lib/badges";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const [user, earnedRows, shop] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { streak: true, xpPoints: true, level: true, totalOrders: true },
    }),
    prisma.userBadge.findMany({
      where: { userId },
      select: { badgeKey: true, earnedAt: true },
      orderBy: { earnedAt: "desc" },
    }),
    prisma.shop.findUnique({ where: { userId }, select: { id: true, category: true } }),
  ]);

  const xp = user?.xpPoints ?? 0;
  const streak = user?.streak ?? 0;
  const level = getLevelFromXp(xp);
  const nextLevelXp = getNextLevelXp(xp);
  const earnedKeys = new Set(earnedRows.map(r => r.badgeKey));

  const earnedBadges = earnedRows.map(r => {
    const meta = BADGES.find(b => b.key === r.badgeKey);
    return {
      key: r.badgeKey,
      title: meta?.title ?? r.badgeKey,
      desc: meta?.desc ?? "",
      icon: meta?.icon ?? "🏅",
      xp: meta?.xp ?? 0,
      earnedAt: r.earnedAt.toISOString(),
    };
  });

  const allBadges = BADGES.map(b => ({
    key: b.key,
    title: b.title,
    desc: b.desc,
    icon: b.icon,
    xp: b.xp,
    earned: earnedKeys.has(b.key),
    earnedAt: earnedRows.find(r => r.badgeKey === b.key)?.earnedAt.toISOString() ?? null,
  }));

  let weeklyRank: number | null = null;
  const topThree: Array<{ label: string; orders: number }> = [];

  if (shop?.category) {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const peers = await prisma.shop.findMany({
      where: { category: shop.category, userId: { not: null } },
      select: { userId: true, name: true },
      take: 50,
    });

    const peerIds = peers.map((p) => p.userId!).filter(Boolean);
    const orderCounts = peerIds.length
      ? await prisma.order.groupBy({
          by: ["userId"],
          where: { userId: { in: peerIds }, createdAt: { gte: oneWeekAgo } },
          _count: { id: true },
        })
      : [];

    const countByUser = new Map(orderCounts.map((r) => [r.userId, r._count?.id ?? 0]));
    const peerCounts = peers
      .filter((p) => p.userId)
      .map((p) => ({
      name: p.name,
      orders: countByUser.get(p.userId!) ?? 0,
      isMe: p.userId === userId,
    }));

    peerCounts.sort((a, b) => b.orders - a.orders);
    weeklyRank = peerCounts.findIndex((p) => p.isMe) + 1 || null;

    const top = peerCounts.slice(0, 3);
    for (const p of top) {
      const first = p.name?.charAt(0) ?? "ব";
      topThree.push({ label: `${first}. — ${p.orders} অর্ডার`, orders: p.orders });
    }

    if (weeklyRank === 0) weeklyRank = null;
  }

  return NextResponse.json({
    streak,
    xp,
    level,
    nextLevelXp,
    totalOrders: user?.totalOrders ?? 0,
    earnedBadges,
    allBadges,
    weeklyRank,
    topThree,
    category: shop?.category ?? null,
  });
}
