import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shop = await requireShop();
  const { id } = await params;

  const charges = await prisma.iPDCharge.findMany({
    where: { admissionId: id, shopId: shop.id },
    orderBy: { chargeDate: "desc" },
  });

  return NextResponse.json(charges);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shop = await requireShop();
  const { id } = await params;
  const body = await req.json();

  const charge = await prisma.iPDCharge.create({
    data: {
      shopId: shop.id,
      admissionId: id,
      chargeType: body.chargeType,
      description: body.description,
      amount: Number(body.amount),
      chargeDate: body.chargeDate ? new Date(body.chargeDate) : new Date(),
    },
  });

  const total = await prisma.iPDCharge.aggregate({
    where: { admissionId: id },
    _sum: { amount: true },
  });
  const totalBill = total._sum.amount ?? 0;

  const admission = await prisma.iPDAdmission.findUnique({ where: { id }, select: { advancePaid: true } });
  const dueAmount = Math.max(0, totalBill - (admission?.advancePaid ?? 0));

  await prisma.iPDAdmission.update({
    where: { id },
    data: { totalBill, dueAmount },
  });

  return NextResponse.json(charge, { status: 201 });
}
