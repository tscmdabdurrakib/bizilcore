import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const hall = await prisma.hall.findFirst({ where: { id, shopId: shop.id } });
  if (!hall) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(hall);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();

  const hall = await prisma.hall.updateMany({
    where: { id, shopId: shop.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.capacity !== undefined && { capacity: Number(body.capacity) }),
      ...(body.ratePerDay !== undefined && { ratePerDay: Number(body.ratePerDay) }),
      ...(body.ratePerHour !== undefined && { ratePerHour: body.ratePerHour ? Number(body.ratePerHour) : null }),
      ...(body.rateHalfDay !== undefined && { rateHalfDay: body.rateHalfDay ? Number(body.rateHalfDay) : null }),
      ...(body.amenities !== undefined && { amenities: body.amenities }),
      ...(body.floorArea !== undefined && { floorArea: body.floorArea }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });

  return NextResponse.json({ updated: hall.count });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  await prisma.hall.deleteMany({ where: { id, shopId: shop.id } });
  return NextResponse.json({ ok: true });
}
