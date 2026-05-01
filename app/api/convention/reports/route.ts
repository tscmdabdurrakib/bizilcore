import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);

  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  const events = await prisma.hallEvent.findMany({
    where: {
      shopId: shop.id,
      eventDate: { gte: yearStart, lt: yearEnd },
      status: { not: "cancelled" },
    },
    include: { hall: { select: { name: true } } },
    orderBy: { eventDate: "asc" },
  });

  const halls = await prisma.hall.findMany({ where: { shopId: shop.id, isActive: true } });

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthEvents = events.filter((e) => e.eventDate.getMonth() === i);
    return {
      month: i + 1,
      count: monthEvents.length,
      revenue: monthEvents.reduce((s, e) => s + e.totalAmount, 0),
      collected: monthEvents.reduce((s, e) => s + e.advancePaid, 0),
    };
  });

  const eventTypeCounts: Record<string, number> = {};
  for (const e of events) {
    eventTypeCounts[e.eventType] = (eventTypeCounts[e.eventType] ?? 0) + 1;
  }

  const daysInYear = 365;
  const hallUtilization = halls.map((h) => {
    const hallEvents = events.filter((e) => e.hallId === h.id);
    const bookedDays = new Set(hallEvents.map((e) => e.eventDate.toISOString().split("T")[0])).size;
    return {
      hallName: h.name,
      bookedDays,
      pct: Math.round((bookedDays / daysInYear) * 100),
      revenue: hallEvents.reduce((s, e) => s + e.totalAmount, 0),
    };
  });

  const avgBookingValue = events.length > 0
    ? events.reduce((s, e) => s + e.totalAmount, 0) / events.length
    : 0;

  const totalRevenue = events.reduce((s, e) => s + e.totalAmount, 0);
  const totalCollected = events.reduce((s, e) => s + e.advancePaid, 0);
  const totalDue = events.reduce((s, e) => s + e.dueAmount, 0);

  const clientRevMap: Record<string, { name: string; phone: string; total: number; count: number }> = {};
  for (const e of events) {
    if (!clientRevMap[e.clientPhone]) {
      clientRevMap[e.clientPhone] = { name: e.clientName, phone: e.clientPhone, total: 0, count: 0 };
    }
    clientRevMap[e.clientPhone].total += e.totalAmount;
    clientRevMap[e.clientPhone].count += 1;
  }
  const topClients = Object.values(clientRevMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return NextResponse.json({
    year,
    totalEvents: events.length,
    totalRevenue,
    totalCollected,
    totalDue,
    avgBookingValue,
    monthlyData,
    eventTypeCounts,
    hallUtilization,
    topClients,
  });
}
