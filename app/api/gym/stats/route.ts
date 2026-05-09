import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "No shop" }, { status: 404 });

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const next7 = new Date(now); next7.setDate(next7.getDate() + 7);

  const [activeMembers, todayAttendance, monthRevenue, expiringMembers, todayCheckIns] = await Promise.all([
    prisma.member.count({ where: { shopId: shop.id, status: "active" } }),
    prisma.gymAttendance.count({ where: { shopId: shop.id, checkIn: { gte: todayStart, lte: todayEnd } } }),
    prisma.memberPayment.aggregate({ where: { shopId: shop.id, paidAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.member.findMany({
      where: { shopId: shop.id, status: "active", membershipEnd: { gte: now, lte: next7 } },
      select: { id: true, memberId: true, name: true, phone: true, membershipEnd: true, plan: { select: { name: true } } },
      orderBy: { membershipEnd: "asc" },
    }),
    prisma.gymAttendance.findMany({
      where: { shopId: shop.id, checkIn: { gte: todayStart, lte: todayEnd }, checkOut: null },
      include: { member: { select: { name: true, memberId: true } } },
      orderBy: { checkIn: "desc" },
    }),
  ]);

  // Monthly revenue last 6 months
  const monthlyRevenue: Array<{ month: string; amount: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const agg = await prisma.memberPayment.aggregate({
      where: { shopId: shop.id, paidAt: { gte: d, lt: end } },
      _sum: { amount: true },
    });
    monthlyRevenue.push({ month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, amount: agg._sum.amount ?? 0 });
  }

  return NextResponse.json({
    activeMembers,
    todayAttendance,
    monthRevenue: monthRevenue._sum.amount ?? 0,
    expiringCount: expiringMembers.length,
    expiringMembers,
    todayCheckIns,
    monthlyRevenue,
  });
}
