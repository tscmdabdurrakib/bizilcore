import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { shop } = await requireShop();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const next14Days = new Date(now);
    next14Days.setDate(now.getDate() + 14);
    const next7Days = new Date(now);
    next7Days.setDate(now.getDate() + 7);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      monthBookings,
      upcomingCount,
      totalDue,
      monthProfit,
      upcoming,
      bookingTypeCounts,
    ] = await Promise.all([
      prisma.tourBooking.count({
        where: { shopId: shop.id, createdAt: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.tourBooking.count({
        where: {
          shopId: shop.id,
          travelDate: { gte: now, lte: next7Days },
          status: { not: "cancelled" },
        },
      }),
      prisma.tourBooking.aggregate({
        where: { shopId: shop.id, status: { not: "cancelled" } },
        _sum: { dueAmount: true },
      }),
      prisma.tourBooking.aggregate({
        where: {
          shopId: shop.id,
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { not: "cancelled" },
        },
        _sum: { profit: true },
      }),
      prisma.tourBooking.findMany({
        where: {
          shopId: shop.id,
          travelDate: { gte: now, lte: next14Days },
          status: { not: "cancelled" },
        },
        orderBy: { travelDate: "asc" },
        take: 10,
        select: {
          id: true,
          bookingNumber: true,
          clientName: true,
          destination: true,
          travelDate: true,
          totalPersons: true,
          dueAmount: true,
        },
      }),
      prisma.tourBooking.groupBy({
        by: ["bookingType"],
        where: { shopId: shop.id, status: { not: "cancelled" } },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      monthBookings,
      upcomingCount,
      totalDue: totalDue._sum.dueAmount ?? 0,
      monthProfit: monthProfit._sum.profit ?? 0,
      upcoming,
      bookingTypeCounts,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
