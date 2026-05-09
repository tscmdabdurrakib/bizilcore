import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());

  // Monthly fee collection
  const months = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, "0");
    return `${year}-${m}`;
  });

  const monthlyFees = await Promise.all(
    months.map(async (month) => {
      const agg = await prisma.feeRecord.aggregate({
        where: { shopId: shop.id, month },
        _sum: { netAmount: true, paidAmount: true, dueAmount: true },
        _count: { id: true },
      });
      return {
        month,
        total: agg._sum.netAmount ?? 0,
        collected: agg._sum.paidAmount ?? 0,
        due: agg._sum.dueAmount ?? 0,
        count: agg._count.id,
      };
    })
  );

  // Total students by status
  const studentsByStatus = await prisma.student.groupBy({
    by: ["status"],
    where: { shopId: shop.id },
    _count: { status: true },
  });

  // Batch sizes
  const batches = await prisma.batch.findMany({
    where: { shopId: shop.id, isActive: true },
    include: { _count: { select: { students: true } } },
  });

  // Attendance summary for this month
  const nowMonth = new Date();
  const monthStart = new Date(nowMonth.getFullYear(), nowMonth.getMonth(), 1);
  const monthEnd = new Date(nowMonth.getFullYear(), nowMonth.getMonth() + 1, 0);
  const attendance = await prisma.attendanceRecord.groupBy({
    by: ["status"],
    where: { shopId: shop.id, date: { gte: monthStart, lte: monthEnd } },
    _count: { status: true },
  });

  const totalRevenue = monthlyFees.reduce((s, m) => s + m.total, 0);
  const totalCollected = monthlyFees.reduce((s, m) => s + m.collected, 0);
  const totalDue = monthlyFees.reduce((s, m) => s + m.due, 0);

  return NextResponse.json({
    year,
    monthlyFees,
    totalRevenue,
    totalCollected,
    totalDue,
    studentsByStatus,
    batches: batches.map((b) => ({ id: b.id, name: b.name, count: b._count.students })),
    attendance,
  });
}
