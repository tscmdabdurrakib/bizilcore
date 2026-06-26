import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const LEADERBOARD_CACHE_SECONDS = 60;
const MAX_CATEGORY_SHOPS = 200;

async function fetchLeaderboard(userId: string, category: string | null) {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + diffToMon);
  weekStart.setHours(0, 0, 0, 0);

  const shopsInCategory = await prisma.shop.findMany({
    where: category ? { category } : {},
    select: { userId: true },
    take: MAX_CATEGORY_SHOPS,
  });

  const userIds = shopsInCategory.map((s) => s.userId).filter((id): id is string => id != null);
  if (userIds.length === 0) {
    return {
      category: category ?? "সব",
      weekStart: weekStart.toISOString(),
      myRank: 1,
      totalSellers: 0,
      myRevenue: 0,
      top5: [] as Array<{
        rank: number;
        isMe: boolean;
        revenue: number;
        orders: number;
        label: string;
      }>,
    };
  }

  const weekOrders = await prisma.order.groupBy({
    by: ["userId"],
    where: {
      userId: { in: userIds },
      status: { in: ["confirmed", "shipped", "delivered"] },
      createdAt: { gte: weekStart },
    },
    _sum: { totalAmount: true },
    _count: { id: true },
    orderBy: { _sum: { totalAmount: "desc" } },
  });

  const ranked = weekOrders.map((row, i) => ({
    rank: i + 1,
    isMe: row.userId === userId,
    revenue: row._sum?.totalAmount ?? 0,
    orders: row._count?.id ?? 0,
    label: row.userId === userId ? "আপনি" : `বিক্রেতা #${i + 1}`,
  }));

  const myEntry = ranked.find((r) => r.isMe);
  const myRank = myEntry?.rank ?? ranked.length + 1;
  const myRevenue = myEntry?.revenue ?? 0;

  return {
    category: category ?? "সব",
    weekStart: weekStart.toISOString(),
    myRank,
    totalSellers: userIds.length,
    myRevenue,
    top5: ranked.slice(0, 5),
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({
    where: { userId: session.user.id },
    select: { category: true },
  });

  const category = shop?.category ?? null;
  const userId = session.user.id;
  const cacheKey = category ?? "__all__";

  const getCachedLeaderboard = unstable_cache(
    () => fetchLeaderboard(userId, category),
    ["leaderboard", cacheKey, userId],
    { revalidate: LEADERBOARD_CACHE_SECONDS },
  );

  return NextResponse.json(await getCachedLeaderboard());
}
