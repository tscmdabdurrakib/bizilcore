import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shop = await requireShop();
  const { id } = await params;
  const body = await req.json();

  await prisma.bed.updateMany({
    where: { id, shopId: shop.id },
    data: {
      ...(body.number !== undefined && { number: body.number }),
      ...(body.ward !== undefined && { ward: body.ward }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.dailyRate !== undefined && { dailyRate: Number(body.dailyRate) }),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shop = await requireShop();
  const { id } = await params;

  await prisma.bed.deleteMany({ where: { id, shopId: shop.id } });
  return NextResponse.json({ ok: true });
}
