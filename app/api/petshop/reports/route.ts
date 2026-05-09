import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); sixMonthsAgo.setDate(1); sixMonthsAgo.setHours(0, 0, 0, 0);

  const [totalPets, petTypeBreakdown, serviceBreakdown, monthRevenue, monthlyRows] = await Promise.all([
    prisma.pet.count({ where: { shopId: shop.id } }),
    prisma.pet.groupBy({ by: ["type"], where: { shopId: shop.id }, _count: true }),
    prisma.petAppointment.groupBy({ by: ["type"], where: { shopId: shop.id, status: "done" }, _count: true, _sum: { fee: true } }),
    prisma.petAppointment.aggregate({ where: { shopId: shop.id, date: { gte: monthStart } }, _sum: { paidAmount: true } }),
    prisma.$queryRaw<{ month: string; revenue: number; appointments: bigint }[]>`
      SELECT TO_CHAR("date", 'Mon YY') AS month, COALESCE(SUM("paidAmount"), 0) AS revenue, COUNT(*) AS appointments
      FROM "PetAppointment"
      WHERE "shopId" = ${shop.id} AND "date" >= ${sixMonthsAgo}
      GROUP BY TO_CHAR("date", 'Mon YY'), DATE_TRUNC('month', "date")
      ORDER BY DATE_TRUNC('month', "date")
    `,
  ]);

  return NextResponse.json({
    totalPets,
    monthRevenue: monthRevenue._sum.paidAmount ?? 0,
    petTypeBreakdown: petTypeBreakdown.map(r => ({ type: r.type, count: r._count })),
    serviceBreakdown: serviceBreakdown.map(r => ({ type: r.type, count: r._count, revenue: r._sum.fee ?? 0 })),
    monthlyChart: monthlyRows.map(r => ({ month: r.month, revenue: Number(r.revenue), appointments: Number(r.appointments) })),
  });
}
