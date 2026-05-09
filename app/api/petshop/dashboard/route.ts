import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const sevenDaysLater = new Date(today); sevenDaysLater.setDate(today.getDate() + 7);

  const [totalPets, todayAppts, vaccinationDue, todayRevenue, todayApptList, vaccineDueList] = await Promise.all([
    prisma.pet.count({ where: { shopId: shop.id, isActive: true } }),
    prisma.petAppointment.count({ where: { shopId: shop.id, date: { gte: today, lt: tomorrow } } }),
    prisma.petHealthLog.count({
      where: { shopId: shop.id, nextDueDate: { lte: sevenDaysLater }, logType: { in: ["vaccination", "deworming", "flea_treatment"] } },
    }),
    prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM("paidAmount"), 0) AS total FROM "PetAppointment"
      WHERE "shopId" = ${shop.id} AND "date" >= ${today} AND "date" < ${tomorrow}
    `,
    prisma.petAppointment.findMany({
      where: { shopId: shop.id, date: { gte: today, lt: tomorrow }, status: { not: "cancelled" } },
      include: { pet: { include: { customer: { select: { name: true, phone: true } } } } },
      orderBy: { date: "asc" },
    }),
    prisma.petHealthLog.findMany({
      where: {
        shopId: shop.id,
        nextDueDate: { lte: sevenDaysLater },
        logType: { in: ["vaccination", "deworming", "flea_treatment"] },
      },
      include: { pet: { include: { customer: { select: { id: true, name: true, phone: true } } } } },
      orderBy: { nextDueDate: "asc" },
      take: 15,
    }),
  ]);

  return NextResponse.json({
    totalPets,
    todayAppts,
    vaccinationDue,
    todayRevenue: Number(todayRevenue[0]?.total ?? 0),
    todayApptList: todayApptList.map(a => ({
      id: a.id,
      type: a.type,
      date: a.date.toISOString(),
      status: a.status,
      fee: a.fee,
      paidAmount: a.paidAmount,
      petName: a.pet.name,
      petType: a.pet.type,
      ownerName: a.pet.customer.name,
      ownerPhone: a.pet.customer.phone,
    })),
    vaccineDueList: vaccineDueList.map(l => ({
      id: l.id,
      logType: l.logType,
      description: l.description,
      nextDueDate: l.nextDueDate?.toISOString() ?? null,
      petId: l.petId,
      petName: l.pet.name,
      petType: l.pet.type,
      ownerName: l.pet.customer.name,
      ownerPhone: l.pet.customer.phone,
    })),
  });
}
