import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shop = await requireShop();
  const { id } = await params;

  const admission = await prisma.iPDAdmission.findFirst({
    where: { id, shopId: shop.id },
    include: {
      patient: true,
      doctor: true,
      charges: { orderBy: { chargeDate: "desc" } },
      notes: { orderBy: { writtenAt: "desc" } },
    },
  });

  if (!admission) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(admission);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shop = await requireShop();
  const { id } = await params;
  const body = await req.json();

  await prisma.iPDAdmission.updateMany({
    where: { id, shopId: shop.id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.finalDiagnosis !== undefined && { finalDiagnosis: body.finalDiagnosis }),
      ...(body.admitDiagnosis !== undefined && { admitDiagnosis: body.admitDiagnosis }),
      ...(body.surgeryDone !== undefined && { surgeryDone: body.surgeryDone }),
      ...(body.surgeryNote !== undefined && { surgeryNote: body.surgeryNote }),
      ...(body.totalBill !== undefined && { totalBill: Number(body.totalBill) }),
      ...(body.advancePaid !== undefined && { advancePaid: Number(body.advancePaid) }),
      ...(body.dueAmount !== undefined && { dueAmount: Number(body.dueAmount) }),
    },
  });

  return NextResponse.json({ ok: true });
}
