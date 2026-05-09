import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("search") ?? "";

  const admissions = await prisma.iPDAdmission.findMany({
    where: {
      shopId: shop.id,
      ...(status ? { status } : {}),
      ...(search ? {
        OR: [
          { admissionNumber: { contains: search, mode: "insensitive" } },
          { patient: { name: { contains: search, mode: "insensitive" } } },
          { patient: { phone: { contains: search } } },
        ],
      } : {}),
    },
    include: {
      patient: { select: { id: true, name: true, age: true, ageUnit: true, gender: true, phone: true, regNumber: true } },
      doctor: { select: { id: true, name: true, title: true, specialization: true } },
    },
    orderBy: { admitDate: "desc" },
  });

  return NextResponse.json(admissions);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();

  const count = await prisma.iPDAdmission.count({ where: { shopId: shop.id } });
  const prefix = shop.hospitalAdmissionPrefix ?? "IPD";
  const year = new Date().getFullYear();
  const admissionNumber = `${prefix}-${year}-${String(count + 1).padStart(3, "0")}`;

  const advancePaid = Number(body.advancePaid ?? 0);

  const admission = await prisma.iPDAdmission.create({
    data: {
      shopId: shop.id,
      admissionNumber,
      patientId: body.patientId,
      doctorId: body.doctorId,
      bedNumber: body.bedNumber,
      ward: body.ward,
      admitDiagnosis: body.admitDiagnosis ?? null,
      advancePaid,
      dueAmount: 0,
      status: "admitted",
    },
    include: {
      patient: { select: { name: true } },
      doctor: { select: { name: true, title: true } },
    },
  });

  await prisma.bed.updateMany({
    where: { shopId: shop.id, number: body.bedNumber, ward: body.ward },
    data: { status: "occupied" },
  });

  return NextResponse.json(admission, { status: 201 });
}
