import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  const [todayOPD, admittedIPD, waitingOPD, todayRevenue, doctors, beds, todayAdmissions, todayDischarges] = await Promise.all([
    prisma.oPDVisit.count({ where: { shopId: shop.id, visitDate: { gte: today, lt: tomorrow } } }),
    prisma.iPDAdmission.count({ where: { shopId: shop.id, status: "admitted" } }),
    prisma.oPDVisit.count({ where: { shopId: shop.id, status: "waiting" } }),
    prisma.oPDVisit.aggregate({
      where: { shopId: shop.id, visitDate: { gte: today, lt: tomorrow } },
      _sum: { paidAmount: true },
    }),
    prisma.doctor.findMany({
      where: { shopId: shop.id, isActive: true },
      select: {
        id: true, name: true, title: true, specialization: true,
        opdVisits: {
          where: { visitDate: { gte: today, lt: tomorrow } },
          select: { status: true },
        },
      },
    }),
    prisma.bed.findMany({ where: { shopId: shop.id }, select: { ward: true, status: true } }),
    prisma.iPDAdmission.findMany({
      where: { shopId: shop.id, admitDate: { gte: today, lt: tomorrow } },
      select: { admissionNumber: true, patient: { select: { name: true } }, ward: true, bedNumber: true },
    }),
    prisma.iPDAdmission.findMany({
      where: { shopId: shop.id, dischargeDate: { gte: today, lt: tomorrow } },
      select: { admissionNumber: true, patient: { select: { name: true } }, ward: true },
    }),
  ]);

  const ipdRevenue = await prisma.iPDCharge.aggregate({
    where: { shopId: shop.id, chargeDate: { gte: today, lt: tomorrow } },
    _sum: { amount: true },
  });

  const totalRevenue = (todayRevenue._sum.paidAmount ?? 0) + (ipdRevenue._sum.amount ?? 0);

  const doctorStats = doctors.map((d) => ({
    id: d.id,
    name: `${d.title} ${d.name}`,
    specialization: d.specialization,
    waiting: d.opdVisits.filter((v) => v.status === "waiting").length,
    withDoctor: d.opdVisits.filter((v) => v.status === "with_doctor").length,
    done: d.opdVisits.filter((v) => v.status === "done").length,
  }));

  const wardMap: Record<string, { total: number; occupied: number }> = {};
  beds.forEach((b) => {
    if (!wardMap[b.ward]) wardMap[b.ward] = { total: 0, occupied: 0 };
    wardMap[b.ward].total++;
    if (b.status === "occupied") wardMap[b.ward].occupied++;
  });
  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b) => b.status === "occupied").length;

  return NextResponse.json({
    todayOPD,
    admittedIPD,
    waitingOPD,
    totalRevenue,
    doctorStats,
    wardMap,
    totalBeds,
    occupiedBeds,
    todayAdmissions,
    todayDischarges,
  });
}
