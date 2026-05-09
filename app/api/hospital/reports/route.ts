import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const months = Number(searchParams.get("months") ?? "6");

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const [opdByDay, doctorStats, wardStats, ipdChargesByType, monthlyOPD, monthlyIPD] = await Promise.all([
    prisma.oPDVisit.groupBy({
      by: ["visitDate"],
      where: { shopId: shop.id, visitDate: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
      _count: true,
      orderBy: { visitDate: "asc" },
    }),
    prisma.oPDVisit.groupBy({
      by: ["doctorId"],
      where: { shopId: shop.id, visitDate: { gte: startDate } },
      _count: true,
      _sum: { paidAmount: true },
    }),
    prisma.iPDAdmission.groupBy({
      by: ["ward"],
      where: { shopId: shop.id, status: "admitted" },
      _count: true,
    }),
    prisma.iPDCharge.groupBy({
      by: ["chargeType"],
      where: { shopId: shop.id, chargeDate: { gte: startDate } },
      _sum: { amount: true },
    }),
    prisma.oPDVisit.groupBy({
      by: ["visitDate"],
      where: { shopId: shop.id, visitDate: { gte: startDate } },
      _count: true,
      _sum: { paidAmount: true },
    }),
    prisma.iPDAdmission.groupBy({
      by: ["admitDate"],
      where: { shopId: shop.id, admitDate: { gte: startDate } },
      _count: true,
      _sum: { advancePaid: true },
    }),
  ]);

  const doctors = await prisma.doctor.findMany({
    where: { shopId: shop.id, isActive: true },
    select: { id: true, name: true, title: true, specialization: true },
  });
  const doctorMap: Record<string, string> = {};
  doctors.forEach((d) => { doctorMap[d.id] = `${d.title} ${d.name}`; });

  const doctorChartData = doctorStats.map((d) => ({
    name: doctorMap[d.doctorId] ?? d.doctorId,
    count: d._count,
    revenue: d._sum.paidAmount ?? 0,
  }));

  const totalBeds = await prisma.bed.count({ where: { shopId: shop.id } });
  const wardOccupancy = wardStats.map((w) => ({
    ward: w.ward,
    occupied: w._count,
    total: totalBeds,
  }));

  const revenueByType = ipdChargesByType.map((c) => ({
    type: c.chargeType,
    amount: c._sum.amount ?? 0,
  }));

  const monthlyMap: Record<string, { opd: number; ipdCount: number; opdRevenue: number; ipdRevenue: number }> = {};
  monthlyOPD.forEach((d) => {
    const key = new Date(d.visitDate).toISOString().slice(0, 7);
    if (!monthlyMap[key]) monthlyMap[key] = { opd: 0, ipdCount: 0, opdRevenue: 0, ipdRevenue: 0 };
    monthlyMap[key].opd += d._count;
    monthlyMap[key].opdRevenue += d._sum.paidAmount ?? 0;
  });
  monthlyIPD.forEach((d) => {
    const key = new Date(d.admitDate).toISOString().slice(0, 7);
    if (!monthlyMap[key]) monthlyMap[key] = { opd: 0, ipdCount: 0, opdRevenue: 0, ipdRevenue: 0 };
    monthlyMap[key].ipdCount += d._count;
    monthlyMap[key].ipdRevenue += d._sum.advancePaid ?? 0;
  });

  const monthly = Object.entries(monthlyMap).sort(([a], [b]) => a.localeCompare(b)).map(([month, data]) => ({
    month,
    ...data,
    totalRevenue: data.opdRevenue + data.ipdRevenue,
  }));

  const opdTrend = opdByDay.map((d) => ({
    date: new Date(d.visitDate).toLocaleDateString("bn-BD", { day: "numeric", month: "short" }),
    count: d._count,
  }));

  return NextResponse.json({ doctorChartData, wardOccupancy, revenueByType, monthly, opdTrend });
}
