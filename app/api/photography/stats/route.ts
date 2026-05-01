import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { shop } = await requireShop();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const [monthBookings, upcomingShoots, editingBookings, monthRevenue] = await Promise.all([
      prisma.photoBooking.count({
        where: {
          shopId: shop.id,
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          status: { not: "cancelled" },
        },
      }),
      prisma.photoBooking.count({
        where: {
          shopId: shop.id,
          eventDate: { gte: now, lte: sevenDaysLater },
          status: { notIn: ["cancelled", "delivered"] },
        },
      }),
      prisma.photoBooking.count({
        where: {
          shopId: shop.id,
          shootingDone: true,
          status: "editing",
        },
      }),
      prisma.photoBooking.aggregate({
        where: {
          shopId: shop.id,
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          status: { not: "cancelled" },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const upcomingList = await prisma.photoBooking.findMany({
      where: {
        shopId: shop.id,
        eventDate: { gte: now, lte: sevenDaysLater },
        status: { notIn: ["cancelled", "delivered"] },
      },
      orderBy: { eventDate: "asc" },
      include: {
        team: true,
        package: { select: { name: true } },
      },
    });

    const editingList = await prisma.photoBooking.findMany({
      where: {
        shopId: shop.id,
        shootingDone: true,
        status: "editing",
      },
      orderBy: { eventDate: "asc" },
      include: {
        package: { select: { editingDays: true } },
      },
    });

    return NextResponse.json({
      monthBookings,
      upcomingShoots,
      editingBookings,
      monthRevenue: monthRevenue._sum.totalAmount ?? 0,
      upcomingList,
      editingList,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
