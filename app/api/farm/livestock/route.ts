import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();
  const livestock = await prisma.livestock.findMany({
    where: { shopId: shop.id, isActive: true },
    include: {
      healthLogs: {
        where: { logType: "vaccination", nextDueDate: { not: null } },
        orderBy: { nextDueDate: "asc" },
        take: 1,
        select: { nextDueDate: true, description: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(livestock);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();
  const ls = await prisma.livestock.create({
    data: {
      shopId: shop.id,
      type: body.type,
      breed: body.breed || null,
      quantity: parseInt(body.quantity),
      male: body.male ? parseInt(body.male) : null,
      female: body.female ? parseInt(body.female) : null,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
      purchaseCost: parseFloat(body.purchaseCost ?? 0),
      currentValue: body.currentValue ? parseFloat(body.currentValue) : null,
      location: body.location || null,
      purpose: body.purpose || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(ls, { status: 201 });
}
