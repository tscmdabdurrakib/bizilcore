import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { shop } = await requireShop();

    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [appts, rooms, staff] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          shopId: shop.id,
          status: "completed",
          createdAt: { gte: sixMonthsAgo },
        },
        include: {
          items: { include: { service: { select: { name: true, category: true } } } },
          room: { select: { name: true } },
          staff: { select: { user: { select: { name: true } } } },
        },
      }),
      prisma.treatmentRoom.findMany({
        where: { shopId: shop.id, isActive: true },
        include: {
          appointments: {
            where: { status: "completed", createdAt: { gte: sixMonthsAgo } },
            select: { id: true, totalAmount: true, createdAt: true },
          },
        },
      }),
      prisma.staffMember.findMany({
        where: { shopId: shop.id, isActive: true },
        include: {
          user: { select: { name: true } },
          appointments: {
            where: { status: "completed", createdAt: { gte: sixMonthsAgo } },
            select: { id: true, totalAmount: true },
          },
        },
      }),
    ]);

    const monthlyMap = new Map<string, { revenue: number; count: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap.set(key, { revenue: 0, count: 0 });
    }
    for (const appt of appts) {
      const key = appt.createdAt.toISOString().slice(0, 7);
      const entry = monthlyMap.get(key);
      if (entry) { entry.revenue += appt.totalAmount; entry.count++; }
    }
    const monthlyChart = Array.from(monthlyMap.entries()).map(([month, v]) => ({
      month,
      revenue: v.revenue,
      count: v.count,
    }));

    const serviceCount = new Map<string, number>();
    const serviceRevenue = new Map<string, number>();
    for (const appt of appts) {
      for (const item of appt.items) {
        const name = item.service?.name ?? item.serviceName;
        serviceCount.set(name, (serviceCount.get(name) ?? 0) + 1);
        serviceRevenue.set(name, (serviceRevenue.get(name) ?? 0) + item.price);
      }
    }
    const topServices = Array.from(serviceCount.entries())
      .map(([name, count]) => ({ name, count, revenue: serviceRevenue.get(name) ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const peakHours = new Map<string, number>();
    for (const appt of appts) {
      const hr = appt.startTime?.slice(0, 5) ?? "??";
      peakHours.set(hr, (peakHours.get(hr) ?? 0) + 1);
    }
    const peakHoursChart = Array.from(peakHours.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    const roomUtilization = rooms.map((r) => ({
      name: r.name,
      sessions: r.appointments.length,
      revenue: r.appointments.reduce((s, a) => s + a.totalAmount, 0),
    }));

    const therapistPerformance = staff.map((s) => ({
      name: s.user.name,
      sessions: s.appointments.length,
      revenue: s.appointments.reduce((sum, a) => sum + a.totalAmount, 0),
    })).sort((a, b) => b.sessions - a.sessions);

    return NextResponse.json({
      monthlyChart,
      topServices,
      peakHoursChart,
      roomUtilization,
      therapistPerformance,
      totalCompleted: appts.length,
      totalRevenue: appts.reduce((s, a) => s + a.totalAmount, 0),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
