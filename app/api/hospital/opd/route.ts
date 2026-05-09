import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get("doctorId") ?? "";
  const date = searchParams.get("date") ?? "";
  const status = searchParams.get("status") ?? "";

  let dateStart: Date | undefined, dateEnd: Date | undefined;
  if (date) {
    dateStart = new Date(date); dateStart.setHours(0, 0, 0, 0);
    dateEnd = new Date(date); dateEnd.setHours(23, 59, 59, 999);
  } else {
    dateStart = new Date(); dateStart.setHours(0, 0, 0, 0);
    dateEnd = new Date(); dateEnd.setHours(23, 59, 59, 999);
  }

  const visits = await prisma.oPDVisit.findMany({
    where: {
      shopId: shop.id,
      visitDate: { gte: dateStart, lte: dateEnd },
      ...(doctorId ? { doctorId } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      patient: { select: { id: true, name: true, age: true, ageUnit: true, gender: true, phone: true, regNumber: true } },
      doctor: { select: { id: true, name: true, title: true, specialization: true } },
      tests: true,
    },
    orderBy: [{ doctorId: "asc" }, { tokenNumber: "asc" }],
  });

  return NextResponse.json(visits);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  const [visitCount, todayToken] = await Promise.all([
    prisma.oPDVisit.count({ where: { shopId: shop.id } }),
    prisma.oPDVisit.count({
      where: { shopId: shop.id, doctorId: body.doctorId, visitDate: { gte: today, lt: tomorrow } },
    }),
  ]);

  const prefix = shop.hospitalOpdPrefix ?? "OPD";
  const year = new Date().getFullYear();
  const visitNumber = `${prefix}-${year}-${String(visitCount + 1).padStart(3, "0")}`;
  const tokenNumber = todayToken + 1;

  const fee = body.visitType === "follow_up"
    ? (body.followUpFee ?? body.visitFee)
    : body.visitFee;
  const paidAmount = Number(body.paidAmount ?? 0);
  const dueAmount = Number(fee) - paidAmount;

  const visit = await prisma.oPDVisit.create({
    data: {
      shopId: shop.id,
      visitNumber,
      patientId: body.patientId,
      doctorId: body.doctorId,
      tokenNumber,
      visitType: body.visitType ?? "new",
      chiefComplaint: body.chiefComplaint ?? null,
      vitalSigns: body.vitalSigns ?? null,
      visitFee: Number(fee),
      paidAmount,
      dueAmount,
      status: "waiting",
    },
    include: {
      patient: { select: { name: true, age: true, ageUnit: true } },
      doctor: { select: { name: true, title: true, specialization: true } },
    },
  });

  return NextResponse.json({ ...visit, tokenNumber }, { status: 201 });
}
