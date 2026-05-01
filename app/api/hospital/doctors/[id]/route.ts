import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shop = await requireShop();
  const { id } = await params;
  const body = await req.json();

  const doctor = await prisma.doctor.updateMany({
    where: { id, shopId: shop.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.title !== undefined && { title: body.title }),
      ...(body.specialization !== undefined && { specialization: body.specialization }),
      ...(body.qualification !== undefined && { qualification: body.qualification }),
      ...(body.bmdc !== undefined && { bmdc: body.bmdc }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.visitFee !== undefined && { visitFee: Number(body.visitFee) }),
      ...(body.followUpFee !== undefined && { followUpFee: body.followUpFee ? Number(body.followUpFee) : null }),
      ...(body.chamberDays !== undefined && { chamberDays: body.chamberDays }),
      ...(body.chamberStartTime !== undefined && { chamberStartTime: body.chamberStartTime }),
      ...(body.chamberEndTime !== undefined && { chamberEndTime: body.chamberEndTime }),
      ...(body.maxPatients !== undefined && { maxPatients: Number(body.maxPatients) }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });

  return NextResponse.json({ updated: doctor.count });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shop = await requireShop();
  const { id } = await params;

  await prisma.doctor.updateMany({
    where: { id, shopId: shop.id },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
