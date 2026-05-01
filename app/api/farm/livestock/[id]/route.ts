import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;
  const ls = await prisma.livestock.findFirst({
    where: { id, shopId: shop.id },
    include: { healthLogs: { orderBy: { logDate: "desc" } } },
  });
  if (!ls) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(ls);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;
  const body = await req.json();
  const ls = await prisma.livestock.update({
    where: { id },
    data: {
      ...(body.quantity !== undefined && { quantity: parseInt(body.quantity) }),
      ...(body.currentValue !== undefined && { currentValue: body.currentValue ? parseFloat(body.currentValue) : null }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });
  return NextResponse.json(ls);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;
  const body = await req.json();

  const log = await prisma.livestockLog.create({
    data: {
      shopId: shop.id,
      livestockId: id,
      logType: body.logType,
      description: body.description,
      quantity: body.quantity ? parseInt(body.quantity) : null,
      pricePerHead: body.pricePerHead ? parseFloat(body.pricePerHead) : null,
      totalAmount: body.totalAmount ? parseFloat(body.totalAmount) : 0,
      cost: parseFloat(body.cost ?? 0),
      vetName: body.vetName || null,
      logDate: body.logDate ? new Date(body.logDate) : new Date(),
      nextDueDate: body.nextDueDate ? new Date(body.nextDueDate) : null,
      note: body.note || null,
    },
  });

  if (["birth", "death", "sale", "purchase"].includes(body.logType) && body.quantity) {
    const delta = body.logType === "birth" || body.logType === "purchase"
      ? parseInt(body.quantity)
      : -parseInt(body.quantity);
    const current = await prisma.livestock.findUnique({ where: { id }, select: { quantity: true } });
    if (current) {
      await prisma.livestock.update({ where: { id }, data: { quantity: Math.max(0, current.quantity + delta) } });
    }
  }

  return NextResponse.json(log, { status: 201 });
}
