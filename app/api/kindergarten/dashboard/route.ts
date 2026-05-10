import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalChildren,
    todayAttendance,
    childrenWithAllergy,
    monthFees,
    recentReports,
    todayPresent,
  ] = await Promise.all([
    prisma.student.count({ where: { shopId: shop.id, status: "active" } }),
    prisma.attendanceRecord.findMany({
      where: { shopId: shop.id, date: { gte: today, lt: tomorrow } },
      select: { studentId: true, status: true },
    }),
    prisma.student.findMany({
      where: { shopId: shop.id, status: "active", foodAllergies: { not: null } },
      select: { id: true, name: true, foodAllergies: true, section: true },
    }),
    prisma.feeRecord.aggregate({
      where: { shopId: shop.id, createdAt: { gte: monthStart }, status: "paid" },
      _sum: { paidAmount: true },
    }),
    prisma.dailyReport.findMany({
      where: { shopId: shop.id, reportDate: { gte: today, lt: tomorrow } },
      select: { id: true, studentId: true, sentToParent: true },
    }),
    prisma.attendanceRecord.count({
      where: { shopId: shop.id, date: { gte: today, lt: tomorrow }, status: "present" },
    }),
  ]);

  // Children with allergies who are present today
  const presentStudentIds = new Set(todayAttendance.filter(a => a.status === "present").map(a => a.studentId));
  const allergyAlerts = childrenWithAllergy.filter(c => presentStudentIds.has(c.id));

  const totalToday = todayAttendance.length;
  const absentToday = todayAttendance.filter(a => a.status === "absent").length;

  const reportsSent = recentReports.filter(r => r.sentToParent).length;
  const reportsTotal = recentReports.length;

  return NextResponse.json({
    totalChildren,
    todayPresent,
    absentToday,
    totalToday,
    allergyCount: childrenWithAllergy.length,
    allergyAlerts,
    monthRevenue: monthFees._sum.paidAmount ?? 0,
    reportsSent,
    reportsTotal,
  });
}
