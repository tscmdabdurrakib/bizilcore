import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const next14 = new Date(today); next14.setDate(today.getDate() + 14);

  const [monthEvents, todayEvents, advanceAgg, dueAgg, upcomingEvents, halls] = await Promise.all([
    prisma.hallEvent.count({
      where: { shopId: shop.id, eventDate: { gte: monthStart }, status: { not: "cancelled" } },
    }),
    prisma.hallEvent.count({
      where: { shopId: shop.id, eventDate: { gte: today, lt: tomorrow }, status: { not: "cancelled" } },
    }),
    prisma.hallEvent.aggregate({
      where: { shopId: shop.id, status: { not: "cancelled" } },
      _sum: { advancePaid: true },
    }),
    prisma.hallEvent.aggregate({
      where: { shopId: shop.id, status: { not: "cancelled" } },
      _sum: { dueAmount: true },
    }),
    prisma.hallEvent.findMany({
      where: {
        shopId: shop.id,
        eventDate: { gte: today, lte: next14 },
        status: { not: "cancelled" },
      },
      include: { hall: { select: { name: true } } },
      orderBy: { eventDate: "asc" },
    }),
    prisma.hall.findMany({
      where: { shopId: shop.id, isActive: true },
      include: {
        events: {
          where: {
            shopId: shop.id,
            eventDate: { gte: monthStart },
            status: { not: "cancelled" },
          },
          select: { eventDate: true },
        },
      },
    }),
  ]);

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const hallUtilization = halls.map((h) => {
    const bookedDays = new Set(h.events.map((e) => e.eventDate.toISOString().split("T")[0])).size;
    return {
      id: h.id,
      name: h.name,
      bookedDays,
      totalDays: daysInMonth,
      pct: Math.round((bookedDays / daysInMonth) * 100),
    };
  });

  return NextResponse.json({
    monthEvents,
    todayEvents,
    totalAdvance: advanceAgg._sum.advancePaid ?? 0,
    totalDue: dueAgg._sum.dueAmount ?? 0,
    upcomingEvents,
    hallUtilization,
  });
}
