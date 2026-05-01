import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const shop = await requireShop();
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  const [totalStudents, todayAttendance, dueFees, thisMonthFees, batches] = await Promise.all([
    prisma.student.count({ where: { shopId: shop.id, status: "active" } }),

    prisma.attendanceRecord.groupBy({
      by: ["status"],
      where: { shopId: shop.id, date: { gte: todayStart, lt: todayEnd } },
      _count: { status: true },
    }),

    prisma.feeRecord.aggregate({
      where: { shopId: shop.id, month: monthStr, status: { in: ["due", "partial"] } },
      _count: { id: true },
      _sum: { dueAmount: true },
    }),

    prisma.feeRecord.aggregate({
      where: { shopId: shop.id, month: monthStr, status: { in: ["paid", "partial"] } },
      _sum: { paidAmount: true },
    }),

    prisma.batch.findMany({
      where: { shopId: shop.id, isActive: true },
      include: {
        _count: { select: { students: true } },
      },
      take: 8,
    }),
  ]);

  const presentCount = todayAttendance.find((r) => r.status === "present")?._count.status ?? 0;
  const totalTakenToday = todayAttendance.reduce((s, r) => s + r._count.status, 0);
  const attendancePct = totalTakenToday > 0 ? Math.round((presentCount / totalTakenToday) * 100) : null;

  const batchStats = await Promise.all(
    batches.map(async (b) => {
      const presentToday = await prisma.attendanceRecord.count({
        where: { shopId: shop.id, batchId: b.id, status: "present", date: { gte: todayStart, lt: todayEnd } },
      });
      const paidFees = await prisma.feeRecord.aggregate({
        where: { shopId: shop.id, batchId: b.id, month: monthStr, status: "paid" },
        _count: { id: true },
      });
      const totalFeesInBatch = await prisma.feeRecord.count({
        where: { shopId: shop.id, batchId: b.id, month: monthStr },
      });
      return {
        id: b.id,
        name: b.name,
        studentCount: b._count.students,
        presentToday,
        feePaidCount: paidFees._count.id,
        feeTotalCount: totalFeesInBatch,
        feePct: totalFeesInBatch > 0 ? Math.round((paidFees._count.id / totalFeesInBatch) * 100) : 0,
      };
    })
  );

  return NextResponse.json({
    totalStudents,
    attendancePct,
    totalTakenToday,
    dueStudentCount: dueFees._count.id ?? 0,
    totalDueAmount: dueFees._sum.dueAmount ?? 0,
    thisMonthCollected: thisMonthFees._sum.paidAmount ?? 0,
    batchStats,
    currentMonth: monthStr,
  });
}
