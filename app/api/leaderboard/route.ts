import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get current user's shop category
  const shop = await prisma.shop.findUnique({
    where: { userId: session.user.id },
    select: { id: true, category: true },
  });

  // This week: Monday 00:00 to now
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diffToMon = (day === 0 ? -6 : 1 - day);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + diffToMon);
  weekStart.setHours(0, 0, 0, 0);

  const category = shop?.category ?? null;

  // Find all shops in the same category (or all if no category)
  const shopsInCategory = await prisma.shop.findMany({
    where: category ? { category } : {},
    select: { userId: true },
  });

  const userIds = shopsInCategory.map(s => s.userId);

  // Aggregate this week's revenue per user (confirmed/shipped/delivered orders)
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

  // Build ranked list (anonymous)
  const ranked = weekOrders.map((row, i) => ({
    rank: i + 1,
    isMe: row.userId === session.user.id,
    revenue: row._sum.totalAmount ?? 0,
    orders: row._count.id,
    // Anonymize: show first 2 chars of userId scrambled as a stable nickname
    label: row.userId === session.user.id ? "আপনি" : `বিক্রেতা #${i + 1}`,
  }));

  const myEntry = ranked.find(r => r.isMe);
  const myRank = myEntry?.rank ?? ranked.length + 1;
  const myRevenue = myEntry?.revenue ?? 0;

  return NextResponse.json({
    category: category ?? "সব",
    weekStart: weekStart.toISOString(),
    myRank,
    totalSellers: userIds.length,
    myRevenue,
    top5: ranked.slice(0, 5),
  });
}
