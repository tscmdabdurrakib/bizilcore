import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shop = await requireShop();
  const { id } = await params;
  const body = await req.json();

  const admission = await prisma.iPDAdmission.findFirst({
    where: { id, shopId: shop.id },
    select: { bedNumber: true, ward: true, totalBill: true },
  });

  if (!admission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const finalPaid = Number(body.finalPaid ?? 0);
  const updatedAdmission = await prisma.iPDAdmission.update({
    where: { id },
    data: {
      status: "discharged",
      dischargeDate: new Date(),
      finalDiagnosis: body.finalDiagnosis ?? null,
      surgeryDone: body.surgeryDone ?? false,
      surgeryNote: body.surgeryNote ?? null,
      advancePaid: { increment: finalPaid },
      dueAmount: Math.max(0, admission.totalBill - finalPaid),
    },
  });

  await prisma.bed.updateMany({
    where: { shopId: shop.id, number: admission.bedNumber, ward: admission.ward },
    data: { status: "vacant" },
  });

  return NextResponse.json(updatedAdmission);
}
