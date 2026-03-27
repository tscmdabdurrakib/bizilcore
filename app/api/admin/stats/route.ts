import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [totalUsers, totalShops, totalOrders, totalRevenue, planCounts, recentShops] = await Promise.all([
    prisma.user.count(),
    prisma.shop.count(),
    prisma.order.count(),
    prisma.payment.aggregate({ where: { status: "completed" }, _sum: { amount: true } }),
    prisma.subscription.groupBy({ by: ["plan"], _count: { _all: true } }),
    prisma.shop.findMany({
      orderBy: { id: "desc" },
      take: 20,
      include: {
        user: { select: { id: true, name: true, email: true, createdAt: true, subscription: true } },
        _count: { select: { products: true, customers: true, staffMembers: true } },
      },
    }),
  ]);

  return NextResponse.json({
    totalUsers,
    totalShops,
    totalOrders,
    totalRevenue: totalRevenue._sum.amount ?? 0,
    planCounts,
    recentShops,
  });
}
