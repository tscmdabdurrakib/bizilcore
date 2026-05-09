import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "No shop" }, { status: 404 });

  const equipment = await prisma.equipment.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(equipment);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "No shop" }, { status: 404 });

  const body = await req.json();
  const eq = await prisma.equipment.create({
    data: {
      shopId: shop.id,
      name: body.name,
      category: body.category,
      quantity: Number(body.quantity ?? 1),
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
      purchaseCost: body.purchaseCost ? Number(body.purchaseCost) : undefined,
      condition: body.condition ?? "good",
      lastService: body.lastService ? new Date(body.lastService) : undefined,
      nextService: body.nextService ? new Date(body.nextService) : undefined,
      notes: body.notes,
    },
  });
  return NextResponse.json(eq);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "No shop" }, { status: 404 });

  const body = await req.json();
  const { id, ...data } = body;
  const eq = await prisma.equipment.update({
    where: { id, shopId: shop.id },
    data: {
      name: data.name,
      category: data.category,
      quantity: data.quantity ? Number(data.quantity) : undefined,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      purchaseCost: data.purchaseCost ? Number(data.purchaseCost) : undefined,
      condition: data.condition,
      lastService: data.lastService ? new Date(data.lastService) : undefined,
      nextService: data.nextService ? new Date(data.nextService) : undefined,
      notes: data.notes,
    },
  });
  return NextResponse.json(eq);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "No shop" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.equipment.delete({ where: { id, shopId: shop.id } });
  return NextResponse.json({ ok: true });
}
