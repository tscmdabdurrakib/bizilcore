import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    rooms,
    todayCheckIns,
    todayCheckOuts,
    activeBookings,
    todayIncome,
    pendingHK,
    recentActivity,
  ] = await Promise.all([
    prisma.room.findMany({
      where: { shopId: shop.id },
      orderBy: [{ floor: "asc" }, { number: "asc" }],
    }),
    prisma.booking.findMany({
      where: {
        shopId: shop.id,
        checkIn: { gte: today, lt: tomorrow },
        status: { in: ["confirmed", "checked_in"] },
      },
      include: { room: true },
      orderBy: { checkIn: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        shopId: shop.id,
        checkOut: { gte: today, lt: tomorrow },
        status: { in: ["checked_in", "checked_out"] },
      },
      include: { room: true },
      orderBy: { checkOut: "asc" },
    }),
    prisma.booking.count({
      where: { shopId: shop.id, status: "checked_in" },
    }),
    prisma.booking.aggregate({
      where: {
        shopId: shop.id,
        OR: [
          { checkedInAt: { gte: today, lt: tomorrow } },
          { checkedOutAt: { gte: today, lt: tomorrow } },
        ],
      },
      _sum: { advancePaid: true },
    }),
    prisma.housekeepingLog.count({
      where: { shopId: shop.id, status: { in: ["pending", "in_progress"] } },
    }),
    prisma.activityLog.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const total = rooms.length;
  const occupied = rooms.filter(r => r.status === "occupied").length;
  const vacant = rooms.filter(r => r.status === "vacant").length;
  const reserved = rooms.filter(r => r.status === "reserved").length;
  const cleaning = rooms.filter(r => r.status === "cleaning").length;
  const maintenance = rooms.filter(r => r.status === "maintenance").length;

  return NextResponse.json({
    counts: {
      totalRooms: total,
      occupied,
      vacant,
      reserved,
      cleaning,
      maintenance,
      activeBookings,
      todayCheckIns: todayCheckIns.length,
      todayCheckOuts: todayCheckOuts.length,
      pendingHousekeeping: pendingHK,
    },
    occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
    todayIncome: todayIncome._sum.advancePaid ?? 0,
    rooms,
    todayCheckIns,
    todayCheckOuts,
    recentActivity,
  });
}
