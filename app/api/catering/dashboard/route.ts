import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const in7Days    = new Date(now); in7Days.setDate(now.getDate() + 7);
  const in3Days    = new Date(now); in3Days.setDate(now.getDate() + 3);
  const weekStart  = new Date(now); weekStart.setDate(now.getDate());
  const weekEnd    = new Date(now); weekEnd.setDate(now.getDate() + 7);

  const [
    monthEvents,
    upcomingCount,
    pendingDue,
    monthProfit,
    upcomingEvents,
    nextWeekEvents,
  ] = await Promise.all([
    prisma.cateringEvent.count({
      where: { shopId: shop.id, eventDate: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.cateringEvent.count({
      where: { shopId: shop.id, eventDate: { gte: now, lte: in7Days }, status: { not: "cancelled" } },
    }),
    prisma.cateringEvent.aggregate({
      where: { shopId: shop.id, status: { notIn: ["cancelled", "completed"] } },
      _sum: { dueAmount: true },
    }),
    prisma.cateringEvent.aggregate({
      where: { shopId: shop.id, status: "completed", eventDate: { gte: monthStart, lte: monthEnd } },
      _sum: { profit: true },
    }),
    prisma.cateringEvent.findMany({
      where: { shopId: shop.id, eventDate: { gte: now, lte: in7Days }, status: { not: "cancelled" } },
      orderBy: { eventDate: "asc" },
      take: 10,
      select: {
        id: true, bookingNumber: true, clientName: true, clientPhone: true,
        eventType: true, eventDate: true, eventTime: true, venue: true,
        guestCount: true, status: true, totalAmount: true, dueAmount: true, staffNeeded: true,
      },
    }),
    prisma.cateringEvent.findMany({
      where: { shopId: shop.id, eventDate: { gte: weekStart, lte: weekEnd }, status: { not: "cancelled" } },
      select: { staffNeeded: true },
    }),
  ]);

  const totalStaffNeeded = nextWeekEvents.reduce((s, e) => s + (e.staffNeeded ?? 0), 0);
  const needsPreparation = upcomingEvents.filter(e => new Date(e.eventDate) <= in3Days);

  return NextResponse.json({
    monthEvents,
    upcomingCount,
    pendingDue: pendingDue._sum.dueAmount ?? 0,
    monthProfit: monthProfit._sum.profit ?? 0,
    upcomingEvents,
    nextWeekEventCount: nextWeekEvents.length,
    totalStaffNeeded,
    preparationAlerts: needsPreparation.length,
  });
}
