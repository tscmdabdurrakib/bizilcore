import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;

  const device = await prisma.device.findFirst({
    where: { id, shopId: shop.id },
    include: {
      customer: true,
      jobCards: {
        include: { parts: true, services: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!device) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(device);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const body = await req.json();

  const device = await prisma.device.findFirst({ where: { id, shopId: shop.id } });
  if (!device) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.device.update({
    where: { id },
    data: {
      ...(body.type !== undefined && { type: body.type }),
      ...(body.brand !== undefined && { brand: body.brand }),
      ...(body.model !== undefined && { model: body.model }),
      ...(body.imei !== undefined && { imei: body.imei }),
      ...(body.imei2 !== undefined && { imei2: body.imei2 }),
      ...(body.serialNumber !== undefined && { serialNumber: body.serialNumber }),
      ...(body.color !== undefined && { color: body.color }),
      ...(body.storageGB !== undefined && { storageGB: body.storageGB }),
      ...(body.condition !== undefined && { condition: body.condition }),
      ...(body.accessories !== undefined && { accessories: body.accessories }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
    },
  });

  return NextResponse.json(updated);
}
