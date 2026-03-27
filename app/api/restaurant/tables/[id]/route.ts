import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getShop(userId: string) {
  return prisma.shop.findUnique({ where: { userId }, select: { id: true } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const table = await prisma.diningTable.findFirst({ where: { id, shopId: shop.id } });
  if (!table) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { number?: number; capacity?: number; floor?: string; status?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const updated = await prisma.diningTable.update({
    where: { id },
    data: {
      ...(body.number !== undefined && { number: body.number }),
      ...(body.capacity !== undefined && { capacity: body.capacity }),
      ...(body.floor !== undefined && { floor: body.floor }),
      ...(body.status !== undefined && { status: body.status }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const table = await prisma.diningTable.findFirst({ where: { id, shopId: shop.id } });
  if (!table) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.diningTable.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
