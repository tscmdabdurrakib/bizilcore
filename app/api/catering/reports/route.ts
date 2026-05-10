import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [events, allEvents] = await Promise.all([
    prisma.cateringEvent.findMany({
      where: { shopId: shop.id, eventDate: { gte: sixMonthsAgo } },
      select: {
        eventDate: true, totalAmount: true, profit: true,
        totalCost: true, eventType: true, guestCount: true,
        customerId: true, status: true,
      },
    }),
    prisma.cateringEvent.findMany({
      where: { shopId: shop.id },
      select: { customerId: true },
    }),
  ]);

  const monthMap = new Map<string, { revenue: number; profit: number; cost: number; count: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, { revenue: 0, profit: 0, cost: 0, count: 0 });
  }

  const typeMap   = new Map<string, number>();
  const guestTotal = { total: 0, count: 0 };

  for (const e of events) {
    const d = new Date(e.eventDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthMap.has(key)) {
      const m = monthMap.get(key)!;
      m.revenue += e.totalAmount;
      m.profit  += e.profit;
      m.cost    += e.totalCost;
      m.count   += 1;
    }
    typeMap.set(e.eventType, (typeMap.get(e.eventType) ?? 0) + 1);
    if (e.status === "completed") {
      guestTotal.total += e.guestCount;
      guestTotal.count += 1;
    }
  }

  const totalRevenue  = events.reduce((s, e) => s + e.totalAmount, 0);
  const totalProfit   = events.reduce((s, e) => s + e.profit, 0);
  const totalCost     = events.reduce((s, e) => s + e.totalCost, 0);
  const avgMargin     = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;
  const avgGuests     = guestTotal.count > 0 ? Math.round(guestTotal.total / guestTotal.count) : 0;

  const customerIds   = allEvents.map(e => e.customerId).filter(Boolean) as string[];
  const uniqueCustomers = new Set(customerIds).size;
  const repeatCount   = customerIds.length - uniqueCustomers;
  const repeatRate    = uniqueCustomers > 0 ? Math.round((repeatCount / uniqueCustomers) * 100) : 0;

  const BANGLA_MONTHS = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];

  const monthlyData = Array.from(monthMap.entries()).map(([key, val]) => {
    const [y, m] = key.split("-");
    return { month: `${BANGLA_MONTHS[parseInt(m) - 1]} ${y}`, ...val };
  });

  const eventTypePie = Array.from(typeMap.entries()).map(([type, count]) => ({ type, count }));

  return NextResponse.json({
    monthlyData, eventTypePie,
    totalRevenue, totalProfit, totalCost,
    avgMargin, avgGuests, repeatRate,
    totalEvents: events.length,
  });
}
