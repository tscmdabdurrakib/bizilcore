import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();
  const lands = await prisma.land.findMany({
    where: { shopId: shop.id },
    include: { cycles: { where: { status: { not: "completed" } }, select: { id: true, cropName: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(lands);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();
  const land = await prisma.land.create({
    data: {
      shopId: shop.id,
      name: body.name,
      type: body.type,
      areaBigha: parseFloat(body.areaBigha),
      areaAcre: body.areaAcre ? parseFloat(body.areaAcre) : null,
      location: body.location || null,
      soilType: body.soilType || null,
      ownership: body.ownership ?? "own",
      leaseAmount: body.leaseAmount ? parseFloat(body.leaseAmount) : null,
      leaseFreq: body.leaseFreq || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(land, { status: 201 });
}
