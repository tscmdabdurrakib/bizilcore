import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const shop = await requireShop();
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") ?? "today";

  let dateStart: Date, dateEnd: Date;
  const now = new Date();

  if (filter === "today") {
    dateStart = new Date(now); dateStart.setHours(0, 0, 0, 0);
    dateEnd = new Date(now); dateEnd.setHours(23, 59, 59, 999);
  } else if (filter === "month") {
    dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
    dateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else {
    dateStart = new Date(0);
    dateEnd = new Date();
  }

  const [opdVisits, ipdAdmissions] = await Promise.all([
    prisma.oPDVisit.findMany({
      where: { shopId: shop.id, visitDate: { gte: dateStart, lte: dateEnd } },
      include: { patient: { select: { name: true, phone: true, regNumber: true } }, doctor: { select: { name: true, title: true } } },
      orderBy: { visitDate: "desc" },
    }),
    prisma.iPDAdmission.findMany({
      where: { shopId: shop.id, admitDate: { gte: dateStart, lte: dateEnd } },
      include: { patient: { select: { name: true, phone: true, regNumber: true } }, doctor: { select: { name: true, title: true } } },
      orderBy: { admitDate: "desc" },
    }),
  ]);

  const opdRevenue = opdVisits.reduce((s, v) => s + v.paidAmount, 0);
  const ipdRevenue = ipdAdmissions.reduce((s, a) => s + a.advancePaid, 0);

  const bills = [
    ...opdVisits.map((v) => ({
      id: v.id, type: "OPD", number: v.visitNumber, patientName: v.patient.name,
      patientPhone: v.patient.phone, doctorName: `${v.doctor.title} ${v.doctor.name}`,
      totalAmount: v.visitFee, paidAmount: v.paidAmount, dueAmount: v.dueAmount,
      date: v.visitDate,
    })),
    ...ipdAdmissions.map((a) => ({
      id: a.id, type: "IPD", number: a.admissionNumber, patientName: a.patient.name,
      patientPhone: a.patient.phone, doctorName: `${a.doctor.title} ${a.doctor.name}`,
      totalAmount: a.totalBill, paidAmount: a.advancePaid, dueAmount: a.dueAmount,
      date: a.admitDate,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({ bills, opdRevenue, ipdRevenue, totalRevenue: opdRevenue + ipdRevenue });
}
