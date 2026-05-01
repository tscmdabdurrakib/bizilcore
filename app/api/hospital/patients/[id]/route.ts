import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shop = await requireShop();
  const { id } = await params;

  const patient = await prisma.hospitalPatient.findFirst({
    where: { id, shopId: shop.id },
    include: {
      visits: {
        include: { doctor: { select: { name: true, title: true, specialization: true } }, tests: true },
        orderBy: { visitDate: "desc" },
      },
      admissions: {
        include: { doctor: { select: { name: true, title: true } }, charges: true },
        orderBy: { admitDate: "desc" },
      },
    },
  });

  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(patient);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shop = await requireShop();
  const { id } = await params;
  const body = await req.json();

  await prisma.hospitalPatient.updateMany({
    where: { id, shopId: shop.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.nameBangla !== undefined && { nameBangla: body.nameBangla }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.age !== undefined && { age: body.age ? Number(body.age) : null }),
      ...(body.ageUnit !== undefined && { ageUnit: body.ageUnit }),
      ...(body.gender !== undefined && { gender: body.gender }),
      ...(body.bloodGroup !== undefined && { bloodGroup: body.bloodGroup }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.allergies !== undefined && { allergies: body.allergies }),
      ...(body.chronicIllness !== undefined && { chronicIllness: body.chronicIllness }),
      ...(body.emergencyContact !== undefined && { emergencyContact: body.emergencyContact }),
      ...(body.emergencyPhone !== undefined && { emergencyPhone: body.emergencyPhone }),
    },
  });

  return NextResponse.json({ ok: true });
}
