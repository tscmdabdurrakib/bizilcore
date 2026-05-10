import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const last30 = new Date(today);
  last30.setDate(today.getDate() - 29);

  const [
    totalChildren,
    activeChildren,
    sectionBreakdown,
    allergyChildren,
    monthFee,
    monthFeeDue,
    attendanceLast30,
    mealStats,
    dailyReportStats,
  ] = await Promise.all([
    prisma.student.count({ where: { shopId: shop.id } }),
    prisma.student.count({ where: { shopId: shop.id, status: "active" } }),
    prisma.student.groupBy({
      by: ["section"],
      where: { shopId: shop.id, status: "active" },
      _count: true,
    }),
    prisma.student.count({ where: { shopId: shop.id, foodAllergies: { not: null } } }),
    prisma.feeRecord.aggregate({
      where: { shopId: shop.id, createdAt: { gte: monthStart }, status: "paid" },
      _sum: { paidAmount: true }, _count: true,
    }),
    prisma.feeRecord.aggregate({
      where: { shopId: shop.id, createdAt: { gte: monthStart }, status: { not: "paid" } },
      _sum: { dueAmount: true }, _count: true,
    }),
    prisma.attendanceRecord.findMany({
      where: { shopId: shop.id, date: { gte: last30 } },
      select: { date: true, status: true },
    }),
    prisma.mealRecord.groupBy({
      by: ["status"],
      where: { shopId: shop.id, date: { gte: monthStart } },
      _count: true,
    }),
    prisma.dailyReport.aggregate({
      where: { shopId: shop.id, reportDate: { gte: monthStart } },
      _count: true,
    }),
  ]);

  // Build 30-day attendance trend
  const attMap = new Map<string, { present: number; absent: number; total: number }>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(last30);
    d.setDate(last30.getDate() + i);
    attMap.set(d.toISOString().split("T")[0], { present: 0, absent: 0, total: 0 });
  }
  for (const rec of attendanceLast30) {
    const key = rec.date.toISOString().split("T")[0];
    const entry = attMap.get(key);
    if (entry) {
      entry.total++;
      if (rec.status === "present") entry.present++;
      else if (rec.status === "absent") entry.absent++;
    }
  }
  const attendanceTrend = Array.from(attMap.entries()).map(([date, v]) => ({ date, ...v }));

  const mealBreakdown = {
    ate_all: mealStats.find(m => m.status === "ate_all")?._count ?? 0,
    ate_half: mealStats.find(m => m.status === "ate_half")?._count ?? 0,
    didnt_eat: mealStats.find(m => m.status === "didnt_eat")?._count ?? 0,
    brought_from_home: mealStats.find(m => m.status === "brought_from_home")?._count ?? 0,
  };

  return NextResponse.json({
    totalChildren,
    activeChildren,
    allergyChildren,
    sectionBreakdown: sectionBreakdown.map(s => ({ section: s.section ?? "অন্যান্য", count: s._count })),
    monthFeeCollected: monthFee._sum.paidAmount ?? 0,
    monthFeeCount: monthFee._count,
    monthFeeDue: monthFeeDue._sum.dueAmount ?? 0,
    monthFeeDueCount: monthFeeDue._count,
    attendanceTrend,
    mealBreakdown,
    dailyReportsCount: dailyReportStats._count,
  });
}
