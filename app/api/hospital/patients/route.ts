import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const shop = await requireShop();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";

  const patients = await prisma.hospitalPatient.findMany({
    where: {
      shopId: shop.id,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { nameBangla: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
          { regNumber: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    include: {
      _count: { select: { visits: true, admissions: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(patients);
}

export async function POST(req: NextRequest) {
  const shop = await requireShop();
  const body = await req.json();

  const count = await prisma.hospitalPatient.count({ where: { shopId: shop.id } });
  const prefix = shop.hospitalPatientPrefix ?? "PAT";
  const year = new Date().getFullYear();
  const regNumber = `${prefix}-${year}-${String(count + 1).padStart(3, "0")}`;

  const patient = await prisma.hospitalPatient.create({
    data: {
      shopId: shop.id,
      regNumber,
      name: body.name,
      nameBangla: body.nameBangla ?? null,
      phone: body.phone ?? null,
      age: body.age ? Number(body.age) : null,
      ageUnit: body.ageUnit ?? "years",
      gender: body.gender ?? null,
      bloodGroup: body.bloodGroup ?? null,
      address: body.address ?? null,
      nid: body.nid ?? null,
      allergies: body.allergies ?? null,
      chronicIllness: body.chronicIllness ?? null,
      emergencyContact: body.emergencyContact ?? null,
      emergencyPhone: body.emergencyPhone ?? null,
    },
  });

  return NextResponse.json(patient, { status: 201 });
}
