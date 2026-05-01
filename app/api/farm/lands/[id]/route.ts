import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;
  const land = await prisma.land.findFirst({
    where: { id, shopId: shop.id },
    include: {
      cycles: {
        include: {
          logs: { orderBy: { activityDate: "desc" }, take: 5 },
          harvests: { include: { sellRecords: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!land) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(land);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;
  const body = await req.json();
  const land = await prisma.land.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.areaBigha !== undefined && { areaBigha: parseFloat(body.areaBigha) }),
      ...(body.areaAcre !== undefined && { areaAcre: body.areaAcre ? parseFloat(body.areaAcre) : null }),
      ...(body.location !== undefined && { location: body.location }),
      ...(body.ownership !== undefined && { ownership: body.ownership }),
      ...(body.leaseAmount !== undefined && { leaseAmount: body.leaseAmount ? parseFloat(body.leaseAmount) : null }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });
  return NextResponse.json(land);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;
  await prisma.land.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
