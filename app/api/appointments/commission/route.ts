import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();

  if (shop.businessType !== "salon") {
    return NextResponse.json({ error: "এই API শুধুমাত্র সেলুন শপের জন্য।" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      shopId: shop.id,
      status: "completed",
      date: { gte: start, lt: end },
    },
    include: {
      items: {
        include: { service: { select: { id: true, name: true } } },
      },
      staff: {
        select: { id: true, user: { select: { name: true } } },
      },
    },
    orderBy: { date: "asc" },
  });

  const staffMap: Map<string, {
    staffId: string;
    staffName: string;
    services: { apptId: string; date: Date; serviceName: string; revenue: number; commission: number; paid: boolean }[];
    totalRevenue: number;
    totalCommission: number;
    paidCommission: number;
  }> = new Map();

  for (const appt of appointments) {
    if (!appt.staffId || !appt.staff) continue;
    const entry = staffMap.get(appt.staffId) ?? {
      staffId: appt.staffId,
      staffName: appt.staff.user.name,
      services: [],
      totalRevenue: 0,
      totalCommission: 0,
      paidCommission: 0,
    };
    for (const item of appt.items) {
      entry.services.push({
        apptId: appt.id,
        date: appt.date,
        serviceName: item.serviceName,
        revenue: item.price,
        commission: item.staffCommission,
        paid: item.commissionPaid,
      });
      entry.totalRevenue += item.price;
      entry.totalCommission += item.staffCommission;
      if (item.commissionPaid) entry.paidCommission += item.staffCommission;
    }
    staffMap.set(appt.staffId, entry);
  }

  return NextResponse.json({
    month,
    year,
    staff: Array.from(staffMap.values()),
  });
}

export async function PATCH(req: NextRequest) {
  const { shop } = await requireShop();

  if (shop.businessType !== "salon") {
    return NextResponse.json({ error: "এই API শুধুমাত্র সেলুন শপের জন্য।" }, { status: 403 });
  }

  const body = await req.json();
  const { staffId, month, year } = body;

  if (!staffId) return NextResponse.json({ error: "স্টাফ আইডি আবশ্যিক।" }, { status: 400 });

  const m = parseInt(month ?? new Date().getMonth() + 1);
  const y = parseInt(year ?? new Date().getFullYear());
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      shopId: shop.id,
      staffId,
      status: "completed",
      date: { gte: start, lt: end },
    },
    select: { id: true },
  });

  for (const appt of appointments) {
    await prisma.appointmentItem.updateMany({
      where: { appointmentId: appt.id },
      data: { commissionPaid: true },
    });
    await prisma.appointment.update({
      where: { id: appt.id },
      data: { commissionPaid: true },
    });
  }

  return NextResponse.json({ ok: true, updated: appointments.length });
}
